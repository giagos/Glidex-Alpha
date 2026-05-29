import type { Aircraft, AeroParams } from './types';
import { wingArea_mm2, macLength_mm } from './geometry';

/** Wing loading in g/dm² (the common RC unit). */
export function wingLoading_g_dm2(totalMass_g: number, aircraft: Aircraft): number {
  const S_dm2 = wingArea_mm2(aircraft.wing) / 1e4; // mm² → dm²
  if (S_dm2 <= 0) return 0;
  return totalMass_g / S_dm2;
}

/** Wing loading in oz/ft² (popular among US builders). */
export function wingLoading_oz_ft2(totalMass_g: number, aircraft: Aircraft): number {
  // 1 g/dm² = 0.0327861 oz/ft²
  return wingLoading_g_dm2(totalMass_g, aircraft) * 0.0327861;
}

/**
 * Cubic wing loading: WCL = mass(oz) / (area(ft²))^1.5
 * Returns the dimensionless RC "WCL" number traditionally used for class hints:
 *   < 7  : slow flyer / float / glider
 *   7-9 : trainer / sport
 *   9-13: sport / aerobatic
 *   13+ : pattern / hot liner / warbird
 */
export function cubicWingLoading(totalMass_g: number, aircraft: Aircraft): number {
  const massOz = totalMass_g / 28.3495;
  const areaFt2 = wingArea_mm2(aircraft.wing) / 92903.04;
  if (areaFt2 <= 0) return 0;
  return massOz / Math.pow(areaFt2, 1.5);
}

/**
 * Estimated stall speed in m/s.
 * V_stall = sqrt(2·W / (ρ·S·CLmax))
 * W in Newtons, S in m², ρ in kg/m³.
 */
export function stallSpeed_m_s(totalMass_g: number, aircraft: Aircraft, aero: AeroParams): number {
  const W = (totalMass_g / 1000) * 9.80665;
  const S_m2 = wingArea_mm2(aircraft.wing) / 1e6;
  if (S_m2 <= 0 || aero.cl_max <= 0 || aero.air_density_kg_m3 <= 0) return 0;
  return Math.sqrt((2 * W) / (aero.air_density_kg_m3 * S_m2 * aero.cl_max));
}

/**
 * Reynolds number at MAC for a given freestream speed.
 * Re = V · c / ν   (ν ≈ 1.46e-5 m²/s for air at 15 °C)
 */
export function reynoldsAtMAC(speed_m_s: number, aircraft: Aircraft): number {
  const c_m = macLength_mm(aircraft.wing) / 1000;
  const nu = 1.46e-5;
  return (speed_m_s * c_m) / nu;
}

/**
 * Required CL for steady level flight at chosen speed.
 * CL_req = 2·W / (ρ·V²·S)
 */
export function requiredCL(totalMass_g: number, aircraft: Aircraft, aero: AeroParams): number {
  const W = (totalMass_g / 1000) * 9.80665;
  const S_m2 = wingArea_mm2(aircraft.wing) / 1e6;
  const V = aero.cruise_speed_m_s;
  if (S_m2 <= 0 || V <= 0) return 0;
  return (2 * W) / (aero.air_density_kg_m3 * V * V * S_m2);
}

/* ---------- Warnings ---------- */

export interface Warning {
  level: 'info' | 'warn' | 'danger';
  code: string;
  message: string;
}

export function computeWarnings(
  totalMass_g: number,
  cg_x_mm: number,
  aircraft: Aircraft,
  aero: AeroParams,
  cgRange: [number, number] | undefined,
): Warning[] {
  const out: Warning[] = [];
  const wl = wingLoading_g_dm2(totalMass_g, aircraft);
  const vh = (() => {
    // Avoid circular import; inline a minimal version
    const S = wingArea_mm2(aircraft.wing);
    const Sh = ((aircraft.htail.root_chord_mm + aircraft.htail.tip_chord_mm) / 2) * aircraft.htail.span_mm;
    const mac = macLength_mm(aircraft.wing);
    const lh =
      aircraft.htail.root_le_x_mm + 0.25 * aircraft.htail.root_chord_mm -
      ((aircraft.wing.root_le_x_mm) + 0.25 * macLength_mm(aircraft.wing));
    if (S <= 0 || mac <= 0) return 0;
    return (Sh * lh) / (S * mac);
  })();

  if (totalMass_g <= 0) {
    out.push({ level: 'info', code: 'no-mass', message: 'No components placed yet — add parts to get mass and CG.' });
    return out;
  }
  if (wl > 120) {
    out.push({
      level: 'warn',
      code: 'high-wing-loading',
      message: `Wing loading is ${wl.toFixed(1)} g/dm² — high for a foam-board build (expect fast, hard-landing model).`,
    });
  }
  if (wl < 20) {
    out.push({
      level: 'info',
      code: 'very-low-wing-loading',
      message: `Wing loading is only ${wl.toFixed(1)} g/dm² — very light, may be drift-prone in wind.`,
    });
  }
  if (vh < 0.3 && vh > 0) {
    out.push({
      level: 'warn',
      code: 'low-tail-volume',
      message: `Horizontal tail volume coefficient is ${vh.toFixed(2)} — typical RC range is 0.4–0.7; pitch authority may be weak.`,
    });
  }
  if (vh > 1.0) {
    out.push({
      level: 'info',
      code: 'high-tail-volume',
      message: `Horizontal tail volume coefficient is ${vh.toFixed(2)} — quite high; pitch is very stiff.`,
    });
  }
  const V_stall = stallSpeed_m_s(totalMass_g, aircraft, aero);
  if (V_stall > 12) {
    out.push({
      level: 'warn',
      code: 'high-stall',
      message: `Estimated stall speed is ${V_stall.toFixed(1)} m/s — landings will be quick.`,
    });
  }
  if (cgRange) {
    const [fwd, aft] = cgRange;
    if (cg_x_mm < fwd) {
      out.push({
        level: 'danger',
        code: 'cg-too-forward',
        message: `CG is ${(fwd - cg_x_mm).toFixed(1)} mm ahead of the safe range — the model will feel nose-heavy and resist pitch-up.`,
      });
    } else if (cg_x_mm > aft) {
      out.push({
        level: 'danger',
        code: 'cg-too-aft',
        message: `CG is ${(cg_x_mm - aft).toFixed(1)} mm behind the safe range — the model will be pitch-unstable and dangerous to fly.`,
      });
    }
  }
  return out;
}
