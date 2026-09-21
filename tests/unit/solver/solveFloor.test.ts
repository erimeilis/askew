import { describe, it, expect } from "vitest";
import { solveFloor } from "@/solver/solveFloor";
import { SOLVER_CONFIG } from "@/config/solver";
import { roomPlan, measure } from "./fixtures";
import { dist } from "@/geometry/vec";

const rect = [
  { x: 0, y: 0 },
  { x: 4000, y: 0 },
  { x: 4000, y: 3000 },
  { x: 0, y: 3000 },
];
const skew = [
  { x: 0, y: 0 },
  { x: 4000, y: 0 },
  { x: 4150, y: 3000 },
  { x: 100, y: 3050 },
];

function maxErr(
  res: { points: { id: string; x: number; y: number }[] },
  truth: { x: number; y: number }[],
) {
  // gauge pins p1 to its perturbed position; compare shape via pairwise distances instead
  return Math.max(
    ...truth.flatMap((_a, i) =>
      truth.map((_b, j) => Math.abs(dist(res.points[i], res.points[j]) - dist(truth[i], truth[j]))),
    ),
  );
}

describe("solveFloor", () => {
  it("recovers a rectangle from 4 sides within 1 mm", () => {
    const { plan, floorId, truth } = roomPlan(rect, 200);
    measure(plan, truth, 1, 2, "m1");
    measure(plan, truth, 2, 3, "m2");
    measure(plan, truth, 3, 4, "m3");
    measure(plan, truth, 4, 1, "m4");
    const r = solveFloor(plan, floorId, SOLVER_CONFIG);
    expect(r.converged).toBe(true);
    expect(maxErr(r, truth)).toBeLessThan(1);
    expect(r.unconstrained).toEqual([]);
  });

  it("recovers a skewed quad from 4 sides + 2 diagonals", () => {
    const { plan, floorId, truth } = roomPlan(skew, 200);
    [
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 1],
      [1, 3],
      [2, 4],
    ].forEach(([a, b], i) => measure(plan, truth, a, b, `m${i}`));
    const r = solveFloor(plan, floorId, SOLVER_CONFIG);
    expect(r.converged).toBe(true);
    expect(maxErr(r, truth)).toBeLessThan(1);
  });

  it("detects an inconsistent measurement set", () => {
    const { plan, floorId, truth } = roomPlan(rect, 50);
    [
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 1],
      [1, 3],
    ].forEach(([a, b], i) => measure(plan, truth, a, b, `m${i}`));
    measure(plan, truth, 2, 4, "bad", 60);
    const r = solveFloor(plan, floorId, SOLVER_CONFIG);
    expect(r.converged).toBe(true);
    expect(r.residuals.filter((x) => x.flagged).map((x) => x.measurementId)).toContain("bad");
    expect(r.rms).toBeGreaterThan(1);
    expect(r.redundancy).toBe(1);
  });

  it("cannot see an error at all when there is no redundancy", () => {
    const { plan, floorId, truth } = roomPlan(rect, 50);
    [
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 1],
    ].forEach(([a, b], i) => measure(plan, truth, a, b, `m${i}`));
    measure(plan, truth, 1, 3, "bad", 60);
    const r = solveFloor(plan, floorId, SOLVER_CONFIG);
    expect(r.redundancy).toBe(0);
    expect(r.residuals.every((x) => !x.flagged)).toBe(true);
    expect(r.rms).toBeLessThan(1);
  });

  it("reports unconstrained points when no length is given (scale free)", () => {
    const { plan, floorId } = roomPlan(rect, 0);
    const r = solveFloor(plan, floorId, SOLVER_CONFIG);
    expect(r.unconstrained.length).toBeGreaterThan(0);
  });

  it("ties two rooms with a shared wall thickness", () => {
    const { plan, floorId, truth } = roomPlan(rect, 100);
    [
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 1],
    ].forEach(([a, b], i) => measure(plan, truth, a, b, `m${i}`));
    // second room above the first (y down: above = smaller y), its bottom face is the other side of wall w1 (p1→p2, side right → −y)
    const t2 = [
      { x: 0, y: -200 },
      { x: 4000, y: -200 },
      { x: 4000, y: -2700 },
      { x: 0, y: -2700 },
    ];
    t2.forEach((v, i) => plan.points.push({ id: `q${i + 1}`, floorId, x: v.x + 80, y: v.y - 60 }));
    plan.walls.push(
      { id: "v1", floorId, a: "q2", b: "q1", thickness: 0, side: "right" },
      { id: "v2", floorId, a: "q1", b: "q4", thickness: 0, side: "right" },
      { id: "v3", floorId, a: "q4", b: "q3", thickness: 0, side: "right" },
      { id: "v4", floorId, a: "q3", b: "q2", thickness: 0, side: "right" },
    );
    plan.rooms.push({ id: "r2", floorId, name: "B", pointIds: ["q2", "q1", "q4", "q3"] });
    plan.measurements.push(
      { id: "th", kind: "thickness", wallA: "w1", wallB: "v1", value: 200 },
      { id: "l1", kind: "length", a: "q1", b: "q2", value: 4000 },
      { id: "l2", kind: "length", a: "q2", b: "q3", value: 2500 },
      { id: "l3", kind: "length", a: "q3", b: "q4", value: 4000 },
      { id: "l4", kind: "length", a: "q4", b: "q1", value: 2500 },
      { id: "al", kind: "align", a: "p1", b: "q1", axis: "x" },
    );
    const r = solveFloor(plan, floorId, SOLVER_CONFIG);
    expect(r.converged).toBe(true);
    const P = (id: string) => r.points.find((p) => p.id === id)!;
    expect(Math.abs(P("q1").y - P("p1").y)).toBeCloseTo(200, 0);
    expect(Math.abs(P("q2").y - P("p2").y)).toBeCloseTo(200, 0);
  });
});
