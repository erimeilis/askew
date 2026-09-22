export const STORAGE_CONFIG = {
  db: { name: "askew", store: "kv" },
  autosaveKey: "autosave",
  localeKey: "locale",
  fileHandleKey: "fileHandle",
  /** Whether the getting-started coach was dismissed (Skip/Finish) on this browser. */
  coachSkippedKey: "coachSkipped",
  /** The manual theme choice ("system" | "light" | "dark"), remembered across reloads. */
  themeKey: "theme",
  fileExtension: ".plan.json",
  autosaveDebounceMs: 300,
  plansDir: "plans",
  /** Decimal places kept for point coordinates when a plan is serialised to JSON. */
  coordinateDecimals: 1,
} as const;
