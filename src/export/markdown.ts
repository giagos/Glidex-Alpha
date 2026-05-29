import type { Project } from '../domain/types';
import { resolveAll, computeMass } from '../domain/mass';
import { getAdapter } from '../persistence/adapter';
import type { Derived } from '../app/views/useDerived';
import * as geom from '../domain/geometry';
import * as aero from '../domain/aero';

export function buildMarkdownReport(project: Project, d: Derived): string {
  const resolved = resolveAll(project.components, project.materials, project.parts);
  const lines: string[] = [];
  lines.push(`# ${project.meta.name || 'Aircraft report'}`);
  lines.push('');
  lines.push(`*Generated ${new Date(project.meta.updatedAt).toLocaleString()} by Glidex Alpha v${project.meta.appVersion}.*`);
  lines.push('');

  lines.push('## Geometry');
  lines.push(`- Wing span: **${project.aircraft.wing.span_mm} mm**`);
  lines.push(`- Root / tip chord: **${project.aircraft.wing.root_chord_mm} / ${project.aircraft.wing.tip_chord_mm} mm**`);
  lines.push(`- Wing area: **${d.wingArea_dm2.toFixed(2)} dm²**`);
  lines.push(`- Aspect ratio: **${d.aspectRatio.toFixed(2)}**`);
  lines.push(`- MAC: **${d.mac_mm.toFixed(1)} mm**`);
  lines.push(`- Horizontal tail volume Vh: **${d.tailVolume.toFixed(2)}**`);
  lines.push(`- Fuselage: **${project.aircraft.fuselage.length_mm} × ${project.aircraft.fuselage.max_width_mm} × ${project.aircraft.fuselage.max_height_mm} mm**`);
  lines.push('');

  lines.push('## Mass & CG');
  lines.push(`- Total mass: **${d.totalMass_g.toFixed(1)} g**`);
  lines.push(`- CG (from nose): **${d.cg_x_mm.toFixed(1)} mm**`);
  lines.push(`- Target CG: **${d.cgTarget_mm.toFixed(1)} mm** (safe range ${d.cgRange_mm[0].toFixed(1)} – ${d.cgRange_mm[1].toFixed(1)} mm)`);
  lines.push('');
  lines.push('### Mass by kind');
  lines.push('');
  lines.push('| Kind | Mass (g) |');
  lines.push('|---|---:|');
  for (const [k, m] of Object.entries(d.byKind)) {
    lines.push(`| ${k} | ${m.toFixed(1)} |`);
  }
  lines.push('');

  lines.push('### Component list');
  lines.push('');
  lines.push('| Component | Kind | x [mm] | Mass [g] | Derivation |');
  lines.push('|---|---|---:|---:|---|');
  for (const r of resolved) {
    lines.push(`| ${r.component.name} | ${r.component.kind} | ${r.component.x_mm.toFixed(1)} | ${r.mass_g.toFixed(1)} | ${r.derivation} |`);
  }
  lines.push('');

  lines.push('## Aerodynamic estimates');
  lines.push(`- Wing loading: **${d.wingLoading_g_dm2.toFixed(1)} g/dm²**`);
  lines.push(`- Cubic wing loading: **${d.cubicWingLoading.toFixed(2)}**`);
  lines.push(`- Estimated stall speed: **${d.stallSpeed_m_s.toFixed(1)} m/s**`);
  lines.push(`- Re @ ${project.aero.cruise_speed_m_s} m/s: **${Math.round(d.reynoldsAtCruise).toLocaleString()}**`);
  lines.push(`- Required CL @ cruise: **${d.requiredCL.toFixed(2)}**`);
  lines.push('');

  if (d.warnings.length > 0) {
    lines.push('## Warnings');
    for (const w of d.warnings) {
      lines.push(`- **[${w.level.toUpperCase()}]** ${w.message}`);
    }
    lines.push('');
  }

  lines.push('## Materials library');
  if (project.materials.length === 0) lines.push('_(none)_');
  else {
    lines.push('| Material | Kind | Density |');
    lines.push('|---|---|---:|');
    for (const m of project.materials) {
      lines.push(`| ${m.name} | ${m.kind} | ${m.density} ${densityUnit(m.kind)} |`);
    }
  }
  lines.push('');
  return lines.join('\n');
}

function densityUnit(kind: string): string {
  switch (kind) {
    case 'sheet': return 'g/m²';
    case 'linear': return 'g/m';
    case 'volume': return 'g/cm³';
    case 'lump': return 'g';
    default: return '';
  }
}

export async function exportMarkdown(project: Project): Promise<void> {
  const resolved = resolveAll(project.components, project.materials, project.parts);
  const mass = computeMass(resolved);
  const S = geom.wingArea_mm2(project.aircraft.wing);
  const cgRange = project.target?.range_mm ?? geom.defaultCGRange_mm(project.aircraft.wing);
  const d: Derived = {
    totalMass_g: mass.totalMass_g,
    cg_x_mm: mass.cg_x_mm,
    contributions: mass.contributions,
    byKind: mass.byKind,
    wingArea_mm2: S,
    wingArea_dm2: S / 1e4,
    aspectRatio: geom.aspectRatio(project.aircraft.wing),
    mac_mm: geom.macLength_mm(project.aircraft.wing),
    tailVolume: geom.tailVolumeCoefficient(project.aircraft),
    wingLoading_g_dm2: aero.wingLoading_g_dm2(mass.totalMass_g, project.aircraft),
    cubicWingLoading: aero.cubicWingLoading(mass.totalMass_g, project.aircraft),
    stallSpeed_m_s: aero.stallSpeed_m_s(mass.totalMass_g, project.aircraft, project.aero),
    reynoldsAtCruise: aero.reynoldsAtMAC(project.aero.cruise_speed_m_s, project.aircraft),
    requiredCL: aero.requiredCL(mass.totalMass_g, project.aircraft, project.aero),
    cgTarget_mm: project.target?.x_mm ?? geom.defaultCG_x_mm(project.aircraft.wing),
    cgRange_mm: cgRange,
    warnings: aero.computeWarnings(mass.totalMass_g, mass.cg_x_mm, project.aircraft, project.aero, cgRange),
  };
  const md = buildMarkdownReport(project, d);
  const a = await getAdapter();
  await a.saveBytes(
    new TextEncoder().encode(md),
    `${project.meta.name || 'aircraft'}-report.md`,
    'text/markdown',
    ['md'],
  );
}
