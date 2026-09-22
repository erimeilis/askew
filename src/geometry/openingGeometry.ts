import { type Vec, sub, add, scale } from "./vec";
import { pointAlong } from "./line";
import { wallOutline, wallSideNormal } from "./wallOutline";
import type { Plan, Opening } from "@/model/types";
import { wallById, pointById } from "@/model/queries";

export interface OpeningSymbol {
  lines: [Vec, Vec][];
  arc?: { c: Vec; r: number; startDeg: number; endDeg: number };
}
export interface OpeningGeometry {
  gap: Vec[];
  symbol: OpeningSymbol;
}

const angleDeg = (v: Vec): number => (Math.atan2(v.y, v.x) * 180) / Math.PI;

/**
 * `gap` is the wall's own outline shape, but running only from `offset` to `offset+width` along
 * the wall instead of its full length — the rectangle an opening cuts through the thickness.
 * `symbol`: a window is two lines crossing the gap at 1/3 and 2/3 of the thickness; a door is a
 * leaf swinging 90 degrees from the hinge (the offset end) into the room — the side opposite the
 * wall's thickness extrusion — plus the swing arc connecting the leaf tip back to the far jamb.
 */
export function openingGeometry(plan: Plan, opening: Opening): OpeningGeometry {
  const wall = wallById(plan, opening.wallId);
  const a = pointById(plan, wall.a);
  const b = pointById(plan, wall.b);
  const p0 = pointAlong(a, b, opening.offset);
  const p1 = pointAlong(a, b, opening.offset + opening.width);
  const gap = wallOutline(p0, p1, wall.thickness, wall.side);

  if (opening.kind === "window") {
    const normal = wallSideNormal(a, b, wall.side);
    const lines: [Vec, Vec][] = [1 / 3, 2 / 3].map((f) => {
      const o = scale(normal, wall.thickness * f);
      return [add(p0, o), add(p1, o)];
    });
    return { gap, symbol: { lines } };
  }

  const roomNormal = scale(wallSideNormal(a, b, wall.side), -1);
  const leafTip = add(p0, scale(roomNormal, opening.width));
  const dirDeg = angleDeg(sub(b, a));
  const startDeg = wall.side === "right" ? dirDeg : dirDeg - 90;
  const endDeg = startDeg + 90;
  return {
    gap,
    symbol: {
      lines: [[p0, leafTip]],
      arc: { c: p0, r: opening.width, startDeg, endDeg },
    },
  };
}
