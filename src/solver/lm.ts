export type ResidualFn = (x: number[]) => number[];
export type LMStop = "gradient" | "step" | "no-descent" | "max-iterations";
export interface LMOptions {
  maxIterations: number;
  stepTolerance: number;
  jacobianStep: number;
  initialLambda: number;
  lambdaUpFactor: number;
  lambdaDownFactor: number;
  lambdaMin: number;
  maxInnerTries: number;
  gradientTolerance: number;
}
export interface LMResult {
  x: number[];
  residuals: number[];
  jacobian: number[][];
  iterations: number;
  stop: LMStop;
  converged: boolean;
}
const sumSq = (v: number[]) => v.reduce((s, r) => s + r * r, 0);
const norm = (v: number[]) => Math.sqrt(sumSq(v));

export function numericJacobian(
  f: ResidualFn,
  x: number[],
  h: number,
  knownM?: number,
): number[][] {
  const m = knownM ?? f(x).length;
  const n = x.length;
  const J: number[][] = Array.from({ length: m }, () => Array.from({ length: n }, () => 0));
  for (let j = 0; j < n; j++) {
    const xp = x.slice();
    const xm = x.slice();
    xp[j] += h;
    xm[j] -= h;
    const rp = f(xp);
    const rm = f(xm);
    for (let i = 0; i < m; i++) J[i][j] = (rp[i] - rm[i]) / (2 * h);
  }
  return J;
}

export function solveSPD(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  const L: number[][] = Array.from({ length: n }, () => Array.from({ length: n }, () => 0));
  for (let i = 0; i < n; i++)
    for (let j = 0; j <= i; j++) {
      let s = A[i][j];
      for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
      if (i === j) {
        if (s <= 0) return null;
        L[i][i] = Math.sqrt(s);
      } else L[i][j] = s / L[j][j];
    }
  const y = Array.from({ length: n }, () => 0);
  for (let i = 0; i < n; i++) {
    let s = b[i];
    for (let k = 0; k < i; k++) s -= L[i][k] * y[k];
    y[i] = s / L[i][i];
  }
  const x = Array.from({ length: n }, () => 0);
  for (let i = n - 1; i >= 0; i--) {
    let s = y[i];
    for (let k = i + 1; k < n; k++) s -= L[k][i] * x[k];
    x[i] = s / L[i][i];
  }
  return x;
}

function normalEquations(J: number[][], r: number[]): { JtJ: number[][]; Jtr: number[] } {
  const n = J[0]?.length ?? 0;
  const JtJ = Array.from({ length: n }, () => Array.from({ length: n }, () => 0));
  const Jtr = Array.from({ length: n }, () => 0);
  for (let i = 0; i < J.length; i++)
    for (let a = 0; a < n; a++) {
      if (J[i][a] === 0) continue;
      Jtr[a] += J[i][a] * r[i];
      for (let b = 0; b < n; b++) JtJ[a][b] += J[i][a] * J[i][b];
    }
  return { JtJ, Jtr };
}

export function levenbergMarquardt(f: ResidualFn, x0: number[], opts: LMOptions): LMResult {
  let x = x0.slice();
  let r = f(x);
  let cost = sumSq(r);
  let lambda = opts.initialLambda;
  let stop: LMStop = "max-iterations";
  let it = 0;
  for (; it < opts.maxIterations; it++) {
    const J = numericJacobian(f, x, opts.jacobianStep, r.length);
    const { JtJ, Jtr } = normalEquations(J, r);
    if (norm(Jtr) < opts.gradientTolerance) {
      stop = "gradient";
      break;
    }
    let accepted = false;
    let stepNorm = 0;
    for (let tries = 0; tries < opts.maxInnerTries && !accepted; tries++) {
      const A = JtJ.map((row, i) => row.map((v, j) => (i === j ? v + lambda * Math.max(v, 1) : v)));
      const delta = solveSPD(
        A,
        Jtr.map((v) => -v),
      );
      if (!delta) {
        lambda *= opts.lambdaUpFactor;
        continue;
      }
      const xn = x.map((v, i) => v + delta[i]);
      const rn = f(xn);
      const cn = sumSq(rn);
      if (cn < cost) {
        x = xn;
        r = rn;
        cost = cn;
        lambda = Math.max(lambda / opts.lambdaDownFactor, opts.lambdaMin);
        accepted = true;
        stepNorm = norm(delta);
      } else lambda *= opts.lambdaUpFactor;
    }
    if (!accepted) {
      // gradient was non-zero but no step (however small) reduced cost: the solve is stuck.
      stop = "no-descent";
      break;
    }
    if (stepNorm < opts.stepTolerance) {
      stop = "step";
      it++;
      break;
    }
  }
  const converged = stop === "gradient" || stop === "step";
  return {
    x,
    residuals: r,
    jacobian: numericJacobian(f, x, opts.jacobianStep, r.length),
    iterations: it,
    stop,
    converged,
  };
}
