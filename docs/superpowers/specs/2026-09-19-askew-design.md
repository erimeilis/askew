# Askew — design spec

**Project:** Askew. **Repository:** https://github.com/erimeilis/askew. **License:** MIT (holder "Eri Meilis", 2026).
The name: rooms in a real house are askew, and the editor is built to measure that rather than pretend otherwise.

Date: 2026-09-19. Status: draft for review.

## Purpose

A browser mini-editor that turns on-site measurements of a house into a precise floor plan. Rooms are not ideal rectangles, walls have different thicknesses, and fixed elements (stove, columns, chimney) sit at measured offsets. Drawing that by hand in a generic 2D editor is hard; measuring it is easy. The editor takes a rough sketch plus measured values and fits exact geometry, showing where measurements disagree.

Consumer: the `28/electro` project (FreeCAD + QElectroTech, mm units) needs a true plan to place electrical devices on.

## Decisions taken

| Question | Decision |
|---|---|
| Core model | Constraint-driven: sketch, then type measurements; least-squares fit |
| Solver | Own Levenberg-Marquardt in TypeScript, soft constraints, residual per measurement. Not planegcs (exact constraints reject redundant measurements) |
| Platform | Web app, Vite + TypeScript + React, SVG rendering, no backend |
| Persistence | JSON files in `plans/` via File System Access API; download fallback; autosave and last file handle in IndexedDB (idb-keyval) |
| Outputs v1 | Dimensioned SVG (PDF via print at fixed scale) and DXF 2000 |
| v1 scope | Walls, rooms, doors, windows, fixed elements, multiple floors |
| Measuring workflow | Laser meter: interior wall lengths plus 1–2 diagonals per room; wall thickness at openings |
| Language | English UI through `t()`; any locale addable without code change; plan labels free text |
| Icons | Phosphor Icons via `@phosphor-icons/react`, one central map in `src/config/icons.ts` |
| Units | mm everywhere, integers preferred |

## Data model (saved JSON)

```
Plan { version, name, floors[], points[], walls[], rooms[], openings[], fixtures[], measurements[] }

Floor      { id, name, elevation }
Point      { id, floorId, x, y }                      // solver variables
Wall       { id, floorId, a, b, thickness, side }      // a,b: point ids on the measured interior face;
                                                       // thickness extrudes to side 'left'|'right'
Room       { id, floorId, name, pointIds[] }           // closed polygon of interior points
Opening    { id, wallId, kind: 'door'|'window', offset, width, sill?, height? }  // offset along wall from a
Fixture    { id, floorId, name, anchor: { wallId, offset, depth }, w, d }        // rectangle glued to a wall face

Measurement (discriminated union):
  { id, kind:'length',    a, b, value }              // wall length or diagonal between any two points
  { id, kind:'thickness', wallA, wallB, value }      // two back-to-back faces of one physical wall
  { id, kind:'angle',     a, b, c, value }           // degrees at vertex b
  { id, kind:'align',     a, b, axis:'x'|'y' }       // two points share a coordinate
```

Rules:
- Points are the only free variables; everything else is derived. File stays small and diffable.
- `residual` is computed after each solve and shown in the UI. It is never saved.
- Every polygon corner carries an implicit weak 90° prior. A typed angle or a diagonal touching that corner overrides it in practice because it is weighted far stronger.
- Two rooms sharing a wall each own their face points. A `thickness` measurement ties the two faces parallel at the given distance.
- Openings and fixtures are positioned along a wall by offset; they do not add solver variables.
- `version` field plus a `migrations/` folder for schema changes.

## Solver

- Scope: one floor at a time. Floors are independent.
- Residual vector, each entry divided by its σ:
  - length: `|p_b − p_a| − value`, σ = 2 mm
  - thickness: for each endpoint of wall B, signed distance to line A minus value, σ = 2 mm (two residuals, which also enforces parallelism)
  - angle typed: `angle(a,b,c) − value`, σ = 0.5°
  - angle default prior: `angle − 90°`, σ = 5°
  - align: `p_a.x − p_b.x` or `.y`, σ = 1 mm
- Gauge fixing: first point of the floor pinned at its sketched coordinates; first wall pinned horizontal (b.y = a.y). Implemented as three strong residuals (σ = 0.001 mm) rather than variable elimination. Removes 3 rigid-body DOF without moving the sketch.
- Algorithm: Levenberg-Marquardt, numeric central-difference Jacobian, dense normal equations solved by Cholesky. Under 200 points per floor, so milliseconds. Iterate until step norm < 0.01 mm or 50 iterations.
- Initial guess: current point coordinates (the user's sketch). The solver never runs on an empty floor.
- Diagnostics returned with the result:
  - per-measurement residual in native units (mm or °); |residual| > 3σ flagged
  - per-floor RMS of weighted residuals
  - rank deficiency of the Jacobian → list of points not fully constrained, flagged "needs a measurement"
  - non-convergence → keep previous coordinates, show error banner

## Editor UX

Layout: floor tabs on top, tool rail left, SVG canvas centre, measurement panel right.

Tools:
- Room: click corners, click first corner or press Enter to close. Creates points, walls (default thickness 0, side outward), room.
- Wall thickness: click a wall face, click the opposite face, type mm → `thickness` measurement, extrudes wall drawing.
- Measure: click two points, type mm → `length` measurement (wall side or diagonal).
- Angle: click three points, type degrees.
- Align: click two points, choose axis.
- Opening: click a wall, type offset and width, pick door/window.
- Fixture: click a wall, type offset, depth, w, d, name.
- Select/Move: drag points for a better initial sketch; select any element to edit its fields in the panel; Delete removes.

Behaviour:
- Enter commits a typed value and triggers a solve; canvas updates immediately.
- Measurement panel lists all measurements with value, residual, red flag; clicking a row highlights it on the canvas.
- Dimension lines show solved geometry, never the typed values.
- Undo/redo over the full plan state.
- Autosave to IndexedDB on every change (debounced); explicit Save/Open to `plans/<name>.plan.json` via File System Access API; download/upload fallback for other browsers.
- Zoom with wheel, pan with space-drag; grid 100 mm; snapping to existing points and to wall lines.

## Export

- SVG: canvas content with layer groups `walls`, `openings`, `fixtures`, `dimensions`, `labels`. Room label shows name and area (m², 2 decimals) from solved polygon. Scale selector 1:50 / 1:100 sets the viewBox for print; PDF is browser print of that SVG.
- DXF: ASCII DXF 2000, own writer (`src/export/dxf.ts`). `$INSUNITS = 4` (mm). Layers as above. Walls as closed LWPOLYLINE per wall with thickness; openings as gaps in the wall polyline plus door swing arc / window lines; fixtures as closed LWPOLYLINE; room names as TEXT; dimensions as LINE + TEXT (no DIMENSION entities, no style tables). Verified by opening in FreeCAD 1.1.1.

## Geometry utilities

- Wall face offset by thickness to the given side, mitred at corners of the same room.
- Polygon area (shoelace), centroid for labels.
- Point-to-line distance, segment intersection for opening cut-outs.

## Project structure

```
askew/
  package.json  vite.config.ts  tsconfig.json  vitest.config.ts
  src/model/      types.ts, schema.ts (zod), migrations/
  src/solver/     residuals.ts, lm.ts, solve.ts, diagnostics.ts   (pure)
  src/geometry/   offset.ts, polygon.ts, intersect.ts             (pure)
  src/export/     svg.ts, dxf.ts                                  (pure)
  src/editor/     App.tsx, Canvas.tsx, tools/, panels/, store.ts (zustand)
  plans/          saved *.plan.json
  tests/          unit (Vitest), e2e (Playwright)
  docs/           this spec, plans
```

## Testing

- Solver: synthetic rooms with known coordinates, perturbed by up to 200 mm, measured from the truth; must recover within 1 mm. Skewed quadrilateral with diagonals. Two rooms with shared wall thickness. Overdetermined case with one injected bad measurement must flag that measurement. Underdetermined case must report the unconstrained points.
- Geometry: offset and area against hand-computed values.
- Export: DXF golden files; SVG snapshot.
- Editor: Playwright smoke test — draw a room, add measurements, save, reload, same coordinates.

## Build order

1. Model types, schema, solver, geometry, with tests.
2. Canvas, Room and Measure tools, measurement panel, solve on Enter.
3. Wall thickness, angle, align, undo/redo, save/open.
4. SVG and DXF export, verified in FreeCAD.
5. Openings, fixtures, multiple floors.

## Out of scope for v1

Image underlay tracing, 3D, curved walls, roof/attic slopes, electrical symbols (belongs to `28/electro`), cloud sync, mobile-specific UI.

## Cross-cutting rules (added 2026-09-21)

- **Config-driven**: no numeric or string literal in logic. All tunables live in `src/config/`: solver sigmas, iteration limits, flag threshold, grid step, snap tolerance, zoom limits, default wall thickness, print scales, DXF layer names, SVG colours, storage keys. Modules receive config as a parameter or import from `src/config/` only.
- **i18n from day 1**: every UI string goes through `t('key')` from `src/i18n/`. Strings live in `src/i18n/en.json`; adding `uk.json` must require no code change. Plan content (room names, fixture names) is user data and untranslated.
- **Logic separate from UI**: `model`, `solver`, `geometry`, `export`, `persistence` are pure TypeScript with no React or DOM imports. React components only render state and dispatch store actions. Tools are plain objects in `src/editor/tools/`, one file each.
- **Small files**: one responsibility per file, target under 150 lines. Shared helpers extracted instead of copied.
- **Imports**: path alias `@/` for src and `@tests/` for tests; `./` only for same-folder siblings; `../` is forbidden and lint-checked.
- **Dependencies**: always the latest stable major at install time, verified with `npm view <pkg> version` (2026-09-21: React 19.3, zod 4.6, zustand 5.0, Vite 8.3, TypeScript 7.0, Vitest 5.0, idb-keyval 6.3).
