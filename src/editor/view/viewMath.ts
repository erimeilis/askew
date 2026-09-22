import type { Vec } from "@/geometry/vec";

/** screen = world * s + t. Pure and unit-tested; no React, no DOM. */
export interface View {
  tx: number;
  ty: number;
  s: number;
}

export const toScreen = (v: View, w: Vec): Vec => ({ x: w.x * v.s + v.tx, y: w.y * v.s + v.ty });

export const toWorld = (v: View, p: Vec): Vec => ({
  x: (p.x - v.tx) / v.s,
  y: (p.y - v.ty) / v.s,
});

/** Rescales around `at` (a screen point) so the world point currently under it stays fixed. */
export function zoomAt(
  v: View,
  at: Vec,
  factor: number,
  limits: { min: number; max: number },
): View {
  const s = Math.min(limits.max, Math.max(limits.min, v.s * factor));
  const w = toWorld(v, at);
  return { s, tx: at.x - w.x * s, ty: at.y - w.y * s };
}

export const panBy = (v: View, dx: number, dy: number): View => ({
  ...v,
  tx: v.tx + dx,
  ty: v.ty + dy,
});
