import { describe, it, expect } from "vitest";
import { sub, add, scale, dot, cross, len, dist, normalize, leftNormal } from "@/geometry/vec";
describe("vec", () => {
  it("basic ops", () => {
    expect(sub({ x: 3, y: 4 }, { x: 1, y: 1 })).toEqual({ x: 2, y: 3 });
    expect(add({ x: 1, y: 1 }, { x: 2, y: 2 })).toEqual({ x: 3, y: 3 });
    expect(scale({ x: 1, y: -2 }, 3)).toEqual({ x: 3, y: -6 });
    expect(dot({ x: 1, y: 2 }, { x: 3, y: 4 })).toBe(11);
    expect(cross({ x: 1, y: 0 }, { x: 0, y: 1 })).toBe(1);
    expect(len({ x: 3, y: 4 })).toBe(5);
    expect(dist({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    expect(normalize({ x: 0, y: 5 })).toEqual({ x: 0, y: 1 });
    expect(leftNormal({ x: 1, y: 0 })).toEqual({ x: -0, y: 1 });
  });
});
