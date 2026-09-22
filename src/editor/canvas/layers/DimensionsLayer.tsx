import type { Plan, Id } from "@/model/types";
import { floorDimensions, formatMm } from "@/export/dimensions";
import { EXPORT_CONFIG } from "@/config/export";
import { EDITOR_CONFIG } from "@/config/editor";

/** Annotated measurement lines outside every wall on the active floor, showing solved
 * (fitted) lengths — never a typed Measurement value. */
export function DimensionsLayer({ plan, floorId }: { plan: Plan; floorId: Id }) {
  const lines = floorDimensions(plan, floorId, {
    offsetMm: EXPORT_CONFIG.dimensionOffsetMm,
    textFmt: formatMm,
  });
  return (
    <g className="dimensions">
      {lines.map((d) => (
        <g key={`${d.a.x},${d.a.y}-${d.b.x},${d.b.y}`}>
          <line x1={d.a.x} y1={d.a.y} x2={d.b.x} y2={d.b.y} strokeWidth={EDITOR_CONFIG.strokePx} />
          {d.ticks.map(([t0, t1]) => (
            <line
              key={`${t0.x},${t0.y}`}
              x1={t0.x}
              y1={t0.y}
              x2={t1.x}
              y2={t1.y}
              strokeWidth={EDITOR_CONFIG.strokePx}
            />
          ))}
          <text x={d.textAt.x} y={d.textAt.y} style={{ fontSize: EXPORT_CONFIG.dimensionTextMm }}>
            {d.text}
          </text>
        </g>
      ))}
    </g>
  );
}
