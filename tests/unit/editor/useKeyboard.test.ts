// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, cleanup } from "@testing-library/react";
import { useKeyboard } from "@/editor/keyboard/useKeyboard";
import { useEditorStore } from "@/editor/store/editorStore";
import { tools } from "@/editor/tools";

function fireKeydown(tagName: string, key: string, extra: KeyboardEventInit = {}): void {
  const el = document.createElement(tagName);
  document.body.appendChild(el);
  el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, ...extra }));
  document.body.removeChild(el);
}

describe("useKeyboard form-control guard", () => {
  const originalOnDelete = tools.select.onDelete;

  beforeEach(() => {
    useEditorStore.getState().newPlan("t");
    useEditorStore.getState().setTool("measure"); // measureTool has a real onEscape
  });

  afterEach(() => {
    tools.select.onDelete = originalOnDelete;
    cleanup();
  });

  it.each(["INPUT", "SELECT", "TEXTAREA"])(
    "%s: blocks undo/redo/delete, but Escape still reaches the active tool",
    (tag) => {
      const undo = vi.fn();
      const redo = vi.fn();
      const onDelete = vi.fn();
      useEditorStore.setState({ undo, redo });
      tools.select.onDelete = onDelete;

      const { unmount } = renderHook(() => useKeyboard());
      fireKeydown(tag, "z", { ctrlKey: true });
      fireKeydown(tag, "z", { ctrlKey: true, shiftKey: true });
      fireKeydown(tag, "Delete");
      expect(undo).not.toHaveBeenCalled();
      expect(redo).not.toHaveBeenCalled();
      expect(onDelete).not.toHaveBeenCalled();

      useEditorStore.getState().setPending(["p1"]);
      fireKeydown(tag, "Escape");
      expect(useEditorStore.getState().pending).toEqual([]);

      unmount();
    },
  );

  it("a non-form target still fires undo and delete", () => {
    const undo = vi.fn();
    const onDelete = vi.fn();
    useEditorStore.setState({ undo });
    tools.select.onDelete = onDelete;

    const { unmount } = renderHook(() => useKeyboard());
    fireKeydown("DIV", "z", { ctrlKey: true });
    fireKeydown("DIV", "Delete");
    expect(undo).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);

    unmount();
  });
});
