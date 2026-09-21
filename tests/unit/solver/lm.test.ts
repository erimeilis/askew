import { describe, it, expect } from "vitest";
import { levenbergMarquardt, numericJacobian, solveSPD } from "@/solver/lm";
const opts = {
  maxIterations: 50,
  stepTolerance: 1e-6,
  jacobianStep: 1e-4,
  initialLambda: 1e-3,
  lambdaUpFactor: 10,
  lambdaDownFactor: 10,
  lambdaMin: 1e-12,
  maxInnerTries: 20,
  gradientTolerance: 1e-12,
};
const signFlip = (x: number[]) => [x[0] > 0 ? 1 : -1];
describe("lm", () => {
  it("solveSPD solves a 2x2 system", () => {
    expect(
      solveSPD(
        [
          [4, 1],
          [1, 3],
        ],
        [1, 2],
      )!.map((v) => +v.toFixed(6)),
    ).toEqual([0.090909, 0.636364]);
  });
  it("solveSPD returns null for non-positive-definite", () => {
    expect(
      solveSPD(
        [
          [1, 2],
          [2, 1],
        ],
        [1, 1],
      ),
    ).toBeNull();
  });
  it("numeric jacobian of linear map", () => {
    const J = numericJacobian((x) => [2 * x[0] + 3 * x[1], x[1]], [1, 1], 1e-4);
    expect(J[0][0]).toBeCloseTo(2);
    expect(J[0][1]).toBeCloseTo(3);
    expect(J[1][0]).toBeCloseTo(0);
    expect(J[1][1]).toBeCloseTo(1);
  });
  it("fits point at distance from three anchors (overdetermined)", () => {
    const anchors = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 0, y: 10 },
    ];
    const truth = { x: 3, y: 4 };
    const d = anchors.map((a) => Math.hypot(a.x - truth.x, a.y - truth.y));
    const f = (x: number[]) => anchors.map((a, i) => Math.hypot(a.x - x[0], a.y - x[1]) - d[i]);
    const r = levenbergMarquardt(f, [8, 8], opts);
    expect(r.converged).toBe(true);
    expect(r.x[0]).toBeCloseTo(3, 4);
    expect(r.x[1]).toBeCloseTo(4, 4);
  });
  it("returns converged immediately when already optimal", () => {
    const r = levenbergMarquardt((x) => [x[0] - 1], [1], opts);
    expect(r.stop).toBe("gradient");
    expect(r.converged).toBe(true);
    expect(r.iterations).toBe(0);
  });
  it("stops with no-descent when no step can reduce cost", () => {
    const r = levenbergMarquardt(signFlip, [0], opts);
    expect(r.stop).toBe("no-descent");
    expect(r.converged).toBe(false);
  });
});
