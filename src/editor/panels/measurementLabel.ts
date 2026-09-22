import type { Plan, Measurement, Id } from "@/model/types";
import { pointById, wallById, floorPoints, floorWalls, floorRooms } from "@/model/queries";
import { t } from "@/i18n";

const pointLabel = (plan: Plan, id: Id): string => {
  const point = pointById(plan, id);
  const index = floorPoints(plan, point.floorId).findIndex((p) => p.id === id);
  return t("measurement.point", { n: index + 1 });
};

const wallLabel = (plan: Plan, id: Id): string => {
  const wall = wallById(plan, id);
  const index = floorWalls(plan, wall.floorId).findIndex((w) => w.id === id);
  return t("measurement.wall", { n: index + 1 });
};

/**
 * `"<room name>: "` when every one of `pointIds` belongs to the same room and that room is
 * named, otherwise `""` — covering both "spans rooms" and "shared but unnamed room" alike.
 */
function roomPrefix(plan: Plan, pointIds: Id[]): string {
  const floorId = pointById(plan, pointIds[0]).floorId;
  const rooms = floorRooms(plan, floorId);
  const roomIds = pointIds.map((id) => rooms.find((r) => r.pointIds.includes(id))?.id);
  const [first, ...rest] = roomIds;
  if (!first || rest.some((id) => id !== first)) return "";
  const room = rooms.find((r) => r.id === first);
  return room?.name ? `${room.name}: ` : "";
}

export function measurementLabel(plan: Plan, m: Measurement): string {
  switch (m.kind) {
    case "length":
      return `${roomPrefix(plan, [m.a, m.b])}${pointLabel(plan, m.a)} → ${pointLabel(plan, m.b)}`;
    case "thickness":
      return `${wallLabel(plan, m.wallA)} ∥ ${wallLabel(plan, m.wallB)}`;
    case "angle": {
      const prefix = roomPrefix(plan, [m.a, m.b, m.c]);
      return `${prefix}∠ ${pointLabel(plan, m.a)}-${pointLabel(plan, m.b)}-${pointLabel(plan, m.c)}`;
    }
    case "align":
      return `${roomPrefix(plan, [m.a, m.b])}${pointLabel(plan, m.a)} ≡ ${pointLabel(plan, m.b)} (${m.axis})`;
  }
}
