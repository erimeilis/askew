import type { Vec } from "./vec";

function signedArea2(pts: Vec[]): number {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    s += p.x * q.y - q.x * p.y;
  }
  return s;
}

export function polygonArea(pts: Vec[]): number {
  return Math.abs(signedArea2(pts)) / 2;
}

export function polygonCentroid(pts: Vec[]): Vec {
  const a2 = signedArea2(pts);
  if (a2 === 0) return pts[0] ?? { x: 0, y: 0 };
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    const w = p.x * q.y - q.x * p.y;
    cx += (p.x + q.x) * w;
    cy += (p.y + q.y) * w;
  }
  return { x: cx / (3 * a2), y: cy / (3 * a2) };
}
