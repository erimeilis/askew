// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, cleanup, fireEvent, act } from "@testing-library/react";
import { App } from "@/editor/App";
import { useEditorStore } from "@/editor/store/editorStore";
import { loadAutosave } from "@/persistence/browser/autosave";

vi.mock("@/persistence/browser/autosave", () => ({
  loadAutosave: vi.fn(),
  scheduleAutosave: vi.fn(),
  clearAutosave: vi.fn(),
}));

const mockedLoadAutosave = vi.mocked(loadAutosave);

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub);

/**
 * Dispatches one real per-character keydown followed by the value change it would
 * produce in a real browser (jsdom does not implement actual keystroke-to-text
 * insertion, so the value update has to be supplied alongside each keydown — this
 * still exercises real KeyboardEvent objects and the input's own onKeyDown/onChange
 * handlers, not a single synthetic "paste").
 */
function typeDigits(input: HTMLInputElement, digits: string): void {
  let value = "";
  for (const ch of digits) {
    fireEvent.keyDown(input, { key: ch });
    value += ch;
    fireEvent.change(input, { target: { value } });
  }
}

describe("measure tool prompt: focus and the type-a-number path", () => {
  beforeEach(async () => {
    mockedLoadAutosave.mockReset();
    mockedLoadAutosave.mockResolvedValueOnce(null);
  });

  afterEach(() => {
    cleanup();
  });

  it("suppresses the browser's default focus-stealing action on every canvas pointerdown", async () => {
    const { container } = render(<App />);
    await waitFor(() => expect(useEditorStore.getState().plan().floors).toHaveLength(1));

    const svg = container.querySelector("svg.canvas") as SVGSVGElement;
    const event = new PointerEvent("pointerdown", {
      clientX: 200,
      clientY: 200,
      bubbles: true,
      cancelable: true,
    });
    svg.dispatchEvent(event);

    // This is the deterministic, jsdom-testable half of the fix: jsdom does not
    // implement the browser's native "mousedown on a non-focusable target blurs the
    // active element" default action, so it cannot reproduce the race itself — but it
    // can verify our handler asks the browser not to run that default action at all.
    expect(event.defaultPrevented).toBe(true);
  });

  it("focuses the length prompt input and creates the measurement from keyboard input alone", async () => {
    const { container } = render(<App />);
    await waitFor(() => expect(useEditorStore.getState().plan().floors).toHaveLength(1));

    const f = useEditorStore.getState().activeFloorId;
    // Both calls happen outside any React event handler, so wrap them in act() to
    // flush Canvas's re-render (with the new tool and points) before dispatching
    // events below — otherwise the first click can race a stale render.
    act(() => {
      useEditorStore.getState().update(
        (p) => {
          p.points.push(
            { id: "p1", floorId: f, x: 0, y: 0 },
            { id: "p2", floorId: f, x: 4000, y: 0 },
          );
        },
        { solve: false },
      );
      useEditorStore.getState().setTool("measure");
    });

    const svg = container.querySelector("svg.canvas") as SVGSVGElement;
    // The default view is { tx: 200, ty: 200, s: 0.1 }, and jsdom's SVG
    // getBoundingClientRect is a zero rect, so clientX/clientY map straight to
    // world coordinates via (client - t) / s.
    fireEvent.pointerDown(svg, { clientX: 200, clientY: 200 }); // world (0,0) = p1
    fireEvent.pointerDown(svg, { clientX: 600, clientY: 200 }); // world (4000,0) = p2

    await waitFor(() => expect(useEditorStore.getState().prompt).not.toBeNull());
    expect(useEditorStore.getState().prompt?.label).toBe("Length P1 → P2 (mm)");

    const input = container.querySelector(".prompt input") as HTMLInputElement;
    await waitFor(() => expect(document.activeElement).toBe(input));

    // No click on the field first: type digits, then Enter, purely via the keyboard.
    typeDigits(input, "5000");
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => expect(useEditorStore.getState().plan().measurements).toHaveLength(1));
    expect(useEditorStore.getState().plan().measurements[0]).toMatchObject({
      kind: "length",
      a: "p1",
      b: "p2",
      value: 5000,
    });
    expect(useEditorStore.getState().prompt).toBeNull();
  });
});
