import type { PersistenceAdapter } from './adapter';
import type { Project } from '../domain/types';
import { Project as ProjectSchema } from '../domain/types';

/** Web adapter: triggers a file download for save, and a file-input click for open. */
export const webAdapter: PersistenceAdapter = {
  isElectron: false,

  async saveProject(project: Project, suggestedName?: string) {
    const json = JSON.stringify(project, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    triggerDownload(blob, suggestedName ?? `${project.meta.name || 'aircraft'}.glidex.json`);
    return { ok: true };
  },

  async openProject() {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,.glidex.json,application/json';
      input.onchange = async () => {
        const f = input.files?.[0];
        if (!f) return resolve({ ok: false });
        try {
          const text = await f.text();
          const parsed = ProjectSchema.parse(JSON.parse(text));
          resolve({ ok: true, project: parsed });
        } catch (e) {
          resolve({ ok: false, error: e instanceof Error ? e.message : String(e) });
        }
      };
      input.click();
    });
  },

  async saveBytes(bytes, suggestedName, mime) {
    const buf = new Uint8Array(bytes);
    const blob = new Blob([buf.buffer as ArrayBuffer], { type: mime });
    triggerDownload(blob, suggestedName);
    return { ok: true };
  },
};

function triggerDownload(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
