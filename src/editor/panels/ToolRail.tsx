import { useEditorStore } from "@/editor/store/editorStore";
import { tools } from "@/editor/tools";
import { ICONS, ICON_SIZE, ICON_WEIGHT } from "@/config/icons";
import { t } from "@/i18n";

/** Icon plus a visible text label; title/aria-label keep the tooltip and accessible name too. */
export function ToolRail() {
  const tool = useEditorStore((s) => s.tool);
  const setTool = useEditorStore((s) => s.setTool);
  return (
    <nav className="toolrail">
      {Object.values(tools).map((tl) => {
        const Icon = ICONS.tool[tl.id];
        const active = tl.id === tool;
        const label = t(tl.labelKey);
        return (
          <button
            key={tl.id}
            className={active ? "active" : ""}
            onClick={() => setTool(tl.id)}
            title={label}
            aria-label={label}
            aria-pressed={active}
          >
            <Icon size={ICON_SIZE.rail} weight={active ? ICON_WEIGHT.active : ICON_WEIGHT.idle} />
            <span className="toolrail-label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
