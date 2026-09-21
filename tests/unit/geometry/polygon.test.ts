import { describe, it, expect } from "vitest";
import { polygonArea, polygonCentroid } from "@/geometry/polygon";
const sq = [
  { x: 0, y: 0 },
  { x: 4000, y: 0 },
  { x: 4000, y: 3000 },
  { x: 0, y: 3000 },
];
describe("polygon", () => {
  it("area is positive regardless of winding", () => {
    expect(polygonArea(sq)).toBe(12_000_000);
    expect(polygonArea([...sq].reverse())).toBe(12_000_000);
  });
  it("centroid of rectangle", () => {
    expect(polygonCentroid(sq)).toEqual({ x: 2000, y: 1500 });
  });
  it("centroid of a zero-area polygon returns the first point", () => {
    const flat = [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 4, y: 0 },
    ];
    expect(polygonCentroid(flat)).toEqual(flat[0]);
  });
});
