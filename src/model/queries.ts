import type { Plan, Id, Point, Wall, Room, Opening, Fixture } from "./types";
import { dist } from "@/geometry/vec";
export const floorPoints = (p: Plan, f: Id): Point[] => p.points.filter((x) => x.floorId === f);
export const floorWalls = (p: Plan, f: Id): Wall[] => p.walls.filter((x) => x.floorId === f);
export const floorRooms = (p: Plan, f: Id): Room[] => p.rooms.filter((x) => x.floorId === f);
export const floorFixtures = (p: Plan, f: Id): Fixture[] =>
  p.fixtures.filter((x) => x.floorId === f);
/** Openings have no floorId of their own; a wall's floor decides which floor its openings belong to. */
export function floorOpenings(p: Plan, f: Id): Opening[] {
  const wallIds = new Set(floorWalls(p, f).map((w) => w.id));
  return p.openings.filter((o) => wallIds.has(o.wallId));
}
export function pointById(p: Plan, id: Id): Point {
  const x = p.points.find((q) => q.id === id);
  if (!x) throw new Error(`point ${id} not found`);
  return x;
}
export function wallById(p: Plan, id: Id): Wall {
  const x = p.walls.find((q) => q.id === id);
  if (!x) throw new Error(`wall ${id} not found`);
  return x;
}
export function openingById(p: Plan, id: Id): Opening {
  const x = p.openings.find((q) => q.id === id);
  if (!x) throw new Error(`opening ${id} not found`);
  return x;
}
export function fixtureById(p: Plan, id: Id): Fixture {
  const x = p.fixtures.find((q) => q.id === id);
  if (!x) throw new Error(`fixture ${id} not found`);
  return x;
}
export function wallEndpoints(p: Plan, w: Wall): [Point, Point] {
  return [pointById(p, w.a), pointById(p, w.b)];
}
export function wallLength(p: Plan, w: Wall): number {
  const [a, b] = wallEndpoints(p, w);
  return dist(a, b);
}
/** Walls of a room in polygon order: wall whose (a,b) equals consecutive pointIds, either direction. */
export function roomWalls(p: Plan, r: Room): (Wall | undefined)[] {
  return r.pointIds.map((pid, i) => {
    const nid = r.pointIds[(i + 1) % r.pointIds.length];
    return p.walls.find((w) => (w.a === pid && w.b === nid) || (w.a === nid && w.b === pid));
  });
}
export function findWallBetween(p: Plan, a: Id, b: Id): Wall | undefined {
  return p.walls.find((w) => (w.a === a && w.b === b) || (w.a === b && w.b === a));
}
