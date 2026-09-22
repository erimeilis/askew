import { useTheme } from "./useTheme";
import { ICONS, ICON_SIZE } from "@/config/icons";
import { t } from "@/i18n";

/**
 * Cycles system -> light -> dark -> system, in the top bar with the other controls. The icon
 * and the accessible name both reflect the current CHOICE; for "system" the label also names
 * what's actually rendering right now, since "system" alone doesn't say which theme is on
 * screen. A visually-hidden live region re-announces the label on every click, since the
 * button itself stays focused and an `aria-label` change alone is not reliably announced.
 */
export function ThemeToggle() {
  const { choice, applied, cycle } = useTheme();
  const Icon = ICONS.theme[choice];
  const label =
    choice === "system"
      ? t("theme.current.system", { applied: t(`theme.${applied}`) })
      : t("theme.current", { state: t(`theme.${choice}`) });

  return (
    <button className="theme-toggle" onClick={cycle} title={label} aria-label={label}>
      <Icon size={ICON_SIZE.button} aria-hidden="true" />
      <span className="sr-only" aria-live="polite">
        {label}
      </span>
    </button>
  );
}
