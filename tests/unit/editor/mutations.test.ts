import { describe, it, expect } from "vitest";
import {
  deleteSelection,
  movePoint,
  setMeasurementValue,
  setOpeningKind,
  setOpeningOffset,
  setOpeningWidth,
  setFixtureName,
  setFixtureOffset,
  setFixtureDepth,
  setFixtureW,
  setFixtureD,
} from "@/editor/store/mutations";
import { emptyPlan } from "@/model/factory";

function base() {
  const p = emptyPlan("t");
  const f = p.floors[0].id;
  p.points.push(
    { id: "a", floorId: f, x: 0, y: 0 },
    { id: "b", floorId: f, x: 1, y: 0 },
    { id: "c", floorId: f, x: 1, y: 1 },
  );
  p.walls.push({ id: "w1", floorId: f, a: "a", b: "b", thickness: 0, side: "right" });
  p.rooms.push({ id: "r", floorId: f, name: "", pointIds: ["a", "b", "c"] });
  p.measurements.push(
    { id: "m1", kind: "length", a: "a", b: "b", value: 1 },
    { id: "m2", kind: "length", a: "b", b: "c", value: 1 },
  );
  p.openings.push({ id: "o", wallId: "w1", kind: "door", offset: 0, width: 1 });
  p.fixtures.push({
    id: "x",
    floorId: f,
    name: "stove",
    anchor: { wallId: "w1", offset: 0, depth: 0.1 },
    w: 0.5,
    d: 0.5,
  });
  return p;
}

describe("mutations", () => {
  it("deleting a point cascades", () => {
    const p = base();
    deleteSelection(p, { type: "point", id: "a" });
    expect(p.points.map((x) => x.id)).toEqual(["b", "c"]);
    expect(p.walls).toHaveLength(0);
    expect(p.rooms).toHaveLength(0);
    expect(p.measurements.map((m) => m.id)).toEqual(["m2"]);
    expect(p.openings).toHaveLength(0);
  });

  it("deleting a wall removes its openings and fixtures, keeps points", () => {
    const p = base();
    deleteSelection(p, { type: "wall", id: "w1" });
    expect(p.points).toHaveLength(3);
    expect(p.openings).toHaveLength(0);
    expect(p.fixtures).toHaveLength(0);
  });

  it("move and set value", () => {
    const p = base();
    movePoint(p, "a", { x: 5, y: 6 });
    expect(p.points[0]).toMatchObject({ x: 5, y: 6 });
    setMeasurementValue(p, "m1", 4000);
    expect((p.measurements[0] as { value: number }).value).toBe(4000);
  });

  it("edits an opening's kind, offset and width, rejecting a range past the wall", () => {
    const p = base();
    setOpeningKind(p, "o", "window");
    expect(p.openings[0].kind).toBe("window");
    setOpeningWidth(p, "o", 0.3);
    expect(p.openings[0].width).toBe(0.3);
    setOpeningOffset(p, "o", 0.2);
    expect(p.openings[0].offset).toBe(0.2);
    expect(() => setOpeningOffset(p, "o", 5)).toThrow(/exceeds/);
    expect(() => setOpeningWidth(p, "o", 5)).toThrow(/exceeds/);
  });

  it("edits a fixture's name, offset, depth, w and d", () => {
    const p = base();
    setFixtureName(p, "x", "sink");
    expect(p.fixtures[0].name).toBe("sink");
    setFixtureOffset(p, "x", 0.2);
    expect(p.fixtures[0].anchor.offset).toBe(0.2);
    setFixtureDepth(p, "x", 0.3);
    expect(p.fixtures[0].anchor.depth).toBe(0.3);
    setFixtureW(p, "x", 0.4);
    expect(p.fixtures[0].w).toBe(0.4);
    setFixtureD(p, "x", 0.6);
    expect(p.fixtures[0].d).toBe(0.6);
  });
});
