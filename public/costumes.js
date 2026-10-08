// Costumes for the season: a hat or horns placed on the head of whatever frame
// is playing, or a body recoloured (ghost sheet, bandages, Christmas jumper).
// About two Clawds in five wear one, always the same for a given agent.
import { FRAME_W } from './sprites.js';
import { FLAGS } from './seasons.js';
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
  // Carnival: lots of them, and a little silly.
  clown: {
    season: 'fuesend',
    hat: (a) => [[-1, a.eyes - a.top + 2, 'R'], [0, a.eyes - a.top + 2, 'R'], [-1, a.eyes - a.top + 1, 'R'], [0, a.eyes - a.top + 1, 'R'],
      ...hat(['.Y.B.R.', 'YYBBBRR'])()],
  },
  jester: {
    season: 'fuesend',
    hat: hat([
      'Y.......Y',
      'RR.....YY',
      '.RRR.YYY.',
      '..RRYYY..',
      '.RRRYYYY.',
    ]),
  },
  pirate: {
    season: 'fuesend',
    hat: hat([
      '..KKKKK..',
      '.KKKWKKK.',
      'KKKKKKKKK',
    ]),
  },
  crown: {
    seasons: ['fuesend', 'nouvel-an'],
    hat: hat([
      'Y..Y..Y',
      'YY.Y.YY',
      'YRYBYRY',
    ]),
  },
  mask: { season: 'fuesend', body: (x, y, a) => (y >= a.eyes - 2 && y <= a.eyes ? '#6e4a9e' : null) },
  // The Kleeschen's mitre, and his dark companion, the Houseker.
  mitre: {
    season: 'kleeschen',
    hat: hat([
      '...Y...',
      '..WYW..',
      '.WWYWW.',
      '.WYYYW.',
      '.WWYWW.',
      '.YYYYY.',
    ]),
  },
  houseker: { season: 'kleeschen', body: () => '#3e322c' },
  goldHat: {
    season: 'nouvel-an',
    hat: hat([
      '...W...',
      '...Y...',
      '..YAY..',
      '..AYA..',
      '.YAYAY.',
      '.AYAYA.',
    ]),
  },
  woolly: {
    seasons: ['buergbrennen', 'hiver'],
    hat: hat([
      '...W...',
      '.RRRRR.',
      'RWRWRWR',
      'WWWWWWW',
    ]),
  },
  // Seasons of the year: fewer of them, and quieter.
  sunglasses: {
    season: 'ete',
    hat: (a) => {
      const y = a.eyes - a.top;
      const cells = [];
      for (let x = -5; x <= 5; x++) cells.push([x, y - 1, 'K']);
      for (const side of [-4, 2]) for (let dx = 0; dx < 3; dx++) cells.push([side + dx, y, 'K']);
      return cells;
    },
  },
  cap: {
    season: 'ete',
    hat: hat([
      '..BBBBB....',
      '.BBBWBBBBBB',
    ]),
  },
  strawHat: {
    season: 'ete',
    hat: hat([
      '...YYYYY...',
      '...RRRRR...',
      'YYYYYYYYYYY',
    ]),
  },
  flowerPin: {
    season: 'printemps',
    hat: (a) => [[a.right - a.cx - 2, -1, 'q'], [a.right - a.cx - 3, -2, 'q'], [a.right - a.cx - 1, -2, 'q'], [a.right - a.cx - 2, -3, 'q'], [a.right - a.cx - 2, -2, 'Y']],
  },
  // A red scarf round the neck, one end hanging.
  scarf: {
    seasons: ['automne', 'hiver'],
    body: (x, y, a) => (y === a.eyes + 2 && a.torso.has(y) ? '#c8404a' : null),
    hat: (a) => [[a.right - a.cx - 4, a.eyes - a.top + 3, 'R'], [a.right - a.cx - 4, a.eyes - a.top + 4, 'R'], [a.right - a.cx - 3, a.eyes - a.top + 3, 'R']],
  },
  beret: {
    season: 'automne',
    hat: hat([
      '.....D...',
      '..DDDDDD.',
      '.DDDDDDDD',
    ]),
  },
  earmuffs: {
    season: 'hiver',
    hat: (a) => {
      const y = a.eyes - a.top - 1;
      const cells = [];
      for (let x = a.left - a.cx; x <= a.right - a.cx; x++) cells.push([x, -1, 'K']);
      for (const x of [a.left - a.cx - 1, a.right - a.cx + 1]) for (let dy = -1; dy <= 1; dy++) cells.push([x, y + dy, 'R']);
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

// National days: a little flag waved on a stick beside the head.
for (const [season, { colors, vertical }] of Object.entries(FLAGS)) {
  COSTUMES[`flag-${season}`] = {
    season,
    hat: (a) => {
      const pole = a.left - a.cx - 2;
      const cells = [];
      for (let y = -6; y < 2; y++) cells.push([pole, y, 'D']);
      for (let y = 0; y < 3; y++) for (let x = 0; x < 4; x++) cells.push([pole - 4 + x, y - 6, colors[vertical ? Math.min(2, Math.floor(x * 3 / 4)) : y]]);
      return cells;
    },
  };
}
// Building site mode: a yellow hard hat for every main Clawd, orange for the helpers.
const HARD_HAT = (c, d) => hat([
  `....${c.repeat(7)}....`,
  `...${c.repeat(9)}...`,
  `..${c.repeat(4)}W${c.repeat(6)}..`,
  `..${c.repeat(11)}..`,
  `${d.repeat(15)}`,
]);
export const HARD_HATS = { main: { hat: HARD_HAT('Y', 'M') }, sub: { hat: HARD_HAT('o', 'n') } };

// More of them dress up for carnival, everybody waves a flag on a national day.
const SHARE = { fuesend: 80, 'fete-lu': 50, 'fete-fr': 50, 'fete-be': 50, 'fete-de': 50, printemps: 20, ete: 30, automne: 25, hiver: 35 };

function hash(text) {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

// The costume a given agent wears this season, or null.
export function costumeFor(key, season) {
  if (!season) return null;
  const h = hash(key);
  if (h % 100 >= (SHARE[season] ?? 40)) return null;
  const options = Object.values(COSTUMES).filter((c) => c.season === season || c.seasons?.includes(season));
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
