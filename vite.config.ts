import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';
import path from 'node:path';

const isElectron = process.env.ELECTRON === '1';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [
    react(),
    ...(isElectron
      ? [
          electron({
            main: {
              entry: 'electron/main.ts',
            },
            preload: {
              input: path.join(__dirname, 'electron/preload.ts'),
            },
            renderer: {},
          }),
        ]
      : []),
  ],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
