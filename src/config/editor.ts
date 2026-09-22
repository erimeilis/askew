export const EDITOR_CONFIG = {
  gridMm: 100,
  /** Every tenth grid division is a quiet major line, keeping scale legible at a glance. */
  gridMajorEvery: 10,
  /** Below this on-screen spacing, grid lines are skipped rather than drawn as clutter. */
  gridMinPx: 6,
  snapPx: 8,
  hitPx: 8,
  zoom: { min: 0.01, max: 2, wheelFactor: 1.1, initialPxPerMm: 0.1 },
  defaultWallThicknessMm: 0,
  defaultRoomName: "",
  pointRadiusPx: 4,
  strokePx: 1.5,
  gridStrokePx: 1,
  gridMajorStrokePx: 1.25,
  selectedStrokePx: 2,
  rootElementId: "root",
} as const;
