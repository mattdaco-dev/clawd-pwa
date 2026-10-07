// The office cat: asleep on top of a bookcase or in its basket most of the
// time, it gets up now and then for a stroll or a bite. When a Clawd waits for
// an input, it goes and sits beside it until someone answers, crossing rooms
// through their doors.
import { INK } from './pixels.js';

// Facing right, feet on the bottom row. K fur, Y eyes, q nose; coats recolour them.
const SIT = [
  '.......K...K',
  '.......KKKKK',
  '.......KYKYK',
  '.......KKqKK',
  '......KKKKK.',
  '.....KKKKKK.',
  '....KKKKKKK.',
  '....KKKKKKK.',
  '...KKKKKKKK.',
  '...KKKK.KK..',
];
// Tail cells added to SIT, one set per swish.
const TAILS = [
  [[2, 9], [1, 9], [0, 8], [0, 7], [0, 6], [1, 5]],
  [[2, 9], [1, 9], [0, 8], [0, 7], [1, 6]],
  [[2, 9], [1, 9], [0, 8], [0, 7], [0, 6], [1, 5]],
  [[2, 9], [1, 9], [0, 9]],
];
const WALK = [
  [
    '..........K..K',
    '..........KKKK',
    'K.........KYKY',
    '.K.KKKKKKKKKKq',
    '..KKKKKKKKKK..',
    '..KKKKKKKKKK..',
    '...K.K...K.K..',
  ],
  [
    '..........K..K',
    '..........KKKK',
    'K.........KYKY',
    '.K.KKKKKKKKKKq',
    '..KKKKKKKKKK..',
    '..KKKKKKKKKK..',
    '..K...K.K...K.',
  ],
];
const LOAF = [
  '........K..K',
  '........KKKK',
  '...KKKKKKYKY',
  '..KKKKKKKKqK',
  '.KKKKKKKKKK.',
  'KKKKKKKKKK..',
];
// Head down over the bowl, the nose in it; the tail sways.
const EAT = [
  [
    'K............',
    '.K...........',
    '..KKKKKKK.K.K',
    '.KKKKKKKKKKKK',
    '.KKKKKKKKKYKY',
    '.K.K....KKKKq',
    '.K.K...K.K...',
  ],
  [
    '.............',
    'KK...........',
    '..KKKKKKK....',
    '.KKKKKKKK.K.K',
    '.KKKKKKKKKKKK',
    '.K.K....KKYKY',
    '.K.K...K.KKKq',
  ],
];
// Where the stripes of a tabby go, by pose: on its back and flanks.
const STRIPES = {
  sit: (x, y) => y >= 5 && x <= 8 && x % 2 === 0,
  walk: (x, y) => y >= 3 && y <= 5 && x >= 2 && x <= 9 && x % 2 === 1,
  loaf: (x, y) => y >= 2 && x <= 7 && x % 2 === 1,
  eat: (x, y) => y >= 2 && y <= 4 && x >= 2 && x <= 8 && x % 2 === 0,
};
const HEART = ['.R.R.', 'RRRRR', '.RRR.', '..R..'];

// Coats: fur, stripes (none for a plain coat) and eyes, as palette keys.
const COATS = [
  { fur: 'K', eyes: 'Y' }, // black
  { fur: 'o', stripe: 'n', eyes: 'P' }, // ginger tabby
  { fur: 'G', stripe: 'K', eyes: 'Y' }, // grey tabby
  { fur: 'L', stripe: 'G', eyes: 'c' }, // silver tabby
  { fur: 'H', stripe: 'D', eyes: 'P' }, // brown tabby
];
const BLACK = COATS[0];

const ROAM_EVERY = [40_000, 120_000]; // ms asleep before getting up
const SIT_MS = [3000, 8000];
const EAT_MS = [4000, 7000];
const HUNGRY = 0.5; // chance an outing starts with a bite
const TO_BED = 0.45; // chance it naps in the basket rather than on a bookcase, by day
const HOP_MS = 450;
const AWAY_MS = 1500; // between two rooms, out of sight
const SPEED = 10; // sprite pixels per second
const MAX_TRIP = 4; // seconds; long walks go faster

const rand = ([lo, hi]) => lo + Math.random() * (hi - lo);
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), Math.max(lo, hi));

function hash(text) {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

// A coat for the day (and the decor's salt); always black at Halloween.
export function coatFor(season, salt = '') {
  if (season === 'halloween') return BLACK;
  return COATS[hash(`${salt}${new Date().toDateString()}`) % COATS.length];
}

export class Cat {
  constructor() {
    this.zoneIndex = 0;
    this.dir = 1;
    this.scale = 4;
    this.mode = 'away';
    this.coat = BLACK;
    this.friend = null;
    this.heartUntil = 0;
    this.box = null; // where it was last drawn, for clicks
  }

  // The office was rebuilt: straight back to sleep somewhere in its room.
  place(office, px, now, { season = null, salt = '' } = {}) {
    this.office = office;
    this.scale = px;
    this.coat = coatFor(season, salt);
    this.zoneIndex = Math.min(this.zoneIndex, office.zones.length - 1);
    this.zone = office.zones[this.zoneIndex];
    this.friend = null;
    this.target = null;
    this.hop = null;
    this.errand = null;
    this.settle(now);
  }

  // On a bookcase or in its basket, or curled up on the floor in a decor without either.
  settle(now) {
    const perches = this.zone.perches ?? [];
    const bed = this.zone.catBed;
    this.perch = perches.length ? pick(perches) : null;
    if (bed && (!this.perch || Math.random() < TO_BED)) {
      this.x = bed.x;
      this.y = bed.y;
      this.mode = 'bed';
    } else if (this.perch) {
      this.x = this.perch.x;
      this.y = this.perch.y;
      this.mode = 'perched';
    } else {
      const spot = this.floorSpot();
      this.x = spot.x;
      this.y = spot.y;
      this.mode = 'nap';
    }
    this.fallAsleep(now);
  }

  fallAsleep(now) {
    this.asleep = Math.random() < 0.75;
    this.nextRoam = now + rand(ROAM_EVERY);
  }

  get resting() {
    return this.mode === 'perched' || this.mode === 'bed' || this.mode === 'nap';
  }

  floorSpot() {
    const { x0, x1, y0, y1 } = this.zone;
    const half = 8 * this.scale;
    return { x: x0 + half + Math.random() * Math.max(0, x1 - x0 - 2 * half), y: y0 + Math.random() * Math.max(0, y1 - y0) };
  }

  // The floor in front of a bookcase, where it lands and takes off.
  below(perch) {
    return { x: perch.x, y: clamp(perch.base + 8 * this.scale, this.zone.y0, this.zone.y1) };
  }

  // The first room with a basket or bowls (`what`), and the room it is in.
  find(what) {
    const i = this.office.zones.findIndex((z) => z[what]);
    return i < 0 ? null : { i, spot: this.office.zones[i][what] };
  }

  // Back-to-front key: on a bookcase it is drawn right in front of it, in its
  // basket between the cushion and the front rim.
  get key() {
    if (this.mode === 'perched') return this.perch.base;
    if (this.mode === 'bed') return this.zone.catBed.base;
    if (this.hop) return Math.max(this.hop.from.y, this.hop.to.y);
    return this.y;
  }

  // The Clawd waiting the longest, wherever it is.
  pickFriend(critters) {
    let best = null;
    for (const c of critters) {
      if (c.state !== 'waiting' || c.leaving || c.dead || !c.zone) continue;
      if (!best || (c.stateSince ?? 0) < (best.stateSince ?? 0)) best = c;
    }
    return best;
  }

  update(now, dt, critters, dark) {
    if (!this.office) return;
    const friend = this.pickFriend(critters);
    if (friend !== this.friend) {
      this.friend = friend;
      // Its Clawd got an answer: a moment more by its side, then off it goes.
      if (!friend && this.mode === 'sit') this.until = Math.min(this.until, now + 2500);
    }
    if (this.hop) return this.hopping(now);
    if (this.mode === 'away') {
      if (now >= this.until) this.enter(now);
      return;
    }
    if (this.target) return this.walk(dt, now);
    this.think(now, dark);
  }

  think(now, dark) {
    const { friend } = this;
    if (friend) {
      if (this.mode === 'perched' || this.mode === 'bed') return this.getUp(now);
      this.errand = null;
      const at = this.office.zones.indexOf(friend.zone);
      if (at !== this.zoneIndex) return this.toZone(at);
      const spot = this.beside(friend);
      if (Math.hypot(spot.x - this.x, spot.y - this.y) > 6 * this.scale) return this.walkTo(spot, 'attend');
      this.mode = 'sit';
      this.until = Infinity;
      this.dir = friend.x > this.x ? 1 : -1;
      return;
    }
    if (this.resting) {
      // Nights are for sleeping.
      if (now < this.nextRoam || dark) return;
      this.trips = 1 + Math.floor(Math.random() * 3);
      this.hungry = Math.random() < HUNGRY;
      if (this.mode === 'nap') return this.walkTo(this.floorSpot(), 'sit');
      return this.getUp(now);
    }
    if (this.mode === 'eat' && now >= this.until) {
      this.mode = 'sit';
      this.until = now + 1200; // licks its chops
      return;
    }
    if (this.mode === 'sit' && now >= this.until) {
      const bowls = this.hungry && this.find('catBowls');
      if (bowls) {
        this.hungry = false;
        return this.goTo(bowls, 'eat');
      }
      if (--this.trips > 0 && !dark) return this.walkTo(this.floorSpot(), 'sit');
      return this.goHome(dark);
    }
  }

  // Next to its Clawd, on the side it came from, facing it.
  beside(friend) {
    const side = this.x < friend.x ? -1 : 1;
    const half = 8 * this.scale;
    return {
      x: clamp(friend.x + side * (11 * friend.scale + 7 * this.scale), this.zone.x0 + half, this.zone.x1 - half),
      y: friend.y + 1,
    };
  }

  // Off a bookcase or out of the basket, onto the floor.
  getUp(now) {
    if (this.mode === 'bed') return this.startHop({ x: this.x, y: this.y }, this.zone.catBed.front, now, 'down');
    if (this.mode === 'perched') return this.startHop({ x: this.x, y: this.y }, this.below(this.perch), now, 'down');
    this.mode = 'sit';
    this.until = now + 600;
  }

  // The basket at night or now and then, otherwise a bookcase of the room.
  goHome(dark) {
    const perches = this.zone.perches ?? [];
    const bed = this.find('catBed');
    if (bed && (dark || !perches.length || Math.random() < TO_BED)) return this.goTo({ i: bed.i, spot: bed.spot.front }, 'bed');
    if (!perches.length) return this.walkTo(this.floorSpot(), 'nap');
    this.perch = pick(perches);
    this.walkTo(this.below(this.perch), 'hop-up');
  }

  // To a spot of room i, through the doors if it is another room.
  goTo({ i, spot }, next) {
    if (i === this.zoneIndex) return this.walkTo(spot, next);
    this.errand = { i, spot, next };
    this.toZone(i);
  }

  toZone(i) {
    this.nextZone = i;
    this.walkTo(this.zone.door ?? { x: this.zone.x0, y: this.zone.y0 }, 'door');
  }

  startHop(from, to, now, way) {
    this.hop = { from, to, t0: now, way };
    if (Math.abs(to.x - from.x) > 1) this.dir = to.x > from.x ? 1 : -1;
    this.mode = 'hop';
  }

  hopping(now) {
    const { to, t0, way } = this.hop;
    if (now - t0 < HOP_MS) return;
    this.hop = null;
    this.x = to.x;
    this.y = to.y;
    if (way === 'up' || way === 'bed') {
      this.mode = way === 'up' ? 'perched' : 'bed';
      this.fallAsleep(now);
    } else {
      this.mode = 'sit';
      this.until = now + 600;
    }
  }

  walkTo(spot, next) {
    this.target = spot;
    this.next = next;
    this.mode = 'walk';
    const dist = Math.hypot(spot.x - this.x, spot.y - this.y);
    this.speed = Math.max(SPEED * this.scale, dist / MAX_TRIP);
    if (Math.abs(spot.x - this.x) > 1) this.dir = spot.x > this.x ? 1 : -1;
  }

  walk(dt, now) {
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.hypot(dx, dy);
    const step = (this.speed * dt) / 1000;
    // Its Clawd may move meanwhile: aim at where it stands now.
    if (this.next === 'attend' && this.friend && this.friend.zone === this.zone) this.target = this.beside(this.friend);
    if (dist > step) {
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
      return;
    }
    this.x = this.target.x;
    this.y = this.target.y;
    this.target = null;
    this.arrive(now);
  }

  arrive(now) {
    switch (this.next) {
      case 'hop-up':
        return this.startHop({ x: this.x, y: this.y }, { x: this.perch.x, y: this.perch.y }, now, 'up');
      case 'bed': {
        const { x, y } = this.zone.catBed;
        return this.startHop({ x: this.x, y: this.y }, { x, y }, now, 'bed');
      }
      case 'door':
        this.mode = 'away';
        this.until = now + AWAY_MS;
        return;
      case 'nap':
        this.mode = 'nap';
        this.fallAsleep(now);
        return;
      case 'eat':
        this.mode = 'eat';
        this.dir = 1;
        this.until = now + rand(EAT_MS);
        return;
      default:
        this.mode = 'sit';
        this.until = this.next === 'attend' ? Infinity : now + rand(SIT_MS);
    }
  }

  // Comes in through the door of the room it was heading to, then on with its errand.
  enter(now) {
    this.zoneIndex = clamp(this.nextZone ?? this.zoneIndex, 0, this.office.zones.length - 1);
    this.zone = this.office.zones[this.zoneIndex];
    const door = this.zone.door ?? { x: this.zone.x0, y: this.zone.y0 };
    this.x = door.x;
    this.y = door.y;
    const errand = this.errand;
    this.errand = null;
    if (errand?.i === this.zoneIndex && !this.friend) return this.walkTo(errand.spot, errand.next);
    this.mode = 'sit';
    this.until = now + 300;
  }

  // A stroke: a heart, and it wakes up.
  pet(now) {
    this.heartUntil = now + 1600;
    this.asleep = false;
  }

  hit(x, y) {
    const b = this.box;
    return b && x >= b.x - 4 && x <= b.x + b.w + 4 && y >= b.y - 4 && y <= b.y + b.h + 4;
  }

  pose(now) {
    if (this.hop) return { rows: WALK[1], stripes: STRIPES.walk, eyes: true };
    if (this.mode === 'walk') return { rows: WALK[Math.floor(now / 160) % 2], stripes: STRIPES.walk, eyes: true };
    if (this.mode === 'eat') return { rows: EAT[Math.floor(now / 380) % 2], stripes: STRIPES.eat, eyes: true };
    if (this.resting) return { rows: LOAF, stripes: STRIPES.loaf, eyes: !this.asleep };
    const tail = TAILS[Math.floor(now / 450) % TAILS.length];
    return { rows: SIT, tail, stripes: STRIPES.sit, eyes: now % 3200 > 150 }; // a blink now and then
  }

  draw(ctx, now) {
    this.box = null;
    this.eyes = [];
    if (this.mode === 'away' || !this.office) return;
    const s = this.scale;
    let { x, y } = this;
    if (this.hop) {
      const { from, to, t0 } = this.hop;
      const t = Math.min(1, (now - t0) / HOP_MS);
      x = from.x + (to.x - from.x) * t;
      y = from.y + (to.y - from.y) * t - 14 * s * 4 * t * (1 - t);
    }
    const { rows, tail, stripes, eyes } = this.pose(now);
    const coat = this.coat;
    const w = rows[0].length;
    const h = rows.length;
    const left = Math.round(x - (w / 2) * s);
    const top = Math.round(y - h * s);
    const flip = this.dir < 0;
    if (!this.hop && this.mode !== 'perched' && this.mode !== 'bed') {
      ctx.fillStyle = 'rgb(61 57 41 / 0.08)';
      ctx.beginPath();
      ctx.ellipse(Math.round(x), Math.round(y), 5 * s, 1.2 * s, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    const at = (i) => left + (flip ? w - 1 - i : i) * s;
    const cell = (i, j, key) => {
      ctx.fillStyle = INK[key];
      ctx.fillRect(at(i), top + j * s, s, s);
    };
    const fur = (i, j) => (coat.stripe && stripes(i, j) ? coat.stripe : coat.fur);
    rows.forEach((row, j) => [...row].forEach((k, i) => {
      if (k === '.') return;
      if (k === 'Y') {
        if (eyes) this.eyes.push([at(i), top + j * s]);
        return cell(i, j, eyes ? coat.eyes : coat.fur); // shut: just fur
      }
      cell(i, j, k === 'K' ? fur(i, j) : k);
    }));
    for (const [i, j] of tail ?? []) cell(i, j, coat.fur);
    if (!eyes && this.resting) {
      // Sleeping: z's drifting up.
      const t = (now / 900) % 1;
      const zx = left + (flip ? -2 : w + 1) * s;
      const zy = top - Math.round(t * 6) * s;
      ctx.fillStyle = INK.G;
      for (const [i, j] of [[0, 0], [1, 0], [1, 1], [0, 2], [1, 2]]) ctx.fillRect(zx + i * s, zy + j * s, s, s);
    }
    this.box = { x: left, y: top, w: w * s, h: h * s };
    this.heartAt = { x: Math.round(x), y: top };
  }

  // Over the night: eyes that shine in the dark, and the heart of a stroke.
  drawOver(ctx, now, dark) {
    if (!this.box) return;
    const s = this.scale;
    if (dark) {
      ctx.fillStyle = INK[this.coat.eyes];
      for (const [x, y] of this.eyes) ctx.fillRect(x, y, s, s);
    }
    if (now < this.heartUntil) {
      const rise = Math.round(((1600 - (this.heartUntil - now)) / 1600) * 6) * s;
      const left = this.heartAt.x - Math.round(2.5 * s);
      const top = this.heartAt.y - 6 * s - rise;
      HEART.forEach((row, j) => [...row].forEach((k, i) => {
        if (k === '.') return;
        ctx.fillStyle = INK[k];
        ctx.fillRect(left + i * s, top + j * s, s, s);
      }));
    }
  }
}
