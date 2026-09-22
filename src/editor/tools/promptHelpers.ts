import type { EditorState } from "@/editor/store/types";
import { t } from "@/i18n";

export function askNumber(
  s: EditorState,
  labelKey: string,
  params: Record<string, string | number>,
  onValue: (n: number) => void,
): void {
  s.setPrompt({
    label: t(labelKey, params),
    kind: "number",
    onCommit: (v) => {
      const n = Number(v);
      if (Number.isFinite(n) && n > 0) {
        s.setPrompt(null);
        onValue(n);
      }
    },
  });
}

export function askText(s: EditorState, labelKey: string, onValue: (v: string) => void): void {
  s.setPrompt({
    label: t(labelKey),
    kind: "text",
    onCommit: (v) => {
      s.setPrompt(null);
      onValue(v);
    },
  });
}

export function askChoice(
  s: EditorState,
  labelKey: string,
  choices: string[],
  onValue: (v: string) => void,
): void {
  s.setPrompt({
    label: t(labelKey),
    kind: "choice",
    choices,
    onCommit: (v) => {
      if (choices.includes(v)) {
        s.setPrompt(null);
        onValue(v);
      }
    },
  });
}
