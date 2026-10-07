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
// Live bunnies, facing right: sitting, and stretched mid-hop. X is the coat.
const BUNNY_SIT = [
  '......XX.',
  '......XX.',
  '.....XXXX',
  '.....XKXX',
  '.XXXXXXX.',
  'TXXXXXXX.',
  '.XXXXXX..',
  '..X..XX..',
];
const BUNNY_HOP = [
  '.......XX',
  '......XX.',
  '.....XXXX',
  '.XXXXXKXX',
  'TXXXXXXX.',
  '.XXXXXX..',
  'XX.....X.',
  '.........',
];
const COATS = [['W', 'L'], ['H', 'W'], ['G', 'W'], ['O', 'W'], ['D', 'W'], ['A', 'W']];
const bunny = (rows, coat, tail) => sprite(rows.map((r) => r.replaceAll('X', coat).replaceAll('T', tail)));
const BUNNIES = COATS.map(([coat, tail]) => ({ sit: bunny(BUNNY_SIT, coat, tail), hop: bunny(BUNNY_HOP, coat, tail) }));
const SPIDER = [sprite(['K.K.K', '.KKK.', 'K.K.K']), sprite(['.K.K.', 'KKKKK', '.K.K.'])];
const LITTLE_GHOST = sprite([
  '.WWWW.',
  'WWWWWW',
  'WKWWKW',
  'WWWWWW',
  'WWKKWW',
  'WWWWWW',
  'W.WW.W',
]);
const flipped = (s) => ({ ...s, cells: s.cells.map(([x, y, c]) => [s.w - 1 - x, y, c]) });

// National days: the flag's three colours, and whether its bands are vertical.
export const FLAGS = {
  'fete-lu': { colors: ['R', 'W', 'c'], vertical: false },
  'fete-fr': { colors: ['N', 'W', 'R'], vertical: true },
  'fete-be': { colors: ['K', 'Y', 'R'], vertical: true },
  'fete-de': { colors: ['K', 'R', 'Y'], vertical: false },
};
const flag = ({ colors, vertical }) => sprite(Array.from({ length: 6 }, (_, y) =>
  Array.from({ length: 9 }, (_, x) => colors[vertical ? Math.floor(x / 3) : Math.floor(y / 2)]).join('')));
const MASK = sprite([
  'v.......v',
  'vvvvvvvvv',
  'vvKvvvKvv',
  '.vvvYvvv.',
  '..v...v..',
]);
const BOOT = sprite([
  '.Y.R.',
  'YKKKR',
  '.KKK.',
  '.KKK.',
  '.KKKK',
  'KKKKKK',
]);
// The Kleeschen's brioche man, a Boxemännchen.
const BREAD_MAN = sprite([
  '..OO..',
  '.OKOK.',
  '.OOOO.',
  'OOOOOO',
  '.OYOO.',
  '.OOOO.',
  '.O..O.',
]);
// Presents: rectangular boxes tied with a ribbon and a bow, stacked two or
// three high, the biggest at the bottom.
const WRAPS = [['R', 'Y'], ['B', 'W'], ['P', 'R'], ['Y', 'R'], ['v', 'Y'], ['c', 'W'], ['q', 'R'], ['W', 'R']];
export function giftStack(random, layers = 2 + Math.floor(random() * 2), widest = 9 + Math.floor(random() * 4)) {
  const boxes = [];
  let w = widest;
  for (let i = 0; i < layers && w >= 4; i++) {
    const h = 3 + Math.floor(random() * 3);
    boxes.push({ w, h, wrap: WRAPS[Math.floor(random() * WRAPS.length)], shift: i ? Math.floor(random() * 3) - 1 : 0 });
    w -= 2 + Math.floor(random() * 3);
  }
  const width = boxes[0].w;
  const height = boxes.reduce((sum, b) => sum + b.h, 0) + 2;
  const grid = Array.from({ length: height }, () => Array(width).fill('.'));
  let bottom = height;
  for (const { w: bw, h, wrap: [body, ribbon], shift } of boxes) {
    const left = Math.max(0, Math.min(width - bw, Math.floor((width - bw) / 2) + shift));
    const mid = left + Math.floor(bw / 2);
    for (let y = bottom - h; y < bottom; y++) {
      for (let x = left; x < left + bw; x++) grid[y][x] = x === mid || y === bottom - h + 1 ? ribbon : body;
    }
    bottom -= h;
  }
  // The bow on the top box.
  const top = boxes[boxes.length - 1];
  const topLeft = Math.max(0, Math.min(width - top.w, Math.floor((width - top.w) / 2) + top.shift));
  const mid = topLeft + Math.floor(top.w / 2);
  const bowRow = bottom - 1;
  for (const dx of [-1, 1]) if (grid[bowRow][mid + dx] !== undefined) grid[bowRow][mid + dx] = top.wrap[1];
  if (bowRow - 1 >= 0) {
    if (grid[bowRow - 1][mid - 2] !== undefined) grid[bowRow - 1][mid - 2] = top.wrap[1];
    if (grid[bowRow - 1][mid + 2] !== undefined) grid[bowRow - 1][mid + 2] = top.wrap[1];
  }
  const rows = grid.map((r) => r.join(''));
  while (rows.length && /^\.+$/.test(rows[0])) rows.shift();
  return sprite(rows);
}
// A fixed pile under every Christmas tree (a seeded sequence, the same each time).
const pileRandom = (() => {
  let a = 7;
  return () => ((a = (a * 16807) % 2147483647) / 2147483647);
})();
export const TREE_GIFTS = [giftStack(pileRandom, 3), giftStack(pileRandom, 1, 6)];

const PENNANTS = {
  halloween: ['o', 'K', 'v'],
  paques: ['q', 'y', 'b', 'l'],
  fouer: ['R', 'W', 'c'],
  fuesend: ['R', 'Y', 'B', 'P', 'q', 'v'],
  kleeschen: ['R', 'Y'],
  'nouvel-an': ['Y', 'A', 'W'],
  ...Object.fromEntries(Object.entries(FLAGS).map(([k, f]) => [k, f.colors])),
};
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
  } else if (season === 'fuesend' || season === 'kleeschen' || season === 'nouvel-an' || FLAGS[season]) {
    const special = season === 'fuesend' ? () => MASK : null;
    env.walls.push((ctx) => pennantGarland(ctx, x0 + u(30), x1 - u(30), top, env, PENNANTS[season], special));
    if (FLAGS[season] && spot) {
      // The flag on a little pole.
      const f = flag(FLAGS[season]);
      const fx = Math.round(spot.x - (f.w * p) / 2);
      const fy = Math.round(wall - u(80));
      g.fillStyle = INK.D;
      g.fillRect(fx - p, fy, p, u(56));
      drawSprite(g, f, fx, fy, p);
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
// Confetti over the floor `area`, painted into the background.
function confetti(g, area, p, colors) {
  const n = Math.round(((area.x1 - area.x0) * (area.y1 - area.y0)) / (p * p * 900));
  for (let i = 0; i < n; i++) {
    g.fillStyle = INK[colors[i % colors.length]];
    g.fillRect(Math.round(area.x0 + Math.random() * (area.x1 - area.x0)), Math.round(area.y0 + Math.random() * (area.y1 - area.y0)), p, Math.max(1, p / 2));
  }
}

export function seasonFloor(env, place, g, area) {
  const { season, p, props, glows } = env;
  if (season === 'fuesend') confetti(g, area, p, PENNANTS.fuesend);
  if (season === 'nouvel-an') confetti(g, area, p, ['Y', 'A', 'W', 'R', 'B']);
  if (season === 'halloween') {
    const at = place(CAULDRON);
    if (at) {
      props.push({ base: Math.round(at.top + CAULDRON.h * p), draw: (ctx) => drawSprite(ctx, CAULDRON, at.left, at.top, p) });
      glows.push({ cells: CAULDRON_BREW, left: at.left, top: at.top, p, x: at.left + 5 * p, y: at.top + p, r: 9 });
    }
  } else if (season === 'noel') {
    for (let i = 0; i < 2; i++) put(POINSETTIA);
    for (let i = 0; i < 2; i++) put(giftStack(Math.random));
  } else if (season === 'paques') {
    put(BASKET);
    put(CHOCOLATE_BUNNY);
    // The egg hunt: eggs hidden all over the floor.
    for (let i = 0; i < 5; i++) put(EGGS[i % EGGS.length]);
  } else if (season === 'fouer') {
    put(BALLOONS);
    put(TEDDY);
  } else if (season === 'kleeschen') {
    put(BOOT);
    put(BOOT);
    put(BREAD_MAN);
  }

  function put(s) {
    const at = place(s);
    if (at) props.push({ base: Math.round(at.top + s.h * p), draw: (ctx) => drawSprite(ctx, s, at.left, at.top, p) });
  }
}

// ---- Things that move: drawn by props whose base follows them, so they sort
// with the furniture and the Clawds.

// Wanders the floor `area` ({ x0, x1, y0, y1 }): goes somewhere close, waits,
// goes again. `step(dt)` advances it; x, y are its feet.
function wanderer(area, { reach, speed, rest }) {
  const w = {
    x: area.x0 + Math.random() * (area.x1 - area.x0),
    y: area.y0 + Math.random() * (area.y1 - area.y0),
    dir: Math.random() < 0.5 ? 1 : -1,
    moving: false,
    travelled: 0,
    until: 0,
    last: 0,
    tx: 0,
    ty: 0,
    step(now) {
      const dt = Math.min(0.1, (now - (w.last || now)) / 1000);
      w.last = now;
      if (!w.moving) {
        if (now < w.until) return;
        w.tx = Math.min(area.x1, Math.max(area.x0, w.x + (Math.random() * 2 - 1) * reach));
        w.ty = Math.min(area.y1, Math.max(area.y0, w.y + (Math.random() * 2 - 1) * reach * 0.5));
        w.dir = w.tx >= w.x ? 1 : -1;
        w.moving = true;
        return;
      }
      const dx = w.tx - w.x;
      const dy = w.ty - w.y;
      const dist = Math.hypot(dx, dy);
      const move = speed * dt;
      if (dist <= move) {
        w.x = w.tx;
        w.y = w.ty;
        w.moving = false;
        w.until = now + rest[0] + Math.random() * (rest[1] - rest[0]);
        return;
      }
      w.x += (dx / dist) * move;
      w.y += (dy / dist) * move;
      w.travelled += move;
    },
  };
  return w;
}

function bunnies(env, area, n) {
  const { p, u, props } = env;
  for (let i = 0; i < n; i++) {
    const look = BUNNIES[Math.floor(Math.random() * BUNNIES.length)];
    const w = wanderer(area, { reach: u(160), speed: u(70), rest: [1200, 5000] });
    const hopLen = u(22);
    props.push({
      get base() { return Math.round(w.y); },
      draw(ctx) {
        w.step(performance.now());
        // Hops: up and down along the way, sitting between two.
        const phase = (w.travelled % hopLen) / hopLen;
        const up = w.moving ? Math.sin(Math.PI * phase) * u(8) : 0;
        const s = w.moving && phase > 0.15 && phase < 0.85 ? look.hop : look.sit;
        const shown = w.dir < 0 ? flipped(s) : s;
        ctx.fillStyle = 'rgb(61 57 41 / 0.1)';
        ctx.fillRect(Math.round(w.x - 3 * p), Math.round(w.y), 6 * p, p);
        drawSprite(ctx, shown, w.x - (s.w * p) / 2, w.y - s.h * p - up, p);
      },
    });
  }
}

function floorSpiders(env, area, n) {
  const { p, u, props } = env;
  for (let i = 0; i < n; i++) {
    const w = wanderer(area, { reach: u(140), speed: u(90), rest: [300, 2500] });
    props.push({
      get base() { return Math.round(w.y); },
      draw(ctx) {
        const now = performance.now();
        w.step(now);
        const s = SPIDER[w.moving ? Math.floor(now / 90) % 2 : 0];
        drawSprite(ctx, s, w.x - (s.w * p) / 2, w.y - s.h * p, p);
      },
    });
  }
}

// A spider letting itself down on its thread from the ceiling, waiting, and
// climbing back up.
function threadSpider(env, x, top, low) {
  const { p } = env;
  const cycle = 14000 + Math.random() * 10000;
  const offset = Math.random() * cycle;
  env.walls.push((ctx, now) => {
    const t = ((now + offset) % cycle) / cycle;
    // Down in the first quarter, hangs, back up in the third, then stays out of sight.
    const depth = t < 0.25 ? t / 0.25 : t < 0.55 ? 1 : t < 0.8 ? 1 - (t - 0.55) / 0.25 : 0;
    if (depth <= 0) return;
    const y = Math.round(top + depth * (low - top));
    ctx.fillStyle = 'rgb(90 86 80 / 0.7)';
    ctx.fillRect(Math.round(x), top, Math.max(1, p / 2), y - top);
    const s = SPIDER[t > 0.25 && t < 0.55 ? 0 : Math.floor(now / 120) % 2];
    drawSprite(ctx, s, x - 2 * p, y, p);
  });
}

// Now and then a little ghost drifts across the room, over everything, and fades.
function driftingGhost(env, area) {
  const { p, u, props } = env;
  const ghost = { start: performance.now() + 5000 + Math.random() * 20000, dir: 1, y: 0 };
  const span = area.x1 - area.x0 + u(80);
  const ms = (span / u(45)) * 1000;
  props.push({
    base: 1e9,
    draw(ctx) {
      const now = performance.now();
      if (now < ghost.start) return;
      const t = (now - ghost.start) / ms;
      if (t >= 1) {
        ghost.start = now + 25000 + Math.random() * 50000;
        ghost.dir = Math.random() < 0.5 ? 1 : -1;
        ghost.y = area.y0 - u(40) + Math.random() * (area.y1 - area.y0) * 0.6;
        return;
      }
      if (!ghost.y) ghost.y = area.y0 - u(40) + Math.random() * (area.y1 - area.y0) * 0.6;
      const x = ghost.dir > 0 ? area.x0 - u(40) + t * span : area.x1 + u(40) - t * span;
      const y = ghost.y + Math.sin(now / 400) * u(6);
      ctx.save();
      ctx.globalAlpha = 0.75 * Math.min(1, t * 6, (1 - t) * 6);
      drawSprite(ctx, ghost.dir > 0 ? LITTLE_GHOST : flipped(LITTLE_GHOST), x, y, p);
      ctx.restore();
    },
  });
}

// Animals for the season, on the floor `area` of a room or of the open space.
export function seasonCritters(env, area) {
  const { season, u } = env;
  if (season === 'paques') bunnies(env, area, 2 + Math.floor(Math.random() * 2));
  else if (season === 'halloween') {
    floorSpiders(env, area, 2);
    driftingGhost(env, area);
  }
}

// Spiders on their threads along a wall (Halloween).
export function wallSpiders(env, x0, x1, top, wall) {
  if (env.season !== 'halloween') return;
  const { u } = env;
  for (let i = 0; i < 2; i++) threadSpider(env, x0 + u(60) + Math.random() * (x1 - x0 - u(120)), top, wall - u(20) - Math.random() * u(40));
}

// A toy train running round the Christmas tree and its presents: the track on
// the floor, three cars sorted with the tree as they pass behind or in front.
export function treeTrain(g, env, cx, cy, rx, ry) {
  const { p, props } = env;
  g.fillStyle = INK.G;
  for (let a = 0; a < Math.PI * 2; a += 0.12) {
    g.fillRect(Math.round(cx + rx * Math.cos(a)), Math.round(cy + ry * Math.sin(a)), p, Math.max(1, p / 2));
  }
  const cars = [['R', 4], ['B', 3], ['Y', 3]];
  cars.forEach(([color, w], k) => {
    const at = () => {
      const a = performance.now() / 1600 - k * 0.42;
      return { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) };
    };
    props.push({
      get base() { return Math.round(at().y + p); },
      draw(ctx) {
        const { x, y } = at();
        const left = Math.round(x - (w * p) / 2);
        const top = Math.round(y - 3 * p);
        ctx.fillStyle = INK[color];
        ctx.fillRect(left, top, w * p, 2 * p);
        if (k === 0) ctx.fillRect(left + p, top - p, p, p); // chimney
        ctx.fillStyle = INK.K;
        ctx.fillRect(left, top + 2 * p, p, p);
        ctx.fillRect(left + (w - 1) * p, top + 2 * p, p, p);
      },
    });
  });
}

// ---- In the windows: fireworks for New Year and national days, the
// Buergbrennen's bonfire. Drawn on the glass after the sky, at dusk and night.

const FIREWORK_COLORS = ['#ffd84a', '#ff6b6b', '#7fd4ff', '#b9ff8a', '#ffffff', '#ff9ef0'];

function fireworks(ctx, { left, top, model }, index, light, now, p) {
  if (light.night < 0.6) return;
  // Two bursts at a time in each window, each with its own rhythm.
  for (let n = 0; n < 2; n++) {
    const period = 1700 + ((index + n) % 3) * 350;
    const clock = now + index * 700 + n * 900;
    const k = Math.floor(clock / period);
    const t = (clock % period) / period;
    const rnd = (m) => {
      const v = Math.sin(k * 12.9898 + index * 78.233 + n * 19.31 + m * 37.719) * 43758.5453;
      return v - Math.floor(v);
    };
    const cx = 2 + rnd(1) * (model.w - 4);
    const cy = 1 + rnd(2) * model.h * 0.55;
    const r = 0.5 + t * (2.5 + rnd(3) * 3);
    ctx.globalAlpha = Math.min(1, 1.6 * (1 - t));
    ctx.fillStyle = FIREWORK_COLORS[Math.floor(rnd(4) * FIREWORK_COLORS.length)];
    for (const [x, y] of model.glass) {
      const d = Math.hypot(x - cx, y - cy);
      // A ring of sparks, and the core while it is young.
      if (Math.abs(d - r) < 0.75 || (t < 0.25 && d < 1)) ctx.fillRect(left + x * p, top + y * p, p, p);
    }
  }
  ctx.globalAlpha = 1;
}

function bonfire(ctx, { left, top, model }, index, light, now, p) {
  if (light.night < 0.3 && !light.dusk) return;
  if (index % 2) return; // seen from every other window
  const bottom = Math.max(...model.glass.map(([, y]) => y));
  const cx = Math.round(model.w / 2);
  const flicker = Math.floor(now / 120);
  for (const [x, y] of model.glass) {
    const dx = Math.abs(x - cx);
    const h = bottom - y;
    // A small cone of flames on the horizon, taller in the middle.
    if (h > 3 - dx || dx > 3) continue;
    ctx.fillStyle = (x + y + flicker) % 3 === 0 ? '#ffe066' : (x + flicker) % 2 ? '#ff8a1c' : '#e0441c';
    ctx.fillRect(left + x * p, top + y * p, p, p);
  }
}

// What a window shows for the season, beyond the sky, or null.
export function skyEvent(season) {
  if (season === 'nouvel-an' || FLAGS[season]) return fireworks;
  if (season === 'buergbrennen') return bonfire;
  return null;
}
