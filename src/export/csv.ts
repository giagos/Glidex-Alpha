import type { Project } from '../domain/types';
import { resolveAll } from '../domain/mass';
import { getAdapter } from '../persistence/adapter';

export async function exportMassCSV(project: Project): Promise<void> {
  const resolved = resolveAll(project.components, project.materials, project.parts);
  const rows: string[][] = [
    ['id', 'name', 'kind', 'mass_g', 'x_mm', 'y_mm', 'z_mm', 'visible', 'derivation'],
  ];
  for (const r of resolved) {
    const c = r.component;
    rows.push([
      c.id,
      c.name,
      c.kind,
      r.mass_g.toFixed(3),
      c.x_mm.toFixed(2),
      c.y_mm.toFixed(2),
      c.z_mm.toFixed(2),
      c.visible ? 'yes' : 'no',
      r.derivation,
    ]);
  }
  const csv = rows.map((r) => r.map(csvEscape).join(',')).join('\n');
  const a = await getAdapter();
  await a.saveBytes(
    new TextEncoder().encode(csv),
    `${project.meta.name || 'aircraft'}-mass.csv`,
    'text/csv',
    ['csv'],
  );
}

function csvEscape(v: string): string {
  if (v.includes('"') || v.includes(',') || v.includes('\n')) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}
