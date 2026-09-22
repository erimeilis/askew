import type { Plan, Id } from "@/model/types";
import { floorFixtures } from "@/model/queries";
import { fixtureRect } from "@/geometry/fixtureGeometry";
import { polygonCentroid } from "@/geometry/polygon";
import { EDITOR_CONFIG } from "@/config/editor";
import type { Selection } from "@/editor/store/types";

export function FixturesLayer({
  plan,
  floorId,
  selection,
}: {
  plan: Plan;
  floorId: Id;
  selection: Selection;
}) {
  return (
    <g className="fixtures">
      {floorFixtures(plan, floorId).map((f) => {
        const rect = fixtureRect(plan, f);
        const c = polygonCentroid(rect);
        const selected = selection?.type === "fixture" && selection.id === f.id;
        return (
          <g key={f.id} data-id={f.id} className={selected ? "selected" : ""}>
            <polygon
              strokeWidth={EDITOR_CONFIG.strokePx}
              points={rect.map((p) => `${p.x},${p.y}`).join(" ")}
            />
            <text x={c.x} y={c.y}>
              {f.name}
            </text>
          </g>
        );
      })}
    </g>
  );
}
