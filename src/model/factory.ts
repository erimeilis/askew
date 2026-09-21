import type { Plan, Floor, Id } from "./types";
import { t } from "@/i18n";
import { CURRENT_VERSION } from "./migrations";
let counter = 0;
export function createId(prefix: string): Id {
  counter++;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}`;
}
export function newFloor(index: number): Floor {
  return { id: createId("f"), name: t("floor.default", { n: index }), elevation: 0 };
}
export function emptyPlan(name: string): Plan {
  return {
    version: CURRENT_VERSION,
    name,
    floors: [newFloor(1)],
    points: [],
    walls: [],
    rooms: [],
    openings: [],
    fixtures: [],
    measurements: [],
  };
}
