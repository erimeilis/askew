import { describe, it, expect } from "vitest";
import { planToJson, jsonToPlan } from "@/persistence/serialize";
import { emptyPlan } from "@/model/factory";

describe("serialize", () => {
  it("round-trips and rounds coordinates to 0.1 mm", () => {
    const p = emptyPlan("h");
    p.points.push({ id: "a", floorId: p.floors[0].id, x: 1.23456, y: 2 });
    const back = jsonToPlan(planToJson(p));
    expect(back.points[0].x).toBe(1.2);
    expect(back.name).toBe("h");
  });

  it("rejects garbage", () => {
    expect(() => jsonToPlan('{"version":1}')).toThrow();
  });
});
