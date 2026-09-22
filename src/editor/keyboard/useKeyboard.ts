import { useEffect } from "react";
import { useEditorStore } from "@/editor/store/editorStore";
import { tools } from "@/editor/tools";

/** Form controls the prompt box can render: text/number input, the choice `<select>`, and any future `<textarea>`. */
const FORM_TAGS = new Set(["INPUT", "SELECT", "TEXTAREA"]);

/**
 * Escape is checked before the form-tag bail-out: PromptBox's input does not
 * stop Escape from bubbling, and it must reach the active tool's onEscape
 * (which clears pending clicks/draft) even while the prompt has focus, from
 * any of its form controls.
 */
export function useKeyboard(): void {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const s = useEditorStore.getState();
      if (e.key === "Escape") {
        tools[s.tool].onEscape?.(s);
        return;
      }
      if (FORM_TAGS.has((e.target as HTMLElement).tagName)) return;
      if (e.key === "Enter") tools[s.tool].onEnter?.(s);
      else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) s.redo();
        else s.undo();
      } else if (e.key === "Delete" || e.key === "Backspace") tools.select.onDelete?.(s);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
}
