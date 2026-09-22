import { useState } from "react";
import { useEditorStore } from "@/editor/store/editorStore";
import { planToSvg } from "@/export/svg";
import { planToDxf } from "@/export/dxf/planToDxf";
import { downloadText } from "@/persistence/browser/files";
import { EXPORT_CONFIG } from "@/config/export";
import { ICONS, ICON_SIZE } from "@/config/icons";
import { t } from "@/i18n";
import printCss from "@/editor/print.css?raw";

const FileIcon = ICONS.exportMenu.file;
const PrintIcon = ICONS.exportMenu.print;

/**
 * Scale picker plus Export SVG, Export DXF and Print. SVG/Print share `planToSvg`; DXF uses
 * `planToDxf` — both string builders read the same wall-outline and dimension geometry the
 * canvas draws, so nothing exported can disagree with what's on screen. Print opens a plain
 * HTML document in a new window with the SVG inlined and `print.css` embedded, then calls
 * `print()`.
 */
export function ExportMenu() {
  const s = useEditorStore();
  const plan = s.plan();
  const floor = plan.floors.find((f) => f.id === s.activeFloorId) ?? plan.floors[0];
  const [scale, setScale] = useState<number>(EXPORT_CONFIG.printScales[0]);

  const svgFor = () => planToSvg(plan, floor.id, { scale, cfg: EXPORT_CONFIG });

  const handleExportSvg = () => {
    downloadText(`${plan.name}-${floor.name}.svg`, svgFor(), "image/svg+xml");
  };

  const handleExportDxf = () => {
    const dxf = planToDxf(plan, floor.id, EXPORT_CONFIG);
    downloadText(`${plan.name}-${floor.name}.dxf`, dxf, "application/dxf");
  };

  const handlePrint = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(
      `<!DOCTYPE html><html><head><title>${plan.name}</title><style>${printCss}</style></head>` +
        `<body>${svgFor()}</body></html>`,
    );
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <div className="exportmenu">
      <select value={scale} onChange={(e) => setScale(Number(e.target.value))}>
        {EXPORT_CONFIG.printScales.map((sc) => (
          <option key={sc} value={sc}>
            {t("print.scale", { scale: sc })}
          </option>
        ))}
      </select>
      <button
        onClick={handleExportSvg}
        title={t("file.export.svg")}
        aria-label={t("file.export.svg")}
      >
        <FileIcon size={ICON_SIZE.button} />
      </button>
      <button
        onClick={handleExportDxf}
        title={t("file.export.dxf")}
        aria-label={t("file.export.dxf")}
      >
        <FileIcon size={ICON_SIZE.button} />
      </button>
      <button onClick={handlePrint} title={t("file.print")} aria-label={t("file.print")}>
        <PrintIcon size={ICON_SIZE.button} />
      </button>
    </div>
  );
}
