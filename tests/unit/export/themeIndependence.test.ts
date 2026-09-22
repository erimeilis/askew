// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { planToSvg } from "@/export/svg";
import { planToDxf } from "@/export/dxf/planToDxf";
import { EXPORT_CONFIG } from "@/config/export";
import { emptyPlan } from "@/model/factory";

/**
 * Exports are a plan someone prints on white paper: the SVG/DXF colours come only from
 * `EXPORT_CONFIG.colours` (plain hex strings), never from a CSS custom property or the
 * `data-theme` attribute the toggle sets. This locks that down directly — flip the page's
 * theme attribute and confirm both export formats come out byte-identical regardless.
 */
function buildPlan() {
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
  p.rooms.push({ id: "r", floorId: f, name: "Kitchen", pointIds: ["p1", "p2", "p3", "p4"] });
  return { plan: p, floorId: f };
}

describe("exports are theme-independent", () => {
  it("planToSvg is byte-identical whether the page is in light or dark theme", () => {
    const { plan, floorId } = buildPlan();

    document.documentElement.removeAttribute("data-theme");
    const light = planToSvg(plan, floorId, { scale: 50, cfg: EXPORT_CONFIG });

    document.documentElement.setAttribute("data-theme", "dark");
    const dark = planToSvg(plan, floorId, { scale: 50, cfg: EXPORT_CONFIG });
    document.documentElement.removeAttribute("data-theme");

    expect(dark).toBe(light);
    // And it only ever carries EXPORT_CONFIG's own hex colours, never a CSS var reference.
    expect(light).toContain(EXPORT_CONFIG.colours.walls);
    expect(light).not.toContain("var(--color");
  });

  it("planToDxf is byte-identical whether the page is in light or dark theme", () => {
    const { plan, floorId } = buildPlan();

    document.documentElement.removeAttribute("data-theme");
    const light = planToDxf(plan, floorId, EXPORT_CONFIG);

    document.documentElement.setAttribute("data-theme", "dark");
    const dark = planToDxf(plan, floorId, EXPORT_CONFIG);
    document.documentElement.removeAttribute("data-theme");

    expect(dark).toBe(light);
  });
});
