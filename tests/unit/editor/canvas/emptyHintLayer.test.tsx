// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { EmptyHintLayer } from "@/editor/canvas/layers/EmptyHintLayer";
import { EDITOR_CONFIG } from "@/config/editor";
import { t } from "@/i18n";

describe("EmptyHintLayer", () => {
  it("renders nothing when not visible", () => {
    const { container } = render(
      <svg>
        <EmptyHintLayer visible={false} width={800} height={600} />
      </svg>,
    );
    expect(container.querySelector(".empty-hint")).toBeNull();
  });

  it("shows the hint text and the grid's real-world square size when visible", () => {
    const { container, getByText } = render(
      <svg>
        <EmptyHintLayer visible width={800} height={600} />
      </svg>,
    );
    expect(getByText(t("canvas.emptyHint.main"))).toBeTruthy();
    expect(getByText(t("canvas.emptyHint.grid", { size: EDITOR_CONFIG.gridMm }))).toBeTruthy();
    const g = container.querySelector(".empty-hint");
    expect(g).not.toBeNull();
    expect(g?.getAttribute("transform")).toBe("translate(400 300)");
  });
});
