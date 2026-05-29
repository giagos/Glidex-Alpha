import { describe, it, expect } from 'vitest';
import { proposeBallast } from '../domain/ballast';
import type { Component, Part } from '../domain/types';

const parts: Part[] = [
  { id: 'p-batt', name: 'batt', category: 'battery', mass_g: 200 },
  { id: 'p-motor', name: 'motor', category: 'motor', mass_g: 50 },
];

describe('ballast solver', () => {
  it('returns no ballast when CG already in range', () => {
    const comps: Component[] = [
      { id: 'm', name: 'motor', kind: 'motor',
        source: { kind: 'part', partId: 'p-motor', count: 1 },
        x_mm: 0, y_mm: 0, z_mm: 0, visible: true },
      { id: 'b', name: 'battery', kind: 'battery',
        source: { kind: 'part', partId: 'p-batt', count: 1 },
        x_mm: 100, y_mm: 0, z_mm: 0, visible: true },
    ];
    const p = proposeBallast(comps, [], parts, 80, [70, 90], { ballastX_mm: 0 });
    expect(p.ballast_g).toBe(0);
  });

  it('moves a movable battery instead of adding ballast', () => {
    const comps: Component[] = [
      { id: 'm', name: 'motor', kind: 'motor',
        source: { kind: 'part', partId: 'p-motor', count: 1 },
        x_mm: 0, y_mm: 0, z_mm: 0, visible: true },
      { id: 'b', name: 'battery', kind: 'battery',
        source: { kind: 'part', partId: 'p-batt', count: 1 },
        x_mm: 200, y_mm: 0, z_mm: 0, visible: true,
        movable: { x: true, xRange_mm: [50, 200] } },
    ];
    const p = proposeBallast(comps, [], parts, 80, [70, 90], { ballastX_mm: 0 });
    expect(p.moves.length).toBeGreaterThan(0);
    expect(p.ballast_g).toBeLessThan(20);
  });

  it('adds nose ballast when nothing is movable', () => {
    const comps: Component[] = [
      { id: 'b', name: 'battery', kind: 'battery',
        source: { kind: 'part', partId: 'p-batt', count: 1 },
        x_mm: 500, y_mm: 0, z_mm: 0, visible: true },
    ];
    const p = proposeBallast(comps, [], parts, 200, [180, 220], { ballastX_mm: 0 });
    expect(p.ballast_g).toBeGreaterThan(0);
    expect(p.predictedCG_mm).toBeGreaterThanOrEqual(180 - 1e-6);
    expect(p.predictedCG_mm).toBeLessThanOrEqual(220 + 1e-6);
  });
});
