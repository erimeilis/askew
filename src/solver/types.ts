import type { Id, Axis, MeasurementKind, Plan } from "@/model/types";
import type { Vec } from "@/geometry/vec";
import type { SolverConfig } from "@/config/solver";
import type { ResidualFn } from "./lm";
export interface VarMap {
  index(pointId: Id, axis: Axis): number;
  get(x: number[], pointId: Id): Vec;
  count: number;
  pointIds: Id[];
}
export type ResidualKind = MeasurementKind | "prior" | "gauge";
export interface ResidualEntry {
  measurementId: Id | null;
  kind: ResidualKind;
  sigma: number;
  unit: "mm" | "deg";
  pointIds: Id[];
}
export type ScalarFn = (x: number[]) => number;
export interface ResidualBatch {
  entries: ResidualEntry[];
  fns: ScalarFn[];
}
export type ResidualBuilder = (
  plan: Plan,
  floorId: Id,
  vars: VarMap,
  cfg: SolverConfig,
) => ResidualBatch;
export interface ResidualSystem {
  vars: VarMap;
  x0: number[];
  entries: ResidualEntry[];
  f: ResidualFn;
}
