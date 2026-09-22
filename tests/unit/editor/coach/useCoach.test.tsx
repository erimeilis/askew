// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useCoach } from "@/editor/coach/useCoach";
import { useEditorStore } from "@/editor/store/editorStore";
import { useCoachStore } from "@/editor/coach/coachStore";
import { kv } from "@/persistence/browser/kv";
import { STORAGE_CONFIG } from "@/config/storage";

describe("useCoach", () => {
  beforeEach(async () => {
    await kv.del(STORAGE_CONFIG.coachSkippedKey);
    useCoachStore.setState({ dismissed: null });
    act(() => useEditorStore.getState().newPlan("x"));
  });

  it("starts visible at step 1 (index 0, outline) on a brand-new empty floor", async () => {
    const { result } = renderHook(() => useCoach());
    await waitFor(() => expect(result.current.visible).toBe(true));
    expect(result.current.stepIndex).toBe(0);
    expect(result.current.step.id).toBe("outline");
    expect(result.current.totalSteps).toBe(4);
  });

  it("advances by itself past step 1 the moment a room exists — no Next click needed", async () => {
    const { result } = renderHook(() => useCoach());
    await waitFor(() => expect(result.current.visible).toBe(true));

    const f = useEditorStore.getState().activeFloorId;
    act(() => {
      useEditorStore.getState().update(
        (p) => {
          p.points.push(
            { id: "p1", floorId: f, x: 0, y: 0 },
            { id: "p2", floorId: f, x: 4000, y: 0 },
            { id: "p3", floorId: f, x: 4000, y: 3000 },
          );
          p.rooms.push({ id: "r1", floorId: f, name: "", pointIds: ["p1", "p2", "p3"] });
        },
        { solve: false },
      );
    });

    expect(result.current.stepIndex).toBe(1);
    expect(result.current.step.id).toBe("measure");
  });

  it("advances to redundant, then to the closing step, purely from store changes", async () => {
    const { result } = renderHook(() => useCoach());
    const f = useEditorStore.getState().activeFloorId;
    act(() => {
      useEditorStore.getState().update(
        (p) => {
          p.points.push(
            { id: "p1", floorId: f, x: 0, y: 0 },
            { id: "p2", floorId: f, x: 4000, y: 0 },
            { id: "p3", floorId: f, x: 4000, y: 3000 },
          );
          p.rooms.push({ id: "r1", floorId: f, name: "", pointIds: ["p1", "p2", "p3"] });
          p.measurements.push({ id: "m1", kind: "length", a: "p1", b: "p2", value: 4000 });
        },
        { solve: false },
      );
    });
    expect(result.current.step.id).toBe("redundant");

    act(() => {
      useEditorStore.setState((s) => ({
        results: { ...s.results, [f]: { ...s.results[f], redundancy: 1 } as never },
      }));
    });
    expect(result.current.step.id).toBe("residuals");
    expect(result.current.isLastStep).toBe(true);
  });

  it("Skip hides the panel once the floor has a room (it is not lost-again empty)", async () => {
    const f = useEditorStore.getState().activeFloorId;
    act(() => {
      useEditorStore.getState().update(
        (p) => {
          p.points.push({ id: "p1", floorId: f, x: 0, y: 0 });
          p.rooms.push({ id: "r1", floorId: f, name: "", pointIds: ["p1", "p2", "p3"] });
        },
        { solve: false },
      );
    });
    const { result } = renderHook(() => useCoach());
    await waitFor(() => expect(result.current.visible).toBe(true));

    act(() => result.current.skip());
    expect(result.current.visible).toBe(false);
  });

  it("reappears once the active floor has no rooms, even though it was skipped", async () => {
    const f = useEditorStore.getState().activeFloorId;
    act(() => {
      useEditorStore.getState().update(
        (p) => {
          p.points.push({ id: "p1", floorId: f, x: 0, y: 0 });
          p.rooms.push({ id: "r1", floorId: f, name: "", pointIds: ["p1", "p2", "p3"] });
        },
        { solve: false },
      );
    });
    const { result } = renderHook(() => useCoach());
    await waitFor(() => expect(result.current.visible).toBe(true));
    act(() => result.current.skip());
    expect(result.current.visible).toBe(false);

    // Undo removes the room again: the floor is back to having none, so the coach must
    // reappear even though it was just skipped.
    act(() => useEditorStore.getState().undo());
    expect(result.current.visible).toBe(true);
  });

  it("Next hint moves forward voluntarily, ahead of actual progress", async () => {
    const { result } = renderHook(() => useCoach());
    await waitFor(() => expect(result.current.visible).toBe(true));
    expect(result.current.stepIndex).toBe(0);

    act(() => result.current.next());
    expect(result.current.stepIndex).toBe(1);
    expect(result.current.step.id).toBe("measure");
  });

  it("resets the voluntary Next-hint advance when the active floor changes", async () => {
    const { result } = renderHook(() => useCoach());
    await waitFor(() => expect(result.current.visible).toBe(true));
    act(() => result.current.next());
    expect(result.current.stepIndex).toBe(1);

    let newFloorId: string | undefined;
    act(() => {
      useEditorStore.getState().update(
        (p) => {
          const floor = { id: "f2", name: "Floor 2", elevation: 0 };
          p.floors.push(floor);
          newFloorId = floor.id;
        },
        { solve: false },
      );
      useEditorStore.getState().setActiveFloor(newFloorId!);
    });

    expect(result.current.stepIndex).toBe(0);
  });
});
