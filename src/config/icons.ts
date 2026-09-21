import { Cursor, Polygon, Ruler, ArrowsHorizontal, Angle, AlignLeftSimple, DoorOpen, Cube,
  FilePlus, FolderOpen, FloppyDisk, Export, Printer, ArrowCounterClockwise, ArrowClockwise,
  Trash, Plus, Stairs, Warning, type Icon } from '@phosphor-icons/react';
export const ICONS = {
  tool: { select: Cursor, room: Polygon, measure: Ruler, thickness: ArrowsHorizontal, angle: Angle, align: AlignLeftSimple, opening: DoorOpen, fixture: Cube },
  file: { new: FilePlus, open: FolderOpen, save: FloppyDisk },
  exportMenu: { file: Export, print: Printer },
  edit: { undo: ArrowCounterClockwise, redo: ArrowClockwise, delete: Trash },
  floor: { add: Plus, tab: Stairs },
  status: { warning: Warning },
} satisfies Record<string, Record<string, Icon>>;
export const ICON_SIZE = { rail: 22, button: 18, inline: 14 } as const;
export const ICON_WEIGHT = { idle: 'regular', active: 'fill' } as const;
