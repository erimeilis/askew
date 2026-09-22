import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { planToDxf } from "@/export/dxf/planToDxf";
import { EXPORT_CONFIG } from "@/config/export";
import { emptyPlan } from "@/model/factory";

it("matches golden file for a rectangle room", () => {
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
  ).forEach(([a, b], i) =>
    p.walls.push({ id: `w${i}`, floorId: f, a, b, thickness: 200, side: "right" }),
  );
  p.rooms.push({ id: "r", floorId: f, name: "A", pointIds: ["p1", "p2", "p3", "p4"] });
  const dxf = planToDxf(p, f, EXPORT_CONFIG);
  expect(dxf).toContain("10\n4200\n20\n200\n"); // outer corner (4200, −200) with y negated → 200
  expect(dxf).toBe(readFileSync(new URL("./__golden__/rect.dxf", import.meta.url), "utf8"));
});

it("puts an opening's gap, symbol and a fixture's rectangle and label on their own layers", () => {
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
  ).forEach(([a, b], i) =>
    p.walls.push({ id: `w${i}`, floorId: f, a, b, thickness: 200, side: "right" }),
  );
  p.rooms.push({ id: "r", floorId: f, name: "A", pointIds: ["p1", "p2", "p3", "p4"] });
  p.openings.push({ id: "o1", wallId: "w0", kind: "door", offset: 500, width: 800 });
  p.openings.push({ id: "o2", wallId: "w1", kind: "window", offset: 500, width: 800 });
  p.fixtures.push({
    id: "x1",
    floorId: f,
    name: "Stove",
    anchor: { wallId: "w0", offset: 2000, depth: 50 },
    w: 600,
    d: 600,
  });
  const dxf = planToDxf(p, f, EXPORT_CONFIG);

  // door: a closed LWPOLYLINE gap plus an ARC on the openings layer
  expect(dxf).toContain("0\nARC\n");
  const arcIdx = dxf.indexOf("0\nARC\n");
  expect(dxf.slice(0, arcIdx)).toMatch(/8\nopenings\n[^]*$/);

  // window: two LINE entities in addition to its own gap polyline, still on openings
  const lineCount = dxf.split("0\nLINE\n").length - 1;
  expect(lineCount).toBeGreaterThanOrEqual(2); // the window's two symbol lines

  // fixture: closed LWPOLYLINE + TEXT "Stove" on the fixtures layer
  expect(dxf).toContain("8\nfixtures\n");
  expect(dxf).toContain("1\nStove\n");
});
