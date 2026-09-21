import { describe, it, expect } from "vitest";
import { signedDistanceToLine, intersectLines, segmentDistance, pointAlong } from "@/geometry/line";
describe("line", () => {
  it("signed distance positive on left of a→b", () => {
    expect(signedDistanceToLine({ x: 0, y: 5 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBe(5);
    expect(signedDistanceToLine({ x: 0, y: -5 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBe(-5);
  });
  it("signed distance with coincident endpoints returns the unsigned distance", () => {
    expect(signedDistanceToLine({ x: 3, y: 4 }, { x: 0, y: 0 }, { x: 0, y: 0 })).toBe(5);
  });
  it("intersects and detects parallel", () => {
    expect(
      intersectLines({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: -5 }, { x: 5, y: 5 }),
    ).toEqual({
      x: 5,
      y: 0,
    });
    expect(
      intersectLines({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 1 }, { x: 10, y: 1 }),
    ).toBeNull();
  });
  it("segment distance clamps to endpoints", () => {
    expect(segmentDistance({ x: 20, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBe(10);
    expect(segmentDistance({ x: 5, y: 3 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBe(3);
  });
  it("pointAlong", () => {
    expect(pointAlong({ x: 0, y: 0 }, { x: 10, y: 0 }, 4)).toEqual({ x: 4, y: 0 });
  });
});
