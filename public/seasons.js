// What makes the office feel like the season, on top of the pumpkins and the
// tree placed by office.js: a garland along every wall, something on the door
// and on a bare stretch of wall, a few things on the floor. Seasons: Halloween,
// Christmas, Easter and the Schueberfouer, Luxembourg's big summer funfair.
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
const egg = (a, b) => sprite(['.' + a + a + '.', a + a + a + a, b + b + b + b, '.' + a + a + '.']);
const EGGS = [egg('q', 'y'), egg('b', 'l'), egg('y', 'q'), egg('l', 'b'), egg('R', 'Y'), egg('B', 'W')];
const BASKET = sprite([
  '..HHHHHH..',
  '.H......H.',
  'H.qq.bb.yH',
  'HqqqbbbyyH',
  'HHHHHHHHHH',
  'HDHDHDHDHH',
  '.HHHHHHHH.',
]);
const CHOCOLATE_BUNNY = sprite([
  '.D.D..',
  '.D.D..',
  '.DDD..',
  '.DKDD.',
  'DDDDD.',
  'DDDDDD',
  'DDDDDD',
  '.DDDDD',
  'RRRRRR',
]);
const SPRING_WREATH = sprite([
  '...lql...',
  '.lPlylPl.',
  'lPq...qPl',
  'Pl.....lP',
  'yP.....Py',
  'Pl.....lP',
  'lPq...qPl',
  '.lPlblPl.',
  '...lPl...',
]);
// A poster of the big wheel, with the flag's colours.
const FOUER_POSTER = sprite([
  'KKKKKKKKKKKK',
  'KWWWWWWWWWWK',
  'KWWWKKKKWWWK',
  'KWWKWWKWKWWK',
  'KWKWRWKWYWKK',
  'KWKKKKKKKKWK',
  'KWKWcWKWRWKK',
  'KWWKWWKWKWWK',
  'KWWWKKKKWWWK',
  'KWWWWKKWWWWK',
  'KWWWKWWKWWWK',
  'KRRRRRRRRRRK',
  'KWWWWWWWWWWK',
  'KccccccccccK',
  'KKKKKKKKKKKK',
]);
const BALLOONS = sprite([
  '.RR.....',
  'RRRR.cc.',
  'RRRRcccc',
  '.RR.cccc',
  '..K..cc.',
  '..K.YYK.',
  '..KYYYYK',
  '...KYYK.',
  '...K.KK.',
  '...KKK..',
  '....K...',
  '...HHH..',
]);
const TEDDY = sprite([
  'HH..HH',
  'HHHHHH',
  '.HKHK.',
  '.HHMH.',
  'HHHHHH',
  'HHMMHH',
  '.HHHH.',
  'HH..HH',
]);
const PENNANTS = { halloween: ['o', 'K', 'v'], paques: ['q', 'y', 'b', 'l'], fouer: ['R', 'W', 'c'] };
const BULB_COLORS = ['R', 'Y', 'B', 'P'];
const FAIR_BULBS = ['Y', 'W', 'R', 'Y', 'W', 'c'];

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

// Pennants on a string, with now and then a paper bat or a painted egg.
function pennantGarland(g, x0, x1, top, { p, u }, colors, special) {
  const line = sag(x0, x1, top + u(6), u);
  g.fillStyle = INK.K;
  for (let x = x0; x < x1; x += p) g.fillRect(Math.round(x), Math.round(line.y(x)), p, Math.max(1, p / 2));
  let i = 0;
  for (let x = x0 + u(14); x < x1 - u(14); x += u(38), i++) {
    const y = Math.round(line.y(x));
    if (special && i % 4 === 3) {
      const s = special(i);
      drawSprite(g, s, x - (s.w * p) / 2, y, p);
      continue;
    }
    g.fillStyle = INK[colors[i % colors.length]];
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

function christmasBulbs(x0, x1, line, p, u, colors = BULB_COLORS, below = 2) {
  const bulbs = [];
  for (let x = x0 + u(10), i = 0; x < x1 - u(6); x += u(20), i++) bulbs.push([Math.round(x), Math.round(line.y(x)) + below * p, colors[i % colors.length]]);
  return bulbs;
}

// Bulbs blink, a third of them off at a time; `fast` makes them chase like a
// funfair's.
function drawBulbs(ctx, bulbs, p, now, fast = false) {
  const step = Math.floor(now / (fast ? 220 : 700));
  bulbs.forEach(([x, y, c], i) => {
    ctx.fillStyle = (i + step) % 3 === 0 ? INK.G : INK[c];
    ctx.fillRect(x, y, p, p + (fast ? p : 0));
  });
}

// A string of funfair bulbs under flag-coloured pennants.
function fairGarland(g, x0, x1, top, env, now) {
  pennantGarland(g, x0, x1, top, env, PENNANTS.fouer);
  drawBulbs(g, christmasBulbs(x0, x1, sag(x0, x1, top + env.u(6), env.u), env.p, env.u, FAIR_BULBS, 0), env.p, now, true);
}

// Halos at night, one per stretch of bulbs; the first one also redraws them all.
function bulbGlows(env, bulbs, fast) {
  for (let k = 0; k < bulbs.length; k += 4) {
    const [x, y] = bulbs[Math.min(bulbs.length - 1, k + 2)];
    env.glows.push({ x, y, r: 9, draw: k === 0 ? (ctx, now) => drawBulbs(ctx, bulbs, env.p, now, fast) : () => {} });
  }
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
    env.walls.push((ctx) => pennantGarland(ctx, x0 + u(40), x1 - u(40), top, env, PENNANTS.halloween, () => BAT));
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
    bulbGlows(env, christmasBulbs(from, to, sag(from, to, top + u(6), u), p, u), false);
    if (door) drawSprite(g, WREATH, door.left + 1.5 * p, door.top + p, p);
    if (spot && spot.w >= u(70)) {
      // Three stockings on a little rail.
      const railY = Math.round(wall - u(56));
      const width = u(66);
      g.fillStyle = INK.D;
      g.fillRect(Math.round(spot.x - width / 2), railY, Math.round(width), p);
      STOCKINGS.forEach((s, i) => drawSprite(g, s, spot.x - width / 2 + u(4) + i * u(22), railY + p, p));
    }
  } else if (season === 'paques') {
    env.walls.push((ctx) => pennantGarland(ctx, x0 + u(30), x1 - u(30), top, env, PENNANTS.paques, (i) => EGGS[i % EGGS.length]));
    if (door) drawSprite(g, SPRING_WREATH, door.left + 1.5 * p, door.top + p, p);
    if (spot) {
      // Painted eggs hanging from the ceiling at three heights.
      [-1, 0, 1].forEach((k, i) => {
        const ex = Math.round(spot.x + k * u(16));
        const ey = Math.round(wall - u(70) + i % 2 * u(14) + (k === 0 ? u(8) : 0));
        g.fillStyle = INK.G;
        g.fillRect(ex + p, top, Math.max(1, p / 2), ey - top);
        drawSprite(g, EGGS[i + 1], ex, ey, p);
      });
    }
  } else if (season === 'fouer') {
    const from = x0 + u(20);
    const to = x1 - u(20);
    env.walls.push((ctx, now) => fairGarland(ctx, from, to, top, env, now));
    bulbGlows(env, christmasBulbs(from, to, sag(from, to, top + u(6), u), p, u, FAIR_BULBS, 0), true);
    if (spot && spot.w >= u(70)) drawSprite(g, FOUER_POSTER, spot.x - (FOUER_POSTER.w * p) / 2, wall - u(30) - FOUER_POSTER.h * p, p);
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
    for (let i = 0; i < 2; i++) put(POINSETTIA);
  } else if (season === 'paques') {
    put(BASKET);
    put(CHOCOLATE_BUNNY);
    // The egg hunt: eggs hidden all over the floor.
    for (let i = 0; i < 5; i++) put(EGGS[i % EGGS.length]);
  } else if (season === 'fouer') {
    put(BALLOONS);
    put(TEDDY);
  }

  function put(s) {
    const at = place(s);
    if (at) props.push({ base: Math.round(at.top + s.h * p), draw: (ctx) => drawSprite(ctx, s, at.left, at.top, p) });
  }
}
