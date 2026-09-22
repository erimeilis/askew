import type { Tool } from "./types";
import type { Id, Plan } from "@/model/types";
import { deleteSelection, movePoint } from "@/editor/store/mutations";
import { pointById } from "@/model/queries";

// Transient drag state: which point is moving, and the plan exactly as it was when the drag
// began. `onDrag` mutates the store's present via `replacePresent` (never pushes history), so
// this module-level snapshot is the only place the true pre-drag plan survives until release.
let dragId: Id | null = null;
let dragOrigin: Plan | null = null;

export const selectTool: Tool = {
  id: "select",
  labelKey: "tool.select",
  onClick(_w, hit, s) {
    s.select(hit ? { type: hit.type, id: hit.id } : null);
  },
  onDelete(s) {
    if (!s.selection) return;
    const sel = s.selection;
    s.update((p) => deleteSelection(p, sel));
    s.select(null);
  },
  onDragStart(hit, s) {
    if (hit?.type !== "point") return;
    dragId = hit.id;
    dragOrigin = s.plan();
    s.select({ type: "point", id: hit.id });
  },
  onDrag(world, s) {
    if (!dragId) return;
    const id = dragId;
    s.replacePresent((p) => movePoint(p, id, world));
  },
  onDragEnd(s) {
    const id = dragId;
    const origin = dragOrigin;
    dragId = null;
    dragOrigin = null;
    if (!id || !origin) return;
    const before = pointById(origin, id);
    const after = pointById(s.plan(), id);
    if (before.x === after.x && before.y === after.y) return; // ended where it began: no entry
    // Restore the true pre-drag content into `present`, then commit the move through `update`:
    // exactly one history entry (the real "before"), solved once on release.
    s.replacePresent((p) => Object.assign(p, origin));
    s.update((p) => movePoint(p, id, after));
  },
  onEscape(_s) {
    dragId = null;
    dragOrigin = null;
  },
};
