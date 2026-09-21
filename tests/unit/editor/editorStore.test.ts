import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { useEditorStore } from "@/editor/store/editorStore";

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
});
