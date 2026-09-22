import type { Id, Plan } from "@/model/types";
import type { SolveResult } from "@/solver/solveFloor";
import type { ToolId } from "@/editor/tools/types";
import { floorRooms } from "@/model/queries";

export type CoachStepId = "outline" | "measure" | "redundant" | "residuals";

/**
 * The number of spare measurements a floor needs before the coach considers the redundancy
 * step done. `SolveResult.redundancy` is exactly "measured minus needed", so 1 means the
 * plan can prove a disagreement (Task spec, step 3).
 */
const REDUNDANCY_TARGET = 1;
/** Corners needed before a room can be closed (roomTool.ts requires the same minimum). */
const MIN_ROOM_CORNERS = 3;
/** Points a length measurement needs before it commits (measureTool.ts). */
const MEASURE_POINTS_NEEDED = 2;

/**
 * Snapshot of everything a coach step's predicates need, gathered once per render by the
 * hook that owns the coach panel (`useCoach.ts`). Kept plain data — no React — so the step
 * table below is unit-testable without a DOM.
 */
export interface CoachStepContext {
  plan: Plan;
  floorId: Id;
  tool: ToolId;
  draftCount: number; // corners placed by the in-progress room draft
  pendingCount: number; // points picked so far by the in-progress measure click
  result: SolveResult | undefined; // the active floor's latest solve, if any
}

export interface CoachLiveCheck {
  labelKey: string;
  params?: Record<string, string | number>;
  done: boolean;
}

export interface CoachStep {
  id: CoachStepId;
  titleKey: string;
  bodyKey: string;
  /** Live, ticking checklist shown under the body while this step is current. */
  liveChecks(ctx: CoachStepContext): CoachLiveCheck[];
  /** True once the step's goal has actually been reached in the plan/solve, so the coach can
   *  move on by itself. The closing step ("residuals") never completes — see its comment. */
  isComplete(ctx: CoachStepContext): boolean;
}

export const COACH_STEPS: CoachStep[] = [
  {
    id: "outline",
    titleKey: "coach.step.outline.title",
    bodyKey: "coach.step.outline.body",
    liveChecks: (ctx) => [
      { labelKey: "coach.step.outline.check.tool", done: ctx.tool === "room" },
      {
        labelKey: "coach.step.outline.check.corners",
        params: { count: ctx.draftCount },
        done: ctx.draftCount >= MIN_ROOM_CORNERS,
      },
    ],
    isComplete: (ctx) => floorRooms(ctx.plan, ctx.floorId).length > 0,
  },
  {
    id: "measure",
    titleKey: "coach.step.measure.title",
    bodyKey: "coach.step.measure.body",
    liveChecks: (ctx) => [
      { labelKey: "coach.step.measure.check.tool", done: ctx.tool === "measure" },
      {
        labelKey: "coach.step.measure.check.points",
        params: { count: ctx.pendingCount },
        done: ctx.pendingCount >= MEASURE_POINTS_NEEDED,
      },
    ],
    // The task spec says "at least one measurement exists", with no floor qualifier (unlike
    // step 1, which is explicit about the active floor) — a plan-wide check on purpose.
    isComplete: (ctx) => ctx.plan.measurements.length > 0,
  },
  {
    id: "redundant",
    titleKey: "coach.step.redundant.title",
    bodyKey: "coach.step.redundant.body",
    liveChecks: (ctx) => {
      const spare = ctx.result?.redundancy ?? 0;
      return [
        {
          labelKey: "coach.step.redundant.check.spare",
          params: { count: spare },
          done: spare >= REDUNDANCY_TARGET,
        },
      ];
    },
    isComplete: (ctx) => (ctx.result?.redundancy ?? 0) >= REDUNDANCY_TARGET,
  },
  {
    id: "residuals",
    titleKey: "coach.step.residuals.title",
    bodyKey: "coach.step.residuals.body",
    liveChecks: () => [],
    // Closing explanation: it must never mark itself done, so `selectCurrentStepIndex` always
    // lands here once the first three goals are met and the panel shows the Finish button
    // instead of auto-advancing past it. Do not "fix" this into a completable step.
    isComplete: () => false,
  },
];

/**
 * The step to show right now: the first one whose goal is not yet met, so someone already
 * ahead (e.g. reopening a saved plan) starts wherever they actually are, not at step 1.
 * `COACH_STEPS` always ends on a step that never completes, so this never falls through to -1.
 */
export function selectCurrentStepIndex(steps: CoachStep[], ctx: CoachStepContext): number {
  const idx = steps.findIndex((step) => !step.isComplete(ctx));
  return idx === -1 ? steps.length - 1 : idx;
}
