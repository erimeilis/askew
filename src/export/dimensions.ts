import type { Plan, Room, Id } from "@/model/types";
import type { Vec } from "@/geometry/vec";
import { add, scale, sub, dist, lerp } from "@/geometry/vec";
import { roomWalls, floorRooms, pointById } from "@/model/queries";
import { wallSideNormal } from "@/geometry/wallOutline";
import { EXPORT_CONFIG } from "@/config/export";

export interface DimensionLine {
  a: Vec;
  b: Vec;
  text: string;
  textAt: Vec;
  ticks: [Vec, Vec][];
}

/** Rounds a millimetre length to the nearest whole millimetre for display. */
export const formatMm = (v: number): string => String(Math.round(v));

function tickAt(p: Vec, normal: Vec, length: number): [Vec, Vec] {
  const half = scale(normal, length / 2);
  return [sub(p, half), add(p, half)];
}

/** One dimension line per wall of `room`, oriented like `roomWallOutlines` (polygon order). */
function wallDimensionLines(
  plan: Plan,
  room: Room,
  offsetMm: number,
  textFmt: (mm: number) => string,
): { wallId: Id; line: DimensionLine }[] {
  const walls = roomWalls(plan, room);
  const n = room.pointIds.length;
  const out: { wallId: Id; line: DimensionLine }[] = [];
  for (let i = 0; i < n; i++) {
    const wall = walls[i];
    if (!wall) continue;
    const a = pointById(plan, room.pointIds[i]);
    const b = pointById(plan, room.pointIds[(i + 1) % n]);
    const normal = wallSideNormal(a, b, wall.side);
    const off = scale(normal, wall.thickness + offsetMm);
    const aOff = add(a, off);
    const bOff = add(b, off);
    const mid = lerp(aOff, bOff, 0.5);
    const textAt = add(mid, scale(normal, EXPORT_CONFIG.dimensionTextMm / 2));
    const tickLen = offsetMm / 3;
    out.push({
      wallId: wall.id,
      line: {
        a: aOff,
        b: bOff,
        // The measurement Askew exists to reveal is what the solve actually produced, so this
        // reads the fitted point coordinates — never a typed Measurement.value.
        text: textFmt(dist(a, b)),
        textAt,
        ticks: [tickAt(aOff, normal, tickLen), tickAt(bOff, normal, tickLen)],
      },
    });
  }
  return out;
}

/** Dimension lines for one room's walls, offset outward past each wall's own thickness. */
export function roomDimensions(
  plan: Plan,
  room: Room,
  offsetMm: number,
  textFmt: (mm: number) => string,
): DimensionLine[] {
  return wallDimensionLines(plan, room, offsetMm, textFmt).map((x) => x.line);
}

/** Dimension lines for every room on a floor, one per wall id — a wall shared by two rooms
 * (a party wall) contributes only the first room's line. */
export function floorDimensions(
  plan: Plan,
  floorId: Id,
  cfg: { offsetMm: number; textFmt: (mm: number) => string },
): DimensionLine[] {
  const seen = new Set<Id>();
  const out: DimensionLine[] = [];
  for (const room of floorRooms(plan, floorId)) {
    for (const { wallId, line } of wallDimensionLines(plan, room, cfg.offsetMm, cfg.textFmt)) {
      if (seen.has(wallId)) continue;
      seen.add(wallId);
      out.push(line);
    }
  }
  return out;
}
