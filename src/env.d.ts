/// <reference types="vite/client" />

interface GlidexApi {
  isElectron: true;
  saveProject: (
    json: string,
    suggestedName?: string,
  ) => Promise<{ ok: true; path: string } | { ok: false }>;
  openProject: () => Promise<
    { ok: true; path: string; json: string } | { ok: false }
  >;
  saveBytes: (
    bytes: Uint8Array,
    suggestedName: string,
    filters: { name: string; extensions: string[] }[],
  ) => Promise<{ ok: true; path: string } | { ok: false }>;
}

declare global {
  interface Window {
    glidex?: GlidexApi;
  }
}

export {};
