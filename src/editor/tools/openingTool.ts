import type { Tool } from "./types";
import type { Plan, Id, OpeningKind } from "@/model/types";
import { createId } from "@/model/factory";
import { wallById, wallLength } from "@/model/queries";
import { askChoice, askNumber } from "./promptHelpers";
import { t } from "@/i18n";

/** Rejects rather than drawing something impossible: a gap cannot run past the wall it cuts. */
export function addOpening(
  plan: Plan,
  wallId: Id,
  kind: OpeningKind,
  offset: number,
  width: number,
): void {
  const wall = wallById(plan, wallId);
  if (offset + width > wallLength(plan, wall)) {
    throw new Error(`opening exceeds wall length`);
  }
  plan.openings.push({ id: createId("o"), wallId, kind, offset, width });
}

export const openingTool: Tool = {
  id: "opening",
  labelKey: "tool.opening",
  onClick(_w, hit, s) {
    if (hit?.type !== "wall") return;
    const wallId = hit.id;
    askChoice(s, "opening.prompt.kind", [t("opening.door"), t("opening.window")], (choice) => {
      const kind: OpeningKind = choice === t("opening.door") ? "door" : "window";
      askNumber(s, "opening.prompt.offset", {}, (offset) => {
        askNumber(s, "opening.prompt.width", {}, (width) => {
          s.update((p) => addOpening(p, wallId, kind, offset, width));
        });
      });
    });
  },
  onEscape(s) {
    s.setPrompt(null);
  },
};
