// Open-space office: a background (wall, floor, whiteboards, windows, rugs),
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

function paintRug(g, cx, cy, w, h) {
  const left = Math.round(cx - w / 2);
  const top = Math.round(cy - h / 2);
  g.fillStyle = '#d98b5f';
  g.fillRect(left, top, w, h);
  g.fillStyle = '#efc98f';
  g.fillRect(left + P, top + P, w - 2 * P, h - 2 * P);
  g.fillStyle = '#e4b276';
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

// Lays out one session's column and returns its walkable area and stations.
function furnish(g, { x0, x1, wall, floorBottom, name }, props, clocks) {
  const W = x1 - x0;
  const floor = floorBottom - wall;
  const stations = { desk: [], shelf: [], board: [], coffee: [], radio: [], beanbag: [], rug: [], front: [] };
  const slot = (type, x, y, perScale = 0) => stations[type].push({
    type,
    occupant: null,
    dir: 1,
    spot: (scale) => ({ x: Math.round(x), y: Math.round(y + perScale * scale) }),
  });
  const prop = (s, left, top) => {
    props.push({ base: Math.round(top) + s.h * P, draw: (ctx) => drawSprite(ctx, s, left, top) });
  };

  paintNameplate(g, name, (x0 + x1) / 2);

  // Along the wall: plant, bookshelf, whiteboard, windows, clock, coffee machine.
  const backBase = wall + 16;
  prop(PLANT, x0 + 24, backBase - PLANT.h * P);
  const shelfLeft = x0 + 76;
  prop(SHELF, shelfLeft, backBase - SHELF.h * P);
  slot('shelf', shelfLeft + 40, backBase + 36);
  slot('shelf', shelfLeft + 130, backBase + 36);

  const boardLeft = x0 + 256;
  drawSprite(g, BOARD, boardLeft, wall - 18 - BOARD.h * P);
  slot('board', boardLeft + 30, wall + 44);
  slot('board', boardLeft + 120, wall + 44);

  const coffeeLeft = x1 - 28 - COFFEE.w * P;
  prop(COFFEE, coffeeLeft, backBase - COFFEE.h * P);
  slot('coffee', coffeeLeft + 25, backBase + 36);
  slot('coffee', coffeeLeft - 70, backBase + 36);
  clocks.push({ x: coffeeLeft - 90, y: Math.round(wall * 0.45) });

  const winFrom = boardLeft + BOARD.w * P + 40;
  const winTo = coffeeLeft - 130;
  const count = Math.max(0, Math.floor((winTo - winFrom + 40) / 140));
  const winStart = winFrom + (winTo - winFrom - (count * 140 - 40)) / 2;
  for (let i = 0; i < count; i++) drawSprite(g, WINDOW, Math.round(winStart + i * 140), wall - 84);

  // Desks in a row, in the middle of the room.
  const desks = clamp(Math.floor((W - 80) / 170), 1, 3);
  const deskW = DESK.w * P;
  const deskTop = wall + floor * 0.36;
  const deskStart = x0 + (W - (desks * deskW + (desks - 1) * 24)) / 2;
  for (let i = 0; i < desks; i++) {
    const left = deskStart + i * (deskW + 24);
    prop(DESK, left, deskTop);
    // Feet just behind the desk, so the animation's keyboard lands on the desktop.
    slot('desk', left + 18 * P, deskTop + (DESK_SURFACE + 1) * P, 2);
  }

  // Listening corner.
  const radioLeft = x1 - 200;
  const radioBase = wall + floor * 0.6;
  prop(RADIO, radioLeft, radioBase - RADIO.h * P);
  slot('radio', radioLeft - 40, radioBase - 4);
  slot('radio', radioLeft + RADIO.w * P + 40, radioBase - 4);

  // Play rug, beanbags and the front of the room.
  const rugW = Math.round(clamp(W * 0.3, 160, 300));
  const rugX = x0 + W * 0.6;
  const rugY = wall + floor * 0.86;
  paintRug(g, rugX, rugY, rugW, 80);
  for (const dx of [-rugW / 3, 0, rugW / 3]) slot('rug', rugX + dx, rugY + 10);

  const bagBase = floorBottom - 8;
  for (const left of [x0 + 28, x0 + 118]) {
    prop(BEANBAG, left, bagBase - BEANBAG.h * P);
    slot('beanbag', left + 35, bagBase - 2 * P);
  }
  prop(PLANT, x1 - 68, floorBottom - 4 - PLANT.h * P);

  for (const f of [0.3, 0.42, 0.54]) slot('front', x0 + W * f, floorBottom - 2);

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
    zones.push(furnish(g, { x0: i * zoneWidth, x1: (i + 1) * zoneWidth, wall, floorBottom, name: names[i] }, props, clocks));
    if (i > 0) {
      g.fillStyle = '#d6cfbe';
      g.fillRect(Math.round(i * zoneWidth) - 2, 0, 4, height);
    }
  }
  return { background, zones, props, clocks };
}

export function drawClock(ctx, { x, y }, date) {
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
