export const STORAGE_CONFIG = {
  db: { name: "askew", store: "kv" },
  autosaveKey: "autosave",
  localeKey: "locale",
  fileHandleKey: "fileHandle",
  fileExtension: ".plan.json",
  autosaveDebounceMs: 300,
  plansDir: "plans",
  /** Decimal places kept for point coordinates when a plan is serialised to JSON. */
  coordinateDecimals: 1,
} as const;
