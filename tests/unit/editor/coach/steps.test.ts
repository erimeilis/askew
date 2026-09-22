import { describe, it, expect } from "vitest";
import { emptyPlan } from "@/model/factory";
import type { Plan } from "@/model/types";
import type { SolveResult } from "@/solver/solveFloor";
import { COACH_STEPS, selectCurrentStepIndex, type CoachStepContext } from "@/editor/coach/steps";

function baseResult(overrides: Partial<SolveResult> = {}): SolveResult {
  return {
    floorId: "f",
    points: [],
    residuals: [],
    rms: 0,
    converged: true,
    stop: "gradient",
    unconstrained: [],
    iterations: 0,
    redundancy: 0,
    ...overrides,
  };
}

function ctxFor(plan: Plan, overrides: Partial<CoachStepContext> = {}): CoachStepContext {
  return {
    plan,
    floorId: plan.floors[0].id,
    tool: "select",
    draftCount: 0,
    pendingCount: 0,
    result: undefined,
    ...overrides,
  };
}

describe("COACH_STEPS (pure, no React/DOM)", () => {
  it("has exactly the four steps in teaching order", () => {
    expect(COACH_STEPS.map((s) => s.id)).toEqual(["outline", "measure", "redundant", "residuals"]);
  });

  it("outline: live checks report tool selection and corner count", () => {
    const plan = emptyPlan("x");
    const ctx = ctxFor(plan, { tool: "room", draftCount: 2 });
    const checks = COACH_STEPS[0].liveChecks(ctx);
    expect(checks).toEqual([
      { labelKey: "coach.step.outline.check.tool", done: true },
      { labelKey: "coach.step.outline.check.corners", params: { count: 2 }, done: false },
    ]);
  });

  it("outline: is complete once the active floor has a room, and not before", () => {
    const plan = emptyPlan("x");
    const ctx = ctxFor(plan);
    expect(COACH_STEPS[0].isComplete(ctx)).toBe(false);
    plan.rooms.push({
      id: "r1",
      floorId: plan.floors[0].id,
      name: "",
      pointIds: ["p1", "p2", "p3"],
    });
    expect(COACH_STEPS[0].isComplete(ctxFor(plan))).toBe(true);
  });

  it("outline: a room on a DIFFERENT floor does not complete this floor's step", () => {
    const plan = emptyPlan("x");
    plan.rooms.push({ id: "r1", floorId: "other-floor", name: "", pointIds: ["p1", "p2", "p3"] });
    expect(COACH_STEPS[0].isComplete(ctxFor(plan))).toBe(false);
  });

  it("measure: is complete once any measurement exists", () => {
    const plan = emptyPlan("x");
    expect(COACH_STEPS[1].isComplete(ctxFor(plan))).toBe(false);
    plan.measurements.push({ id: "m1", kind: "length", a: "p1", b: "p2", value: 1000 });
    expect(COACH_STEPS[1].isComplete(ctxFor(plan))).toBe(true);
  });

  it("redundant: live check and completion track SolveResult.redundancy reaching 1", () => {
    const plan = emptyPlan("x");
    const notYet = ctxFor(plan, { result: baseResult({ redundancy: 0 }) });
    expect(COACH_STEPS[2].isComplete(notYet)).toBe(false);
    expect(COACH_STEPS[2].liveChecks(notYet)).toEqual([
      { labelKey: "coach.step.redundant.check.spare", params: { count: 0 }, done: false },
    ]);

    const reached = ctxFor(plan, { result: baseResult({ redundancy: 1 }) });
    expect(COACH_STEPS[2].isComplete(reached)).toBe(true);
    expect(COACH_STEPS[2].liveChecks(reached)[0].done).toBe(true);
  });

  it("redundant: treats a missing SolveResult as zero spare, not a crash", () => {
    const plan = emptyPlan("x");
    const ctx = ctxFor(plan, { result: undefined });
    expect(COACH_STEPS[2].isComplete(ctx)).toBe(false);
    expect(COACH_STEPS[2].liveChecks(ctx)[0].params).toEqual({ count: 0 });
  });

  it("residuals: the closing step never completes and has no live checks", () => {
    const plan = emptyPlan("x");
    plan.rooms.push({
      id: "r1",
      floorId: plan.floors[0].id,
      name: "",
      pointIds: ["p1", "p2", "p3"],
    });
    plan.measurements.push({ id: "m1", kind: "length", a: "p1", b: "p2", value: 1000 });
    const ctx = ctxFor(plan, { result: baseResult({ redundancy: 5 }) });
    expect(COACH_STEPS[3].isComplete(ctx)).toBe(false);
    expect(COACH_STEPS[3].liveChecks(ctx)).toEqual([]);
  });
});

describe("selectCurrentStepIndex", () => {
  it("starts at step 0 for a brand-new floor", () => {
    const plan = emptyPlan("x");
    expect(selectCurrentStepIndex(COACH_STEPS, ctxFor(plan))).toBe(0);
  });

  it("advances to the first INCOMPLETE step, not always the beginning", () => {
    const plan = emptyPlan("x");
    const floorId = plan.floors[0].id;
    plan.rooms.push({ id: "r1", floorId, name: "", pointIds: ["p1", "p2", "p3"] });
    plan.measurements.push({ id: "m1", kind: "length", a: "p1", b: "p2", value: 1000 });
    // Room and one measurement already exist (e.g. restored from a save); redundancy is
    // still 0, so someone reopening the coach should land on step 3 (index 2), not step 1.
    const ctx = ctxFor(plan, { floorId, result: baseResult({ redundancy: 0 }) });
    expect(selectCurrentStepIndex(COACH_STEPS, ctx)).toBe(2);
  });

  it("settles on the closing step once redundancy is reached, and never falls off the end", () => {
    const plan = emptyPlan("x");
    const floorId = plan.floors[0].id;
    plan.rooms.push({ id: "r1", floorId, name: "", pointIds: ["p1", "p2", "p3"] });
    plan.measurements.push({ id: "m1", kind: "length", a: "p1", b: "p2", value: 1000 });
    const ctx = ctxFor(plan, { floorId, result: baseResult({ redundancy: 3 }) });
    expect(selectCurrentStepIndex(COACH_STEPS, ctx)).toBe(3);
  });
});
