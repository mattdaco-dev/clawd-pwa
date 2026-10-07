// Open-space decor: walls, floor, whiteboards, windows and rugs painted once,
// furniture depth-sorted with the Clawds, and the stations where they go for
// each activity. Two layouts: one fixed-size room per session ("rooms"), or a
// single office every session shares ("shared").
//
// Distances below are written for 5 px pixels and scaled by u() to the chosen
// pixel size, so the whole office zooms with the Clawds.
import { INK, drawSprite, sprite } from './pixels.js';
import { TREE_GIFTS, seasonCritters, seasonFloor, seasonTables, seasonWall, skyEvent, snowSill, treeTrain, wallSpiders } from './seasons.js';
import { sunTimes } from './sun.js';

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), Math.max(lo, hi));

// Desk seen from the front; the Clawd stands behind it, the monitor back on the left.
const DESK_SURFACE = 7; // row of the desktop
const DESK = sprite([
  'KKKKKKKK....................',
  'KAAAAAAKS...................',
  'KAAAAAAKS...................',
  'KAAAAAAKS...................',
  'KKKKKKKK....................',
  '...KK...................WW..',
  '..KKKK..................WW..',
  'OOOOOOOOOOOOOOOOOOOOOOOOOOOO',
  'OOOOOOOOOOOOOOOOOOOOOOOOOOOO',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  'DD........................DD',
  'DD........................DD',
  'DD........................DD',
  'DD........................DD',
]);

// Desk seen from the side, for typing in profile: the Clawd stands on the left,
// hand on the keyboard (row 6), the monitor faces it from the right end.
const SIDE_KEYS = 6;
const SIDE_DESK = sprite([
  '.........SKA..',
  '.........SKA..',
  '.........SKA..',
  '.........SKA..',
  '.........SKA..',
  '..........K...',
  'KKKK..WW.KKK..',
  'OOOOOOOOOOOOOO',
  'DDDDDDDDDDDDDD',
  '.DD........DD.',
  '.DD........DD.',
]);

const SHELF = sprite([
  'DDDDDDDDDDDDDDDD',
  'DRRBYYNGGRBBYNRD',
  'DRRBYYNGGRBBYNRD',
  'DRRBYYNGGRBBYNRD',
  'DDDDDDDDDDDDDDDD',
  'DNYYGBBRRNYGGBND',
  'DNYYGBBRRNYGGBND',
  'DNYYGBBRRNYGGBND',
  'DDDDDDDDDDDDDDDD',
  'DBGRRYNNBBGRYYND',
  'DBGRRYNNBBGRYYND',
  'DBGRRYNNBBGRYYND',
  'DDDDDDDDDDDDDDDD',
  'DD............DD',
]);

// Coffee counter: the machine on the left of the worktop, mugs and a sugar jar,
// a cupboard underneath.
const COUNTER = sprite([
  '..KKKKKKKK..............',
  '..KGGGGGGK..............',
  '..KGKSSKGK..............',
  '..KGGGGRGK..............',
  '..KGG..GGK..............',
  '..KGG..GGK....L...L.....',
  '..KGGWWGGK...L...L...WW.',
  '..KKKKKKKK..BBB.RRR.HWWH',
  'OOOOOOOOOOOOOOOOOOOOOOOO',
  'DDDDDDDDDDDDDDDDDDDDDDDD',
  'DAAAAAAAAAADDAAAAAAAAAAD',
  'DAAAAAAAAYADDAYAAAAAAAAD',
  'DAAAAAAAAAADDAAAAAAAAAAD',
  'DAAAAAAAAAADDAAAAAAAAAAD',
  'DDDDDDDDDDDDDDDDDDDDDDDD',
]);
const COUNTER_MACHINE = 6; // column in front of the machine
const COUNTER_PENDANT = 17; // column under the pendant lamp, over the mugs

// Pendant lamp over the counter, hung from the top of the wall by its cord.
const PENDANT = sprite([
  '..KKK..',
  '.YYYYY.',
  'YYYYYYY',
  '...W...',
]);

// The coffee corner: one drinks alone at the machine; two chat face to face in
// front of the counter, which takes the machine's place along with them.
function coffeeCorner(left, base, inFront, { g, ceiling, lamps, p, u, standing, slot, stations }) {
  standing(COUNTER, left, base);
  // The pendant lamp, lit at night like the floor lamps.
  const cx = left + COUNTER_PENDANT * p;
  const shadeTop = base - COUNTER.h * p - u(28);
  g.fillStyle = INK.K;
  g.fillRect(Math.round(cx - p / 2), ceiling, p, Math.round(shadeTop - ceiling));
  drawSprite(g, PENDANT, cx - 3.5 * p, shadeTop, p);
  lamps.push({ x: cx, y: base - COUNTER.h * p }); // glow centred on the worktop
  slot('coffee', left + COUNTER_MACHINE * p, inFront);
  // Centred on the machine, so the one on the right still fits by the wall's end.
  slot('chat', left + COUNTER_MACHINE * p, inFront + u(6));
  stations.chat.at(-1).near = stations.coffee.at(-1);
}

const RADIO = sprite([
  '....G.......',
  '.....G......',
  '..RRRRRRRR..',
  '..RKKRWWRR..',
  '..RKKRWWRR..',
  '..RRRRRRRR..',
  'OOOOOOOOOOOO',
  'DDDDDDDDDDDD',
  '.D........D.',
  '.D........D.',
  '.D........D.',
]);

const BEANBAG = sprite([
  '...BBBBBBBB...',
  '.BBBBBBBBBBBB.',
  'BBNBBBBBBBBNBB',
  'BNNNBBBBBBNNNB',
  'NNNNNNNNNNNNNN',
  '.NNNNNNNNNNNN.',
]);

const PLANT = sprite([
  '..P..Q..',
  '.PPQ.QP.',
  'PPQQPPQP',
  '.QPPQQP.',
  'PQQPPQPP',
  '.PPQQPP.',
  '..QPPQ..',
  '...QP...',
  '..HHHH..',
  '..HHHH..',
  '...HH...',
]);

const BOARD = sprite([
  'GGGGGGGGGGGGGGGGGGGGGGGG',
  'GWWWWWWWWWWWWWWWWWWWWWWG',
  'GWBBBWWWWRRWWWWWWWWWWWWG',
  'GWWWBWWWRWWRWWWBBBBBWWWG',
  'GWWBWWWWWRRWWWWWWWWWWWWG',
  'GWBBBBWWWWWWWBBWWWWWWWWG',
  'GWWWWWWWWWWWBWWBWWNNNWWG',
  'GWWNNNNNNWWWWBBWWWWWWWWG',
  'GWWWWWWWWWWWWWWWWWWWWWWG',
  'GGGGGGGGGGGGGGGGGGGGGGGG',
  '..GGGGGGGGGGGGGGGGGGGG..',
]);

// Season decorations: carved pumpkins in October, a Christmas tree and its
// presents from December to Epiphany. `?saison=halloween` or `?saison=noel` forces one.
const PUMPKIN = sprite([
  '...Q...',
  '.ooQoo.',
  'onooono',
  'oKonoKo',
  'onooono',
  'oKKKKKo',
  '.onono.',
]);
// The carved face, lit from inside at night.
const PUMPKIN_FACE = PUMPKIN.cells.filter(([, , c]) => c === 'K').map(([x, y]) => [x, y, 'Y']);

const TREE = sprite([
  '.....Y.....',
  '....YYY....',
  '.....P.....',
  '....PPP....',
  '...PPQPP...',
  '....PPP....',
  '...PPPPP...',
  '..PPQPPPP..',
  '...PPPPP...',
  '..PPPPQPP..',
  '.PPPPPPPPP.',
  '..PPPPPPP..',
  '.PPQPPPPPP.',
  'PPPPPPPQPPP',
  '....HHH....',
  '....HHH....',
]);
// Fairy lights, on a few needles of each tier.
const TREE_LIGHTS = [[5, 3, 'R'], [4, 6, 'Y'], [6, 7, 'B'], [3, 9, 'Y'], [7, 10, 'R'], [2, 12, 'B'], [5, 12, 'Y'], [8, 13, 'R'], [1, 13, 'Y']];

// Easter Sunday (anonymous Gregorian algorithm).
function easter(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const h = (19 * a + b - Math.floor(b / 4) - Math.floor((b - Math.floor((8 * b + 13) / 25)) / 3) + 15) % 30;
  const l = (32 + 2 * (b % 4) + 2 * Math.floor(c / 4) - h - (c % 4)) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  return new Date(year, month - 1, ((h + l - 7 * m + 114) % 31) + 1);
}

// The Schueberfouer opens on the Friday closest to 24 August and lasts 20 days.
function fouerStart(year) {
  const st = new Date(year, 7, 24);
  const back = (st.getDay() + 2) % 7; // days since the last Friday
  return new Date(year, 7, 24 + (back <= 3 ? -back : 7 - back));
}

// One-day feasts come before the long seasons they fall in.
export function seasonOf(date) {
  const forced = new URLSearchParams(location.search).get('saison');
  if (forced) return forced;
  const m = date.getMonth();
  const d = date.getDate();
  const day = new Date(date.getFullYear(), m, d);
  const days = (from, to) => Math.round((to - from) / 86_400_000);
  if ((m === 11 && d === 31) || (m === 0 && d === 1)) return 'nouvel-an';
  if (m === 5 && (d === 22 || d === 23)) return 'fete-lu'; // fireworks on the eve
  if (m === 6 && d === 14) return 'fete-fr';
  if (m === 6 && d === 21) return 'fete-be';
  if (m === 9 && d === 3) return 'fete-de';
  const sinceEaster = days(easter(date.getFullYear()), day);
  if (sinceEaster === -43 || sinceEaster === -42) return 'buergbrennen'; // first Sunday of Lent and its eve
  if (sinceEaster >= -52 && sinceEaster <= -47) return 'fuesend'; // Fat Thursday to Shrove Tuesday
  if (sinceEaster >= -10 && sinceEaster <= 1) return 'paques'; // to Easter Monday, the Emaischen
  const sinceFouer = days(fouerStart(date.getFullYear()), day);
  if (sinceFouer >= 0 && sinceFouer < 20) return 'fouer';
  if (m === 9 || (m === 10 && d <= 2)) return 'halloween';
  if (m === 11 && d <= 6) return 'kleeschen';
  if (m === 11 || (m === 0 && d <= 6)) return 'noel';
  // Between feasts, the season of the year.
  const md = (m + 1) * 100 + d;
  if (md >= 320 && md < 621) return 'printemps';
  if (md >= 621 && md < 923) return 'ete';
  if (md >= 923 && md < 1221) return 'automne';
  return 'hiver';
}

// Pumpkins and trees are props; their lights are also redrawn over the night tint.
function pumpkin(left, base, { p, props, glows }) {
  const top = base - PUMPKIN.h * p;
  props.push({ base: Math.round(base), draw: (ctx) => drawSprite(ctx, PUMPKIN, left, top, p) });
  glows.push({ cells: PUMPKIN_FACE, left, top, p, x: left + 3.5 * p, y: top + 4 * p, r: 10 });
}

function christmasTree(left, base, env, g) {
  const { p, props, glows } = env;
  const top = base - TREE.h * p;
  const lights = (ctx, now) => {
    const step = Math.floor(now / 600);
    TREE_LIGHTS.forEach(([x, y, c], i) => {
      if ((i + step) % 3 === 0) return; // a third of them off at a time
      ctx.fillStyle = INK[c];
      ctx.fillRect(Math.round(left) + x * p, Math.round(top) + y * p, p, p);
    });
  };
  props.push({
    base: Math.round(base),
    draw: (ctx) => {
      drawSprite(ctx, TREE, left, top, p);
      lights(ctx, performance.now());
    },
  });
  glows.push({ draw: lights, x: left + 5.5 * p, y: top + 9 * p, r: 16 });
  // Presents: a big stack beside the tree, a smaller one in front of its trunk.
  const [big, small] = TREE_GIFTS;
  const giftsLeft = left + TREE.w * p - 2 * p;
  props.push({ base: Math.round(base) + 1, draw: (ctx) => drawSprite(ctx, big, giftsLeft, base - big.h * p + p, p) });
  const frontLeft = left + p;
  props.push({ base: Math.round(base) + 2, draw: (ctx) => drawSprite(ctx, small, frontLeft, base - small.h * p + 2 * p, p) });
  const width = (TREE.w + big.w - 2) * p;
  treeTrain(g, env, left + width / 2, base - p, width / 2 + 3 * p, 4 * p);
}

// Window shapes: F is the frame, S the glass repainted with the sky of the hour.
// Each room or open space draws one shape and one frame colour for all its windows.
const WINDOW_SHAPES = [
  // Classic, four panes.
  Array.from({ length: 14 }, (_, y) => (y === 0 || y === 13 || y === 6 ? 'F'.repeat(20) : `F${'S'.repeat(8)}FF${'S'.repeat(8)}F`)),
  // Wide, three panes.
  Array.from({ length: 12 }, (_, y) => (y === 0 || y === 11 ? 'F'.repeat(28) : `F${'S'.repeat(8)}F${'S'.repeat(8)}F${'S'.repeat(8)}F`)),
  // Tall and narrow, with a transom.
  Array.from({ length: 18 }, (_, y) => (y === 0 || y === 6 || y === 17 ? 'F'.repeat(10) : `F${'S'.repeat(8)}F`)),
  // Workshop glazing, small panes.
  Array.from({ length: 16 }, (_, y) => (y % 5 === 0 ? 'F'.repeat(22) : `F${'S'.repeat(6)}F${'S'.repeat(6)}F${'S'.repeat(6)}F`)),
  // Arched top.
  [
    '.....FFFFF.....',
    '...FFSSFSSFF...',
    '..FSSSSFSSSSF..',
    '.FSSSSSFSSSSSF.',
    '.FSSSSSFSSSSSF.',
    ...Array.from({ length: 4 }, () => 'FSSSSSSFSSSSSSF'),
    'F'.repeat(15),
    ...Array.from({ length: 6 }, () => 'FSSSSSSFSSSSSSF'),
    'F'.repeat(15),
  ],
];
const WINDOW_FRAMES = ['W', 'W', 'K', 'D', 'G'];

// maxCols keeps to the shapes that fit the wall, when one does.
function windowModel(random, maxCols = Infinity) {
  const pickOne = (list) => list[Math.floor(random() * list.length)];
  const frame = pickOne(WINDOW_FRAMES);
  const fitting = WINDOW_SHAPES.filter((rows) => rows[0].length <= maxCols);
  const model = sprite(pickOne(fitting.length ? fitting : WINDOW_SHAPES).map((row) => row.replaceAll('F', frame)));
  model.glass = model.cells.filter(([, , c]) => c === 'S');
  return model;
}

// Bottoms line up whatever the shape; returns the window's top.
const WINDOW_SILL = 14; // distance from the sill to the foot of the wall, at 5 px
function drawWindow(g, model, left, wall, { p, u, skies, season }) {
  const top = wall - u(WINDOW_SILL) - model.h * p;
  drawSprite(g, model, left, top, p);
  if (season === 'noel' || season === 'hiver') snowSill(g, left, top, model, p);
  skies.push({ left: Math.round(left), top: Math.round(top), model });
}

// The way in, one per room or open space: a door at the foot of the wall,
// a mat on the floor and, in the open space, a green exit sign above it.
const DOOR = sprite([
  'DDDDDDDDDDDD',
  'DOOOOOOOOOOD',
  'DOLLLLLLLLOD',
  'DOLLLLLLLLOD',
  'DOLLLLLLLLOD',
  'DOLLLLLLLLOD',
  'DOOOOOOOOOOD',
  'DOOOOOOOOOOD',
  'DODDDDDDDDOD',
  'DODOOOOOODOD',
  'DODOOOOOODYD',
  'DODOOOOOODOD',
  'DODOOOOOODOD',
  'DODOOOOOODOD',
  'DODDDDDDDDOD',
  'DOOOOOOOOOOD',
  'DDDDDDDDDDDD',
]);
const EXIT_SIGN = sprite(['PPPPPP', 'PWPPWP', 'PPPPPP']);
const doorWidth = (p) => DOOR.w * p;

function drawDoor(g, left, wall, { p, u, sign = true }) {
  const top = wall + u(4) - DOOR.h * p;
  drawSprite(g, DOOR, left, top, p);
  if (sign) drawSprite(g, EXIT_SIGN, left + 3 * p, top - 4 * p, p);
  g.fillStyle = INK.H;
  g.fillRect(Math.round(left - u(6)), Math.round(wall + u(6)), Math.round(DOOR.w * p + u(12)), Math.round(u(9)));
}

// Ambiances: a wall, a floor and the fabrics, rug colours and pots that go
// with them. Each room draws one; everything in the room follows it.
const THEMES = [
  { name: 'crème', finishes: ['wood', 'white'], wall: '#ece6d8', wallLow: '#e2dac8', wallStyle: 'plain', base: '#d3cab6',
    floor: '#f5f1e8', line: '#ebe5d8', floorStyle: 'tiles',
    fabrics: ['denim', 'mustard', 'sage'], rugs: ['terracotta', 'denim', 'cream'], pots: ['H', 'T'] },
  { name: 'sauge', finishes: ['wood', 'white'], wall: '#dde5d6', wallLow: '#cdd8c4', wallStyle: 'wainscot', base: '#b4c2a8',
    floor: '#ece1cb', line: '#ddcfb3', floorStyle: 'planks',
    fabrics: ['terracotta', 'mustard', 'rose'], rugs: ['cream', 'terracotta', 'mustard'], pots: ['T', 'H'] },
  { name: 'terracotta', finishes: ['wood'], wall: '#f1ddcf', wallLow: '#e9cdb9', wallStyle: 'plain', base: '#d6b59e',
    floor: '#f7f0e7', line: '#ecdfd2', floorStyle: 'tiles',
    fabrics: ['sage', 'denim', 'mustard'], rugs: ['sage', 'denim', 'cream'], pots: ['T', 'A'] },
  { name: 'bleu nuit', finishes: ['dark', 'wood'], wall: '#cfd8e3', wallLow: '#bcc8d6', wallStyle: 'wainscot', base: '#a3b2c4',
    floor: '#dfcdab', line: '#cfba93', floorStyle: 'planks',
    fabrics: ['mustard', 'terracotta', 'rose'], rugs: ['mustard', 'terracotta', 'cream'], pots: ['K', 'A'] },
  { name: 'scandinave', finishes: ['white'], wall: '#f3f1ec', wallLow: '#e9e6df', wallStyle: 'stripes', base: '#dcd8cf',
    floor: '#efe5d4', line: '#e3d6c0', floorStyle: 'planks',
    fabrics: ['gray', 'sage', 'rose'], rugs: ['gray', 'sage', 'rose'], pots: ['A', 'G'] },
  { name: 'rose poudré', finishes: ['white', 'wood'], wall: '#f2e2de', wallLow: '#ead2cd', wallStyle: 'stripes', base: '#d9bcb5',
    floor: '#f5eee8', line: '#ecdfd7', floorStyle: 'carpet',
    fabrics: ['sage', 'denim', 'gray'], rugs: ['sage', 'denim', 'gray'], pots: ['T', 'A'] },
];

function paintArea(g, x, y, w, h, wallH, u, theme) {
  const wallBottom = y + wallH;
  g.fillStyle = theme.wall;
  g.fillRect(x, y, w, wallH);
  g.fillStyle = theme.wallLow;
  if (theme.wallStyle === 'wainscot') {
    const rail = y + Math.round(wallH * 0.55);
    g.fillRect(x, rail, w, wallBottom - rail);
    g.fillStyle = theme.base;
    g.fillRect(x, rail, w, Math.max(2, u(3)));
  } else if (theme.wallStyle === 'stripes') {
    for (let sx = x + u(12); sx < x + w; sx += u(28)) g.fillRect(sx, y, u(12), wallH);
  }
  g.fillStyle = theme.base;
  g.fillRect(x, wallBottom - u(6), w, u(6));

  g.fillStyle = theme.floor;
  g.fillRect(x, wallBottom, w, h - wallH);
  g.fillStyle = theme.line;
  const floorH = y + h - wallBottom;
  if (theme.floorStyle === 'tiles') {
    const tile = u(56);
    for (let ty = wallBottom + tile; ty < y + h; ty += tile) g.fillRect(x, ty, w, 1);
    for (let tx = x + tile; tx < x + w; tx += tile) g.fillRect(tx, wallBottom, 1, floorH);
  } else if (theme.floorStyle === 'planks') {
    const plank = u(22);
    const length = u(150);
    for (let row = 0, ty = wallBottom; ty < y + h; row++, ty += plank) {
      g.fillRect(x, ty, w, 1);
      for (let tx = x + ((row * 59) % length); tx < x + w; tx += length) g.fillRect(tx, ty, 1, Math.min(plank, y + h - ty));
    }
  } else {
    // Carpet: a quiet, regular speckle.
    const step = u(14);
    for (let row = 0, ty = wallBottom + step / 2; ty < y + h; row++, ty += step) {
      for (let tx = x + ((row % 2) * step) / 2; tx < x + w; tx += step) g.fillRect(tx, ty, 2, 2);
    }
  }
}

const RUG_COLORS = {
  terracotta: ['#c8664a', '#efc9a8', '#e0a983'],
  denim: ['#4f6d9e', '#cdd8ea', '#a9bcd9'],
  sage: ['#6f8f6b', '#d8e6d2', '#b9d0b2'],
  mustard: ['#c4912f', '#f2dca6', '#e6c378'],
  gray: ['#8f8b82', '#e6e3dc', '#c9c5bb'],
  rose: ['#b97a7a', '#f3d9d6', '#e5b8b4'],
  cream: ['#bfae8f', '#f3ebda', '#e3d6bc'],
};
const RUG_STYLES = ['stripes', 'frame', 'checker', 'diamonds', 'round'];

// Pixel ellipse, row by row so its edge stays on the pixel grid.
function pixelEllipse(g, cx, cy, rx, ry, color, p) {
  g.fillStyle = color;
  for (let dy = -ry + p / 2; dy < ry; dy += p) {
    const half = Math.floor((rx * Math.sqrt(1 - (dy / ry) ** 2)) / p) * p;
    if (half > 0) g.fillRect(Math.round(cx - half), Math.round(cy + dy - p / 2), half * 2, p);
  }
}

function paintRug(g, cx, cy, w, h, { colors: [border, fill, accent], style }, p) {
  w = Math.round(w / p) * p;
  h = Math.round(h / p) * p;
  const left = Math.round(cx - w / 2);
  const top = Math.round(cy - h / 2);
  if (style === 'round') {
    pixelEllipse(g, cx, cy, w / 2, h / 2, border, p);
    pixelEllipse(g, cx, cy, w / 2 - p, h / 2 - p, fill, p);
    pixelEllipse(g, cx, cy, w / 2 - 3 * p, h / 2 - 3 * p, accent, p);
    pixelEllipse(g, cx, cy, w / 2 - 4 * p, h / 2 - 4 * p, fill, p);
    return;
  }
  g.fillStyle = border;
  g.fillRect(left, top, w, h);
  g.fillStyle = fill;
  g.fillRect(left + p, top + p, w - 2 * p, h - 2 * p);
  g.fillStyle = accent;
  if (style === 'stripes') {
    for (let x = left + 3 * p; x < left + w - 3 * p; x += 4 * p) g.fillRect(x, top + 2 * p, p, h - 4 * p);
  } else if (style === 'frame') {
    g.fillRect(left + 3 * p, top + 3 * p, w - 6 * p, h - 6 * p);
    g.fillStyle = fill;
    g.fillRect(left + 4 * p, top + 4 * p, w - 8 * p, h - 8 * p);
  } else if (style === 'checker') {
    const cell = 3 * p;
    for (let y = top + 2 * p, j = 0; y + cell <= top + h - 2 * p; y += cell, j++) {
      for (let x = left + 2 * p, i = 0; x + cell <= left + w - 2 * p; x += cell, i++) {
        if ((i + j) % 2) g.fillRect(x, y, cell, cell);
      }
    }
  } else if (style === 'diamonds') {
    for (let x = left + 4 * p; x <= left + w - 5 * p; x += 5 * p) {
      for (let y = top + 3 * p; y <= top + h - 6 * p; y += 5 * p) {
        g.fillRect(x + p, y, p, p);
        g.fillRect(x, y + p, 3 * p, p);
        g.fillRect(x + p, y + 2 * p, p, p);
      }
    }
  }
}

function paintNameplate(g, { name, cx, top }) {
  g.font = '600 13px ui-monospace, monospace';
  const w = Math.ceil(g.measureText(name).width) + 24;
  g.fillStyle = '#3d3929';
  g.beginPath();
  g.roundRect(Math.round(cx - w / 2), top + 8, w, 24, 6);
  g.fill();
  g.fillStyle = '#f4f1ea';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(name, cx, top + 20);
}

const CABINET = sprite([
  'GGGGGGGGGG',
  'GAAAAAAAAG',
  'GAAAKKAAAG',
  'GAAAAAAAAG',
  'GGGGGGGGGG',
  'GAAAAAAAAG',
  'GAAAKKAAAG',
  'GAAAAAAAAG',
  'GGGGGGGGGG',
  'GAAAAAAAAG',
  'GAAAKKAAAG',
  'GAAAAAAAAG',
  'GGGGGGGGGG',
]);

const PRINTER = sprite([
  '..WWWWWWWW..',
  '..WWWWWWWW..',
  'KKKKKKKKKKKK',
  'KAAAAAAAARAK',
  'KAAAAAAAAAAK',
  'KKKKKKKKKKKK',
  '.KWWWWWWWWK.',
  '.DDDDDDDDDD.',
  '.D........D.',
  '.D........D.',
  '.D........D.',
]);

const TABLE = sprite([
  '..OOOOOOOOOOOOOOOOOOOO..',
  '.OOOWWOOOOOOOOOOOOWWOOO.',
  'OOOOWWOOOOOOOOOOOOWWOOOO',
  '.DDDDDDDDDDDDDDDDDDDDDD.',
  '..........DDDD..........',
  '..........DDDD..........',
  '..........DDDD..........',
  '.........DDDDDD.........',
]);

const COOLER = sprite([
  '..SSSS..',
  '.SSSSSS.',
  '.SSSSSS.',
  '.SSSSSS.',
  '..SSSS..',
  'GGGGGGGG',
  'GWWWWWWG',
  'GWRWWBWG',
  'GWWWWWWG',
  'GWWWWWWG',
  'GWWWWWWG',
  'GWWWWWWG',
  'GGGGGGGG',
  'GG....GG',
]);


// ------------------------------------------------ furniture for the shared office

const SOFA = sprite([
  '...NNNNNNNNNNNNNNNNNN...',
  '..NBBBBBBBBNNBBBBBBBBN..',
  '..NBBBBBBBBNNBBBBBBBBN..',
  '..NBBBBBBBBNNBBBBBBBBN..',
  'NNNNNNNNNNNNNNNNNNNNNNNN',
  'NBBNBBBBBBBBBBBBBBBBNBBN',
  'NBBNBBBBBBBBBBBBBBBBNBBN',
  'NNNNNNNNNNNNNNNNNNNNNNNN',
  '.HH..................HH.',
]);

const ARMCHAIR = sprite([
  '..NNNNNNN..',
  '.NBBBBBBBN.',
  '.NBBBBBBBN.',
  'NNNNNNNNNNN',
  'NBNBBBBBNBN',
  'NBNBBBBBNBN',
  'NNNNNNNNNNN',
  '.H.......H.',
]);

const LAMP = sprite([
  '.YYYY.',
  'YYYYYY',
  'YYYYYY',
  '.KKKK.',
  ...Array(13).fill('..K...'),
  '.KKK..',
]);

const PLANT_TALL = sprite([
  '....Q.....',
  '..P.QP.Q..',
  '.PPQPPQPP.',
  'PPQPPQPPQP',
  '.QPPQPPQP.',
  'PPQPPQPQPP',
  '.PQPPQPPQ.',
  'PQPPQPPQPP',
  '.PPQPPQPP.',
  '..QPPQPQ..',
  '...QPPQ...',
  '....QP....',
  '....Q.....',
  '...HHHH...',
  '..HHHHHH..',
  '..HHHHHH..',
  '...HHHH...',
]);

const LOW_SHELF = sprite([
  'DDDDDDDDDDDDDDDD',
  'DRRBYDOOODNGGBND',
  'DRRBYDOOODNGGBND',
  'DDDDDDDDDDDDDDDD',
  'DYNNBDGRRDOOOOOD',
  'DYNNBDGRRDOOOOOD',
  'DDDDDDDDDDDDDDDD',
]);
const LOW_SHELF_PLANT = sprite([
  '...........PQ...',
  '..........PQPQ..',
  'DDDDDDDDDDDDDDDD',
  'DRRBYDOOODNGGBND',
  'DRRBYDOOODNGGBND',
  'DDDDDDDDDDDDDDDD',
  'DYNNBDGRRDOOOOOD',
  'DYNNBDGRRDOOOOOD',
  'DDDDDDDDDDDDDDDD',
]);

const PAINTING = sprite([
  'DDDDDDDDDDDD',
  'DSSSSSSSSSSD',
  'DSSSYYSSSSSD',
  'DSSSYYSSSSSD',
  'DSSSSSSSPSSD',
  'DSSSSSSPPPSD',
  'DPPSSSPPPPPD',
  'DPPPPPPPPPPD',
  'DQQQQQQQQQQD',
  'DDDDDDDDDDDD',
]);

// Small pictures for the hallways, and now and then a room.
const FRAMES = [
  sprite([ // landscape
    'DDDDDDDD',
    'DSSSSYSD',
    'DSSSSSSD',
    'DSSPSSSD',
    'DPPPPPSD',
    'DDDDDDDD',
  ]),
  sprite([ // a portrait of a Clawd
    'HHHHHHH',
    'HwwwwwH',
    'HTTTTTH',
    'HTETETH',
    'TTTTTTT',
    'HTwTwTH',
    'HHHHHHH',
  ]),
  sprite([ // abstract
    'KKKKKKK',
    'KRRWBBK',
    'KRRWBBK',
    'KWWWWWK',
    'KYYWRRK',
    'KKKKKKK',
  ]),
  sprite([ // flower
    'AAAAAA',
    'AWRWWA',
    'ARYRWA',
    'AWRWWA',
    'AWPWWA',
    'AWPPWA',
    'AAAAAA',
  ]),
];

const FRIDGE = sprite([
  'AAAAAAAAAA',
  'AWWWWWWWWA',
  'AWWWWWWGWA',
  'AWWWWWWGWA',
  'AWWWWWWWWA',
  'AAAAAAAAAA',
  'AWWWWWWWWA',
  'AWRWWWWGWA',
  'AWWWYWWGWA',
  'AWWWWWWGWA',
  'AWWWWWWWWA',
  'AWWWWWWWWA',
  'AWWWWWWWWA',
  'AWWWWWWWWA',
  'AAAAAAAAAA',
  '.AA....AA.',
]);

const BIN = sprite([
  'GGGGG',
  '.AAA.',
  '.AGA.',
  '.AGA.',
  '.AAA.',
]);

// The whiteboard on wheels, for the meeting corner.
const BOARD_STAND = sprite([
  'GGGGGGGGGGGGGGGGGGGGGGGG',
  'GWWWWWWWWWWWWWWWWWWWWWWG',
  'GWBBBWWWWRRWWWWWWWWWWWWG',
  'GWWWBWWWRWWRWWWBBBBBWWWG',
  'GWWBWWWWWRRWWWWWWWWWWWWG',
  'GWBBBBWWWWWWWBBWWWWWWWWG',
  'GWWWWWWWWWWWBWWBWWNNNWWG',
  'GWWNNNNNNWWWWBBWWWWWWWWG',
  'GGGGGGGGGGGGGGGGGGGGGGGG',
  '...G................G...',
  '...G................G...',
  '...G................G...',
  '..GGG..............GGG..',
]);


// ------------------------------------------------- bookcase and board models

const SHELF_BINDERS = sprite([
  'DDDDDDDDDDDDDDDD',
  'DNNNNIIIIGGGGOOD',
  'DNNNNIIIIGGGGOOD',
  'DNNNNIIIIGGGGOOD',
  'DDDDDDDDDDDDDDDD',
  'DTTTTUUUOOOMMMMD',
  'DTTTTUUUOOOMMMMD',
  'DTTTTUUUOOOMMMMD',
  'DDDDDDDDDDDDDDDD',
  'DOOAAAAOOOOOOOOD',
  'DOOAAAAOOGGGGOOD',
  'DOOAAAAOOGGGGOOD',
  'DDDDDDDDDDDDDDDD',
  'DD............DD',
]);

const SHELF_DECO = sprite([
  'DDDDDDDDDDDDDDDD',
  'DRRBOOOOOOPQOOOD',
  'DRRBOOOOOPQPQOOD',
  'DRRBOOOOOOHHOOOD',
  'DDDDDDDDDDDDDDDD',
  'DOOXXOOOYNNGBBOD',
  'DOOXXOOOYNNGBBOD',
  'DOXXXXOOYNNGBBOD',
  'DDDDDDDDDDDDDDDD',
  'DFFJJMMOOOOOOOOD',
  'DFFJJMMOOOWWOOOD',
  'DFFJJMMOOOWWOOOD',
  'DDDDDDDDDDDDDDDD',
  'DD............DD',
]);

const SHELVES = [SHELF, SHELF, SHELF_BINDERS, SHELF_DECO];
// Bookcase finishes: the frame (D) and back panel (O) in wood, white or dark.
const FINISHES = { wood: {}, white: { D: 'A', O: 'W' }, dark: { D: 'K', O: 'G' } };

// Whiteboard faces, shared by the wall and the rolling versions.
const BOARD_FACES = [
  [
    'GGGGGGGGGGGGGGGGGGGGGGGG',
    'GWWWWWWWWWWWWWWWWWWWWWWG',
    'GWBBBWWWWRRWWWWWWWWWWWWG',
    'GWWWBWWWRWWRWWWBBBBBWWWG',
    'GWWBWWWWWRRWWWWWWWWWWWWG',
    'GWBBBBWWWWWWWBBWWWWWWWWG',
    'GWWWWWWWWWWWBWWBWWNNNWWG',
    'GWWNNNNNNWWWWBBWWWWWWWWG',
    'GWWWWWWWWWWWWWWWWWWWWWWG',
    'GGGGGGGGGGGGGGGGGGGGGGGG',
  ],
  [ // kanban, with sticky notes
    'GGGGGGGGGGGGGGGGGGGGGGGG',
    'GWWWWWWWWWWWWWWWWWWWWWWG',
    'GWKKKKWWWKKKKWWWKKKKWWWG',
    'GWWWWWWWAWWWWWWAWWWWWWWG',
    'GWYYWWWWAXXWWWWAFFWWWWWG',
    'GWYYWYYWAXXWWWWAFFWFFWWG',
    'GWWWWYYWAWWWXXWAWWWFFWWG',
    'GWYYWWWWAWWWXXWAWWWWWWWG',
    'GWYYWWWWAWWWWWWAWWWWWWWG',
    'GGGGGGGGGGGGGGGGGGGGGGGG',
  ],
  [ // bar chart and a trend line
    'GGGGGGGGGGGGGGGGGGGGGGGG',
    'GWWWWWWWWWWWWWWWWWWWWWWG',
    'GWKWWWWWWWWWWWWWWWRWWWWG',
    'GWKWWWWWWWWWWWWWRRWRWWWG',
    'GWKWWWWBWWWWWRRWWWWWRWWG',
    'GWKWWBWBWWBWRWWWWWWWWWWG',
    'GWKWWBWBWWBWBWWWWWWWWWWG',
    'GWKBWBWBWWBWBWBWWWWWWWWG',
    'GWKKKKKKKKKKKKKKWWWWWWWG',
    'GGGGGGGGGGGGGGGGGGGGGGGG',
  ],
  [ // cork board, pinned notes
    'DDDDDDDDDDDDDDDDDDDDDDDD',
    'DOOOOOOOOOOOOOOOOOOOOOOD',
    'DOWWWOOORYYOOOOWWWWOOOOD',
    'DOWWWOOOOYYOOOOWWWWOXXOD',
    'DOWWWOROOOOOFFOWWWWOXXOD',
    'DOOOOOWWWWOOFFOOOOOOOOOD',
    'DORYYOWWWWOOOOOOBWWWOOOD',
    'DOOYYOWWWWOOOOOOWWWWOOOD',
    'DOOOOOOOOOOOOOOOOOOOOOOD',
    'DDDDDDDDDDDDDDDDDDDDDDDD',
  ],
];
const BOARDS = BOARD_FACES.map((face, i) => sprite([...face, i === 3 ? '.'.repeat(24) : '..GGGGGGGGGGGGGGGGGGGG..']));
const BOARD_STANDS = BOARD_FACES.map((face) => sprite([
  ...face,
  '...G................G...',
  '...G................G...',
  '...G................G...',
  '..GGG..............GGG..',
]));


// ------------------------------------------------------------- more models

const CACTUS = sprite([
  '...PQ...',
  '...PQ.P.',
  '.P.PQ.PQ',
  '.PQPQ.PQ',
  '.PQPQPPQ',
  '..QPQQ..',
  '...PQ...',
  '...PQ...',
  '.HHHHHH.',
  '.HHHHHH.',
  '..HHHH..',
]);

const SNAKE_PLANT = sprite([
  '.Y....Y.',
  '.PY..YP.',
  '.PP.YPP.',
  'YPP.PPPY',
  'PPQ.PQPP',
  'PQQPPQQP',
  'PQPPQQPP',
  '.QPQPQP.',
  '.HHHHHH.',
  '.HHHHHH.',
  '..HHHH..',
]);

const FLOWERS = sprite([
  '..R...Y.',
  '.RYR.YRY',
  '..R.P.Y.',
  '.P.PPP..',
  'PPQPQPP.',
  '.QPPQP..',
  '..HHHH..',
  '..HHHH..',
  '...HH...',
]);

const PALM = sprite([
  'P.......Q.',
  '.PP...QQ..',
  '..PPQQP...',
  'PPPQPQPPPQ',
  '..QPPPQ...',
  '.Q..P..PP.',
  'Q...D....Q',
  '....D.....',
  '....D.....',
  '....D.....',
  '...DD.....',
  '....D.....',
  '....D.....',
  '...HHHH...',
  '..HHHHHH..',
  '..HHHHHH..',
  '...HHHH...',
]);

const MONSTERA = sprite([
  '...PP..QQ...',
  '..PPPP.QQQ..',
  '.PP.PPQQ.QQ.',
  '.PPPP..QQQQ.',
  'PP.PPPQQ.QQQ',
  '.PPP.QQQQQ..',
  '..PPQQP.PP..',
  '.QQ.PQ.PPPP.',
  'QQQQ.Q.P.PP.',
  '.QQ..Q..PP..',
  '.....Q......',
  '....HHHH....',
  '...HHHHHH...',
  '...HHHHHH...',
  '....HHHH....',
]);

const ARMCHAIR_ROUND = sprite([
  '...NNNNN...',
  '.NNBBBBBNN.',
  'NBBBBBBBBBN',
  'NBNNNNNNNBN',
  'NBBBBBBBBBN',
  '.NBBBBBBBN.',
  '..NNNNNNN..',
  '...H...H...',
]);

const WINGBACK = sprite([
  '.NNNNNNNNN.',
  'NNBBBBBBBNN',
  'NNBBBBBBBNN',
  'NNBBBBBBBNN',
  'NNNNNNNNNNN',
  'NBNBBBBBNBN',
  'NBNBBBBBNBN',
  'NNNNNNNNNNN',
  '.D.......D.',
  '.D.......D.',
]);

const ARMCHAIR_WOOD = sprite([
  '..BBBBBBBB..',
  '..BBBBBBBB..',
  '..BBBBBBBB..',
  'DDDDDDDDDDDD',
  'DBBBBBBBBBBD',
  'DDDDDDDDDDDD',
  '.D........D.',
  'D..........D',
]);

const SOFA_WOOD = sprite([
  '..NNNNNNNNNNNNNNNNNNNN..',
  '..NBBBBBBBBBNBBBBBBBBN..',
  '..NBBBBBBBBBNBBBBBBBBN..',
  'DDDDDDDDDDDDDDDDDDDDDDDD',
  'DBBBBBBBBBBBBBBBBBBBBBBD',
  'DDDDDDDDDDDDDDDDDDDDDDDD',
  '.D....................D.',
  'D......................D',
]);

// Row where a sitting Clawd's feet rest, per seat model.
SOFA.seat = 7;
SOFA_WOOD.seat = 5;
ARMCHAIR.seat = 6;
ARMCHAIR_ROUND.seat = 5;
WINGBACK.seat = 7;
ARMCHAIR_WOOD.seat = 5;

const PLANTS = [PLANT, PLANT, CACTUS, SNAKE_PLANT, FLOWERS];
const TALL_PLANTS = [PLANT_TALL, PALM, MONSTERA];
const ARMCHAIRS = [ARMCHAIR, ARMCHAIR_ROUND, WINGBACK, ARMCHAIR_WOOD];
const SOFAS = [SOFA, SOFA_WOOD];

const FABRICS = {
  denim: { B: 'I', N: 'N' },
  terracotta: { B: 'T', N: 'U' },
  mustard: { B: 'M', N: 'V' },
  sage: { B: 'F', N: 'J' },
  rose: { B: 'X', N: 'Z' },
  gray: { B: 'A', N: 'G' },
};

function mirror(s) {
  return { ...s, cells: s.cells.map(([x, y, c]) => [s.w - 1 - x, y, c]) };
}
const SIDE_DESK_LEFT = mirror(SIDE_DESK);

// Desk lamp, switched on at night when someone works at the desk.
const DESK_LAMP = sprite([
  '..YYY',
  '.YYYY',
  '...K.',
  '..K..',
  '..K..',
  '.KKK.',
]);
const DESK_LAMP_LEFT = mirror(DESK_LAMP);

// Each desk gets for good either a lamp or the screen's backlight, picked from
// its position so the decor's random draws stay untouched.
const lightKind = (x, y) => ((Math.round(x) * 7 + Math.round(y) * 13) % 5 < 2 ? 'lamp' : 'screen');

// Front desk: the monitor's back is on the left (rows 0-4), the mug on the right.
function frontDeskLight(left, top, p) {
  const kind = lightKind(left, top);
  if (kind === 'lamp') return { kind, x: left + 22 * p, y: top + 1 * p, lamp: { s: DESK_LAMP, left: left + 21 * p, top: top + 1 * p }, p };
  return { kind, x: left + 8 * p, y: top + 2.5 * p, p };
}

// Side desk, Clawd on the left when side is 1: the screen at the far end faces it.
function sideDeskLight(left, top, p, side) {
  const kind = lightKind(left, top);
  const col = (c) => left + (side > 0 ? c : SIDE_DESK.w - 1 - c) * p;
  if (kind === 'lamp') {
    const lampLeft = side > 0 ? col(4) : col(8);
    return { kind, x: col(6), y: top + 2 * p, lamp: { s: side > 0 ? DESK_LAMP : DESK_LAMP_LEFT, left: lampLeft, top: top + 1 * p }, p };
  }
  return { kind, x: col(8) + p / 2, y: top + 2.5 * p, p };
}

// Floor lamp standing at (left, base), switched on by whoever reads or thinks nearby.
// Only its shade is redrawn lit, so the pole never covers a Clawd in front.
const LAMP_SHADE = { ...LAMP, cells: LAMP.cells.filter(([, y]) => y < 3) };
function floorLamp(left, base, p) {
  const top = base - LAMP.h * p;
  return { kind: 'floor', x: left + 3 * p, y: top + 1.5 * p, lamp: { s: LAMP_SHADE, left, top }, p };
}

// Glow of a work light, drawn over the night tint so it stays bright.
export function drawLight(ctx, light, night) {
  const { kind, x, y, lamp, p } = light;
  const warm = kind !== 'screen';
  const r = { lamp: 20, screen: 16, floor: 34 }[kind] * p;
  const [cr, cg, cb] = warm ? [255, 210, 120] : [170, 210, 255];
  const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
  glow.addColorStop(0, `rgb(${cr} ${cg} ${cb} / ${(warm ? 0.5 : 0.42) * night})`);
  glow.addColorStop(1, `rgb(${cr} ${cg} ${cb} / 0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  if (lamp) drawSprite(ctx, lamp.s, lamp.left, lamp.top, p);
}

// Same palette keys, other colours: beanbags come in a few fabrics.
function recolor(s, map) {
  return { ...s, cells: s.cells.map(([x, y, c]) => [x, y, map[c] ?? c]) };
}
// Picks models and colours for one room, always within its ambiance.
function dressing(theme, random) {
  const pickOne = (list) => list[Math.floor(random() * list.length)];
  const pot = (model) => recolor(model, { H: pickOne(theme.pots) });
  const upholster = (model) => {
    const out = recolor(model, FABRICS[pickOne(theme.fabrics)]);
    out.seat = model.seat;
    return out;
  };
  // One finish per room, so its bookcases match.
  const finish = FINISHES[pickOne(theme.finishes)];
  return {
    shelf: () => recolor(pickOne(SHELVES), finish),
    lowShelf: (withPlant) => recolor(withPlant ? LOW_SHELF_PLANT : LOW_SHELF, finish),
    board: () => pickOne(BOARDS),
    boardStand: () => pickOne(BOARD_STANDS),
    plant: () => pot(pickOne(PLANTS)),
    tallPlant: () => pot(pickOne(TALL_PLANTS)),
    armchair: () => upholster(pickOne(ARMCHAIRS)),
    sofa: () => upholster(pickOne(SOFAS)),
    beanbag: () => upholster(BEANBAG),
    rug: () => ({ colors: RUG_COLORS[pickOne(theme.rugs)], style: pickOne(RUG_STYLES) }),
  };
}

// Seeded generator (mulberry32): a session keeps the same layout across rebuilds.
function seeded(text) {
  let a = 2166136261;
  for (let i = 0; i < text.length; i++) a = Math.imul(a ^ text.charCodeAt(i), 16777619);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STATIONS = ['desk', 'shelf', 'board', 'coffee', 'chat', 'radio', 'beanbag', 'rug', 'front'];

// Furnishes one area (a room, or the whole shared office) and returns its
// walkable zone and stations. Every station type always exists; quantities and
// positions vary with the seed, which keeps a layout stable across rebuilds.
function furnish(g, { x0, x1, top, bottom, name, seed, maxPerRow, maxRows }, env) {
  const { p, u, props, clocks, skies, lamps, season } = env;
  const W = x1 - x0;
  const wallH = u(110);
  const wall = top + wallH;
  const floorBottom = bottom - Math.max(20, u(28)); // room for the names under the feet
  const floor = floorBottom - wall;
  const random = seeded(seed);
  const between = (a, b) => a + random() * (b - a);
  const int = (a, b) => Math.floor(between(a, b + 1));
  const chance = (q) => random() < q;
  const pickOne = (list) => list[Math.floor(random() * list.length)];
  const theme = pickOne(THEMES);
  const look = dressing(theme, random);

  paintArea(g, x0, top, W, bottom - top, wallH, u, theme);
  // On the wall above the room, like a door sign; drawn last, over windows and furniture.
  if (name) env.plates.push({ name, cx: (x0 + x1) / 2, top: top - 14 });

  const stations = Object.fromEntries(STATIONS.map((type) => [type, []]));
  // perScale and dxPerScale shift the spot with the Clawd's size, so its hands
  // land on the same furniture whether it is a main agent or a subagent.
  const slot = (type, x, y, perScale = 0, { dxPerScale = 0, dir = 1, anims, light } = {}) => stations[type].push({
    type,
    occupant: null,
    dir,
    anims,
    light,
    spot: (scale) => ({ x: Math.round(x + dxPerScale * scale), y: Math.round(y + perScale * scale) }),
  });

  // Floor footprints already used, so scattered items keep clear of furniture and stations.
  const taken = [];
  const reserve = (x, y, w, h) => taken.push({ x, y, w, h });
  const fits = (x, y, w, h) => x >= x0 + u(8) && x + w <= x1 - u(8) &&
    taken.every((r) => x + w <= r.x || r.x + r.w <= x || y + h <= r.y || r.y + r.h <= y);
  const prop = (s, left, top) => {
    props.push({ base: Math.round(top) + s.h * p, draw: (ctx) => drawSprite(ctx, s, left, top, p) });
  };
  const standing = (s, left, base) => prop(s, left, base - s.h * p);
  // A free patch of floor w x h, reserved; null when nothing fits.
  const freeSpot = (w, h, yMin, yMax, tries = 30) => {
    while (tries-- > 0) {
      const left = between(x0 + u(16), x1 - u(16) - w);
      const base = between(yMin, yMax);
      if (!fits(left - u(10), base - h, w + u(20), h + u(10))) continue;
      reserve(left - u(10), base - h, w + u(20), h + u(10));
      return { left, base };
    }
    return null;
  };
  const scatter = (s, yMin, yMax) => {
    const at = freeSpot(s.w * p, s.h * p, yMin, yMax);
    if (at) standing(s, at.left, at.base);
  };

  // Along the wall, left: the door in the corner, bookshelves, the whiteboard.
  const backBase = wall + u(16);
  const inFront = backBase + u(36);
  let cursor = x0 + ROOM_DOOR(u);
  const doorLeft = cursor;
  drawDoor(g, cursor, wall, { p, u, sign: false });
  if (season === 'halloween') pumpkin(cursor + doorWidth(p) + u(2), wall + u(26), env);
  cursor += doorWidth(p) + u(20);
  const shelfCount = int(1, W >= u(900) ? 3 : W >= u(560) ? 2 : 1);
  const firstShelf = cursor;
  for (let i = 0; i < shelfCount; i++) {
    standing(look.shelf(), cursor, backBase);
    slot('shelf', cursor + u(40), inFront);
    cursor += SHELF.w * p + u(int(6, 16));
  }
  const boardLeft = cursor + u(between(30, 60));
  // A floor lamp in the gap between the shelves and the whiteboard, for both.
  const reading = floorLamp((cursor + boardLeft) / 2 - (LAMP.w * p) / 2, backBase, p);
  standing(LAMP, reading.lamp.left, backBase);
  for (let i = 0; i < shelfCount; i++) stations.shelf[stations.shelf.length - 1 - i].light = reading;
  if (shelfCount === 1) slot('shelf', cursor + u(50), inFront, 0, { light: reading });
  drawSprite(g, look.board(), boardLeft, wall - u(18) - BOARD.h * p, p);
  slot('board', boardLeft + u(30), wall + u(44), 0, { light: reading });
  slot('board', boardLeft + u(120), wall + u(44), 0, { light: reading });

  // Along the wall, right: coffee corner, maybe a plant if a window still fits.
  const winFrom = boardLeft + BOARD.w * p + u(40);
  let right = x1 - u(28) - COUNTER.w * p;
  coffeeCorner(right, backBase, inFront, { g, ceiling: top, lamps, p, u, standing, slot, stations });
  const plant = chance(0.3) ? look.plant() : null;
  if (plant && right - u(46) - plant.w * p - winFrom >= 10 * p + u(20)) {
    right -= u(16) + plant.w * p;
    standing(plant, right, backBase);
  }
  slot('coffee', right - u(70), inFront);
  const withClock = chance(0.85);
  reserve(x0, wall, W, u(60));

  const winTo = right - u(30);
  // As many windows as fit, of one shape, evenly spaced; the clock in the
  // widest stretch of bare wall left.
  const span = winTo - winFrom;
  const pane = windowModel(random, (span - u(20)) / p);
  const paneW = pane.w * p;
  const fit = Math.max(0, Math.floor((span + u(30)) / (paneW + u(30))));
  const panes = fit >= 2 && chance(0.3) ? fit - 1 : fit;
  const space = Math.max(0, span - panes * paneW) / (panes + 1);
  let at = winFrom + space;
  const bare = [{ x: winFrom + space / 2, w: space }];
  for (let i = 0; i < panes; i++) {
    drawWindow(g, pane, at, wall, { p, u, skies, season });
    at += paneW;
    bare.push({ x: at + space / 2, w: space });
    at += space;
  }
  const widest = bare.reduce((a, b) => (b.w > a.w ? b : a));
  if (withClock && widest.w >= u(56)) clocks.push({ x: widest.x, y: top + Math.round(wallH * between(0.4, 0.55)) });
  // No bare wall wide enough: higher up, over the first bookshelf.
  else if (withClock) clocks.push({ x: firstShelf + (SHELF.w * p) / 2, y: top + Math.round(wallH * 0.28) });
  // Another stretch of bare wall for the season (a ghost, stockings), and
  // now and then a small picture.
  const spare = bare.filter((b) => b !== widest && b.w >= u(60));
  const seasonSpot = season && spare.length ? spare.splice(Math.floor(random() * spare.length), 1)[0] : null;
  if (spare.length && chance(0.3)) {
    const frame = pickOne(FRAMES);
    const at = pickOne(spare);
    drawSprite(g, frame, Math.round(at.x - (frame.w * p) / 2), Math.round(top + wallH * 0.38), p);
  }
  seasonWall(g, env, { x0, x1, top, wall, door: { left: doorLeft, top: wall + u(4) - DOOR.h * p }, spot: seasonSpot });

  // Vertical plan: desk rows, then a middle band (meeting table, radio), then the
  // play area at the bottom. Rows are added while they fit; spare height is shared.
  const lead = u(40);
  const rowH = u(150);
  const middleH = u(100);
  const bottomH = u(140);
  const rows = clamp(Math.floor((floor - lead - middleH - bottomH) / rowH), 1, maxRows);
  const gap = Math.max(0, floor - lead - middleH - bottomH - rows * rowH) / (rows + 2);

  // Desk rows: front-facing rows, or islands of two side desks facing each other;
  // some seats missing, rows shifted, odd furniture at the ends.
  const deskW = DESK.w * p;
  const deskUnit = deskW + u(24);
  const islandUnit = u(300);
  const maxDesks = clamp(Math.floor((W - u(200)) / deskUnit), 1, maxPerRow);
  const maxIslands = clamp(Math.floor((W - u(200)) / islandUnit), 1, Math.ceil(maxPerRow / 2));
  const printerRow = int(0, rows - 1);
  for (let r = 0; r < rows; r++) {
    const deskTop = wall + lead + gap + r * (rowH + gap) + u(between(-10, 10));
    const side = chance(0.4);
    const count = side ? int(Math.max(1, maxIslands - 1), maxIslands) : int(Math.max(1, maxDesks - 1), maxDesks);
    const unit = side ? islandUnit : deskUnit;
    const rowWidth = count * unit - (side ? u(40) : u(24));
    const start = clamp(x0 + (W - rowWidth) / 2 + u(between(-50, 50)), x0 + u(100), x1 - u(100) - rowWidth);
    let rowBase = deskTop + DESK.h * p;
    let placed = 0;
    for (let i = 0; i < count; i++) {
      const left = start + i * unit;
      if (!side) {
        if (placed > 0 && chance(0.15)) continue;
        prop(DESK, left, deskTop);
        // Feet just behind the desk, so the animation's keyboard lands on the desktop.
        slot('desk', left + 18 * p, deskTop + (DESK_SURFACE + 1) * p, 2, { light: frontDeskLight(left, deskTop, p) });
        placed++;
        continue;
      }
      // Island: Clawd | desk | desk | Clawd. Desks are drawn before the Clawds
      // (lower base), so the typing hand stays on top of the keyboard.
      const islandTop = deskTop + u(15);
      const keys = islandTop + SIDE_KEYS * p;
      const sideBase = keys + 2 * p;
      const leftDesk = left + u(60);
      const rightDesk = leftDesk + SIDE_DESK.w * p;
      props.push({ base: sideBase, draw: (ctx) => drawSprite(ctx, SIDE_DESK, leftDesk, islandTop, p) });
      props.push({ base: sideBase, draw: (ctx) => drawSprite(ctx, SIDE_DESK_LEFT, rightDesk, islandTop, p) });
      slot('desk', leftDesk, keys, 5, { dxPerScale: -4.5, anims: ['type-side'], light: sideDeskLight(leftDesk, islandTop, p, 1) });
      slot('desk', rightDesk + SIDE_DESK.w * p, keys, 5, { dxPerScale: 3.5, dir: -1, anims: ['type-side'], light: sideDeskLight(rightDesk, islandTop, p, -1) });
      rowBase = islandTop + SIDE_DESK.h * p;
    }
    // The row and whatever stands at its ends.
    reserve(start - u(100), deskTop - u(50), rowWidth + u(200), rowBase - deskTop + u(60));
    if (start - x0 >= u(90) && chance(0.7)) standing(pickOne([CABINET, CABINET, look.plant()]), start - u(24) - CABINET.w * p, rowBase);
    if (x1 - (start + rowWidth) >= u(90)) {
      if (r === printerRow) standing(PRINTER, start + rowWidth + u(24), rowBase);
      else if (chance(0.6)) standing(pickOne([look.plant(), CABINET]), start + rowWidth + u(24), rowBase);
    }
  }

  // Middle and bottom bands, repeated per section of the width so a wide shared
  // office gets several meeting tables, radios and rugs.
  const middle = wall + lead + gap + rows * (rowH + gap) + u(80) + u(between(-10, 10));
  const sections = clamp(Math.floor(W / u(700)), 1, 3);
  const sectionW = W / sections;
  for (let i = 0; i < sections; i++) {
    const sx0 = x0 + i * sectionW;
    const sx1 = sx0 + sectionW;

    // Meeting table (more room to think) and the listening corner.
    const tableX = sx0 + sectionW * between(0.22, 0.42);
    const tableTop = middle - TABLE.h * p + u(between(-15, 15));
    const tableBase = tableTop + TABLE.h * p;
    prop(TABLE, tableX - (TABLE.w * p) / 2, tableTop);
    env.tables.push({ left: tableX - (TABLE.w * p) / 2, top: tableTop });
    slot('board', tableX, tableTop + u(12));
    slot('board', tableX - u(95), tableBase - u(6));
    slot('board', tableX + u(95), tableBase - u(6));
    reserve(tableX - u(150), tableTop - u(50), u(300), TABLE.h * p + u(60));

    const radioLeft = sx1 - u(between(170, 240));
    const radioBase = middle + u(between(-20, 20));
    standing(RADIO, radioLeft, radioBase);
    slot('radio', radioLeft - u(40), radioBase - u(4));
    slot('radio', radioLeft + RADIO.w * p + u(40), radioBase - u(4));
    reserve(radioLeft - u(90), radioBase - u(110), RADIO.w * p + u(180), u(120));

    // Play rug and beanbags.
    const rugW = Math.round(clamp(sectionW * between(0.25, 0.35), u(160), u(320)));
    const rugH = int(14, 18) * p;
    const rugX = sx0 + sectionW * between(0.55, 0.68);
    const rugY = floorBottom - u(105) + u(between(-10, 10));
    paintRug(g, rugX, rugY, rugW, rugH, look.rug(), p);
    for (const dx of [-rugW / 3, 0, rugW / 3]) slot('rug', rugX + dx, rugY + u(10));
    reserve(rugX - rugW / 2 - u(20), rugY - rugH / 2 - u(60), rugW + u(40), rugH + u(70));

    if (i > 0 && chance(0.5)) continue;
    const bagBase = floorBottom - u(8);
    const bags = int(1, 3);
    for (let b = 0; b < bags; b++) {
      const left = sx0 + u(28) + b * (BEANBAG.w * p + u(int(14, 30)));
      standing(look.beanbag(), left, bagBase);
      slot('beanbag', left + u(35), bagBase - 2 * p);
      reserve(left - u(10), bagBase - u(80), BEANBAG.w * p + u(20), u(80));
    }
  }

  const fronts = clamp(Math.floor((W * 0.4) / u(110)), 3, 8);
  for (let i = 0; i < fronts; i++) slot('front', x0 + W * 0.25 + i * u(110), floorBottom - u(2));
  reserve(x0 + W * 0.22, floorBottom - u(110), fronts * u(110) + W * 0.06, u(110));

  // The season's decorations, on free floor before the plants take it.
  if (season === 'halloween') {
    const at = freeSpot(PUMPKIN.w * p, PUMPKIN.h * p, wall + u(100), floorBottom - u(4), 100);
    if (at) pumpkin(at.left, at.base, env);
  }
  if (season === 'noel') {
    const at = freeSpot(TREE.w * p + TREE_GIFTS[0].w * p, TREE.h * p, wall + u(100), floorBottom - u(4), 200);
    if (at) christmasTree(at.left, at.base, env, g);
  }
  const floorArea = { x0: x0 + u(40), x1: x1 - u(40), y0: wall + u(70), y1: floorBottom - u(8) };
  seasonFloor(env, (s) => {
    const at = freeSpot(s.w * p, s.h * p, wall + u(100), floorBottom - u(4), 100);
    return at && { left: at.left, top: at.base - s.h * p };
  }, g, floorArea);
  seasonCritters(env, floorArea);
  wallSpiders(env, x0, x1, top, wall);

  for (let i = int(2, 5) * sections; i > 0; i--) scatter(look.plant(), wall + u(80), floorBottom - u(4));
  if (chance(0.5)) scatter(CABINET, wall + floor * 0.5, floorBottom - u(4));

  return { x0: x0 + u(8), x1: x1 - u(8), y0: wall + u(24), y1: floorBottom, stations };
}


// The shared office, laid out like an interior designer would: library and
// meeting corner on the left, islands of desks in the middle split by low
// bookcases, kitchen and lounge on the right, a clear walkway at the front.
// Structured rather than scattered; the seed only picks variants and fabrics.
function furnishShared(g, { x0, x1, top, bottom }, env) {
  const { p, u, props, clocks, skies, lamps, season } = env;
  const W = x1 - x0;
  const wallH = u(110);
  const wall = top + wallH;
  const floorBottom = bottom - Math.max(20, u(28));
  // Redecorated once a day.
  const random = seeded(`${env.salt}shared-office ${new Date().toDateString()}`);
  const between = (a, b) => a + random() * (b - a);
  const int = (a, b) => Math.floor(between(a, b + 1));
  const pickOne = (list) => list[Math.floor(random() * list.length)];
  const theme = pickOne(THEMES);
  const look = dressing(theme, random);

  paintArea(g, x0, top, W, bottom - top, wallH, u, theme);

  const stations = Object.fromEntries(STATIONS.map((type) => [type, []]));
  const slot = (type, x, y, perScale = 0, { dxPerScale = 0, dir = 1, anims, light } = {}) => stations[type].push({
    type,
    occupant: null,
    dir,
    anims,
    light,
    spot: (scale) => ({ x: Math.round(x + dxPerScale * scale), y: Math.round(y + perScale * scale) }),
  });
  // `sortAt` overrides the depth used for sorting (seats are drawn behind who sits in them).
  const prop = (s, left, top, sortAt) => {
    props.push({ base: Math.round(sortAt ?? top + s.h * p), draw: (ctx) => drawSprite(ctx, s, left, top, p) });
  };
  const standing = (s, left, base) => prop(s, left, base - s.h * p);
  const centered = (s, cx, base) => standing(s, cx - (s.w * p) / 2, base);
  // One model per corner, so pairs of seats match.
  const sofa = look.sofa();
  const armchair = look.armchair();
  const readingChair = look.armchair();
  const cafeChair = look.armchair();
  // Seats are drawn behind who sits in them.
  const seat = (chair, cx, top, type) => {
    prop(chair, cx - (chair.w * p) / 2, top, top + 2 * p);
    slot(type, cx, top + chair.seat * p);
  };

  // A loose hedge along x between from and to: small clumps of one to three
  // items, irregularly spaced, sometimes missing, never in a straight line.
  const hedge = (x, from, to, items) => {
    for (let y = from + u(between(0, 60)); y <= to; y += u(between(130, 260))) {
      if (random() < 0.2) continue;
      // Each item half a height lower than the last, stepping left and right.
      const n = int(1, 3);
      let base = y;
      let side = random() < 0.5 ? -1 : 1;
      for (let k = 0; k < n && base <= to; k++) {
        const s = pickOne(items)();
        standing(s, x - (s.w * p) / 2 + (n > 1 ? side * u(between(20, 34)) : u(between(-18, 18))), base);
        base += (s.h * p) / 2 + u(between(8, 16));
        side = -side;
      }
    }
  };

  const leftW = Math.round(clamp(W * 0.2, u(300), u(440)));
  const rightW = Math.round(clamp(W * 0.31, u(400), u(620)));
  const lx1 = x0 + leftW;
  const rx0 = x1 - rightW;
  const floorTop = wall + u(30);
  const walkway = u(130); // kept clear at the front, for agents waiting for input
  const floorEnd = floorBottom - walkway;
  const backBase = wall + u(16);
  const inFront = backBase + u(36);

  // ---- Left: library along the wall, meeting corner, reading corner.
  const cornerPlant = look.tallPlant();
  standing(cornerPlant, x0 + u(16), backBase);
  const shelfStart = x0 + u(16) + cornerPlant.w * p + u(10);
  const shelves = clamp(Math.floor((lx1 - u(30) - shelfStart) / (SHELF.w * p + u(4))), 1, 4);
  const library = floorLamp(shelfStart + shelves * (SHELF.w * p + u(4)) + u(4), backBase, p);
  standing(LAMP, library.lamp.left, backBase);
  for (let i = 0; i < shelves; i++) {
    const left = shelfStart + i * (SHELF.w * p + u(4));
    standing(look.shelf(), left, backBase);
    slot('shelf', left + u(40), inFront, 0, { light: library });
  }

  const leftMid = (x0 + lx1) / 2;
  const tableBase = floorTop + u(170);
  paintRug(g, leftMid, tableBase - u(18), u(200), u(85), look.rug(), p);
  centered(TABLE, leftMid, tableBase);
  env.tables.push({ left: leftMid - (TABLE.w * p) / 2, top: tableBase - TABLE.h * p });
  const boardBase = tableBase + u(110);
  const stand = look.boardStand();
  const thinking = floorLamp(leftMid + (stand.w * p) / 2 + u(14), boardBase, p);
  slot('board', leftMid, tableBase - TABLE.h * p + u(12), 0, { light: thinking });
  slot('board', leftMid - u(95), tableBase - u(6), 0, { light: thinking });
  slot('board', leftMid + u(95), tableBase - u(6), 0, { light: thinking });
  centered(stand, leftMid, boardBase);
  standing(LAMP, thinking.lamp.left, boardBase);
  slot('board', leftMid - u(40), boardBase + u(30), 0, { light: thinking });
  slot('board', leftMid + u(40), boardBase + u(30), 0, { light: thinking });

  const copyBase = floorEnd - u(10);
  const readBase = Math.min(Math.max(boardBase + u(190), (boardBase + copyBase) / 2 + u(20)), floorEnd);
  paintRug(g, x0 + u(150), readBase - u(14), u(270), u(70), look.rug(), p);
  standing(look.lowShelf(true), x0 + u(20), readBase);
  slot('shelf', x0 + u(60), readBase + u(34));
  seat(readingChair, x0 + u(158), readBase - readingChair.h * p, 'beanbag');
  standing(LAMP, x0 + u(195), readBase);
  lamps.push({ x: x0 + u(195) + 3 * p, y: readBase - LAMP.h * p + 1.5 * p });
  if (lx1 - x0 >= u(360)) seat(readingChair, x0 + u(263), readBase - readingChair.h * p, 'beanbag');

  // Copy corner, low on the left: printer between filing cabinets.
  if (copyBase - readBase >= u(150)) {
    standing(CABINET, x0 + u(24), copyBase);
    standing(PRINTER, x0 + u(24) + CABINET.w * p + u(14), copyBase);
    standing(CABINET, x0 + u(24) + CABINET.w * p + PRINTER.w * p + u(28), copyBase);
    standing(BIN, x0 + u(24) + 2 * CABINET.w * p + PRINTER.w * p + u(42), copyBase);
  }

  // Divider between the library and the desks: low bookcases, spaced like a hedge.
  hedge(lx1, floorTop + u(90), floorEnd, [() => look.lowShelf(true), () => look.lowShelf(false), look.plant]);

  // ---- Right: kitchen along the wall, lounge in the middle of the zone.
  let kitchen = x1 - u(20) - FRIDGE.w * p;
  standing(FRIDGE, kitchen, backBase);
  slot('coffee', kitchen + u(25), inFront + u(10));
  kitchen -= u(12) + COUNTER.w * p;
  coffeeCorner(kitchen, backBase, inFront, { g, ceiling: top, lamps, p, u, standing, slot, stations });
  kitchen -= u(12) + COOLER.w * p;
  standing(COOLER, kitchen, backBase);
  slot('coffee', kitchen + u(20), inFront);
  const kitchenPlant = look.plant();
  kitchen -= u(16) + kitchenPlant.w * p;
  standing(kitchenPlant, kitchen, backBase);
  drawSprite(g, PAINTING, kitchen - u(30) - PAINTING.w * p, wall - u(90), p);

  const loungeX = rx0 + rightW * between(0.45, 0.55);
  const rugW = Math.min(rightW - u(100), u(300));
  const rugH = u(90);
  const rugY = floorTop + (floorEnd - floorTop) * 0.55;
  paintRug(g, loungeX, rugY, rugW, rugH, look.rug(), p);
  for (const dx of [-rugW / 3, 0, rugW / 3]) slot('rug', loungeX + dx, rugY + u(10));

  const sofaTop = rugY - rugH / 2 - sofa.h * p + u(10);
  const sofaBase = sofaTop + sofa.h * p;
  prop(sofa, loungeX - (sofa.w * p) / 2, sofaTop, sofaTop + 2 * p);
  for (const dx of [-u(30), u(30)]) slot('beanbag', loungeX + dx, sofaTop + sofa.seat * p);
  standing(LAMP, loungeX - (sofa.w * p) / 2 - u(40), sofaBase);
  lamps.push({ x: loungeX - (sofa.w * p) / 2 - u(40) + 3 * p, y: sofaBase - LAMP.h * p + 1.5 * p });
  const radioLeft = loungeX + (sofa.w * p) / 2 + u(14);
  standing(RADIO, radioLeft, sofaBase);
  slot('radio', radioLeft + RADIO.w * p + u(40), sofaBase - u(4));
  slot('radio', radioLeft + u(30), sofaBase + u(40));

  for (const side of [-1, 1]) {
    const cx = loungeX + side * (rugW / 2 + u(40));
    if (cx - (armchair.w * p) / 2 < rx0 + u(30) || cx + (armchair.w * p) / 2 > x1 - u(10)) continue;
    seat(armchair, cx, rugY - (armchair.h * p) / 2, 'beanbag');
  }
  const bags = int(2, 3);
  for (let i = 0; i < bags; i++) {
    const cx = loungeX + (i - (bags - 1) / 2) * u(90);
    const base = rugY + rugH / 2 + u(70);
    centered(look.beanbag(), cx, base);
    slot('beanbag', cx, base - 2 * p);
  }

  // Café corner under the lounge: a table between two armchairs, a plant.
  const cafeBase = rugY + rugH / 2 + u(230);
  if (cafeBase <= floorEnd) {
    const cafeX = clamp(loungeX + u(between(-50, 50)), rx0 + u(140), x1 - u(160));
    centered(TABLE, cafeX, cafeBase);
    env.tables.push({ left: cafeX - (TABLE.w * p) / 2, top: cafeBase - TABLE.h * p });
    for (const side of [-1, 1]) {
      const cx = cafeX + side * u(100);
      seat(cafeChair, cx, cafeBase - cafeChair.h * p + u(4), 'coffee');
    }
    const cafePlant = look.tallPlant();
    standing(cafePlant, x1 - u(20) - cafePlant.w * p, cafeBase);
  }

  // Green divider between the desks and the lounge.
  hedge(rx0, floorTop + u(100), floorEnd, [look.tallPlant, look.tallPlant, look.plant]);

  // ---- Middle: clusters of desks of mixed sizes, loosely aligned, with a
  // meeting spot here and there where an island would have been.
  const cx0 = lx1 + u(60);
  const cx1 = rx0 - u(60);
  const cw = cx1 - cx0;
  const pitch = u(60); // between the pairs of desks of an island
  const cols = Math.max(1, Math.floor((cw + u(40)) / u(410)));
  const height = (pairs) => (pairs - 1) * pitch + SIDE_DESK.h * p;
  const bandH = (pairs) => height(pairs) + u(130);
  const ch = floorEnd - floorTop - u(40);
  // Bands of islands up to 6 seats, plus a lower one up to 4 where room is left,
  // slipped in at a random place.
  const bands = [];
  let used = 0;
  while (used + bandH(3) <= ch) {
    bands.push(3);
    used += bandH(3);
  }
  if (used + bandH(2) <= ch || !bands.length) {
    bands.splice(int(0, bands.length), 0, 2);
    used += bandH(2);
  }
  const bandGap = Math.max(0, ch - used) / (bands.length + 1);

  const island = (cx, y, pairs) => {
    const leftDesk = cx - SIDE_DESK.w * p;
    for (let k = 0; k < pairs; k++) {
      const deskTop = y + k * pitch;
      const keys = deskTop + SIDE_KEYS * p;
      props.push({ base: keys + 2 * p, draw: (ctx) => drawSprite(ctx, SIDE_DESK, leftDesk, deskTop, p) });
      props.push({ base: keys + 2 * p, draw: (ctx) => drawSprite(ctx, SIDE_DESK_LEFT, cx, deskTop, p) });
      slot('desk', leftDesk, keys, 5, { dxPerScale: -4.5, anims: ['type-side'], light: sideDeskLight(leftDesk, deskTop, p, 1) });
      slot('desk', cx + SIDE_DESK.w * p, keys, 5, { dxPerScale: 3.5, dir: -1, anims: ['type-side'], light: sideDeskLight(cx, deskTop, p, -1) });
    }
    return y + height(pairs);
  };
  // One or two rows of two desks facing the front.
  const frontRows = (cx, y, rows) => {
    for (let r = 0; r < rows; r++) {
      const deskTop = y + r * u(100);
      for (const left of [cx - DESK.w * p - u(12), cx + u(12)]) {
        prop(DESK, left, deskTop);
        slot('desk', left + 18 * p, deskTop + (DESK_SURFACE + 1) * p, 2, { light: frontDeskLight(left, deskTop, p) });
      }
    }
    return y + (rows - 1) * u(100) + DESK.h * p;
  };
  const meeting = (cx, y) => {
    const tableBase = y + u(80);
    paintRug(g, cx, tableBase - u(18), u(200), u(85), look.rug(), p);
    centered(TABLE, cx, tableBase);
    env.tables.push({ left: cx - (TABLE.w * p) / 2, top: tableBase - TABLE.h * p });
    slot('board', cx, tableBase - TABLE.h * p + u(12));
    slot('board', cx - u(95), tableBase - u(6));
    slot('board', cx + u(95), tableBase - u(6));
    if (random() < 0.6) {
      const boardBase = tableBase + u(110);
      centered(look.boardStand(), cx + u(between(-30, 30)), boardBase);
      slot('board', cx - u(40), boardBase + u(30));
      slot('board', cx + u(40), boardBase + u(30));
    } else {
      centered(look.tallPlant(), cx + u(between(-60, 60)), tableBase + u(90));
    }
  };
  // What closes an island: low bookcases, a plant, a bin, or nothing.
  const foot = (cx, base) => {
    const kind = pickOne(['shelves', 'shelf', 'plant', 'plant', 'bin', 'none']);
    if (kind === 'shelves') {
      standing(look.lowShelf(true), cx - LOW_SHELF.w * p, base);
      standing(look.lowShelf(false), cx, base);
    } else if (kind === 'shelf') centered(look.lowShelf(random() < 0.5), cx + u(between(-30, 30)), base);
    else if (kind === 'plant') centered(look.plant(), cx + u(between(-40, 40)), base);
    else if (kind === 'bin') centered(BIN, cx + u(between(-40, 40)), base);
  };

  let meetings = 0;
  let bandTop = floorTop + u(60) - bandH(3);
  let lastH = bandH(3);
  for (const maxPairs of bands) {
    bandTop += lastH + bandGap;
    lastH = bandH(maxPairs);
    // Some bands lose a column, so the clusters do not line up row after row.
    const count = cols >= 3 && random() < 0.35 ? cols - 1 : cols;
    const meetAt = count >= 3 && meetings < 2 && random() < 0.45 ? int(0, count - 1) : -1;
    const centers = [];
    for (let i = 0; i < count; i++) {
      const cx = cx0 + (cw * (i + 0.5)) / count + u(between(-20, 20));
      centers.push(cx);
      if (i === meetAt) {
        meetings++;
        meeting(cx, bandTop + u(between(0, 30)));
        continue;
      }
      const kind = pickOne(['island', 'island', 'island', 'island', 'front']);
      let end;
      if (kind === 'front') {
        end = frontRows(cx, bandTop + u(between(0, 40)), maxPairs === 3 ? int(1, 2) : 1);
      } else {
        const pairs = Math.min(maxPairs, pickOne([3, 3, 2, 2, 2, 1]));
        const y = bandTop + between(0, Math.max(0, lastH - u(130) - height(pairs)));
        end = island(cx, y, pairs);
      }
      if (end + u(55) <= bandTop + lastH + bandGap / 2) foot(cx, end + u(55));
    }
    // Now and then a clump of plants in the aisle between two clusters.
    for (let i = 0; i + 1 < centers.length; i++) {
      if (random() >= 0.35) continue;
      const ax = (centers[i] + centers[i + 1]) / 2;
      const ay = bandTop + between(u(40), Math.max(u(40), lastH - u(40)));
      centered(look.plant(), ax + u(between(-10, 10)), ay);
      if (random() < 0.5) centered(look.tallPlant(), ax + u(between(-15, 15)), ay + u(30));
    }
  }

  // ---- Wall over the plateau: windows in groups of one to three, with
  // wall pieces in between (a painting, a pin board, the clock) or bare wall.
  const wallFrom = shelfStart + shelves * (SHELF.w * p + u(4)) + u(30);
  const wallTo = kitchen - u(60) - PAINTING.w * p;
  const pane = windowModel(random);
  const winW = pane.w * p;
  const gaps = []; // middle and width of each stretch of wall between groups
  let doorX = between(wallFrom + u(40), Math.max(wallFrom + u(40), wallTo - u(120)));
  let sharedDoor = null;
  let wx = wallFrom + u(between(0, 40));
  while (wx + winW <= wallTo) {
    if (doorX !== null && wx + winW > doorX) {
      const doorLeft = wx + u(20);
      sharedDoor = doorLeft;
      drawDoor(g, doorLeft, wall, { p, u });
      if (season === 'halloween') {
        pumpkin(doorLeft - u(8) - PUMPKIN.w * p, wall + u(26), env);
        pumpkin(doorLeft + doorWidth(p) + u(8), wall + u(26), env);
      }
      if (season === 'noel') christmasTree(doorLeft + doorWidth(p) + u(16), wall + u(30), env, g);
      wx += u(20) + doorWidth(p) + u(between(40, 90));
      doorX = null;
      continue;
    }
    const n = Math.min(int(1, 3), Math.floor((wallTo - wx + u(8)) / (winW + u(8))));
    for (let k = 0; k < n; k++) drawWindow(g, pane, wx + k * (winW + u(8)), wall, { p, u, skies, season });
    wx += n * (winW + u(8));
    const gap = u(between(50, 180));
    gaps.push({ x: wx + gap / 2, w: gap });
    wx += gap;
  }
  // The clock goes in the stretch closest to the middle, wide enough or not.
  const mid = (wallFrom + wallTo) / 2;
  const clockGap = gaps.reduce((best, gp) => (!best || Math.abs(gp.x - mid) < Math.abs(best.x - mid) ? gp : best), null);
  clocks.push({ x: clockGap ? clockGap.x : mid, y: top + Math.round(wallH * 0.45) });
  const bareGaps = [];
  for (const gp of gaps) {
    if (gp === clockGap || gp.x + gp.w / 2 > wallTo) continue;
    const piece = pickOne([PAINTING, look.board(), null, null, null]);
    if (!piece || piece.w * p + u(16) > gp.w) {
      bareGaps.push(gp);
      continue;
    }
    const pieceTop = piece === PAINTING ? wall - u(90) : wall - u(18) - piece.h * p;
    drawSprite(g, piece, gp.x - (piece.w * p) / 2, pieceTop, p);
  }
  const seasonSpot = bareGaps.filter((gp) => gp.w >= u(70)).sort((a, b) => b.w - a.w)[0] ?? null;
  seasonWall(g, env, { x0, x1, top, wall, door: sharedDoor === null ? null : { left: sharedDoor, top: wall + u(4) - DOOR.h * p }, spot: seasonSpot });
  // On the floor by the door, clear of the pumpkins or the tree.
  const spots = sharedDoor === null ? [] : [150, 215, 280, 345].flatMap((d) => [sharedDoor - u(d), sharedDoor + doorWidth(p) + u(d)]);
  const floorArea = { x0: x0 + u(40), x1: x1 - u(40), y0: wall + u(70), y1: floorBottom - u(8) };
  seasonFloor(env, (s) => {
    const left = spots.shift();
    return left === undefined ? null : { left, top: wall + u(44) - s.h * p };
  }, g, floorArea);
  seasonCritters(env, floorArea);
  wallSpiders(env, x0, x1, top, wall);

  // ---- Front walkway, framed by two tall plants.
  const entrance = look.tallPlant(); // the same model on both sides
  standing(entrance, x0 + u(16), floorBottom - u(4));
  standing(entrance, x1 - u(16) - entrance.w * p, floorBottom - u(4));
  const fronts = clamp(Math.floor(cw / u(110)), 3, 12);
  for (let i = 0; i < fronts; i++) slot('front', cx0 + (cw * (i + 0.5)) / fronts, floorBottom - u(2));

  return { x0: x0 + u(8), x1: x1 - u(8), y0: wall + u(24), y1: floorBottom, stations };
}

// ---- Rooms joined into one floor plan
const ROOM_DOOR = (u) => u(24); // from the room's left wall to its door
const WALL_TOP = '#7d6a56'; // the walls seen from above
const WALL_EDGE = '#4f4338';
const THRESHOLD = '#c9b48f';
const GLASS = '#d4e8f2';
const GLASS_FRAME = '#8d9aa1';
const HALL_THEME = { wall: '#ece6d8', wallLow: '#e2dac8', wallStyle: 'plain', base: '#d3cab6', floor: '#efe8da', line: '#e2d9c7', floorStyle: 'tiles' };

// A hallway under a short room: a low wall hung with a few pictures, tiles and
// a plant or two.
function paintHall(g, { x0, x1, top, bottom, door, glass }, seed, { p, u }) {
  const random = seeded(seed);
  const look = dressing(THEMES[0], random);
  const wallH = Math.min(u(60), Math.round((bottom - top) * 0.4));
  paintArea(g, x0, top, x1 - x0, bottom - top, wallH, u, HALL_THEME);
  if (glass) {
    // A glass partition: panes between thin mullions, and a glass door.
    g.fillStyle = GLASS;
    g.fillRect(x0, top, x1 - x0, wallH);
    g.fillStyle = GLASS_FRAME;
    g.fillRect(x0, top + wallH - u(6), x1 - x0, u(6));
    for (let x = x0 + u(48); x < x1 - u(10); x += u(48)) g.fillRect(x, top, p, wallH - u(6));
    g.fillStyle = 'rgb(255 255 255 / 0.6)'; // reflections
    for (let x = x0 + u(14); x < x1 - u(30); x += u(96)) {
      g.fillRect(x, top + u(8), p, u(14));
      g.fillRect(x + 2 * p, top + u(4), p, u(10));
    }
    g.fillStyle = GLASS_FRAME;
    g.fillRect(door.x - p, top, door.w + 2 * p, wallH);
    g.fillStyle = '#c3dcea';
    g.fillRect(door.x + p, top + p, door.w - 2 * p, wallH - u(6) - p);
    g.fillStyle = WALL_EDGE;
    g.fillRect(door.x + door.w - 4 * p, top + Math.round(wallH * 0.45), 2 * p, p); // handle
  } else {
    // The doorway from the room above cuts through the low wall.
    g.fillStyle = HALL_THEME.floor;
    g.fillRect(door.x, top, door.w, wallH);
    g.fillStyle = WALL_EDGE;
    g.fillRect(door.x - p, top, p, wallH);
    g.fillRect(door.x + door.w, top, p, wallH);
  }
  // A picture or two along the wall, clear of the doorway and of the plants at the ends.
  const spots = [];
  for (let x = x0 + u(90); x < x1 - u(110) && !glass; x += u(70)) {
    if (x + u(50) > door.x - u(20) && x < door.x + door.w + u(20)) continue;
    spots.push(x);
  }
  let hung = 0;
  const most = random() < 0.5 ? 1 : 2;
  for (const x of spots) {
    if (hung >= most || random() < 0.6) continue;
    hung++;
    const frame = FRAMES[Math.floor(random() * FRAMES.length)];
    const fh = frame.h * p;
    if (fh > wallH - u(8)) continue;
    drawSprite(g, frame, Math.round(x + u(random() * 16)), Math.round(top + (wallH - u(6) - fh) / 2), p);
  }
  // Plants against the low wall, cut at the wall above if they are too tall.
  g.save();
  g.beginPath();
  g.rect(x0, top, x1 - x0, bottom - top);
  g.clip();
  for (let k = random() < 0.5 ? 1 : 2; k > 0; k--) {
    const plant = look.plant();
    const left = k === 1 ? x0 + u(20) : x1 - u(20) - plant.w * p;
    drawSprite(g, plant, Math.round(left), Math.round(top + wallH + u(16) - plant.h * p), p);
  }
  g.restore();
}

function canvasFor(width, height) {
  const canvas = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const g = canvas.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.imageSmoothingEnabled = false;
  return { canvas, g };
}

// Rooms: one fixed-size room per session, laid out in a grid that grows
// downwards (the page scrolls). Shared: one office the size of the window.
export function buildOffice(width, viewHeight, names, { px = 5, layout = 'rooms', season = null, salt = '' } = {}) {
  const k = px / 5;
  const u = (n) => Math.round(n * k);
  const props = [];
  const clocks = [];
  const skies = []; // window panes, repainted with the sky of the hour
  const lamps = [];
  const glows = []; // small lights redrawn over the night tint
  const plates = []; // room names, drawn over everything else
  const walls = []; // garlands, redrawn each frame over the window skies
  const tables = []; // meeting and café tables, for the season's food
  const env = { p: px, u, props, clocks, skies, lamps, glows, season, plates, salt, walls, tables };
  // Seeds come from the session names; a salt gives the same names another layout.
  const seedOf = (i) => `${salt}${names[i] ?? ''}`;
  const zones = [];
  let height = viewHeight;
  let background;

  if (layout === 'shared') {
    ({ canvas: background } = canvasFor(width, height));
    const g = background.getContext('2d');
    const area = { x0: 0, x1: width, top: 0, bottom: height, name: '', seed: `${salt}shared`, maxPerRow: 8, maxRows: 4 };
    // The designed plan needs room for its three zones; narrow windows keep the generic one.
    zones.push(width >= u(1300) && height >= u(700) ? furnishShared(g, area, env) : furnish(g, area, env));
  } else {
    // The rooms share their walls, like the plan of a flat. Widths and heights
    // vary a little; under a room shorter than its row, a hallway fills the
    // gap. Back doors open onto the room or hallway above, doorways join the
    // neighbours, and the building's entrance is at the bottom. Purely for the
    // look: Clawds stay home.
    const wallT = Math.max(10, u(20));
    const margin = u(32);
    const roomMax = Math.min(u(760), width - 2 * wallT - margin);
    const n = Math.max(1, names.length);
    const cols = Math.max(1, Math.floor((width - margin - wallT) / (roomMax + wallT)));
    const rows = Math.ceil(n / cols);
    const vary = (i, key, low) => low + (1 - low) * seeded(`${seedOf(i)}#${key}`)();
    const widths = Array.from({ length: n }, (_, i) => Math.round(roomMax * vary(i, 'w', 0.84)));
    const tall = u(800);
    const inRow = (r) => Array.from({ length: Math.min(cols, n - r * cols) }, (_, k) => r * cols + k);
    // Each row slides a little sideways, so the left and right sides are ragged too.
    const shift = Array.from({ length: rows }, (_, r) => (rows > 1 ? Math.round(u(70) * vary(r * cols, 'shift', 0)) : 0));
    const rowW = (r) => inRow(r).reduce((sum, i) => sum + widths[i] + wallT, wallT);
    const planW = Math.max(...Array.from({ length: rows }, (_, r) => shift[r] + rowW(r)));
    const left0 = Math.round((width - planW) / 2) + wallT;
    const topExtra = u(60); // the top row's rooms start a little lower or higher
    const cells = []; // rooms, then the hallways under the short ones
    const rooms = [];
    let rowTop = margin + wallT;
    for (let r = 0; r < rows; r++) {
      const last = r === rows - 1;
      // Above the last row, about half the rooms (at least one) give up their
      // bottom to a hallway; the last row keeps a ragged edge instead.
      const pick = inRow(r).map((i) => vary(i, 'hall', 0));
      const hallFor = (k) => !last && (pick[k] < 0.5 || pick[k] === Math.min(...pick));
      const rowH = tall + (r === 0 ? topExtra : 0);
      let x0 = left0 + shift[r];
      inRow(r).forEach((i, k) => {
        const hallH = Math.round(u(120) + u(50) * vary(i, 'hall-h', 0));
        const top = rowTop + (r === 0 ? Math.round(topExtra * vary(i, 'top', 0)) : 0);
        const bottom = last ? top + Math.round(tall * vary(i, 'h', 0.85)) : hallFor(k) ? rowTop + rowH - hallH - wallT : rowTop + rowH;
        const room = { x0, x1: x0 + widths[i], top, bottom, r, c: k, i };
        if (hallFor(k)) {
          // Where the hallway opens onto the room above, chosen now so its
          // pictures keep clear of it.
          // Sometimes a glass partition with a glass door instead of a wall.
          const glass = vary(i, 'glass', 0) < 0.35;
          const w = glass ? u(56) : Math.round(u(60) + u(90) * vary(i, 'hall-door-w', 0));
          const door = { x: Math.round(x0 + u(140) + vary(i, 'hall-door', 0) * (widths[i] - u(220) - w)), w };
          cells.push({ x0, x1: room.x1, top: bottom + wallT, bottom: rowTop + rowH, r, c: k, hall: true, i, door, glass });
        }
        rooms.push(room);
        x0 = room.x1 + wallT;
      });
      rowTop += rowH + wallT;
    }
    cells.unshift(...rooms);
    // A hallway must serve at least two rooms: the one above, plus a room whose
    // back door opens into it or a neighbour beside it. Otherwise the room above
    // takes the space back. Dropping one can strand another, hence the loop.
    const touches = (a, b) => (a.x0 === b.x1 + wallT || b.x0 === a.x1 + wallT) && a.top < b.bottom && b.top < a.bottom;
    for (let dropped = true; dropped; ) {
      dropped = false;
      for (const hall of cells.filter((cell) => cell.hall)) {
        const below = rooms.filter((room) => room.top === hall.bottom + wallT &&
          hall.x0 <= room.x0 + ROOM_DOOR(u) && room.x0 + ROOM_DOOR(u) + doorWidth(px) <= hall.x1);
        const beside = cells.filter((cell) => cell !== hall && touches(cell, hall));
        if (1 + below.length + beside.length >= 2) continue;
        rooms.find((room) => room.i === hall.i).bottom = hall.bottom;
        cells.splice(cells.indexOf(hall), 1);
        dropped = true;
      }
    }
    const planBottom = Math.max(...cells.map((cell) => cell.bottom));
    height = Math.max(viewHeight, planBottom + wallT + u(64));
    const { canvas, g } = canvasFor(width, height);
    background = canvas;
    g.fillStyle = '#d3ccbc'; // outside
    g.fillRect(0, 0, width, height);
    // Walls first, as one dark-edged mass; each room then paints its inside.
    const frame = (grow, color) => {
      g.fillStyle = color;
      for (const { x0, x1, top, bottom } of cells) g.fillRect(x0 - grow, top - grow, x1 - x0 + 2 * grow, bottom - top + 2 * grow);
    };
    frame(wallT + px, WALL_EDGE);
    frame(wallT, WALL_TOP);
    frame(px, WALL_EDGE);
    for (const room of rooms) {
      const { x0, x1, top, bottom, i } = room;
      zones[i] = furnish(g, { x0, x1, top, bottom, name: names[i] ?? '', seed: `${seedOf(i)}#${i}`, maxPerRow: 3, maxRows: 2 }, env);
    }
    for (const hall of cells.filter((cell) => cell.hall)) paintHall(g, hall, `${seedOf(hall.i)}#hall`, env);

    // A gap through a wall: the threshold, edged on the two sides you walk past.
    const opening = (x, y, w, h, across) => {
      g.fillStyle = THRESHOLD;
      g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
      g.fillStyle = WALL_EDGE;
      if (across) {
        g.fillRect(Math.round(x - px), Math.round(y), px, Math.round(h));
        g.fillRect(Math.round(x + w), Math.round(y), px, Math.round(h));
      } else {
        g.fillRect(Math.round(x), Math.round(y - px), Math.round(w), px);
        g.fillRect(Math.round(x), Math.round(y + h), Math.round(w), px);
      }
    };
    const cellAbove = (x, w, top) => cells.find((cell) => cell.bottom + wallT === top && cell.x0 <= x && x + w <= cell.x1);
    const rightOf = (cell) => cells.find((other) => other.x0 === cell.x1 + wallT && other.top < cell.bottom && cell.top < other.bottom);
    for (const room of rooms) {
      // The back door, when something lies behind it.
      const doorX = room.x0 + ROOM_DOOR(u) + u(4);
      const doorW = doorWidth(px) - u(8);
      if (cellAbove(doorX, doorW, room.top)) opening(doorX, room.top - wallT - px, doorW, wallT + px, true);
    }
    for (const cell of cells) {
      const random = seeded(`${seedOf(cell.i)}#${cell.hall ? 'hall' : 'room'}-side`);
      const next = rightOf(cell);
      if (next) {
        // Side doorways stay clear of the back walls, where the furniture stands.
        const low = Math.max(cell.hall ? cell.top + u(30) : cell.top + u(170), next.hall ? next.top + u(30) : next.top + u(170));
        const high = Math.min(cell.bottom, next.bottom) - u(30);
        const h = Math.min(Math.round(u(50) + u(110) * random()), high - low);
        if (h >= u(50)) opening(cell.x1, low + random() * (high - low - h), next.x0 - cell.x1, h, false);
      }
      // A hallway opens onto the room above it, or shows it through glass.
      if (cell.hall && cell.glass) {
        g.fillStyle = GLASS_FRAME;
        g.fillRect(cell.x0, cell.top - wallT, cell.x1 - cell.x0, wallT);
        g.fillStyle = GLASS;
        g.fillRect(cell.x0, cell.top - wallT + px, cell.x1 - cell.x0, wallT - 2 * px);
      } else if (cell.hall) opening(cell.door.x, cell.top - wallT, cell.door.w, wallT, true);
    }
    // The way in: a gap in the bottom wall of the first room of the last row,
    // a mat and a path out to the street.
    const hallway = rooms.find((room) => room.r === rows - 1 && room.c === 0);
    const gateW = u(70);
    const gateX = Math.round(hallway.x0 + (hallway.x1 - hallway.x0) * 0.36);
    opening(gateX, hallway.bottom, gateW, wallT + px, true);
    g.fillStyle = '#c9c0ac';
    g.fillRect(gateX, hallway.bottom + wallT + px, gateW, Math.max(12, u(56)));
    g.fillStyle = INK.H;
    g.fillRect(gateX + u(6), hallway.bottom + wallT + px + u(6), gateW - u(12), u(14));
  }

  seasonTables(env);
  return {
    background,
    height,
    zones,
    shared: layout === 'shared',
    props,
    overlay(ctx, date, weather = 'clear') {
      const light = daylight(date);
      if (light.night || light.dusk || light.dawn || weather !== 'clear') {
        skies.forEach((w, i) => drawSky(ctx, w, i, light, px, weather, date.getTime()));
      }
      const now = performance.now();
      for (const draw of walls) draw(ctx, now);
      for (const clock of clocks) drawClock(ctx, clock, date, u);
    },
    labels(ctx) {
      ctx.save();
      for (const plate of plates) paintNameplate(ctx, plate);
      ctx.restore();
    },
    // Drawn over everything: the evening dims the office, lamps light up around
    // them. Returns how dark it is, so labels can switch to a light ink.
    shade(ctx, date, width, h) {
      const { night, dusk, dawn } = daylight(date);
      if (dusk) {
        ctx.fillStyle = `rgb(242 140 60 / ${0.08 * dusk})`;
        ctx.fillRect(0, 0, width, h);
      }
      if (dawn) {
        ctx.fillStyle = `rgb(255 150 140 / ${0.14 * dawn})`;
        ctx.fillRect(0, 0, width, h);
      }
      if (!night) return 0;
      // Multiplied rather than painted over, so colours darken without going grey.
      const tint = [255, 255, 255].map((v, i) => Math.round(v + ([118, 128, 186][i] - v) * night));
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = `rgb(${tint.join(' ')})`;
      ctx.fillRect(0, 0, width, h);
      ctx.restore();
      for (const { x, y } of lamps) {
        const r = u(150);
        const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
        glow.addColorStop(0, `rgb(255 214 120 / ${0.42 * night})`);
        glow.addColorStop(1, 'rgb(255 214 120 / 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
      }
      // Fireworks or a bonfire in the windows, and pumpkin faces and fairy
      // lights, shine through the dark.
      const now = performance.now();
      const extra = skyEvent(season);
      if (extra) {
        const light = daylight(date);
        skies.forEach((w, i) => extra(ctx, w, i, light, now, px));
      }
      for (const g of glows) {
        const r = u(g.r * 5);
        const halo = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, r);
        halo.addColorStop(0, `rgb(255 196 90 / ${0.35 * night})`);
        halo.addColorStop(1, 'rgb(255 196 90 / 0)');
        ctx.fillStyle = halo;
        ctx.fillRect(g.x - r, g.y - r, 2 * r, 2 * r);
        if (g.draw) g.draw(ctx, now);
        else for (const [x, y, c] of g.cells) {
          ctx.fillStyle = INK[c];
          ctx.fillRect(Math.round(g.left) + x * g.p, Math.round(g.top) + y * g.p, g.p, g.p);
        }
      }
      return night;
    },
  };
}

// How dark it is, from the real sunrise and sunset of the day: night is 0 by
// day and 1 at night, ramping from an hour before sunset to an hour and a half
// after, and from an hour and a half before sunrise to an hour after, so both
// are half lit; dusk peaks at sunset, dawn at sunrise.
export function daylight(date) {
  const h = date.getHours() + date.getMinutes() / 60;
  const { sunrise, sunset } = sunTimes(date);
  const ramp = (from, to) => Math.min(1, Math.max(0, (h - from) / (to - from)));
  const night = h >= sunset - 1 ? ramp(sunset - 1, sunset + 1.5) : 1 - ramp(sunrise - 1.5, sunrise + 1);
  const peak = (at, width) => Math.max(0, 1 - Math.abs(h - at) / width);
  return { night, dusk: peak(sunset, 1.5), dawn: peak(sunrise, 1.2) };
}

const DAY_SKY = [191, 224, 255];
const DUSK_SKY = [244, 170, 120];
const DAWN_SKY = [250, 196, 186]; // pinker and paler than the evening
const NIGHT_SKY = [31, 42, 77];

// Paints the glass of a window with the sky of the hour, stars at night.
// How overcast each weather makes the sky, and the grey it turns to.
const OVERCAST = { clear: 0, cloudy: 0.45, fog: 0.75, rain: 0.6, snow: 0.55, storm: 0.75 };
const OVERCAST_GREY = { fog: [214, 218, 222], storm: [112, 120, 134] };

function drawSky(ctx, { left, top, model }, index, { night, dusk, dawn }, p, weather, ms) {
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const cell = (x, y) => ctx.fillRect(left + x * p, top + y * p, p, p);
  // The sky turns dark later than the room, so sunset stays orange.
  const darkness = Math.max(0, (night - 0.3) / 0.7);
  const grey = mix(OVERCAST_GREY[weather] ?? [178, 186, 196], NIGHT_SKY, darkness * 0.8);
  const [r, g, b] = mix(mix(mix(mix(DAY_SKY, DUSK_SKY, dusk), DAWN_SKY, dawn), NIGHT_SKY, darkness), grey, OVERCAST[weather]);
  // A storm flashes now and then.
  const flash = weather === 'storm' && ms % 7000 < 140;
  ctx.fillStyle = flash ? '#f4f7ff' : `rgb(${r} ${g} ${b})`;
  for (const [x, y] of model.glass) cell(x, y);
  if (flash) return;

  // Clouds drift across, a little lighter than the overcast sky.
  if (weather === 'cloudy') {
    const drift = Math.floor(ms / 1500);
    ctx.fillStyle = darkness > 0.5 ? 'rgb(96 104 122)' : 'rgb(236 240 244)';
    for (const [x, y] of model.glass) {
      const u = (x + drift + index * 9) % 18;
      if (y <= 4 && u < 7 && !(y === 1 && (u === 0 || u === 6)) && !(y === 4 && u > 4)) cell(x, y);
    }
  }
  if (weather === 'rain' || weather === 'storm') {
    const t = Math.floor(ms / 80);
    ctx.fillStyle = darkness > 0.5 ? 'rgb(150 170 200)' : 'rgb(232 240 250)';
    for (const [x, y] of model.glass) {
      if ((x + index) % 3) continue;
      const k = (((y - t + x * 7) % 8) + 8) % 8;
      if (k < 2) cell(x, y);
    }
  }
  if (weather === 'snow') {
    const t = Math.floor(ms / 300);
    ctx.fillStyle = '#ffffff';
    for (const [x, y] of model.glass) {
      const row = y - t;
      const sway = Math.floor(row / 4) % 2;
      if ((((row + x * 5) % 7) + 7) % 7 === 0 && (x + sway + index) % 3 === 0) cell(x, y);
    }
  }
  if (night < 0.6 || weather !== 'clear') return;
  ctx.fillStyle = '#fff6d6';
  for (let k = 0; k < 3; k++) {
    // The same few stars in each window every night.
    const [x, y] = model.glass[(index * 7 + k * 13 * 11) % model.glass.length];
    ctx.fillRect(left + x * p, top + y * p, p, p);
  }
}

function drawClock(ctx, { x, y }, date, u) {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#3d3929';
  ctx.lineWidth = Math.max(2, u(3));
  ctx.beginPath();
  ctx.arc(x, y, u(20), 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  const hand = (turns, length, width) => {
    const a = turns * Math.PI * 2 - Math.PI / 2;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * length, y + Math.sin(a) * length);
    ctx.stroke();
  };
  const seconds = date.getSeconds();
  const minutes = date.getMinutes() + seconds / 60;
  hand(((date.getHours() % 12) + minutes / 60) / 12, u(10), Math.max(2, u(3)));
  hand(minutes / 60, u(15), Math.max(1, u(2)));
  ctx.strokeStyle = INK.R; // second hand, ticking once a second
  hand(seconds / 60, u(17), 1);
  ctx.fillStyle = INK.R;
  ctx.fillRect(x - 1, y - 1, 2, 2);
}
