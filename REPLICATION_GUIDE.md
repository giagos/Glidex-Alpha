# Glidex Alpha — Replication Guide

Full technical guide for rebuilding Glidex Alpha from scratch.

## 1. Purpose

A modern, dual-target (Windows desktop + web) workbench for RC aircraft
builders that calculates geometry, mass, CG, basic aerodynamics, draws simple
side/top views and foam-board layouts, and exports reports. Successor to the
original Lua/LÖVE Glidex 1‑D CG tool.

## 2. Stack

- **Electron 33** for the Windows target (`main.ts` + `preload.ts` in `electron/`).
- **React 18 + TypeScript + Vite 6** for the renderer / web target.
- **Tailwind CSS** + custom CSS tokens for the "Warm Cream / Neo-Platinum Cream" look.
- **Zustand** for the project store.
- **Zod** for project schema validation (round-trip-safe JSON).
- **pdf-lib** for PDF reports.
- **Vitest** for unit tests.
- **electron-builder** for the NSIS installer.

`vite.config.ts` switches into Electron mode when `ELECTRON=1`. The web build
omits the Electron plugin entirely so the same `src/` runs in a browser.

## 3. Repository layout

```
electron/
  main.ts         # BrowserWindow + IPC handlers: project:save / open, file:saveBytes
  preload.ts      # contextBridge exposes window.glidex.{saveProject, openProject, saveBytes}
  tsconfig.json
src/
  main.tsx        # React entrypoint
  env.d.ts        # window.glidex typing for the renderer
  app/
    App.tsx       # MenuBar (File/Help), Tabs, view router, footer
    views/        # one file per top-level view
  components/     # Window, Panel, Button, Field, Menu, Tabs, Stat
  domain/         # types.ts, geometry.ts, mass.ts, aero.ts, ballast.ts, sheets.ts, defaults.ts
  drawing/        # SideView.tsx, TopView.tsx (inline SVG)
  state/project.ts
  persistence/
    adapter.ts    # selects fsAdapter (Electron) or webAdapter (browser)
    fsAdapter.ts  # calls window.glidex.* via IPC
    webAdapter.ts # browser fallback: download for save, <input type=file> for open
  export/         # json, csv, markdown, pdf
  styles/         # tokens.css (palette), retro.css (bevels), index.css
  test/           # geometry.test.ts, mass.test.ts, ballast.test.ts
index.html
package.json, tailwind.config.ts, postcss.config.js, vite.config.ts,
tsconfig.json, tsconfig.app.json, tsconfig.node.json
```

## 4. Data model (`src/domain/types.ts`)

All schemas are Zod and exported as types.

```
Project {
  meta:    { name, author, units: 'metric', createdAt, updatedAt, appVersion }
  aircraft: {
    wing:    { span_mm, root_chord_mm, tip_chord_mm, sweep_deg, dihedral_deg,
               incidence_deg, root_le_x_mm }
    htail:   { span_mm, root_chord_mm, tip_chord_mm, root_le_x_mm }
    vtail?:  { height_mm, root_chord_mm, tip_chord_mm, root_le_x_mm }
    fuselage:{ length_mm, max_width_mm, max_height_mm }
    batteryBay?: { x_min_mm, x_max_mm, z_mm }
  }
  materials: Material[]   // kind = sheet | linear | volume | lump, with density
  parts:     Part[]       // category + mass_g
  components: Component[] // kind + mass source + (x,y,z) + movable + visible
  sheets:    Sheet[]      // foam-board layouts with placed SheetParts
  target?:   { x_mm, range_mm: [fwd, aft] }
  aero:      { cl_max, air_density_kg_m3, cruise_speed_m_s }
}
```

Mass source is a discriminated union:

- `fixed`    — user-typed grams
- `part`     — reference to a Part × count
- `sheet`    — Material(g/m²) × area_mm²
- `linear`   — Material(g/m) × length_mm
- `volume`   — Material(g/cm³) × volume_cm³
- `lump`     — Material(g) × count

Conventions: nose at x = 0; +x is aft; +y is starboard; +z is up. All lengths
in mm, masses in g, angles in degrees, density per kind.

## 5. Calculations

`geometry.ts`:
- `wingArea_mm2`, `tailArea_mm2`, `aspectRatio`, `taperRatio`
- `macLength_mm` = (2/3)·c_root·(1+λ+λ²)/(1+λ)
- `macY_mm` = (b/6)·(c_root + 2 c_tip)/(c_root + c_tip)
- `macLeadingEdgeX_mm` = root_LE_x + y_MAC · tan(sweep)
- `tailArm_mm` = quarter-chord distance between wing and htail
- `tailVolumeCoefficient` = (S_h · l_h) / (S · MAC)
- `defaultCG_x_mm` (30 % MAC) and `defaultCGRange_mm` (25–35 % MAC)
- `wingAreaTrace`, `macTrace` carry formula + inputs for "why?" explanations.

`mass.ts`:
- `resolveMass(source, materials, parts)` returns `{ mass_g, derivation }`.
- `resolveAll(components, materials, parts)` returns `ResolvedComponent[]`.
- `computeMass(resolved)` returns total mass, CG, by-kind breakdown, and the
  per-component moment contribution table.

`aero.ts`:
- `wingLoading_g_dm2`, `wingLoading_oz_ft2`
- `cubicWingLoading` (dimensionless WCL number)
- `stallSpeed_m_s` = √(2W/(ρ·S·CLmax))
- `reynoldsAtMAC(V)` with ν = 1.46×10⁻⁵
- `requiredCL` for level cruise
- `computeWarnings(totalMass, cg, aircraft, aero, cgRange)` emits typed warnings
  with `level: info | warn | danger`.

`ballast.ts`:
1. Resolve all visible components.
2. If CG already within `[fwd, aft]`, return zero ballast.
3. Otherwise sort movables by `mass × allowed range` (leverage) and greedily
   push each to the end of its range that helps. Stop early when CG enters range.
4. If still outside, solve in closed form for ballast at the user's chosen X:
   `m_b = (target·M − S) / (x_b − target)` with `M, S` recomputed after moves.
5. Return moves, required ballast, predicted CG, and an English explanation.

Deterministic, O(n log n), and fully testable.

`sheets.ts`:
- Simple shelf-packing first-fit-decreasing auto-arrange for rectangular bboxes.
  Parts that don't fit are pushed to `(-9999, -9999)` so they're visible as overflow.

## 6. UI architecture

- `App.tsx` shows a top `MenuBar` (File / Help), then a `Tabs` row, then the
  current view fills the rest, then a footer with counters.
- Every view sits inside one or more `<Window>` components. A `Window` is a
  cream panel with a beveled "titlebar" gradient and a body that takes the
  remaining space.
- Inputs are `<Field>` widgets — labelled inset cells with optional units.
  Numeric values go through `parseFloat` with NaN guard.
- The store (`useProject`) holds the canonical project. Every mutator wraps the
  project in `touch()` which updates `meta.updatedAt`.
- Derived numbers go through `useDerived(project)` which runs once per project
  change (`useMemo`).
- The right-side "Key numbers" + "Warnings" panels on Workbench are the user's
  primary feedback loop.

## 7. Drawings (SVG)

`SideView.tsx`:
- Cream card background, scissor-equivalent via SVG viewBox.
- Coordinate convention: x = 0 at nose on left, increasing right; z = 0 at
  fuselage centerline.
- Renders fuselage as rounded rect, wing/htail as ellipses, vtail as polygon,
  CG marker as classic quartered-disc glyph, safe-CG band as moss-green
  translucent rect, battery bay as dashed warm-brown rect.
- Component dots are colored by kind, radius scales with mass.

`TopView.tsx`: same conventions; renders fuselage strip, wing planform with
sweep, htail planform, MAC line, CG line.

Both are pure functions of props and can be serialized directly as SVG strings
for export.

## 8. Persistence

`adapter.ts` picks an adapter at runtime:
- If `window.glidex?.isElectron` → `fsAdapter` (calls main process via IPC).
- Else → `webAdapter` (browser download + `<input type="file">`).

This means **no view code knows which target it runs in** — Electron-specific
APIs are confined to `electron/main.ts`, `electron/preload.ts`, and
`persistence/fsAdapter.ts`.

## 9. Cream Retro design tokens

CSS variables in `tokens.css`:

| Token | Hex |
|---|---|
| --cream-bg | #F2EBDC |
| --cream-panel | #E8DFC9 |
| --cream-card | #FBF6E8 |
| --cream-inset | #DCD2B8 |
| --ink | #1F1A12 |
| --ink-muted | #6B5E45 |
| --border-dark | #2A241B |
| --bevel-hi | #FFFCEF |
| --bevel-lo | #B7AC8E |
| --accent-warm | #8B5A2B |
| --accent-moss | #6B7C3A |
| --warn | #B5651D |
| --danger | #9A3B1F |

Bevels are stacked box-shadows: `inset 1px 1px 0 hi, inset -1px -1px 0 lo, 0 0 0 1px border`.
Reversed for "inset" wells. The `.paper` class adds a faint two-radial-gradient
texture so the cream surface doesn't look digitally flat.

Fonts: Inter (sans), IBM Plex Mono (numeric readouts and tables).

## 10. Build and run

| Command | Purpose |
|---|---|
| `npm install` | install deps |
| `npm test` | run Vitest |
| `npm run typecheck` | tsc --noEmit |
| `npm run dev` | Vite dev (web) |
| `npm run dev:electron` | Vite + Electron dev |
| `npm run build:web` | Static bundle in `dist/` |
| `npm run build:electron` | Web build + electron-builder → `release/` |

## 11. Replication blueprint (from scratch)

1. Scaffold Vite-React-TS + Tailwind + Electron + electron-builder.
2. Add the CSS tokens and base primitives (Window, Panel, Button, Field, Menu,
   Tabs, Stat). Verify the cream look by stubbing a sample window.
3. Add `domain/types.ts` (Zod), then `geometry.ts`, `mass.ts`, `aero.ts`,
   `ballast.ts`, `sheets.ts`. Wire Vitest tests; **don't move on until they're green**.
4. Add the Zustand store and the two persistence adapters.
5. Build the workbench shell: menu bar, tabs, view router, footer.
6. Build the editor views (Geometry, Materials, Parts, Components, Aero,
   Balance, Sheets, Report). Each is just forms + tables over the store.
7. Build the SVG drawings as pure functions of the project, then mount them in
   `WorkbenchView`.
8. Add exports (JSON, CSV, Markdown, PDF). Validate by exporting and re-importing
   project JSON.
9. Smoke test desktop (`npm run dev:electron`) and web (`npm run dev`).
10. `npm run build:electron` to produce the NSIS installer.

## 12. Out of scope (v1)

- CFD, panel methods, vortex lattice.
- Full 3D CAD, lofting, surfaces.
- CAM / CNC toolpaths.
- Autopilot or flight planning.
- Cloud sync, accounts, multi-user.
- DXF export (planned for v2).
- Mobile-first responsive layout (desktop-first; tablets work in landscape).

## 13. File map for fast navigation

- `electron/main.ts` — Window lifecycle + IPC.
- `src/app/App.tsx` — menu, tabs, view router.
- `src/app/views/useDerived.ts` — single source of truth for derived numbers.
- `src/domain/types.ts` — schemas.
- `src/domain/geometry.ts` — wing area, AR, MAC, tail volume, default CG.
- `src/domain/mass.ts` — mass resolution + CG.
- `src/domain/aero.ts` — wing loading, stall, Re, required CL, warnings.
- `src/domain/ballast.ts` — deterministic ballast solver.
- `src/domain/sheets.ts` — shelf-packing for foam-board layouts.
- `src/drawing/SideView.tsx`, `TopView.tsx` — SVG views.
- `src/state/project.ts` — Zustand store.
- `src/persistence/*` — fs vs idb/download adapters.
- `src/export/*` — JSON, CSV, Markdown, PDF.
- `src/styles/tokens.css` + `retro.css` — Cream Retro visual identity.
