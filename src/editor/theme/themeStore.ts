import { create } from "zustand";
import { kv } from "@/persistence/browser/kv";
import { STORAGE_CONFIG } from "@/config/storage";
import { applyThemeAttribute } from "./applyThemeAttribute";
import {
  isThemeChoice,
  nextThemeChoice,
  resolveTheme,
  type AppliedTheme,
  type ThemeChoice,
} from "./themeResolution";

function systemPrefersDarkNow(): boolean {
  return typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches;
}

interface ThemeStoreState {
  /** Null until `loadChoice` resolves the persisted value, mirroring `coachStore.dismissed`. */
  choice: ThemeChoice | null;
  systemPrefersDark: boolean;
  applied: AppliedTheme;
  loadChoice(): Promise<void>;
  setSystemPrefersDark(prefersDark: boolean): void;
  cycle(): void;
}

/**
 * The manual toggle's state, remembered via `kv` (IndexedDB) — never localStorage, same
 * convention as `coachStore`. `applied` is `resolveTheme` run against the live store state, so
 * consumers never have to re-derive it.
 */
export const useThemeStore = create<ThemeStoreState>((set, get) => ({
  choice: null,
  systemPrefersDark: systemPrefersDarkNow(),
  applied: resolveTheme("system", systemPrefersDarkNow()),
  loadChoice: async () => {
    const saved = await kv.get<ThemeChoice>(STORAGE_CONFIG.themeKey);
    const choice = isThemeChoice(saved) ? saved : "system";
    applyThemeAttribute(choice);
    set({ choice, applied: resolveTheme(choice, get().systemPrefersDark) });
  },
  setSystemPrefersDark: (systemPrefersDark) =>
    set((s) => ({
      systemPrefersDark,
      applied: resolveTheme(s.choice ?? "system", systemPrefersDark),
    })),
  cycle: () => {
    const choice = nextThemeChoice(get().choice ?? "system");
    applyThemeAttribute(choice);
    set({ choice, applied: resolveTheme(choice, get().systemPrefersDark) });
    void kv.set(STORAGE_CONFIG.themeKey, choice);
  },
}));
