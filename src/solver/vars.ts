import type { Plan, Id } from "@/model/types";
import { floorPoints } from "@/model/queries";
import type { VarMap } from "./types";

export function makeVarMap(plan: Plan, floorId: Id): { vars: VarMap; x0: number[] } {
  const pts = floorPoints(plan, floorId);
  const idx = new Map<Id, number>();
  pts.forEach((p, i) => idx.set(p.id, 2 * i));
  const vars: VarMap = {
    count: 2 * pts.length,
    pointIds: pts.map((p) => p.id),
    index(id, axis) {
      const i = idx.get(id);
      if (i === undefined) throw new Error(`point ${id} not on floor`);
      return axis === "x" ? i : i + 1;
    },
    get(x, id) {
      const i = this.index(id, "x");
      return { x: x[i], y: x[i + 1] };
    },
  };
  return { vars, x0: pts.flatMap((p) => [p.x, p.y]) };
}
