// Building site decor: on waste ground, every session builds its own room after
// the structure of its launch directory. The room goes up one step at a time:
// setting out, the back wall course by course, the side and front walls, the
// openings, the floor, then a piece of furniture per folder. How many steps a
// session did comes from the server (kept per directory, so a reload resumes);
// the demo makes them up as time goes by.
import { INK, drawSprite, sprite } from './pixels.js';
import { SITE_KIT } from './office.js';

const { DESK, DESK_SURFACE, SHELF, BOARD, PLANT, CABINET, COOLER, PAINTING, seeded } = SITE_KIT;
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), Math.max(lo, hi));

// Sizes in sprite pixels.
const WALL = 22; // back wall height
const COURSE = 2; // a course of bricks
const BRICK_W = 4;
const SIDE = 3; // walls seen from above
const SEGMENTS = 6; // steps per side wall and for the front wall
const FLOOR_STEPS = 4;
const DOOR_W = 14;
const WINDOW = { w: 14, h: 9, top: 5 };
const DEMO_PACE = 900; // ms per step in the demo

const GROUND = '#d6c49b';
const GROUND_DOTS = ['#c3ae82', '#e2d4b0', '#b9a378'];
const MORTAR = '#e3d8c3';
const BRICK = '#c8664a';
const BRICK_LOW = '#b0553c';
const WALL_TOP = '#9c5440';
const WALL_EDGE = '#6e3b2c';
const CAP = '#7d6a56';
const CHALK = 'rgb(255 255 255 / 0.8)';
const GLASS = '#d4e8f2';
const THRESHOLD = '#c9b48f';

// The floor follows the language most files are written in.
const FLOORS = {
  js: { style: 'planks', base: '#d9b27c', line: '#bf955f' },
  py: { style: 'checker', base: '#e8eef3', alt: '#c9d8e5' },
  metal: { style: 'plate', base: '#b7bdc3', line: '#98a0a7' },
  jvm: { style: 'checker', base: '#d58a63', alt: '#c4764f' },
  ruby: { style: 'checker', base: '#e3b7b7', alt: '#cf9c9c' },
  php: { style: 'planks', base: '#b9a0cf', line: '#a088b8' },
  swift: { style: 'checker', base: '#f1c9a5', alt: '#e3b088' },
  other: { style: 'carpet', base: '#8fa3b8', line: '#7f93a8' },
};

// Lab bench for the tests: flasks and a microscope.
const BENCH = sprite([
  '..W.....W.....W.....',
  '..S....SSS....S...KK',
  '.SSS...SBS...SRS..KG',
  '.SPS...SBS...SRS.KK.',
  '.SPS...SSS...SSS.KKK',
  'OOOOOOOOOOOOOOOOOOOO',
  'DDDDDDDDDDDDDDDDDDDD',
  '.D................D.',
  '.D................D.',
  '.D................D.',
]);
const TOOLBOX = sprite([
  '...KKKK...',
  '...K..K...',
  'RRRRRRRRRR',
  'RRRRYYRRRR',
  'RRRRRRRRRR',
  'RRRRRRRRRR',
]);
// The CI: a conveyor belt with parcels, and its traffic light.
const CONVEYOR = sprite([
  '...................KKK',
  '...................KRK',
  '...................KYK',
  '.....HHH...........KPK',
  '.HHH.HYH...HHH.....KKK',
  '.HYH.HHH...HYH......K.',
  'GGGGGGGGGGGGGGGGGGG.K.',
  'KAKAKAKAKAKAKAKAKAK.K.',
  'GGGGGGGGGGGGGGGGGGG.K.',
  '.K...............K..K.',
  '.K...............K.KKK',
]);
const CONTAINER = sprite([
  'NNNNNNNNNNNNNNNNNNNN',
  'NIINIINIINIINIINIIIN',
  'NIINIINIINIINIINIIIN',
  'NIINIINIINIWWWWWWWIN',
  'NIINIINIINIWNNNNNWIN',
  'NIINIINIINIWWWWWWWIN',
  'NIINIINIINIINIINIIIN',
  'NIINIINIINIINIINIIIN',
  'NNNNNNNNNNNNNNNNNNNN',
  '.K................K.',
]);
// The project manifest: an electrical panel on the wall.
const PANEL = sprite([
  'GGGGGGGG',
  'GAAAAAAG',
  'GAKAKAKG',
  'GAAAYAAG',
  'GAAYYAAG',
  'GAAAYAAG',
  'GAKAKAKG',
  'GGGGGGGG',
]);
// The dependencies: a stack of cartons in a corner.
const CARTONS = sprite([
  '...OOOOOOO....',
  '...OOOWOOO....',
  '...OOOWOOO....',
  '...DDDDDDD....',
  'OOOOOOOOOOOOOO',
  'OOOWOOOOOOWOOO',
  'OOOWOOOOOOWOOO',
  'OOOWOOOOOOWOOO',
  'DDDDDDDDDDDDDD',
]);
// Any other folder: a crate.
const CRATE = sprite([
  'HHHHHHHHHH',
  'HDOOOOOODH',
  'HODOOOODOH',
  'HOODOODOOH',
  'HOOODDOOOH',
  'HOODOODOOH',
  'HODOOOODOH',
  'HHHHHHHHHH',
]);
// The bricks still to lay, on a pallet, and the thermos for the break.
const PILE = sprite([
  '....TTTTTTTT......',
  '....UUUUUUUU......',
  '..TTTTTTTTTTTT....',
  '..UUUUUUUUUUUU..RR',
  'TTTTTTTTTTTTTTTTRR',
  'UUUUUUUUUUUUUUUUGG',
  'HHHHHHHHHHHHHHHHRR',
  'H..H...HH...H..HRR',
]);

// Where each item goes: painted on the back wall, standing against it, or on the floor.
const ITEMS = {
  desk: { s: DESK, place: 'floor', station: 'desk' },
  bench: { s: BENCH, place: 'floor' },
  shelf: { s: SHELF, place: 'back', station: 'shelf' },
  painting: { s: PAINTING, place: 'wall' },
  toolbox: { s: TOOLBOX, place: 'floor' },
  conveyor: { s: CONVEYOR, place: 'floor' },
  container: { s: CONTAINER, place: 'floor' },
  panel: { s: PANEL, place: 'wall' },
  cartons: { s: CARTONS, place: 'back' },
  archive: { s: CABINET, place: 'back' },
  crate: { s: CRATE, place: 'floor' },
  plant: { s: PLANT, place: 'back' },
  cooler: { s: COOLER, place: 'back', station: 'coffee' },
  board: { s: BOARD, place: 'wall', station: 'board' },
};

const FOLDERS = [
  [/^(src|source|lib|libs|app|apps|packages|cmd|internal|pkg|server|client|core|components|pages|routes|api|services|modules|crates)$/i, 'desk'],
  [/^(tests?|specs?|__tests__|e2e|cypress|testing)$/i, 'bench'],
  [/^(docs?|documentation|wiki|guides?)$/i, 'shelf'],
  [/^(public|static|assets|images?|img|media|res|resources|icons|fonts)$/i, 'painting'],
  [/^(scripts?|bin|tools|hack|tasks)$/i, 'toolbox'],
  [/^\.(github|gitlab)$/i, 'conveyor'],
];
const MANIFESTS = /^(package\.json|pyproject\.toml|setup\.py|cargo\.toml|go\.mod|pom\.xml|build\.gradle(\.kts)?|gemfile|composer\.json|package\.swift)$/i;

// The furniture a directory calls for, in building order: its folders, biggest
// first, then what its top-level files and heavy folders say, then the basics.
function itemsOf(plan, random) {
  const items = [];
  const add = (kind, name) => items.push({ kind, name, ...ITEMS[kind] });
  const dirs = plan?.dirs ?? [];
  const top = plan?.top ?? [];
  for (const d of dirs) {
    const kind = FOLDERS.find(([re]) => re.test(d.name))?.[1] ?? (random() < 0.5 ? 'crate' : 'plant');
    const n = kind === 'desk' ? clamp(Math.ceil(d.files / 30), 1, 3) : 1;
    for (let i = 0; i < n; i++) add(kind, d.name);
  }
  if (!items.some((it) => it.kind === 'shelf') && top.some((f) => /^readme/i.test(f))) add('shelf', 'README');
  if (top.some((f) => /^(dockerfile|docker-compose|compose)/i.test(f))) add('container', 'Dockerfile');
  const manifest = top.find((f) => MANIFESTS.test(f));
  if (manifest) add('panel', manifest);
  if ((plan?.heavy ?? []).some((h) => /^(node_modules|vendor|\.?venv)$/.test(h))) add('cartons', 'dépendances');
  if ((plan?.heavy ?? []).includes('.git')) add('archive', '.git');
  add('cooler', 'café');
  add('board', 'plan');
  for (const it of items.slice(-2)) it.basic = true;
  return items;
}

// A made-up directory for the demo, the same for a given name.
function demoPlan(name, random) {
  const pool = ['src', 'tests', 'docs', 'public', 'scripts', '.github', 'config', 'data', 'lib', 'examples'];
  const dirs = pool.filter(() => random() < 0.55).map((n) => ({ name: n, files: Math.floor(5 + random() * 80) }));
  const files = dirs.reduce((s, d) => s + d.files, 0);
  const langs = Object.keys(FLOORS);
  return { files, lang: langs[Math.floor(random() * langs.length)], dirs, heavy: ['.git', 'node_modules'], top: ['README.md', 'package.json', name.length % 2 ? 'Dockerfile' : 'LICENSE'] };
}

// One plot: the room's footprint, its plan of steps and where everything goes.
function plotRoom(i, { colW, height, p, name, plan, random }) {
  const plotX = i * colW;
  const labelSpace = Math.max(20, Math.round(p * 5.6));
  const headRoom = 18 * p + 22; // hats, flags and the name plate over the wall
  const avail = height - labelSpace - headRoom - 6;
  const size = clamp(Math.log10((plan?.files ?? 10) + 1) / 3, 0, 1);
  const roomW = Math.round(clamp(colW * (0.55 + 0.4 * size), Math.min(colW - 16, 80 * p), colW - 16));
  const roomH = Math.round(clamp(avail * (0.6 + 0.4 * size), Math.min(avail, 64 * p), avail));
  const left = Math.round(plotX + (colW - roomW) / 2);
  const right = left + roomW;
  const bottom = height - labelSpace - 4;
  const top = bottom - roomH;
  const wallBase = top + WALL * p;
  const ix0 = left + SIDE * p;
  const ix1 = right - SIDE * p;
  const iy1 = bottom - SIDE * p;
  const doorCx = Math.round(left + roomW * (0.35 + random() * 0.3));
  const door = { x0: doorCx - (DOOR_W * p) / 2, x1: doorCx + (DOOR_W * p) / 2 };
  const floor = FLOORS[plan?.lang] ?? FLOORS.other;
  const room = { name, left, right, top, bottom, wallBase, ix0, ix1, iy1, door, floor, p, n: 0, puffs: [] };

  // Along the back: windows first, then wall and standing items in free spans.
  const spans = [];
  const freeAt = (x, w) => spans.every((s) => x + w <= s.x0 || s.x1 <= x);
  const take = (w) => {
    for (let x = ix0 + 3 * p; x + w <= ix1 - 3 * p; x += p) {
      if (freeAt(x - 2 * p, w + 4 * p)) {
        spans.push({ x0: x, x1: x + w });
        return x;
      }
    }
    return null;
  };
  const windows = (roomW >= 120 * p ? [0.28, 0.72] : [0.5]).map((f) => {
    const x = Math.round(left + roomW * f - (WINDOW.w * p) / 2);
    spans.push({ x0: x, x1: x + WINDOW.w * p });
    return { x, y: top + WINDOW.top * p };
  });
  room.windows = windows;

  // On the floor: rows of items, each row leaving room behind it for a Clawd.
  const pileTop = iy1 - PILE.h * p - 4 * p;
  let rowTop = wallBase + 16 * p;
  let rowH = 0;
  let cursor = ix0 + 6 * p;
  const placeFloor = (s) => {
    const w = s.w * p;
    const h = s.h * p;
    if (cursor + w > ix1 - 6 * p) {
      rowTop += rowH + 18 * p;
      rowH = 0;
      cursor = ix0 + 6 * p;
    }
    // The front row keeps clear of the brick pile, on the left by the front wall.
    const limit = rowTop + h > pileTop ? null : true;
    if (!limit || cursor + w > ix1 - 6 * p) return null;
    const at = { left: cursor, top: rowTop };
    cursor += w + 8 * p;
    rowH = Math.max(rowH, h);
    return at;
  };

  // The whiteboard and the coffee are placed first, so they always fit, but built last.
  const wanted = itemsOf(plan, random);
  const order = [...wanted.filter((it) => it.basic), ...wanted.filter((it) => !it.basic)];
  for (const item of order) {
    const { s } = item;
    if (item.place === 'floor') item.at = placeFloor(s);
    else {
      const x = take(s.w * p);
      if (x !== null) item.at = item.place === 'wall' ? { left: x, top: top + 4 * p } : { left: x, top: wallBase + 2 * p - s.h * p };
    }
  }
  const items = wanted.filter((it) => it.at).map(({ at, ...it }) => ({ ...it, ...at, base: at.top + it.s.h * p }));
  room.items = items;
  room.pile = { left: ix0 + 2 * p, top: iy1 - 2 * p - PILE.h * p };

  // The steps, in order, with where the main Clawd stands for each and what it does.
  const steps = [];
  const inside = (x, y) => ({ x: clamp(x, ix0 + 12 * p, ix1 - 12 * p), y: clamp(y, wallBase + 6 * p, iy1 - 3 * p) });
  const corners = [inside(ix0, wallBase), inside(ix1, wallBase), inside(ix1, iy1), inside(ix0, iy1)];
  for (let k = 0; k < 2; k++) steps.push({ kind: 'trace', k, anim: 'hammer', spot: corners[k * 2] });
  const courses = WALL / COURSE;
  for (let k = 0; k < courses; k++) steps.push({ kind: 'back', k, anim: 'trowel', spot: inside(left + roomW * (0.2 + 0.3 * (k % 3)), wallBase) });
  for (const side of ['left', 'right']) {
    for (let k = 0; k < SEGMENTS; k++) {
      const y = wallBase + ((iy1 - wallBase) * (k + 0.5)) / SEGMENTS;
      steps.push({ kind: side, k, anim: 'trowel', spot: inside(side === 'left' ? ix0 : ix1, y) });
    }
  }
  for (let k = 0; k < SEGMENTS; k++) {
    const leftSide = k % 2 === 0;
    const j = Math.floor(k / 2);
    const x = leftSide ? left + ((door.x0 - left) * (j + 0.5)) / 3 : right - ((right - door.x1) * (j + 0.5)) / 3;
    steps.push({ kind: 'front', k, anim: 'trowel', spot: inside(x, iy1) });
  }
  steps.push({ kind: 'door', anim: 'hammer', spot: inside(doorCx, iy1) });
  windows.forEach((w, k) => steps.push({ kind: 'window', k, anim: 'hammer', spot: inside(w.x + (WINDOW.w * p) / 2, wallBase) }));
  for (let k = 0; k < FLOOR_STEPS; k++) {
    const y = wallBase + ((iy1 - wallBase) * (k + 0.5)) / FLOOR_STEPS;
    steps.push({ kind: 'floor', k, anim: 'hammer', spot: inside(left + roomW * (k % 2 ? 0.65 : 0.35), y) });
  }
  items.forEach((it, k) => {
    const below = it.place === 'floor' ? it.base + 4 * p : wallBase + 6 * p;
    steps.push({ kind: 'item', k, anim: 'hammer', spot: inside(it.left + (it.s.w * p) / 2, below) });
  });
  room.steps = steps;
  room.done = (kind) => steps.slice(0, room.n).filter((s) => s.kind === kind).length;
  return room;
}

// Walls, floor and what is painted on the wall, for the steps done so far.
function paintRoom(g, room) {
  const { left, right, top, bottom, wallBase, ix0, ix1, iy1, door, p, floor } = room;
  const roomW = right - left;
  const seam = Math.max(1, Math.round(p / 3));
  const done = room.done;

  const floorRows = done('floor');
  if (floorRows < FLOOR_STEPS) {
    // The setting out, in chalk, until the floor covers it.
    g.strokeStyle = CHALK;
    g.lineWidth = Math.max(1, p / 2);
    g.setLineDash([3 * p, 2 * p]);
    const traced = done('trace');
    if (traced) {
      g.beginPath();
      g.moveTo(left, iy1);
      g.lineTo(left, wallBase);
      g.lineTo(right, wallBase);
      if (traced > 1) {
        g.lineTo(right, iy1);
        g.closePath();
      }
      g.stroke();
    }
    g.setLineDash([]);
  }
  if (floorRows) {
    const h = ((iy1 - wallBase) * floorRows) / FLOOR_STEPS;
    paintFloor(g, floor, ix0, wallBase, ix1 - ix0, Math.round(h), p);
  }

  // Back wall, course by course from the ground up.
  const courses = done('back');
  for (let k = 0; k < courses; k++) {
    const y = wallBase - (k + 1) * COURSE * p;
    g.fillStyle = MORTAR;
    g.fillRect(left, y, roomW, COURSE * p);
    g.fillStyle = k < 2 ? BRICK_LOW : BRICK;
    const offset = k % 2 ? (BRICK_W * p) / 2 : 0;
    for (let x = left - offset; x < right; x += BRICK_W * p) {
      const x0 = Math.max(left, x);
      const x1 = Math.min(right, x + BRICK_W * p - seam);
      if (x1 > x0) g.fillRect(x0, y, x1 - x0, COURSE * p - seam);
    }
  }
  if (courses === WALL / COURSE) {
    g.fillStyle = CAP;
    g.fillRect(left, top - p, roomW, p);
  }
  room.windows.forEach((w, k) => {
    if (done('window') <= k) return;
    const ww = WINDOW.w * p;
    const wh = WINDOW.h * p;
    g.fillStyle = INK.W;
    g.fillRect(w.x - p, w.y - p, ww + 2 * p, wh + 2 * p);
    g.fillStyle = GLASS;
    g.fillRect(w.x, w.y, ww, wh);
    g.fillStyle = INK.W;
    g.fillRect(w.x + ww / 2 - p / 2, w.y, p, wh);
    g.fillStyle = INK.A;
    g.fillRect(w.x - 2 * p, w.y + wh + p, ww + 4 * p, p);
  });
  for (const it of room.items) {
    if (it.built && it.place === 'wall') drawSprite(g, it.s, it.left, it.top, p);
  }

  // Side walls seen from above, from the back to the front.
  for (const [side, x] of [['left', left], ['right', right - SIDE * p]]) {
    const n = done(side);
    if (!n) continue;
    const h = ((bottom - top + p) * n) / SEGMENTS;
    topWall(g, x, top - p, SIDE * p, h, p);
  }
}

function paintFloor(g, floor, x, y, w, h, p) {
  g.fillStyle = floor.base;
  g.fillRect(x, y, w, h);
  if (floor.style === 'planks') {
    g.fillStyle = floor.line;
    for (let row = 0, yy = y; yy < y + h; row++, yy += 4 * p) {
      g.fillRect(x, yy, w, Math.max(1, p / 3));
      for (let xx = x + (row % 2 ? 9 : 3) * p; xx < x + w; xx += 12 * p) g.fillRect(xx, yy, Math.max(1, p / 3), Math.min(4 * p, y + h - yy));
    }
  } else if (floor.style === 'checker') {
    g.fillStyle = floor.alt;
    const t = 6 * p;
    for (let yy = 0; yy < h; yy += t) {
      for (let xx = (yy / t) % 2 ? t : 0; xx < w; xx += 2 * t) g.fillRect(x + xx, y + yy, Math.min(t, w - xx), Math.min(t, h - yy));
    }
  } else {
    g.fillStyle = floor.line;
    const step = floor.style === 'plate' ? 5 * p : 3 * p;
    for (let yy = p; yy < h; yy += step) {
      for (let xx = ((yy / step) % 2 ? step / 2 : 0) + p; xx < w; xx += step) g.fillRect(x + xx, y + yy, p, floor.style === 'plate' ? p : Math.max(1, p / 2));
    }
  }
}

// A wall seen from above: brick tops in a running bond, darker edges.
function topWall(g, x, y, w, h, p) {
  g.fillStyle = WALL_TOP;
  g.fillRect(x, y, w, h);
  g.fillStyle = MORTAR;
  const horizontal = w > h;
  if (horizontal) {
    for (let xx = x; xx < x + w; xx += BRICK_W * p) g.fillRect(xx, y, Math.max(1, p / 3), h);
  } else {
    for (let yy = y; yy < y + h; yy += BRICK_W * p) g.fillRect(x, yy, w, Math.max(1, p / 3));
  }
  g.fillStyle = WALL_EDGE;
  if (horizontal) g.fillRect(x, y + h - Math.max(1, p / 2), w, Math.max(1, p / 2));
  else {
    g.fillRect(x, y, Math.max(1, p / 2), h);
    g.fillRect(x + w - Math.max(1, p / 2), y, Math.max(1, p / 2), h);
  }
}

// The front wall stands in front of the Clawds: drawn with them, by depth.
function drawFront(ctx, room) {
  const { left, right, bottom, door, p } = room;
  const n = room.done('front');
  const y = bottom - SIDE * p;
  for (let k = 0; k < n; k++) {
    const j = Math.floor(k / 2);
    if (k % 2 === 0) {
      const w = (door.x0 - left) / 3;
      topWall(ctx, Math.round(left + j * w), y, Math.ceil(w), SIDE * p, p);
    } else {
      const w = (right - door.x1) / 3;
      topWall(ctx, Math.round(right - (j + 1) * w), y, Math.ceil(w), SIDE * p, p);
    }
  }
  if (room.done('door')) {
    ctx.fillStyle = THRESHOLD;
    ctx.fillRect(door.x0, y, door.x1 - door.x0, SIDE * p);
    ctx.fillStyle = INK.H;
    ctx.fillRect(door.x0 - p, y - 2 * p, p, SIDE * p + 2 * p);
    ctx.fillRect(door.x1, y - 2 * p, p, SIDE * p + 2 * p);
  }
}

// Station builders, as in the office: a place to stand, facing a way.
const station = (type, spot, extra = {}) => ({ type, occupant: null, dir: 1, ...extra, spot });

export function buildSite(width, height, names, { px = 4, salt = '', sessions = [], demo = false } = {}) {
  const p = px;
  const background = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1;
  background.width = Math.round(width * dpr);
  background.height = Math.round(height * dpr);
  const g = background.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  // Waste ground: sand and gravel.
  g.fillStyle = GROUND;
  g.fillRect(0, 0, width, height);
  const dots = seeded(`ground${salt}`);
  for (let i = 0; i < (width * height) / (60 * p * p); i++) {
    g.fillStyle = GROUND_DOTS[Math.floor(dots() * GROUND_DOTS.length)];
    g.fillRect(Math.floor((dots() * width) / p) * p, Math.floor((dots() * height) / p) * p, p, p);
  }

  const layer = document.createElement('canvas');
  layer.width = background.width;
  layer.height = background.height;
  const lg = layer.getContext('2d');
  lg.setTransform(dpr, 0, 0, dpr, 0, 0);

  const n = Math.max(1, names.length);
  const colW = width / n;
  const born = performance.now();
  const rooms = Array.from({ length: n }, (_, i) => {
    const name = names[i] ?? '';
    const random = seeded(`${salt}${name}#site`);
    const plan = sessions[i]?.site?.plan ?? (demo ? demoPlan(name, seeded(`${name}#demo`)) : null);
    return plotRoom(i, { colW, height, p, name, plan, random });
  });

  const props = [];
  const zones = rooms.map((room) => {
    const { ix0, ix1, iy1, wallBase, door } = room;
    // Who builds: the main Clawd where the work is, helpers on either side.
    const current = () => room.steps[Math.min(room.n, room.steps.length - 1)];
    const help = (dx) => () => {
      const s = current().spot;
      return { x: clamp(s.x + dx * p, ix0 + 12 * p, ix1 - 12 * p), y: s.y + 3 * p };
    };
    const build = [
      station('build', () => current().spot, { mainOnly: true, moves: true }),
      station('build', help(-22), { moves: true }),
      station('build', help(22), { moves: true }),
    ];
    for (const slot of build) Object.defineProperty(slot, 'anims', { get: () => [current().anim] });
    const pileSlot = station('coffee', () => ({ x: room.pile.left + PILE.w * p + 8 * p, y: room.pile.top + PILE.h * p }), { dir: -1 });
    const doorSlot = station('front', () => ({ x: (door.x0 + door.x1) / 2, y: iy1 - 6 * p }));
    for (const it of room.items) {
      const { left, top, s } = it;
      if (it.station === 'desk') it.slots = [station('desk', (scale) => ({ x: left + 18 * p, y: top + (DESK_SURFACE + 1) * p + 2 * scale }), { mainOnly: true })];
      if (it.station === 'shelf') it.slots = [station('shelf', () => ({ x: left + (s.w * p) / 2, y: it.base + 7 * p }))];
      if (it.station === 'board') it.slots = [station('board', () => ({ x: left + 6 * p, y: wallBase + 9 * p })), station('board', () => ({ x: left + (s.w - 6) * p, y: wallBase + 9 * p }))];
      if (it.station === 'coffee') it.slots = [station('coffee', () => ({ x: left + (s.w + 5) * p, y: it.base + 4 * p }), { dir: -1 })];
    }
    const built = (type) => room.items.filter((it) => it.built && it.station === type).flatMap((it) => it.slots);
    const stations = {};
    for (const type of ['desk', 'shelf', 'board', 'chat', 'radio', 'beanbag', 'rug']) Object.defineProperty(stations, type, { get: () => built(type) });
    Object.defineProperty(stations, 'build', { get: () => (room.n < room.steps.length ? build : []) });
    Object.defineProperty(stations, 'coffee', { get: () => (built('coffee').length ? built('coffee') : [pileSlot]) });
    stations.front = [doorSlot];

    for (const it of room.items) {
      if (it.place === 'wall') continue;
      props.push({ base: it.base, draw: (ctx) => it.built && drawSprite(ctx, it.s, it.left, it.top, p) });
    }
    props.push({
      base: room.pile.top + PILE.h * p,
      draw: (ctx) => room.n < room.steps.length && drawSprite(ctx, PILE, room.pile.left, room.pile.top, p),
    });
    props.push({ base: room.bottom, draw: (ctx) => drawFront(ctx, room) });

    return {
      x0: ix0 + 2 * p,
      x1: ix1 - 2 * p,
      y0: wallBase + 6 * p,
      y1: iy1 - 8 * p, // names stay clear of the front wall
      site: true,
      get building() {
        return room.n < room.steps.length;
      },
      stations,
    };
  });

  let painted = '';
  function repaint() {
    const key = rooms.map((r) => r.n).join(',');
    if (key === painted) return;
    painted = key;
    lg.clearRect(0, 0, width, height);
    for (const room of rooms) paintRoom(lg, room);
  }

  // Steps done per session: the server's, or the demo's clock.
  function sync(list, now) {
    rooms.forEach((room, i) => {
      const steps = demo ? Math.floor((now - born) / DEMO_PACE) : list[i]?.site?.steps ?? 0;
      const next = Math.min(room.steps.length, steps);
      if (next === room.n) return;
      // A puff of dust where something new went up; none on the first sync after a reload.
      if (room.synced && next > room.n) {
        for (const step of room.steps.slice(Math.max(room.n, next - 3), next)) room.puffs.push({ ...step.spot, at: now });
      }
      room.synced = true;
      room.n = next;
      room.items.forEach((it, k) => {
        it.built = room.done('item') > k;
      });
    });
  }

  return {
    background,
    height,
    zones,
    shared: false,
    props,
    bare: true,
    hats: true,
    sync,
    overlay(ctx) {
      repaint();
      ctx.drawImage(layer, 0, 0, width, height);
    },
    labels(ctx) {
      const now = performance.now();
      for (const room of rooms) {
        room.puffs = room.puffs.filter((f) => now - f.at < 700);
        for (const f of room.puffs) {
          const t = (now - f.at) / 700;
          ctx.fillStyle = `rgb(240 232 214 / ${0.8 * (1 - t)})`;
          for (const [dx, dy] of [[-6, -2], [5, -4], [0, -9], [-3, 3], [6, 2]]) {
            const r = (1.5 + t * 2.5) * p;
            ctx.beginPath();
            ctx.arc(f.x + dx * p * (0.6 + t), f.y - 6 * p + dy * p * (0.6 + t), r, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        // The name over the wall, and how far the work went until it is done.
        const total = room.steps.length;
        const label = room.n < total ? `${room.name} · chantier ${Math.floor((room.n / total) * 100)} %` : room.name;
        ctx.font = '600 12px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#5a4a36';
        ctx.fillText(label, (room.left + room.right) / 2, room.top - p - 6);
      }
    },
  };
}
