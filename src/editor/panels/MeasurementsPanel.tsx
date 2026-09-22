import { useEditorStore } from "@/editor/store/editorStore";
import { measurementLabel } from "./measurementLabel";
import { ICONS, ICON_SIZE } from "@/config/icons";
import { t } from "@/i18n";

export function MeasurementsPanel() {
  const s = useEditorStore();
  const plan = s.plan();
  const res = s.results[s.activeFloorId];
  const byId = new Map(res?.residuals.map((r) => [r.measurementId, r]) ?? []);
  const floorPts = new Set(
    plan.points.filter((p) => p.floorId === s.activeFloorId).map((p) => p.id),
  );
  const floorWalls = new Set(
    plan.walls.filter((w) => w.floorId === s.activeFloorId).map((w) => w.id),
  );
  const rows = plan.measurements.filter((m) =>
    m.kind === "thickness" ? floorWalls.has(m.wallA) : floorPts.has(m.a),
  );
  const WarningIcon = ICONS.status.warning;

  return (
    <aside className="measurements">
      <h2>{t("panel.measurements")}</h2>
      {res && (
        <div className="rms">
          {t("solve.rms", { value: res.rms.toFixed(2) })} ·{" "}
          {t("panel.redundancy", { count: res.redundancy })}
        </div>
      )}
      {res && res.unconstrained.length > 0 && (
        <div className="warn">
          <WarningIcon size={ICON_SIZE.inline} aria-hidden="true" />
          {t("panel.unconstrained", { count: res.unconstrained.length })}
        </div>
      )}
      {s.error && <div className="error">{s.error}</div>}
      {rows.length === 0 ? (
        <p className="measurements-empty">{t("panel.measurements.empty")}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t("panel.kind")}</th>
              <th />
              <th>{t("panel.value")}</th>
              <th>{t("panel.residual")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => {
              const r = byId.get(m.id);
              const sel = s.selection?.type === "measurement" && s.selection.id === m.id;
              return (
                <tr
                  key={m.id}
                  className={[r?.flagged ? "flagged" : "", sel ? "selected" : ""]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => s.select({ type: "measurement", id: m.id })}
                >
                  <td>
                    {r?.flagged && <WarningIcon size={ICON_SIZE.inline} aria-hidden="true" />}
                    {m.kind}
                  </td>
                  <td>{measurementLabel(plan, m)}</td>
                  <td>{"value" in m ? m.value : ""}</td>
                  <td>{r ? `${r.residual.toFixed(1)} ${r.unit}` : ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </aside>
  );
}
