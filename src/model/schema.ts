import { z } from "zod";
import type { Plan } from "./types";
import { migrate, CURRENT_VERSION } from "./migrations";
const id = z.string().min(1);
const side = z.enum(["left", "right"]);
const measurement = z.discriminatedUnion("kind", [
  z.object({ id, kind: z.literal("length"), a: id, b: id, value: z.number().positive() }),
  z.object({
    id,
    kind: z.literal("thickness"),
    wallA: id,
    wallB: id,
    value: z.number().positive(),
  }),
  z.object({ id, kind: z.literal("angle"), a: id, b: id, c: id, value: z.number() }),
  z.object({ id, kind: z.literal("align"), a: id, b: id, axis: z.enum(["x", "y"]) }),
]);
export const planSchema = z
  .object({
    version: z.literal(CURRENT_VERSION),
    name: z.string(),
    floors: z.array(z.object({ id, name: z.string(), elevation: z.number() })).min(1),
    points: z.array(z.object({ id, floorId: id, x: z.number(), y: z.number() })),
    walls: z.array(z.object({ id, floorId: id, a: id, b: id, thickness: z.number().min(0), side })),
    rooms: z.array(z.object({ id, floorId: id, name: z.string(), pointIds: z.array(id).min(3) })),
    openings: z.array(
      z.object({
        id,
        wallId: id,
        kind: z.enum(["door", "window"]),
        offset: z.number().min(0),
        width: z.number().positive(),
        sill: z.number().optional(),
        height: z.number().optional(),
      }),
    ),
    fixtures: z.array(
      z.object({
        id,
        floorId: id,
        name: z.string(),
        anchor: z.object({ wallId: id, offset: z.number(), depth: z.number() }),
        w: z.number().positive(),
        d: z.number().positive(),
      }),
    ),
    measurements: z.array(measurement),
  })
  .superRefine((p, ctx) => {
    const pts = new Set(p.points.map((x) => x.id));
    const walls = new Set(p.walls.map((x) => x.id));
    const needPt = (ref: string, path: string) => {
      if (!pts.has(ref))
        ctx.addIssue({ code: "custom", message: `unknown point ${ref}`, path: [path] });
    };
    const needWall = (ref: string, path: string) => {
      if (!walls.has(ref))
        ctx.addIssue({ code: "custom", message: `unknown wall ${ref}`, path: [path] });
    };
    p.walls.forEach((w) => {
      needPt(w.a, "walls");
      needPt(w.b, "walls");
    });
    p.rooms.forEach((r) => r.pointIds.forEach((x) => needPt(x, "rooms")));
    p.openings.forEach((o) => needWall(o.wallId, "openings"));
    p.fixtures.forEach((f) => needWall(f.anchor.wallId, "fixtures"));
    p.measurements.forEach((m) => {
      if (m.kind === "length" || m.kind === "align") {
        needPt(m.a, "measurements");
        needPt(m.b, "measurements");
      }
      if (m.kind === "angle") {
        needPt(m.a, "measurements");
        needPt(m.b, "measurements");
        needPt(m.c, "measurements");
      }
      if (m.kind === "thickness") {
        needWall(m.wallA, "measurements");
        needWall(m.wallB, "measurements");
      }
    });
  });
type SchemaPlan = z.infer<typeof planSchema>;
/** Compile-time guard: schema and hand-written type must stay structurally identical. */
const _schemaSatisfiesPlan: (p: SchemaPlan) => Plan = (p) => p;
const _planSatisfiesSchema: (p: Plan) => SchemaPlan = (p) => p;
void _schemaSatisfiesPlan;
void _planSatisfiesSchema;
export function parsePlan(raw: unknown): Plan {
  return planSchema.parse(migrate(raw));
}
