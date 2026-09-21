import { describe, it, expect } from "vitest";
import { emptyPlan } from "@/model/factory";
import { CURRENT_VERSION } from "@/model/migrations";
import { parsePlan } from "@/model/schema";
describe("emptyPlan", () => {
  it("stamps the current schema version, not a hardcoded literal", () => {
    expect(emptyPlan("x").version).toBe(CURRENT_VERSION);
  });
  it("produces a plan its own schema accepts", () => {
    const p = emptyPlan("x");
    expect(parsePlan(JSON.parse(JSON.stringify(p)))).toEqual(p);
  });
});
