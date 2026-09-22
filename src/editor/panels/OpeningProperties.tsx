import { setOpeningKind, setOpeningOffset, setOpeningWidth } from "@/editor/store/mutations";
import type { EditorState } from "@/editor/store/types";
import type { Opening, OpeningKind } from "@/model/types";
import { t } from "@/i18n";
import { Row } from "./propertyRow";
import { commitNumberOnEnter } from "./propertyCommit";

/** Kind, offset and width, editable — a range that would run past the wall is rejected by the
 * mutation itself, so a bad edit just throws rather than drawing something impossible. */
export function OpeningProperties({ s, o }: { s: EditorState; o: Opening }) {
  return (
    <>
      <Row label={t("prop.kind")}>
        <select
          key={`${o.id}:${o.kind}`}
          defaultValue={o.kind}
          onChange={(e) => s.update((p) => setOpeningKind(p, o.id, e.target.value as OpeningKind))}
        >
          <option value="door">door</option>
          <option value="window">window</option>
        </select>
      </Row>
      <Row label={t("prop.offset")}>
        <input
          key={`${o.id}:${o.offset}`}
          type="number"
          defaultValue={o.offset}
          onKeyDown={commitNumberOnEnter((n) => s.update((p) => setOpeningOffset(p, o.id, n)))}
        />
      </Row>
      <Row label={t("prop.width")}>
        <input
          key={`${o.id}:${o.width}`}
          type="number"
          defaultValue={o.width}
          onKeyDown={commitNumberOnEnter((n) => s.update((p) => setOpeningWidth(p, o.id, n)))}
        />
      </Row>
    </>
  );
}
