import type { ResidualBuilder, ResidualBatch } from "@/solver/types";
import { floorWalls, pointById } from "@/model/queries";

/** Pin first point to its sketched position and first wall horizontal: removes translation and rotation. */
export const gaugeResiduals: ResidualBuilder = (plan, floorId, vars, cfg) => {
  const batch: ResidualBatch = { entries: [], fns: [] };
  const s = cfg.sigma.gaugeMm;
  const first = vars.pointIds[0];
  if (!first) return batch;
  const p0 = pointById(plan, first);
  batch.entries.push({
    measurementId: null,
    kind: "gauge",
    sigma: s,
    unit: "mm",
    pointIds: [first],
  });
  batch.fns.push((x: number[]) => (x[vars.index(first, "x")] - p0.x) / s);
  batch.entries.push({
    measurementId: null,
    kind: "gauge",
    sigma: s,
    unit: "mm",
    pointIds: [first],
  });
  batch.fns.push((x: number[]) => (x[vars.index(first, "y")] - p0.y) / s);
  const w = floorWalls(plan, floorId)[0];
  if (w) {
    batch.entries.push({
      measurementId: null,
      kind: "gauge",
      sigma: s,
      unit: "mm",
      pointIds: [w.a, w.b],
    });
    batch.fns.push((x: number[]) => (x[vars.index(w.b, "y")] - x[vars.index(w.a, "y")]) / s);
  }
  return batch;
};
