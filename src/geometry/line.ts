import { type Vec, sub, cross, dot, len, add, scale, normalize } from "./vec";
import { GEOMETRY_CONFIG } from "@/config/geometry";

export function signedDistanceToLine(p: Vec, a: Vec, b: Vec): number {
  const d = sub(b, a);
  const l = len(d);
  return l === 0 ? len(sub(p, a)) : cross(d, sub(p, a)) / l;
}

export function intersectLines(a1: Vec, a2: Vec, b1: Vec, b2: Vec): Vec | null {
  const r = sub(a2, a1);
  const s = sub(b2, b1);
  const den = cross(r, s);
  if (Math.abs(den) < GEOMETRY_CONFIG.parallelEpsilon) return null;
  const t = cross(sub(b1, a1), s) / den;
  return add(a1, scale(r, t));
}

export function segmentDistance(p: Vec, a: Vec, b: Vec): number {
  const d = sub(b, a);
  const l2 = dot(d, d);
  if (l2 === 0) return len(sub(p, a));
  const t = Math.max(0, Math.min(1, dot(sub(p, a), d) / l2));
  return len(sub(p, add(a, scale(d, t))));
}

export function pointAlong(a: Vec, b: Vec, offsetMm: number): Vec {
  return add(a, scale(normalize(sub(b, a)), offsetMm));
}
