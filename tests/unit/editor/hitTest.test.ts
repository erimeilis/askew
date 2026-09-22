import { describe, it, expect } from "vitest";
import { hitTest } from "@/editor/view/hitTest";
import { emptyPlan } from "@/model/factory";

const p = emptyPlan("t");
const f = p.floors[0].id;
p.points.push(
  { id: "p1", floorId: f, x: 0, y: 0 },
  { id: "p2", floorId: f, x: 4000, y: 0 },
  { id: "p3", floorId: f, x: 4000, y: 3000 },
  { id: "p4", floorId: f, x: 0, y: 3000 },
);
p.walls.push(
  { id: "w1", floorId: f, a: "p1", b: "p2", thickness: 200, side: "right" },
  { id: "w2", floorId: f, a: "p2", b: "p3", thickness: 200, side: "right" },
);
p.rooms.push({ id: "r1", floorId: f, name: "", pointIds: ["p1", "p2", "p3", "p4"] });
p.openings.push({ id: "o1", wallId: "w1", kind: "window", offset: 1000, width: 900 });
p.fixtures.push({
  id: "x1",
  floorId: f,
  name: "stove",
  anchor: { wallId: "w2", offset: 500, depth: 50 },
  w: 600,
  d: 600,
});

describe("hitTest", () => {
  it("point beats wall", () => {
    expect(hitTest(p, f, { x: 30, y: 20 }, 50)).toEqual({ type: "point", id: "p1" });
  });

  it("wall with parameter t", () => {
    const h = hitTest(p, f, { x: 2000, y: 30 }, 50);
    expect(h).toMatchObject({ type: "wall", id: "w1" });
    expect((h as { t: number }).t).toBeCloseTo(0.5);
  });

  it("room interior", () => {
    expect(hitTest(p, f, { x: 2000, y: 1500 }, 50)).toEqual({ type: "room", id: "r1" });
  });

  it("nothing", () => {
    expect(hitTest(p, f, { x: -5000, y: -5000 }, 50)).toBeNull();
  });

  it("opening beats wall, even where the wall would also be within tolerance", () => {
    expect(hitTest(p, f, { x: 1500, y: -100 }, 250)).toEqual({ type: "opening", id: "o1" });
  });

  it("fixture beats wall for a point inside its rectangle", () => {
    expect(hitTest(p, f, { x: 3700, y: 800 }, 50)).toEqual({ type: "fixture", id: "x1" });
  });
});
