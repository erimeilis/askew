import type { Plan, Id } from "@/model/types";
import type { SolverConfig } from "@/config/solver";
import type { ResidualSystem, ResidualEntry, ScalarFn } from "./types";
import { makeVarMap } from "./vars";
import { residualBuilders } from "./residualKinds";

export function buildSystem(plan: Plan, floorId: Id, cfg: SolverConfig): ResidualSystem {
  const { vars, x0 } = makeVarMap(plan, floorId);
  const entries: ResidualEntry[] = [];
  const fns: ScalarFn[] = [];
  for (const build of residualBuilders) {
    const b = build(plan, floorId, vars, cfg);
    entries.push(...b.entries);
    fns.push(...b.fns);
  }
  return { vars, x0, entries, f: (x) => fns.map((fn) => fn(x)) };
}
