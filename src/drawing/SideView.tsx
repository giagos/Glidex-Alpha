import { useMemo } from 'react';
import type { Aircraft, Component, Material, Part } from '../domain/types';
import { resolveAll } from '../domain/mass';
import { macLeadingEdgeX_mm, macLength_mm } from '../domain/geometry';

interface SideViewProps {
  aircraft: Aircraft;
  components: Component[];
  materials: Material[];
  parts: Part[];
  cg_x_mm: number;
  cgRange_mm?: [number, number];
  selectedId?: string;
  onSelect?: (id: string) => void;
  width?: number;
  height?: number;
}

/**
 * Side view (X-Z plane) drawn as inline SVG.
 * X axis: 0 at nose on the LEFT, positive aft going right.
 * Z axis: 0 at fuselage centerline, positive up.
 */
export function SideView({
  aircraft,
  components,
  materials,
  parts,
  cg_x_mm,
  cgRange_mm,
  selectedId,
  onSelect,
  width = 900,
  height = 320,
}: SideViewProps) {
  const resolved = useMemo(
    () => resolveAll(components, materials, parts),
    [components, materials, parts],
  );

  const padding = 28;
  const drawW = width - padding * 2;
  const drawH = height - padding * 2;
  const fusL = Math.max(aircraft.fuselage.length_mm, 1);
  const fusH = Math.max(aircraft.fuselage.max_height_mm, 1);

  // Scale so the fuselage fits horizontally, with some vertical headroom.
  const scaleX = drawW / fusL;
  const scaleZ = Math.min(drawH / (fusH * 3.2), scaleX); // keep proportional but allow tail tall
  const originX = padding;
  const originY = height / 2;

  const x = (mm: number) => originX + mm * scaleX;
  const z = (mm: number) => originY - mm * scaleZ;

  // Fuselage rounded rectangle
  const fusY = z(fusH / 2);
  const fusY2 = z(-fusH / 2);
  const fusHpx = fusY2 - fusY;

  // Wing: drawn as a thin rectangle (chord-wise) at the wing location
  const wing = aircraft.wing;
  const wingLE = wing.root_le_x_mm;
  const wingTE = wing.root_le_x_mm + wing.root_chord_mm;
  // Approximate wing thickness 12% chord
  const wingThk = wing.root_chord_mm * 0.12;

  const htail = aircraft.htail;
  const vtail = aircraft.vtail;

  const macX = macLeadingEdgeX_mm(wing);
  const mac = macLength_mm(wing);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ background: 'var(--cream-card)', boxShadow: 'var(--shadow-bevel-in)', borderRadius: 4 }}
    >
      {/* Ground reference */}
      <line
        x1={padding}
        y1={originY + drawH / 2 - 4}
        x2={width - padding}
        y2={originY + drawH / 2 - 4}
        stroke="var(--bevel-lo)"
        strokeDasharray="4 4"
      />

      {/* Safe CG band */}
      {cgRange_mm && (
        <rect
          x={x(cgRange_mm[0])}
          y={fusY - 18}
          width={x(cgRange_mm[1]) - x(cgRange_mm[0])}
          height={fusHpx + 36}
          fill="var(--accent-moss)"
          opacity={0.18}
        />
      )}

      {/* Battery bay highlight */}
      {aircraft.batteryBay && (
        <rect
          x={x(aircraft.batteryBay.x_min_mm)}
          y={fusY + 2}
          width={x(aircraft.batteryBay.x_max_mm) - x(aircraft.batteryBay.x_min_mm)}
          height={fusHpx - 4}
          fill="var(--cream-inset)"
          stroke="var(--accent-warm)"
          strokeDasharray="3 3"
          strokeWidth={1}
        />
      )}

      {/* Fuselage outline */}
      <rect
        x={x(0)}
        y={fusY}
        width={fusL * scaleX}
        height={fusHpx}
        fill="var(--cream-panel)"
        stroke="var(--border-dark)"
        strokeWidth={1.25}
        rx={6}
      />

      {/* Nose marker */}
      <line x1={x(0)} y1={fusY} x2={x(0)} y2={fusY2} stroke="var(--accent-warm)" strokeWidth={2} />

      {/* Wing (side view): airfoil-ish ellipse */}
      <ellipse
        cx={x((wingLE + wingTE) / 2)}
        cy={originY}
        rx={(wingTE - wingLE) * scaleX / 2}
        ry={wingThk * scaleZ}
        fill="var(--cream-inset)"
        stroke="var(--border-dark)"
        strokeWidth={1}
      />

      {/* Horizontal tail */}
      <ellipse
        cx={x(htail.root_le_x_mm + htail.root_chord_mm / 2)}
        cy={originY}
        rx={(htail.root_chord_mm * scaleX) / 2}
        ry={htail.root_chord_mm * 0.08 * scaleZ}
        fill="var(--cream-inset)"
        stroke="var(--border-dark)"
        strokeWidth={1}
      />

      {/* Vertical tail */}
      {vtail && (
        <polygon
          points={[
            [x(vtail.root_le_x_mm), fusY],
            [x(vtail.root_le_x_mm + vtail.root_chord_mm), fusY],
            [
              x(vtail.root_le_x_mm + vtail.root_chord_mm - (vtail.root_chord_mm - vtail.tip_chord_mm) / 2),
              fusY - vtail.height_mm * scaleZ,
            ],
            [
              x(vtail.root_le_x_mm + (vtail.root_chord_mm - vtail.tip_chord_mm) / 2),
              fusY - vtail.height_mm * scaleZ,
            ],
          ]
            .map((p) => p.join(','))
            .join(' ')}
          fill="var(--cream-inset)"
          stroke="var(--border-dark)"
          strokeWidth={1}
        />
      )}

      {/* MAC tick marks */}
      <g opacity={0.6}>
        <line x1={x(macX)} y1={originY - 4} x2={x(macX)} y2={originY + 4} stroke="var(--ink-muted)" />
        <line x1={x(macX + mac)} y1={originY - 4} x2={x(macX + mac)} y2={originY + 4} stroke="var(--ink-muted)" />
        <text
          x={x(macX + mac / 2)}
          y={originY - 8}
          textAnchor="middle"
          fontSize="10"
          fill="var(--ink-muted)"
          fontFamily="IBM Plex Mono, monospace"
        >
          MAC
        </text>
      </g>

      {/* CG marker */}
      {cg_x_mm > 0 && (
        <g>
          <line x1={x(cg_x_mm)} y1={fusY - 22} x2={x(cg_x_mm)} y2={fusY2 + 22} stroke="var(--accent-warm)" strokeWidth={1.5} />
          <CGGlyph cx={x(cg_x_mm)} cy={fusY - 12} />
          <text
            x={x(cg_x_mm)}
            y={fusY2 + 36}
            textAnchor="middle"
            fontSize="10"
            fill="var(--accent-warm)"
            fontFamily="IBM Plex Mono, monospace"
          >
            CG {cg_x_mm.toFixed(0)} mm
          </text>
        </g>
      )}

      {/* Components */}
      {resolved.map((r) => {
        const c = r.component;
        if (!c.visible) return null;
        const cx = x(c.x_mm);
        const cy = z(c.z_mm);
        const selected = c.id === selectedId;
        const radius = Math.max(3, Math.min(10, 3 + Math.sqrt(r.mass_g) * 0.5));
        return (
          <g key={c.id} style={{ cursor: 'pointer' }} onClick={() => onSelect?.(c.id)}>
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill={kindColor(c.kind)}
              stroke={selected ? 'var(--accent-warm)' : 'var(--border-dark)'}
              strokeWidth={selected ? 2 : 1}
            />
            <text
              x={cx}
              y={cy - radius - 3}
              fontSize="9.5"
              textAnchor="middle"
              fill="var(--ink)"
              fontFamily="Inter, sans-serif"
            >
              {c.name}
            </text>
          </g>
        );
      })}

      {/* Axis ticks */}
      <g fill="var(--ink-muted)" fontSize="9" fontFamily="IBM Plex Mono, monospace">
        {ticks(fusL, 100).map((t) => (
          <g key={t}>
            <line x1={x(t)} y1={originY + drawH / 2 - 4} x2={x(t)} y2={originY + drawH / 2 - 1} stroke="var(--ink-muted)" />
            <text x={x(t)} y={originY + drawH / 2 + 8} textAnchor="middle">
              {t}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

function CGGlyph({ cx, cy }: { cx: number; cy: number }) {
  const r = 7;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="var(--cream-card)" stroke="var(--accent-warm)" strokeWidth={1.5} />
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx} ${cy - r} L ${cx} ${cy} Z
            M ${cx} ${cy} L ${cx + r} ${cy} A ${r} ${r} 0 0 1 ${cx} ${cy + r} Z`}
        fill="var(--accent-warm)"
      />
    </g>
  );
}

function kindColor(kind: string): string {
  switch (kind) {
    case 'battery': return '#C68A3E';
    case 'motor': return '#8B5A2B';
    case 'esc': return '#A87858';
    case 'receiver': return '#6B7C3A';
    case 'servo': return '#7E8D44';
    case 'structure': return '#D7C99E';
    case 'spar': return '#3A2F22';
    case 'glue': return '#E1B96A';
    case 'ballast': return '#9A3B1F';
    case 'payload': return '#5A6B2A';
    default: return '#B7AC8E';
  }
}

function ticks(max: number, step: number): number[] {
  const out: number[] = [];
  for (let i = 0; i <= max + 0.001; i += step) out.push(Math.round(i));
  return out;
}
