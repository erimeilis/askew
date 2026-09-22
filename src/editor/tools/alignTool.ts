import type { Tool } from "./types";
import type { Plan, Id, Axis } from "@/model/types";
import { createId } from "@/model/factory";
import { askChoice } from "./promptHelpers";

export function addAlign(plan: Plan, a: Id, b: Id, axis: Axis): void {
  if (a === b) throw new Error("align needs two points");
  plan.measurements.push({ id: createId("m"), kind: "align", a, b, axis });
}

export const alignTool: Tool = {
  id: "align",
  labelKey: "tool.align",
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
    askChoice(s, "align.prompt.axis", ["x", "y"], (axis) =>
      s.update((p) => addAlign(p, a, b, axis as Axis)),
    );
  },
  onEscape(s) {
    s.setPending([]);
    s.setPrompt(null);
  },
};
