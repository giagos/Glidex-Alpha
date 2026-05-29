import type { Project } from '../domain/types';

/** Common interface for project persistence; backed by either FS or IndexedDB. */
export interface PersistenceAdapter {
  isElectron: boolean;
  saveProject(project: Project, suggestedName?: string): Promise<{ ok: true; path?: string } | { ok: false }>;
  openProject(): Promise<{ ok: true; project: Project; path?: string } | { ok: false; error?: string }>;
  saveBytes(bytes: Uint8Array, suggestedName: string, mime: string, extensions: string[]): Promise<{ ok: true } | { ok: false }>;
}

export async function getAdapter(): Promise<PersistenceAdapter> {
  if (typeof window !== 'undefined' && window.glidex?.isElectron) {
    const m = await import('./fsAdapter');
    return m.fsAdapter;
  }
  const m = await import('./webAdapter');
  return m.webAdapter;
}
