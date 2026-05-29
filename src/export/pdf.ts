import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { Project } from '../domain/types';
import { getAdapter } from '../persistence/adapter';
import { resolveAll, computeMass } from '../domain/mass';
import {
  wingArea_mm2,
  aspectRatio,
  macLength_mm,
  tailVolumeCoefficient,
  defaultCG_x_mm,
  defaultCGRange_mm,
} from '../domain/geometry';
import {
  wingLoading_g_dm2,
  cubicWingLoading,
  stallSpeed_m_s,
  reynoldsAtMAC,
  requiredCL,
  computeWarnings,
} from '../domain/aero';

export async function exportPDF(project: Project): Promise<void> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4 portrait
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const mono = await pdf.embedFont(StandardFonts.Courier);

  const margin = 48;
  let y = page.getHeight() - margin;

  const cream = rgb(0.95, 0.92, 0.86);
  const ink = rgb(0.12, 0.1, 0.07);
  const muted = rgb(0.42, 0.37, 0.27);

  // Background tint header
  page.drawRectangle({
    x: 0,
    y: page.getHeight() - 80,
    width: page.getWidth(),
    height: 80,
    color: cream,
  });

  const title = project.meta.name || 'Aircraft report';
  page.drawText(title, { x: margin, y: y - 6, size: 22, font: bold, color: ink });
  y -= 36;
  page.drawText(
    `Glidex Alpha v${project.meta.appVersion} · ${new Date(project.meta.updatedAt).toLocaleString()}`,
    { x: margin, y: y, size: 9, font, color: muted },
  );
  y -= 30;

  // Compute derived
  const resolved = resolveAll(project.components, project.materials, project.parts);
  const mass = computeMass(resolved);
  const S = wingArea_mm2(project.aircraft.wing);
  const cgRange = project.target?.range_mm ?? defaultCGRange_mm(project.aircraft.wing);
  const cgTarget = project.target?.x_mm ?? defaultCG_x_mm(project.aircraft.wing);

  const stats: [string, string][] = [
    ['Total mass', `${mass.totalMass_g.toFixed(1)} g`],
    ['CG (from nose)', `${mass.cg_x_mm.toFixed(1)} mm`],
    ['Target CG', `${cgTarget.toFixed(1)} mm`],
    ['Safe CG range', `${cgRange[0].toFixed(1)} – ${cgRange[1].toFixed(1)} mm`],
    ['Wing area', `${(S / 1e4).toFixed(2)} dm²`],
    ['Aspect ratio', `${aspectRatio(project.aircraft.wing).toFixed(2)}`],
    ['MAC', `${macLength_mm(project.aircraft.wing).toFixed(1)} mm`],
    ['Tail volume Vh', `${tailVolumeCoefficient(project.aircraft).toFixed(2)}`],
    ['Wing loading', `${wingLoading_g_dm2(mass.totalMass_g, project.aircraft).toFixed(1)} g/dm²`],
    ['Cubic wing loading', `${cubicWingLoading(mass.totalMass_g, project.aircraft).toFixed(2)}`],
    ['Stall speed', `${stallSpeed_m_s(mass.totalMass_g, project.aircraft, project.aero).toFixed(1)} m/s`],
    ['Re @ cruise', `${Math.round(reynoldsAtMAC(project.aero.cruise_speed_m_s, project.aircraft)).toLocaleString()}`],
    ['Required CL', `${requiredCL(mass.totalMass_g, project.aircraft, project.aero).toFixed(2)}`],
  ];

  page.drawText('Key numbers', { x: margin, y, size: 13, font: bold, color: ink });
  y -= 16;
  const colW = (page.getWidth() - margin * 2) / 2;
  let col = 0;
  let rowY = y;
  for (const [k, v] of stats) {
    const x = margin + col * colW;
    page.drawText(k, { x, y: rowY, size: 9, font, color: muted });
    page.drawText(v, { x: x + 130, y: rowY, size: 10, font: mono, color: ink });
    if (col === 0) col = 1;
    else {
      col = 0;
      rowY -= 14;
    }
  }
  y = rowY - 16;

  // Components table
  page.drawText('Components', { x: margin, y, size: 13, font: bold, color: ink });
  y -= 14;
  page.drawText('Name', { x: margin, y, size: 9, font: bold, color: muted });
  page.drawText('Kind', { x: margin + 180, y, size: 9, font: bold, color: muted });
  page.drawText('x (mm)', { x: margin + 280, y, size: 9, font: bold, color: muted });
  page.drawText('Mass (g)', { x: margin + 360, y, size: 9, font: bold, color: muted });
  y -= 10;
  page.drawLine({
    start: { x: margin, y },
    end: { x: page.getWidth() - margin, y },
    color: muted,
    thickness: 0.5,
  });
  y -= 10;
  for (const r of resolved) {
    if (y < margin + 40) break;
    page.drawText(truncate(r.component.name, 32), { x: margin, y, size: 9, font, color: ink });
    page.drawText(r.component.kind, { x: margin + 180, y, size: 9, font, color: ink });
    page.drawText(r.component.x_mm.toFixed(1), { x: margin + 280, y, size: 9, font: mono, color: ink });
    page.drawText(r.mass_g.toFixed(1), { x: margin + 360, y, size: 9, font: mono, color: ink });
    y -= 11;
  }

  // Warnings
  const warnings = computeWarnings(
    mass.totalMass_g,
    mass.cg_x_mm,
    project.aircraft,
    project.aero,
    cgRange,
  );
  if (warnings.length > 0 && y > margin + 60) {
    y -= 10;
    page.drawText('Warnings', { x: margin, y, size: 13, font: bold, color: ink });
    y -= 14;
    for (const w of warnings) {
      if (y < margin + 20) break;
      page.drawText(`[${w.level.toUpperCase()}] ${truncate(w.message, 90)}`, {
        x: margin,
        y,
        size: 9,
        font,
        color: w.level === 'danger' ? rgb(0.6, 0.2, 0.1) : ink,
      });
      y -= 11;
    }
  }

  // Footer
  page.drawText('Generated by Glidex Alpha — values are design estimates, not certified analysis.', {
    x: margin,
    y: margin / 2,
    size: 8,
    font,
    color: muted,
  });

  const bytes = await pdf.save();
  const a = await getAdapter();
  await a.saveBytes(
    bytes,
    `${project.meta.name || 'aircraft'}-report.pdf`,
    'application/pdf',
    ['pdf'],
  );
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + '…';
}
