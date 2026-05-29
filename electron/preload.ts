import { contextBridge, ipcRenderer } from 'electron';

const api = {
  isElectron: true as const,
  saveProject: (json: string, suggestedName?: string) =>
    ipcRenderer.invoke('project:save', json, suggestedName) as Promise<
      { ok: true; path: string } | { ok: false }
    >,
  openProject: () =>
    ipcRenderer.invoke('project:open') as Promise<
      { ok: true; path: string; json: string } | { ok: false }
    >,
  saveBytes: (
    bytes: Uint8Array,
    suggestedName: string,
    filters: { name: string; extensions: string[] }[],
  ) =>
    ipcRenderer.invoke('file:saveBytes', bytes, suggestedName, filters) as Promise<
      { ok: true; path: string } | { ok: false }
    >,
};

contextBridge.exposeInMainWorld('glidex', api);

export type GlidexApi = typeof api;
