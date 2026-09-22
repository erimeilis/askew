import { type Vec, add, scale } from "./vec";
import { pointAlong } from "./line";
import { wallSideNormal } from "./wallOutline";
import type { Plan, Fixture } from "@/model/types";
import { wallById, pointById } from "@/model/queries";

/**
 * Fixture rectangle: `w` along the wall starting at `anchor.offset`, `d` deep, its near edge
 * `anchor.depth` millimetres from the wall line on the room side — the side opposite the wall's
 * thickness extrusion, so a stove never lands inside the wall itself.
 */
export function fixtureRect(plan: Plan, fixture: Fixture): Vec[] {
  const wall = wallById(plan, fixture.anchor.wallId);
  const a = pointById(plan, wall.a);
  const b = pointById(plan, wall.b);
  const roomNormal = scale(wallSideNormal(a, b, wall.side), -1);
  const near = scale(roomNormal, fixture.anchor.depth);
  const far = scale(roomNormal, fixture.anchor.depth + fixture.d);
  const p0 = pointAlong(a, b, fixture.anchor.offset);
  const p1 = pointAlong(a, b, fixture.anchor.offset + fixture.w);
  return [add(p0, near), add(p1, near), add(p1, far), add(p0, far)];
}
