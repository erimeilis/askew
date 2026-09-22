import { describe, it, expect } from "vitest";
import { planToJson, jsonToPlan } from "@/persistence/serialize";
import { emptyPlan } from "@/model/factory";

describe("serialize", () => {
  it("round-trips and rounds coordinates to 0.1 mm", () => {
    const p = emptyPlan("h");
    p.points.push({ id: "a", floorId: p.floors[0].id, x: 1.23456, y: 2 });
    const back = jsonToPlan(planToJson(p));
    expect(back.points[0].x).toBe(1.2);
    expect(back.name).toBe("h");
  });

  it("rejects garbage", () => {
    expect(() => jsonToPlan('{"version":1}')).toThrow();
  });

  it("round-trips a plan containing every entity kind, including a thickness measurement and an opening", () => {
    const p = emptyPlan("full house");
    const f = p.floors[0].id;
    p.points.push(
      { id: "p1", floorId: f, x: 0, y: 0 },
      { id: "p2", floorId: f, x: 4000, y: 0 },
      { id: "p3", floorId: f, x: 4000, y: 3000 },
      { id: "p4", floorId: f, x: 0, y: 3000 },
    );
    p.walls.push(
      { id: "w0", floorId: f, a: "p1", b: "p2", thickness: 200, side: "right" },
      { id: "w1", floorId: f, a: "p2", b: "p3", thickness: 200, side: "right" },
      { id: "w2", floorId: f, a: "p3", b: "p4", thickness: 200, side: "right" },
      { id: "w3", floorId: f, a: "p4", b: "p1", thickness: 200, side: "right" },
    );
    p.rooms.push({ id: "r1", floorId: f, name: "Kitchen", pointIds: ["p1", "p2", "p3", "p4"] });
    p.openings.push({ id: "o1", wallId: "w0", kind: "door", offset: 500, width: 900 });
    p.fixtures.push({
      id: "fx1",
      floorId: f,
      name: "Stove",
      anchor: { wallId: "w1", offset: 300, depth: 50 },
      w: 600,
      d: 600,
    });
    p.measurements.push(
      { id: "m1", kind: "length", a: "p1", b: "p2", value: 4000 },
      { id: "m2", kind: "thickness", wallA: "w0", wallB: "w2", value: 200 },
      { id: "m3", kind: "angle", a: "p4", b: "p1", c: "p2", value: 90 },
      { id: "m4", kind: "align", a: "p1", b: "p4", axis: "x" },
    );

    const back = jsonToPlan(planToJson(p));

    expect(back).toEqual(p);
  });
});
