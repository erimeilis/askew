export const EXPORT_CONFIG = {
  layers: {
    walls: "walls",
    openings: "openings",
    fixtures: "fixtures",
    dimensions: "dimensions",
    labels: "labels",
  },
  colours: {
    walls: "#222",
    openings: "#0a6",
    fixtures: "#a50",
    dimensions: "#06c",
    labels: "#000",
    flagged: "#d22",
    selected: "#f80",
    background: "#fff",
  },
  printScales: [50, 100] as const,
  dimensionOffsetMm: 300,
  dimensionTextMm: 120,
  labelTextMm: 200,
  dxf: {
    version: "AC1015",
    insunits: 4,
    textHeightMm: 120,
    // ACI colour index per layer, consumed by the DXF writer in Task 15
    layerColors: { walls: 7, openings: 3, fixtures: 30, dimensions: 5, labels: 7 },
  },
  areaDecimals: 2,
} as const;
