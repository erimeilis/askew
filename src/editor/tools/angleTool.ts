import type { Tool } from "./types";
import type { Plan, Id } from "@/model/types";
import { createId } from "@/model/factory";
import { askNumber } from "./promptHelpers";
import { measurementLabel } from "@/editor/panels/measurementLabel";

export function addAngle(plan: Plan, a: Id, b: Id, c: Id, value: number): void {
  if (new Set([a, b, c]).size !== 3) throw new Error("angle needs three distinct points");
  plan.measurements.push({ id: createId("m"), kind: "angle", a, b, c, value });
}

export const angleTool: Tool = {
  id: "angle",
  labelKey: "tool.angle",
  onClick(_w, hit, s) {
    if (hit?.type !== "point") return;
    const pending = [...s.pending, hit.id];
    if (pending.length < 3) {
      s.setPending(pending);
      return;
    }
    const [a, b, c] = pending;
    s.setPending([]);
    if (new Set([a, b, c]).size !== 3) return;
    // Same labelling as the measurements panel: ask a human "Angle at ∠ P1-P2-P3 (°)",
    // never raw generated ids.
    const label = measurementLabel(s.plan(), { id: "", kind: "angle", a, b, c, value: 0 });
    askNumber(s, "measure.prompt.angle", { label }, (v) =>
      s.update((p) => addAngle(p, a, b, c, v)),
    );
  },
  onEscape(s) {
    s.setPending([]);
    s.setPrompt(null);
  },
};
