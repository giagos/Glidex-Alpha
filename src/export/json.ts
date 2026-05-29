import type { Project } from '../domain/types';
import { getAdapter } from '../persistence/adapter';

export async function exportProjectJSON(project: Project): Promise<void> {
  const a = await getAdapter();
  const json = JSON.stringify(project, null, 2);
  const bytes = new TextEncoder().encode(json);
  await a.saveBytes(
    bytes,
    `${project.meta.name || 'aircraft'}.glidex.json`,
    'application/json',
    ['json'],
  );
}
