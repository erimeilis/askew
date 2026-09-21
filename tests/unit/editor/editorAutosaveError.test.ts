import { describe, it, expect, vi } from "vitest";

vi.mock("@/persistence/browser/autosave", () => ({
  scheduleAutosave: (_plan: unknown, onError?: (e: unknown) => void) =>
    onError?.(new Error("boom")),
}));

import { useEditorStore } from "@/editor/store/editorStore";

describe("editorStore autosave error handling", () => {
  it("surfaces a failed autosave write as the store's error state", () => {
    useEditorStore.getState().newPlan("t");
    const f = useEditorStore.getState().activeFloorId;
    useEditorStore.getState().update(
      (p) => {
        p.points.push({ id: "p1", floorId: f, x: 0, y: 0 });
      },
      { solve: false },
    );
    expect(useEditorStore.getState().error).toBe("Error: boom");
  });
});
