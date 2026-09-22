import type { Tool } from "./types";
import type { Plan, Id, Side } from "@/model/types";
import type { Vec } from "@/geometry/vec";
import { dist } from "@/geometry/vec";
import { createId } from "@/model/factory";
import { floorPoints, findWallBetween } from "@/model/queries";
import { EDITOR_CONFIG } from "@/config/editor";
import { askText } from "./promptHelpers";

function signedArea(pts: Vec[]): number {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    s += p.x * q.y - q.x * p.y;
  }
  return s / 2;
}

/** y-down screen coordinates: positive signed area = clockwise on screen, whose outward side is 'right'. */
export function closeRoom(
  plan: Plan,
  floorId: Id,
  draft: Vec[],
  name: string,
  snapMm = 0,
): { roomId: Id } {
  const side: Side = signedArea(draft) > 0 ? "right" : "left";
  const ids = draft.map((v) => {
    const near = floorPoints(plan, floorId).find((p) => dist(p, v) <= snapMm);
    if (near) return near.id;
    const id = createId("p");
    plan.points.push({ id, floorId, x: v.x, y: v.y });
    return id;
  });
  ids.forEach((a, i) => {
    const b = ids[(i + 1) % ids.length];
    if (!findWallBetween(plan, a, b)) {
      plan.walls.push({
        id: createId("w"),
        floorId,
        a,
        b,
        thickness: EDITOR_CONFIG.defaultWallThicknessMm,
        side,
      });
    }
  });
  const roomId = createId("r");
  plan.rooms.push({ id: roomId, floorId, name, pointIds: ids });
  return { roomId };
}

export const roomTool: Tool = {
  id: "room",
  labelKey: "tool.room",
  onClick(w, _hit, s) {
    const first = s.draft[0];
    if (s.draft.length >= 3 && first && dist(first, w) <= s.snapMm) {
      this.onEnter!(s);
      return;
    }
    s.setDraft([...s.draft, w]);
  },
  onEnter(s) {
    if (s.draft.length < 3) return;
    const draft = s.draft;
    const snap = s.snapMm;
    askText(s, "room.prompt.name", (name) => {
      s.update((p) => {
        closeRoom(p, s.activeFloorId, draft, name, snap);
      });
      s.setDraft([]);
    });
  },
  onEscape(s) {
    s.setDraft([]);
    s.setPrompt(null);
  },
};
