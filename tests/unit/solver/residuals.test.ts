import { describe, it, expect } from "vitest";
import { buildSystem } from "@/solver/residuals";
import { SOLVER_CONFIG } from "@/config/solver";
import { emptyPlan } from "@/model/factory";
import type { Plan } from "@/model/types";

function rect(): Plan {
  const p = emptyPlan("t");
  const f = p.floors[0].id;
  p.points.push(
    { id: "p1", floorId: f, x: 0, y: 0 },
    { id: "p2", floorId: f, x: 4000, y: 0 },
    { id: "p3", floorId: f, x: 4000, y: 3000 },
    { id: "p4", floorId: f, x: 0, y: 3000 },
  );
  p.walls.push(
    { id: "w1", floorId: f, a: "p1", b: "p2", thickness: 0, side: "right" },
    { id: "w2", floorId: f, a: "p2", b: "p3", thickness: 0, side: "right" },
    { id: "w3", floorId: f, a: "p3", b: "p4", thickness: 0, side: "right" },
    { id: "w4", floorId: f, a: "p4", b: "p1", thickness: 0, side: "right" },
  );
  p.rooms.push({ id: "r1", floorId: f, name: "A", pointIds: ["p1", "p2", "p3", "p4"] });
  return p;
}

describe("buildSystem", () => {
  it("maps variables and gauge residuals", () => {
    const p = rect();
    const s = buildSystem(p, p.floors[0].id, SOLVER_CONFIG);
    expect(s.vars.count).toBe(8);
    expect(s.x0).toEqual([0, 0, 4000, 0, 4000, 3000, 0, 3000]);
    const gauge = s.entries.filter((e) => e.kind === "gauge");
    expect(gauge).toHaveLength(3);
    const prior = s.entries.filter((e) => e.kind === "prior");
    expect(prior).toHaveLength(4);
    expect(s.f(s.x0).every((v) => Math.abs(v) < 1e-9)).toBe(true); // perfect rectangle: all residuals zero
  });

  it("length residual is (dist - value)/sigma", () => {
    const p = rect();
    p.measurements.push({ id: "m1", kind: "length", a: "p1", b: "p2", value: 4010 });
    const s = buildSystem(p, p.floors[0].id, SOLVER_CONFIG);
    const i = s.entries.findIndex((e) => e.measurementId === "m1");
    expect(s.f(s.x0)[i]).toBeCloseTo(-10 / SOLVER_CONFIG.sigma.lengthMm);
  });

  it("typed angle suppresses the prior at that corner", () => {
    const p = rect();
    p.measurements.push({ id: "m2", kind: "angle", a: "p1", b: "p2", c: "p3", value: 92 });
    const s = buildSystem(p, p.floors[0].id, SOLVER_CONFIG);
    expect(s.entries.filter((e) => e.kind === "prior")).toHaveLength(3);
    const i = s.entries.findIndex((e) => e.measurementId === "m2");
    expect(Math.abs(s.f(s.x0)[i])).toBeCloseTo(2 / SOLVER_CONFIG.sigma.angleDeg);
  });

  it("thickness residual measures face B against line A with side sign", () => {
    const p = rect();
    const f = p.floors[0].id;
    p.points.push(
      { id: "q1", floorId: f, x: 0, y: -200 },
      { id: "q2", floorId: f, x: 4000, y: -200 },
    );
    p.walls.push({ id: "wB", floorId: f, a: "q2", b: "q1", thickness: 0, side: "right" });
    // w1 is p1→p2 along +x with side 'right'; in y-down coordinates the right of +x is −y, so q at y=−200 is 200 mm on the thickness side
    p.measurements.push({ id: "m3", kind: "thickness", wallA: "w1", wallB: "wB", value: 200 });
    const s = buildSystem(p, f, SOLVER_CONFIG);
    const idx = s.entries.map((e, i) => (e.measurementId === "m3" ? i : -1)).filter((i) => i >= 0);
    expect(idx).toHaveLength(2);
    idx.forEach((i) => expect(s.f(s.x0)[i]).toBeCloseTo(0));
  });

  it("align residual", () => {
    const p = rect();
    p.measurements.push({ id: "m4", kind: "align", a: "p1", b: "p2", axis: "y" });
    const s = buildSystem(p, p.floors[0].id, SOLVER_CONFIG);
    const i = s.entries.findIndex((e) => e.measurementId === "m4");
    expect(s.f(s.x0)[i]).toBe(0);
  });

  it("a typed angle at a shared corner point does not suppress the other room's prior there", () => {
    const p = rect();
    const f = p.floors[0].id;
    // second room shares point p1 with room r1, but approaches it from different neighbours
    p.points.push(
      { id: "e2", floorId: f, x: -4000, y: 0 },
      { id: "e3", floorId: f, x: -4000, y: -3000 },
      { id: "e4", floorId: f, x: 0, y: -3000 },
    );
    p.rooms.push({ id: "r2", floorId: f, name: "B", pointIds: ["p1", "e2", "e3", "e4"] });
    // types room r1's corner at p1 (neighbours p4, p2), not room r2's corner at p1 (neighbours e4, e2)
    p.measurements.push({ id: "mShared", kind: "angle", a: "p4", b: "p1", c: "p2", value: 90 });
    const s = buildSystem(p, f, SOLVER_CONFIG);
    const prior = s.entries.filter((e) => e.kind === "prior");
    // 8 corners total across both rooms; exactly one (room r1's corner at p1) is suppressed
    expect(prior).toHaveLength(7);
    const r2CornerStillPresent = prior.some(
      (e) => e.pointIds[0] === "e4" && e.pointIds[1] === "p1" && e.pointIds[2] === "e2",
    );
    expect(r2CornerStillPresent).toBe(true);
  });
});

/** residual convention: residual = fitted − measured; negative means the typed value was larger than the geometry supports. */
function square(): Plan {
  const p = emptyPlan("t");
  const f = p.floors[0].id;
  p.points.push(
    { id: "s1", floorId: f, x: 0, y: 0 },
    { id: "s2", floorId: f, x: 4000, y: 0 },
    { id: "s3", floorId: f, x: 4000, y: 4000 },
    { id: "s4", floorId: f, x: 0, y: 4000 },
  );
  p.walls.push(
    { id: "sw1", floorId: f, a: "s1", b: "s2", thickness: 0, side: "right" },
    { id: "sw2", floorId: f, a: "s2", b: "s3", thickness: 0, side: "right" },
    { id: "sw3", floorId: f, a: "s3", b: "s4", thickness: 0, side: "right" },
    { id: "sw4", floorId: f, a: "s4", b: "s1", thickness: 0, side: "right" },
  );
  p.rooms.push({ id: "sr", floorId: f, name: "S", pointIds: ["s1", "s2", "s3", "s4"] });
  return p;
}

describe("residual sign convention", () => {
  it("length: typed value 100mm longer than the true 4000mm side gives a negative residual", () => {
    const p = square();
    p.measurements.push({ id: "sl", kind: "length", a: "s1", b: "s2", value: 4100 });
    const s = buildSystem(p, p.floors[0].id, SOLVER_CONFIG);
    const i = s.entries.findIndex((e) => e.measurementId === "sl");
    expect(s.f(s.x0)[i]).toBeCloseTo(-100 / SOLVER_CONFIG.sigma.lengthMm);
  });

  it("thickness: typed gap 50mm wider than the true 200mm gap gives a negative residual", () => {
    const p = square();
    const f = p.floors[0].id;
    p.points.push(
      { id: "t1", floorId: f, x: 0, y: -200 },
      { id: "t2", floorId: f, x: 4000, y: -200 },
    );
    p.walls.push({ id: "tw", floorId: f, a: "t2", b: "t1", thickness: 0, side: "right" });
    // sw1 is s1→s2 along +x with side 'right' (right of +x in y-down is −y); true gap to y=−200 is 200mm
    p.measurements.push({ id: "st", kind: "thickness", wallA: "sw1", wallB: "tw", value: 250 });
    const s = buildSystem(p, f, SOLVER_CONFIG);
    const idx = s.entries.map((e, i) => (e.measurementId === "st" ? i : -1)).filter((i) => i >= 0);
    idx.forEach((i) => expect(s.f(s.x0)[i]).toBeCloseTo(-50 / SOLVER_CONFIG.sigma.thicknessMm));
  });

  it("angle: typed value 10° larger than the true 90° corner gives a negative residual", () => {
    const p = square();
    p.measurements.push({ id: "sa", kind: "angle", a: "s1", b: "s2", c: "s3", value: 100 });
    const s = buildSystem(p, p.floors[0].id, SOLVER_CONFIG);
    const i = s.entries.findIndex((e) => e.measurementId === "sa");
    expect(s.f(s.x0)[i]).toBeCloseTo(-10 / SOLVER_CONFIG.sigma.angleDeg);
  });

  it("align: residual is the first point's coordinate minus the second's, not the reverse", () => {
    const p = square();
    // s3.x = 4000, s1.x = 0: a ahead of b on the x axis gives a positive residual
    p.measurements.push({ id: "sn", kind: "align", a: "s3", b: "s1", axis: "x" });
    const s = buildSystem(p, p.floors[0].id, SOLVER_CONFIG);
    const i = s.entries.findIndex((e) => e.measurementId === "sn");
    expect(s.f(s.x0)[i]).toBeCloseTo(4000 / SOLVER_CONFIG.sigma.alignMm);
  });
});
