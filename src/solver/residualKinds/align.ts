import type { ResidualBuilder, ResidualBatch } from "@/solver/types";

export const alignResiduals: ResidualBuilder = (plan, _floorId, vars, cfg) => {
  const onFloor = new Set(vars.pointIds);
  const batch: ResidualBatch = { entries: [], fns: [] };
  for (const m of plan.measurements) {
    if (m.kind !== "align" || !onFloor.has(m.a)) continue;
    batch.entries.push({
      measurementId: m.id,
      kind: "align",
      sigma: cfg.sigma.alignMm,
      unit: "mm",
      pointIds: [m.a, m.b],
    });
    batch.fns.push(
      (x: number[]) =>
        (x[vars.index(m.a, m.axis)] - x[vars.index(m.b, m.axis)]) / cfg.sigma.alignMm,
    );
  }
  return batch;
};
