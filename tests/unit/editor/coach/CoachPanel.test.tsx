// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor, fireEvent, act } from "@testing-library/react";
import { CoachPanel } from "@/editor/coach/CoachPanel";
import { useEditorStore } from "@/editor/store/editorStore";
import { useCoachStore } from "@/editor/coach/coachStore";
import { kv } from "@/persistence/browser/kv";
import { STORAGE_CONFIG } from "@/config/storage";
import { t } from "@/i18n";

describe("CoachPanel", () => {
  beforeEach(async () => {
    await kv.del(STORAGE_CONFIG.coachSkippedKey);
    useCoachStore.setState({ dismissed: null });
    act(() => useEditorStore.getState().newPlan("x"));
  });

  afterEach(() => cleanup());

  it("shows step 1 of 4 with the outline title and body on a fresh floor", async () => {
    render(<CoachPanel />);
    await waitFor(() => screen.getByText(t("coach.stepOf", { current: 1, total: 4 })));
    expect(screen.getByText(t("coach.step.outline.title"))).toBeTruthy();
    expect(screen.getByText(t("coach.step.outline.body"))).toBeTruthy();
    expect(screen.getByText(t("coach.step.outline.check.tool"))).toBeTruthy();
  });

  it("Skip hides the panel (once the floor is not itself empty)", async () => {
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
    render(<CoachPanel />);
    await waitFor(() => screen.getByText(t("coach.skip")));

    fireEvent.click(screen.getByText(t("coach.skip")));
    await waitFor(() => expect(screen.queryByText(t("coach.skip"))).toBeNull());
  });

  it("shows Finish (not Next hint) on the closing step", async () => {
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
      useEditorStore.setState((s) => ({
        results: { ...s.results, [f]: { ...s.results[f], redundancy: 1 } as never },
      }));
    });

    render(<CoachPanel />);
    await waitFor(() => screen.getByText(t("coach.step.residuals.title")));
    expect(screen.getByText(t("coach.finish"))).toBeTruthy();
    expect(screen.queryByText(t("coach.next"))).toBeNull();
  });
});
