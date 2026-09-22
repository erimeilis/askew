import type { Plan, Id } from "@/model/types";
import { floorRooms, floorWalls, pointById } from "@/model/queries";
import { roomWallOutlines, wallOutline } from "@/geometry/wallOutline";
import { EDITOR_CONFIG } from "@/config/editor";
import type { Selection } from "@/editor/store/types";

export function WallsLayer({
  plan,
  floorId,
  selection,
}: {
  plan: Plan;
  floorId: Id;
  selection: Selection;
}) {
  const drawn = new Set<Id>();
  const polys: { id: Id; pts: { x: number; y: number }[] }[] = [];
  for (const r of floorRooms(plan, floorId)) {
    for (const o of roomWallOutlines(plan, r)) {
      if (!drawn.has(o.wall.id)) {
        drawn.add(o.wall.id);
        polys.push({ id: o.wall.id, pts: o.polygon });
      }
    }
  }
  for (const w of floorWalls(plan, floorId)) {
    if (!drawn.has(w.id)) {
      polys.push({
        id: w.id,
        pts: wallOutline(pointById(plan, w.a), pointById(plan, w.b), w.thickness, w.side),
      });
    }
  }
  return (
    <g className="walls">
      {polys.map((p) => (
        <polygon
          key={p.id}
          data-id={p.id}
          className={selection?.type === "wall" && selection.id === p.id ? "selected" : ""}
          strokeWidth={EDITOR_CONFIG.strokePx}
          points={p.pts.map((q) => `${q.x},${q.y}`).join(" ")}
        />
      ))}
    </g>
  );
}
