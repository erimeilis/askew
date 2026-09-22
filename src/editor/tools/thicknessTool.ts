import type { Tool } from "./types";
import type { Plan, Id } from "@/model/types";
import { createId } from "@/model/factory";
import { wallById } from "@/model/queries";
import { askNumber } from "./promptHelpers";

/** Sets the extrusion on both walls: otherwise the drawing shows a thick wall on one side of the gap and a hairline on the other. */
export function addThickness(plan: Plan, wallA: Id, wallB: Id, value: number): void {
  if (wallA === wallB) throw new Error("thickness needs two different wall faces");
  plan.measurements.push({ id: createId("m"), kind: "thickness", wallA, wallB, value });
  wallById(plan, wallA).thickness = value;
  wallById(plan, wallB).thickness = value;
}

export const thicknessTool: Tool = {
  id: "thickness",
  labelKey: "tool.thickness",
  onClick(_w, hit, s) {
    if (hit?.type !== "wall") return;
    const pending = [...s.pending, hit.id];
    if (pending.length < 2) {
      s.setPending(pending);
      return;
    }
    const [a, b] = pending;
    s.setPending([]);
    if (a === b) return;
    askNumber(s, "measure.prompt.thickness", {}, (v) => s.update((p) => addThickness(p, a, b, v)));
  },
  onEscape(s) {
    s.setPending([]);
    s.setPrompt(null);
  },
};
