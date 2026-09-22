<div align="center">

# askew

📐 Sketch rough, type what you measured, get an exact plan — and a DXF that opens in FreeCAD

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-3178c6.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.3-61dafb.svg)](https://react.dev/)
[![Tests](https://img.shields.io/badge/tests-187%20passing-brightgreen.svg)](#quality)
[![Backend](https://img.shields.io/badge/backend-none-lightgrey.svg)](#privacy)

**Measuring a room takes a minute. Drawing it truthfully takes an afternoon.**

</div>

---

## The workflow

You are standing in a half-built house with a laser meter. Four steps.

**1. Sketch it wrong.** Click the corners of a room roughly. Precision here is pointless and askew never asks for it.

**2. Type what the tape said.** Click two corners, type `4130`, press Enter. The drawing moves to fit. Add the other walls, a diagonal, the thickness between two facing walls, an angle where a corner is visibly not square.

**3. Read what disagrees.** Every reading gets a residual in millimetres, next to the reading that caused it.

**4. Take it to CAD.** Export a dimensioned SVG to print at 1:50 or 1:100, or a DXF that opens in FreeCAD in millimetres on separate layers.

No backend, no account, no cloud. Plans are plain JSON files on your own disk.

---

## Quick start

```bash
git clone git@github.com:erimeilis/askew.git
cd askew
npm install
npm run dev
```

Open the URL it prints. A guide panel appears and walks you through your first room. It advances by watching what you actually do, and it never blocks the canvas.

Built and tested on Node 24.

---

## Why not a normal 2D editor

Real rooms are not rectangles. A wall is 380 mm at one end and 400 mm at the other. A corner is 88°. A chimney juts into the kitchen. Drawing that by hand means fighting a tool that assumes you meant a rectangle.

askew inverts it. You never draw the truth — you **measure** it, and the solver finds the shape that best fits everything you typed. Right angles are a weak assumption that any real measurement overrules.

|                        | Generic 2D editor           | askew                                   |
| ---------------------- | --------------------------- | --------------------------------------- |
| Rooms                  | Snap to rectangles          | Any polygon, fitted to measurements     |
| Wall thickness         | One value, or drawn by hand | Measured per wall, between real faces   |
| Corners                | Assumed square              | Square only until you measure otherwise |
| Contradictory readings | Silently accepted           | Flagged, with the error in millimetres  |

---

## What it can and cannot tell you

The honest part, and it is measured behaviour rather than a claim. A rectangle perturbed by 50 mm, with a 60 mm error injected into one reading:

| What you measured     | Spare readings | What askew can say                                                                                             |
| --------------------- | -------------- | -------------------------------------------------------------------------------------------------------------- |
| 4 sides + 1 diagonal  | none           | **Nothing.** Every residual is about 0.01 mm. The fit absorbs the mistake and the plan is quietly 60 mm wrong. |
| 4 sides + 2 diagonals | one            | **"These disagree."** All six residuals land between 5 and 15 mm, and all six flag.                            |
| more than that        | two or more    | Which reading is the odd one starts to mean something.                                                         |

With exactly one spare reading the error is **detectable but not attributable**, and that is mathematics rather than a shortcoming. Six distances describing five degrees of freedom leave one relation between them, so violating it is a single equation, and one equation cannot single out which of six readings broke it. Ranking by statistical leverage was tried; it makes all six come out equal, which is the honest answer rather than a better one.

So: **take one more measurement than feels necessary, and two if you want the flag to point somewhere.** askew shows the spare count beside the error figure, so you always know which situation you are in.

---

## How the solver works

Every point on a floor is a free variable. Every measurement becomes a residual, weighted by how much that kind of reading is trusted:

| Measurement                      | Residual                                                                 | Assumed accuracy                 |
| -------------------------------- | ------------------------------------------------------------------------ | -------------------------------- |
| Length between two points        | fitted distance − typed value                                            | 2 mm                             |
| Wall thickness between two faces | face distance − typed value, twice, which also forces the faces parallel | 2 mm                             |
| Angle at a corner                | fitted angle − typed value                                               | 0.5°                             |
| Alignment on an axis             | difference in that coordinate                                            | 1 mm                             |
| Right angle, assumed             | fitted angle − 90°                                                       | 5°, so any real measurement wins |

A damped least-squares fit (Levenberg-Marquardt, with a Cholesky-solved step) minimises them together. Three extra residuals pin the plan against sliding and spinning. Nothing pins its scale — that comes from your measurements alone.

Two properties worth relying on:

- **A residual's sign tells you which way to re-measure.** Negative means you typed a value larger than the geometry supports. One test per measurement kind asserts this, each verified by negating the formula and watching the test fail. That verification is necessary, because the fit itself is provably blind to a flipped sign: negating a residual leaves the squared error unchanged and the fitted geometry identical.
- **A solve that fails leaves your drawing alone.** The solver reports _why_ it stopped, and running out of damping attempts counts as stuck rather than finished. A failed fit is never written back over your coordinates.

Points the measurements do not yet determine are marked on the canvas and counted in the panel, so "needs a measurement" is shown rather than left for you to infer.

---

## Exports

| Format   | Opens in                       | Details                                                |
| -------- | ------------------------------ | ------------------------------------------------------ |
| **SVG**  | Browser, any editor, a printer | 1:50 or 1:100, dimension lines, room names and areas   |
| **DXF**  | FreeCAD, QCAD, LibreCAD        | AutoCAD 2000 (`AC1015`), millimetre units, five layers |
| **JSON** | The plan itself                | Human-readable, coordinates to 0.1 mm                  |

Both exports carry the same five layers — `walls`, `openings`, `fixtures`, `dimensions`, `labels` — so electrical or structural work can switch the dimensions off and keep the walls.

The DXF was opened in FreeCAD 1.1.1 headlessly during development, confirming millimetre units from `$INSUNITS`, closed wall polylines on the correct layers, and correct orientation. Exports are byte-identical in light and dark themes, asserted by a test.

---

## What you can draw

- **Rooms** as any closed polygon, with per-wall thickness and mitred corners
- **Doors and windows** cut through the wall at a measured offset, with a swing arc or glazing lines
- **Fixed elements** — a stove, a column, a chimney — placed by offset along a wall and distance from it
- **Multiple floors** in one file, each solved independently
- **Dimension lines** drawn from the fitted geometry, never from the number you typed

---

## Keyboard

| Key                    | Action                                   |
| ---------------------- | ---------------------------------------- |
| `Enter`                | Close a room, or commit a typed value    |
| `Escape`               | Cancel the current tool's pending clicks |
| `Ctrl/Cmd + Z`         | Undo                                     |
| `Ctrl/Cmd + Shift + Z` | Redo                                     |
| `Delete`               | Delete the selection                     |
| Wheel                  | Zoom about the cursor                    |
| `Shift` + drag         | Pan                                      |

---

## Privacy

Everything stays in your browser and on your disk. No account, no telemetry, no network calls. Work in progress autosaves to IndexedDB; saved plans go wherever you choose to put them.

---

## Quality

Six gates, all required, all green:

```bash
npm run typecheck    # TypeScript 7, strict
npm test             # 187 unit tests across 53 files
npm run lint         # oxlint — must print nothing at all
npm run format:check # oxfmt
npm run build        # production bundle
npm run e2e          # Playwright, real browser
```

The lint gate treats a warning as a failure. There are no disabled rules, no `@ts-ignore`, no `TODO`, and no skipped tests anywhere in the source or the suite.

The solver, geometry, model and exporters are pure TypeScript with no DOM dependency, so the whole fit is testable without a browser. Browser APIs appear in exactly two places.

Three bugs in this project were invisible to every unit test and appeared only when the built application was driven by hand: the measurement prompt never took focus so typing did nothing, reopening a saved plan showed a blank residual column, and the panel displayed raw internal identifiers. The first is now guarded by a browser test confirmed to fail without its fix. **That is why `npm run e2e` is a gate and not an optional extra.**

---

## Architecture

```
src/
  model/       Plan types, zod schema, migrations
  solver/      Levenberg-Marquardt, one file per residual kind
  geometry/    Vectors, polygons, wall outlines, openings, fixtures
  export/      SVG and DXF writers
  persistence/ JSON serialisation, IndexedDB autosave, file access
  editor/      React: canvas layers, tools, panels, the guide, theming
  config/      Every tunable value in the project
  i18n/        Translation layer
```

One rule shapes it: **the first five directories never import React or touch the DOM.** That is what makes the solver testable without a browser, and what keeps a rendering change from breaking a fit.

A second rule: no adjustable number lives in logic. Sigmas, tolerances, grid spacing, layer names, print scales and stroke widths all sit in `config/`.

---

## Stack

TypeScript, React and Vite, rendering to SVG. State in zustand, validation with zod, autosave through idb-keyval. Linting and formatting by [oxlint and oxfmt](https://oxc.rs/) rather than ESLint and Prettier. Icons by [Phosphor](https://phosphoricons.com/). Five runtime dependencies, no CSS framework, no backend.

Every string goes through a translation layer, so a second language needs no code change. The interface follows your system's light or dark setting, with a manual override that persists.

---

## License

MIT — see [LICENSE](LICENSE). Built for measuring a real house; use it for yours.

If it saves you an afternoon, ⭐ the repo.
