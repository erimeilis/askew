import type { Tool } from "./types";
import type { Plan, Id } from "@/model/types";
import { createId } from "@/model/factory";
import { wallById } from "@/model/queries";
import { askText, askNumber } from "./promptHelpers";

export function addFixture(
  plan: Plan,
  wallId: Id,
  name: string,
  offset: number,
  depth: number,
  w: number,
  d: number,
): void {
  const wall = wallById(plan, wallId);
  plan.fixtures.push({
    id: createId("x"),
    floorId: wall.floorId,
    name,
    anchor: { wallId, offset, depth },
    w,
    d,
  });
}

export const fixtureTool: Tool = {
  id: "fixture",
  labelKey: "tool.fixture",
  onClick(_w, hit, s) {
    if (hit?.type !== "wall") return;
    const wallId = hit.id;
    askText(s, "fixture.prompt.name", (name) => {
      askNumber(s, "fixture.prompt.offset", {}, (offset) => {
        askNumber(s, "fixture.prompt.depth", {}, (depth) => {
          askNumber(s, "fixture.prompt.w", {}, (w) => {
            askNumber(s, "fixture.prompt.d", {}, (d) => {
              s.update((p) => addFixture(p, wallId, name, offset, depth, w, d));
            });
          });
        });
      });
    });
  },
  onEscape(s) {
    s.setPrompt(null);
  },
};
