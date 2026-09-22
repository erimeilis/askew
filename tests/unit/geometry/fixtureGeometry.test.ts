import { it, expect } from "vitest";
import { fixtureRect } from "@/geometry/fixtureGeometry";
import { emptyPlan } from "@/model/factory";

it("rectangle sits on the room side at depth", () => {
  const p = emptyPlan("t");
  const f = p.floors[0].id;
  p.points.push({ id: "a", floorId: f, x: 0, y: 0 }, { id: "b", floorId: f, x: 4000, y: 0 });
  p.walls.push({ id: "w", floorId: f, a: "a", b: "b", thickness: 200, side: "right" });
  p.fixtures.push({
    id: "x",
    floorId: f,
    name: "stove",
    anchor: { wallId: "w", offset: 1000, depth: 50 },
    w: 600,
    d: 600,
  });
  expect(fixtureRect(p, p.fixtures[0])).toEqual([
    { x: 1000, y: 50 },
    { x: 1600, y: 50 },
    { x: 1600, y: 650 },
    { x: 1000, y: 650 },
  ]);
});
