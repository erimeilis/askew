import { describe, it, expect } from "vitest";
import { addFloor, renameFloor, deleteFloor } from "@/editor/store/floorMutations";
import { emptyPlan } from "@/model/factory";
import { t } from "@/i18n";

describe("floorMutations", () => {
  it("adds a floor with a sequential default name", () => {
    const p = emptyPlan("t");
    const floor = addFloor(p);
    expect(p.floors).toHaveLength(2);
    expect(floor.name).toBe(t("floor.default", { n: 2 }));
    expect(p.floors[1]).toBe(floor);
  });

  it("renames a floor, and throws for an unknown id", () => {
    const p = emptyPlan("t");
    renameFloor(p, p.floors[0].id, "Ground");
    expect(p.floors[0].name).toBe("Ground");
    expect(() => renameFloor(p, "nope", "X")).toThrow();
  });

  it("deleting a floor cascades points, walls, rooms, openings, fixtures and measurements, keeping the other floor intact", () => {
    const p = emptyPlan("t");
    const first = p.floors[0].id;
    const second = addFloor(p).id;
    p.points.push(
      { id: "a", floorId: first, x: 0, y: 0 },
      { id: "b", floorId: first, x: 1000, y: 0 },
      { id: "c", floorId: second, x: 0, y: 0 },
      { id: "d", floorId: second, x: 1000, y: 0 },
    );
    p.walls.push(
      { id: "w1", floorId: first, a: "a", b: "b", thickness: 0, side: "right" },
      { id: "w2", floorId: second, a: "c", b: "d", thickness: 0, side: "right" },
    );
    p.rooms.push(
      { id: "r1", floorId: first, name: "K", pointIds: ["a", "b"] },
      { id: "r2", floorId: second, name: "L", pointIds: ["c", "d"] },
    );
    p.openings.push({ id: "o2", wallId: "w2", kind: "door", offset: 0, width: 500 });
    p.fixtures.push({
      id: "x2",
      floorId: second,
      name: "stove",
      anchor: { wallId: "w2", offset: 0, depth: 50 },
      w: 500,
      d: 500,
    });
    p.measurements.push(
      { id: "m1", kind: "length", a: "a", b: "b", value: 1000 },
      { id: "m2", kind: "length", a: "c", b: "d", value: 1000 },
    );

    deleteFloor(p, second);

    expect(p.floors.map((f) => f.id)).toEqual([first]);
    expect(p.points.map((pt) => pt.id)).toEqual(["a", "b"]);
    expect(p.walls.map((w) => w.id)).toEqual(["w1"]);
    expect(p.rooms.map((r) => r.id)).toEqual(["r1"]);
    expect(p.openings).toHaveLength(0);
    expect(p.fixtures).toHaveLength(0);
    expect(p.measurements.map((m) => m.id)).toEqual(["m1"]);
  });

  it("refuses to delete the last remaining floor", () => {
    const p = emptyPlan("t");
    expect(() => deleteFloor(p, p.floors[0].id)).toThrow();
    expect(p.floors).toHaveLength(1);
  });
});
