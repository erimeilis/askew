import type { Plan, Id } from "@/model/types";
import type { SolverConfig } from "@/config/solver";
import { solveFloor, type SolveResult } from "@/solver/solveFloor";

/**
 * Runs the solver for a floor and writes the solved coordinates back into a copy of the plan.
 * `SolveResult.converged` is authoritative: when the solver did not converge, the original
 * (unsolved) plan is returned untouched so a bad fit never silently reshapes the drawing.
 */
export function applySolve(
  plan: Plan,
  floorId: Id,
  cfg: SolverConfig,
): { plan: Plan; result: SolveResult } {
  const result = solveFloor(plan, floorId, cfg);
  if (!result.converged) return { plan, result };
  const solved = new Map(result.points.map((p) => [p.id, p]));
  return { plan: { ...plan, points: plan.points.map((p) => solved.get(p.id) ?? p) }, result };
}
