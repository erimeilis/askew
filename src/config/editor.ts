export const EDITOR_CONFIG = {
  gridMm: 100,
  snapPx: 8,
  hitPx: 8,
  zoom: { min: 0.01, max: 2, wheelFactor: 1.1, initialPxPerMm: 0.1 },
  defaultWallThicknessMm: 0,
  defaultRoomName: "",
  pointRadiusPx: 4,
  strokePx: 1.5,
  rootElementId: "root",
} as const;
