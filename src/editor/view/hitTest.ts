import type { Plan, Id } from "@/model/types";
import type { Vec } from "@/geometry/vec";
import { dist, sub, dot } from "@/geometry/vec";
import { segmentDistance } from "@/geometry/line";
import {
  floorPoints,
  floorWalls,
  floorRooms,
  floorOpenings,
  floorFixtures,
  pointById,
} from "@/model/queries";
import { openingGeometry } from "@/geometry/openingGeometry";
import { fixtureRect } from "@/geometry/fixtureGeometry";

export type Hit =
  | { type: "point"; id: Id }
  | { type: "opening"; id: Id }
  | { type: "fixture"; id: Id }
  | { type: "wall"; id: Id; t: number }
  | { type: "room"; id: Id }
  | null;

function pointInPolygon(p: Vec, poly: Vec[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside;
    }
  }
  return inside;
}

/** Points first, then openings and fixtures (so a door or a stove can be picked even where the
 * wall behind it would also be within tolerance), then walls (with the along-wall parameter t),
 * then room interiors. */
export function hitTest(plan: Plan, floorId: Id, w: Vec, tolMm: number): Hit {
  let best: { d: number; hit: Hit } = { d: tolMm, hit: null };
  for (const p of floorPoints(plan, floorId)) {
    const d = dist(p, w);
    if (d <= best.d) best = { d, hit: { type: "point", id: p.id } };
  }
  if (best.hit) return best.hit;
  for (const o of floorOpenings(plan, floorId)) {
    if (pointInPolygon(w, openingGeometry(plan, o).gap)) return { type: "opening", id: o.id };
  }
  for (const fx of floorFixtures(plan, floorId)) {
    if (pointInPolygon(w, fixtureRect(plan, fx))) return { type: "fixture", id: fx.id };
  }
  for (const wl of floorWalls(plan, floorId)) {
    const a = pointById(plan, wl.a);
    const b = pointById(plan, wl.b);
    const d = segmentDistance(w, a, b);
    if (d <= best.d) {
      const ab = sub(b, a);
      const t = Math.max(0, Math.min(1, dot(sub(w, a), ab) / dot(ab, ab)));
      best = { d, hit: { type: "wall", id: wl.id, t } };
    }
  }
  if (best.hit) return best.hit;
  for (const r of floorRooms(plan, floorId)) {
    if (
      pointInPolygon(
        w,
        r.pointIds.map((id) => pointById(plan, id)),
      )
    ) {
      return { type: "room", id: r.id };
    }
  }
  return null;
}
