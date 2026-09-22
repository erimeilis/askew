import { t } from "@/i18n";
import { useCoach } from "./useCoach";

/**
 * Reactive getting-started coach: always shows the single next action, and advances itself
 * by watching the store (see `useCoach`). It is a plain panel, never a modal — no overlay, no
 * pointer capture — so it can never block the canvas underneath it.
 */
export function CoachPanel() {
  const coach = useCoach();
  if (!coach.visible) return null;

  return (
    <aside className="coach" aria-label={t("coach.title")}>
      <div className="coach-header">
        <span className="coach-dot" aria-hidden="true" />
        {t("coach.stepOf", { current: coach.stepIndex + 1, total: coach.totalSteps })}
      </div>
      <h2>{t(coach.step.titleKey)}</h2>
      <p>{t(coach.step.bodyKey)}</p>
      {coach.liveChecks.length > 0 && (
        <ul className="coach-checks">
          {coach.liveChecks.map((c) => (
            <li key={c.labelKey} className={c.done ? "done" : ""}>
              <span aria-hidden="true">{c.done ? "✓" : "○"}</span> {t(c.labelKey, c.params)}
            </li>
          ))}
        </ul>
      )}
      <div className="coach-actions">
        <button onClick={coach.skip}>{t("coach.skip")}</button>
        {coach.isLastStep ? (
          <button onClick={coach.finish}>{t("coach.finish")}</button>
        ) : (
          <button onClick={coach.next}>{t("coach.next")}</button>
        )}
      </div>
    </aside>
  );
}
