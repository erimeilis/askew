import type { ResidualBuilder, ResidualBatch } from "@/solver/types";
import { dist } from "@/geometry/vec";

export const lengthResiduals: ResidualBuilder = (plan, _floorId, vars, cfg) => {
  const onFloor = new Set(vars.pointIds);
  const batch: ResidualBatch = { entries: [], fns: [] };
  for (const m of plan.measurements) {
    if (m.kind !== "length" || !onFloor.has(m.a)) continue;
    batch.entries.push({
      measurementId: m.id,
      kind: "length",
      sigma: cfg.sigma.lengthMm,
      unit: "mm",
      pointIds: [m.a, m.b],
    });
    batch.fns.push(
      (x: number[]) => (dist(vars.get(x, m.a), vars.get(x, m.b)) - m.value) / cfg.sigma.lengthMm,
    );
  }
  return batch;
};
