import type { ResidualBuilder, ResidualBatch } from "@/solver/types";
import { floorRooms } from "@/model/queries";
import { signedAngleDeg, wrapDeg } from "@/geometry/angle";
import type { Id } from "@/model/types";

/**
 * Identifies a corner by its vertex plus its unordered neighbour pair.
 *
 * JSON rather than separator-joined concatenation: ids are validated only as
 * non-empty strings, so a plan loaded from a file may legally contain any
 * character, and a joined key would let two different corners collide.
 */
const cornerKey = (a: Id, b: Id, c: Id): string => JSON.stringify([b, a < c ? [a, c] : [c, a]]);

/** Weak prior: every room corner without a typed angle pulls toward the nearest multiple of cfg.priorStepDeg. */
export const priorResiduals: ResidualBuilder = (plan, floorId, vars, cfg) => {
  const typed = new Set<string>(
    plan.measurements.filter((m) => m.kind === "angle").map((m) => cornerKey(m.a, m.b, m.c)),
  );
  const batch: ResidualBatch = { entries: [], fns: [] };
  const step = cfg.priorStepDeg;
  for (const r of floorRooms(plan, floorId)) {
    const n = r.pointIds.length;
    for (let i = 0; i < n; i++) {
      const a = r.pointIds[(i + n - 1) % n];
      const b = r.pointIds[i];
      const c = r.pointIds[(i + 1) % n];
      if (typed.has(cornerKey(a, b, c))) continue;
      batch.entries.push({
        measurementId: null,
        kind: "prior",
        sigma: cfg.sigma.priorDeg,
        unit: "deg",
        pointIds: [a, b, c],
      });
      batch.fns.push((x: number[]) => {
        const ang = signedAngleDeg(vars.get(x, a), vars.get(x, b), vars.get(x, c));
        return wrapDeg(ang - Math.round(ang / step) * step) / cfg.sigma.priorDeg;
      });
    }
  }
  return batch;
};
