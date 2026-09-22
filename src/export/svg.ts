import type { Plan, Id } from "@/model/types";
import type { Vec } from "@/geometry/vec";
import { floorRooms, floorWalls, pointById } from "@/model/queries";
import { roomWallOutlines, wallOutline } from "@/geometry/wallOutline";
import { polygonArea, polygonCentroid } from "@/geometry/polygon";
import { floorDimensions, formatMm } from "@/export/dimensions";
import { EDITOR_CONFIG } from "@/config/editor";
import type { EXPORT_CONFIG } from "@/config/export";
import { polygon, line, text } from "./svgPrimitives";
import { openingsSvg } from "./svgOpenings";
import { fixturesSvg } from "./svgFixtures";

interface Bbox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** Mitred wall polygons for every wall on the floor: room walls via `roomWallOutlines`,
 * then any wall not belonging to a room via the standalone `wallOutline`. */
function wallPolygons(plan: Plan, floorId: Id): Vec[][] {
  const drawn = new Set<Id>();
  const polys: Vec[][] = [];
  for (const room of floorRooms(plan, floorId)) {
    for (const o of roomWallOutlines(plan, room)) {
      if (drawn.has(o.wall.id)) continue;
      drawn.add(o.wall.id);
      polys.push(o.polygon);
    }
  }
  for (const w of floorWalls(plan, floorId)) {
    if (drawn.has(w.id)) continue;
    polys.push(wallOutline(pointById(plan, w.a), pointById(plan, w.b), w.thickness, w.side));
  }
  return polys;
}

function bboxOf(polys: Vec[][]): Bbox {
  const pts = polys.flat();
  if (pts.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
}

/**
 * Renders one floor as a standalone SVG document string, in world millimetres. `width`/`height`
 * are the world size divided by `scale`, so printing the file at that paper scale (e.g. 1:50)
 * yields a plan measurable with a real ruler. The viewBox is the wall-outline bounding box
 * padded by `dimensionOffsetMm*2` on every side, which comfortably contains the dimension
 * lines and their text drawn just outside the walls. Pure string building — no DOM.
 */
export function planToSvg(
  plan: Plan,
  floorId: Id,
  opts: { scale: number; cfg: typeof EXPORT_CONFIG },
): string {
  const { scale, cfg } = opts;
  const walls = wallPolygons(plan, floorId);
  const raw = bboxOf(walls);
  const pad = cfg.dimensionOffsetMm * 2;
  const b: Bbox = {
    minX: raw.minX - pad,
    minY: raw.minY - pad,
    maxX: raw.maxX + pad,
    maxY: raw.maxY + pad,
  };
  const worldW = b.maxX - b.minX;
  const worldH = b.maxY - b.minY;
  const widthMm = worldW / scale;
  const heightMm = worldH / scale;

  const wallAttrs = {
    fill: cfg.colours.walls,
    stroke: cfg.colours.walls,
    "stroke-width": EDITOR_CONFIG.strokePx,
  };
  const wallsSvg = walls.map((pts) => polygon(pts, wallAttrs)).join("");

  const dimAttrs = { stroke: cfg.colours.dimensions, "stroke-width": EDITOR_CONFIG.strokePx };
  const dimTextAttrs = {
    fill: cfg.colours.dimensions,
    "font-size": cfg.dimensionTextMm,
    "text-anchor": "middle",
  };
  const dims = floorDimensions(plan, floorId, {
    offsetMm: cfg.dimensionOffsetMm,
    textFmt: formatMm,
  });
  const dimsSvg = dims
    .map((d) => {
      const ticks = d.ticks.map(([t0, t1]) => line(t0, t1, dimAttrs)).join("");
      return line(d.a, d.b, dimAttrs) + ticks + text(d.textAt, d.text, dimTextAttrs);
    })
    .join("");

  const labelAttrs = {
    fill: cfg.colours.labels,
    "font-size": cfg.labelTextMm,
    "text-anchor": "middle",
  };
  const labelsSvg = floorRooms(plan, floorId)
    .map((room) => {
      const pts = room.pointIds.map((id) => pointById(plan, id));
      const c = polygonCentroid(pts);
      const area = (polygonArea(pts) / 1e6).toFixed(cfg.areaDecimals);
      const nameSvg = text(c, room.name, labelAttrs);
      const areaSvg = text({ x: c.x, y: c.y + cfg.labelTextMm }, `${area} m²`, labelAttrs);
      return nameSvg + areaSvg;
    })
    .join("");

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${widthMm}mm" height="${heightMm}mm" ` +
    `viewBox="${b.minX} ${b.minY} ${worldW} ${worldH}">\n` +
    `<g id="${cfg.layers.walls}">${wallsSvg}</g>\n` +
    `<g id="${cfg.layers.openings}">${openingsSvg(plan, floorId, cfg)}</g>\n` +
    `<g id="${cfg.layers.fixtures}">${fixturesSvg(plan, floorId, cfg)}</g>\n` +
    `<g id="${cfg.layers.dimensions}">${dimsSvg}</g>\n` +
    `<g id="${cfg.layers.labels}">${labelsSvg}</g>\n` +
    `</svg>`
  );
}
