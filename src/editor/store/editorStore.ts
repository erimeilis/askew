import { create } from "zustand";
import type { Id, Plan } from "@/model/types";
import { emptyPlan } from "@/model/factory";
import { SOLVER_CONFIG } from "@/config/solver";
import { t } from "@/i18n";
import { solveFloor, type SolveResult } from "@/solver/solveFloor";
import { initHistory, push, undo, redo } from "./history";
import { applySolve } from "./applySolve";
import { scheduleAutosave } from "@/persistence/browser/autosave";
import type { EditorState } from "./types";

/**
 * Diagnostics for every floor of a freshly-installed plan. The plan's coordinates were already
 * fitted when it was saved (or when the prior state was recorded), so this only solves for the
 * SolveResult to show in the panel — it never writes coordinates back, unlike `applySolve`.
 */
function solveAllFloors(plan: Plan): Record<Id, SolveResult> {
  const results: Record<Id, SolveResult> = {};
  for (const floor of plan.floors) {
    results[floor.id] = solveFloor(plan, floor.id, SOLVER_CONFIG);
  }
  return results;
}

/** Transient tool state cleared whenever the plan changes underneath it (undo/redo/floor switch/tool switch). */
const resetTool = {
  pending: [] as string[],
  draft: [] as { x: number; y: number }[],
  prompt: null,
  selection: null,
};

export const useEditorStore = create<EditorState>((set, get) => ({
  history: initHistory(emptyPlan("")),
  results: {},
  activeFloorId: "",
  selection: null,
  tool: "select",
  pending: [],
  draft: [],
  prompt: null,
  error: null,
  snapMm: 0,
  plan: () => get().history.present,
  update(mutate, opts = {}) {
    const next: Plan = structuredClone(get().history.present);
    mutate(next);
    let results = get().results;
    let error: string | null = null;
    let plan = next;
    if (opts.solve !== false) {
      const r = applySolve(next, get().activeFloorId, SOLVER_CONFIG);
      plan = r.plan;
      results = { ...results, [r.result.floorId]: r.result };
      if (!r.result.converged) error = t("solve.notConverged");
    }
    set({ history: push(get().history, plan), results, error });
    scheduleAutosave(plan, (e) => set({ error: String(e) }));
  },
  replacePresent(mutate) {
    const next = structuredClone(get().history.present);
    mutate(next);
    set({ history: { ...get().history, present: next } });
  },
  // undo/redo restore an already-fitted plan verbatim (no coordinate write-back), but the
  // diagnostics shown in the panel were computed for whichever plan was present when they last
  // ran, so the active floor's SolveResult must be recomputed to match what is now on screen.
  undo: () =>
    set((s) => {
      const history = undo(s.history);
      if (history === s.history) return { history, ...resetTool }; // nothing to undo
      const result = solveFloor(history.present, s.activeFloorId, SOLVER_CONFIG);
      return { history, results: { ...s.results, [s.activeFloorId]: result }, ...resetTool };
    }),
  redo: () =>
    set((s) => {
      const history = redo(s.history);
      if (history === s.history) return { history, ...resetTool }; // nothing to redo
      const result = solveFloor(history.present, s.activeFloorId, SOLVER_CONFIG);
      return { history, results: { ...s.results, [s.activeFloorId]: result }, ...resetTool };
    }),
  setTool: (tool) => set({ tool, ...resetTool }),
  select: (selection) => set({ selection }),
  setActiveFloor: (activeFloorId) => set({ activeFloorId, ...resetTool }),
  setPending: (pending) => set({ pending }),
  setDraft: (draft) => set({ draft }),
  setPrompt: (prompt) => set({ prompt }),
  setError: (error) => set({ error }),
  setSnapMm: (snapMm) => set({ snapMm }),
  loadPlan: (plan) =>
    set({
      history: initHistory(plan),
      results: solveAllFloors(plan),
      activeFloorId: plan.floors[0].id,
      error: null,
      ...resetTool,
    }),
  newPlan: (name) => get().loadPlan(emptyPlan(name)),
}));
