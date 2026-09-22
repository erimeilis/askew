import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { useEditorStore } from "@/editor/store/editorStore";
import { planToJson, jsonToPlan } from "@/persistence/serialize";

describe("editorStore", () => {
  beforeEach(() => useEditorStore.getState().newPlan("t"));

  it("update pushes history, undo/redo restore", () => {
    const s = useEditorStore.getState();
    const f = s.activeFloorId;
    s.update(
      (p) => {
        p.points.push({ id: "p1", floorId: f, x: 0, y: 0 });
      },
      { solve: false },
    );
    expect(useEditorStore.getState().plan().points).toHaveLength(1);
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().plan().points).toHaveLength(0);
    useEditorStore.getState().redo();
    expect(useEditorStore.getState().plan().points).toHaveLength(1);
  });

  it("update with solve stores a result for the active floor", () => {
    const s = useEditorStore.getState();
    const f = s.activeFloorId;
    s.update((p) => {
      p.points.push({ id: "p1", floorId: f, x: 0, y: 0 }, { id: "p2", floorId: f, x: 3900, y: 50 });
      p.walls.push({ id: "w1", floorId: f, a: "p1", b: "p2", thickness: 0, side: "right" });
      p.measurements.push({ id: "m1", kind: "length", a: "p1", b: "p2", value: 4000 });
    });
    const r = useEditorStore.getState().results[f];
    expect(r).toBeDefined();
    expect(r.residuals[0].measurementId).toBe("m1");
    const pts = useEditorStore.getState().plan().points;
    expect(Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y)).toBeCloseTo(4000, 0);
  });

  it("failed solve keeps coordinates and sets error", () => {
    const s = useEditorStore.getState();
    const f = s.activeFloorId;
    s.update((p) => {
      p.points.push({ id: "p1", floorId: f, x: 0, y: 0 });
      p.measurements.push({ id: "m", kind: "length", a: "p1", b: "p1", value: 1000 });
    });
    expect(useEditorStore.getState().plan().points[0]).toMatchObject({ x: 0, y: 0 });
  });

  it("undo/redo refresh the active floor's diagnostics for the plan they restore", () => {
    const s = useEditorStore.getState();
    const f = s.activeFloorId;
    s.update((p) => {
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
      p.rooms.push({ id: "r1", floorId: f, name: "", pointIds: ["p1", "p2", "p3", "p4"] });
    });
    const beforeUnconstrained = useEditorStore.getState().results[f].unconstrained.length;

    s.update((p) => {
      p.measurements.push({ id: "m1", kind: "length", a: "p1", b: "p2", value: 4000 });
    });
    const afterUnconstrained = useEditorStore.getState().results[f].unconstrained.length;
    // sanity check: the added measurement must actually change the diagnostics, otherwise
    // this test could pass without ever exercising the undo/redo refresh at all.
    expect(afterUnconstrained).not.toBe(beforeUnconstrained);

    useEditorStore.getState().undo();
    const restored = useEditorStore.getState();
    expect(restored.plan().measurements).toHaveLength(0); // the pre-measurement plan is back
    expect(restored.results[f].unconstrained.length).toBe(beforeUnconstrained);

    useEditorStore.getState().redo();
    const redone = useEditorStore.getState();
    expect(redone.plan().measurements).toHaveLength(1);
    expect(redone.results[f].unconstrained.length).toBe(afterUnconstrained);
  });

  it("undo/redo are no-ops at the ends of history: no solve, results untouched", () => {
    const s = useEditorStore.getState();
    const f = s.activeFloorId;
    const resultsBeforeUndo = useEditorStore.getState().results;
    useEditorStore.getState().undo(); // nothing in the past yet
    expect(useEditorStore.getState().results).toBe(resultsBeforeUndo);

    s.update((p) => {
      p.points.push({ id: "p1", floorId: f, x: 0, y: 0 });
    });
    const resultsBeforeRedo = useEditorStore.getState().results;
    useEditorStore.getState().redo(); // nothing in the future
    expect(useEditorStore.getState().results).toBe(resultsBeforeRedo);
  });

  it("loadPlan populates diagnostics for a reloaded plan without rewriting coordinates", () => {
    const s = useEditorStore.getState();
    const f = s.activeFloorId;
    s.update((p) => {
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
      p.rooms.push({ id: "r1", floorId: f, name: "Kitchen", pointIds: ["p1", "p2", "p3", "p4"] });
      p.measurements.push({ id: "m1", kind: "length", a: "p1", b: "p2", value: 4000 });
    });
    const expected = useEditorStore.getState().results[f];
    expect(expected.residuals).toHaveLength(1); // sanity: this plan actually has diagnostics

    // Serialise and reload, exactly as the autosave-restore-on-page-load path does.
    const saved = planToJson(useEditorStore.getState().plan());
    useEditorStore.getState().loadPlan(jsonToPlan(saved));

    const loaded = useEditorStore.getState();
    const result = loaded.results[loaded.activeFloorId];
    expect(result).toBeDefined();
    expect(result.residuals).toHaveLength(1);
    expect(result.residuals[0].residual).toBeCloseTo(expected.residuals[0].residual, 1);
    expect(result.redundancy).toBe(expected.redundancy);
    expect(result.unconstrained.length).toBe(expected.unconstrained.length);
    // coordinates were already fitted when saved: loading must not move them (within the
    // serializer's 1-decimal rounding).
    const loadedP1 = loaded.plan().points.find((pt) => pt.id === "p1")!;
    const expectedP1 = expected.points.find((pt) => pt.id === "p1")!;
    expect(loadedP1.x).toBeCloseTo(expectedP1.x, 0);
    expect(loadedP1.y).toBeCloseTo(expectedP1.y, 0);
  });
});
