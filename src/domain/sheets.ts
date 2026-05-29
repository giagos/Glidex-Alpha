import type { Sheet, SheetPart } from './types';

/**
 * First-Fit Decreasing bin packing onto a sheet using axis-aligned bounding
 * boxes of each part. Very simple — not optimal, but deterministic.
 *
 * Returns a new array of parts with x/y positions updated. Parts that don't
 * fit are placed at (-9999, -9999) so the user can see them in an "overflow"
 * region.
 */
export function autoArrange(sheet: Sheet, gap_mm = 4): SheetPart[] {
  const parts = [...sheet.parts];
  parts.sort((a, b) => bboxArea(b) - bboxArea(a));

  // Skyline-like simple shelf algorithm
  let shelfY = gap_mm;
  let shelfH = 0;
  let cursorX = gap_mm;

  const placed: SheetPart[] = [];
  for (const p of parts) {
    const [bw, bh] = bbox(p);
    if (cursorX + bw + gap_mm > sheet.width_mm) {
      shelfY += shelfH + gap_mm;
      shelfH = 0;
      cursorX = gap_mm;
    }
    if (shelfY + bh + gap_mm > sheet.height_mm) {
      placed.push({ ...p, x_mm: -9999, y_mm: -9999 });
      continue;
    }
    placed.push({ ...p, x_mm: cursorX, y_mm: shelfY });
    cursorX += bw + gap_mm;
    if (bh > shelfH) shelfH = bh;
  }
  return placed;
}

function bbox(p: SheetPart): [number, number] {
  if (p.polygon.length === 0) return [0, 0];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of p.polygon) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return [maxX - minX, maxY - minY];
}

function bboxArea(p: SheetPart): number {
  const [w, h] = bbox(p);
  return w * h;
}
