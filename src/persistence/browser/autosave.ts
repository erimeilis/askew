import type { Plan } from "@/model/types";
import { planToJson, jsonToPlan } from "@/persistence/serialize";
import { STORAGE_CONFIG } from "@/config/storage";
import { kv } from "./kv";

let timer: ReturnType<typeof setTimeout> | undefined;

export function scheduleAutosave(plan: Plan, onError: (e: unknown) => void = console.error): void {
  clearTimeout(timer);
  timer = setTimeout(() => {
    kv.set(STORAGE_CONFIG.autosaveKey, planToJson(plan)).catch(onError);
  }, STORAGE_CONFIG.autosaveDebounceMs);
}

export async function loadAutosave(): Promise<Plan | null> {
  const raw = await kv.get(STORAGE_CONFIG.autosaveKey);
  if (!raw) return null;
  try {
    return jsonToPlan(raw);
  } catch (e) {
    console.error("autosave corrupt", e);
    return null;
  }
}

export const clearAutosave = (): Promise<void> => kv.del(STORAGE_CONFIG.autosaveKey);
