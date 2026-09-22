// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  savePlanFile,
  openPlanFile,
  downloadText,
  resetFileHandle,
} from "@/persistence/browser/files";
import { emptyPlan } from "@/model/factory";
import { planToJson } from "@/persistence/serialize";
import { STORAGE_CONFIG } from "@/config/storage";
import { kv } from "@/persistence/browser/kv";

/** Lets a single tag's freshly-created element be observed/patched, while every other tag is
 * created normally — real jsdom elements throughout, so click()/dispatchEvent() still work. */
function interceptCreateElement(handlers: Partial<Record<string, (el: HTMLElement) => void>>) {
  const original = document.createElement.bind(document);
  return vi
    .spyOn(document, "createElement")
    .mockImplementation((tag: string, options?: ElementCreationOptions) => {
      const el = original(tag as never, options);
      handlers[tag]?.(el);
      return el;
    });
}

const abortPicker = () => Promise.reject(new DOMException("cancelled", "AbortError"));

function stubObjectUrl() {
  const createObjectURL = vi.fn(() => "blob:mock-url");
  const revokeObjectURL = vi.fn();
  URL.createObjectURL = createObjectURL as unknown as typeof URL.createObjectURL;
  URL.revokeObjectURL = revokeObjectURL as unknown as typeof URL.revokeObjectURL;
  return { createObjectURL, revokeObjectURL };
}

function fakeHandle(): { handle: FileSystemFileHandle; write: ReturnType<typeof vi.fn> } {
  const write = vi.fn(async (_data: string) => {});
  const stream = { write, close: vi.fn(async () => {}) };
  const handle = {
    kind: "file",
    name: "house.plan.json",
    getFile: vi.fn(),
    createWritable: vi.fn(async () => stream),
  } as unknown as FileSystemFileHandle;
  return { handle, write };
}

describe("files (browser persistence, fallback path)", () => {
  beforeEach(async () => {
    await resetFileHandle();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker;
    delete (window as unknown as { showOpenFilePicker?: unknown }).showOpenFilePicker;
  });

  it("downloadText clicks an anchor with the configured filename", () => {
    stubObjectUrl();
    const click = vi.fn();
    let anchor: HTMLAnchorElement | undefined;
    interceptCreateElement({
      a: (el) => {
        anchor = el as HTMLAnchorElement;
        anchor.click = click;
      },
    });

    downloadText("house.plan.json", "{}", "application/json");

    expect(click).toHaveBeenCalledTimes(1);
    expect(anchor?.download).toBe("house.plan.json");
  });

  it("saves via the download fallback when the File System Access API is unavailable", async () => {
    stubObjectUrl();
    const click = vi.fn();
    let anchor: HTMLAnchorElement | undefined;
    interceptCreateElement({
      a: (el) => {
        anchor = el as HTMLAnchorElement;
        anchor.click = click;
      },
    });
    const plan = emptyPlan("house");

    const handle = await savePlanFile(plan);

    expect(click).toHaveBeenCalledTimes(1);
    expect(anchor?.download).toBe(`house${STORAGE_CONFIG.fileExtension}`);
    expect(handle).toBeNull();
  });

  it("opens through the <input type=file> fallback and parses the selected file", async () => {
    const plan = emptyPlan("opened");
    const file = new File([planToJson(plan)], "opened.plan.json", { type: "application/json" });
    interceptCreateElement({
      input: (el) => {
        const input = el as HTMLInputElement;
        queueMicrotask(() => {
          Object.defineProperty(input, "files", { value: [file], configurable: true });
          input.dispatchEvent(new Event("change"));
        });
      },
    });

    const result = await openPlanFile();

    expect(result?.plan.name).toBe("opened");
    expect(result?.handle).toBeNull();
  });

  it("resolves to null instead of throwing when the fallback file picker is cancelled", async () => {
    interceptCreateElement({
      input: (el) => {
        queueMicrotask(() => el.dispatchEvent(new Event("cancel")));
      },
    });

    await expect(openPlanFile()).resolves.toBeNull();
  });

  // Real FileSystemFileHandle instances are structured-cloneable (that's what lets kv persist
  // them), but fake-indexeddb only clones genuine host-object values, not a plain test double
  // with vi.fn() members — so these two tests spy on kv.set rather than round-tripping through
  // the (fake) database, and the actual clone-ability is exercised for real by a human in a
  // browser per the task's manual verification step.
  it("prefers the native picker when present, writes to it and remembers the handle", async () => {
    const { handle, write } = fakeHandle();
    const picker = vi.fn(async () => handle);
    (window as unknown as { showSaveFilePicker: unknown }).showSaveFilePicker = picker;
    const setSpy = vi.spyOn(kv, "set").mockResolvedValue(undefined);
    const plan = emptyPlan("house");

    const returned = await savePlanFile(plan);

    expect(picker).toHaveBeenCalledWith(
      expect.objectContaining({ suggestedName: `house${STORAGE_CONFIG.fileExtension}` }),
    );
    expect(returned).toBe(handle);
    expect(write).toHaveBeenCalledWith(planToJson(plan));
    expect(setSpy).toHaveBeenCalledWith(STORAGE_CONFIG.fileHandleKey, handle);
  });

  it("reuses an already-known handle without opening the save picker again", async () => {
    const { handle, write } = fakeHandle();
    const picker = vi.fn();
    (window as unknown as { showSaveFilePicker: unknown }).showSaveFilePicker = picker;
    vi.spyOn(kv, "set").mockResolvedValue(undefined);
    const plan = emptyPlan("house");

    await savePlanFile(plan, handle);

    expect(picker).not.toHaveBeenCalled();
    expect(write).toHaveBeenCalledWith(planToJson(plan));
  });

  it("resolves to null instead of throwing when the native save picker is cancelled", async () => {
    (window as unknown as { showSaveFilePicker: unknown }).showSaveFilePicker = abortPicker;
    const plan = emptyPlan("house");

    await expect(savePlanFile(plan)).resolves.toBeNull();
  });

  it("resolves to null instead of throwing when the native open picker is cancelled", async () => {
    (window as unknown as { showOpenFilePicker: unknown }).showOpenFilePicker = abortPicker;

    await expect(openPlanFile()).resolves.toBeNull();
  });
});
