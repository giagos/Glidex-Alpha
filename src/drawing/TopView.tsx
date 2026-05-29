import type { Aircraft } from '../domain/types';
import { macLeadingEdgeX_mm, macLength_mm, macY_mm } from '../domain/geometry';

interface TopViewProps {
  aircraft: Aircraft;
  cg_x_mm: number;
  cgRange_mm?: [number, number];
  width?: number;
  height?: number;
}

/**
 * Top view (X-Y plane).
 *  X axis: 0 at nose left, positive aft right.
 *  Y axis: 0 at centerline; positive starboard.
 */
export function TopView({ aircraft, cg_x_mm, cgRange_mm, width = 900, height = 360 }: TopViewProps) {
  const padding = 28;
  const drawW = width - padding * 2;
  const drawH = height - padding * 2;

  const fusL = aircraft.fuselage.length_mm;
  const span = aircraft.wing.span_mm;
  const scaleX = drawW / fusL;
  const scaleY = Math.min(drawH / span, scaleX);
  const originX = padding;
  const originY = height / 2;

  const x = (mm: number) => originX + mm * scaleX;
  const y = (mm: number) => originY - mm * scaleY;

  const w = aircraft.wing;
  const halfSpan = w.span_mm / 2;
  const sweepRad = (w.sweep_deg * Math.PI) / 180;

  // Wing planform (both halves)
  const wingPts = [
    [w.root_le_x_mm, 0],
    [w.root_le_x_mm + halfSpan * Math.tan(sweepRad), halfSpan],
    [w.root_le_x_mm + halfSpan * Math.tan(sweepRad) + w.tip_chord_mm, halfSpan],
    [w.root_le_x_mm + w.root_chord_mm, 0],
    [w.root_le_x_mm + halfSpan * Math.tan(sweepRad) + w.tip_chord_mm, -halfSpan],
    [w.root_le_x_mm + halfSpan * Math.tan(sweepRad), -halfSpan],
  ];

  const ht = aircraft.htail;
  const htHalf = ht.span_mm / 2;
  const htPts = [
    [ht.root_le_x_mm, 0],
    [ht.root_le_x_mm, htHalf],
    [ht.root_le_x_mm + ht.tip_chord_mm, htHalf],
    [ht.root_le_x_mm + ht.root_chord_mm, 0],
    [ht.root_le_x_mm + ht.tip_chord_mm, -htHalf],
    [ht.root_le_x_mm, -htHalf],
  ];

  const fusWHalf = aircraft.fuselage.max_width_mm / 2;
  const macX = macLeadingEdgeX_mm(w);
  const mac = macLength_mm(w);
  const yMAC = macY_mm(w);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ background: 'var(--cream-card)', boxShadow: 'var(--shadow-bevel-in)', borderRadius: 4 }}
    >
      {/* Centerline */}
      <line x1={x(0)} y1={y(0)} x2={x(fusL)} y2={y(0)} stroke="var(--bevel-lo)" strokeDasharray="4 4" />

      {/* Safe CG band */}
      {cgRange_mm && (
        <rect
          x={x(cgRange_mm[0])}
          y={y(span * 0.55)}
          width={x(cgRange_mm[1]) - x(cgRange_mm[0])}
          height={Math.abs(y(-span * 0.55) - y(span * 0.55))}
          fill="var(--accent-moss)"
          opacity={0.15}
        />
      )}

      {/* Fuselage */}
      <rect
        x={x(0)}
        y={y(fusWHalf)}
        width={fusL * scaleX}
        height={Math.abs(y(-fusWHalf) - y(fusWHalf))}
        fill="var(--cream-panel)"
        stroke="var(--border-dark)"
        strokeWidth={1.25}
        rx={4}
      />

      {/* Wing */}
      <polygon
        points={wingPts.map(([px, py]) => `${x(px)},${y(py)}`).join(' ')}
        fill="var(--cream-inset)"
        stroke="var(--border-dark)"
        strokeWidth={1.25}
      />

      {/* Horizontal tail */}
      <polygon
        points={htPts.map(([px, py]) => `${x(px)},${y(py)}`).join(' ')}
        fill="var(--cream-inset)"
        stroke="var(--border-dark)"
        strokeWidth={1.25}
      />

      {/* MAC chord line (drawn at +yMAC) */}
      <line
        x1={x(macX)}
        y1={y(yMAC)}
        x2={x(macX + mac)}
        y2={y(yMAC)}
        stroke="var(--accent-warm)"
        strokeWidth={1.5}
      />
      <text
        x={x(macX + mac / 2)}
        y={y(yMAC) - 4}
        textAnchor="middle"
        fontSize="10"
        fill="var(--accent-warm)"
        fontFamily="IBM Plex Mono, monospace"
      >
        MAC {mac.toFixed(0)} mm
      </text>

      {/* CG line */}
      {cg_x_mm > 0 && (
        <line x1={x(cg_x_mm)} y1={y(span * 0.55)} x2={x(cg_x_mm)} y2={y(-span * 0.55)} stroke="var(--accent-warm)" strokeWidth={1.5} />
      )}

      {/* Axis labels */}
      <text x={x(fusL) - 4} y={y(0) - 4} fontSize="10" textAnchor="end" fill="var(--ink-muted)">
        x (aft) →
      </text>
    </svg>
  );
}
