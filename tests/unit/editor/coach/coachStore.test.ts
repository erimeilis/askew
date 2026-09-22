import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { useCoachStore } from "@/editor/coach/coachStore";
import { kv } from "@/persistence/browser/kv";
import { STORAGE_CONFIG } from "@/config/storage";

describe("coachStore (dismissed flag, persisted via kv/IndexedDB, never localStorage)", () => {
  beforeEach(async () => {
    await kv.del(STORAGE_CONFIG.coachSkippedKey);
    useCoachStore.setState({ dismissed: null });
  });

  it("starts unknown until loaded, then reads false when nothing was ever skipped", async () => {
    expect(useCoachStore.getState().dismissed).toBeNull();
    await useCoachStore.getState().loadDismissed();
    expect(useCoachStore.getState().dismissed).toBe(false);
  });

  it("skip() marks dismissed immediately and persists it to kv (IndexedDB)", async () => {
    useCoachStore.getState().skip();
    expect(useCoachStore.getState().dismissed).toBe(true);
    await new Promise((r) => setTimeout(r, 0));
    expect(await kv.get<boolean>(STORAGE_CONFIG.coachSkippedKey)).toBe(true);
  });

  it("reopen() clears dismissed and persists the clear, so Help sticks across reload", async () => {
    useCoachStore.getState().skip();
    await new Promise((r) => setTimeout(r, 0));
    useCoachStore.getState().reopen();
    expect(useCoachStore.getState().dismissed).toBe(false);
    await new Promise((r) => setTimeout(r, 0));
    expect(await kv.get<boolean>(STORAGE_CONFIG.coachSkippedKey)).toBe(false);
  });

  it("loadDismissed reflects a previously persisted skip", async () => {
    await kv.set(STORAGE_CONFIG.coachSkippedKey, true);
    await useCoachStore.getState().loadDismissed();
    expect(useCoachStore.getState().dismissed).toBe(true);
  });
});
