import { describe, it, expect } from "vitest";
import { closeRoom } from "@/editor/tools/roomTool";
import { emptyPlan } from "@/model/factory";

describe("closeRoom", () => {
  it("creates points, walls with outward side and the room", () => {
    const p = emptyPlan("t");
    const f = p.floors[0].id;
    closeRoom(
      p,
      f,
      [
        { x: 0, y: 0 },
        { x: 4000, y: 0 },
        { x: 4000, y: 3000 },
        { x: 0, y: 3000 },
      ],
      "Kitchen",
    );
    expect(p.points).toHaveLength(4);
    expect(p.walls).toHaveLength(4);
    expect(p.rooms[0].name).toBe("Kitchen");
    // clockwise on screen (y down) → outward is 'right'
    expect(p.walls.every((w) => w.side === "right")).toBe(true);
    closeRoom(
      p,
      f,
      [
        { x: 0, y: 0 },
        { x: 0, y: 3000 },
        { x: 4000, y: 3000 },
        { x: 4000, y: 0 },
      ].map((v) => ({ x: v.x + 5000, y: v.y })),
      "B",
    );
    expect(p.walls.slice(4).every((w) => w.side === "left")).toBe(true);
  });

  it("reuses an existing point within snap distance", () => {
    const p = emptyPlan("t");
    const f = p.floors[0].id;
    closeRoom(
      p,
      f,
      [
        { x: 0, y: 0 },
        { x: 4000, y: 0 },
        { x: 4000, y: 3000 },
        { x: 0, y: 3000 },
      ],
      "A",
    );
    closeRoom(
      p,
      f,
      [
        { x: 4000, y: 0 },
        { x: 8000, y: 0 },
        { x: 8000, y: 3000 },
        { x: 4000, y: 3000 },
      ],
      "B",
      10,
    );
    expect(p.points).toHaveLength(6); // two shared points reused
  });
});
