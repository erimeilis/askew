import { t } from "@/i18n";
import { EDITOR_CONFIG } from "@/config/editor";

/**
 * Quiet, centred hint shown when the active floor has nothing on it yet — so the empty grid
 * never reads as broken. Rendered in screen space (like `GridLayer`, before the world
 * transform) so it stays centred regardless of pan/zoom. `pointer-events: none` (styles.css)
 * means it can never intercept a click meant for the grid beneath it, and it disappears the
 * instant the caller says the floor is no longer empty.
 */
export function EmptyHintLayer({
  visible,
  width,
  height,
}: {
  visible: boolean;
  width: number;
  height: number;
}) {
  if (!visible) return null;
  return (
    <g className="empty-hint" transform={`translate(${width / 2} ${height / 2})`}>
      <text y="-10">{t("canvas.emptyHint.main")}</text>
      <text y="14" className="empty-hint-sub">
        {t("canvas.emptyHint.grid", { size: EDITOR_CONFIG.gridMm })}
      </text>
    </g>
  );
}
