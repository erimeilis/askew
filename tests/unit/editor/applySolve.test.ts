import { describe, it, expect } from "vitest";
import { applySolve } from "@/editor/store/applySolve";
import { SOLVER_CONFIG } from "@/config/solver";
import { roomPlan, measure } from "@tests/unit/solver/fixtures";

describe("applySolve", () => {
  it("writes solved coordinates into the plan without mutating input", () => {
    const rect = [
      { x: 0, y: 0 },
      { x: 4000, y: 0 },
      { x: 4000, y: 3000 },
      { x: 0, y: 3000 },
    ];
    const { plan, floorId, truth } = roomPlan(rect, 100);
    [
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 1],
    ].forEach(([a, b], i) => measure(plan, truth, a, b, `m${i}`));
    const before = JSON.stringify(plan);
    const { plan: solved, result } = applySolve(plan, floorId, SOLVER_CONFIG);
    expect(JSON.stringify(plan)).toBe(before);
    expect(result.converged).toBe(true);
    const p2 = solved.points.find((p) => p.id === "p2")!;
    const p1 = solved.points.find((p) => p.id === "p1")!;
    expect(Math.hypot(p2.x - p1.x, p2.y - p1.y)).toBeCloseTo(4000, 0);
  });
});
