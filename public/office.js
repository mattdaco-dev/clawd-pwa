// Open-space decor: walls, floor, whiteboards, windows and rugs painted once,
// furniture depth-sorted with the Clawds, and the stations where they go for
// each activity. Two layouts: one fixed-size room per session ("rooms"), or a
// single office every session shares ("shared").
//
// Distances below are written for 5 px pixels and scaled by u() to the chosen
// pixel size, so the whole office zooms with the Clawds.
import { PALETTES } from './render.js';

const INK = PALETTES.main;

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), Math.max(lo, hi));

function sprite(rows) {
  const cells = [];
  rows.forEach((row, y) => [...row].forEach((c, x) => {
    if (c !== '.') cells.push([x, y, c]);
  }));
  return { cells, w: rows[0].length, h: rows.length };
}

function drawSprite(ctx, s, left, top, p) {
  left = Math.round(left);
  top = Math.round(top);
  for (const [x, y, c] of s.cells) {
    ctx.fillStyle = INK[c];
    ctx.fillRect(left + x * p, top + y * p, p, p);
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

// The coffee corner: one drinks alone at the machine; two chat face to face in
// front of the counter, which takes the machine's place along with them.
function coffeeCorner(left, base, inFront, { p, u, standing, slot, stations }) {
  standing(COUNTER, left, base);
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

const WINDOW = sprite(Array.from({ length: 14 }, (_, y) =>
  y === 0 || y === 13 || y === 6 ? 'W'.repeat(20) : `W${'S'.repeat(8)}WW${'S'.repeat(8)}W`));

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
      for (let tx = x + ((row * 59) % length); tx < x + w; tx += length) g.fillRect(tx, ty, 1, plank);
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

function paintNameplate(g, name, cx, top) {
  if (!name) return;
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
function furnish(g, { x0, x1, top, bottom, name, seed, maxPerRow, maxRows }, { p, u, props, clocks, skies, lamps }) {
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
  paintNameplate(g, name, (x0 + x1) / 2, top - 14); // on the wall above the room, like a door sign

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
  const scatter = (s, yMin, yMax) => {
    const w = s.w * p;
    const h = s.h * p;
    for (let tries = 0; tries < 30; tries++) {
      const left = between(x0 + u(16), x1 - u(16) - w);
      const base = between(yMin, yMax);
      if (!fits(left - u(10), base - h, w + u(20), h + u(10))) continue;
      reserve(left - u(10), base - h, w + u(20), h + u(10));
      return standing(s, left, base);
    }
  };

  // Along the wall, left: maybe a plant, bookshelves, the whiteboard.
  const backBase = wall + u(16);
  const inFront = backBase + u(36);
  let cursor = x0 + u(24);
  if (chance(0.7)) {
    const plant = look.plant();
    standing(plant, cursor, backBase);
    cursor += plant.w * p + u(12);
  }
  const shelfCount = int(1, W >= u(760) ? 3 : W >= u(560) ? 2 : 1);
  for (let i = 0; i < shelfCount; i++) {
    standing(look.shelf(), cursor, backBase);
    slot('shelf', cursor + u(40), inFront);
    cursor += SHELF.w * p + u(int(6, 16));
  }
  const boardLeft = cursor + u(between(30, 90));
  // A floor lamp in the gap between the shelves and the whiteboard, for both.
  const reading = floorLamp((cursor + boardLeft) / 2 - (LAMP.w * p) / 2, backBase, p);
  standing(LAMP, reading.lamp.left, backBase);
  for (let i = 0; i < shelfCount; i++) stations.shelf[stations.shelf.length - 1 - i].light = reading;
  if (shelfCount === 1) slot('shelf', cursor + u(50), inFront, 0, { light: reading });
  drawSprite(g, look.board(), boardLeft, wall - u(18) - BOARD.h * p, p);
  slot('board', boardLeft + u(30), wall + u(44), 0, { light: reading });
  slot('board', boardLeft + u(120), wall + u(44), 0, { light: reading });

  // Along the wall, right: coffee corner, maybe a water cooler and a plant, the clock.
  let right = x1 - u(28) - COUNTER.w * p;
  coffeeCorner(right, backBase, inFront, { p, u, standing, slot, stations });
  if (chance(0.75)) {
    right -= u(20) + COOLER.w * p;
    standing(COOLER, right, backBase);
    slot('coffee', right + u(20), inFront);
  }
  if (chance(0.5)) {
    const plant = look.plant();
    right -= u(16) + plant.w * p;
    standing(plant, right, backBase);
  }
  slot('coffee', right - u(70), inFront);
  if (chance(0.85)) clocks.push({ x: right - u(between(30, 80)), y: top + Math.round(wallH * between(0.4, 0.55)) });
  reserve(x0, wall, W, u(60));

  const winFrom = boardLeft + BOARD.w * p + u(40);
  const winTo = right - u(120);
  const room = Math.max(0, Math.floor((winTo - winFrom + u(40)) / u(140)));
  const windows = Math.max(0, room - int(0, 1));
  for (let i = 0; i < windows; i++) {
    const left = winFrom + ((winTo - winFrom - u(100)) * (i + 0.5)) / windows - u(50) + u(between(-12, 12));
    drawSprite(g, WINDOW, left, wall - u(84), p);
    skies.push({ left: Math.round(left), top: Math.round(wall - u(84)) });
  }

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

  for (let i = int(2, 5) * sections; i > 0; i--) scatter(look.plant(), wall + u(80), floorBottom - u(4));
  if (chance(0.5)) scatter(CABINET, wall + floor * 0.5, floorBottom - u(4));

  return { x0: x0 + u(8), x1: x1 - u(8), y0: wall + u(24), y1: floorBottom, stations };
}


// The shared office, laid out like an interior designer would: library and
// meeting corner on the left, islands of desks in the middle split by low
// bookcases, kitchen and lounge on the right, a clear walkway at the front.
// Structured rather than scattered; the seed only picks variants and fabrics.
function furnishShared(g, { x0, x1, top, bottom }, { p, u, props, clocks, skies, lamps }) {
  const W = x1 - x0;
  const wallH = u(110);
  const wall = top + wallH;
  const floorBottom = bottom - Math.max(20, u(28));
  // Redecorated once a day.
  const random = seeded(`shared-office ${new Date().toDateString()}`);
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

  const leftW = Math.round(clamp(W * 0.22, u(300), u(460)));
  const rightW = Math.round(clamp(W * 0.27, u(360), u(540)));
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
  for (let y = floorTop + u(110); y <= floorEnd; y += u(170)) {
    standing(look.lowShelf(true), lx1 - (LOW_SHELF.w * p) / 2, y);
  }

  // ---- Right: kitchen along the wall, lounge in the middle of the zone.
  let kitchen = x1 - u(20) - FRIDGE.w * p;
  standing(FRIDGE, kitchen, backBase);
  slot('coffee', kitchen + u(25), inFront + u(10));
  kitchen -= u(12) + COUNTER.w * p;
  coffeeCorner(kitchen, backBase, inFront, { p, u, standing, slot, stations });
  kitchen -= u(12) + COOLER.w * p;
  standing(COOLER, kitchen, backBase);
  slot('coffee', kitchen + u(20), inFront);
  const kitchenPlant = look.plant();
  kitchen -= u(16) + kitchenPlant.w * p;
  standing(kitchenPlant, kitchen, backBase);
  drawSprite(g, PAINTING, kitchen - u(30) - PAINTING.w * p, wall - u(90), p);

  const loungeX = (rx0 + x1) / 2;
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
    centered(TABLE, loungeX, cafeBase);
    for (const side of [-1, 1]) {
      const cx = loungeX + side * u(100);
      seat(cafeChair, cx, cafeBase - cafeChair.h * p + u(4), 'coffee');
    }
    const cafePlant = look.tallPlant();
    standing(cafePlant, x1 - u(20) - cafePlant.w * p, cafeBase);
  }

  // Green divider between the desks and the lounge.
  for (let y = floorTop + u(120); y <= floorEnd; y += u(150)) {
    const plant = look.tallPlant();
    standing(plant, rx0 - (plant.w * p) / 2, y);
  }

  // ---- Middle: islands of 4 or 6 desks, in a grid with aisles.
  const cx0 = lx1 + u(60);
  const cx1 = rx0 - u(60);
  const cw = cx1 - cx0;
  const pitch = u(60); // between the pairs of desks of an island
  const islandW = u(290);
  const aisle = u(80);
  const cols = Math.max(1, Math.floor((cw + aisle) / (islandW + aisle)));
  const split = cols >= 3; // low bookcases between the two halves of the plateau
  const extra = split ? u(70) : 0;
  const gridW = cols * islandW + (cols - 1) * aisle + extra;
  const gx0 = cx0 + (cw - gridW) / 2;
  const colX = (c) => gx0 + c * (islandW + aisle) + (split && c >= Math.ceil(cols / 2) ? extra : 0);

  const footPlant = look.plant();
  const ch = floorEnd - floorTop - u(40);
  const height = (pairs) => (pairs - 1) * pitch + SIDE_DESK.h * p;
  const rowsPlan = [];
  let used = 0;
  for (const pairs of [3, 2, 3]) { // islands of 6, then 4, then 6 seats
    const need = height(pairs) + u(130);
    if (used + need > ch) continue;
    rowsPlan.push(pairs);
    used += need;
  }
  if (!rowsPlan.length) rowsPlan.push(2);
  const rowGap = (ch - used) / (rowsPlan.length + 1);
  let y = floorTop + u(60) + rowGap;
  let lastRowY = y;
  for (const pairs of rowsPlan.slice(0, -1)) lastRowY += height(pairs) + u(130) + rowGap;
  for (const pairs of rowsPlan) {
    for (let c = 0; c < cols; c++) {
      const leftDesk = colX(c) + u(75);
      const rightDesk = leftDesk + SIDE_DESK.w * p;
      for (let k = 0; k < pairs; k++) {
        const deskTop = y + k * pitch;
        const keys = deskTop + SIDE_KEYS * p;
        props.push({ base: keys + 2 * p, draw: (ctx) => drawSprite(ctx, SIDE_DESK, leftDesk, deskTop, p) });
        props.push({ base: keys + 2 * p, draw: (ctx) => drawSprite(ctx, SIDE_DESK_LEFT, rightDesk, deskTop, p) });
        slot('desk', leftDesk, keys, 5, { dxPerScale: -4.5, anims: ['type-side'], light: sideDeskLight(leftDesk, deskTop, p, 1) });
        slot('desk', rightDesk + SIDE_DESK.w * p, keys, 5, { dxPerScale: 3.5, dir: -1, anims: ['type-side'], light: sideDeskLight(rightDesk, deskTop, p, -1) });
      }
      // At the foot of each island: low bookcases separating it from the next
      // row, or a plant or a bin after the last one.
      const foot = y + height(pairs) + u(55);
      if (pairs !== rowsPlan.at(-1) || y !== lastRowY) {
        standing(look.lowShelf(true), rightDesk - LOW_SHELF.w * p, foot);
        standing(look.lowShelf(false), rightDesk, foot);
      } else {
        const end = pickOne([footPlant, footPlant, BIN, null]);
        if (end) centered(end, rightDesk, foot);
      }
    }
    y += height(pairs) + u(130) + rowGap;
  }
  if (split) {
    // Wider central aisle, lined with plants.
    const sx = colX(Math.ceil(cols / 2)) - aisle / 2 - extra / 2;
    const aislePlant = look.plant();
    for (let py = floorTop + u(140); py <= floorEnd; py += u(220)) centered(aislePlant, sx, py);
  }

  // ---- Wall over the plateau: windows in a regular rhythm, the clock in the middle.
  const wallFrom = shelfStart + shelves * (SHELF.w * p + u(4)) + u(30);
  const wallTo = kitchen - u(60) - PAINTING.w * p;
  const span = wallTo - wallFrom;
  const windows = Math.max(0, Math.floor(span / u(170)));
  const middle = windows % 2 ? Math.floor(windows / 2) : -1; // odd count: the clock takes the middle spot
  for (let i = 0; i < windows; i++) {
    const cx = wallFrom + (span * (i + 0.5)) / windows;
    if (i === middle) clocks.push({ x: cx, y: top + Math.round(wallH * 0.45) });
    else {
      drawSprite(g, WINDOW, cx - u(50), wall - u(84), p);
      skies.push({ left: Math.round(cx - u(50)), top: Math.round(wall - u(84)) });
    }
  }
  if (middle < 0) clocks.push({ x: wallFrom + span / 2, y: top + Math.round(wallH * 0.45) });

  // ---- Front walkway, framed by two tall plants.
  const entrance = look.tallPlant(); // the same model on both sides
  standing(entrance, x0 + u(16), floorBottom - u(4));
  standing(entrance, x1 - u(16) - entrance.w * p, floorBottom - u(4));
  const fronts = clamp(Math.floor(cw / u(110)), 3, 12);
  for (let i = 0; i < fronts; i++) slot('front', cx0 + (cw * (i + 0.5)) / fronts, floorBottom - u(2));

  return { x0: x0 + u(8), x1: x1 - u(8), y0: wall + u(24), y1: floorBottom, stations };
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
export function buildOffice(width, viewHeight, names, { px = 5, layout = 'rooms' } = {}) {
  const k = px / 5;
  const u = (n) => Math.round(n * k);
  const props = [];
  const clocks = [];
  const skies = []; // window panes, repainted with the sky of the hour
  const lamps = [];
  const env = { p: px, u, props, clocks, skies, lamps };
  const zones = [];
  let height = viewHeight;
  let background;

  if (layout === 'shared') {
    ({ canvas: background } = canvasFor(width, height));
    const g = background.getContext('2d');
    const area = { x0: 0, x1: width, top: 0, bottom: height, name: '', seed: 'shared', maxPerRow: 8, maxRows: 4 };
    // The designed plan needs room for its three zones; narrow windows keep the generic one.
    zones.push(width >= u(1300) && height >= u(700) ? furnishShared(g, area, env) : furnish(g, area, env));
  } else {
    const gap = Math.max(24, u(28));
    const roomW = Math.min(u(760), width - 2 * gap);
    const roomH = u(760);
    const n = Math.max(1, names.length);
    const cols = Math.max(1, Math.floor((width - gap) / (roomW + gap)));
    const used = Math.min(cols, n);
    const left0 = Math.round((width - used * roomW - (used - 1) * gap) / 2);
    height = Math.max(viewHeight, gap + Math.ceil(n / cols) * (roomH + gap));
    const { canvas, g } = canvasFor(width, height);
    background = canvas;
    g.fillStyle = '#ddd6c6'; // corridor between the rooms
    g.fillRect(0, 0, width, height);
    for (let i = 0; i < n; i++) {
      const x0 = left0 + (i % cols) * (roomW + gap);
      const top = gap + Math.floor(i / cols) * (roomH + gap);
      g.fillStyle = '#c4baa3'; // room walls
      g.fillRect(x0 - px, top - px, roomW + 2 * px, roomH + 2 * px);
      zones.push(furnish(g, { x0, x1: x0 + roomW, top, bottom: top + roomH, name: names[i] ?? '', seed: `${names[i] ?? ''}#${i}`, maxPerRow: 3, maxRows: 2 }, env));
    }
  }

  return {
    background,
    height,
    zones,
    shared: layout === 'shared',
    props,
    overlay(ctx, date) {
      for (const clock of clocks) drawClock(ctx, clock, date, u);
      const light = daylight(date);
      if (light.night || light.dusk) skies.forEach((w, i) => drawSky(ctx, w, i, light, px));
    },
    // Drawn over everything: the evening dims the office, lamps light up around
    // them. Returns how dark it is, so labels can switch to a light ink.
    shade(ctx, date, width, h) {
      const { night, dusk } = daylight(date);
      if (dusk) {
        ctx.fillStyle = `rgb(242 140 60 / ${0.08 * dusk})`;
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
      return night;
    },
  };
}

// How dark it is from the local hour: night 0 by day, 1 from 21:00 to 6:00, with
// an hour-long ramp around; dusk peaks at sunset and sunrise.
export function daylight(date) {
  const h = date.getHours() + date.getMinutes() / 60;
  const night = h >= 21 || h < 6 ? 1 : h >= 18 ? (h - 18) / 3 : h < 8 ? (8 - h) / 2 : 0;
  const peak = (at, width) => Math.max(0, 1 - Math.abs(h - at) / width);
  return { night, dusk: Math.max(peak(19.5, 1.5), peak(6.5, 1)) };
}

const DAY_SKY = [191, 224, 255];
const DUSK_SKY = [244, 170, 120];
const NIGHT_SKY = [31, 42, 77];

// Paints the panes of a WINDOW sprite with the sky of the hour, stars at night.
function drawSky(ctx, { left, top }, index, { night, dusk }, p) {
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  // The sky turns dark later than the room, so sunset stays orange.
  const [r, g, b] = mix(mix(DAY_SKY, DUSK_SKY, dusk), NIGHT_SKY, Math.max(0, (night - 0.3) / 0.7));
  ctx.fillStyle = `rgb(${r} ${g} ${b})`;
  for (const [x0, y0] of [[1, 1], [11, 1], [1, 7], [11, 7]]) {
    ctx.fillRect(left + x0 * p, top + y0 * p, 8 * p, (y0 === 1 ? 5 : 6) * p);
  }
  if (night < 0.6) return;
  ctx.fillStyle = '#fff6d6';
  for (let k = 0; k < 3; k++) {
    // The same few stars in each window every night.
    const n = (index * 7 + k * 13) % 29;
    const x = [2, 5, 7, 12, 15, 17][n % 6];
    const y = [2, 3, 4, 8, 10][n % 5];
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
