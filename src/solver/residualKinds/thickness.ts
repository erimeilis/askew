import type { ResidualBuilder, ResidualBatch } from "@/solver/types";
import { wallById } from "@/model/queries";
import { signedDistanceToLine } from "@/geometry/line";

/** Two residuals per measurement: each endpoint of wall B lies `value` mm from line A, on A's thickness side. */
export const thicknessResiduals: ResidualBuilder = (plan, floorId, vars, cfg) => {
  const batch: ResidualBatch = { entries: [], fns: [] };
  for (const m of plan.measurements) {
    if (m.kind !== "thickness") continue;
    const A = wallById(plan, m.wallA);
    const B = wallById(plan, m.wallB);
    if (A.floorId !== floorId || B.floorId !== floorId) continue;
    const sign = A.side === "left" ? 1 : -1;
    for (const pid of [B.a, B.b]) {
      batch.entries.push({
        measurementId: m.id,
        kind: "thickness",
        sigma: cfg.sigma.thicknessMm,
        unit: "mm",
        pointIds: [A.a, A.b, pid],
      });
      batch.fns.push(
        (x: number[]) =>
          (sign * signedDistanceToLine(vars.get(x, pid), vars.get(x, A.a), vars.get(x, A.b)) -
            m.value) /
          cfg.sigma.thicknessMm,
      );
    }
  }
  return batch;
};
