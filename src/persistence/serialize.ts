import type { Plan } from "@/model/types";
import { parsePlan } from "@/model/schema";
import { STORAGE_CONFIG } from "@/config/storage";

const coordinateRoundingFactor = 10 ** STORAGE_CONFIG.coordinateDecimals;
const r1 = (v: number) => Math.round(v * coordinateRoundingFactor) / coordinateRoundingFactor;

export function planToJson(plan: Plan): string {
  return JSON.stringify(
    { ...plan, points: plan.points.map((p) => ({ ...p, x: r1(p.x), y: r1(p.y) })) },
    null,
    2,
  );
}

export function jsonToPlan(text: string): Plan {
  return parsePlan(JSON.parse(text));
}
