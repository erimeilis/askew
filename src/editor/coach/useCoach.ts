import { useEffect, useState } from "react";
import { useEditorStore } from "@/editor/store/editorStore";
import { floorRooms } from "@/model/queries";
import { useCoachStore } from "./coachStore";
import {
  COACH_STEPS,
  selectCurrentStepIndex,
  type CoachLiveCheck,
  type CoachStep,
  type CoachStepContext,
} from "./steps";

export interface UseCoachResult {
  visible: boolean;
  step: CoachStep;
  stepIndex: number;
  totalSteps: number;
  liveChecks: CoachLiveCheck[];
  isLastStep: boolean;
  skip(): void;
  next(): void;
  finish(): void;
}

/**
 * Wires the pure `COACH_STEPS` table to live editor state. The step shown is
 * `max(autoIndex, manualIndex)`: `autoIndex` is the first goal not yet met (real progress),
 * `manualIndex` is how far "Next hint" has been clicked ahead of that. Real progress can only
 * ever push the shown step forward, matching the spec: "Next only skips ahead voluntarily."
 */
export function useCoach(): UseCoachResult {
  const dismissed = useCoachStore((s) => s.dismissed);
  const loadDismissed = useCoachStore((s) => s.loadDismissed);
  const skip = useCoachStore((s) => s.skip);

  const plan = useEditorStore((s) => s.plan());
  const floorId = useEditorStore((s) => s.activeFloorId);
  const tool = useEditorStore((s) => s.tool);
  const draftCount = useEditorStore((s) => s.draft.length);
  const pendingCount = useEditorStore((s) => s.pending.length);
  const result = useEditorStore((s) => s.results[s.activeFloorId]);

  const [manualIndex, setManualIndex] = useState(0);

  useEffect(() => {
    void loadDismissed();
  }, [loadDismissed]);

  // A "Next hint" click on one floor must not leak ahead after switching floors — reset the
  // voluntary skip-ahead the moment the active floor changes.
  useEffect(() => {
    setManualIndex(0);
  }, [floorId]);

  const ctx: CoachStepContext = { plan, floorId, tool, draftCount, pendingCount, result };
  const autoIndex = selectCurrentStepIndex(COACH_STEPS, ctx);
  const stepIndex = Math.max(autoIndex, manualIndex);
  const step = COACH_STEPS[stepIndex];

  // Reappears whenever the active floor has no rooms, even after Skip — that is exactly when
  // someone is lost again, and no persisted dismissal should keep the panel hidden from them.
  // Do not "fix" this away by gating it purely on `dismissed`.
  const hasNoRooms = floorRooms(plan, floorId).length === 0;
  const visible = hasNoRooms || dismissed === false;

  return {
    visible,
    step,
    stepIndex,
    totalSteps: COACH_STEPS.length,
    liveChecks: step.liveChecks(ctx),
    isLastStep: stepIndex === COACH_STEPS.length - 1,
    skip,
    next: () => setManualIndex((i) => Math.min(i + 1, COACH_STEPS.length - 1)),
    finish: skip,
  };
}
