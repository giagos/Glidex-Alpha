import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';

const isDev = !!process.env.VITE_DEV_SERVER_URL;

async function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#F2EBDC',
    title: 'Glidex Alpha',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    await win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    await win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

ipcMain.handle('project:save', async (_evt, json: string, suggestedName?: string) => {
  const result = await dialog.showSaveDialog({
    title: 'Save Glidex project',
    defaultPath: suggestedName ?? 'aircraft.glidex.json',
    filters: [{ name: 'Glidex Project', extensions: ['glidex.json', 'json'] }],
  });
  if (result.canceled || !result.filePath) return { ok: false as const };
  await fs.writeFile(result.filePath, json, 'utf8');
  return { ok: true as const, path: result.filePath };
});

ipcMain.handle('project:open', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Open Glidex project',
    properties: ['openFile'],
    filters: [{ name: 'Glidex Project', extensions: ['glidex.json', 'json'] }],
  });
  if (result.canceled || result.filePaths.length === 0) return { ok: false as const };
  const text = await fs.readFile(result.filePaths[0], 'utf8');
  return { ok: true as const, path: result.filePaths[0], json: text };
});

ipcMain.handle(
  'file:saveBytes',
  async (
    _evt,
    bytes: Uint8Array,
    suggestedName: string,
    filters: { name: string; extensions: string[] }[],
  ) => {
    const result = await dialog.showSaveDialog({
      title: 'Export',
      defaultPath: suggestedName,
      filters,
    });
    if (result.canceled || !result.filePath) return { ok: false as const };
    await fs.writeFile(result.filePath, Buffer.from(bytes));
    return { ok: true as const, path: result.filePath };
  },
);

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
