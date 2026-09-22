import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { addLength, measureTool } from "@/editor/tools/measureTool";
import { emptyPlan } from "@/model/factory";
import { useEditorStore } from "@/editor/store/editorStore";

describe("addLength", () => {
  it("adds a length measurement and rejects same point", () => {
    const p = emptyPlan("t");
    const f = p.floors[0].id;
    p.points.push({ id: "a", floorId: f, x: 0, y: 0 }, { id: "b", floorId: f, x: 1, y: 0 });
    addLength(p, "a", "b", 4000);
    expect(p.measurements[0]).toMatchObject({ kind: "length", a: "a", b: "b", value: 4000 });
    expect(() => addLength(p, "a", "a", 1)).toThrow();
  });
});

describe("measureTool prompt", () => {
  beforeEach(() => useEditorStore.getState().newPlan("t"));

  it("asks for a length using human point labels, never raw generated ids", () => {
    const s = useEditorStore.getState();
    const f = s.activeFloorId;
    s.update(
      (p) => {
        p.points.push(
          { id: "p_raw_gibberish_a", floorId: f, x: 0, y: 0 },
          { id: "p_raw_gibberish_b", floorId: f, x: 4000, y: 0 },
        );
      },
      { solve: false },
    );

    measureTool.onClick(
      { x: 0, y: 0 },
      { type: "point", id: "p_raw_gibberish_a" },
      useEditorStore.getState(),
    );
    measureTool.onClick(
      { x: 4000, y: 0 },
      { type: "point", id: "p_raw_gibberish_b" },
      useEditorStore.getState(),
    );

    const prompt = useEditorStore.getState().prompt;
    expect(prompt).not.toBeNull();
    expect(prompt?.label).toBe("Length P1 → P2 (mm)");
    expect(prompt?.label).not.toContain("p_raw_gibberish_a");
    expect(prompt?.label).not.toContain("p_raw_gibberish_b");
  });
});
