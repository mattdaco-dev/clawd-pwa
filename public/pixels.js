// Pixel sprites for the decors: a grid of palette keys ('.' is empty), drawn
// with the Clawd palette.
import { PALETTES } from './render.js';

export const INK = PALETTES.main;

export function sprite(rows) {
  const cells = [];
  rows.forEach((row, y) => [...row].forEach((c, x) => {
    if (c !== '.') cells.push([x, y, c]);
  }));
  return { cells, w: rows[0].length, h: rows.length };
}

export function drawSprite(ctx, s, left, top, p) {
  left = Math.round(left);
  top = Math.round(top);
  for (const [x, y, c] of s.cells) {
    ctx.fillStyle = INK[c];
    ctx.fillRect(left + x * p, top + y * p, p, p);
  }
}
