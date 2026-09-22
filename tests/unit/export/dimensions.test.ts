import { describe, it, expect } from "vitest";
import { roomDimensions, floorDimensions, formatMm } from "@/export/dimensions";
import { emptyPlan } from "@/model/factory";
import type { Side } from "@/model/types";

function rectangleRoom(side: Side = "right") {
  const p = emptyPlan("t");
  const f = p.floors[0].id;
  p.points.push(
    { id: "p1", floorId: f, x: 0, y: 0 },
    { id: "p2", floorId: f, x: 4000, y: 0 },
    { id: "p3", floorId: f, x: 4000, y: 3000 },
    { id: "p4", floorId: f, x: 0, y: 3000 },
  );
  (
    [
      ["p1", "p2"],
      ["p2", "p3"],
      ["p3", "p4"],
      ["p4", "p1"],
    ] as [string, string][]
  ).forEach(([a, b], i) => p.walls.push({ id: `w${i}`, floorId: f, a, b, thickness: 200, side }));
  p.rooms.push({ id: "r", floorId: f, name: "", pointIds: ["p1", "p2", "p3", "p4"] });
  return p;
}

describe("dimensions", () => {
  it("dimension lines sit outside the wall by offset and show solved length", () => {
    const p = rectangleRoom();
    const d = roomDimensions(p, p.rooms[0], 300, formatMm);
    expect(d).toHaveLength(4);
    expect(d[0].text).toBe("4000");
    expect(d[0].a.y).toBe(-500);
    expect(d[0].b.y).toBe(-500);
    expect(formatMm(3999.6)).toBe("4000");
  });

  it("computes the length from the fitted points, never a typed measurement value", () => {
    const p = rectangleRoom();
    // A typed measurement disagreeing with the actual (solved) geometry must not leak in:
    // dimensions read plan.points, never plan.measurements.
    p.measurements.push({ id: "m1", kind: "length", a: "p1", b: "p2", value: 9999 });
    const d = roomDimensions(p, p.rooms[0], 300, formatMm);
    expect(d[0].text).toBe("4000");
  });

  it("offsets ticks perpendicular to the wall, each of length offset/3", () => {
    const p = rectangleRoom();
    const d = roomDimensions(p, p.rooms[0], 300, formatMm);
    expect(d[0].ticks).toHaveLength(2);
    const [t0a, t0b] = d[0].ticks[0];
    // A vertical tick (perpendicular to the horizontal top wall) of total length 100 (300/3),
    // centred on the offset endpoint a' = (0, -500).
    expect(t0a.x).toBeCloseTo(0);
    expect(t0b.x).toBeCloseTo(0);
    expect(Math.abs(t0a.y - t0b.y)).toBeCloseTo(100);
  });

  it("offsets to the other side for a wall with the opposite side flag", () => {
    const p = rectangleRoom("left");
    const d = roomDimensions(p, p.rooms[0], 300, formatMm);
    // side='left' flips the outward normal, so the top wall's dimension line now sits INSIDE
    // (below the top edge, at +500) rather than above it.
    expect(d[0].a.y).toBe(500);
  });

  it("floorDimensions counts a wall referenced by two rooms only once", () => {
    const p = emptyPlan("shared");
    const f = p.floors[0].id;
    p.points.push(
      { id: "p1", floorId: f, x: 0, y: 0 },
      { id: "p2", floorId: f, x: 4000, y: 0 },
      { id: "p3", floorId: f, x: 4000, y: 3000 },
      { id: "p4", floorId: f, x: 0, y: 3000 },
      { id: "p5", floorId: f, x: 8000, y: 0 },
      { id: "p6", floorId: f, x: 8000, y: 3000 },
    );
    p.walls.push(
      { id: "w0", floorId: f, a: "p1", b: "p2", thickness: 200, side: "right" },
      { id: "w1", floorId: f, a: "p2", b: "p3", thickness: 200, side: "right" },
      { id: "w2", floorId: f, a: "p3", b: "p4", thickness: 200, side: "right" },
      { id: "w3", floorId: f, a: "p4", b: "p1", thickness: 200, side: "right" },
      { id: "w4", floorId: f, a: "p2", b: "p5", thickness: 200, side: "right" },
      { id: "w5", floorId: f, a: "p5", b: "p6", thickness: 200, side: "right" },
      { id: "w6", floorId: f, a: "p6", b: "p3", thickness: 200, side: "right" },
    );
    p.rooms.push(
      { id: "r1", floorId: f, name: "", pointIds: ["p1", "p2", "p3", "p4"] },
      // r2 shares wall w1 (its edge p2->p3 resolves to the SAME Wall as r1's p2->p3 edge).
      { id: "r2", floorId: f, name: "", pointIds: ["p2", "p5", "p6", "p3"] },
    );

    const lines = floorDimensions(p, f, { offsetMm: 300, textFmt: formatMm });

    // 7 distinct walls total (w0..w6); w1 must appear exactly once despite being walked by
    // both rooms.
    expect(lines).toHaveLength(7);
  });

  it("formatMm rounds to whole millimetres", () => {
    expect(formatMm(1000.4)).toBe("1000");
    expect(formatMm(1000.5)).toBe("1001");
  });
});
