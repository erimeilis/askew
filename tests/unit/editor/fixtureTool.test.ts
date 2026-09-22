import { describe, it, expect } from "vitest";
import { addFixture } from "@/editor/tools/fixtureTool";
import { emptyPlan } from "@/model/factory";
import { solveFloor } from "@/solver/solveFloor";
import { SOLVER_CONFIG } from "@/config/solver";

function base() {
  const p = emptyPlan("t");
  const f = p.floors[0].id;
  p.points.push({ id: "a", floorId: f, x: 0, y: 0 }, { id: "b", floorId: f, x: 4000, y: 0 });
  p.walls.push({ id: "w", floorId: f, a: "a", b: "b", thickness: 200, side: "right" });
  return p;
}

describe("addFixture", () => {
  it("adds a fixture anchored to the wall, on the wall's own floor", () => {
    const p = base();
    addFixture(p, "w", "Stove", 1000, 50, 600, 600);
    expect(p.fixtures).toHaveLength(1);
    expect(p.fixtures[0]).toMatchObject({
      floorId: p.floors[0].id,
      name: "Stove",
      anchor: { wallId: "w", offset: 1000, depth: 50 },
      w: 600,
      d: 600,
    });
  });

  it("never adds a solver variable or moves a point: the fit is unchanged", () => {
    const p = base();
    const floorId = p.floors[0].id;
    const before = solveFloor(p, floorId, SOLVER_CONFIG);
    addFixture(p, "w", "Stove", 1000, 50, 600, 600);
    const after = solveFloor(p, floorId, SOLVER_CONFIG);
    expect(after.points).toEqual(before.points);
  });
});
