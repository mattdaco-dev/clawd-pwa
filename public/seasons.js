// What makes the office feel like the season, on top of the pumpkins and the
// tree placed by office.js: a garland along every wall, cobwebs and a ghost or
// stockings and a wreath, snow on the window sills, a few things on the floor.
import { INK, drawSprite, sprite } from './pixels.js';

const BAT = sprite([
  'K.......K',
  'KK.K.K.KK',
  'KKKKKKKKK',
  '.KK.K.KK.',
  '..K...K..',
]);
const GHOST = sprite([
  '..WWWW..',
  '.WWWWWW.',
  'WWKWWKWW',
  'WWKWWKWW',
  'WWWWWWWW',
  'WWWKKWWW',
  'WWWWWWWW',
  'WW.WW.WW',
]);
const CAULDRON = sprite([
  '..P..P.P..',
  '.PPPPPPPP.',
  'KKKKKKKKKK',
  '.KKKKKKKK.',
  'KKKKKKKKKK',
  'KKKKKKKKKK',
  '.KKKKKKKK.',
  '..K....K..',
]);
const CAULDRON_BREW = CAULDRON.cells.filter(([, , c]) => c === 'P');
const WREATH = sprite([
  '...gPg...',
  '.gPgRgPg.',
  'gPg...gPg',
  'Pg.....gP',
  'gP.....Pg',
  'Pg.....gP',
  'gPg...gPg',
  '.gPgRRPg.',
  '...RRRR..',
  '...R..R..',
]);
const STOCKINGS = ['R', 'P', 'B'].map((c) => sprite([
  'WWWW..',
  'WWWW..',
  `${c}${c}${c}${c}..`,
  `${c}W${c}${c}..`,
  `${c}${c}${c}${c}..`,
  `${c}${c}${c}${c}${c}.`,
  `${c}${c}${c}${c}${c}${c}`,
  `.${c}${c}${c}${c}${c}`,
]));
const POINSETTIA = sprite([
  '..R.R.R..',
  '.RRRYRRR.',
  'RRgRRRgRR',
  '.RRgRgRR.',
  '..gRRRg..',
  '...HHH...',
  '...HHH...',
  '....H....',
]);
const PENNANT_COLORS = ['o', 'K', 'v'];
const BULB_COLORS = ['R', 'Y', 'B', 'P'];

// A wall-wide garland: hooks every so often, sagging in between. `y(x)` gives
// its height at x.
function sag(x0, x1, top, u) {
  const span = x1 - x0;
  const hooks = Math.max(1, Math.round(span / u(120)));
  const step = span / hooks;
  const depth = u(12);
  return {
    hooks: Array.from({ length: hooks + 1 }, (_, i) => x0 + i * step),
    y: (x) => top + depth * Math.sin(Math.PI * (((x - x0) % step) / step)),
  };
}

function halloweenGarland(g, x0, x1, top, { p, u }) {
  const line = sag(x0, x1, top + u(6), u);
  g.fillStyle = INK.K;
  for (let x = x0; x < x1; x += p) g.fillRect(Math.round(x), Math.round(line.y(x)), p, Math.max(1, p / 2));
  // Pennants, with a paper bat now and then.
  let i = 0;
  for (let x = x0 + u(14); x < x1 - u(14); x += u(38), i++) {
    const y = Math.round(line.y(x));
    if (i % 4 === 3) {
      drawSprite(g, BAT, x - (BAT.w * p) / 2, y, p);
      continue;
    }
    g.fillStyle = INK[PENNANT_COLORS[i % PENNANT_COLORS.length]];
    for (let r = 0; r < 4; r++) {
      const half = 2 - Math.floor(r / 2);
      g.fillRect(Math.round(x - half * p), y + r * p, (2 * half + 1) * p, p);
    }
  }
}

function christmasGarland(g, x0, x1, top, { p, u }, now) {
  const line = sag(x0, x1, top + u(6), u);
  for (let x = x0; x < x1; x += p) {
    const y = Math.round(line.y(x));
    g.fillStyle = INK.g;
    g.fillRect(Math.round(x), y, p, 2 * p);
    g.fillStyle = INK.P;
    if ((x / p) % 3 < 1) g.fillRect(Math.round(x), y - p, p, p);
  }
  for (const x of line.hooks) {
    g.fillStyle = INK.R;
    g.fillRect(Math.round(x - p), Math.round(line.y(x)) - p, 3 * p, 2 * p);
  }
  drawBulbs(g, christmasBulbs(x0, x1, line, p, u), p, now);
}

function christmasBulbs(x0, x1, line, p, u) {
  const bulbs = [];
  for (let x = x0 + u(10), i = 0; x < x1 - u(6); x += u(20), i++) bulbs.push([Math.round(x), Math.round(line.y(x)) + 2 * p, BULB_COLORS[i % BULB_COLORS.length]]);
  return bulbs;
}

// Bulbs hang under the greenery and blink, a third of them off at a time.
function drawBulbs(ctx, bulbs, p, now) {
  const step = Math.floor(now / 700);
  bulbs.forEach(([x, y, c], i) => {
    ctx.fillStyle = (i + step) % 3 === 0 ? INK.G : INK[c];
    ctx.fillRect(x, y, p, p);
  });
}

// A cobweb in a top corner of the wall: threads from the corner, crossed by
// rings. `dir` is 1 for the left corner, -1 for the right one.
function cobweb(g, cornerX, top, dir, p) {
  const cells = new Set();
  const put = (x, y) => cells.add(`${x},${y}`);
  const line = (ax, ay, bx, by) => {
    const n = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
    for (let i = 0; i <= n; i++) put(Math.round(ax + ((bx - ax) * i) / n), Math.round(ay + ((by - ay) * i) / n));
  };
  const angles = [0, 0.45, 0.785, 1.12, 1.5708];
  for (const a of angles.slice(1, -1)) line(0, 0, Math.round(10 * Math.cos(a)), Math.round(10 * Math.sin(a)));
  for (const r of [3, 6, 9]) {
    const pts = angles.map((a) => [Math.round(r * Math.cos(a)), Math.round(r * Math.sin(a))]);
    for (let i = 0; i + 1 < pts.length; i++) line(...pts[i], ...pts[i + 1]);
  }
  g.fillStyle = 'rgb(120 116 108 / 0.55)';
  for (const key of cells) {
    const [x, y] = key.split(',').map(Number);
    g.fillRect(Math.round(cornerX + (dir > 0 ? x : -x - 1) * p), top + y * p, p, p);
  }
}

// The wall of a room or of the open space. `door` is { left, top } of the door
// sprite; `spot` a stretch of bare wall ({ x, w }) for a ghost or stockings.
export function seasonWall(g, env, { x0, x1, top, wall, door, spot }) {
  const { season, p, u } = env;
  if (season === 'halloween') {
    cobweb(g, x0, top, 1, p);
    cobweb(g, x1, top, -1, p);
    // Garlands are redrawn each frame after the skies, which repaint the glass they cross.
    env.walls.push((ctx) => halloweenGarland(ctx, x0 + u(40), x1 - u(40), top, env));
    if (spot) {
      // A sheet ghost hanging from the ceiling.
      const gx = Math.round(spot.x - (GHOST.w * p) / 2);
      const gy = Math.round(wall - u(58));
      g.fillStyle = INK.G;
      g.fillRect(Math.round(spot.x), top, Math.max(1, p / 2), gy - top);
      drawSprite(g, GHOST, gx, gy, p);
    }
  } else if (season === 'noel') {
    const from = x0 + u(20);
    const to = x1 - u(20);
    env.walls.push((ctx, now) => christmasGarland(ctx, from, to, top, env, now));
    // At night the bulbs shine through the dark: one halo per stretch of them.
    const bulbs = christmasBulbs(from, to, sag(from, to, top + u(6), u), p, u);
    for (let k = 0; k < bulbs.length; k += 4) {
      const [x, y] = bulbs[Math.min(bulbs.length - 1, k + 2)];
      env.glows.push({ x, y, r: 9, draw: k === 0 ? (ctx, now) => drawBulbs(ctx, bulbs, p, now) : () => {} });
    }
    if (door) drawSprite(g, WREATH, door.left + 1.5 * p, door.top + p, p);
    if (spot && spot.w >= u(70)) {
      // Three stockings on a little rail.
      const railY = Math.round(wall - u(56));
      const width = u(66);
      g.fillStyle = INK.D;
      g.fillRect(Math.round(spot.x - width / 2), railY, Math.round(width), p);
      STOCKINGS.forEach((s, i) => drawSprite(g, s, spot.x - width / 2 + u(4) + i * u(22), railY + p, p));
    }
  }
}

// Snow piled on a window's sill and lower corners.
export function snowSill(g, left, top, model, p) {
  const bottom = top + (model.h - 1) * p;
  g.fillStyle = '#ffffff';
  g.fillRect(Math.round(left - p), Math.round(bottom), (model.w + 2) * p, p);
  for (let x = 0; x < model.w; x += 5) g.fillRect(Math.round(left + x * p), Math.round(bottom - p), 2 * p, p);
}

// Things on the floor: a bubbling cauldron, or poinsettias. `place(s)` finds
// room for a sprite and returns its { left, top }, or null.
export function seasonFloor(env, place) {
  const { season, p, props, glows } = env;
  if (season === 'halloween') {
    const at = place(CAULDRON);
    if (at) {
      props.push({ base: Math.round(at.top + CAULDRON.h * p), draw: (ctx) => drawSprite(ctx, CAULDRON, at.left, at.top, p) });
      glows.push({ cells: CAULDRON_BREW, left: at.left, top: at.top, p, x: at.left + 5 * p, y: at.top + p, r: 9 });
    }
  } else if (season === 'noel') {
    for (let i = 0; i < 2; i++) {
      const at = place(POINSETTIA);
      if (at) props.push({ base: Math.round(at.top + POINSETTIA.h * p), draw: (ctx) => drawSprite(ctx, POINSETTIA, at.left, at.top, p) });
    }
  }
}
