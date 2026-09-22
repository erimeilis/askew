import { useEditorStore } from "@/editor/store/editorStore";
import { savePlanFile, openPlanFile, resetFileHandle } from "@/persistence/browser/files";
import { ICONS, ICON_SIZE } from "@/config/icons";
import { t } from "@/i18n";

const NewIcon = ICONS.file.new;
const OpenIcon = ICONS.file.open;
const SaveIcon = ICONS.file.save;

/** New / Open / Save plus the plan-name field; all three actions go through `files.ts`, never
 * touching the File System Access API or IndexedDB directly. */
export function FileMenu() {
  const s = useEditorStore();
  const plan = s.plan();

  const handleNew = async () => {
    await resetFileHandle();
    s.newPlan(t("app.title"));
  };

  const handleOpen = async () => {
    try {
      const opened = await openPlanFile();
      if (opened) s.loadPlan(opened.plan);
    } catch (e) {
      s.setError(String(e));
    }
  };

  const handleSave = async () => {
    try {
      await savePlanFile(plan);
    } catch (e) {
      s.setError(String(e));
    }
  };

  return (
    <div className="filemenu">
      <input
        key={plan.name}
        defaultValue={plan.name}
        aria-label={t("file.name")}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const v = e.currentTarget.value;
            s.update(
              (p) => {
                p.name = v;
              },
              { solve: false },
            );
          }
        }}
      />
      <button onClick={handleNew} title={t("file.new")} aria-label={t("file.new")}>
        <NewIcon size={ICON_SIZE.button} />
      </button>
      <button onClick={handleOpen} title={t("file.open")} aria-label={t("file.open")}>
        <OpenIcon size={ICON_SIZE.button} />
      </button>
      <button onClick={handleSave} title={t("file.save")} aria-label={t("file.save")}>
        <SaveIcon size={ICON_SIZE.button} />
      </button>
    </div>
  );
}
