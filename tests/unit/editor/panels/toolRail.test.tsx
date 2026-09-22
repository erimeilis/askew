// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import { ToolRail } from "@/editor/panels/ToolRail";
import { useEditorStore } from "@/editor/store/editorStore";
import { t } from "@/i18n";

describe("ToolRail", () => {
  beforeEach(() => act(() => useEditorStore.getState().newPlan("x")));
  afterEach(() => cleanup());

  it("shows every tool's name as visible text, not only as a tooltip", () => {
    render(<ToolRail />);
    // Icon-only buttons carry the name solely in title/aria-label; a visible <span> is the
    // fix under test, so this must find on-screen text, not just an attribute.
    expect(screen.getByText(t("tool.room"))).toBeTruthy();
    expect(screen.getByText(t("tool.measure"))).toBeTruthy();
    expect(screen.getByText(t("tool.select"))).toBeTruthy();
  });
});
