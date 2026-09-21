import { describe, it, expect } from "vitest";
import { wallOutline, roomWallOutlines, wallSideNormal } from "@/geometry/wallOutline";
import { emptyPlan } from "@/model/factory";

describe("wallOutline", () => {
  it("side normal: right of +x is −y in y-down coordinates", () => {
    expect(wallSideNormal({ x: 0, y: 0 }, { x: 10, y: 0 }, "right")).toEqual({ x: 0, y: -1 });
  });

  it("single wall rectangle", () => {
    expect(wallOutline({ x: 0, y: 0 }, { x: 1000, y: 0 }, 200, "right")).toEqual([
      { x: 0, y: 0 },
      { x: 1000, y: 0 },
      { x: 1000, y: -200 },
      { x: 0, y: -200 },
    ]);
  });

  it("room outlines mitre at corners", () => {
    const p = emptyPlan("t");
    const f = p.floors[0].id;
    p.points.push(
      { id: "p1", floorId: f, x: 0, y: 0 },
      { id: "p2", floorId: f, x: 4000, y: 0 },
      { id: "p3", floorId: f, x: 4000, y: 3000 },
      { id: "p4", floorId: f, x: 0, y: 3000 },
    );
    // polygon p1→p2→p3→p4 is clockwise on screen (y down); outward for this winding is the 'right' side
    [
      ["p1", "p2"],
      ["p2", "p3"],
      ["p3", "p4"],
      ["p4", "p1"],
    ].forEach(([a, b], i) =>
      p.walls.push({ id: `w${i}`, floorId: f, a, b, thickness: 200, side: "right" }),
    );
    p.rooms.push({ id: "r", floorId: f, name: "", pointIds: ["p1", "p2", "p3", "p4"] });
    const out = roomWallOutlines(p, p.rooms[0]);
    expect(out).toHaveLength(4);
    expect(out[0].polygon[2]).toEqual({ x: 4200, y: -200 }); // outer corner shared with next wall
    expect(out[0].polygon[3]).toEqual({ x: -200, y: -200 });
  });
});
