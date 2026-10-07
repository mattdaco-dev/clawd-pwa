import { FRAME_W } from './sprites.js';

export const BODY = '#d77757';

const INKS = {
  E: '#1d1d1b',
  K: '#2a2725',
  W: '#ffffff',
  G: '#8f8b82',
  L: '#c9c5b9',
  R: '#e5484d',
  B: '#3b6fd8',
  N: '#2f4a8a',
  H: '#9a6b3f',
  Y: '#f2c14e',
  S: '#bfe0ff',
  // Office furniture
  O: '#d1a06a',
  D: '#8a5d3b',
  A: '#b8b3a7',
  P: '#6aa863',
  Q: '#3f7a44',
  // Upholstery and pots, light and dark tone of each fabric
  I: '#5b7bb0',
  T: '#c8664a',
  U: '#8f4632',
  M: '#d9a441',
  V: '#a07425',
  F: '#8fae8b',
  J: '#5c7a59',
  X: '#d9a0a0',
  Z: '#a56b6b',
  // Sword blade, a warm cream like Kirby's
  w: '#f6ecd2',
  // Pumpkins
  o: '#e98a2f',
  n: '#b5611d',
  // Halloween purple, Christmas greenery
  v: '#6e4a9e',
  g: '#2f6b3a',
  // Easter pastels, and the light blue of the Luxembourg flag
  q: '#f4b6c8',
  y: '#f6e08a',
  b: '#a9cdee',
  l: '#b5dfa6',
  c: '#00a1de',
};

function lighten(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c) => Math.round(c + (255 - c) * amount);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map(mix);
  return `rgb(${r}, ${g}, ${b})`;
}

export const PALETTES = {
  main: { ...INKS, C: BODY },
  sub: { ...INKS, C: lighten(BODY, 0.38) },
};

export function drawFrame(ctx, frame, x, y, scale, palette, flip = false) {
  for (const [px, py, c] of frame) {
    ctx.fillStyle = palette[c];
    const fx = flip ? FRAME_W - 1 - px : px;
    ctx.fillRect(x + fx * scale, y + py * scale, scale, scale);
  }
}

export function frameIndex(anim, ms) {
  // rAF timestamps can predate a performance.now() taken in the same frame.
  const i = Math.max(0, Math.floor((ms * anim.fps) / 1000));
  return anim.loop ? i % anim.frames.length : Math.min(i, anim.frames.length - 1);
}

export function cycleDone(anim, ms, cycles = 1) {
  return (ms * anim.fps) / 1000 >= anim.frames.length * cycles;
}

// Sizes a canvas to its CSS box at device resolution and returns its context.
export function fitCanvas(canvas, width, height) {
  const dpr = window.devicePixelRatio || 1;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  return ctx;
}
