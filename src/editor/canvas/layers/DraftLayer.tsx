import type { Vec } from "@/geometry/vec";
import { EDITOR_CONFIG } from "@/config/editor";

/** The room tool's provisional polyline: drawn points plus the segments joining them. */
export function DraftLayer({ draft, scale }: { draft: Vec[]; scale: number }) {
  if (draft.length === 0) return null;
  const r = EDITOR_CONFIG.pointRadiusPx / scale;
  return (
    <g className="draft">
      <polyline
        strokeWidth={EDITOR_CONFIG.strokePx}
        points={draft.map((p) => `${p.x},${p.y}`).join(" ")}
      />
      {draft.map((p) => (
        // Coordinates are the identity here: the room tool only appends and
        // removes from the end, and two draft vertices never share a position
        // because a click within the snap radius of the first one closes the
        // polygon instead of adding a point.
        <circle key={`${p.x},${p.y}`} cx={p.x} cy={p.y} r={r} />
      ))}
    </g>
  );
}
