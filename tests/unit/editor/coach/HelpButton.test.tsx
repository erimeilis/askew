// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";
import { HelpButton } from "@/editor/coach/HelpButton";
import { CoachPanel } from "@/editor/coach/CoachPanel";
import { useEditorStore } from "@/editor/store/editorStore";
import { useCoachStore } from "@/editor/coach/coachStore";
import { kv } from "@/persistence/browser/kv";
import { STORAGE_CONFIG } from "@/config/storage";
import { t } from "@/i18n";

describe("HelpButton", () => {
  beforeEach(async () => {
    await kv.del(STORAGE_CONFIG.coachSkippedKey);
    useCoachStore.setState({ dismissed: null });
    act(() => useEditorStore.getState().newPlan("x"));
  });

  afterEach(() => cleanup());

  it("brings the coach back after it was skipped, even on a floor that already has a room", async () => {
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
    act(() => useCoachStore.getState().skip());

    render(
      <>
        <HelpButton />
        <CoachPanel />
      </>,
    );
    expect(screen.queryByText(t("coach.step.measure.title"))).toBeNull();

    fireEvent.click(screen.getByText(t("coach.help")));
    // The room already exists, so Help resumes at the first INCOMPLETE step (measure),
    // not back at the beginning.
    expect(screen.getByText(t("coach.step.measure.title"))).toBeTruthy();
  });
});
