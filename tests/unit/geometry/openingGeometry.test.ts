import { describe, it, expect } from "vitest";
import { openingGeometry } from "@/geometry/openingGeometry";
import { emptyPlan } from "@/model/factory";

function base() {
  const p = emptyPlan("t");
  const f = p.floors[0].id;
  p.points.push({ id: "a", floorId: f, x: 0, y: 0 }, { id: "b", floorId: f, x: 4000, y: 0 });
  p.walls.push({ id: "w", floorId: f, a: "a", b: "b", thickness: 200, side: "right" });
  return p;
}

describe("openingGeometry", () => {
  it("gap spans offset..offset+width through the thickness", () => {
    const p = base();
    p.openings.push({ id: "o", wallId: "w", kind: "window", offset: 1000, width: 900 });
    const g = openingGeometry(p, p.openings[0]);
    expect(g.gap).toEqual([
      { x: 1000, y: 0 },
      { x: 1900, y: 0 },
      { x: 1900, y: -200 },
      { x: 1000, y: -200 },
    ]);
    expect(g.symbol.lines).toHaveLength(2);
    expect(g.symbol.arc).toBeUndefined();
  });

  it("window lines cross the gap at 1/3 and 2/3 of the thickness", () => {
    const p = base();
    p.openings.push({ id: "o", wallId: "w", kind: "window", offset: 1000, width: 900 });
    const g = openingGeometry(p, p.openings[0]);
    const [l0, l1] = g.symbol.lines;
    expect(l0[0].x).toBe(1000);
    expect(l0[1].x).toBe(1900);
    expect(l0[0].y).toBeCloseTo(-200 / 3);
    expect(l0[1].y).toBeCloseTo(-200 / 3);
    expect(l1[0].y).toBeCloseTo((-200 * 2) / 3);
    expect(l1[1].y).toBeCloseTo((-200 * 2) / 3);
  });

  it("door has a swing arc, hinged at the offset end, radius = width", () => {
    const p = base();
    p.openings.push({ id: "o", wallId: "w", kind: "door", offset: 500, width: 800 });
    const g = openingGeometry(p, p.openings[0]);
    expect(g.symbol.arc).toMatchObject({ c: { x: 500, y: 0 }, r: 800 });
    expect(g.symbol.lines).toHaveLength(1);
    // leaf swings 90 degrees from the hinge, into the room (opposite the thickness side)
    expect(g.symbol.lines[0][0]).toEqual({ x: 500, y: 0 });
    expect(g.symbol.lines[0][1]).toEqual({ x: 500, y: 800 });
  });
});
