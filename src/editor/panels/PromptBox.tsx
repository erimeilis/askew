import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "@/editor/store/editorStore";

/**
 * Enter commits (and stops the keydown from also reaching the window-level Enter
 * handler). Escape is deliberately NOT stopped here: it must bubble to the
 * window listener, whose active tool clears its own pending clicks/draft as
 * well as the prompt — that is the only place which knows how to cancel.
 */
export function PromptBox() {
  const prompt = useEditorStore((s) => s.prompt);
  const [v, setV] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setV("");
    ref.current?.focus();
  }, [prompt]);

  if (!prompt) return null;
  const commit = () => prompt.onCommit(v);

  return (
    <div className="prompt">
      <label>{prompt.label}</label>
      {prompt.kind === "choice" ? (
        <select
          ref={ref as never}
          value={v}
          onChange={(e) => {
            setV(e.target.value);
            prompt.onCommit(e.target.value);
          }}
        >
          <option value="" />
          {prompt.choices?.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      ) : (
        <input
          ref={ref}
          type={prompt.kind === "number" ? "number" : "text"}
          value={v}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              commit();
              e.stopPropagation();
            }
          }}
        />
      )}
    </div>
  );
}
