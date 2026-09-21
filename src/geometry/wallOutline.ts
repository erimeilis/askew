import { type Vec, sub, add, scale, normalize, leftNormal } from "./vec";
import { intersectLines } from "./line";
import type { Plan, Room, Wall, Side } from "@/model/types";
import { roomWalls, pointById } from "@/model/queries";
import { GEOMETRY_CONFIG } from "@/config/geometry";

/** Unit normal to a→b pointing toward the wall's thickness side, y-down coordinates. */
export function wallSideNormal(a: Vec, b: Vec, side: Side): Vec {
  const n = leftNormal(normalize(sub(b, a)));
  return side === "left" ? n : scale(n, -1);
}

/** Outline of a single wall segment offset outward by its thickness: [a, b, bOuter, aOuter]. */
export function wallOutline(a: Vec, b: Vec, thickness: number, side: Side): Vec[] {
  const o = scale(wallSideNormal(a, b, side), thickness);
  return [a, b, add(b, o), add(a, o)];
}

/** Endpoints oriented to follow the room polygon direction, so consecutive walls share b_i = a_{i+1}. */
function orientedEnds(plan: Plan, w: Wall, fromId: string): [Vec, Vec] {
  const a = pointById(plan, w.a);
  const b = pointById(plan, w.b);
  return w.a === fromId ? [a, b] : [b, a];
}

const outlineRoundingFactor = 10 ** GEOMETRY_CONFIG.outlineDecimals;
const round = (v: Vec): Vec => ({
  x: Math.round(v.x * outlineRoundingFactor) / outlineRoundingFactor,
  y: Math.round(v.y * outlineRoundingFactor) / outlineRoundingFactor,
});

/**
 * Wall outlines for a room's walls, with outer corners mitred between consecutive walls:
 * each outer corner is the intersection of the two adjacent walls' offset lines, falling
 * back to the offset endpoint when those lines are parallel (a straight-through corner).
 */
export function roomWallOutlines(plan: Plan, room: Room): { wall: Wall; polygon: Vec[] }[] {
  const walls = roomWalls(plan, room);
  const n = walls.length;
  const out: { wall: Wall; polygon: Vec[] }[] = [];
  const outerLine = (i: number): [Vec, Vec] | null => {
    const w = walls[i];
    if (!w) return null;
    const [a, b] = orientedEnds(plan, w, room.pointIds[i]);
    const o = scale(wallSideNormal(a, b, w.side), w.thickness);
    return [add(a, o), add(b, o)];
  };
  for (let i = 0; i < n; i++) {
    const w = walls[i];
    if (!w) continue;
    const [a, b] = orientedEnds(plan, w, room.pointIds[i]);
    const mine = outerLine(i)!;
    const prev = outerLine((i + n - 1) % n);
    const next = outerLine((i + 1) % n);
    const aOuter = (prev && intersectLines(prev[0], prev[1], mine[0], mine[1])) ?? mine[0];
    const bOuter = (next && intersectLines(mine[0], mine[1], next[0], next[1])) ?? mine[1];
    out.push({ wall: w, polygon: [a, b, round(bOuter), round(aOuter)] });
  }
  return out;
}
