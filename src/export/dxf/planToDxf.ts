import type { Plan, Id } from "@/model/types";
import type { Vec } from "@/geometry/vec";
import { floorRooms, floorWalls, floorOpenings, floorFixtures, pointById } from "@/model/queries";
import { roomWallOutlines, wallOutline } from "@/geometry/wallOutline";
import { polygonCentroid } from "@/geometry/polygon";
import { openingGeometry } from "@/geometry/openingGeometry";
import { fixtureRect } from "@/geometry/fixtureGeometry";
import { floorDimensions, formatMm } from "@/export/dimensions";
import type { EXPORT_CONFIG } from "@/config/export";
import { DxfWriter } from "./writer";

/** Internal coordinates are y-down like SVG; DXF is y-up, so every point gets its y negated
 * on the way out. Getting this backwards mirrors the whole plan. */
const flip = (v: Vec): Vec => ({ x: v.x, y: -v.y });

/** DXF ARC angles sweep counterclockwise in a y-up frame; ours are computed counterclockwise in
 * a y-down one, so flipping y also flips the sense of rotation — negate both angles and swap
 * which one is start and which is end to keep the same visual sweep. */
const wrapDeg = (d: number): number => ((d % 360) + 360) % 360;

/**
 * Renders one floor as an ASCII DXF document string: five layers from config (walls, openings,
 * fixtures, dimensions, labels), mitred wall outlines as closed LWPOLYLINEs, an opening's gap
 * outline plus its door/window symbol, a fixture's rectangle plus its name, a room-name TEXT per
 * room, and dimension lines/ticks/text reusing the same `floorDimensions` geometry the SVG
 * export and the canvas draw. Pure string building.
 */
export function planToDxf(plan: Plan, floorId: Id, cfg: typeof EXPORT_CONFIG): string {
  const layers = (Object.keys(cfg.layers) as (keyof typeof cfg.layers)[]).map((key) => ({
    name: cfg.layers[key],
    color: cfg.dxf.layerColors[key],
  }));
  const w = new DxfWriter({ version: cfg.dxf.version, insunits: cfg.dxf.insunits, layers });

  const drawn = new Set<Id>();
  for (const room of floorRooms(plan, floorId)) {
    for (const o of roomWallOutlines(plan, room)) {
      if (drawn.has(o.wall.id)) continue;
      drawn.add(o.wall.id);
      w.polyline(cfg.layers.walls, o.polygon.map(flip), true);
    }
  }
  for (const wall of floorWalls(plan, floorId)) {
    if (drawn.has(wall.id)) continue;
    const outline = wallOutline(
      pointById(plan, wall.a),
      pointById(plan, wall.b),
      wall.thickness,
      wall.side,
    );
    w.polyline(cfg.layers.walls, outline.map(flip), true);
  }

  for (const o of floorOpenings(plan, floorId)) {
    const g = openingGeometry(plan, o);
    w.polyline(cfg.layers.openings, g.gap.map(flip), true);
    for (const [a, b] of g.symbol.lines) w.line(cfg.layers.openings, flip(a), flip(b));
    if (g.symbol.arc) {
      const { c, r, startDeg, endDeg } = g.symbol.arc;
      w.arc(cfg.layers.openings, flip(c), r, wrapDeg(-endDeg), wrapDeg(-startDeg));
    }
  }

  for (const fx of floorFixtures(plan, floorId)) {
    const rect = fixtureRect(plan, fx);
    w.polyline(cfg.layers.fixtures, rect.map(flip), true);
    w.text(cfg.layers.fixtures, flip(polygonCentroid(rect)), cfg.dxf.textHeightMm, fx.name);
  }

  for (const room of floorRooms(plan, floorId)) {
    const pts = room.pointIds.map((id) => pointById(plan, id));
    const c = polygonCentroid(pts);
    w.text(cfg.layers.labels, flip(c), cfg.dxf.textHeightMm, room.name);
  }

  const dims = floorDimensions(plan, floorId, {
    offsetMm: cfg.dimensionOffsetMm,
    textFmt: formatMm,
  });
  for (const d of dims) {
    w.line(cfg.layers.dimensions, flip(d.a), flip(d.b));
    for (const [t0, t1] of d.ticks) w.line(cfg.layers.dimensions, flip(t0), flip(t1));
    w.text(cfg.layers.dimensions, flip(d.textAt), cfg.dxf.textHeightMm, d.text);
  }

  return w.toString();
}
