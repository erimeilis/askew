import { describe, it, expect } from "vitest";
import { signedAngleDeg, wrapDeg } from "@/geometry/angle";
describe("angle", () => {
  it("right angle counter-clockwise is +90 (y down: a=(10,0) b=(0,0) c=(0,10))", () => {
    expect(signedAngleDeg({ x: 10, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 10 })).toBeCloseTo(90);
    expect(signedAngleDeg({ x: 0, y: 10 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBeCloseTo(-90);
  });
  it("wraps", () => {
    expect(wrapDeg(370)).toBe(10);
    expect(wrapDeg(-190)).toBe(170);
    expect(wrapDeg(180)).toBe(180);
  });
  it("zero-length ray returns 0", () => {
    expect(signedAngleDeg({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 5, y: 5 })).toBe(0);
  });
});
