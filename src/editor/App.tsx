import { useEffect } from "react";
import { Canvas } from "./canvas/Canvas";
import { ToolRail } from "./panels/ToolRail";
import { FileMenu } from "./panels/FileMenu";
import { ExportMenu } from "./panels/ExportMenu";
import { FloorTabs } from "./panels/FloorTabs";
import { MeasurementsPanel } from "./panels/MeasurementsPanel";
import { PropertiesPanel } from "./panels/PropertiesPanel";
import { PromptBox } from "./panels/PromptBox";
import { CoachPanel } from "./coach/CoachPanel";
import { HelpButton } from "./coach/HelpButton";
import { ThemeToggle } from "./theme/ThemeToggle";
import { useKeyboard } from "./keyboard/useKeyboard";
import { useEditorStore } from "./store/editorStore";
import { loadAutosave } from "@/persistence/browser/autosave";
import { restoreFileHandle } from "@/persistence/browser/files";
import { EDITOR_CONFIG } from "@/config/editor";
import { t } from "@/i18n";
import "@/editor/styles.css";

// Stroke widths are a config value, not a CSS literal: set once here as custom properties so
// styles.css can read `var(--stroke-grid)` / `var(--stroke-selected)` and the numbers stay in
// EDITOR_CONFIG.
const rootStyle = {
  "--stroke-grid": String(EDITOR_CONFIG.gridStrokePx),
  "--stroke-grid-major": String(EDITOR_CONFIG.gridMajorStrokePx),
  "--stroke-selected": String(EDITOR_CONFIG.selectedStrokePx),
} as React.CSSProperties;

export function App() {
  const load = useEditorStore((s) => s.loadPlan);
  const newPlan = useEditorStore((s) => s.newPlan);
  const setError = useEditorStore((s) => s.setError);
  useKeyboard();

  useEffect(() => {
    let cancelled = false;
    // restoreFileHandle() never rejects (it logs and falls back to null internally); a
    // missing/unreadable handle just means the next Save shows the picker.
    void restoreFileHandle();
    loadAutosave()
      .then((saved) => {
        if (cancelled) return;
        if (saved) load(saved);
        else newPlan(t("app.title"));
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        newPlan(t("app.title"));
        setError(String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [load, newPlan, setError]);

  return (
    <div className="app" style={rootStyle}>
      <header className="topbar">
        <FileMenu />
        <div className="topbar-right">
          <ExportMenu />
          <HelpButton />
          <ThemeToggle />
        </div>
      </header>
      <ToolRail />
      <main className="center">
        <FloorTabs />
        <Canvas />
        <PromptBox />
        <CoachPanel />
      </main>
      <div className="sidebar">
        <MeasurementsPanel />
        <PropertiesPanel />
      </div>
    </div>
  );
}
