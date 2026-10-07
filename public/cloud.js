// Easter egg: a Clawd named « Cloud » turns into a little NES-style Cloud
// Strife with his Buster Sword. He has his own poses instead of the Clawd
// frames: idle with the sword on his back, slashes while working, a « ! »
// while waiting, the sword raised to celebrate, asleep with Zs.
import { frameIndex } from './render.js';
import { ANIMS, FRAME_W } from './sprites.js';

export const isCloud = (label) => /^cloud$/i.test(String(label ?? '').trim());

const INK = {
  K: '#17131c', // outline
  Y: '#f2d35b', // hair
  y: '#c99a2e',
  F: '#f6c9a4', // skin
  f: '#dca07c',
  E: '#17131c',
  B: '#4a4f8e', // shirt
  H: '#7a4a2a', // straps and belt
  G: '#b4b4bc', // pauldron
  g: '#76767e',
  P: '#3b3555', // trousers
  O: '#2c2326', // gloves and boots
  S: '#e4e1ea', // blade
  s: '#a9a5b8',
  R: '#c4454e', // the red near the guard
  r: '#5e2a22', // grip
  n: '#8e8e96', // guard
  W: '#ffffff',
};

// Body, 15 columns wide, feet on the last row. The right arm (rows 13-15,
// column 13) is redrawn by the poses that move it.
const HEAD = [
  '.......Y.......',
  '......YYY......',
  '..Y..YYYYY..Y..',
  '..YY.YYYYYY.YY.',
  '.YYYYYYYYYYYYY.',
  'YYYYYYYYYYYYYYY',
  '.YYYYYYYYYYYYY.',
  'YYYyFYYYYYyFYYY',
  '.YyFFFFFFFFFyY.',
  '..YFEFFFFFEFFY.',
  '..YFEFFFFFEFF..',
  '...fFFFFFFFFf..',
];
const TORSO = [
  '..GGBHBBBHBB...',
  '.GGgBBHBHBBB...',
  '.O.BBBBHBBBB...',
  '.O.HHHHHHHHH...',
];
const LEGS = {
  stand: ['...PPPPPPPPP...', '...PPPP.PPPP...', '...PPP...PPP...', '..OOOO...OOOO..'],
  walkA: ['...PPPPPPPPP...', '..PPPP...PPP...', '.PPP.....PPP...', '.OOOO.....OOOO.'],
  walkB: ['...PPPPPPPPP...', '...PPP..PPPP...', '...PPP....PPP..', '..OOOO.....OOOO'],
};
const BODY_TOP = -(HEAD.length + TORSO.length + 4); // relative to the feet row + 1
const MID = 7; // body column under the middle

// Right arm positions: skin then glove, in body coordinates.
const ARMS = {
  down: [[13, 13, 'B'], [13, 14, 'F'], [13, 15, 'O']],
  forward: [[13, 13, 'B'], [14, 13, 'F'], [15, 13, 'O']],
  up: [[13, 11, 'O'], [13, 12, 'F'], [13, 13, 'B']],
  high: [[13, 7, 'O'], [13, 8, 'F'], [13, 9, 'F'], [13, 10, 'B']],
};

class Grid {
  constructor() {
    this.px = new Map();
  }

  set(x, y, c) {
    this.px.set(`${x},${y}`, [x, y, c]);
  }

  stamp(x0, y0, rows) {
    rows.forEach((row, j) => [...row].forEach((c, i) => {
      if (c !== '.') this.set(x0 + i, y0 + j, c);
    }));
  }

  // A one-pixel dark outline around everything drawn so far.
  outline() {
    const filled = new Set(this.px.keys());
    for (const [x, y] of [...this.px.values()]) {
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const k = `${x + dx},${y + dy}`;
        if (!filled.has(k) && !this.px.has(k)) this.px.set(k, [x + dx, y + dy, 'K']);
      }
    }
  }

  cells() {
    return [...this.px.values()];
  }
}

// The Buster Sword: guard at (gx, gy), the blade going (dx, dy) for len pixels,
// a two-pixel grip the other way. Wide blade, darker back edge, a red band and
// two materia holes by the guard.
function sword(g, gx, gy, dx, dy, len = 11) {
  const [px, py] = dx && dy ? [dx, 0] : [dy ? 1 : 0, dx ? 1 : 0]; // blade width direction
  for (let t = 1; t <= len; t++) {
    const x = gx + dx * t;
    const y = gy + dy * t;
    const c = t <= 2 ? 'R' : t === 4 || t === 6 ? 's' : 'S';
    g.set(x, y, c);
    g.set(x + px, y + py, t === len ? 'S' : 's');
    if (t < len) g.set(x - px, y - py, 'S');
  }
  g.set(gx, gy, 'n');
  g.set(gx + px, gy + py, 'n');
  g.set(gx - px, gy - py, 'n');
  g.set(gx + 2 * px, gy + 2 * py, 'n');
  g.set(gx - 2 * px, gy - 2 * py, 'n');
  g.set(gx - dx, gy - dy, 'r');
  g.set(gx - 2 * dx, gy - 2 * dy, 'r');
}

// One pose as a list of [x, y, ink] cells, x from the body's middle, y from the
// feet (0 = the row under them, so everything is negative).
function pose({ legs = 'stand', arm = 'down', blade = 'back', eyes = 'open', bob = 0, extra }) {
  const g = new Grid();
  const top = BODY_TOP + bob;
  const at = (x, y, c) => g.set(x - MID, top + y, c);
  // Behind the body: the sword on his back, grip over the right shoulder.
  if (blade === 'back') swordAt(g, top, 15, 6, -1, 1, 14);
  g.stamp(-MID, top, HEAD);
  g.stamp(-MID, top + HEAD.length, TORSO);
  g.stamp(-MID, top + HEAD.length + TORSO.length, LEGS[legs]);
  for (const [x, y, c] of ARMS[arm]) at(x, y, c);
  if (eyes === 'closed') {
    for (const x of [4, 10]) {
      at(x, 9, 'F');
      at(x, 10, 'E');
    }
  }
  if (blade === 'ready') swordAt(g, top, 14, 14, 1, -1, 10);
  if (blade === 'up') swordAt(g, top, 13, 10, 0, -1, 12);
  if (blade === 'forward') swordAt(g, top, 16, 13, 1, 0, 12);
  if (blade === 'low') swordAt(g, top, 15, 15, 1, 1, 4);
  if (blade === 'raised') swordAt(g, top, 13, 6, 0, -1, 12);
  g.outline();
  extra?.(g, top);
  return g.cells();
}

function swordAt(g, top, x, y, dx, dy, len) {
  sword(g, x - MID, top + y, dx, dy, len);
}

// Little pixel signs over his head, drawn after the outline.
const BANG = ['.KKK.', 'KWRWK', 'KWRWK', 'KWRWK', 'KWWWK', 'KWRWK', '.KKK.'];
const ZED = ['KKK', '..K', '.K.', 'KKK'];
const STREAK = ['....W', '...W.', '..W..', 'WW...'];

function sign(rows, dx, dy) {
  return (g, top) => g.stamp(dx, top + dy, rows);
}

const POSES = {
  idle: [pose({}), pose({ bob: 1 })],
  walk: [pose({ legs: 'walkA' }), pose({ bob: -1 }), pose({ legs: 'walkB' }), pose({ bob: -1 })],
  slash: [
    pose({ arm: 'up', blade: 'up' }),
    pose({ arm: 'forward', blade: 'forward', legs: 'walkB', extra: sign(STREAK, 9, 6) }),
    pose({ arm: 'down', blade: 'low', legs: 'walkB' }),
    pose({ arm: 'down', blade: 'low' }),
  ],
  wait: [
    pose({ blade: 'ready', extra: sign(BANG, -2, -9) }),
    pose({ blade: 'ready', bob: 1 }),
  ],
  victory: [
    pose({ arm: 'high', blade: 'raised' }),
    pose({ arm: 'high', blade: 'raised', bob: -1, extra: sign(['W.W', '.W.', 'W.W'], 4, 0) }),
  ],
  sleep: [
    pose({ eyes: 'closed', extra: sign(ZED, 6, -2) }),
    pose({ eyes: 'closed', bob: 1, extra: sign(ZED, 8, -5) }),
  ],
  hurt: [pose({ eyes: 'closed', blade: 'low' })],
};
const FPS = { idle: 2, walk: 8, slash: 8, wait: 2, victory: 4, sleep: 1, hurt: 1 };

const WORK = new Set(['type-front', 'type-laptop', 'type-side', 'search', 'read', 'globe', 'think', 'compact', 'sword-strike']);
const VICTORY = new Set(['celebrate', 'tests-green', 'cheer', 'sword-win', 'high-five', 'jump', 'dance', 'duo-dance', 'commit']);
const HURT = new Set(['oops', 'tests-red', 'sword-lose']);
const READY = new Set(['flag', 'sword-guard', 'sword-block']);

function poseOf(anim) {
  if (anim === 'walk') return 'walk';
  if (anim === 'sleep') return 'sleep';
  if (anim === 'flag') return 'wait';
  if (WORK.has(anim)) return 'slash';
  if (VICTORY.has(anim)) return 'victory';
  if (HURT.has(anim)) return 'hurt';
  if (READY.has(anim)) return 'wait';
  return 'idle';
}

// Draws Cloud for a Clawd playing `anim` since `ms`; (x, y) is the middle of
// the feet, flip turns him to the left. The arrival and departure puffs of the
// Clawd frame are kept around him.
export function drawCloud(ctx, anim, ms, x, y, scale, flip) {
  const name = poseOf(anim);
  const a = ANIMS[anim];
  if (a && (anim === 'arrive' || anim === 'leave')) {
    const frame = a.frames[frameIndex(a, ms)];
    const left = x - 15.5 * scale;
    for (const [px, py, c] of frame) {
      if (c !== 'L' && c !== 'W' && c !== 'Y') continue;
      ctx.fillStyle = INK[c === 'L' ? 'S' : c] ?? '#fff';
      ctx.fillRect(left + (flip ? FRAME_W - 1 - px : px) * scale, y + (py - 23) * scale, scale, scale);
    }
    if (!frame.some(([, , c]) => c === 'C')) return;
  }
  const frames = POSES[name];
  // rAF timestamps can predate the start of the animation.
  const cells = frames[Math.floor((Math.max(0, ms) * FPS[name]) / 1000) % frames.length];
  for (const [cx, cy, c] of cells) {
    ctx.fillStyle = INK[c];
    ctx.fillRect(Math.round(x + ((flip ? -cx : cx) - 0.5) * scale), y + cy * scale, scale, scale);
  }
}
