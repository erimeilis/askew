import { create } from "zustand";
import type { Plan } from "@/model/types";
import { emptyPlan } from "@/model/factory";
import { SOLVER_CONFIG } from "@/config/solver";
import { t } from "@/i18n";
import { initHistory, push, undo, redo } from "./history";
import { applySolve } from "./applySolve";
import { scheduleAutosave } from "@/persistence/browser/autosave";
import type { EditorState } from "./types";

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
  undo: () => set((s) => ({ history: undo(s.history), ...resetTool })),
  redo: () => set((s) => ({ history: redo(s.history), ...resetTool })),
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
      results: {},
      activeFloorId: plan.floors[0].id,
      error: null,
      ...resetTool,
    }),
  newPlan: (name) => get().loadPlan(emptyPlan(name)),
}));
