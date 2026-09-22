import {
  setFixtureName,
  setFixtureOffset,
  setFixtureDepth,
  setFixtureW,
  setFixtureD,
} from "@/editor/store/mutations";
import type { EditorState } from "@/editor/store/types";
import type { Fixture } from "@/model/types";
import { t } from "@/i18n";
import { Row } from "./propertyRow";
import { commitOnEnter, commitNumberOnEnter } from "./propertyCommit";

/** Name, offset, distance from the wall, width and depth, all editable. */
export function FixtureProperties({ s, f }: { s: EditorState; f: Fixture }) {
  return (
    <>
      <Row label={t("prop.name")}>
        <input
          key={`${f.id}:${f.name}`}
          defaultValue={f.name}
          onKeyDown={commitOnEnter((v) => s.update((p) => setFixtureName(p, f.id, v)))}
        />
      </Row>
      <Row label={t("prop.offset")}>
        <input
          key={`${f.id}:${f.anchor.offset}`}
          type="number"
          defaultValue={f.anchor.offset}
          onKeyDown={commitNumberOnEnter((n) => s.update((p) => setFixtureOffset(p, f.id, n)))}
        />
      </Row>
      <Row label={t("prop.wallDistance")}>
        <input
          key={`${f.id}:${f.anchor.depth}`}
          type="number"
          defaultValue={f.anchor.depth}
          onKeyDown={commitNumberOnEnter((n) => s.update((p) => setFixtureDepth(p, f.id, n)))}
        />
      </Row>
      <Row label={t("prop.width")}>
        <input
          key={`${f.id}:${f.w}`}
          type="number"
          defaultValue={f.w}
          onKeyDown={commitNumberOnEnter((n) => s.update((p) => setFixtureW(p, f.id, n)))}
        />
      </Row>
      <Row label={t("prop.depth")}>
        <input
          key={`${f.id}:${f.d}`}
          type="number"
          defaultValue={f.d}
          onKeyDown={commitNumberOnEnter((n) => s.update((p) => setFixtureD(p, f.id, n)))}
        />
      </Row>
    </>
  );
}
