import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { resolve } from 'path';

const outDir = resolve('docs/screenshots');
mkdirSync(outDir, { recursive: true });

const tabs = [
  ['Workbench', 'workbench'],
  ['Geometry', 'geometry'],
  ['Materials', 'materials'],
  ['Parts', 'parts'],
  ['Components', 'components'],
  ['Aero', 'aero'],
  ['Balance', 'balance'],
  ['Foam sheets', 'sheets'],
  ['Report', 'report'],
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);

for (const [label, file] of tabs) {
  try {
    await page.getByRole('button', { name: label, exact: true }).first().click();
  } catch (e) {
    console.warn('No tab', label, e.message);
  }
  await page.waitForTimeout(500);
  const path = `${outDir}/${file}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log('Saved', path);
}

await browser.close();
