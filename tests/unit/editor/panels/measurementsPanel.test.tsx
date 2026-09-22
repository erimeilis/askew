// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import { MeasurementsPanel } from "@/editor/panels/MeasurementsPanel";
import { useEditorStore } from "@/editor/store/editorStore";
import { t } from "@/i18n";

describe("MeasurementsPanel bare state", () => {
  beforeEach(() => act(() => useEditorStore.getState().newPlan("x")));
  afterEach(() => cleanup());

  it("explains what will appear, instead of showing empty table headers, when there are none", () => {
    const { container } = render(<MeasurementsPanel />);
    expect(screen.getByText(t("panel.measurements.empty"))).toBeTruthy();
    expect(container.querySelector("table")).toBeNull();
  });

  it("shows the real table once a measurement exists", () => {
    const f = useEditorStore.getState().activeFloorId;
    act(() => {
      useEditorStore.getState().update(
        (p) => {
          p.points.push(
            { id: "p1", floorId: f, x: 0, y: 0 },
            { id: "p2", floorId: f, x: 4000, y: 0 },
          );
          p.measurements.push({ id: "m1", kind: "length", a: "p1", b: "p2", value: 4000 });
        },
        { solve: false },
      );
    });
    const { container } = render(<MeasurementsPanel />);
    expect(container.querySelector("table")).not.toBeNull();
    expect(screen.queryByText(t("panel.measurements.empty"))).toBeNull();
  });
});
