import { useEditorStore } from "@/editor/store/editorStore";
import { renameRoom, setMeasurementValue, setWallSide } from "@/editor/store/mutations";
import { pointById, wallById } from "@/model/queries";
import type { Side } from "@/model/types";
import { t } from "@/i18n";
import { Row } from "./propertyRow";
import { commitOnEnter } from "./propertyCommit";
import { OpeningProperties } from "./OpeningProperties";
import { FixtureProperties } from "./FixtureProperties";

/**
 * Shows the selected item's editable fields. Point coordinates are the solver's output and are
 * read-only here; everything else commits through a pure `mutations.ts` function on Enter, so a
 * property edit re-solves exactly like any other `s.update`. Openings and fixtures add no solver
 * variables, so editing their kind/offset/width/depth never moves a point.
 */
export function PropertiesPanel() {
  const s = useEditorStore();
  const sel = s.selection;
  if (!sel) return null;
  const plan = s.plan();

  let body: React.ReactNode = null;
  if (sel.type === "point") {
    const p = pointById(plan, sel.id);
    body = (
      <>
        <Row label={t("prop.x")}>{Math.round(p.x)}</Row>
        <Row label={t("prop.y")}>{Math.round(p.y)}</Row>
      </>
    );
  } else if (sel.type === "wall") {
    const w = wallById(plan, sel.id);
    body = (
      <>
        <Row label={t("prop.thickness")}>{w.thickness}</Row>
        <Row label={t("prop.side")}>
          <select
            key={`${sel.id}:${w.side}`}
            defaultValue={w.side}
            onChange={(e) => s.update((p) => setWallSide(p, sel.id, e.target.value as Side))}
          >
            <option value="left">left</option>
            <option value="right">right</option>
          </select>
        </Row>
      </>
    );
  } else if (sel.type === "room") {
    const r = plan.rooms.find((x) => x.id === sel.id);
    if (r) {
      body = (
        <Row label={t("prop.name")}>
          <input
            key={`${sel.id}:${r.name}`}
            defaultValue={r.name}
            onKeyDown={commitOnEnter((v) => s.update((p) => renameRoom(p, sel.id, v)))}
          />
        </Row>
      );
    }
  } else if (sel.type === "measurement") {
    const m = plan.measurements.find((x) => x.id === sel.id);
    if (m) {
      body = (
        <>
          <Row label={t("prop.kind")}>{m.kind}</Row>
          {"value" in m && (
            <Row label={t("prop.value")}>
              <input
                key={`${sel.id}:${m.value}`}
                type="number"
                defaultValue={m.value}
                onKeyDown={commitOnEnter((v) => {
                  const n = Number(v);
                  if (Number.isFinite(n)) s.update((p) => setMeasurementValue(p, sel.id, n));
                })}
              />
            </Row>
          )}
        </>
      );
    }
  } else if (sel.type === "opening") {
    const o = plan.openings.find((x) => x.id === sel.id);
    if (o) body = <OpeningProperties s={s} o={o} />;
  } else if (sel.type === "fixture") {
    const f = plan.fixtures.find((x) => x.id === sel.id);
    if (f) body = <FixtureProperties s={s} f={f} />;
  }

  if (!body) return null;

  return (
    <aside className="properties">
      <h2>{t("panel.properties")}</h2>
      {body}
    </aside>
  );
}
