import { useCoachStore } from "./coachStore";
import { ICONS, ICON_SIZE } from "@/config/icons";
import { t } from "@/i18n";

/**
 * Brings the coach back deliberately at any time, regardless of whether it was skipped
 * before.
 */
export function HelpButton() {
  const reopen = useCoachStore((s) => s.reopen);
  const HelpIcon = ICONS.coach.help;
  return (
    <button className="help-button" onClick={reopen} aria-label={t("coach.help")}>
      <HelpIcon size={ICON_SIZE.button} aria-hidden="true" />
      {t("coach.help")}
    </button>
  );
}
