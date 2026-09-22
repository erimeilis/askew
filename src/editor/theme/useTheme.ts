import { useEffect } from "react";
import { useThemeStore } from "./themeStore";
import { useSystemTheme } from "./useSystemTheme";
import type { AppliedTheme, ThemeChoice } from "./themeResolution";

export interface UseThemeResult {
  choice: ThemeChoice;
  applied: AppliedTheme;
  cycle(): void;
}

/** Wires the theme store to a mounted component: loads the persisted choice once and keeps the
 * system preference live, mirroring how `useCoach` wires `coachStore`. */
export function useTheme(): UseThemeResult {
  const choice = useThemeStore((s) => s.choice);
  const applied = useThemeStore((s) => s.applied);
  const loadChoice = useThemeStore((s) => s.loadChoice);
  const cycle = useThemeStore((s) => s.cycle);
  useSystemTheme();

  useEffect(() => {
    void loadChoice();
  }, [loadChoice]);

  return { choice: choice ?? "system", applied, cycle };
}
