// Clawd sprite catalog.
// Every frame is composed on a FRAME_W x FRAME_H grid of palette keys, so the
// same catalog renders the main agent and the lighter subagents. Keys:
// C body, E eyes, K ink, W white, G gray, L puff, R red, B blue, N navy,
// H brown, Y yellow, S glass, w sword blade.

export const FRAME_W = 32;
export const FRAME_H = 24;

// Top-left of the 19x10 front-facing Clawd; its feet rest on row OY + 9.
const OX = 6;
const OY = 13;

class Frame {
  constructor() {
    this.px = new Map();
  }

  set(x, y, c) {
    if (x < 0 || x >= FRAME_W || y < 0 || y >= FRAME_H) return;
    this.px.set(y * FRAME_W + x, c);
  }

  bake() {
    return [...this.px].map(([k, c]) => [k % FRAME_W, Math.floor(k / FRAME_W), c]);
  }
}

// Pen drawing relative to Clawd's origin, shifted by (dx, dy).
const pen = (f, dx = 0, dy = 0) => (x, y, c = 'C') => f.set(OX + dx + x, OY + dy + y, c);

function stamp(p, x, y, rows) {
  rows.forEach((row, j) => [...row].forEach((c, i) => {
    if (c !== '.') p(x + i, y + j, c);
  }));
}

function disc(p, cx, cy, r, c) {
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y <= r * r + r) p(cx + x, cy + y, c);
    }
  }
}

const frames = (n, draw) => Array.from({ length: n }, (_, i) => {
  const f = new Frame();
  draw(f, i);
  return f.bake();
});

// ---------------------------------------------------------------- front view

// Left arm positions; the right arm mirrors them (x -> 18 - x).
const ARMS = {
  out: [[1, 4], [2, 4], [1, 5], [2, 5]],
  lift: [[1, 3], [2, 3], [1, 4], [2, 4]],
  press: [[1, 5], [2, 5], [1, 6], [2, 6]],
  mid: [[1, 2], [2, 2], [1, 3], [2, 3]],
  high: [[1, -2], [2, -2], [1, -1], [2, -1], [2, 0]],
  low: [[1, 6], [2, 6], [1, 7], [2, 7]],
  none: [],
};

const HIPS = [[3, 8], [5, 8], [13, 8], [15, 8]];
const LEGS = {
  stand: [...HIPS, [3, 9], [5, 9], [13, 9], [15, 9]],
  walkA: [...HIPS, [13, 9], [15, 9]],
  walkB: [...HIPS, [3, 9], [5, 9]],
  tapL: [...HIPS, [5, 9], [13, 9], [15, 9]],
  tapR: [...HIPS, [3, 9], [5, 9], [13, 9]],
  tuck: HIPS,
  sit: [],
};

const EYES = {
  open: [[6, 2], [6, 3], [12, 2], [12, 3]],
  left: [[5, 2], [5, 3], [11, 2], [11, 3]],
  right: [[7, 2], [7, 3], [13, 2], [13, 3]],
  up: [[6, 1], [6, 2], [12, 1], [12, 2]],
  down: [[6, 3], [6, 4], [12, 3], [12, 4]],
  wide: [[6, 1], [6, 2], [6, 3], [12, 1], [12, 2], [12, 3]],
  closed: [[5, 3], [6, 3], [7, 3], [11, 3], [12, 3], [13, 3]],
  happy: [[5, 3], [6, 2], [7, 3], [11, 3], [12, 2], [13, 3]],
};

function arms(p, left, right) {
  for (const [x, y] of ARMS[left]) p(x, y);
  for (const [x, y] of ARMS[right]) p(18 - x, y);
}

function clawd(f, { dx = 0, dy = 0, eyes = 'open', left = 'out', right = 'out', legs = 'stand' } = {}) {
  const p = pen(f, dx, dy);
  for (let y = 0; y < 8; y++) for (let x = 3; x <= 15; x++) p(x, y);
  arms(p, left, right);
  for (const [x, y] of LEGS[legs]) p(x, y);
  for (const [x, y] of EYES[eyes]) p(x, y, 'E');
  return p;
}

// ----------------------------------------------------------------- side view

const SIDE = {
  arm: {
    lift: [[10, 5], [11, 5], [10, 6], [11, 6]],
    press: [[10, 7], [11, 7], [10, 8], [11, 8]],
    // At a desk: the keyboard sits on row 5, level with the hand.
    deskLift: [[10, 3], [11, 3], [10, 4], [11, 4]],
    deskPress: [[10, 4], [11, 4], [10, 5], [11, 5]],
  },
  eye: {
    open: [[7, 2], [7, 3]],
    down: [[7, 3], [7, 4]],
    closed: [[6, 3], [7, 3]],
  },
  legs: [[1, 8], [3, 8], [6, 8], [8, 8], [1, 9], [3, 9], [6, 9], [8, 9]],
};

// Profile facing right, 10 columns wide.
function sideClawd(f, { eye = 'open', arm = 'lift' } = {}) {
  const p = pen(f, 3);
  for (let y = 0; y < 8; y++) for (let x = 0; x <= 9; x++) p(x, y);
  for (const [x, y] of SIDE.arm[arm]) p(x, y);
  for (const [x, y] of SIDE.legs) p(x, y);
  for (const [x, y] of SIDE.eye[eye]) p(x, y, 'E');
  return p;
}

// --------------------------------------------------------------- accessories

// Kirby-style sword held at (x, y), pointing along one of the eight directions
// (dx, dy): brown grip and guard, then a cream blade outlined in dark brown.
// Six cells long so it stays inside the frame when held in front.
function sword(p, x, y, dx, dy) {
  const at = (k) => [x + dx * k, y + dy * k];
  const [px, py] = dx && dy ? [-dy, dx].map(Math.sign) : [-dy, dx];
  p(...at(0), 'H');
  const [gx, gy] = at(1);
  p(gx, gy, 'D');
  p(gx + px, gy + py, 'D');
  p(gx - px, gy - py, 'D');
  // Diagonal blades get a second column so they read as solid, not as a ladder.
  const blade = [2, 3, 4, 5].flatMap((k) => {
    const [bx, by] = at(k);
    return dx && dy ? [[bx, by], [bx + dx, by]] : [[bx, by]];
  });
  const onBlade = (cx, cy) => blade.some(([bx, by]) => bx === cx && by === cy);
  for (const [bx, by] of blade) {
    for (const [nx, ny] of [[bx + 1, by], [bx - 1, by], [bx, by + 1], [bx, by - 1]]) {
      if (!onBlade(nx, ny) && !(nx === gx && ny === gy)) p(nx, ny, 'D');
    }
  }
  for (const [bx, by] of blade) p(bx, by, 'w');
  p(...at(6), 'D');
}

// Where the sword is held, by right arm position (relative to Clawd).
const GRIP = { mid: [18, 2], out: [18, 4], high: [17, -3] };

function keyboard(p, flash) {
  for (let x = 2; x <= 16; x++) {
    p(x, 6, x % 2 ? 'L' : 'K');
    p(x, 7, 'K');
  }
  p(flash, 6, 'W');
}

function laptop(p, flash, glow) {
  for (let x = 11; x <= 17; x++) p(x, 9, 'G');
  for (const [x, y] of [[18, 9], [18, 8], [19, 7], [19, 6], [20, 5], [20, 4], [21, 3]]) p(x, y, 'G');
  if (flash) p(12, 9, 'W');
  if (glow) {
    p(18, 7, 'S');
    p(19, 5, 'S');
  }
}

function flag(p, t) {
  for (let y = -9; y <= 1; y++) p(18, y, 'K');
  for (let i = 0; i < 5; i++) {
    const wave = (i + t) % 4 < 2 ? 0 : 1;
    for (let j = 0; j < 4; j++) p(13 + i, -9 + wave + j, (i + j) % 2 ? 'K' : 'W');
  }
}

const BUBBLE = ['..RRR..', '.RRWRR.', 'RRRWRRR', 'RRRWRRR', 'RRRRRRR', '.RRWRR.', '..RRR..'];

function headphones(p) {
  for (let x = 5; x <= 13; x++) p(x, -2, 'N');
  for (const [x, y] of [[4, -1], [14, -1], [3, 0], [15, 0]]) p(x, y, 'N');
  for (let y = 1; y <= 3; y++) for (const x of [2, 3, 15, 16]) p(x, y, 'N');
}

const NOTE = ['.KK', '.K.', 'KK.', 'KK.'];

// Blue mug, top-left at (x, y), 3x3 with the handle on the outer side; steam
// curls up from it on even frames t when hot.
function mug(p, x, y, t = null) {
  stamp(p, x, y, ['BBB.', 'BBBB', 'BBB.']);
  if (t === null) return;
  p(x + (t % 2), y - 2, 'L');
  p(x + 1 + ((t + 1) % 2), y - 3, 'L');
  if (t % 4 < 2) p(x + 2, y - 4, 'L');
}

// A red cross in a speech bubble: something went wrong.
const OOPS = ['.KKKKK.', 'KWWWWWK', 'KWRWRWK', 'KWWRWWK', 'KWRWRWK', 'KWWWWWK', '.KKKKK.'];
// A green tick in a speech bubble: the tests pass.
const TICK = ['.KKKKK.', 'KWWWWWK', 'KWWWWPK', 'KWWWPWK', 'KPWPWWK', 'KWPWWWK', '.KKKKK.'];
// A rain cloud, its drops drawn apart: the tests fail.
const CLOUD = ['..LLL...', '.LLLLLL.', 'LLLLLLLL', '.GGGGGG.'];
// A parcel sealed with tape: the work is committed.
const PARCEL = ['HHHYHHH', 'HHHYHHH', 'YYYYYYY', 'HHHYHHH', 'HHHYHHH'];
// Desk shredder standing on the floor, its slot on the top row.
const SHREDDER = ['KKKKKKK', 'KGKKKGK', 'KGGGGGK', 'KGGRGGK', 'KGGGGGK', 'KKKKKKK'];
const STACK = ['WWWW', 'LLLL', 'WWWW', 'LLLL'];

function hat(p) {
  for (let x = 1; x <= 17; x++) p(x, -1, 'K');
  for (let y = -4; y <= -2; y++) for (let x = 5; x <= 13; x++) p(x, y, y === -2 ? 'H' : 'K');
}

const LENS = ['.BBB.', 'BSSSB', 'BSSSB', 'BSSSB', '.BBB.'];

function magnifier(p, x, y) {
  stamp(p, x, y, LENS);
  p(x - 1, y + 5, 'H');
  p(x - 2, y + 6, 'H');
}

// Terrestrial globe on a stand, at the Clawd's right. The map scrolls one
// column per frame inside the round mask, so the globe turns.
const GLOBE_MASK = ['..XXX..', '.XXXXX.', 'XXXXXXX', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..'];
const WORLD = [
  '..PP....P.....',
  '.PPPP..PPP....',
  '..PPP...PPPP..',
  '...P.....PP...',
  '....PP....P...',
  '....PPP.......',
  '.....P........',
];

function globe(p, t) {
  GLOBE_MASK.forEach((row, j) => [...row].forEach((c, i) => {
    if (c === '.') return;
    const land = WORLD[j][(i + t) % WORLD[j].length] === 'P';
    p(17 + i, -1 + j, land ? 'P' : 'B');
  }));
  for (const [x, y] of [[23, -2], [24, -1], [25, 0], [25, 1], [25, 2], [25, 3], [24, 4], [23, 5]]) p(x, y, 'H');
  for (let y = 6; y <= 8; y++) p(20, y, 'H');
  for (let x = 18; x <= 22; x++) p(x, 9, 'H');
}

const Z = ['KKKK', '..K.', '.K..', 'KKKK'];
const BALL = ['.RR.', 'RWRR', 'RRRR', '.RR.'];
const PAPER = ['LLLL', 'LWWL', 'LGGL', 'LWWL', 'LGGL', 'LLLL'];
// Top row of the ball held by « pass-throw » at each frame, relative to Clawd;
// null once thrown. Frame 0 is the catch, frame 2 the release.
const PASS_BALL = [1, 2, -1, null, null];
// Where the scene catches and releases the ball, in frame pixels: the centre of
// the held ball when facing right (FRAME_W - x when flipped).
export const PASS = { x: OX + 18, catchY: OY + PASS_BALL[0] + 2, releaseY: OY + PASS_BALL[2] + 2, releaseFrame: 3 };
export { BALL };
const RING = [[-2, 1], [0, -3], [9, -4], [17, -3], [20, 2], [20, 8], [-2, 8], [4, -4], [14, -4]];
const SPARKLES = [[-1, -1], [19, -1], [0, 9], [18, 8], [9, -3]];
const CONFETTI = [
  [2, -6, 'Y'], [6, -9, 'R'], [10, -7, 'B'], [14, -10, 'Y'], [17, -5, 'R'],
  [0, -3, 'B'], [19, -8, 'Y'], [8, -11, 'R'], [12, -4, 'N'],
];

// ---------------------------------------------------------------- animations

// Building site tools.
const BRICK = ['TTTT', 'UUUU'];
const STOP_SIGN = ['.RRRRR.', 'RRRRRRR', 'RWWWWWR', 'RRRRRRR', '.RRRRR.'];

export const ANIMS = {
  // Building site: laying bricks with a trowel, a brick ready in the other hand.
  trowel: {
    label: 'Maçonne à la truelle',
    fps: 5,
    loop: true,
    frames: frames(6, (f, i) => {
      const down = i % 2 === 1;
      const p = clawd(f, { eyes: i === 5 ? 'closed' : 'down', left: 'mid', right: down ? 'press' : 'mid' });
      stamp(p, -4, 1, BRICK);
      if (down) {
        stamp(p, 18, 5, ['H..', 'GGG']);
        p(20, 7, 'A');
        p(21, 7, 'A');
      } else {
        stamp(p, 18, 0, ['.G', 'GG', 'GH', '.H']);
      }
    }),
  },
  // Building site: driving nails, sparks on every blow.
  hammer: {
    label: 'Cloue au marteau',
    fps: 6,
    loop: true,
    frames: frames(6, (f, i) => {
      const hit = i % 3 === 2;
      const up = i % 3 === 0;
      const p = clawd(f, { eyes: hit ? 'closed' : 'down', left: 'press', right: up ? 'high' : hit ? 'press' : 'mid' });
      if (up) stamp(p, 16, -5, ['GGGG', '..H.', '..H.']);
      else if (hit) {
        stamp(p, 18, 4, ['H.', 'H.', 'GG', 'GG']);
        for (const [x, y] of [[21, 6], [17, 8], [21, 9]]) p(x, y, 'Y');
      } else stamp(p, 18, 0, ['GGG', '.H.', '.H.']);
    }),
  },
  // Building site: spreading the screed for the floor, a shovelful at a time.
  shovel: {
    label: 'Étale à la pelle',
    fps: 5,
    loop: true,
    frames: frames(6, (f, i) => {
      const phase = i % 3;
      const p = clawd(f, { eyes: phase === 2 ? 'happy' : 'down', left: phase === 0 ? 'press' : 'mid', right: phase === 0 ? 'press' : phase === 1 ? 'mid' : 'lift' });
      // The handle runs from the hands down to the blade, then the blade and its load.
      const [hx, hy, bx, by] = [[17, 4, 20, 8], [17, 2, 20, 5], [17, 1, 20, 2]][phase];
      for (let k = 0; k <= 3; k++) p(hx + k, hy + Math.round(((by - hy) * k) / 3), 'H');
      stamp(p, bx, by, ['GG', 'GG']);
      if (phase === 1) stamp(p, bx - 1, by - 1, ['OOO']);
      if (phase === 2) for (const [x, y] of [[23, -1], [24, 1], [22, -3]]) p(x, y, 'O');
      if (phase === 0) for (const [x, y] of [[22, 9], [23, 9], [19, 9]]) p(x, y, 'O');
    }),
  },
  // Building site, waiting for an answer: a STOP sign waved overhead.
  stop: {
    label: 'Panneau STOP',
    fps: 5,
    loop: true,
    frames: frames(6, (f, i) => {
      const dy = i % 3 === 1 ? -1 : 0;
      const p = clawd(f, { dy, eyes: i % 3 === 2 ? 'happy' : 'open', left: 'high', right: 'out', legs: dy ? 'tuck' : 'stand' });
      for (let y = -6; y < 3; y++) p(1, y, 'K');
      stamp(p, -2 + (i % 3 === 0 ? -1 : 0), -11, STOP_SIGN);
    }),
  },
  // Working
  'type-front': {
    label: 'Tape au clavier',
    fps: 8,
    loop: true,
    frames: frames(8, (f, i) => {
      const leftPress = i % 2 === 0;
      const p = clawd(f, { eyes: i === 7 ? 'closed' : 'down', left: 'none', right: 'none' });
      keyboard(p, leftPress ? 4 : 14);
      arms(p, leftPress ? 'press' : 'lift', leftPress ? 'lift' : 'press');
    }),
  },
  'type-laptop': {
    label: 'Tape sur le laptop',
    fps: 8,
    loop: true,
    frames: frames(8, (f, i) => {
      const press = i % 2 === 0;
      const p = sideClawd(f, { arm: press ? 'press' : 'lift', eye: i === 7 ? 'closed' : 'down' });
      laptop(p, press, i % 4 < 2);
    }),
  },
  'type-side': {
    label: 'Tape au bureau, de profil',
    fps: 8,
    loop: true,
    frames: frames(8, (f, i) => {
      sideClawd(f, { arm: i % 2 ? 'deskLift' : 'deskPress', eye: i === 7 ? 'closed' : 'open' });
    }),
  },
  search: {
    label: 'Enquête',
    fps: 4,
    loop: true,
    frames: frames(8, (f, i) => {
      const p = clawd(f, { eyes: i === 5 ? 'open' : 'right', right: 'low', legs: i % 2 ? 'walkA' : 'walkB' });
      hat(p);
      magnifier(p, 18, [1, 0, 1, 2][i % 4]);
    }),
  },
  // Reading at the bookshelf: an open book held low, a page turned now and then.
  read: {
    label: 'Lit un livre',
    fps: 4,
    loop: true,
    frames: frames(12, (f, i) => {
      const p = clawd(f, { eyes: i === 3 ? 'closed' : i === 10 ? 'happy' : 'down', left: 'low', right: 'low' });
      stamp(p, 3, 5, [
        'HWWWWWKWWWWWH',
        'HWGGGWKWGGGWH',
        'HWGGWWKWGGWWH',
        'HHHHHHHHHHHHH',
      ]);
      // The page turns from right to left over frames 6 to 8.
      if (i === 6) stamp(p, 10, 3, ['WWW.', '.WWW']);
      if (i === 7) stamp(p, 9, 2, ['W', 'W', 'W']);
      if (i === 8) stamp(p, 5, 3, ['.WWW', 'WWW.']);
    }),
  },
  globe: {
    label: 'Regarde le globe',
    fps: 4,
    loop: true,
    frames: frames(8, (f, i) => {
      const p = clawd(f, {
        eyes: i === 5 ? 'wide' : i === 6 ? 'up' : 'right',
        right: i % 4 < 2 ? 'mid' : 'out',
        legs: i === 3 ? 'tapR' : 'stand',
      });
      globe(p, i);
    }),
  },
  music: {
    label: 'Écoute de la musique',
    fps: 5,
    loop: true,
    frames: frames(8, (f, i) => {
      const p = clawd(f, { eyes: i % 4 < 2 ? 'closed' : 'happy', legs: i % 2 ? 'tapL' : 'tapR' });
      headphones(p);
      stamp(p, 19 + Math.floor(i / 3), -2 - i, NOTE);
      const j = (i + 4) % 8;
      stamp(p, 21 + Math.floor(j / 3), -2 - j, NOTE);
    }),
  },
  think: {
    label: 'Réfléchit',
    fps: 3,
    loop: true,
    frames: frames(8, (f, i) => {
      const p = clawd(f, { eyes: i === 6 ? 'closed' : 'up', left: 'mid' });
      const dots = [0, 1, 2, 3, 3, 3, 0, 0][i];
      if (dots >= 1) p(14, -2, 'G');
      if (dots >= 2) stamp(p, 16, -5, ['GG', 'GG']);
      if (dots >= 3) stamp(p, 19, -9, ['GGG', 'GGG', 'GGG']);
    }),
  },

  // Tidies its notes while the conversation is compacted: a sheet from the
  // stack on the left goes through the shredder on the right.
  compact: {
    label: 'Passe ses notes à la broyeuse',
    fps: 5,
    loop: true,
    frames: frames(8, (f, i) => {
      const p = clawd(f, {
        eyes: ['left', 'right', 'down', 'down', 'happy', 'happy', 'open', 'closed'][i],
        left: 'low',
        right: i >= 1 && i <= 3 ? 'mid' : 'out',
      });
      stamp(p, -5, 6, STACK);
      stamp(p, 17, 4, SHREDDER);
      // The sheet goes down into the slot, row 4: only what is still above it shows.
      const top = [null, -2, 0, 2][i] ?? null;
      if (top !== null) PAPER.forEach((row, j) => top + j < 4 && stamp(p, 18, top + j, [row]));
      if (i === 4) for (const [x, y] of [[19, 2], [21, 1], [20, 3], [22, 2]]) p(x, y, (x + y) % 2 ? 'L' : 'W');
      if (i === 5) for (const [x, y] of [[19, 0], [22, 0], [20, 1]]) p(x, y, 'L');
    }),
  },

  // Waiting for input
  flag: {
    label: 'Drapeau',
    fps: 6,
    loop: true,
    frames: frames(8, (f, i) => {
      const dy = i % 2 ? -1 : 0;
      const p = clawd(f, { dy, eyes: 'happy', left: i % 4 < 2 ? 'out' : 'mid', right: 'high', legs: dy ? 'tuck' : 'stand' });
      flag(p, i % 4);
    }),
  },
  bubble: {
    label: 'Bulle « ! »',
    fps: 4,
    loop: true,
    frames: frames(6, (f, i) => {
      const p = clawd(f, {
        eyes: ['wide', 'left', 'wide', 'right', 'wide', 'open'][i],
        legs: i % 2 ? 'tapL' : 'tapR',
      });
      stamp(p, 14, -10 - (i % 2), BUBBLE);
    }),
  },
  wave: {
    label: 'Fait signe',
    fps: 5,
    loop: true,
    frames: frames(4, (f, i) => {
      const hop = i % 2 === 1;
      clawd(f, {
        dy: hop ? -1 : 0,
        eyes: hop ? 'wide' : 'open',
        left: hop ? 'high' : 'mid',
        right: hop ? 'mid' : 'high',
        legs: hop ? 'tuck' : 'stand',
      });
    }),
  },

  // Idle
  walk: {
    label: 'Se balade',
    fps: 6,
    loop: true,
    frames: frames(4, (f, i) => {
      clawd(f, {
        eyes: 'right',
        legs: ['walkA', 'stand', 'walkB', 'stand'][i],
        left: i % 2 ? 'lift' : 'out',
        right: i % 2 ? 'out' : 'lift',
      });
    }),
  },
  breathe: {
    label: 'Cligne des yeux',
    fps: 4,
    loop: true,
    frames: frames(12, (f, i) => {
      clawd(f, { eyes: i === 9 ? 'closed' : 'open', left: i === 5 || i === 6 ? 'low' : 'out' });
    }),
  },
  look: {
    label: 'Regarde autour',
    fps: 4,
    loop: true,
    frames: frames(12, (f, i) => {
      const eyes = ['open', 'open', 'left', 'left', 'left', 'open', 'right', 'right', 'right', 'open', 'closed', 'open'][i];
      clawd(f, { eyes });
    }),
  },
  jump: {
    label: 'Saute',
    fps: 8,
    loop: true,
    frames: frames(8, (f, i) => {
      const air = i >= 2 && i <= 5;
      clawd(f, {
        dy: [0, 1, -2, -4, -4, -2, 0, 0][i],
        eyes: air ? 'happy' : 'open',
        left: air ? 'high' : 'out',
        right: air ? 'high' : 'out',
        legs: i >= 1 && i <= 5 ? 'tuck' : 'stand',
      });
    }),
  },
  dance: {
    label: 'Danse',
    fps: 6,
    loop: true,
    // Sways side to side with disco arms (one up, one down) and sparkles, so it
    // never reads as the both-arms waving of « Fait signe ».
    frames: frames(8, (f, i) => {
      const moves = [
        ['high', 'low'], ['high', 'low'], ['mid', 'mid'], ['low', 'high'],
        ['low', 'high'], ['mid', 'mid'], ['high', 'low'], ['out', 'out'],
      ];
      const [left, right] = moves[i];
      const p = clawd(f, {
        dx: [0, 1, 1, 0, -1, -1, 0, 0][i],
        dy: i % 2 ? -1 : 0,
        eyes: i % 4 === 3 ? 'closed' : 'happy',
        left,
        right,
        legs: ['tapR', 'stand', 'tapL', 'stand', 'tapR', 'stand', 'tapL', 'tuck'][i],
      });
      const sparkle = (x, y) => {
        p(x, y, 'Y');
        p(x - 1, y + 1, 'Y');
        p(x + 1, y + 1, 'Y');
        p(x, y + 2, 'Y');
      };
      if (i % 2 === 0) sparkle(-2, -4 + (i % 4));
      else sparkle(20, -3 - (i % 3));
    }),
  },
  ball: {
    label: 'Joue au ballon',
    fps: 8,
    loop: true,
    frames: frames(8, (f, i) => {
      const by = [-1, -4, -6, -7, -7, -6, -4, -1][i];
      const bump = i === 0 || i === 7;
      const p = clawd(f, {
        eyes: 'up',
        left: bump ? 'high' : 'out',
        right: bump ? 'high' : 'out',
        legs: bump ? 'tapL' : 'stand',
      });
      stamp(p, 7, by - 3, BALL);
    }),
  },
  // Ball passing between two Clawds, facing right; the scene flips the one on
  // the right and flies the ball between them (see PASS_BALL for its spots).
  'pass-throw': {
    label: 'Fait une passe',
    fps: 8,
    loop: false,
    frames: frames(5, (f, i) => {
      const p = clawd(f, {
        dy: i === 1 ? 1 : 0,
        eyes: i >= 3 ? 'happy' : 'right',
        left: ['mid', 'out', 'mid', 'high', 'mid'][i],
        right: ['mid', 'out', 'mid', 'high', 'mid'][i],
        legs: i === 3 ? 'tapR' : 'stand',
      });
      const top = PASS_BALL[i];
      if (top !== null) stamp(p, 16, top, BALL);
    }),
  },
  'pass-ready': {
    label: 'Attend la passe',
    fps: 4,
    loop: true,
    frames: frames(4, (f, i) => {
      clawd(f, { eyes: 'right', left: 'mid', right: 'mid', legs: i % 2 ? 'tapL' : 'stand' });
    }),
  },
  // Sword duel, facing right like the ball game. The scene keeps the timing:
  // « sword-strike » and « sword-block » start together and land on frame 3.
  'sword-guard': {
    label: 'En garde',
    fps: 4,
    loop: true,
    frames: frames(4, (f, i) => {
      const p = clawd(f, { eyes: 'right', right: 'mid', legs: i % 2 ? 'tapL' : 'stand' });
      sword(p, ...GRIP.mid, 1, -1);
    }),
  },
  'sword-strike': {
    label: 'Attaque',
    fps: 10,
    loop: false,
    frames: frames(6, (f, i) => {
      const arm = ['high', 'high', 'mid', 'mid', 'mid', 'mid'][i];
      const p = clawd(f, { eyes: i === 3 ? 'wide' : 'right', right: arm, legs: i === 3 ? 'tapR' : 'stand' });
      const [dx, dy] = [[0, -1], [-1, -1], [1, -1], [1, 0], [1, 0], [1, -1]][i];
      sword(p, ...GRIP[arm], dx, dy);
    }),
  },
  'sword-block': {
    label: 'Pare',
    fps: 10,
    loop: false,
    frames: frames(6, (f, i) => {
      const hit = i === 3 || i === 4;
      const p = clawd(f, { dx: hit ? -1 : 0, eyes: hit ? 'closed' : 'right', right: 'mid' });
      sword(p, ...GRIP.mid, 0, -1);
    }),
  },
  'sword-win': {
    label: 'Gagne le duel',
    fps: 8,
    loop: false,
    frames: frames(8, (f, i) => {
      const air = i >= 2 && i <= 5;
      const dy = [0, 1, -2, -4, -4, -2, 0, 0][i];
      const p = clawd(f, { dy, eyes: 'happy', left: air ? 'high' : 'out', right: 'high', legs: i >= 1 && i <= 5 ? 'tuck' : 'stand' });
      sword(p, ...GRIP.high, 0, -1);
    }),
  },
  'sword-lose': {
    label: 'Perd le duel',
    fps: 4,
    loop: true,
    frames: frames(4, (f, i) => {
      const p = clawd(f, { dy: 2, eyes: 'closed', left: 'low', right: 'low', legs: 'sit' });
      sword(pen(f), 19, 9, 1, 0);
      // Three dizzy stars turning around the head.
      for (let k = 0; k < 3; k++) {
        const angle = ((i / 4) + k / 3) * Math.PI * 2;
        const x = Math.round(9 + 8 * Math.cos(angle));
        const y = Math.round(-3 + 2 * Math.sin(angle));
        for (const [sx, sy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) p(x + sx, y + sy, 'Y');
      }
    }),
  },
  // Dancing with the Clawd on the right, who mirrors the same frames.
  'duo-dance': {
    label: 'Danse à deux',
    fps: 6,
    loop: true,
    frames: frames(8, (f, i) => {
      const moves = [
        ['out', 'high'], ['mid', 'high'], ['high', 'mid'], ['high', 'out'],
        ['low', 'mid'], ['mid', 'low'], ['out', 'high'], ['out', 'out'],
      ];
      const [left, right] = moves[i];
      const p = clawd(f, {
        dx: [0, 1, 1, 0, -1, -1, 0, 0][i],
        dy: i % 2 ? -1 : 0,
        eyes: i === 3 ? 'closed' : 'happy',
        left,
        right,
        legs: ['tapR', 'stand', 'tapL', 'stand', 'tapR', 'stand', 'tapL', 'tuck'][i],
      });
      // A note floating up over the head.
      stamp(p, 10 + Math.floor(i / 2), -5 - i, NOTE);
    }),
  },
  // High five with the Clawd on the right: reach, slap, hop.
  'high-five': {
    label: 'Tape dans la main',
    fps: 8,
    loop: false,
    frames: frames(8, (f, i) => {
      const reach = i >= 2 && i <= 4;
      const p = clawd(f, {
        dx: reach ? 2 : 0,
        dy: i === 5 ? -2 : i === 6 ? -1 : 0,
        eyes: i >= 3 ? 'happy' : 'right',
        right: i === 0 ? 'mid' : i <= 4 ? 'high' : 'out',
        legs: i === 5 ? 'tuck' : 'stand',
      });
      if (i === 3) for (const [x, y] of [[19, -5], [21, -4], [20, -6], [18, -6], [21, -2]]) p(x, y, 'Y');
    }),
  },
  // A coffee at the counter: steaming mug, a sip, a satisfied look.
  coffee: {
    label: 'Boit un café',
    fps: 4,
    loop: true,
    frames: frames(12, (f, i) => {
      const sip = i >= 5 && i <= 7;
      const raised = i === 4 || i === 8;
      const p = clawd(f, {
        eyes: sip ? 'closed' : i >= 9 ? 'happy' : i === 2 ? 'closed' : 'open',
        right: sip ? 'mid' : raised ? 'lift' : 'out',
      });
      // Held at the hand, then brought up against the face to drink.
      if (sip) mug(p, 14, 1);
      else if (raised) mug(p, 18, 1);
      else mug(p, 18, 3, i);
    }),
  },
  // Chatting over a coffee with the Clawd on the right, mug in hand.
  'coffee-talk': {
    label: 'Raconte, tasse en main',
    fps: 4,
    loop: true,
    frames: frames(8, (f, i) => {
      const bob = i === 2 || i === 6;
      const p = clawd(f, {
        dy: bob ? -1 : 0,
        eyes: i === 3 || i === 7 ? 'happy' : 'right',
        left: ['out', 'mid', 'high', 'mid', 'out', 'lift', 'mid', 'lift'][i],
        legs: bob ? 'tuck' : 'stand',
      });
      mug(p, 18, 3, i);
    }),
  },
  'coffee-listen': {
    label: 'Écoute, tasse en main',
    fps: 3,
    loop: true,
    frames: frames(8, (f, i) => {
      const nod = i === 2 || i === 5;
      const sip = i === 7;
      const p = clawd(f, {
        dy: nod ? 1 : 0,
        eyes: sip || i === 4 ? 'closed' : 'right',
        right: sip ? 'mid' : 'out',
        legs: nod ? 'tuck' : 'stand',
      });
      if (sip) mug(p, 14, 1);
      else mug(p, 18, 3 + (nod ? 1 : 0), i);
    }),
  },
  // A tool failed: startled, a red cross pops up, then a puzzled look around.
  oops: {
    label: 'Oups, erreur',
    fps: 7,
    loop: false,
    frames: frames(10, (f, i) => {
      const jump = i === 1 || i === 2;
      const p = clawd(f, {
        dy: jump ? -2 : 0,
        eyes: i <= 3 ? 'wide' : ['left', 'right', 'left', 'open', 'closed', 'open'][i - 4],
        left: jump ? 'high' : i >= 4 && i <= 7 ? 'mid' : 'out',
        right: jump ? 'high' : i >= 4 && i <= 7 ? 'mid' : 'out',
        legs: jump ? 'tuck' : 'stand',
      });
      if (i >= 1 && i <= 7) stamp(p, 13, -10 + (jump ? 2 : 0), OOPS);
      // A wisp of smoke over the head once the cross is gone.
      if (i >= 8) for (const [x, y] of [[8, -2], [9, -3], [10, -4]].slice(0, i - 6)) p(x, y, 'G');
    }),
  },
  // git commit: the work goes into a parcel, sealed and held up high.
  commit: {
    label: 'Commit',
    fps: 7,
    loop: false,
    frames: frames(11, (f, i) => {
      const up = i >= 4 && i <= 8;
      const hop = i === 5 || i === 6;
      const p = clawd(f, {
        dy: hop ? -2 : 0,
        eyes: i < 3 ? 'down' : up ? 'happy' : 'open',
        left: up ? 'high' : i < 3 ? 'press' : 'mid',
        right: up ? 'high' : i < 3 ? 'press' : 'mid',
        legs: hop ? 'tuck' : 'stand',
      });
      // Packed in front of it, then lifted over its head.
      if (i < 4) stamp(p, 6, 4 - (i === 3 ? 3 : 0), i === 0 ? PARCEL.map((r) => r.replaceAll('Y', 'H')) : PARCEL);
      else if (i <= 8) stamp(p, 6, -7 + (hop ? 0 : 1), PARCEL);
      if (i >= 5 && i <= 8) for (const [x, y] of [[3, -8], [15, -9], [2, -4], [16, -5]].slice(0, i - 4)) p(x, y, 'Y');
    }),
  },
  // Tests green: a tick pops up and it bounces.
  'tests-green': {
    label: 'Tests verts',
    fps: 7,
    loop: false,
    frames: frames(9, (f, i) => {
      const hop = i === 2 || i === 3 || i === 6;
      const p = clawd(f, {
        dy: hop ? -2 : 0,
        eyes: i === 0 ? 'wide' : 'happy',
        left: hop ? 'high' : 'out',
        right: hop ? 'high' : i >= 4 ? 'mid' : 'out',
        legs: hop ? 'tuck' : 'stand',
      });
      if (i >= 1) stamp(p, 13, -10 + (hop ? 2 : 0), TICK);
    }),
  },
  // Tests red: slumped, eyes down, under its own little rain cloud.
  'tests-red': {
    label: 'Tests rouges',
    fps: 4,
    loop: false,
    frames: frames(12, (f, i) => {
      const p = clawd(f, {
        dy: i >= 1 ? 1 : 0,
        eyes: i === 0 ? 'wide' : i % 5 === 4 ? 'closed' : 'down',
        left: i === 0 ? 'mid' : 'low',
        right: i === 0 ? 'mid' : 'low',
        legs: i >= 1 ? 'tuck' : 'stand',
      });
      if (i < 1) return;
      stamp(p, 5, -9, CLOUD);
      // Drops falling in two staggered columns.
      for (const [x, k] of [[7, 0], [10, 1], [12, 0]]) {
        const y = -5 + ((i + k * 2) % 4) * 1;
        p(x, y, 'B');
      }
    }),
  },
  // Long hours at the desk: a yawn and a stretch, arms up on tiptoe.
  stretch: {
    label: 'Bâille et s\'étire',
    fps: 4,
    loop: false,
    frames: frames(12, (f, i) => {
      const up = i >= 2 && i <= 6;
      const p = clawd(f, {
        dy: up ? -1 : 0,
        eyes: up || i === 7 ? 'closed' : i === 10 ? 'closed' : 'open',
        left: up ? 'high' : i === 7 ? 'lift' : 'out',
        right: up ? 'high' : i === 7 ? 'lift' : 'out',
        legs: up ? 'tuck' : 'stand',
      });
      // The yawn: a mouth that opens wide, then closes.
      if (i >= 2 && i <= 7) {
        const wide = i >= 3 && i <= 5;
        stamp(p, 8, 5, wide ? ['EEE', 'EEE'] : ['.E.']);
      }
    }),
  },
  // Watching a game from the side, facing it.
  cheer: {
    label: 'Encourage',
    fps: 6,
    loop: true,
    frames: frames(6, (f, i) => {
      clawd(f, {
        dy: i === 1 || i === 4 ? -1 : 0,
        eyes: i % 3 === 2 ? 'right' : 'happy',
        left: i < 3 ? 'high' : 'out',
        right: i < 3 ? 'out' : 'high',
        legs: i === 1 || i === 4 ? 'tuck' : 'stand',
      });
    }),
  },
  // A subagent done with its task hands the report to its main agent (on the right).
  handoff: {
    label: 'Rend son rapport',
    fps: 6,
    loop: false,
    frames: frames(8, (f, i) => {
      const held = i < 5;
      const p = clawd(f, {
        eyes: i >= 3 ? 'happy' : 'right',
        right: held ? 'mid' : i === 6 ? 'high' : 'mid',
        legs: i === 2 ? 'tapR' : 'stand',
      });
      if (held) stamp(p, 18 + (i >= 2 ? 1 : 0), -2, PAPER);
    }),
  },
  sleep: {
    label: 'Dort',
    fps: 3,
    loop: true,
    frames: frames(8, (f, i) => {
      const p = clawd(f, { dy: 2, eyes: 'closed', left: 'low', right: 'low', legs: 'sit' });
      stamp(p, 14 + Math.floor(i / 2), -2 - i, Z);
      const j = (i + 4) % 8;
      stamp(p, 14 + Math.floor(j / 2), -2 - j, Z);
    }),
  },

  // Transitions
  arrive: {
    label: 'Arrivée',
    fps: 10,
    loop: false,
    frames: frames(7, (f, i) => {
      const p = pen(f);
      if (i >= 3) {
        const cheer = i === 5;
        clawd(f, { eyes: i >= 5 ? 'happy' : 'open', left: cheer ? 'high' : 'out', right: cheer ? 'high' : 'out' });
      }
      if (i === 0) disc(p, 9, 5, 2, 'L');
      if (i === 1) {
        disc(p, 9, 5, 4, 'L');
        disc(p, 9, 5, 2, 'W');
      }
      if (i === 2) {
        disc(p, 9, 5, 6, 'L');
        disc(p, 9, 5, 4, 'W');
      }
      if (i === 3) for (const [x, y] of RING) stamp(p, x, y, ['LL', 'LL']);
      if (i === 4) for (const [x, y] of SPARKLES) p(x, y, 'Y');
    }),
  },
  celebrate: {
    label: 'Fête ça',
    fps: 8,
    loop: false,
    frames: frames(10, (f, i) => {
      const cheer = i >= 2 && i <= 7;
      clawd(f, {
        dy: [0, 1, -2, -4, -5, -4, -2, 0, 0, 0][i],
        eyes: 'happy',
        left: cheer ? 'high' : 'out',
        right: cheer ? 'high' : 'out',
        legs: i >= 1 && i <= 6 ? 'tuck' : 'stand',
      });
      if (i >= 2) {
        const p = pen(f);
        for (const [x, y, c] of CONFETTI) p(x, y + (i - 2) * 2, c);
      }
    }),
  },
  leave: {
    label: 'Départ',
    fps: 8,
    loop: false,
    frames: frames(9, (f, i) => {
      const p = pen(f);
      if (i < 4) clawd(f, { eyes: 'happy', right: i % 2 ? 'high' : 'mid' });
      if (i === 4) {
        clawd(f, { eyes: 'closed' });
        disc(p, 9, 5, 4, 'L');
      }
      if (i === 5) {
        disc(p, 9, 5, 6, 'L');
        disc(p, 9, 5, 4, 'W');
      }
      if (i === 6) disc(p, 9, 5, 4, 'L');
      if (i === 7) disc(p, 9, 5, 2, 'L');
    }),
  },
};

// Gallery layout: which animations illustrate which agent activity, and the
// hook events that trigger them.
export const GROUPS = [
  {
    id: 'working',
    label: 'Travaille',
    hint: 'L\'agent est occupé. Le costume dépend de l\'outil en cours (PreToolUse).',
    items: [
      ['type-front', 'Edit, Write, Bash et les autres outils, aux bureaux de face'],
      ['type-laptop', 'Quand tous les bureaux sont pris'],
      ['type-side', 'Aux bureaux de côté (le bureau fait partie du décor)'],
      ['search', 'Read, Grep, Glob'],
      ['compact', 'Compaction du contexte (PreCompact jusqu\'à PostCompact)'],
      ['read', 'Read, Grep, Glob, en alternance avec l\'enquête'],
      ['globe', 'WebFetch, WebSearch, outils MCP'],
      ['think', 'Prompt reçu (UserPromptSubmit), délégation à un subagent'],
    ],
  },
  {
    id: 'site',
    label: 'Chantier',
    hint: 'Mode chantier : la session construit sa salle d\'après la structure de son dossier.',
    items: [
      ['trowel', 'Monte les murs, une rangée de briques par outil utilisé'],
      ['hammer', 'Pose les ouvertures, le sol et le mobilier'],
      ['shovel', 'Pose le sol, une dalle sur deux en moyenne (sinon au marteau)'],
      ['stop', 'Attend un input pendant le chantier'],
    ],
  },
  {
    id: 'waiting',
    label: 'Attend un input',
    hint: 'L\'agent est bloqué tant que tu ne réponds pas.',
    items: [
      ['flag', 'PermissionRequest, AskUserQuestion, ExitPlanMode'],
      ['bubble', 'Notification de permission ou de question'],
      ['wave', 'En alternance avec les deux autres'],
    ],
  },
  {
    id: 'idle',
    label: 'Rien à faire',
    hint: 'Après Stop. Tirage au hasard entre ces animations, sieste au bout de 2 minutes.',
    items: [
      ['walk', 'Se déplace dans sa zone'],
      ['music', 'Pause musicale, à côté de la radio'],
      ['breathe', 'Pause entre deux activités'],
      ['look', 'Pause entre deux activités'],
      ['jump', 'Jeu'],
      ['dance', 'Jeu'],
      ['ball', 'Jeu'],
      ['pass-throw', 'Passe de ballon, à deux sur un tapis'],
      ['pass-ready', 'Attend que l\'autre renvoie le ballon'],
      ['sword-guard', 'Duel à l\'épée, à deux sur un tapis'],
      ['sword-strike', 'Attaque, l\'autre pare en même temps'],
      ['sword-block', 'Pare l\'attaque'],
      ['sword-win', 'Fin du duel, le dernier à attaquer gagne'],
      ['sword-lose', 'Fin du duel, l\'autre est sonné'],
      ['duo-dance', 'Danse à deux devant une radio'],
      ['coffee', 'Pause café au comptoir'],
      ['coffee-talk', 'Discute au comptoir, une bulle au-dessus de la tête'],
      ['coffee-listen', 'Écoute l\'autre au comptoir'],
      ['cheer', 'Un troisième Clawd regarde une partie, puis applaudit à la fin (Fête ça)'],
      ['sleep', '2 minutes sans activité'],
    ],
  },
  {
    id: 'events',
    label: 'Transitions',
    hint: 'Jouées une fois, au changement d\'état.',
    items: [
      ['arrive', 'SessionStart, SubagentStart'],
      ['celebrate', 'Stop après un travail'],
      ['high-five', 'Stop après un travail, avec un Clawd au repos à côté'],
      ['handoff', 'SubagentStop : le subagent rejoint son agent principal'],
      ['oops', 'PostToolUseFailure : un outil a échoué (pas une annulation)'],
      ['commit', 'Bash : git commit réussi'],
      ['tests-green', 'Bash : commande de tests réussie (npm test, vitest, pytest…)'],
      ['tests-red', 'Bash : commande de tests en échec'],
      ['stretch', 'Au bureau après 10 min de travail d\'affilée, de temps en temps'],
      ['leave', 'SubagentStop, SessionEnd'],
    ],
  },
];
