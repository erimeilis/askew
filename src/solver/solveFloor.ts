import type { Plan, Id, Point } from "@/model/types";
import type { SolverConfig } from "@/config/solver";
import { buildSystem } from "./residuals";
import { levenbergMarquardt, type LMStop } from "./lm";
import { freeColumns } from "./rank";

export interface MeasurementResidual {
  measurementId: Id;
  residual: number;
  sigma: number;
  unit: "mm" | "deg";
  flagged: boolean;
}
export interface SolveResult {
  floorId: Id;
  points: Point[];
  residuals: MeasurementResidual[];
  rms: number;
  converged: boolean;
  stop: LMStop;
  unconstrained: Id[];
  iterations: number;
  redundancy: number;
}

/** Translation, rotation: the three rigid-body freedoms the gauge residuals remove. */
const GAUGE_DOF = 3;

export function solveFloor(plan: Plan, floorId: Id, cfg: SolverConfig): SolveResult {
  const sys = buildSystem(plan, floorId, cfg);
  if (sys.vars.count === 0) {
    return {
      floorId,
      points: [],
      residuals: [],
      rms: 0,
      converged: true,
      stop: "gradient",
      unconstrained: [],
      iterations: 0,
      redundancy: 0,
    };
  }
  const lm = levenbergMarquardt(sys.f, sys.x0, {
    maxIterations: cfg.maxIterations,
    stepTolerance: cfg.stepToleranceMm,
    jacobianStep: cfg.jacobianStepMm,
    ...cfg.lm,
  });
  const x = lm.converged ? lm.x : sys.x0;
  const points: Point[] = sys.vars.pointIds.map((id) => {
    const v = sys.vars.get(x, id);
    return { id, floorId, x: v.x, y: v.y };
  });
  const weighted = lm.converged ? lm.residuals : sys.f(sys.x0);
  const byMeasurement = new Map<Id, MeasurementResidual>();
  sys.entries.forEach((e, i) => {
    if (!e.measurementId) return;
    const raw = weighted[i] * e.sigma;
    const prev = byMeasurement.get(e.measurementId);
    const residual = prev && Math.abs(prev.residual) > Math.abs(raw) ? prev.residual : raw;
    byMeasurement.set(e.measurementId, {
      measurementId: e.measurementId,
      residual,
      sigma: e.sigma,
      unit: e.unit,
      flagged: Math.abs(residual) > cfg.flagSigmaFactor * e.sigma,
    });
  });
  const rms = Math.sqrt(weighted.reduce((s, r) => s + r * r, 0) / Math.max(1, weighted.length));
  const free = freeColumns(lm.jacobian, cfg.rankTolerance);
  const unconstrained = [...new Set(free.map((c) => sys.vars.pointIds[Math.floor(c / 2)]))];
  const measuredIds = new Set(
    sys.entries.map((e) => e.measurementId).filter((id): id is Id => id !== null),
  );
  const redundancy = Math.max(0, measuredIds.size - Math.max(0, sys.vars.count - GAUGE_DOF));
  return {
    floorId,
    points,
    residuals: [...byMeasurement.values()],
    rms,
    converged: lm.converged,
    stop: lm.stop,
    unconstrained,
    iterations: lm.iterations,
    redundancy,
  };
}
