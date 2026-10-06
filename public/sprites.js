// Clawd sprite catalog.
// Every frame is composed on a FRAME_W x FRAME_H grid of palette keys, so the
// same catalog renders the main agent and the lighter subagents. Keys:
// C body, E eyes, K ink, W white, G gray, L puff, R red, B blue, N navy,
// H brown, Y yellow, S glass.

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
const RING = [[-2, 1], [0, -3], [9, -4], [17, -3], [20, 2], [20, 8], [-2, 8], [4, -4], [14, -4]];
const SPARKLES = [[-1, -1], [19, -1], [0, 9], [18, 8], [9, -3]];
const CONFETTI = [
  [2, -6, 'Y'], [6, -9, 'R'], [10, -7, 'B'], [14, -10, 'Y'], [17, -5, 'R'],
  [0, -3, 'B'], [19, -8, 'Y'], [8, -11, 'R'], [12, -4, 'N'],
];

// ---------------------------------------------------------------- animations

export const ANIMS = {
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
      ['globe', 'WebFetch, WebSearch, outils MCP'],
      ['think', 'Prompt reçu (UserPromptSubmit), délégation à un subagent'],
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
      ['leave', 'SubagentStop, SessionEnd'],
    ],
  },
];
