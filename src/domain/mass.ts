import type { Component, Material, Part, MassSource } from './types';

export interface ResolvedComponent {
  component: Component;
  mass_g: number;
  /** Human-readable explanation of how mass was derived. */
  derivation: string;
}

export function resolveMass(
  source: MassSource,
  materials: ReadonlyMap<string, Material>,
  parts: ReadonlyMap<string, Part>,
): { mass_g: number; derivation: string } {
  switch (source.kind) {
    case 'fixed':
      return { mass_g: source.mass_g, derivation: `Fixed ${fmt(source.mass_g)} g` };
    case 'part': {
      const p = parts.get(source.partId);
      if (!p) return { mass_g: 0, derivation: `Missing part ${source.partId}` };
      const m = p.mass_g * source.count;
      return {
        mass_g: m,
        derivation: `${source.count} × "${p.name}" @ ${fmt(p.mass_g)} g = ${fmt(m)} g`,
      };
    }
    case 'sheet': {
      const mat = materials.get(source.materialId);
      if (!mat || mat.kind !== 'sheet')
        return { mass_g: 0, derivation: `Missing sheet material ${source.materialId}` };
      // density is g/m²; area in mm² → m² = area / 1e6
      const m = (mat.density * source.area_mm2) / 1e6;
      return {
        mass_g: m,
        derivation: `"${mat.name}" @ ${fmt(mat.density)} g/m² × ${fmt(source.area_mm2 / 1e6, 4)} m² = ${fmt(m)} g`,
      };
    }
    case 'linear': {
      const mat = materials.get(source.materialId);
      if (!mat || mat.kind !== 'linear')
        return { mass_g: 0, derivation: `Missing linear material ${source.materialId}` };
      // density g/m, length mm → m = length / 1000
      const m = (mat.density * source.length_mm) / 1000;
      return {
        mass_g: m,
        derivation: `"${mat.name}" @ ${fmt(mat.density)} g/m × ${fmt(source.length_mm / 1000, 3)} m = ${fmt(m)} g`,
      };
    }
    case 'volume': {
      const mat = materials.get(source.materialId);
      if (!mat || mat.kind !== 'volume')
        return { mass_g: 0, derivation: `Missing volume material ${source.materialId}` };
      const m = mat.density * source.volume_cm3;
      return {
        mass_g: m,
        derivation: `"${mat.name}" @ ${fmt(mat.density)} g/cm³ × ${fmt(source.volume_cm3)} cm³ = ${fmt(m)} g`,
      };
    }
    case 'lump': {
      const mat = materials.get(source.materialId);
      if (!mat || mat.kind !== 'lump')
        return { mass_g: 0, derivation: `Missing lump material ${source.materialId}` };
      const m = mat.density * source.count;
      return {
        mass_g: m,
        derivation: `${source.count} × "${mat.name}" lump @ ${fmt(mat.density)} g = ${fmt(m)} g`,
      };
    }
  }
}

export function resolveAll(
  components: readonly Component[],
  materials: readonly Material[],
  parts: readonly Part[],
): ResolvedComponent[] {
  const mm = new Map(materials.map((m) => [m.id, m]));
  const pm = new Map(parts.map((p) => [p.id, p]));
  return components.map((c) => {
    const r = resolveMass(c.source, mm, pm);
    return { component: c, mass_g: r.mass_g, derivation: r.derivation };
  });
}

export interface MassSummary {
  totalMass_g: number;
  cg_x_mm: number;
  byKind: Record<string, number>;
  /** Per-component contribution to the CG moment (g·mm). */
  contributions: Array<{
    id: string;
    name: string;
    kind: string;
    mass_g: number;
    x_mm: number;
    moment_g_mm: number;
  }>;
}

/** Compute 1D CG along the X axis (from nose). Ignores invisible components. */
export function computeMass(resolved: readonly ResolvedComponent[]): MassSummary {
  let totalM = 0;
  let totalMx = 0;
  const byKind: Record<string, number> = {};
  const contributions: MassSummary['contributions'] = [];

  for (const r of resolved) {
    if (!r.component.visible) continue;
    const m = r.mass_g;
    const x = r.component.x_mm;
    totalM += m;
    totalMx += m * x;
    byKind[r.component.kind] = (byKind[r.component.kind] ?? 0) + m;
    contributions.push({
      id: r.component.id,
      name: r.component.name,
      kind: r.component.kind,
      mass_g: m,
      x_mm: x,
      moment_g_mm: m * x,
    });
  }

  return {
    totalMass_g: totalM,
    cg_x_mm: totalM > 0 ? totalMx / totalM : 0,
    byKind,
    contributions,
  };
}

function fmt(n: number, digits = 2): string {
  if (!isFinite(n)) return '∞';
  return n.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
}
