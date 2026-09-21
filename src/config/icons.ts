import {
  AlignLeftSimpleIcon,
  AngleIcon,
  ArrowClockwiseIcon,
  ArrowCounterClockwiseIcon,
  ArrowsHorizontalIcon,
  CubeIcon,
  CursorIcon,
  DoorOpenIcon,
  ExportIcon,
  FilePlusIcon,
  FloppyDiskIcon,
  FolderOpenIcon,
  type Icon,
  PlusIcon,
  PolygonIcon,
  PrinterIcon,
  RulerIcon,
  StairsIcon,
  TrashIcon,
  WarningIcon,
} from "@phosphor-icons/react";

/**
 * The only place a Phosphor icon component is named. Components read
 * `ICONS.<group>.<key>` so the icon set can be swapped in one file.
 *
 * Phosphor 2.1 deprecated the bare names (`Cursor`, `ArrowClockwise`, ...) in
 * favour of the `*Icon` suffixed exports; the bare ones still resolve but emit
 * TS6385. Use the suffixed names.
 */
export const ICONS = {
  tool: {
    select: CursorIcon,
    room: PolygonIcon,
    measure: RulerIcon,
    thickness: ArrowsHorizontalIcon,
    angle: AngleIcon,
    align: AlignLeftSimpleIcon,
    opening: DoorOpenIcon,
    fixture: CubeIcon,
  },
  file: { new: FilePlusIcon, open: FolderOpenIcon, save: FloppyDiskIcon },
  exportMenu: { file: ExportIcon, print: PrinterIcon },
  edit: {
    undo: ArrowCounterClockwiseIcon,
    redo: ArrowClockwiseIcon,
    delete: TrashIcon,
  },
  floor: { add: PlusIcon, tab: StairsIcon },
  status: { warning: WarningIcon },
} satisfies Record<string, Record<string, Icon>>;

export const ICON_SIZE = { rail: 22, button: 18, inline: 14 } as const;
export const ICON_WEIGHT = { idle: "regular", active: "fill" } as const;
