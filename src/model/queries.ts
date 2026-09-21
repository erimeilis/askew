import type { Plan, Id, Point, Wall, Room } from './types';
export const floorPoints = (p: Plan, f: Id): Point[] => p.points.filter(x => x.floorId === f);
export const floorWalls = (p: Plan, f: Id): Wall[] => p.walls.filter(x => x.floorId === f);
export const floorRooms = (p: Plan, f: Id): Room[] => p.rooms.filter(x => x.floorId === f);
export function pointById(p: Plan, id: Id): Point { const x = p.points.find(q => q.id === id); if (!x) throw new Error(`point ${id} not found`); return x; }
export function wallById(p: Plan, id: Id): Wall { const x = p.walls.find(q => q.id === id); if (!x) throw new Error(`wall ${id} not found`); return x; }
export function wallEndpoints(p: Plan, w: Wall): [Point, Point] { return [pointById(p, w.a), pointById(p, w.b)]; }
/** Walls of a room in polygon order: wall whose (a,b) equals consecutive pointIds, either direction. */
export function roomWalls(p: Plan, r: Room): (Wall | undefined)[] {
  return r.pointIds.map((pid, i) => { const nid = r.pointIds[(i + 1) % r.pointIds.length];
    return p.walls.find(w => (w.a === pid && w.b === nid) || (w.a === nid && w.b === pid)); });
}
export function findWallBetween(p: Plan, a: Id, b: Id): Wall | undefined { return p.walls.find(w => (w.a === a && w.b === b) || (w.a === b && w.b === a)); }
