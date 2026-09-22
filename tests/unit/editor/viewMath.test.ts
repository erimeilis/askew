import { describe, it, expect } from "vitest";
import { toWorld, toScreen, zoomAt } from "@/editor/view/viewMath";

describe("viewMath", () => {
  const v = { tx: 100, ty: 50, s: 0.1 };

  it("round trip", () => {
    const w = { x: 4000, y: 3000 };
    expect(toWorld(v, toScreen(v, w))).toEqual(w);
  });

  it("zoomAt keeps the point under cursor fixed", () => {
    const p = { x: 300, y: 200 };
    const w = toWorld(v, p);
    const z = zoomAt(v, p, 2, { min: 0.01, max: 2 });
    expect(toScreen(z, w).x).toBeCloseTo(300);
    expect(z.s).toBe(0.2);
  });

  it("zoom clamps", () => {
    expect(zoomAt(v, { x: 0, y: 0 }, 1000, { min: 0.01, max: 2 }).s).toBe(2);
  });
});
