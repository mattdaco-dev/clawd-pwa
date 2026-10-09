// What lies around the building: a street, a village green, the countryside,
// a beach or deep space. Painted under the building, with a path from every
// way out (the entrance at the bottom, back doors at the top) to where it
// leads: the road, the lane, the sea, a docked shuttle.
import { INK, drawSprite, sprite } from './pixels.js';
import { flicker } from './seasons.js';

export const WORLDS = { ville: 'City', village: 'Village', campagne: 'Countryside', mer: 'Seaside', espace: 'Spaceship' };

// One world a day when the setting is « Au hasard »; the salt gives another.
export function worldOfDay(date, salt = '') {
  const text = `${salt}${date.toDateString()}`;
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  const keys = Object.keys(WORLDS);
  return keys[(h >>> 0) % keys.length];
}

// ---- Sprites, drawn with code: `paint(set)` fills a w x h grid of palette keys.
function art(w, h, paint) {
  const rows = Array.from({ length: h }, () => Array(w).fill('.'));
  paint((x, y, c) => {
    x = Math.round(x);
    y = Math.round(y);
    if (x >= 0 && y >= 0 && x < w && y < h) rows[y][x] = c;
  });
  return sprite(rows.map((r) => r.join('')));
}

// A shaded ellipse: rim, fill, lit top left, shaded bottom right.
function blob(set, cx, cy, rx, ry, [rim, fill, light, dark]) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      const d = dx * dx + dy * dy;
      if (d > 1) continue;
      set(x, y, d > 0.7 ? rim : dx + dy < -0.6 ? light : dx + dy > 0.5 ? dark : fill);
    }
  }
}

const recolor = (s, map) => ({ ...s, cells: s.cells.map(([x, y, c]) => [x, y, map[c] ?? c]) });
const mirror = (s) => ({ ...s, cells: s.cells.map(([x, y, c]) => [s.w - 1 - x, y, c]) });

const LEAVES = {
  summer: ['Q', 'P', 'l', 'g'],
  spring: ['Q', 'P', 'q', 'g'],
  autumn: ['n', 'o', 'Y', 'n'],
  winter: ['L', 'W', 'W', 'A'],
};
const leavesOf = (season) => {
  if (['automne', 'halloween', 'fete-de', 'kleeschen'].includes(season)) return 'autumn';
  if (['hiver', 'noel', 'nouvel-an', 'buergbrennen', 'fuesend'].includes(season)) return 'winter';
  if (['printemps', 'paques'].includes(season)) return 'spring';
  return 'summer';
};
const snowy = (season) => leavesOf(season) === 'winter';

const tree = (leaf) => art(15, 20, (set) => {
  for (let y = 12; y < 20; y++) {
    set(6, y, 'D');
    set(7, y, 'H');
    set(8, y, 'H');
  }
  set(5, 19, 'D');
  set(9, 19, 'D');
  blob(set, 7, 7, 7.2, 7, leaf);
});

const fir = (snow) => art(13, 21, (set) => {
  for (let y = 17; y < 21; y++) {
    set(6, y, 'D');
    set(7, y, 'H');
  }
  // Three tiers, each wider than the one above.
  [[0, 6], [5, 12], [10, 18]].forEach(([from, to], tier) => {
    for (let y = from; y < to; y++) {
      const half = Math.min(6, Math.floor((y - from) * 0.8) + tier);
      for (let x = 6 - half; x <= 6 + half; x++) set(x, y, x < 6 ? 'g' : 'Q');
      if (snow && y === to - 1) for (let x = 6 - half; x <= 6 + half; x += 2) set(x, y, 'W');
    }
  });
  if (snow) set(6, 0, 'W');
});

const PALM = art(19, 24, (set) => {
  // A trunk leaning a little, ringed.
  for (let y = 7; y < 24; y++) {
    const x = 9 + Math.round(Math.sin((y - 7) / 7) * 1.5);
    set(x, y, y % 2 ? 'H' : 'D');
    set(x + 1, y, 'D');
  }
  // Fronds drooping on both sides, two higher ones.
  for (const dir of [-1, 1]) {
    for (let t = 1; t <= 8; t++) {
      const x = 9.5 + dir * t;
      const y = 5 + (t * t) / 9;
      set(x, y, 'P');
      set(x, y + 1, 'Q');
    }
    for (let t = 1; t <= 5; t++) set(9.5 + dir * t * 0.6, 5 - t * 0.9, 'P');
  }
  set(9, 5, 'Q');
  set(10, 5, 'Q');
  set(9, 7, 'H');
  set(11, 7, 'H');
});

const bush = (leaf) => art(10, 7, (set) => blob(set, 4.5, 3.5, 4.6, 3.2, leaf));

const FLOWERBED = art(16, 5, (set) => {
  const colors = ['R', 'Y', 'q', 'v', 'W', 'o'];
  for (let x = 0; x < 16; x++) {
    set(x, 3, 'D');
    set(x, 4, 'H');
    if (x % 2 === 0) {
      set(x, 2, 'P');
      set(x + (x % 4 ? 1 : 0), 1, colors[(x * 7) % colors.length]);
    }
  }
});

// Lights: the cell at `light` is where the glow sits.
const STREET_LAMP = Object.assign(sprite([
  '.KKK.',
  'KYYYK',
  '.KKK.',
  '..K..',
  '..K..',
  '..K..',
  '..K..',
  '..K..',
  '..K..',
  '..K..',
  '..K..',
  '..K..',
  '..K..',
  '..K..',
  '..K..',
  '..G..',
  '.KKK.',
]), { light: [2, 1] });
const LANTERN = Object.assign(sprite([
  '.KKK..',
  'KYYYK.',
  '.KKK..',
  '..D...',
  '..DD..',
  '..D...',
  '..D...',
  '..D...',
  '..D...',
  '..D...',
  '.DDD..',
]), { light: [2, 1] });
const TIKI = Object.assign(sprite([
  '...',
  '...',
  'VMV',
  '.V.',
  '.M.',
  '.V.',
  '.M.',
  '.M.',
  '.V.',
  '.M.',
  '.M.',
  '.V.',
  '.M.',
  '.M.',
]), { flame: [1, 1] });

const CAR = sprite([
  '.....CCCCCCC......',
  '....CSSSCSSSSC....',
  '...CSSSSCSSSSSC...',
  '.CCCCCCCCCCCCCCCC.',
  'RCCCCCCCCCCCCCCCCY',
  'CCCCCCCCCCCCCCCCCC',
  '.CCKKKCCCCCCKKKCC.',
  '...KAK......KAK...',
]);
const CAR_COLORS = ['R', 'B', 'W', 'c', 'M', 'F', 'G', 'K', 'T'];

const BENCH = sprite([
  'DDDDDDDDDDDDDD',
  'HHHHHHHHHHHHHH',
  '..............',
  'DDDDDDDDDDDDDD',
  'HHHHHHHHHHHHHH',
  '.K..........K.',
  '.K..........K.',
]);
const HYDRANT = sprite(['.RR.', 'RRRR', '.RR.', 'RRRR', '.RR.', 'RRRR']);
const BINS = sprite(['GGGG.PPPP', 'AAAA.QQQQ', 'AGGA.QPPQ', 'AGGA.QPPQ', 'AAAA.QQQQ']);
const PLANTER = sprite(['.QPPQ.', 'QPlPPQ', 'PQPPQP', 'AAAAAA', 'AGGGGA', 'AAAAAA']);
const ROOF_UNIT = sprite(['AAAAAA', 'AGKGKA', 'AKGKGA', 'AGKGKA', 'AAAAAA']);
const WELL = sprite([
  '.DDDDDDDDDD.',
  '..D......D..',
  '..D..K...D..',
  '..D..K...D..',
  '..D..Y...D..',
  'GAGAGAGAGAGA',
  'ANNNNNNNNNNA',
  'GAGAGAGAGAGA',
  'AGAGAGAGAGAG',
  'GAGAGAGAGAGA',
]);
const HAYBALE = art(11, 9, (set) => {
  blob(set, 5, 4, 5.2, 4.2, ['V', 'Y', 'y', 'M']);
  for (const [x, y] of [[5, 4], [4, 4], [4, 3], [5, 3], [6, 3], [6, 4], [6, 5], [5, 5], [4, 5], [3, 5], [3, 4]]) set(x, y, 'V');
  set(5, 4, 'M');
});
const rock = (big) => art(big ? 10 : 7, big ? 6 : 4, (set) => blob(set, big ? 4.5 : 3, big ? 5 : 3.5, big ? 4.8 : 3.3, big ? 5 : 3.5, ['G', 'A', 'L', 'G']));
const REEDS = sprite(['.y..y.', '.P.HP.', 'PP.PQ.', '.QPQ.P', '.QQPQ.']);
const DUCK = sprite(['..WWo', 'WWWW.', '.WWW.']);
const SCARECROW = sprite([
  '..MMM..',
  '.MMMMM.',
  '..ooo..',
  '..oKo..',
  'HHHTHHH',
  '..TTT..',
  '..TTT..',
  '..I.I..',
  '..D.D..',
  '...D...',
  '...D...',
]);

const parasol = (c) => art(15, 16, (set) => {
  [3, 5, 6, 7, 7].forEach((half, y) => {
    for (let x = 7 - half; x <= 7 + half; x++) set(x, y, Math.floor((x + 1) / 3) % 2 ? c : 'W');
  });
  for (let x = 0; x <= 14; x += 2) set(x, 5, Math.floor((x + 1) / 3) % 2 ? c : 'W');
  for (let y = 5; y < 16; y++) set(7, y, 'A');
});
const towel = (c) => art(10, 5, (set) => {
  for (let y = 0; y < 5; y++) for (let x = 0; x < 10; x++) set(x, y, y % 2 ? 'W' : c);
});
const DECKCHAIR = sprite([
  '.........BW',
  '........BW.',
  '.......BW..',
  'BWBWBWBWB..',
  'D.......D..',
  'D.......D..',
]);
const SANDCASTLE = sprite([
  '..R.....R...',
  '..D.....D...',
  '.YyY...YyY..',
  '.yyy...yyy..',
  '.yyyYYYyyy..',
  '.yyyyKyyyy..',
  'yyyyyKyyyyy.',
  'YYYYYYYYYYYY',
]);
const SHELLS = [sprite(['.qW', 'qWq']), sprite(['.o.', 'ooo', 'o.o']), sprite(['WqW'])];
const BALL = art(5, 5, (set) => blob(set, 2, 2, 2.3, 2.3, ['R', 'W', 'W', 'B']));
const BEACH_GRASS = sprite(['P..P.', '.P.PQ', 'QPQP.', '.QQ..']);
const BOAT = sprite([
  '......D.......',
  '.....WD.......',
  '....WWD.......',
  '...WWWD.W.....',
  '..WWWWDWW.....',
  '.WWWWWDWWW....',
  '......D.......',
  'HHHHHHHHHHHHHH',
  '.RRRRRRRRRRRR.',
  '..RRRRRRRRRR..',
]);

// ---- Painting.

export function paintOutside(g, env, { width, height, blocks, exits, random }) {
  const { p, u } = env;
  const c = {
    g, env, p, u, width, height, random, blocks, exits,
    frontY: Math.max(...blocks.map((b) => b.y1)),
    backY: Math.min(...blocks.map((b) => b.y0)),
    left: Math.min(...blocks.map((b) => b.x0)),
    right: Math.max(...blocks.map((b) => b.x1)),
    taken: blocks.map((b) => ({ x: b.x0 - u(8), y: b.y0 - u(8), w: b.x1 - b.x0 + u(16), h: b.y1 - b.y0 + u(16) })),
  };
  c.between = (a, b) => a + random() * (b - a);
  c.pick = (list) => list[Math.floor(random() * list.length)];
  c.fill = (color, x, y, w, h) => {
    g.fillStyle = color;
    g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  c.reserve = (x, y, w, h) => c.taken.push({ x, y, w, h });
  c.free = (x, y, w, h) => x >= 0 && y >= 0 && x + w <= width && y + h <= height &&
    c.taken.every((r) => x + w <= r.x || r.x + r.w <= x || y + h <= r.y || r.y + r.h <= y);
  // Puts a sprite with its feet at (left, base), reserved with a margin.
  c.put = (s, left, base, pad = u(6)) => {
    const top = base - s.h * p;
    drawSprite(g, s, left, top, p);
    c.reserve(left - pad, top - pad, s.w * p + 2 * pad, s.h * p + 2 * pad);
    return { left, top };
  };
  // A free place for `s` with its feet between y0 and y1; null if none.
  c.place = (s, { x0 = 0, x1 = width, y0 = 0, y1 = height, tries = 40, pad = u(6) } = {}) => {
    const w = s.w * p;
    const h = s.h * p;
    while (tries-- > 0) {
      const left = Math.round(c.between(x0, x1 - w));
      const base = Math.round(c.between(y0, y1));
      if (c.free(left - pad, base - h - pad, w + 2 * pad, h + 2 * pad)) return c.put(s, left, base, pad);
    }
    return null;
  };
  // How many things fit on the free ground, roughly.
  c.many = (per) => Math.round(((width * height) - blocks.reduce((sum, b) => sum + (b.x1 - b.x0) * (b.y1 - b.y0), 0)) / (u(per) * u(per)));
  c.speckle = (colors, x, y, w, h, every) => {
    const n = Math.round((w * h) / (p * p * every));
    for (let i = 0; i < n; i++) c.fill(colors[i % colors.length], x + random() * w, y + random() * h, p, p);
  };
  (PAINTERS[env.world] ?? city)(c);
}

// A light on a post, lit at night and switched by a click.
function postLight(c, s, left, base) {
  const { p, env } = c;
  const at = c.put(s, left, base);
  const [lx, ly] = s.light;
  env.lamps.push({ x: at.left + (lx + 0.5) * p, y: at.top + (ly + 0.5) * p, box: { x: at.left, y: at.top, w: s.w * p, h: s.h * p } });
}

// A torch: its flame flickers over the night tint.
function torch(c, left, base) {
  const { p, env } = c;
  const at = c.put(TIKI, left, base);
  const x = at.left + TIKI.flame[0] * p;
  const y = at.top + 2 * p;
  const seed = left * 0.7 + base * 0.3;
  env.glows.push({
    flame: true, x: x + p / 2, y: y - p, r: 8,
    box: { x: at.left - p, y: at.top - p, w: TIKI.w * p + 2 * p, h: TIKI.h * p + p },
    draw: (ctx, now) => {
      const tall = flicker(now, seed) < 0.7 ? 1 : 2;
      for (let k = 0; k < tall; k++) {
        ctx.fillStyle = INK[k ? 'Y' : 'o'];
        ctx.fillRect(x, y - (k + 1) * p, p, p);
      }
    },
  });
}

// Where an exit's path ends: `to` for the ones going down, the top edge for the others.
const pathEnd = (exit, to) => (exit.dir === 'down' ? to : 0);
const pathRect = (exit, to, grow = 0) => {
  const end = pathEnd(exit, to);
  const y = Math.min(exit.y, end);
  return { x: exit.x - grow, y, w: exit.w + 2 * grow, h: Math.abs(end - exit.y) };
};

// ---- Ville: pavements all round, a road at the front with a zebra crossing
// to the entrance, neighbours' flat roofs on the sides.
function city(c) {
  const { u, p, width, height, env } = c;
  c.fill('#cdc8bd', 0, 0, width, height);
  const slab = u(36);
  for (let y = 0; y < height; y += slab) c.fill('#bfb9ad', 0, y, width, 1);
  for (let x = 0; x < width; x += slab) c.fill('#bfb9ad', x, 0, 1, height);

  const roadH = u(92);
  const roadY = height - roadH;
  c.fill('#9d978a', 0, roadY - u(6), width, u(6)); // the kerb
  c.fill('#56585c', 0, roadY, width, roadH);
  c.speckle(['#5f6166', '#4c4e52'], 0, roadY, width, roadH, 30);
  for (let x = u(10); x < width; x += u(56)) c.fill('#ececec', x, roadY + roadH / 2 - p / 2, u(30), p);
  c.reserve(0, roadY - u(10), width, roadH + u(10));
  const crossings = c.exits.filter((e) => e.dir === 'down').map((e) => ({ x0: e.x - u(14), x1: e.x + e.w + u(14) }));
  for (const { x0, x1 } of crossings) {
    c.fill('#56585c', x0, roadY + u(4), x1 - x0, roadH - u(8));
    for (let x = x0 + u(4); x < x1 - u(6); x += u(14)) c.fill('#f2f2f2', x, roadY + u(6), u(8), roadH - u(12));
  }
  // Cars parked along both kerbs, clear of the crossings, some facing back.
  for (const lane of [roadY + u(36), height - u(4)]) {
    for (let x = u(10) + c.between(0, u(60)); x < width - CAR.w * p; x += CAR.w * p + c.between(u(30), u(140))) {
      if (crossings.some((k) => x + CAR.w * p > k.x0 && x < k.x1) || c.random() < 0.55) continue;
      const car = recolor(c.random() < 0.5 ? CAR : mirror(CAR), { C: c.pick(CAR_COLORS) });
      drawSprite(c.g, car, x, lane - car.h * p, p);
    }
  }

  // The neighbours: flat roofs with their ventilation boxes, a lane away.
  const roof = (x0, x1) => {
    if (x1 - x0 < u(70)) return;
    const y0 = c.backY + u(10);
    const y1 = roadY - u(40);
    c.fill('#5c5650', x0, y0, x1 - x0, y1 - y0);
    c.fill('#8e877d', x0 + p, y0 + p, x1 - x0 - 2 * p, y1 - y0 - 2 * p);
    c.speckle(['#827b72', '#9a948a'], x0 + p, y0 + p, x1 - x0 - 2 * p, y1 - y0 - 2 * p, 14);
    c.reserve(x0, y0, x1 - x0, y1 - y0);
    for (let y = y0 + u(30); y < y1 - u(30); y += u(110)) drawSprite(c.g, ROOF_UNIT, x0 + (x1 - x0) / 2 - ROOF_UNIT.w * p / 2, y, p);
  };
  roof(0, c.left - u(40));
  roof(c.right + u(40), width);

  // Lamps and trees in pits along the kerb.
  const kerb = roadY - u(12);
  let k = 0;
  for (let x = u(30) + c.between(0, u(60)); x < width - u(30); x += u(170) + c.between(0, u(80)), k++) {
    if (crossings.some((cr) => x + u(20) > cr.x0 && x - u(20) < cr.x1)) continue;
    if (k % 2 === 0) {
      if (c.free(x - p, kerb - STREET_LAMP.h * p, STREET_LAMP.w * p + 2 * p, STREET_LAMP.h * p)) postLight(c, STREET_LAMP, x, kerb);
    } else {
      const t = tree(LEAVES[leavesOf(env.season)]);
      if (!c.free(x, kerb - t.h * p, t.w * p, t.h * p)) continue;
      c.fill('#6f5a44', x + 4 * p, kerb - 2 * p, 7 * p, 3 * p);
      c.put(t, x, kerb);
    }
  }
  for (const s of [BENCH, HYDRANT, BINS, PLANTER]) c.place(s);
}

// ---- Village: grass, flagstone paths, a picket fence along the lane.
function village(c) {
  const { u, p, width, height, env } = c;
  const snow = snowy(env.season);
  c.fill(snow ? '#eaf0f2' : '#9fc57f', 0, 0, width, height);
  c.speckle(snow ? ['#dce5e9', '#f7fafb'] : ['#8fb870', '#b2d391', '#8fb870'], 0, 0, width, height, 18);
  if (!snow) c.speckle(['#f2c14e', '#ffffff', '#f4b6c8'], 0, 0, width, height, 900);

  const laneH = u(50);
  const laneY = height - laneH;
  c.fill('#cdb084', 0, laneY, width, laneH);
  c.fill('#b4976b', 0, laneY + u(14), width, p);
  c.fill('#b4976b', 0, laneY + laneH - u(14), width, p);
  c.reserve(0, laneY - u(16), width, laneH + u(16));

  for (const exit of c.exits) {
    const r = pathRect(exit, laneY);
    // Flagstones, two abreast, a little uneven.
    for (let y = r.y; y < r.y + r.h; y += u(16)) {
      for (const [dx, w] of [[0, 0.48], [0.52, 0.48]]) {
        const sx = r.x + r.w * dx + c.between(-p, p);
        c.fill('#9e968a', sx, y + u(11), r.w * w, p);
        c.fill('#c9c2b5', sx, y + p, r.w * w, u(10));
      }
    }
    c.reserve(r.x - u(6), r.y, r.w + u(12), r.h);
    // A lantern by each path, near the door.
    const by = exit.dir === 'down' ? exit.y + u(80) : exit.y - u(8);
    if (c.free(r.x + r.w + u(6), by - LANTERN.h * p, LANTERN.w * p, LANTERN.h * p)) postLight(c, LANTERN, r.x + r.w + u(8), by);
  }
  // The fence, open where a path meets the lane.
  const fenceBase = laneY - u(2);
  const gaps = c.exits.filter((e) => e.dir === 'down');
  c.fill('#d8d2c4', 0, fenceBase - 4 * p, width, p);
  for (let x = 0; x < width; x += 3 * p) {
    if (gaps.some((e) => x + 2 * p > e.x - u(4) && x < e.x + e.w + u(4))) continue;
    c.fill('#f2efe6', x, fenceBase - 6 * p, 2 * p, 6 * p);
    c.fill('#d6d0c2', x + p, fenceBase - 6 * p, p, 6 * p);
  }
  for (const gap of gaps) c.fill('#cdb084', gap.x - u(4), fenceBase - 6 * p, gap.w + u(8), 6 * p);

  const leaf = LEAVES[leavesOf(env.season)];
  c.place(WELL);
  c.place(BENCH);
  for (let i = c.many(320); i > 0; i--) c.place(c.pick([tree(leaf), tree(leaf), bush(leaf), snow ? bush(leaf) : FLOWERBED]), { pad: u(20) });
}

// ---- Campagne: fields, a dirt track, woods, a pond.
function countryside(c) {
  const { u, p, width, height, env } = c;
  const snow = snowy(env.season);
  c.fill(snow ? '#e8eef0' : '#a9c583', 0, 0, width, height);
  c.speckle(snow ? ['#d9e2e6', '#f6f9fa'] : ['#98b673', '#b9d293'], 0, 0, width, height, 16);

  const roadH = u(42);
  const roadY = height - roadH;
  c.fill('#c4a77c', 0, roadY, width, roadH);
  c.speckle(['#b39668', '#d3b98f'], 0, roadY, width, roadH, 10);
  c.reserve(0, roadY - u(8), width, roadH + u(8));

  for (const exit of c.exits) {
    const r = pathRect(exit, roadY);
    // A dirt track that wanders a little.
    for (let y = r.y; y < r.y + r.h; y += 2 * p) {
      const sway = Math.round(Math.sin(y / u(46)) * u(8));
      c.fill('#b08f63', r.x + sway, y, r.w, 2 * p);
      c.fill('#c9ad83', r.x + sway + p, y, r.w - 2 * p, 2 * p);
    }
    c.reserve(r.x - u(16), r.y, r.w + u(32), r.h);
  }

  // Fields: ploughed, wheat or cabbages, where a big enough patch is free.
  const kinds = snow ? [['#dfe7ea', '#c8d2d6']] : [['#9b7652', '#7e5d3f'], ['#e2c46e', '#c9a955'], ['#8fb46a', '#4f7d3a']];
  for (let i = 0; i < 8; i++) {
    const w = c.between(u(120), u(260));
    const h = c.between(u(70), u(160));
    const x = c.between(0, width - w);
    const y = c.between(0, height - h);
    if (!c.free(x - u(10), y - u(10), w + u(20), h + u(20))) continue;
    const [base, row] = c.pick(kinds);
    c.fill(base, x, y, w, h);
    for (let ry = y + p; ry < y + h; ry += 3 * p) c.fill(row, x, ry, w, p);
    c.reserve(x - u(10), y - u(10), w + u(20), h + u(20));
  }
  // A pond with reeds and a duck.
  for (let i = 0; i < 30; i++) {
    const rx = u(c.between(40, 60));
    const ry = rx * 0.55;
    const cx = c.between(rx, width - rx);
    const cy = c.between(ry, height - ry);
    if (!c.free(cx - rx - u(10), cy - ry - u(10), 2 * rx + u(20), 2 * ry + u(20))) continue;
    for (let y = -ry; y <= ry; y += p) {
      const half = rx * Math.sqrt(1 - (y / ry) ** 2);
      c.fill(snow ? '#b9d3e0' : '#4c8fb5', cx - half, cy + y, 2 * half, p);
      if (Math.abs(y) < ry - 2 * p) c.fill(snow ? '#d6e6ee' : '#6bb1d6', cx - half + 2 * p, cy + y, 2 * half - 4 * p, p);
    }
    c.reserve(cx - rx - u(10), cy - ry - u(10), 2 * rx + u(20), 2 * ry + u(20));
    if (!snow) {
      drawSprite(c.g, REEDS, cx - rx + p, cy - REEDS.h * p, p);
      drawSprite(c.g, DUCK, cx + c.between(-rx / 2, rx / 3), cy - p, p);
    }
    break;
  }
  const leaf = LEAVES[leavesOf(env.season)];
  c.place(SCARECROW);
  for (let i = c.many(260); i > 0; i--) {
    c.place(c.pick([fir(snow), fir(snow), fir(snow), tree(leaf), rock(true), rock(false), snow ? fir(snow) : HAYBALE]), { pad: u(14) });
  }
}

// ---- Bord de mer: sand, the sea at the front with a pier from the door,
// dunes behind.
function seaside(c) {
  const { u, p, width, height, env } = c;
  c.fill('#efd9a1', 0, 0, width, height);
  c.speckle(['#e3c98a', '#f7e7bf'], 0, 0, width, height, 12);
  // Dunes along the top, with tufts of grass.
  const duneH = Math.min(u(60), c.backY - u(10));
  if (duneH > u(20)) {
    for (let x = 0; x < width; x += p) {
      const h = duneH * (0.6 + 0.4 * Math.sin(x / u(60)));
      c.fill('#e2c584', x, 0, p, h);
    }
    for (let x = c.between(0, u(40)); x < width; x += c.between(u(30), u(80))) {
      const s = BEACH_GRASS;
      if (c.free(x, duneH - s.h * p - u(10), s.w * p, s.h * p)) drawSprite(c.g, s, x, duneH * 0.5 + c.between(-u(10), u(10)), p);
    }
  }

  const seaH = u(110);
  const seaY = height - seaH;
  c.fill('#dcc286', 0, seaY - u(16), width, u(16)); // wet sand
  c.fill('#3f9fcf', 0, seaY, width, seaH);
  c.fill('#76c3e3', 0, seaY, width, u(22));
  c.speckle(['#8fd2ec', '#ffffff'], 0, seaY + u(28), width, seaH - u(28), 260);
  c.reserve(0, seaY - u(20), width, seaH + u(20));
  // The waves come and go on the shore.
  env.walls.push((ctx, now) => {
    const shift = Math.sin(now / 1400) * u(5);
    ctx.fillStyle = '#ffffff';
    for (let x = 0; x < width; x += 2 * p) {
      const y = Math.round(seaY + shift + Math.sin(x / u(24) + now / 900) * p);
      ctx.fillRect(x, y, 2 * p, p);
    }
  });

  for (const exit of c.exits) {
    // Pier planks across the walkway; the one at the front runs into the sea.
    const end = exit.dir === 'down' ? seaY + u(60) : 0;
    const y0 = Math.min(exit.y, end);
    const y1 = Math.max(exit.y, end);
    c.fill('#8e6538', exit.x, y0, exit.w, y1 - y0);
    for (let y = y0; y < y1; y += 3 * p) c.fill('#c08f55', exit.x + p, y, exit.w - 2 * p, 2 * p);
    if (exit.dir === 'down') {
      for (const x of [exit.x - p, exit.x + exit.w - p]) for (let y = seaY; y < end; y += u(20)) c.fill('#6b4a28', x, y, 2 * p, 3 * p);
      c.reserve(exit.x - u(30), y0, exit.w + u(60), y1 - y0);
      for (const x of [exit.x - u(16), exit.x + exit.w + u(10)]) torch(c, x, exit.y + u(50));
    } else c.reserve(exit.x - u(10), y0, exit.w + u(20), y1 - y0);
  }
  // A sail on the horizon.
  const boatX = c.between(0, width - BOAT.w * p);
  drawSprite(c.g, BOAT, boatX, seaY + u(40), p);

  // Parasols, each with a towel in its shade (inside the margin kept free around it).
  for (let i = Math.max(2, c.many(480)); i > 0; i--) {
    const spot = c.place(parasol(c.pick(['R', 'B', 'o', 'v', 'c'])), { pad: u(36) });
    if (spot) drawSprite(c.g, towel(c.pick(['R', 'B', 'Y', 'q', 'c'])), spot.left + 8 * p, spot.top + 17 * p, p);
  }
  for (let i = c.many(420); i > 0; i--) c.place(c.pick([PALM, PALM, DECKCHAIR, SANDCASTLE, BALL]), { pad: u(24) });
  for (let i = c.many(320); i > 0; i--) c.place(c.pick(SHELLS), { pad: u(10) });
}

// ---- Vaisseau spatial, the way FTL draws its ships: the rooms inside a hull
// seen from above, its nose to the right, engines firing at the back, guns on
// top and below, a shield bubble around it all, a nebula behind.
const TURRET = sprite([
  '....KKKKKKK',
  '.GGGAAAAAAK',
  'GAAALLLKKKK',
  'GALLLLLG...',
  'GAAAAAAG...',
  '.GGGGGG....',
]);

function space(c) {
  const { u, p, width, height, env, random } = c;
  c.fill('#070a18', 0, 0, width, height);
  // Nebula clouds, faint.
  for (let i = 0; i < 3; i++) {
    const x = random() * width;
    const y = random() * height;
    const r = u(c.between(160, 320));
    const cloud = c.g.createRadialGradient(x, y, 0, x, y, r);
    const tint = c.pick(['120 60 160', '40 110 150', '150 50 90']);
    cloud.addColorStop(0, `rgb(${tint} / 0.28)`);
    cloud.addColorStop(1, `rgb(${tint} / 0)`);
    c.g.fillStyle = cloud;
    c.g.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  c.speckle(['#ffffff', '#bfd3ff', '#8090b8', '#8090b8', '#5a6690'], 0, 0, width, height, 420);

  // The hull: the building's outline grown on every side, rounded at the
  // back, coming to a point at the front.
  const pad = u(34);
  const x0 = c.left - pad;
  const x1 = c.right + pad;
  const y0 = c.backY - pad;
  const y1 = c.frontY + pad;
  const mid = (y0 + y1) / 2;
  const half = (y1 - y0) / 2;
  const nose = Math.min(u(140), width - x1);
  const round = u(30);
  const rowOf = (y) => {
    const t = Math.abs(y - mid) / half; // 0 in the middle, 1 at the top and bottom
    const corner = Math.max(0, (y < mid ? y0 + round - y : y - (y1 - round)) / round);
    const back = x0 + round * (1 - Math.sqrt(Math.max(0, 1 - corner * corner)));
    return { from: back, to: x1 + nose * (1 - t) - round * (corner > 0 ? 1 - Math.sqrt(1 - corner * corner) : 0) };
  };
  const inHull = (x, y) => y >= y0 && y < y1 && x >= rowOf(y).from && x < rowOf(y).to;
  for (let y = Math.round(y0); y < y1; y += p) {
    const { from, to } = rowOf(y);
    c.fill('#262b33', from, y, to - from, p);
    c.fill('#56606d', from + p, y, to - from - 2 * p, p);
  }
  c.fill('#262b33', x0 + round, y0, x1 - x0 - 2 * round, p);
  c.fill('#262b33', x0 + round, y1 - p, x1 - x0 - 2 * round, p);
  // Plating seams, and the red livery stripes.
  for (let y = y0 + u(26); y < y1 - u(10); y += u(26)) {
    const { from, to } = rowOf(y);
    c.fill('#4a535f', from + 2 * p, y, to - from - 4 * p, 1);
  }
  for (let x = x0 + u(40); x < x1 + nose - u(20); x += u(48)) {
    for (let y = y0 + p; y < y1 - p; y += p) if (inHull(x, y) && inHull(x + p, y)) c.fill('#4a535f', x, y, 1, p);
  }
  for (const y of [y0 + u(12), y1 - u(16)]) {
    const { from, to } = rowOf(y);
    c.fill('#a8423a', from + u(14), y, to - from - u(28), u(5));
  }
  c.reserve(x0 - u(40), y0, x1 + nose - x0 + u(40), y1 - y0);

  // Airlocks where the doors meet the hull: an orange door in the plating.
  for (const exit of c.exits) {
    const down = exit.dir === 'down';
    const ya = down ? exit.y : y0;
    const len = down ? y1 - exit.y : exit.y - y0;
    c.fill('#3a414b', exit.x, ya, exit.w, len);
    c.fill('#e98a2f', exit.x, down ? y1 - 2 * p : y0, exit.w, 2 * p);
    c.fill('#262b33', exit.x - p, ya, p, len);
    c.fill('#262b33', exit.x + exit.w, ya, p, len);
  }

  // Engines at the back, their exhaust flickering.
  const engines = [mid - half * 0.5, mid + half * 0.5].map((y) => ({ x: x0 - u(44), y: Math.round(y - u(34)), w: u(50), h: u(68) }));
  for (const e of engines) {
    c.fill('#262b33', e.x, e.y, e.w, e.h);
    c.fill('#3f4752', e.x + p, e.y + p, e.w - p, e.h - 2 * p);
    c.fill('#7a8592', e.x + u(6), e.y + u(6), e.w - u(6), p);
    c.fill('#7a8592', e.x + u(6), e.y + e.h - u(6), e.w - u(6), p);
  }
  env.walls.push((ctx, now) => {
    for (const [k, e] of engines.entries()) {
      const len = u(46) + u(16) * flicker(now, k * 3.1);
      for (let x = 0; x < len; x += p) {
        const t = x / len;
        const h = Math.round((e.h - u(10)) * (1 - t) / p) * p;
        ctx.fillStyle = t < 0.3 ? '#fff2c0' : t < 0.6 ? '#f2c14e' : '#e98a2f';
        ctx.fillRect(Math.round(e.x - x - p), Math.round(e.y + (e.h - h) / 2), p, h);
      }
    }
  });

  // Guns on top and below.
  const span = x1 - x0;
  for (const f of [0.3, 0.7]) {
    const x = Math.round(x0 + span * f);
    drawSprite(c.g, TURRET, x, y0 - TURRET.h * p + 2 * p, p);
    drawSprite(c.g, { ...TURRET, cells: TURRET.cells.map(([cx, cy, k]) => [cx, TURRET.h - 1 - cy, k]) }, x, y1 - 2 * p, p);
  }

  // The shield, breathing, and a few stars that twinkle away from the ship.
  const scx = (x0 + x1 + nose) / 2;
  // An ellipse holding a rectangle needs √2 times its half-sides.
  const srx = ((x1 + nose - x0) / 2) * Math.SQRT2 + u(10);
  const sry = half * Math.SQRT2 + u(10);
  const twinkles = Array.from({ length: Math.round((width * height) / (u(140) * u(140))) }, () => ({ x: Math.round(random() * width), y: Math.round(random() * height), phase: random() * 6 }))
    .filter((t) => ((t.x - scx) / srx) ** 2 + ((t.y - mid) / sry) ** 2 > 1);
  env.walls.push((ctx, now) => {
    ctx.save();
    ctx.strokeStyle = `rgb(110 190 255 / ${0.45 + 0.2 * Math.sin(now / 600)})`;
    ctx.lineWidth = p;
    ctx.beginPath();
    ctx.ellipse(scx, mid, srx, sry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgb(110 190 255 / 0.15)';
    ctx.lineWidth = 3 * p;
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#ffffff';
    for (const s of twinkles) {
      if (Math.sin(now / 700 + s.phase) <= 0.6) continue;
      ctx.fillRect(s.x - p, s.y, 3 * p, p);
      ctx.fillRect(s.x, s.y - p, p, 3 * p);
    }
  });
  c.reserve(scx - srx, mid - sry, 2 * srx, 2 * sry);

  // A planet in a free corner, far away.
  const r = u(60);
  const corners = [[r + u(20), r + u(20)], [width - r - u(20), r + u(20)], [r + u(20), height - r - u(20)], [width - r - u(20), height - r - u(20)]];
  const free = corners.filter(([x, y]) => c.free(x - r, y - r, 2 * r, 2 * r));
  if (free.length) {
    const [cx, cy] = c.pick(free);
    const bands = ['#7a4f8f', '#9a6aa8', '#5f3d73', '#b58cc0'];
    for (let y = -r; y < r; y += p) {
      const w = Math.sqrt(r * r - y * y);
      c.fill(bands[Math.floor((y + r) / u(16)) % bands.length], cx - w, cy + y, 2 * w, p);
      c.fill('rgb(0 0 0 / 0.4)', cx + w * 0.3, cy + y, w * 0.7, p);
    }
  }
}

// ---- Aucun: the plain ground of before, a short path from the entrance.
function plain(c) {
  c.fill('#d3ccbc', 0, 0, c.width, c.height);
  for (const exit of c.exits) if (exit.dir === 'down') c.fill('#c9c0ac', exit.x, exit.y, exit.w, Math.max(12, c.u(56)));
}

const PAINTERS = { none: plain, ville: city, village, campagne: countryside, mer: seaside, espace: space };
