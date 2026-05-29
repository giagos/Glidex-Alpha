import { describe, it, expect } from 'vitest';
import { resolveAll, computeMass } from '../domain/mass';
import type { Component, Material, Part } from '../domain/types';

const parts: Part[] = [
  { id: 'p1', name: 'battery', category: 'battery', mass_g: 200 },
];
const materials: Material[] = [
  { id: 'm1', name: 'foam', kind: 'sheet', density: 200 },          // g/m²
  { id: 'm2', name: 'spar', kind: 'linear', density: 18 },          // g/m
];

const components: Component[] = [
  { id: 'a', name: 'battery', kind: 'battery',
    source: { kind: 'part', partId: 'p1', count: 1 },
    x_mm: 100, y_mm: 0, z_mm: 0, visible: true },
  { id: 'b', name: 'wing skin', kind: 'structure',
    source: { kind: 'sheet', materialId: 'm1', area_mm2: 1_000_000 }, // 1 m² × 200 g/m² = 200 g
    x_mm: 300, y_mm: 0, z_mm: 0, visible: true },
  { id: 'c', name: 'spar', kind: 'spar',
    source: { kind: 'linear', materialId: 'm2', length_mm: 1000 },   // 1 m × 18 g/m = 18 g
    x_mm: 300, y_mm: 0, z_mm: 0, visible: true },
];

describe('mass resolution', () => {
  it('resolves part-based mass', () => {
    const r = resolveAll(components, materials, parts);
    expect(r.find((x) => x.component.id === 'a')!.mass_g).toBe(200);
  });
  it('resolves sheet area to mass via g/m²', () => {
    const r = resolveAll(components, materials, parts);
    expect(r.find((x) => x.component.id === 'b')!.mass_g).toBeCloseTo(200, 5);
  });
  it('resolves linear length to mass via g/m', () => {
    const r = resolveAll(components, materials, parts);
    expect(r.find((x) => x.component.id === 'c')!.mass_g).toBeCloseTo(18, 5);
  });
  it('CG is moment-weighted average', () => {
    const r = resolveAll(components, materials, parts);
    const s = computeMass(r);
    expect(s.totalMass_g).toBeCloseTo(418, 1);
    // (200*100 + 200*300 + 18*300) / 418
    expect(s.cg_x_mm).toBeCloseTo((200 * 100 + 200 * 300 + 18 * 300) / 418, 3);
  });
});
