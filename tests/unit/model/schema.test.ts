import { describe, it, expect } from "vitest";
import { parsePlan } from "@/model/schema";
import { emptyPlan } from "@/model/factory";
describe("parsePlan", () => {
  it("round-trips an empty plan", () => {
    const p = emptyPlan("house");
    expect(parsePlan(JSON.parse(JSON.stringify(p)))).toEqual(p);
    expect(p.floors).toHaveLength(1);
  });
  it("rejects unknown measurement kind", () => {
    const p = emptyPlan("x") as unknown as { measurements: unknown[] };
    p.measurements.push({ id: "m1", kind: "volume", value: 1 });
    expect(() => parsePlan(p)).toThrow();
  });
  it("rejects wall referencing a missing point", () => {
    const p = emptyPlan("x");
    p.walls.push({
      id: "w1",
      floorId: p.floors[0].id,
      a: "nope",
      b: "nope2",
      thickness: 0,
      side: "left",
    });
    expect(() => parsePlan(p)).toThrow(/nope/);
  });
  it("rejects room referencing a missing point", () => {
    const p = emptyPlan("x");
    p.rooms.push({
      id: "r1",
      floorId: p.floors[0].id,
      name: "r",
      pointIds: ["nope", "nope2", "nope3"],
    });
    expect(() => parsePlan(p)).toThrow(/nope/);
  });
  it("rejects opening referencing a missing wall", () => {
    const p = emptyPlan("x");
    p.openings.push({ id: "o1", wallId: "nope", kind: "door", offset: 0, width: 800 });
    expect(() => parsePlan(p)).toThrow(/nope/);
  });
  it("rejects fixture anchored to a missing wall", () => {
    const p = emptyPlan("x");
    p.fixtures.push({
      id: "fx1",
      floorId: p.floors[0].id,
      name: "sink",
      anchor: { wallId: "nope", offset: 0, depth: 0 },
      w: 500,
      d: 500,
    });
    expect(() => parsePlan(p)).toThrow(/nope/);
  });
  it("rejects a length measurement referencing a missing point", () => {
    const p = emptyPlan("x");
    p.measurements.push({ id: "m1", kind: "length", a: "nope", b: "nope2", value: 1000 });
    expect(() => parsePlan(p)).toThrow(/nope/);
  });
  it("rejects an angle measurement referencing a missing point", () => {
    const p = emptyPlan("x");
    p.measurements.push({ id: "m1", kind: "angle", a: "nope", b: "nope2", c: "nope3", value: 90 });
    expect(() => parsePlan(p)).toThrow(/nope/);
  });
  it("rejects an align measurement referencing a missing point", () => {
    const p = emptyPlan("x");
    p.measurements.push({ id: "m1", kind: "align", a: "nope", b: "nope2", axis: "x" });
    expect(() => parsePlan(p)).toThrow(/nope/);
  });
  it("rejects a thickness measurement referencing a missing wall", () => {
    const p = emptyPlan("x");
    p.measurements.push({ id: "m1", kind: "thickness", wallA: "nope", wallB: "nope2", value: 100 });
    expect(() => parsePlan(p)).toThrow(/nope/);
  });
});
