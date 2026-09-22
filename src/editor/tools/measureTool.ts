import type { Tool } from "./types";
import type { Plan, Id } from "@/model/types";
import { createId } from "@/model/factory";
import { askNumber } from "./promptHelpers";
import { measurementLabel } from "@/editor/panels/measurementLabel";

export function addLength(plan: Plan, a: Id, b: Id, value: number): void {
  if (a === b) throw new Error("length needs two distinct points");
  plan.measurements.push({ id: createId("m"), kind: "length", a, b, value });
}

export const measureTool: Tool = {
  id: "measure",
  labelKey: "tool.measure",
  onClick(_w, hit, s) {
    if (hit?.type !== "point") return;
    const pending = [...s.pending, hit.id];
    if (pending.length < 2) {
      s.setPending(pending);
      return;
    }
    const [a, b] = pending;
    s.setPending([]);
    if (a === b) return;
    // Same labelling as the measurements panel: ask a human "Length P1 → P2 (mm)",
    // never raw generated ids.
    const label = measurementLabel(s.plan(), { id: "", kind: "length", a, b, value: 0 });
    askNumber(s, "measure.prompt.length", { label }, (value) =>
      s.update((p) => addLength(p, a, b, value)),
    );
  },
  onEscape(s) {
    s.setPending([]);
    s.setPrompt(null);
  },
};
