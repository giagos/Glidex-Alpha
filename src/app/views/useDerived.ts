import { useMemo } from 'react';
import type { Project } from '../../domain/types';
import { resolveAll, computeMass } from '../../domain/mass';
import {
  wingLoading_g_dm2,
  cubicWingLoading,
  stallSpeed_m_s,
  reynoldsAtMAC,
  requiredCL,
  computeWarnings,
} from '../../domain/aero';
import {
  wingArea_mm2,
  aspectRatio,
  macLength_mm,
  tailVolumeCoefficient,
  defaultCG_x_mm,
  defaultCGRange_mm,
} from '../../domain/geometry';

export interface Derived {
  totalMass_g: number;
  cg_x_mm: number;
  contributions: ReturnType<typeof computeMass>['contributions'];
  byKind: Record<string, number>;
  wingArea_mm2: number;
  wingArea_dm2: number;
  aspectRatio: number;
  mac_mm: number;
  tailVolume: number;
  wingLoading_g_dm2: number;
  cubicWingLoading: number;
  stallSpeed_m_s: number;
  reynoldsAtCruise: number;
  requiredCL: number;
  cgTarget_mm: number;
  cgRange_mm: [number, number];
  warnings: ReturnType<typeof computeWarnings>;
}

export function useDerived(project: Project): Derived {
  return useMemo(() => {
    const resolved = resolveAll(project.components, project.materials, project.parts);
    const mass = computeMass(resolved);
    const S = wingArea_mm2(project.aircraft.wing);
    const cgTarget = project.target?.x_mm ?? defaultCG_x_mm(project.aircraft.wing);
    const cgRange = project.target?.range_mm ?? defaultCGRange_mm(project.aircraft.wing);
    return {
      totalMass_g: mass.totalMass_g,
      cg_x_mm: mass.cg_x_mm,
      contributions: mass.contributions,
      byKind: mass.byKind,
      wingArea_mm2: S,
      wingArea_dm2: S / 1e4,
      aspectRatio: aspectRatio(project.aircraft.wing),
      mac_mm: macLength_mm(project.aircraft.wing),
      tailVolume: tailVolumeCoefficient(project.aircraft),
      wingLoading_g_dm2: wingLoading_g_dm2(mass.totalMass_g, project.aircraft),
      cubicWingLoading: cubicWingLoading(mass.totalMass_g, project.aircraft),
      stallSpeed_m_s: stallSpeed_m_s(mass.totalMass_g, project.aircraft, project.aero),
      reynoldsAtCruise: reynoldsAtMAC(project.aero.cruise_speed_m_s, project.aircraft),
      requiredCL: requiredCL(mass.totalMass_g, project.aircraft, project.aero),
      cgTarget_mm: cgTarget,
      cgRange_mm: cgRange,
      warnings: computeWarnings(
        mass.totalMass_g,
        mass.cg_x_mm,
        project.aircraft,
        project.aero,
        cgRange,
      ),
    };
  }, [project]);
}
