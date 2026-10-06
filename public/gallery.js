import { ANIMS, FRAME_H, FRAME_W, GROUPS } from './sprites.js';
import { PALETTES, drawFrame, fitCanvas } from './render.js';

const MAIN = 5;
const SUB = 4;
const GAP = 12;
const PAD = 8;
const PAUSE_FRAMES = 6; // one-shot animations hold their last frame, then replay

export function createGallery(root) {
  const cards = [];

  for (const group of GROUPS) {
    const section = document.createElement('section');
    section.className = 'group';
    section.innerHTML = `<h2>${group.label}</h2><p class="hint">${group.hint}</p>`;
    const grid = document.createElement('div');
    grid.className = 'cards';

    for (const [name, trigger] of group.items) {
      const anim = ANIMS[name];
      const card = document.createElement('article');
      card.className = 'card';
      const canvas = document.createElement('canvas');
      const width = FRAME_W * (MAIN + SUB) + GAP + PAD * 2;
      const height = FRAME_H * MAIN + PAD;
      const ctx = fitCanvas(canvas, width, height);
      card.append(canvas);
      card.insertAdjacentHTML(
        'beforeend',
        `<h3>${anim.label}</h3><p>${trigger}</p>` +
          `<p class="meta">${anim.frames.length} images · ${anim.fps} i/s${anim.loop ? '' : ' · une fois'}</p>`,
      );
      grid.append(card);
      cards.push({ anim, ctx, width, height });
    }

    section.append(grid);
    root.append(section);
  }

  let raf = 0;
  const t0 = performance.now();

  function tick(now) {
    for (const { anim, ctx, width, height } of cards) {
      const n = anim.frames.length;
      // The first frame's timestamp can precede t0.
      const i = Math.max(0, Math.floor(((now - t0) * anim.fps) / 1000));
      const frame = anim.frames[anim.loop ? i % n : Math.min(i % (n + PAUSE_FRAMES), n - 1)];
      const ground = height - PAD / 2;
      ctx.clearRect(0, 0, width, height);
      drawFrame(ctx, frame, PAD, ground - FRAME_H * MAIN, MAIN, PALETTES.main);
      drawFrame(ctx, frame, PAD + FRAME_W * MAIN + GAP, ground - FRAME_H * SUB, SUB, PALETTES.sub);
    }
    raf = requestAnimationFrame(tick);
  }

  return {
    show() {
      root.hidden = false;
      if (!raf) raf = requestAnimationFrame(tick);
    },
    hide() {
      root.hidden = true;
      cancelAnimationFrame(raf);
      raf = 0;
    },
  };
}
