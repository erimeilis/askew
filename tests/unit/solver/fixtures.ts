import { emptyPlan } from "@/model/factory";
import type { Plan, Id } from "@/model/types";
import type { Vec } from "@/geometry/vec";
import { dist } from "@/geometry/vec";

export function roomPlan(
  truth: Vec[],
  perturbMm: number,
  seed = 1,
): { plan: Plan; floorId: Id; truth: Vec[] } {
  const plan = emptyPlan("t");
  const f = plan.floors[0].id;
  let s = seed;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647 - 0.5;
  };
  truth.forEach((v, i) =>
    plan.points.push({
      id: `p${i + 1}`,
      floorId: f,
      x: v.x + rnd() * 2 * perturbMm,
      y: v.y + rnd() * 2 * perturbMm,
    }),
  );
  truth.forEach((_, i) =>
    plan.walls.push({
      id: `w${i + 1}`,
      floorId: f,
      a: `p${i + 1}`,
      b: `p${((i + 1) % truth.length) + 1}`,
      thickness: 0,
      side: "right",
    }),
  );
  plan.rooms.push({ id: "r1", floorId: f, name: "A", pointIds: truth.map((_, i) => `p${i + 1}`) });
  return { plan, floorId: f, truth };
}

export function measure(
  plan: Plan,
  truth: Vec[],
  a: number,
  b: number,
  id: string,
  errMm = 0,
): void {
  plan.measurements.push({
    id,
    kind: "length",
    a: `p${a}`,
    b: `p${b}`,
    value: dist(truth[a - 1], truth[b - 1]) + errMm,
  });
}
