# Glidex Alpha

A practical **RC aircraft design workbench** for builders who want to calculate,
balance, document, and refine their own aircraft designs.

Glidex Alpha is the spiritual successor to the original Lua/LÖVE [Glidex](https://github.com/giagos/Glidex)
1‑D CG tool. It has been completely rebuilt as a modern desktop + web app
with much broader functionality:

- **Geometry**: wing, tail, fuselage; computes area, AR, MAC, tail volume, sweep, etc.
- **User-defined materials**: foam-board (g/m²), spars/glue/tape (g/m), PLA (g/cm³), lumps.
- **Parts library**: motors, ESCs, batteries, RX, servos, payloads.
- **Mass roll-up & CG**: derives mass from materials × geometry *or* from part
  references *or* from user-typed fixed values. CG is computed along the fuselage.
- **Aerodynamic estimates**: wing loading, cubic wing loading, stall speed,
  Reynolds number, required CL. All approximate — design guidance, not certified.
- **Visual drawings (SVG)**: side view and top view with the CG marker and the
  safe CG band shaded over the fuselage.
- **Deterministic ballast optimiser**: tells you how much ballast to add **and**
  whether moving the battery/ESC inside their user-allowed ranges can reduce or
  eliminate the ballast.
- **Foam-board sheet layouts**: place rectangular flat parts on a sheet manually
  or with a simple shelf-packing auto-arrange.
- **Exports**: project JSON, mass-table CSV, Markdown report, PDF report.
- **Two deployment targets, one codebase**:
  - native **Windows** app via Electron (`.exe` installer)
  - **web** app via Vite (static bundle, hostable anywhere)

The design is intentionally **not** a CFD/CAD/CAM/simulation suite. It stays a
focused, trustworthy, debuggable calculator.

## Visual identity

A "Warm Cream Retro" / Neo-Platinum Cream look: cream-paper background, beveled
panels, hard 1 px outlines, monospace numeric readouts (IBM Plex Mono), and the
Inter UI font. No gradients, no glassmorphism, no neon — calm, tactile, paper-like.

## Tech stack

- React 18 + TypeScript + Vite 6
- Tailwind CSS (with custom design tokens for the cream palette)
- Zustand (state) + Zod (project schema validation)
- pdf-lib (PDF reports)
- Electron 33 + electron-builder (Windows installer)
- Vitest (unit tests for geometry, mass, and the ballast solver)

## Project layout

```
electron/         # main + preload processes (Node-side IPC)
src/
  app/            # App shell + per-view editors
    views/        # WorkbenchView, GeometryView, MaterialsView, ...
  components/     # Cream-retro UI primitives (Window, Panel, Button, Field, …)
  domain/         # Pure logic: types, geometry, mass, aero, ballast, sheets
  drawing/        # SVG side/top/sheet views
  state/          # Zustand project store
  persistence/    # Adapter + Electron-FS + Web-IndexedDB backends
  export/         # JSON, CSV, Markdown, PDF
  styles/         # tokens.css, retro.css, index.css
  test/           # Vitest specs
```

## Develop

```powershell
# Install dependencies
npm install

# Web (Vite dev server only)
npm run dev

# Desktop (Electron + Vite)
npm run dev:electron

# Type check
npm run typecheck

# Unit tests
npm test
```

## Build

```powershell
# Static web bundle in ./dist
npm run build:web

# Windows installer in ./release
npm run build:electron
```

## Workflow

1. **Geometry** tab — enter wing, tail, fuselage dimensions.
2. **Materials** tab — add the foam, spar, glue, tape, PLA you actually use.
3. **Parts** tab — add electronics with their measured masses.
4. **Components** tab — place items on the aircraft, pick mass source
   (fixed, part, sheet × area, linear × length, volume, lump).
5. **Workbench** — see side/top drawings with CG marker and warnings.
6. **Balance** — set target CG, mark which components are movable, let
   Glidex compute the minimum ballast and best moves; apply with one click.
7. **Foam sheets** — lay out flat parts onto rectangular sheets.
8. **Report** — preview Markdown, export to PDF / Markdown / CSV / JSON.

## Calculations (summary)

| Quantity | Formula |
|---|---|
| Wing area S | (c_root + c_tip)/2 × span |
| Aspect ratio AR | b² / S |
| MAC | (2/3) · c_root · (1 + λ + λ²)/(1 + λ),  λ = c_tip/c_root |
| Tail volume Vh | (S_h · l_h) / (S · MAC) |
| CG | Σ(mᵢ · xᵢ) / Σ(mᵢ) |
| Wing loading | total mass / S (g/dm²) |
| Cubic WL | mass(oz) / (S(ft²))^1.5 |
| Stall speed | √(2W / (ρ·S·CLmax)) |
| Reynolds @ MAC | V · MAC / ν, ν = 1.46×10⁻⁵ m²/s |
| Required CL | 2W / (ρ·V²·S) |

## Status

This is **v0.1 (Alpha)**. v1 ships geometry, mass, CG, basic aero, drawings,
foam-board layouts, ballast optimisation, and exports. Future work:
DXF export, 3D CG, more presets, integrated airfoil polars.

## License

See [LICENSE](./LICENSE) (inherited from the original Glidex project).
