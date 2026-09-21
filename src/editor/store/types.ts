import type { Id, Plan } from "@/model/types";
import type { Vec } from "@/geometry/vec";
import type { SolveResult } from "@/solver/solveFloor";
import type { History } from "./history";

export type ToolId =
  | "select"
  | "room"
  | "measure"
  | "thickness"
  | "angle"
  | "align"
  | "opening"
  | "fixture";
export type SelectionType = "point" | "wall" | "room" | "measurement" | "opening" | "fixture";
export type Selection = { type: SelectionType; id: Id } | null;
export interface Prompt {
  label: string;
  kind: "number" | "text" | "choice";
  choices?: string[];
  onCommit(value: string): void;
}
export interface EditorState {
  history: History<Plan>;
  results: Record<Id, SolveResult>;
  activeFloorId: Id;
  selection: Selection;
  tool: ToolId;
  pending: Id[]; // ids clicked so far by the active tool (points or walls)
  draft: Vec[]; // provisional coordinates for the room tool
  prompt: Prompt | null;
  error: string | null;
  snapMm: number; // snap/hit tolerance in world mm, set by Canvas from EDITOR_CONFIG.snapPx / view.s
  plan(): Plan;
  update(mutate: (plan: Plan) => void, opts?: { solve?: boolean }): void;
  replacePresent(mutate: (plan: Plan) => void): void; // edit present without a history entry or solve (drag)
  undo(): void;
  redo(): void;
  setTool(t: ToolId): void;
  select(s: Selection): void;
  setActiveFloor(id: Id): void;
  setPending(ids: Id[]): void;
  setDraft(d: Vec[]): void;
  setPrompt(p: Prompt | null): void;
  setError(e: string | null): void;
  setSnapMm(v: number): void;
  loadPlan(plan: Plan): void;
  newPlan(name: string): void;
}
