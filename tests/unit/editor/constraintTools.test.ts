import { describe, it, expect } from "vitest";
import { addThickness } from "@/editor/tools/thicknessTool";
import { addAngle } from "@/editor/tools/angleTool";
import { addAlign } from "@/editor/tools/alignTool";
import { emptyPlan } from "@/model/factory";

function base() {
  const p = emptyPlan("t");
  const f = p.floors[0].id;
  p.points.push(
    { id: "a", floorId: f, x: 0, y: 0 },
    { id: "b", floorId: f, x: 1, y: 0 },
    { id: "c", floorId: f, x: 1, y: 1 },
    { id: "d", floorId: f, x: 0, y: -1 },
    { id: "e", floorId: f, x: 1, y: -1 },
  );
  p.walls.push(
    { id: "w1", floorId: f, a: "a", b: "b", thickness: 0, side: "right" },
    { id: "w2", floorId: f, a: "e", b: "d", thickness: 0, side: "right" },
  );
  return p;
}

describe("constraint tools", () => {
  it("thickness adds measurement and extrudes both walls", () => {
    const p = base();
    addThickness(p, "w1", "w2", 200);
    expect(p.measurements[0]).toMatchObject({
      kind: "thickness",
      wallA: "w1",
      wallB: "w2",
      value: 200,
    });
    expect(p.walls[0].thickness).toBe(200);
    expect(p.walls[1].thickness).toBe(200);
    expect(() => addThickness(p, "w1", "w1", 1)).toThrow();
  });

  it("angle needs three distinct points", () => {
    const p = base();
    addAngle(p, "a", "b", "c", 90);
    expect(p.measurements[0]).toMatchObject({ kind: "angle", value: 90 });
    expect(() => addAngle(p, "a", "a", "c", 90)).toThrow();
  });

  it("align", () => {
    const p = base();
    addAlign(p, "a", "d", "x");
    expect(p.measurements[0]).toMatchObject({ kind: "align", axis: "x" });
  });
});
