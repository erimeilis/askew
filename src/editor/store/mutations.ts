import type { Plan, Id, Side, OpeningKind } from "@/model/types";
import type { Vec } from "@/geometry/vec";
import { openingById, fixtureById, wallById, wallLength } from "@/model/queries";
import type { Selection } from "./types";

/** thickness measurements reference walls, not points, so a point can never be one of their referenced ids. */
const refsPoint = (m: Plan["measurements"][number], id: Id): boolean =>
  m.kind === "thickness"
    ? false
    : m.kind === "angle"
      ? [m.a, m.b, m.c].includes(id)
      : [m.a, m.b].includes(id);

export function deleteWall(plan: Plan, id: Id): void {
  plan.walls = plan.walls.filter((w) => w.id !== id);
  plan.openings = plan.openings.filter((o) => o.wallId !== id);
  plan.fixtures = plan.fixtures.filter((f) => f.anchor.wallId !== id);
  plan.measurements = plan.measurements.filter(
    (m) => !(m.kind === "thickness" && (m.wallA === id || m.wallB === id)),
  );
}

export function deletePoint(plan: Plan, id: Id): void {
  plan.points = plan.points.filter((p) => p.id !== id);
  plan.walls.filter((w) => w.a === id || w.b === id).forEach((w) => deleteWall(plan, w.id));
  plan.rooms = plan.rooms.filter((r) => !r.pointIds.includes(id));
  plan.measurements = plan.measurements.filter((m) => !refsPoint(m, id));
}

export function deleteSelection(plan: Plan, sel: Selection): void {
  if (!sel) return;
  switch (sel.type) {
    case "point":
      deletePoint(plan, sel.id);
      break;
    case "wall":
      deleteWall(plan, sel.id);
      break;
    case "room":
      plan.rooms = plan.rooms.filter((r) => r.id !== sel.id);
      break;
    case "measurement":
      plan.measurements = plan.measurements.filter((m) => m.id !== sel.id);
      break;
    case "opening":
      plan.openings = plan.openings.filter((o) => o.id !== sel.id);
      break;
    case "fixture":
      plan.fixtures = plan.fixtures.filter((f) => f.id !== sel.id);
      break;
  }
}

export function movePoint(plan: Plan, id: Id, to: Vec): void {
  const p = plan.points.find((x) => x.id === id);
  if (!p) throw new Error(`point ${id}`);
  p.x = to.x;
  p.y = to.y;
}

export function setMeasurementValue(plan: Plan, id: Id, value: number): void {
  const m = plan.measurements.find((x) => x.id === id);
  if (!m || !("value" in m)) throw new Error(`measurement ${id}`);
  m.value = value;
}

export function renameRoom(plan: Plan, id: Id, name: string): void {
  const r = plan.rooms.find((x) => x.id === id);
  if (!r) throw new Error(`room ${id}`);
  r.name = name;
}

export function setWallSide(plan: Plan, id: Id, side: Side): void {
  const w = plan.walls.find((x) => x.id === id);
  if (!w) throw new Error(`wall ${id}`);
  w.side = side;
}

/** A wall's own length never changes here — only the opening's range within it. */
function checkOpeningRange(plan: Plan, wallId: Id, offset: number, width: number): void {
  if (offset + width > wallLength(plan, wallById(plan, wallId))) {
    throw new Error(`opening exceeds wall length`);
  }
}

export function setOpeningKind(plan: Plan, id: Id, kind: OpeningKind): void {
  openingById(plan, id).kind = kind;
}

export function setOpeningOffset(plan: Plan, id: Id, offset: number): void {
  const o = openingById(plan, id);
  checkOpeningRange(plan, o.wallId, offset, o.width);
  o.offset = offset;
}

export function setOpeningWidth(plan: Plan, id: Id, width: number): void {
  const o = openingById(plan, id);
  checkOpeningRange(plan, o.wallId, o.offset, width);
  o.width = width;
}

export function setFixtureName(plan: Plan, id: Id, name: string): void {
  fixtureById(plan, id).name = name;
}

export function setFixtureOffset(plan: Plan, id: Id, offset: number): void {
  fixtureById(plan, id).anchor.offset = offset;
}

export function setFixtureDepth(plan: Plan, id: Id, depth: number): void {
  fixtureById(plan, id).anchor.depth = depth;
}

export function setFixtureW(plan: Plan, id: Id, w: number): void {
  fixtureById(plan, id).w = w;
}

export function setFixtureD(plan: Plan, id: Id, d: number): void {
  fixtureById(plan, id).d = d;
}
