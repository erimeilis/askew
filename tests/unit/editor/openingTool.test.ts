import { describe, it, expect } from "vitest";
import { addOpening } from "@/editor/tools/openingTool";
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

describe("addOpening", () => {
  it("adds within the wall's length", () => {
    const p = base();
    addOpening(p, "w", "door", 100, 800);
    expect(p.openings).toHaveLength(1);
    expect(p.openings[0]).toMatchObject({ wallId: "w", kind: "door", offset: 100, width: 800 });
  });

  it("rejects an opening whose offset+width exceeds the wall's length", () => {
    const p = base();
    expect(() => addOpening(p, "w", "door", 3500, 800)).toThrow(/exceeds/);
    expect(p.openings).toHaveLength(0);
  });

  it("never adds a solver variable or moves a point: the fit is unchanged", () => {
    const p = base();
    const floorId = p.floors[0].id;
    const before = solveFloor(p, floorId, SOLVER_CONFIG);
    addOpening(p, "w", "window", 500, 800);
    const after = solveFloor(p, floorId, SOLVER_CONFIG);
    expect(after.points).toEqual(before.points);
  });
});
