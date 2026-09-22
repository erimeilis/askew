import type { Plan, Id } from "@/model/types";
import { floorRooms, pointById } from "@/model/queries";
import { polygonArea, polygonCentroid } from "@/geometry/polygon";
import { EXPORT_CONFIG } from "@/config/export";
import type { Selection } from "@/editor/store/types";

export function RoomsLayer({
  plan,
  floorId,
  selection,
}: {
  plan: Plan;
  floorId: Id;
  selection: Selection;
}) {
  return (
    <g className="rooms">
      {floorRooms(plan, floorId).map((r) => {
        const pts = r.pointIds.map((id) => pointById(plan, id));
        const c = polygonCentroid(pts);
        const area = (polygonArea(pts) / 1e6).toFixed(EXPORT_CONFIG.areaDecimals);
        const selected = selection?.type === "room" && selection.id === r.id;
        return (
          <g key={r.id} className={selected ? "selected" : ""}>
            <polygon points={pts.map((p) => `${p.x},${p.y}`).join(" ")} />
            <text x={c.x} y={c.y} className="label">
              {r.name}
            </text>
            <text x={c.x} y={c.y + EXPORT_CONFIG.labelTextMm} className="label">
              {area} m²
            </text>
          </g>
        );
      })}
    </g>
  );
}
