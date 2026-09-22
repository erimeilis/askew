import { useEditorStore } from "@/editor/store/editorStore";
import { addFloor, renameFloor, deleteFloor } from "@/editor/store/floorMutations";
import { askText } from "@/editor/tools/promptHelpers";
import { ICONS, ICON_SIZE } from "@/config/icons";
import { t } from "@/i18n";

const TabIcon = ICONS.floor.tab;
const AddIcon = ICONS.floor.add;
const DeleteIcon = ICONS.edit.delete;

/**
 * One tab per floor: click switches the active floor, double-click renames it. `+` adds a
 * floor and switches to it; the trash button deletes the active floor (refused by
 * `deleteFloor` itself when it is the last one) and switches to the first remaining floor.
 * None of these change any geometry, so they never trigger a re-solve.
 */
export function FloorTabs() {
  const s = useEditorStore();
  const plan = s.plan();

  const handleAdd = () => {
    let newId: string | undefined;
    s.update(
      (p) => {
        newId = addFloor(p).id;
      },
      { solve: false },
    );
    if (newId) s.setActiveFloor(newId);
  };

  const handleRename = (id: string) => {
    askText(s, "floor.prompt.rename", (name) => {
      s.update((p) => renameFloor(p, id, name), { solve: false });
    });
  };

  const handleDelete = () => {
    if (plan.floors.length <= 1) return;
    let firstRemaining: string | undefined;
    s.update(
      (p) => {
        deleteFloor(p, s.activeFloorId);
        firstRemaining = p.floors[0].id;
      },
      { solve: false },
    );
    if (firstRemaining) s.setActiveFloor(firstRemaining);
  };

  return (
    <nav className="floortabs">
      {plan.floors.map((f) => {
        const active = f.id === s.activeFloorId;
        return (
          <button
            key={f.id}
            className={active ? "active" : ""}
            onClick={() => s.setActiveFloor(f.id)}
            onDoubleClick={() => handleRename(f.id)}
            title={f.name}
            aria-pressed={active}
          >
            <TabIcon size={ICON_SIZE.inline} aria-hidden="true" />
            {f.name}
          </button>
        );
      })}
      <button onClick={handleAdd} title={t("floor.add")} aria-label={t("floor.add")}>
        <AddIcon size={ICON_SIZE.inline} />
      </button>
      <button
        onClick={handleDelete}
        title={t("floor.delete")}
        aria-label={t("floor.delete")}
        disabled={plan.floors.length <= 1}
      >
        <DeleteIcon size={ICON_SIZE.inline} />
      </button>
    </nav>
  );
}
