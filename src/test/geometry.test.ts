import { describe, it, expect } from 'vitest';
import {
  wingArea_mm2,
  aspectRatio,
  macLength_mm,
  macY_mm,
  tailVolumeCoefficient,
} from '../domain/geometry';
import type { Aircraft } from '../domain/types';

const aircraft: Aircraft = {
  wing: {
    span_mm: 1000,
    root_chord_mm: 200,
    tip_chord_mm: 200,
    sweep_deg: 0,
    dihedral_deg: 0,
    incidence_deg: 0,
    root_le_x_mm: 100,
  },
  htail: {
    span_mm: 300,
    root_chord_mm: 100,
    tip_chord_mm: 100,
    root_le_x_mm: 600,
  },
  fuselage: { length_mm: 800, max_width_mm: 60, max_height_mm: 80 },
};

describe('geometry — rectangular wing', () => {
  it('wing area = span * chord', () => {
    expect(wingArea_mm2(aircraft.wing)).toBeCloseTo(200_000, 1);
  });
  it('aspect ratio = span² / S', () => {
    expect(aspectRatio(aircraft.wing)).toBeCloseTo(5, 5);
  });
  it('MAC of rectangular wing equals chord', () => {
    expect(macLength_mm(aircraft.wing)).toBeCloseTo(200, 5);
  });
  it('y_MAC of rectangular wing is span/4', () => {
    expect(macY_mm(aircraft.wing)).toBeCloseTo(250, 5);
  });
  it('tail volume coefficient > 0 for sensible layout', () => {
    expect(tailVolumeCoefficient(aircraft)).toBeGreaterThan(0);
  });
});
