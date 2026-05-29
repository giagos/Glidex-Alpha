import type { Aircraft, Wing, Tail } from './types';

/** Area in mm² of a trapezoidal half-wing (one panel) summed over both sides. */
export function wingArea_mm2(w: Wing): number {
  // S = (c_root + c_tip) / 2 * span
  return ((w.root_chord_mm + w.tip_chord_mm) / 2) * w.span_mm;
}

export function tailArea_mm2(t: Tail): number {
  return ((t.root_chord_mm + t.tip_chord_mm) / 2) * t.span_mm;
}

export function aspectRatio(w: Wing): number {
  const s = wingArea_mm2(w);
  if (s <= 0) return 0;
  return (w.span_mm * w.span_mm) / s;
}

export function taperRatio(w: Wing): number {
  if (w.root_chord_mm <= 0) return 0;
  return w.tip_chord_mm / w.root_chord_mm;
}

/**
 * Mean aerodynamic chord (MAC) length for a trapezoidal wing.
 * MAC = (2/3) * c_root * (1 + λ + λ²) / (1 + λ)
 * where λ = c_tip / c_root.
 */
export function macLength_mm(w: Wing): number {
  const lambda = taperRatio(w);
  const denom = 1 + lambda;
  if (denom === 0) return 0;
  return (2 / 3) * w.root_chord_mm * ((1 + lambda + lambda * lambda) / denom);
}

/**
 * Spanwise position of MAC (y from root), trapezoidal wing.
 * y_MAC = (b/6) * (c_root + 2*c_tip) / (c_root + c_tip)
 */
export function macY_mm(w: Wing): number {
  const denom = w.root_chord_mm + w.tip_chord_mm;
  if (denom === 0) return 0;
  const halfSpan = w.span_mm / 2;
  return (halfSpan / 3) * ((w.root_chord_mm + 2 * w.tip_chord_mm) / denom);
}

/**
 * X position (from nose) of the MAC leading edge.
 * Combines root LE position with sweep at the MAC y-station.
 */
export function macLeadingEdgeX_mm(w: Wing): number {
  const y = macY_mm(w);
  const sweepRad = (w.sweep_deg * Math.PI) / 180;
  return w.root_le_x_mm + y * Math.tan(sweepRad);
}

/** Tail moment arm (root LE to root LE distance; informal but practical). */
export function tailArm_mm(wing: Wing, htail: Tail): number {
  // Use quarter-chord points as a reasonable approximation
  const wingQC = macLeadingEdgeX_mm(wing) + 0.25 * macLength_mm(wing);
  const tailQC = htail.root_le_x_mm + 0.25 * htail.root_chord_mm;
  return tailQC - wingQC;
}

/** Horizontal tail volume coefficient Vh = (S_h * l_h) / (S * MAC). */
export function tailVolumeCoefficient(aircraft: Aircraft): number {
  const S = wingArea_mm2(aircraft.wing);
  const Sh = tailArea_mm2(aircraft.htail);
  const lh = tailArm_mm(aircraft.wing, aircraft.htail);
  const mac = macLength_mm(aircraft.wing);
  if (S <= 0 || mac <= 0) return 0;
  return (Sh * lh) / (S * mac);
}

/** Default suggested CG: 30 % MAC. Returns mm from nose. */
export function defaultCG_x_mm(wing: Wing, fraction = 0.3): number {
  return macLeadingEdgeX_mm(wing) + fraction * macLength_mm(wing);
}

/** Suggested safe CG range: 25 % to 35 % MAC. */
export function defaultCGRange_mm(wing: Wing): [number, number] {
  const le = macLeadingEdgeX_mm(wing);
  const mac = macLength_mm(wing);
  return [le + 0.25 * mac, le + 0.35 * mac];
}

/* ------------------------------------------------------------------ */
/* Trace helpers — every public number can carry an explanation.       */
/* ------------------------------------------------------------------ */

export interface Trace {
  formula: string;
  inputs: Record<string, number | string>;
  result: number;
  unit: string;
}

export function wingAreaTrace(w: Wing): Trace {
  return {
    formula: 'S = (c_root + c_tip) / 2 × span',
    inputs: { c_root_mm: w.root_chord_mm, c_tip_mm: w.tip_chord_mm, span_mm: w.span_mm },
    result: wingArea_mm2(w),
    unit: 'mm²',
  };
}

export function macTrace(w: Wing): Trace {
  return {
    formula: 'MAC = (2/3) × c_root × (1 + λ + λ²) / (1 + λ),  λ = c_tip / c_root',
    inputs: {
      c_root_mm: w.root_chord_mm,
      c_tip_mm: w.tip_chord_mm,
      lambda: taperRatio(w),
    },
    result: macLength_mm(w),
    unit: 'mm',
  };
}
