import type { Plan, Id } from "@/model/types";
import { floorOpenings } from "@/model/queries";
import { openingGeometry } from "@/geometry/openingGeometry";
import { arcPath } from "@/geometry/svgArc";
import { EDITOR_CONFIG } from "@/config/editor";
import type { Selection } from "@/editor/store/types";

/** The gap is filled with the room background colour, hiding the wall behind it; the symbol
 * (a window's two lines, or a door's leaf and swing arc) is drawn on top. */
export function OpeningsLayer({
  plan,
  floorId,
  selection,
}: {
  plan: Plan;
  floorId: Id;
  selection: Selection;
}) {
  return (
    <g className="openings">
      {floorOpenings(plan, floorId).map((o) => {
        const g = openingGeometry(plan, o);
        const selected = selection?.type === "opening" && selection.id === o.id;
        return (
          <g key={o.id} data-id={o.id} className={selected ? "selected" : ""}>
            <polygon className="gap" points={g.gap.map((p) => `${p.x},${p.y}`).join(" ")} />
            {g.symbol.lines.map(([a, b]) => (
              <line
                key={`${a.x},${a.y}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                strokeWidth={EDITOR_CONFIG.strokePx}
              />
            ))}
            {g.symbol.arc && (
              <path
                d={arcPath(
                  g.symbol.arc.c,
                  g.symbol.arc.r,
                  g.symbol.arc.startDeg,
                  g.symbol.arc.endDeg,
                )}
                strokeWidth={EDITOR_CONFIG.strokePx}
              />
            )}
          </g>
        );
      })}
    </g>
  );
}
