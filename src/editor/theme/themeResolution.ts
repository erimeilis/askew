/** The persisted choice: "system" defers to the OS/browser, the other two are explicit. */
export type ThemeChoice = "system" | "light" | "dark";

/** What actually renders once "system" has been resolved against a live preference. */
export type AppliedTheme = "light" | "dark";

const CYCLE_ORDER: readonly ThemeChoice[] = ["system", "light", "dark"];

/**
 * Resolves a persisted choice plus the OS/browser's live dark-mode preference to the theme
 * that should actually render. Pure and framework-free: no DOM, no storage, no React — so it
 * is unit-tested directly and reused by both the pre-mount flash guard (`applyStoredTheme`)
 * and the theme store's `applied` status.
 */
export function resolveTheme(choice: ThemeChoice, systemPrefersDark: boolean): AppliedTheme {
  if (choice === "light") return "light";
  if (choice === "dark") return "dark";
  return systemPrefersDark ? "dark" : "light";
}

/** The toggle's whole state machine: system -> light -> dark -> system. */
export function nextThemeChoice(choice: ThemeChoice): ThemeChoice {
  const i = CYCLE_ORDER.indexOf(choice);
  return CYCLE_ORDER[(i + 1) % CYCLE_ORDER.length];
}

/** The `data-theme` value to set on <html>, or null to clear it and let the
 * `@media (prefers-color-scheme)` block in styles.css decide (the "system" choice). */
export function themeAttribute(choice: ThemeChoice): AppliedTheme | null {
  return choice === "system" ? null : choice;
}

/** Narrows an unknown persisted/read value (e.g. straight out of `kv.get`) to a `ThemeChoice`. */
export function isThemeChoice(value: unknown): value is ThemeChoice {
  return value === "system" || value === "light" || value === "dark";
}
