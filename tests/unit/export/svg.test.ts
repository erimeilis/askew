import { describe, it, expect } from "vitest";
import { planToSvg } from "@/export/svg";
import { EXPORT_CONFIG } from "@/config/export";
import { emptyPlan } from "@/model/factory";

describe("planToSvg", () => {
  it("emits layers, room label with area and scaled size", () => {
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
    p.rooms.push({ id: "r", floorId: f, name: "Kitchen <1>", pointIds: ["p1", "p2", "p3", "p4"] });
    const svg = planToSvg(p, f, { scale: 50, cfg: EXPORT_CONFIG });
    expect(svg.startsWith("<?xml")).toBe(true);
    for (const l of Object.values(EXPORT_CONFIG.layers)) expect(svg).toContain(`<g id="${l}"`);
    expect(svg).toContain("Kitchen &lt;1&gt;");
    expect(svg).toContain("12.00 m²");
    const w = Number(/width="([\d.]+)mm"/.exec(svg)![1]);
    expect(w).toBeCloseTo((4000 + 2 * 200 + 4 * EXPORT_CONFIG.dimensionOffsetMm) / 50, 1);
  });

  it("renders an opening's gap and symbol, and a fixture's rectangle and label", () => {
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
    p.fixtures.push({
      id: "x1",
      floorId: f,
      name: "Stove",
      anchor: { wallId: "w0", offset: 2000, depth: 50 },
      w: 600,
      d: 600,
    });
    const svg = planToSvg(p, f, { scale: 50, cfg: EXPORT_CONFIG });
    const openingsGroup = /<g id="openings">(.*?)<\/g>/.exec(svg)![1];
    expect(openingsGroup).toContain("<polygon");
    expect(openingsGroup).toContain("<path");
    const fixturesGroup = /<g id="fixtures">(.*?)<\/g>/.exec(svg)![1];
    expect(fixturesGroup).toContain("<polygon");
    expect(fixturesGroup).toContain("Stove");
  });
});
