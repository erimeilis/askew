// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, cleanup } from "@testing-library/react";
import { App } from "@/editor/App";
import { useEditorStore } from "@/editor/store/editorStore";
import { emptyPlan } from "@/model/factory";
import { loadAutosave } from "@/persistence/browser/autosave";
import { t } from "@/i18n";

vi.mock("@/persistence/browser/autosave", () => ({
  loadAutosave: vi.fn(),
  scheduleAutosave: vi.fn(),
  clearAutosave: vi.fn(),
}));

const mockedLoadAutosave = vi.mocked(loadAutosave);

// jsdom has no ResizeObserver; Canvas.tsx (Task 8, exercised live in real browsers) uses one
// to size the grid layer. A minimal no-op stub is enough for a startup-flow test that never
// asserts on measured size.
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub);

/**
 * A baseline no branch under test would legitimately produce: two floors and a name
 * neither `newPlan(t("app.title"))` (one floor) nor a restored plan ("Restored Plan")
 * would ever match. If a branch is silently removed and does nothing, this sentinel is
 * exactly what a naive "floors has length 1" check would fail to catch by coincidence.
 */
function sentinelPlan() {
  const p = emptyPlan("SENTINEL-BEFORE");
  p.floors.push({ id: "sentinel-extra-floor", name: "Extra", elevation: 0 });
  return p;
}

describe("App startup", () => {
  beforeEach(() => {
    mockedLoadAutosave.mockReset();
    useEditorStore.getState().loadPlan(sentinelPlan());
    useEditorStore.setState({ error: null });
  });

  afterEach(() => {
    cleanup();
  });

  it("restores a saved plan and does not call newPlan to replace it", async () => {
    const saved = emptyPlan("Restored Plan");
    mockedLoadAutosave.mockResolvedValueOnce(saved);
    const newPlanSpy = vi.spyOn(useEditorStore.getState(), "newPlan");

    render(<App />);

    await waitFor(() => expect(useEditorStore.getState().plan().name).toBe("Restored Plan"));
    expect(useEditorStore.getState().plan().floors).toHaveLength(1);
    expect(useEditorStore.getState().error).toBeNull();
    expect(newPlanSpy).not.toHaveBeenCalled();
  });

  it("starts a fresh, one-floor plan when there is nothing to restore, and the canvas renders", async () => {
    mockedLoadAutosave.mockResolvedValueOnce(null);

    const { container } = render(<App />);

    await waitFor(() => expect(useEditorStore.getState().plan().name).toBe(t("app.title")));
    expect(useEditorStore.getState().plan().floors).toHaveLength(1);
    expect(useEditorStore.getState().error).toBeNull();
    // A plan-less-turned-fresh store must not make the canvas throw.
    expect(container.querySelector("svg.canvas")).toBeTruthy();
  });

  it("falls back to a fresh plan and keeps the rejection's message visible as the error", async () => {
    mockedLoadAutosave.mockRejectedValueOnce(new Error("boom disk full"));

    render(<App />);

    await waitFor(() => expect(useEditorStore.getState().plan().name).toBe(t("app.title")));
    expect(useEditorStore.getState().plan().floors).toHaveLength(1);
    // newPlan (which sets error: null via loadPlan) runs before setError in the catch
    // block, so the rejection's message must still be there afterwards, not wiped.
    await waitFor(() => expect(useEditorStore.getState().error).toContain("boom disk full"));
  });

  it("touches nothing in the store if the component unmounts before the promise settles", async () => {
    let resolvePlan!: (p: Awaited<ReturnType<typeof loadAutosave>>) => void;
    mockedLoadAutosave.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePlan = resolve;
      }),
    );

    const planBefore = useEditorStore.getState().plan();
    const errorBefore = useEditorStore.getState().error;
    const { unmount } = render(<App />);
    unmount();

    resolvePlan(emptyPlan("Should never land"));
    await new Promise((r) => setTimeout(r, 0));

    expect(useEditorStore.getState().plan()).toBe(planBefore);
    expect(useEditorStore.getState().error).toBe(errorBefore);
  });
});
