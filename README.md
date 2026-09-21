# Askew

A floor-plan editor for rooms that are not quite rectangles.

Real rooms are askew. Walls differ in thickness, corners are not exactly 90°, a chimney juts into the kitchen. Measuring all of that with a laser meter is easy; drawing it truthfully in a generic 2D editor is not. Askew turns the measurements into the plan: sketch the rooms roughly, type what you measured, and a least-squares solver fits the exact geometry. Measure more than strictly needed and it tells you which reading disagrees with the rest.

## Status

In development. The design and the task-by-task implementation plan are written:

- [Design spec](docs/superpowers/specs/2026-09-19-askew-design.md)
- [Implementation plan](docs/superpowers/plans/2026-09-21-askew.md)

## How it works

1. Sketch each room as a rough polygon. Precision does not matter here.
2. Type the measurements: interior wall lengths, a diagonal or two per room, wall thickness between facing faces, an angle where a corner is clearly not square.
3. The solver fits all points at once. Right angles are a weak prior, so a measured diagonal always wins over the assumption.
4. Read the residual per measurement. A reading that is 15 mm off shows up as 15 mm, next to the measurement that caused it.
5. Add doors, windows and fixed elements by offset along a wall. Stack floors as separate layers of one file.
6. Export a dimensioned SVG (print at 1:50 or 1:100) or a DXF that opens in FreeCAD, QCAD and the rest.

## Stack

TypeScript, React, Vite, SVG. A pure core (model, solver, geometry, export) with no DOM dependency, tested with Vitest. Plans are plain JSON files; autosave uses IndexedDB. Icons by [Phosphor](https://phosphoricons.com/). No backend, no account, no cloud.

## License

MIT. See [LICENSE](LICENSE).
