import { describe, it, expect } from "vitest";
import { measurementLabel } from "@/editor/panels/measurementLabel";
import { emptyPlan } from "@/model/factory";

describe("measurementLabel", () => {
  it("labels points/walls by their floor-order index, prefixed by a shared room name", () => {
    const p = emptyPlan("t");
    const f = p.floors[0].id;
    p.points.push(
      { id: "p1", floorId: f, x: 0, y: 0 },
      { id: "p2", floorId: f, x: 4000, y: 0 },
      { id: "p3", floorId: f, x: 4000, y: 3000 },
      { id: "p4", floorId: f, x: 0, y: 3000 },
      { id: "p5", floorId: f, x: 8000, y: 0 },
      { id: "p6", floorId: f, x: 12000, y: 0 },
      { id: "p7", floorId: f, x: 12000, y: 3000 },
    );
    p.walls.push(
      { id: "w1", floorId: f, a: "p1", b: "p2", thickness: 0, side: "right" },
      { id: "w2", floorId: f, a: "p2", b: "p3", thickness: 0, side: "right" },
    );
    p.rooms.push(
      { id: "r1", floorId: f, name: "Kitchen", pointIds: ["p1", "p2", "p3", "p4"] },
      { id: "r2", floorId: f, name: "Bath", pointIds: ["p5", "p6", "p7"] },
    );

    // length inside one named room → prefixed with the room name
    expect(measurementLabel(p, { id: "m1", kind: "length", a: "p1", b: "p2", value: 4000 })).toBe(
      "Kitchen: P1 → P2",
    );

    // length spanning two (different, named) rooms → no prefix
    expect(measurementLabel(p, { id: "m2", kind: "length", a: "p1", b: "p5", value: 8000 })).toBe(
      "P1 → P5",
    );

    // thickness: walls indexed within their floor, no room prefix
    expect(
      measurementLabel(p, { id: "m3", kind: "thickness", wallA: "w1", wallB: "w2", value: 1 }),
    ).toBe("W1 ∥ W2");

    // angle: prefixed the same way as length when all three points share a room
    expect(
      measurementLabel(p, { id: "m4", kind: "angle", a: "p1", b: "p2", c: "p3", value: 90 }),
    ).toBe("Kitchen: ∠ P1-P2-P3");

    // align spanning rooms → no prefix
    expect(measurementLabel(p, { id: "m5", kind: "align", a: "p1", b: "p5", axis: "x" })).toBe(
      "P1 ≡ P5 (x)",
    );
  });
});
