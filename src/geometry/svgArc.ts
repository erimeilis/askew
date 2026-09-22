import type { Vec } from "./vec";

const toRad = (deg: number): number => (deg * Math.PI) / 180;

/**
 * SVG path `d` for a single arc segment: absolute move to the start angle's point, then an arc
 * sweep to the end angle's point. Matches `openingGeometry`'s y-down, increasing-angle
 * convention, so sweep-flag 1 always draws the intended (never the reflex) side.
 */
export function arcPath(c: Vec, r: number, startDeg: number, endDeg: number): string {
  const at = (deg: number): Vec => ({
    x: c.x + r * Math.cos(toRad(deg)),
    y: c.y + r * Math.sin(toRad(deg)),
  });
  const start = at(startDeg);
  const end = at(endDeg);
  const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}
