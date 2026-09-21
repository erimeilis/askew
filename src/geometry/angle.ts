import { type Vec, sub, cross, dot } from "./vec";

export function wrapDeg(d: number): number {
  let r = ((((d + 180) % 360) + 360) % 360) - 180;
  if (r === -180) r = 180;
  return r;
}

/** Signed angle at b from ray b→a to ray b→c, degrees in (−180, 180]. */
export function signedAngleDeg(a: Vec, b: Vec, c: Vec): number {
  const v1 = sub(a, b);
  const v2 = sub(c, b);
  return wrapDeg((Math.atan2(cross(v1, v2), dot(v1, v2)) * 180) / Math.PI);
}
