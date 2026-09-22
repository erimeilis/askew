import type { Plan, Id } from "@/model/types";
import { floorPoints } from "@/model/queries";
import { EDITOR_CONFIG } from "@/config/editor";
import type { Selection } from "@/editor/store/types";

export function PointsLayer({
  plan,
  floorId,
  scale,
  selection,
  pending,
  unconstrained,
}: {
  plan: Plan;
  floorId: Id;
  scale: number;
  selection: Selection;
  pending: Id[];
  unconstrained: Id[];
}) {
  const r = EDITOR_CONFIG.pointRadiusPx / scale;
  return (
    <g className="points">
      {floorPoints(plan, floorId).map((p) => (
        <circle
          key={p.id}
          cx={p.x}
          cy={p.y}
          r={r}
          className={[
            selection?.type === "point" && selection.id === p.id ? "selected" : "",
            pending.includes(p.id) ? "pending" : "",
            unconstrained.includes(p.id) ? "unconstrained" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        />
      ))}
    </g>
  );
}
