import { create } from "zustand";
import { kv } from "@/persistence/browser/kv";
import { STORAGE_CONFIG } from "@/config/storage";

interface CoachStoreState {
  /**
   * Whether the reactive coach was dismissed (Skip or Finish) on this browser. `null` until
   * the persisted value has been read once (`loadDismissed`), so the panel never flashes
   * open-then-closed on first paint. Remembered via `kv` (IndexedDB) — never localStorage,
   * per this project's storage convention.
   */
  dismissed: boolean | null;
  loadDismissed(): Promise<void>;
  skip(): void;
  /** The Help button's deliberate reopen: clears the persisted skip too, so the coach stays
   *  back — not just for this tab — until it is skipped again. */
  reopen(): void;
}

export const useCoachStore = create<CoachStoreState>((set) => ({
  dismissed: null,
  loadDismissed: async () => {
    const saved = await kv.get<boolean>(STORAGE_CONFIG.coachSkippedKey);
    set({ dismissed: saved === true });
  },
  skip: () => {
    set({ dismissed: true });
    void kv.set(STORAGE_CONFIG.coachSkippedKey, true);
  },
  reopen: () => {
    set({ dismissed: false });
    void kv.set(STORAGE_CONFIG.coachSkippedKey, false);
  },
}));
