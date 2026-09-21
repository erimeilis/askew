import "fake-indexeddb/auto";
import { describe, it, expect, vi } from "vitest";
import { scheduleAutosave, loadAutosave, clearAutosave } from "@/persistence/browser/autosave";
import { emptyPlan } from "@/model/factory";

describe("autosave (IndexedDB)", () => {
  it("debounces, stores and restores", async () => {
    vi.useFakeTimers();
    const p = emptyPlan("idb");
    scheduleAutosave(p);
    scheduleAutosave(p);
    await vi.runAllTimersAsync();
    vi.useRealTimers();
    expect((await loadAutosave())?.name).toBe("idb");
    await clearAutosave();
    expect(await loadAutosave()).toBeNull();
  });
});
