import type { Plan, Id, Floor } from "@/model/types";
import { createId } from "@/model/factory";
import { deletePoint } from "./mutations";
import { t } from "@/i18n";

export function addFloor(plan: Plan): Floor {
  const floor: Floor = {
    id: createId("f"),
    name: t("floor.default", { n: plan.floors.length + 1 }),
    elevation: 0,
  };
  plan.floors.push(floor);
  return floor;
}

export function renameFloor(plan: Plan, id: Id, name: string): void {
  const floor = plan.floors.find((f) => f.id === id);
  if (!floor) throw new Error(`floor ${id} not found`);
  floor.name = name;
}

/**
 * Cascades everything carrying this floor id: deleting each of its points already cascades the
 * walls attached to it (which in turn cascade openings, fixtures and thickness measurements),
 * the rooms containing it, and any length/angle/align measurement referencing it — the rest is a
 * belt-and-braces sweep for rooms/fixtures that reference the floor without referencing a point
 * that was just removed. Refuses to delete the last remaining floor.
 */
export function deleteFloor(plan: Plan, id: Id): void {
  if (plan.floors.length <= 1) throw new Error("cannot delete the last floor");
  for (const p of plan.points.filter((pt) => pt.floorId === id)) deletePoint(plan, p.id);
  plan.rooms = plan.rooms.filter((r) => r.floorId !== id);
  plan.fixtures = plan.fixtures.filter((f) => f.floorId !== id);
  plan.floors = plan.floors.filter((f) => f.id !== id);
}
