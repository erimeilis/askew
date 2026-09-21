# Askew

A floor-plan editor for rooms that are not quite rectangles.

Real rooms are askew. Walls differ in thickness, corners are not exactly 90°, a chimney juts into the kitchen. Measuring all of that with a laser meter is easy; drawing it truthfully in a generic 2D editor is not. Askew turns the measurements into the plan: sketch the rooms roughly, type what you measured, and a least-squares solver fits the exact geometry.

Measure more than strictly needed and it will tell you that your readings disagree, and by how much.

## Status

In development. The design and the task-by-task implementation plan are written:

- [Design spec](docs/superpowers/specs/2026-09-19-askew-design.md)
- [Implementation plan](docs/superpowers/plans/2026-09-21-askew.md)

## How it works

1. Sketch each room as a rough polygon. Precision does not matter here.
2. Type the measurements: interior wall lengths, a diagonal or two per room, wall thickness between facing faces, an angle where a corner is clearly not square.
3. The solver fits all points at once. Right angles are a weak prior, so a measured diagonal always wins over the assumption.
4. Read the residual per measurement, in millimetres, next to the measurement. See the note below on what those numbers can and cannot tell you.
5. Add doors, windows and fixed elements by offset along a wall. Stack floors as separate layers of one file.
6. Export a dimensioned SVG (print at 1:50 or 1:100) or a DXF that opens in FreeCAD, QCAD and the rest.

## Measure one more than you need

How much the residuals can tell you depends entirely on how many measurements you take beyond the minimum. This is measured behaviour, not a guess — a rectangle perturbed by 50 mm with a 60 mm error injected into one reading:

| What you measured     | Spare measurements | What Askew can say                                                                                                 |
| --------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| 4 sides + 1 diagonal  | none               | Nothing. Every residual is about 0.01 mm. The fit absorbs the mistake exactly and the plan is quietly 60 mm wrong. |
| 4 sides + 2 diagonals | one                | "These readings disagree." All six residuals land between 5 and 15 mm and all six are flagged.                     |
| more than that        | two or more        | Which reading is the odd one starts to mean something.                                                             |

With exactly one spare measurement the error is detectable but not attributable, and that is mathematics rather than a shortcoming of the solver. Six distances describing five degrees of freedom leave exactly one relation between them, so a violation of that relation is a single equation, and one equation cannot single out which of six readings caused it. Ranking by leverage was tried; it makes all six come out equal, which is the honest answer rather than a better one.

The practical advice, then: take one more measurement than feels necessary, and take two if you want the flag to point somewhere. Askew reports the spare count so the editor can nudge you.

## Stack

TypeScript, React, Vite, SVG. A pure core (model, solver, geometry, export) with no DOM dependency, tested with Vitest. Plans are plain JSON files; autosave uses IndexedDB. Icons by [Phosphor](https://phosphoricons.com/). No backend, no account, no cloud.

## License

MIT. See [LICENSE](LICENSE).
