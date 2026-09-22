import type { Plan, Id } from "@/model/types";
import { floorOpenings } from "@/model/queries";
import { openingGeometry } from "@/geometry/openingGeometry";
import { arcPath } from "@/geometry/svgArc";
import { EDITOR_CONFIG } from "@/config/editor";
import type { EXPORT_CONFIG } from "@/config/export";
import { polygon, line, path } from "./svgPrimitives";

/** A gap filled with the page background colour occludes the wall polygon drawn underneath it
 * (the openings group is emitted right after the walls group), plus the door/window symbol on
 * top: a window's two lines, or a door's leaf and swing arc. */
export function openingsSvg(plan: Plan, floorId: Id, cfg: typeof EXPORT_CONFIG): string {
  const gapAttrs = { fill: cfg.colours.background, stroke: "none" };
  const symAttrs = { stroke: cfg.colours.openings, "stroke-width": EDITOR_CONFIG.strokePx };
  return floorOpenings(plan, floorId)
    .map((o) => {
      const g = openingGeometry(plan, o);
      const lines = g.symbol.lines.map(([a, b]) => line(a, b, symAttrs)).join("");
      const arc = g.symbol.arc
        ? path(
            arcPath(g.symbol.arc.c, g.symbol.arc.r, g.symbol.arc.startDeg, g.symbol.arc.endDeg),
            { ...symAttrs, fill: "none" },
          )
        : "";
      return polygon(g.gap, gapAttrs) + lines + arc;
    })
    .join("");
}
