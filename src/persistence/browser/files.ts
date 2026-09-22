import type { Plan } from "@/model/types";
import { planToJson, jsonToPlan } from "@/persistence/serialize";
import { STORAGE_CONFIG } from "@/config/storage";
import { kv } from "./kv";

const PLAN_FILE_TYPE: FilePickerAcceptType = {
  description: "Plan",
  accept: { "application/json": [STORAGE_CONFIG.fileExtension] },
};

/** The file this session last saved to or opened, so a plain Save re-writes it with no picker. */
let currentHandle: FileSystemFileHandle | null = null;

const isAbort = (e: unknown): boolean => e instanceof DOMException && e.name === "AbortError";
const hasSavePicker = (): boolean => typeof window.showSaveFilePicker === "function";
const hasOpenPicker = (): boolean => typeof window.showOpenFilePicker === "function";

async function writeHandle(handle: FileSystemFileHandle, text: string): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(text);
  await writable.close();
}

/** Shared "save this text as a browser download" helper; also used by the SVG/DXF exporters. */
export function downloadText(name: string, text: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/** Forgets the remembered file handle (both in-memory and persisted), for New. */
export async function resetFileHandle(): Promise<void> {
  currentHandle = null;
  await kv.del(STORAGE_CONFIG.fileHandleKey);
}

/** Restores the last-used file handle from IndexedDB, so Save can skip the picker after a reload. */
export async function restoreFileHandle(): Promise<void> {
  try {
    currentHandle = (await kv.get<FileSystemFileHandle>(STORAGE_CONFIG.fileHandleKey)) ?? null;
  } catch (e) {
    console.error("could not restore the last file handle", e);
    currentHandle = null;
  }
}

/**
 * Saves the plan. Prefers the File System Access API: writes straight to `handle` (default: the
 * remembered handle) when one is usable, falling back to `showSaveFilePicker` otherwise; without
 * the API at all, triggers a browser download. A cancelled picker resolves to `null` rather than
 * rejecting, since the user declining to save is not a failure.
 */
export async function savePlanFile(
  plan: Plan,
  handle: FileSystemFileHandle | null = currentHandle,
): Promise<FileSystemFileHandle | null> {
  const text = planToJson(plan);
  const suggestedName = `${plan.name}${STORAGE_CONFIG.fileExtension}`;
  if (!hasSavePicker()) {
    downloadText(suggestedName, text, "application/json");
    return null;
  }
  try {
    let target = handle;
    if (target) {
      try {
        await writeHandle(target, text);
      } catch (e) {
        console.error("stale file handle, asking for a new one", e);
        target = null;
      }
    }
    if (!target) {
      target = await window.showSaveFilePicker!({ suggestedName, types: [PLAN_FILE_TYPE] });
      await writeHandle(target, text);
    }
    currentHandle = target;
    await kv.set(STORAGE_CONFIG.fileHandleKey, target);
    return target;
  } catch (e) {
    if (isAbort(e)) return null;
    throw e;
  }
}

/** `<input type=file>` fallback for browsers without `showOpenFilePicker`. */
function pickFileFallback(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = STORAGE_CONFIG.fileExtension;
    input.addEventListener("change", () => resolve(input.files?.[0] ?? null), { once: true });
    input.addEventListener("cancel", () => resolve(null), { once: true });
    input.click();
  });
}

/**
 * Opens a plan file. Prefers `showOpenFilePicker`, falling back to a hidden file input.
 * Resolves to `null` (never rejects) when the user cancels either picker.
 */
export async function openPlanFile(): Promise<{
  plan: Plan;
  handle: FileSystemFileHandle | null;
} | null> {
  if (hasOpenPicker()) {
    try {
      const [handle] = await window.showOpenFilePicker!({ types: [PLAN_FILE_TYPE] });
      const text = await (await handle.getFile()).text();
      currentHandle = handle;
      await kv.set(STORAGE_CONFIG.fileHandleKey, handle);
      return { plan: jsonToPlan(text), handle };
    } catch (e) {
      if (isAbort(e)) return null;
      throw e;
    }
  }
  const file = await pickFileFallback();
  if (!file) return null;
  const text = await file.text();
  currentHandle = null;
  return { plan: jsonToPlan(text), handle: null };
}
