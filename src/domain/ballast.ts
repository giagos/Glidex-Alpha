import type { Component, Material, Part } from './types';
import { resolveAll, computeMass } from './mass';

export interface BallastProposal {
  /** Required ballast mass in grams (>= 0). Negative means already too aft. */
  ballast_g: number;
  /** Suggested ballast X position (mm from nose). */
  ballast_x_mm: number;
  /** Suggested moves of existing movable components. */
  moves: Array<{ id: string; from_x_mm: number; to_x_mm: number; mass_g: number }>;
  /** Final predicted CG after applying moves and ballast. */
  predictedCG_mm: number;
  explanation: string;
}

interface SolveOptions {
  /** Position to place ballast at (e.g. nose, x = 0). */
  ballastX_mm: number;
}

/**
 * Deterministic ballast minimizer.
 *
 * Strategy:
 *   1. Compute current CG with all movables at their current x.
 *   2. If CG already in target range, no action.
 *   3. Try shifting each movable to the end of its allowed range that
 *      reduces |CG - target|. Sort movables by leverage (mass × range).
 *      Greedy apply moves until either CG enters range or all movables exhausted.
 *   4. If still outside, compute exact ballast at ballastX_mm to hit target.
 *
 * This is O(n log n), deterministic, and explainable.
 */
export function proposeBallast(
  components: readonly Component[],
  materials: readonly Material[],
  parts: readonly Part[],
  targetCG_mm: number,
  cgRange_mm: [number, number],
  options: SolveOptions,
): BallastProposal {
  const resolved = resolveAll(components, materials, parts);
  const initial = computeMass(resolved);
  const [fwd, aft] = cgRange_mm;
  const inRange = (cg: number) => cg >= fwd && cg <= aft;

  // Working copy: x positions we can shift
  const working = resolved.map((r) => ({
    ...r,
    x_mm: r.component.x_mm,
  }));

  const moves: BallastProposal['moves'] = [];

  if (!inRange(initial.cg_x_mm)) {
    // Direction we need to push CG
    const wantForward = initial.cg_x_mm > aft;
    // Sort movables by leverage potential
    const movables = working
      .map((w, idx) => {
        const m = w.component.movable;
        if (!w.component.visible || !m || !m.x || !m.xRange_mm || w.mass_g <= 0) return null;
        return { idx, w, range: m.xRange_mm };
      })
      .filter(<T>(x: T | null): x is T => x !== null)
      .sort((a, b) => {
        const aLev = a.w.mass_g * (a.range[1] - a.range[0]);
        const bLev = b.w.mass_g * (b.range[1] - b.range[0]);
        return bLev - aLev;
      });

    for (const mv of movables) {
      const newX = wantForward ? mv.range[0] : mv.range[1];
      if (newX === mv.w.x_mm) continue;
      moves.push({
        id: mv.w.component.id,
        from_x_mm: mv.w.x_mm,
        to_x_mm: newX,
        mass_g: mv.w.mass_g,
      });
      mv.w.x_mm = newX;
      // recompute CG with current working set
      const { totalM, totalMx } = working.reduce(
        (acc, x) => {
          if (!x.component.visible) return acc;
          return { totalM: acc.totalM + x.mass_g, totalMx: acc.totalMx + x.mass_g * x.x_mm };
        },
        { totalM: 0, totalMx: 0 },
      );
      const cg = totalM > 0 ? totalMx / totalM : 0;
      if (inRange(cg)) break;
    }
  }

  // Recompute final CG after moves
  const finalAgg = working.reduce(
    (acc, x) => {
      if (!x.component.visible) return acc;
      return { totalM: acc.totalM + x.mass_g, totalMx: acc.totalMx + x.mass_g * x.x_mm };
    },
    { totalM: 0, totalMx: 0 },
  );
  const cgAfterMoves = finalAgg.totalM > 0 ? finalAgg.totalMx / finalAgg.totalM : 0;

  let ballast_g = 0;
  let predictedCG = cgAfterMoves;
  if (!inRange(cgAfterMoves)) {
    // m_b = (target * M - S) / (x_b - target)
    const denom = options.ballastX_mm - targetCG_mm;
    if (Math.abs(denom) > 1e-6) {
      const required = (targetCG_mm * finalAgg.totalM - finalAgg.totalMx) / denom;
      ballast_g = Math.max(0, required);
      const newTotalM = finalAgg.totalM + ballast_g;
      const newTotalMx = finalAgg.totalMx + ballast_g * options.ballastX_mm;
      predictedCG = newTotalM > 0 ? newTotalMx / newTotalM : 0;
    }
  }

  const explanation =
    `Initial CG: ${initial.cg_x_mm.toFixed(1)} mm. Target: ${targetCG_mm.toFixed(1)} mm ` +
    `(range ${fwd.toFixed(1)}–${aft.toFixed(1)}). ` +
    (moves.length > 0
      ? `Moved ${moves.length} component(s) within their allowed ranges. `
      : 'No movable components were repositioned. ') +
    (ballast_g > 0
      ? `Then added ${ballast_g.toFixed(1)} g of ballast at x = ${options.ballastX_mm.toFixed(1)} mm.`
      : 'No additional ballast required.');

  return {
    ballast_g,
    ballast_x_mm: options.ballastX_mm,
    moves,
    predictedCG_mm: predictedCG,
    explanation,
  };
}
