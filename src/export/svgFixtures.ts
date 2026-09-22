import type { Plan, Id } from "@/model/types";
import { floorFixtures } from "@/model/queries";
import { fixtureRect } from "@/geometry/fixtureGeometry";
import { polygonCentroid } from "@/geometry/polygon";
import { EDITOR_CONFIG } from "@/config/editor";
import type { EXPORT_CONFIG } from "@/config/export";
import { polygon, text } from "./svgPrimitives";

/** A fixture is an unfilled rectangle plus its name centred inside it. */
export function fixturesSvg(plan: Plan, floorId: Id, cfg: typeof EXPORT_CONFIG): string {
  const rectAttrs = {
    fill: "none",
    stroke: cfg.colours.fixtures,
    "stroke-width": EDITOR_CONFIG.strokePx,
  };
  const nameAttrs = {
    fill: cfg.colours.fixtures,
    "font-size": cfg.labelTextMm,
    "text-anchor": "middle",
  };
  return floorFixtures(plan, floorId)
    .map((f) => {
      const rect = fixtureRect(plan, f);
      return polygon(rect, rectAttrs) + text(polygonCentroid(rect), f.name, nameAttrs);
    })
    .join("");
}
