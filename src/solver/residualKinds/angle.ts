import type { ResidualBuilder, ResidualBatch } from "@/solver/types";
import { signedAngleDeg, wrapDeg } from "@/geometry/angle";

export const angleResiduals: ResidualBuilder = (plan, _floorId, vars, cfg) => {
  const onFloor = new Set(vars.pointIds);
  const batch: ResidualBatch = { entries: [], fns: [] };
  for (const m of plan.measurements) {
    if (m.kind !== "angle" || !onFloor.has(m.b)) continue;
    batch.entries.push({
      measurementId: m.id,
      kind: "angle",
      sigma: cfg.sigma.angleDeg,
      unit: "deg",
      pointIds: [m.a, m.b, m.c],
    });
    batch.fns.push(
      (x: number[]) =>
        wrapDeg(
          Math.abs(signedAngleDeg(vars.get(x, m.a), vars.get(x, m.b), vars.get(x, m.c))) - m.value,
        ) / cfg.sigma.angleDeg,
    );
  }
  return batch;
};
