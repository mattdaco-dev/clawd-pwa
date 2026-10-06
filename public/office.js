// Open-space decor: a background (wall, floor, whiteboards, windows, rugs),
// furniture that is depth-sorted with the Clawds, and the stations where they
// go for each activity. One furnished column per Claude Code session.
import { PALETTES } from './render.js';

const P = 5; // furniture pixel size, same as the main Clawd
const INK = PALETTES.main;
const LABEL_SPACE = 28;

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), Math.max(lo, hi));

function sprite(rows) {
  const cells = [];
  rows.forEach((row, y) => [...row].forEach((c, x) => {
    if (c !== '.') cells.push([x, y, c]);
  }));
  return { cells, w: rows[0].length, h: rows.length };
}

function drawSprite(ctx, s, left, top) {
  left = Math.round(left);
  top = Math.round(top);
  for (const [x, y, c] of s.cells) {
    ctx.fillStyle = INK[c];
    ctx.fillRect(left + x * P, top + y * P, P, P);
  }
}

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

const COFFEE = sprite([
  'KKKKKKKKKK',
  'KGGGGGGGGK',
  'KGKKKKKKGK',
  'KGKSSSSKGK',
  'KGKKKKKKGK',
  'KGGGGGGRGK',
  'KGG....GGK',
  'KGG.WW.GGK',
  'KGG.WW.GGK',
  'KGGGGGGGGK',
  'KKKKKKKKKK',
  'KK......KK',
]);

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

const WINDOW = sprite(Array.from({ length: 14 }, (_, y) =>
  y === 0 || y === 13 || y === 6 ? 'W'.repeat(20) : `W${'S'.repeat(8)}WW${'S'.repeat(8)}W`));

function paintRoom(g, width, height, wall) {
  g.fillStyle = '#e9e3d4';
  g.fillRect(0, 0, width, wall);
  g.fillStyle = '#d3cab6';
  g.fillRect(0, wall - 6, width, 6);
  g.fillStyle = '#f4f1ea';
  g.fillRect(0, wall, width, height - wall);
  g.fillStyle = '#ebe6db';
  for (let y = wall + 56; y < height; y += 56) g.fillRect(0, y, width, 1);
  for (let x = 56; x < width; x += 56) g.fillRect(x, wall, 1, height - wall);
}

const RUGS = [
  ['#d98b5f', '#efc98f', '#e4b276'],
  ['#5f7fb8', '#c9d6ee', '#b3c4e6'],
  ['#6f9a5f', '#d6e6c4', '#c2d9ab'],
];

function paintRug(g, cx, cy, w, h, [border, fill, stripe]) {
  const left = Math.round(cx - w / 2);
  const top = Math.round(cy - h / 2);
  g.fillStyle = border;
  g.fillRect(left, top, w, h);
  g.fillStyle = fill;
  g.fillRect(left + P, top + P, w - 2 * P, h - 2 * P);
  g.fillStyle = stripe;
  for (let x = left + 3 * P; x < left + w - 3 * P; x += 4 * P) g.fillRect(x, top + 2 * P, P, h - 4 * P);
}

function paintNameplate(g, name, cx) {
  if (!name) return;
  g.font = '600 13px ui-monospace, monospace';
  const w = Math.ceil(g.measureText(name).width) + 24;
  g.fillStyle = '#3d3929';
  g.beginPath();
  g.roundRect(Math.round(cx - w / 2), 8, w, 24, 6);
  g.fill();
  g.fillStyle = '#f4f1ea';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(name, cx, 20);
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

function mirror(s) {
  return { ...s, cells: s.cells.map(([x, y, c]) => [s.w - 1 - x, y, c]) };
}
const SIDE_DESK_LEFT = mirror(SIDE_DESK);

// Same palette keys, other colours: beanbags come in a few fabrics.
function recolor(s, map) {
  return { ...s, cells: s.cells.map(([x, y, c]) => [x, y, map[c] ?? c]) };
}
const BEANBAGS = [BEANBAG, recolor(BEANBAG, { B: 'R', N: 'D' }), recolor(BEANBAG, { B: 'Y', N: 'H' }), recolor(BEANBAG, { B: 'P', N: 'Q' })];

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

const STATIONS = ['desk', 'shelf', 'board', 'coffee', 'radio', 'beanbag', 'rug', 'front'];

// Lays out one session's column and returns its walkable area and stations.
// Every station type always exists; quantities and positions vary per session.
function furnish(g, { x0, x1, wall, floorBottom, name, seed }, props, clocks) {
  const W = x1 - x0;
  const floor = floorBottom - wall;
  const random = seeded(seed);
  const between = (a, b) => a + random() * (b - a);
  const int = (a, b) => Math.floor(between(a, b + 1));
  const chance = (p) => random() < p;
  const pickOne = (list) => list[Math.floor(random() * list.length)];

  const stations = Object.fromEntries(STATIONS.map((type) => [type, []]));
  // perScale and dxPerScale shift the spot with the Clawd's size, so its hands
  // land on the same furniture whether it is a main agent or a subagent.
  const slot = (type, x, y, perScale = 0, { dxPerScale = 0, dir = 1, anims } = {}) => stations[type].push({
    type,
    occupant: null,
    dir,
    anims,
    spot: (scale) => ({ x: Math.round(x + dxPerScale * scale), y: Math.round(y + perScale * scale) }),
  });

  // Floor footprints already used, so scattered items keep clear of furniture and stations.
  const taken = [];
  const reserve = (x, y, w, h) => taken.push({ x, y, w, h });
  const fits = (x, y, w, h) => x >= x0 + 8 && x + w <= x1 - 8 &&
    taken.every((r) => x + w <= r.x || r.x + r.w <= x || y + h <= r.y || r.y + r.h <= y);
  const prop = (s, left, top) => {
    props.push({ base: Math.round(top) + s.h * P, draw: (ctx) => drawSprite(ctx, s, left, top) });
  };
  const standing = (s, left, base) => prop(s, left, base - s.h * P);
  const scatter = (s, yMin, yMax) => {
    const w = s.w * P;
    const h = s.h * P;
    for (let tries = 0; tries < 30; tries++) {
      const left = between(x0 + 16, x1 - 16 - w);
      const base = between(yMin, yMax);
      if (!fits(left - 10, base - h, w + 20, h + 10)) continue;
      reserve(left - 10, base - h, w + 20, h + 10);
      return standing(s, left, base);
    }
  };

  paintNameplate(g, name, (x0 + x1) / 2);

  // Along the wall, left: maybe a plant, one to three bookshelves, the whiteboard.
  const backBase = wall + 16;
  const inFront = backBase + 36;
  let cursor = x0 + 24;
  if (chance(0.7)) {
    standing(PLANT, cursor, backBase);
    cursor += PLANT.w * P + 12;
  }
  const shelfCount = int(1, W >= 760 ? 3 : W >= 560 ? 2 : 1);
  for (let i = 0; i < shelfCount; i++) {
    standing(SHELF, cursor, backBase);
    slot('shelf', cursor + 40, inFront);
    cursor += SHELF.w * P + int(6, 16);
  }
  if (shelfCount === 1) slot('shelf', cursor + 50, inFront);
  const boardLeft = cursor + between(30, 90);
  drawSprite(g, BOARD, boardLeft, wall - 18 - BOARD.h * P);
  slot('board', boardLeft + 30, wall + 44);
  slot('board', boardLeft + 120, wall + 44);

  // Along the wall, right: coffee machine, maybe a water cooler and a plant, the clock.
  let right = x1 - 28 - COFFEE.w * P;
  standing(COFFEE, right, backBase);
  slot('coffee', right + 25, inFront);
  if (chance(0.75)) {
    right -= 20 + COOLER.w * P;
    standing(COOLER, right, backBase);
    slot('coffee', right + 20, inFront);
  }
  if (chance(0.5)) {
    right -= 16 + PLANT.w * P;
    standing(PLANT, right, backBase);
  }
  slot('coffee', right - 70, inFront);
  if (chance(0.85)) clocks.push({ x: right - between(30, 80), y: Math.round(wall * between(0.35, 0.5)) });
  reserve(x0, wall, W, 60);

  const winFrom = boardLeft + BOARD.w * P + 40;
  const winTo = right - 120;
  const room = Math.max(0, Math.floor((winTo - winFrom + 40) / 140));
  const windows = Math.max(0, room - int(0, 1));
  for (let i = 0; i < windows; i++) {
    const left = winFrom + ((winTo - winFrom - 100) * (i + 0.5)) / windows - 50 + between(-12, 12);
    drawSprite(g, WINDOW, left, wall - 84);
  }

  // Rows of desks: front-facing rows, or islands of two side desks facing each
  // other; some seats missing, rows shifted, odd furniture at the ends.
  const deskW = DESK.w * P;
  const maxDesks = clamp(Math.floor((W - 200) / (deskW + 24)), 1, 4);
  const maxIslands = clamp(Math.floor((W - 200) / 300), 1, 2);
  const rows = floor >= 900 ? int(2, 3) : 2;
  const rowGap = Math.max(150, floor * (rows === 3 ? 0.16 : 0.2));
  const printerRow = int(0, rows - 1);
  for (let r = 0; r < rows; r++) {
    const deskTop = wall + floor * 0.17 + r * rowGap + between(-12, 12);
    const side = chance(0.4);
    const count = side ? int(1, maxIslands) : int(Math.max(1, maxDesks - 1), maxDesks);
    const unit = side ? 300 : deskW + 24;
    const rowWidth = count * unit - (side ? 40 : 24);
    const start = clamp(x0 + (W - rowWidth) / 2 + between(-50, 50), x0 + 100, x1 - 100 - rowWidth);
    let rowBase = deskTop + DESK.h * P;
    let placed = 0;
    for (let i = 0; i < count; i++) {
      const left = start + i * unit;
      if (!side) {
        if (placed > 0 && chance(0.15)) continue;
        prop(DESK, left, deskTop);
        // Feet just behind the desk, so the animation's keyboard lands on the desktop.
        slot('desk', left + 18 * P, deskTop + (DESK_SURFACE + 1) * P, 2);
        placed++;
        continue;
      }
      // Island: Clawd | desk | desk | Clawd. Desks are drawn before the Clawds
      // (lower base), so the typing hand stays on top of the keyboard.
      const top = deskTop + 15;
      const keys = top + SIDE_KEYS * P;
      const sideBase = keys + 2 * P;
      const leftDesk = left + 60;
      const rightDesk = leftDesk + SIDE_DESK.w * P;
      props.push({ base: sideBase, draw: (ctx) => drawSprite(ctx, SIDE_DESK, leftDesk, top) });
      props.push({ base: sideBase, draw: (ctx) => drawSprite(ctx, SIDE_DESK_LEFT, rightDesk, top) });
      slot('desk', leftDesk, keys, 5, { dxPerScale: -4.5, anims: ['type-side'] });
      slot('desk', rightDesk + SIDE_DESK.w * P, keys, 5, { dxPerScale: 3.5, dir: -1, anims: ['type-side'] });
      rowBase = top + SIDE_DESK.h * P;
    }
    // The row and whatever stands at its ends.
    reserve(start - 100, deskTop - 50, rowWidth + 200, rowBase - deskTop + 60);
    if (start - x0 >= 90 && chance(0.7)) standing(pickOne([CABINET, CABINET, PLANT]), start - 24 - CABINET.w * P, rowBase);
    if (x1 - (start + rowWidth) >= 90) {
      if (r === printerRow) standing(PRINTER, start + rowWidth + 24, rowBase);
      else if (chance(0.6)) standing(pickOne([PLANT, CABINET]), start + rowWidth + 24, rowBase);
    }
  }

  // Meeting table (more room to think) and the listening corner.
  const middle = wall + floor * (rows === 3 ? 0.7 : 0.66) + between(-20, 20);
  const tableX = x0 + W * between(0.22, 0.42);
  const tableTop = middle - TABLE.h * P;
  prop(TABLE, tableX - (TABLE.w * P) / 2, tableTop);
  slot('board', tableX, tableTop + 12);
  slot('board', tableX - 95, middle - 6);
  slot('board', tableX + 95, middle - 6);
  reserve(tableX - 150, tableTop - 50, 300, TABLE.h * P + 60);

  const radioLeft = x1 - between(170, 240);
  const radioBase = middle + between(-30, 30);
  standing(RADIO, radioLeft, radioBase);
  slot('radio', radioLeft - 40, radioBase - 4);
  slot('radio', radioLeft + RADIO.w * P + 40, radioBase - 4);
  reserve(radioLeft - 90, radioBase - 110, RADIO.w * P + 180, 120);

  // Play rug, beanbags, the front of the room, then scattered plants and cabinets.
  const rugW = Math.round(clamp(W * between(0.25, 0.35), 160, 320));
  const rugH = int(14, 18) * P;
  const rugX = x0 + W * between(0.55, 0.68);
  const rugY = wall + floor * between(0.83, 0.88);
  paintRug(g, rugX, rugY, rugW, rugH, pickOne(RUGS));
  for (const dx of [-rugW / 3, 0, rugW / 3]) slot('rug', rugX + dx, rugY + 10);
  reserve(rugX - rugW / 2 - 20, rugY - rugH / 2 - 60, rugW + 40, rugH + 70);

  const bagBase = floorBottom - 8;
  const bags = int(1, 3);
  for (let i = 0; i < bags; i++) {
    const left = x0 + 28 + i * (BEANBAG.w * P + int(14, 30));
    standing(pickOne(BEANBAGS), left, bagBase);
    slot('beanbag', left + 35, bagBase - 2 * P);
    reserve(left - 10, bagBase - 80, BEANBAG.w * P + 20, 80);
  }

  for (const f of [0.3, 0.42, 0.54]) slot('front', x0 + W * f, floorBottom - 2);
  reserve(x0 + W * 0.25, floorBottom - 110, W * 0.35, 110);

  for (let i = int(2, 5); i > 0; i--) scatter(PLANT, wall + 80, floorBottom - 4);
  if (chance(0.5)) scatter(CABINET, wall + floor * 0.5, floorBottom - 4);

  return { x0: x0 + 8, x1: x1 - 8, y0: wall + 24, y1: floorBottom, stations };
}

export function buildOffice(width, height, names) {
  const wall = Math.round(clamp(height * 0.14, 100, 150));
  const floorBottom = height - LABEL_SPACE;
  const n = Math.max(1, names.length);
  const zoneWidth = width / n;

  const background = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1;
  background.width = Math.round(width * dpr);
  background.height = Math.round(height * dpr);
  const g = background.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.imageSmoothingEnabled = false;
  paintRoom(g, width, height, wall);

  const props = [];
  const clocks = [];
  const zones = [];
  for (let i = 0; i < n; i++) {
    const seed = `${names[i] ?? ''}#${i}`;
    zones.push(furnish(g, { x0: i * zoneWidth, x1: (i + 1) * zoneWidth, wall, floorBottom, name: names[i], seed }, props, clocks));
    if (i > 0) {
      g.fillStyle = '#d6cfbe';
      g.fillRect(Math.round(i * zoneWidth) - 2, 0, 4, height);
    }
  }
  return {
    background,
    zones,
    props,
    overlay(ctx, date) {
      for (const clock of clocks) drawClock(ctx, clock, date);
    },
  };
}

function drawClock(ctx, { x, y }, date) {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#3d3929';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 16, 0, Math.PI * 2);
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
  const minutes = date.getMinutes() + date.getSeconds() / 60;
  hand(((date.getHours() % 12) + minutes / 60) / 12, 8, 3);
  hand(minutes / 60, 12, 2);
}
