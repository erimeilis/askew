import type { Vec } from "@/geometry/vec";
import type { Hit } from "@/editor/view/hitTest";
import type { EditorState, ToolId } from "@/editor/store/types";

export type { ToolId };

/** A tool is a plain object; it never imports React. Every hook is optional except onClick. */
export interface Tool {
  id: ToolId;
  labelKey: string; // icon is looked up as ICONS.tool[id]; tools never import an icon
  onClick(world: Vec, hit: Hit, s: EditorState): void;
  onMove?(world: Vec, s: EditorState): void;
  onEnter?(s: EditorState): void;
  onEscape?(s: EditorState): void;
  onDelete?(s: EditorState): void;
  onDragStart?(hit: Hit, s: EditorState): void;
  onDrag?(world: Vec, s: EditorState): void;
  onDragEnd?(s: EditorState): void;
}
