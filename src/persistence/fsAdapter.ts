import type { PersistenceAdapter } from './adapter';
import type { Project } from '../domain/types';
import { Project as ProjectSchema } from '../domain/types';

export const fsAdapter: PersistenceAdapter = {
  isElectron: true,

  async saveProject(project: Project, suggestedName?: string) {
    const api = window.glidex!;
    const res = await api.saveProject(
      JSON.stringify(project, null, 2),
      suggestedName ?? `${project.meta.name || 'aircraft'}.glidex.json`,
    );
    if (!res.ok) return { ok: false };
    return { ok: true, path: res.path };
  },

  async openProject() {
    const api = window.glidex!;
    const res = await api.openProject();
    if (!res.ok) return { ok: false };
    try {
      const parsed = ProjectSchema.parse(JSON.parse(res.json));
      return { ok: true, project: parsed, path: res.path };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  },

  async saveBytes(bytes, suggestedName, _mime, extensions) {
    const api = window.glidex!;
    const res = await api.saveBytes(bytes, suggestedName, [
      { name: extensions[0].toUpperCase(), extensions },
    ]);
    return res.ok ? { ok: true } : { ok: false };
  },
};
