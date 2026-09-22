import { describe, it, expect } from "vitest";
import { arcPath } from "@/geometry/svgArc";

describe("arcPath", () => {
  it("moves to the start angle's point and sweeps to the end angle's point", () => {
    const d = arcPath({ x: 500, y: 0 }, 800, 0, 90);
    const nums = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
    expect(nums).toHaveLength(9);
    const [mx, my, rx, ry, , largeArc, sweep, ex, ey] = nums;
    expect(mx).toBeCloseTo(1300);
    expect(my).toBeCloseTo(0);
    expect(rx).toBe(800);
    expect(ry).toBe(800);
    expect(largeArc).toBe(0);
    expect(sweep).toBe(1);
    expect(ex).toBeCloseTo(500);
    expect(ey).toBeCloseTo(800);
  });

  it("uses the large-arc flag past a 180 degree sweep", () => {
    const d = arcPath({ x: 0, y: 0 }, 10, 0, 200);
    expect(d).toContain("A 10 10 0 1 1");
  });
});
