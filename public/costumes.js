// Costumes for the season: a hat or horns placed on the head of whatever frame
// is playing, or a body recoloured (ghost sheet, bandages, Christmas jumper).
// About two Clawds in five wear one, always the same for a given agent.
import { FRAME_W } from './sprites.js';
import { PALETTES, drawFrame } from './render.js';

const INK = PALETTES.main;

// Hats are drawn with their bottom row just above the head, centred on it.
const hat = (rows) => {
  const cells = [];
  const w = rows[0].length;
  rows.forEach((row, y) => [...row].forEach((c, x) => {
    if (c !== '.') cells.push([x - Math.floor(w / 2), y - rows.length, c]);
  }));
  return () => cells;
};

const COSTUMES = {
  witch: {
    season: 'halloween',
    hat: hat([
      '......KK...',
      '.....KKK...',
      '....KKKK...',
      '....KKKK...',
      '...KvvvvK..',
      '...oooooo..',
      'KKKKKKKKKKK',
    ]),
  },
  // Little horns on the two top corners of the head.
  devil: {
    season: 'halloween',
    hat: (a) => [
      [a.left - a.cx + 1, -1, 'R'], [a.left - a.cx + 1, -2, 'R'], [a.left - a.cx + 2, -1, 'R'],
      [a.right - a.cx - 1, -1, 'R'], [a.right - a.cx - 1, -2, 'R'], [a.right - a.cx - 2, -1, 'R'],
    ],
  },
  ghost: { season: 'halloween', body: () => '#f3f1ea' },
  mummy: { season: 'halloween', body: (x, y) => ((y + Math.floor(x / 4)) % 2 ? '#ebe4d0' : '#c9bea4') },
  santa: {
    season: 'noel',
    hat: hat([
      '.......RWW.',
      '......RRWW.',
      '.....RRR...',
      '....RRRRR..',
      '...RRRRRRR.',
      '.WWWWWWWWW.',
    ]),
  },
  elf: {
    season: 'noel',
    hat: hat([
      '........Y..',
      '.......P...',
      '......PP...',
      '.....PPP...',
      '....PPPP...',
      '..PPPPPPP..',
      '.RRRRRRRRR.',
    ]),
  },
  reindeer: {
    season: 'noel',
    hat: hat([
      'H.H.......H.H',
      '.HH.......HH.',
      '..H.......H..',
      '..H.......H..',
    ]),
  },
  bunny: {
    season: 'paques',
    hat: hat([
      '.WW...WW.',
      '.WqW.WqW.',
      '.WqW.WqW.',
      '.WqW.WqW.',
      '..WW.WW..',
    ]),
  },
  chick: { season: 'paques', body: () => '#f4d24a' },
  flowers: {
    season: 'paques',
    hat: hat([
      '.q.y.b.q.y.',
      'qPyPbPqPyPl',
    ]),
  },
  partyHat: {
    season: 'fouer',
    hat: hat([
      '...Y...',
      '...R...',
      '..RWR..',
      '..WRW..',
      '.RWRWR.',
      '.WRWRW.',
    ]),
  },
  boater: {
    season: 'fouer',
    hat: hat([
      '..YYYYYYY..',
      '..RRRRRRR..',
      'YYYYYYYYYYY',
    ]),
  },
  // A balloon on a string, tied to the head.
  balloon: {
    season: 'fouer',
    hat: (a) => {
      const cells = [];
      const bx = a.right - a.cx + 3;
      for (let y = -4; y < 0; y++) cells.push([bx, y, 'K']);
      for (const [x, y] of [[0, -9], [1, -9], [-1, -8], [0, -8], [1, -8], [2, -8], [-1, -7], [0, -7], [1, -7], [2, -7], [-1, -6], [0, -6], [1, -6], [2, -6], [0, -5], [1, -5]]) cells.push([bx + x - 1, y, 'c']);
      return cells;
    },
  },
  // A Christmas jumper: red, with a band of green and white below the eyes.
  jumper: {
    season: 'noel',
    body: (x, y, a) => {
      if (y <= a.eyes + 1 || !a.torso.has(y)) return null;
      if (y === a.eyes + 3) return x % 2 ? '#ffffff' : '#3f7a44';
      return '#d8404a';
    },
  },
};

function hash(text) {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

// The costume a given agent wears this season, or null.
export function costumeFor(key, season) {
  if (!season) return null;
  const h = hash(key);
  if (h % 100 >= 40) return null;
  const options = Object.values(COSTUMES).filter((c) => c.season === season);
  return options[Math.floor(h / 100) % options.length] ?? null;
}

// Where the head is in a frame: its top row, its middle and edges on that row,
// the eyes' lowest row, and the rows wide enough to be the torso.
const anatomies = new WeakMap();
function anatomy(frame) {
  let a = anatomies.get(frame);
  if (a) return a;
  const body = frame.filter(([, , c]) => c === 'C');
  const top = Math.min(...body.map(([, y]) => y));
  const head = body.filter(([, y]) => y === top).map(([x]) => x);
  const eyes = frame.filter(([, , c]) => c === 'E').map(([, y]) => y);
  const widths = new Map();
  for (const [, y] of body) widths.set(y, (widths.get(y) ?? 0) + 1);
  a = {
    top,
    left: Math.min(...head),
    right: Math.max(...head),
    cx: Math.round((Math.min(...head) + Math.max(...head)) / 2),
    eyes: eyes.length ? Math.max(...eyes) : top + 3,
    torso: new Set([...widths].filter(([, n]) => n >= 8).map(([y]) => y)),
  };
  anatomies.set(frame, a);
  return a;
}

// drawFrame, dressed up.
export function drawDressed(ctx, frame, x, y, scale, palette, flip, costume) {
  if (!costume || !frame.some(([, , c]) => c === 'C')) {
    drawFrame(ctx, frame, x, y, scale, palette, flip);
    return;
  }
  const a = anatomy(frame);
  const at = (fx) => x + (flip ? FRAME_W - 1 - fx : fx) * scale;
  for (const [px, py, c] of frame) {
    ctx.fillStyle = (c === 'C' && costume.body?.(px, py, a)) || palette[c];
    ctx.fillRect(at(px), y + py * scale, scale, scale);
  }
  if (!costume.hat) return;
  for (const [dx, dy, c] of costume.hat(a)) {
    ctx.fillStyle = INK[c];
    ctx.fillRect(at(a.cx + dx), y + (a.top + dy) * scale, scale, scale);
  }
}
