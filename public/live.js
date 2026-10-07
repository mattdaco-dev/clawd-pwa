import { ANIMS, BALL, FRAME_H, FRAME_W, PASS } from './sprites.js';
import { PALETTES, cycleDone, fitCanvas, frameIndex } from './render.js';
import { DECORS, DEFAULT_SETTINGS } from './decor.js';
import { daylight, drawLight, lightLevel, seasonOf } from './office.js';
import { currentWeather } from './weather.js';
import { costumeFor, drawDressed } from './costumes.js';
import { Cat } from './cat.js';

// Subagents are drawn one pixel size smaller than their main agent (at 1, both are 1).
const scaleFor = (kind, px) => (kind === 'main' ? px : Math.max(1, px - 1));
const FEET = FRAME_H - 1; // rows from the top of a frame down to below the feet
const CENTER = 15.5; // frame column under the middle of Clawd's body
const HALF_BODY = 10; // body half-width in sprite pixels, arms included
const WALK_SPEED = 7; // sprite pixels per second, at least
const MAX_TRIP = 3; // seconds; long trips walk faster
const SLEEP_AFTER = 120_000;
const SLEEP_AFTER_NIGHT = 30_000; // once night has mostly fallen, by the real sunset

// The scene's clock: local time, or a fixed hour from `?heure=22` (or the demo
// bar) to try the night. Fractions of an hour are minutes: 19.5 is 19:30.
const urlHour = new URLSearchParams(location.search).get('heure');
const forcedHour = urlHour !== null && Number.isFinite(Number(urlHour)) ? Number(urlHour) : null;
function sceneDate(hour = forcedHour) {
  const date = new Date();
  if (hour !== null) date.setHours(Math.floor(hour), Math.round((hour % 1) * 60));
  return date;
}

function sleepAfter() {
  return daylight(sceneDate()).night > 0.5 ? SLEEP_AFTER_NIGHT : SLEEP_AFTER;
}

// Where each state happens in the office, and what is played once there.
// `loose` replaces `anims` when every place at the station is taken.
const WORK = {
  type: { station: 'desk', anims: ['type-front'], loose: ['type-front', 'type-laptop'] },
  search: { station: 'shelf', anims: ['search', 'read'] },
  web: { station: 'shelf', anims: ['globe'] },
  think: { station: 'board', anims: ['think'] },
  // Where it stands: the notes go through a shredder it brings along.
  compact: { station: null, anims: ['compact'] },
};
// Long stretches of work: a yawn at the desk now and then, a coffee every half hour.
const STRETCH_AFTER = 10 * 60_000;
const STRETCH_CHANCE = 0.15;
const BREAK_EVERY = 30 * 60_000;
const BREAK = { station: 'coffee', anims: ['coffee'] };
const WAIT = { station: 'front', anims: ['flag', 'bubble', 'wave'] };
const SLEEP = { station: 'beanbag', anims: ['sleep'] };
const IDLE = [
  [{ station: null, wander: true, anims: ['breathe', 'look'] }, 40],
  [{ station: 'coffee', anims: ['coffee'] }, 25],
  [{ station: 'rug', anims: ['ball', 'dance', 'jump'] }, 30],
  [{ station: 'radio', anims: ['music'] }, 20],
];
const CYCLES = { working: 4, waiting: 3, idle: 2 };
// Two idle Clawds of the same zone may meet on a rug to pass a ball around.
const PAIR_EVERY = 3000; // ms between two pairing attempts in a zone
const PAIR_CHANCE = 0.4;
const PASSES = [6, 12]; // passes before the game ends, drawn at random
const BALL_SPEED = 70; // sprite pixels per second
const EXCHANGES = [4, 8]; // sword exchanges before one of them wins
const DUEL_GAP = 11; // sprite pixels from the middle of the rug to each fencer
const SPARK_MS = 220;
const DELIVERY_MS = 8000; // longest walk to hand a report over
const DANCE_GAP = 12; // sprite pixels from the middle to each dancer
const DANCE_MS = [6000, 10000];
const FIVE_GAP = 10; // sprite pixels from the meeting point to each hand
const FIVE_REACH = 70; // sprite pixels: further away, they celebrate alone
const CHAT_GAP = 12; // sprite pixels from the middle of the counter to each Clawd
const CHAT_TURNS = [5, 9]; // lines before they go back to their business
const CHAT_MS = [1800, 3000]; // how long one of them speaks
const HEAD = 10; // sprite pixels from the feet to the top of the head
const REACTION_TTL = 10_000; // a commit or a test run seen later than that is old news

// What a Clawd says over a coffee, one 7x5 picture per bubble.
const SAYINGS = [
  ['.......', '.......', '.K.K.K.', '.......', '.......'],
  ['.RR.RR.', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...'],
  ['...K...', '...K...', '...K...', '.......', '...K...'],
  ['..KKK..', '.....K.', '...KK..', '.......', '...K...'],
  ['.Y.Y.Y.', '..YYY..', 'YYYYYYY', '..YYY..', '.Y.Y.Y.'],
  ['.K...K.', '..RKR..', '.RRKRR.', '.RKRKR.', '..RRR..'],
  ['..YYY..', '.YYYYY.', '.YYYYY.', '..YYY..', '..GGG..'],
  ['......P', '.....P.', 'P...P..', '.P.P...', '..P....'],
  ['.L..L..', '..L..L.', 'BBBBB..', 'BBBBB.B', '.BBB...'],
];
const BUBBLE = ['.KKKKKKKKK.', ...Array(7).fill('KWWWWWWWWWK'), '.KKKKKKKKK.'];

const pick = (list) => list[Math.floor(Math.random() * list.length)];
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), Math.max(lo, hi));

function weighted(list) {
  let r = Math.random() * list.reduce((sum, [, w]) => sum + w, 0);
  for (const [value, w] of list) if ((r -= w) < 0) return value;
  return list[0][0];
}

// A Clawd in the office: x is the middle of its body, y the line under its feet.
class Critter {
  constructor(kind, scale, x, y) {
    this.kind = kind;
    this.scale = scale;
    this.x = x;
    this.y = y;
    this.dir = 1;
    this.state = null;
    this.activity = null;
    this.idleSince = performance.now();
    this.plan = null;
    this.slot = null;
    this.target = null;
    this.play('arrive', 1, true);
  }

  play(name, cycles = 1, locked = false) {
    this.anim = name;
    this.t0 = performance.now();
    this.cycles = cycles;
    this.locked = locked;
  }

  finished(now) {
    return cycleDone(ANIMS[this.anim], now - this.t0, this.cycles);
  }

  release() {
    if (this.slot) this.slot.occupant = null;
    this.slot = null;
  }

  // The office was rebuilt: forget the old places and pick new ones.
  relocate() {
    this.duo?.quit(this);
    this.slot = null;
    this.plan = null;
    this.target = null;
    this.replan = true;
  }

  // A finished subagent walks up to its main agent and hands its report over
  // before vanishing; gives up after a while if the main agent keeps moving.
  handOver(parent, now) {
    this.duo?.quit(this);
    this.release();
    this.delivering = { parent, until: now + DELIVERY_MS };
    this.locked = false;
    this.toParent();
  }

  toParent() {
    const { parent } = this.delivering;
    const side = Math.sign(this.x - parent.x) || 1;
    // Close enough for the sheet held at arm's length to reach the main agent.
    const gap = HALF_BODY * parent.scale + 12 * this.scale;
    this.walkTo({ x: parent.x + side * gap, y: parent.y }, this.zone);
  }

  deliver(now, dt) {
    const { parent, until } = this.delivering;
    if (parent.leaving || parent.dead || now > until) return this.leave();
    if (this.target) return this.walk(dt);
    if (this.anim !== 'handoff') {
      // The main agent may have moved meanwhile: catch up before handing over.
      if (Math.abs(parent.x - this.x) > (HALF_BODY + 2) * (parent.scale + this.scale) * 1.5) return this.toParent();
      this.dir = parent.x > this.x ? 1 : -1;
      return this.play('handoff');
    }
    if (this.finished(now)) this.leave();
  }

  leave() {
    if (this.leaving) return;
    this.delivering = null;
    this.leaving = true;
    this.duo?.quit(this);
    this.release();
    this.target = null;
    this.play('leave', 1, true);
  }

  update(now, dt, agent, zone) {
    const half = HALF_BODY * this.scale;
    this.x = clamp(this.x, zone.x0 + half, zone.x1 - half);
    this.y = clamp(this.y, zone.y0, zone.y1);
    if (this.leaving) {
      if (this.finished(now)) this.dead = true;
      return;
    }
    if (this.delivering) return this.deliver(now, dt);
    if (this.locked && !this.finished(now)) return;
    this.locked = false;

    // A tool just failed: a one-off « oops », unless busy walking or playing.
    if (this.errorSeen === undefined) this.errorSeen = agent.errorAt ?? null;
    if (agent.errorAt && agent.errorAt !== this.errorSeen) {
      this.errorSeen = agent.errorAt;
      if (!this.target && !this.duo) return this.play('oops', 1, true);
    }

    // A commit or a test run just ended: its own reaction, once free to play it.
    if (this.reactionSeen === undefined) this.reactionSeen = agent.reaction?.at ?? null;
    if (agent.reaction && agent.reaction.at !== this.reactionSeen && !this.target && !this.duo) {
      this.reactionSeen = agent.reaction.at;
      if (Date.now() - agent.reaction.at < REACTION_TTL) return this.play(agent.reaction.kind, 1, true);
    }

    // On a coffee break, new tools do not call it back to work; only a change of state does.
    if (this.onBreak && agent.state === 'working' && this.state === 'working') this.activity = agent.activity;

    if (agent.state !== this.state || agent.activity !== this.activity) {
      this.duo?.quit(this);
      this.replan = false; // decided right below
      const wasWorking = this.state === 'working';
      if (agent.state !== this.state) this.stateSince = agent.since ?? Date.now();
      this.state = agent.state;
      this.activity = agent.activity;
      if (agent.state === 'idle') {
        this.idleSince = now;
        this.workingSince = null;
        this.lastBreak = null;
      }
      // Waiting for an answer does not end a stretch of work; going idle does.
      if (agent.state === 'working' && !this.workingSince) this.workingSince = now;
      if (wasWorking && agent.state === 'idle') {
        this.target = null;
        this.justDone = now; // the scene may turn this into a high five
        return this.play('celebrate', 1, true);
      }
      return this.decide(now, zone);
    }

    if (this.duo) {
      if (this.target) this.walk(dt);
      return;
    }
    if (this.replan) {
      this.replan = false;
      this.decide(now, zone);
    } else if (this.target) {
      this.walk(dt);
    } else if (this.finished(now)) {
      this.decide(now, zone);
    }
  }

  planFor(now) {
    this.onBreak = false;
    if (this.state === 'working') {
      if (this.workingSince && now - (this.lastBreak ?? this.workingSince) > BREAK_EVERY && this.activity !== 'compact') {
        this.lastBreak = now;
        this.onBreak = true;
        return BREAK;
      }
      return WORK[this.activity] ?? WORK.type;
    }
    if (this.state === 'waiting') return WAIT;
    if (now - this.idleSince > sleepAfter()) return SLEEP;
    return weighted(IDLE);
  }

  decide(now, zone) {
    const plan = this.planFor(now);
    const stay = plan.station && this.plan?.station === plan.station;
    this.plan = plan;
    if (stay) return this.perform();

    this.release();
    if (plan.station) {
      const free = zone.stations[plan.station]?.filter((s) => !s.occupant) ?? [];
      this.slot = this.nearParent(free) ?? free[0] ?? null;
      if (this.slot) this.slot.occupant = this;
    }
    if (this.slot) return this.walkTo(this.slot.spot(this.scale), zone);
    if (plan.wander) return this.walkTo(randomSpot(zone, this.scale), zone);
    if (plan.station) return this.walkTo(nearbySpot(this, zone), zone);
    this.perform();
  }

  perform() {
    const anims = this.slot?.anims ?? (!this.slot && this.plan.loose ? this.plan.loose : this.plan.anims);
    let name = pick(anims);
    // Tired after a while at the keyboard: a yawn and a stretch, then back to it.
    const typing = this.plan === WORK.type;
    if (typing && this.workingSince && performance.now() - this.workingSince > STRETCH_AFTER && Math.random() < STRETCH_CHANCE) name = 'stretch';
    if (this.slot) this.dir = this.slot.dir;
    this.play(name, name === 'sleep' ? Infinity : name === 'breathe' || name === 'stretch' ? 1 : CYCLES[this.state]);
  }

  // A subagent takes the free place closest to its main agent, wherever that one is headed.
  nearParent(free) {
    const parent = this.parent;
    if (!parent || parent.leaving || parent.zone !== this.zone || !free.length) return null;
    const at = parent.slot?.spot(parent.scale) ?? parent.target ?? parent;
    const dist = (s) => {
      const spot = s.spot(this.scale);
      return Math.hypot(spot.x - at.x, spot.y - at.y);
    };
    return free.reduce((best, s) => (dist(s) < dist(best) ? s : best));
  }

  walkTo(spot, zone) {
    const half = HALF_BODY * this.scale;
    this.target = { x: clamp(spot.x, zone.x0 + half, zone.x1 - half), y: clamp(spot.y, zone.y0, zone.y1) };
    const dist = Math.hypot(this.target.x - this.x, this.target.y - this.y);
    this.speed = Math.max(WALK_SPEED * this.scale, dist / MAX_TRIP);
    if (Math.abs(this.target.x - this.x) > 1) this.dir = this.target.x > this.x ? 1 : -1;
    this.play('walk', Infinity);
  }

  walk(dt) {
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.hypot(dx, dy);
    const step = (this.speed * dt) / 1000;
    if (dist > step) {
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
      return;
    }
    this.x = this.target.x;
    this.y = this.target.y;
    this.target = null;
    if (this.delivering) {
      this.play('breathe', Infinity);
    } else if (this.duo) {
      this.dir = this.duoDir;
      this.play(this.watching ? 'cheer' : this.duo.ready, Infinity);
    } else {
      this.perform();
    }
  }

  // Centre of the ball in its hands, as drawn by « pass-throw ».
  hands(y) {
    const fx = this.dir > 0 ? PASS.x : FRAME_W - PASS.x;
    return { x: this.x + (fx - CENTER) * this.scale, y: this.y + (y - FEET) * this.scale };
  }

  draw(ctx, now) {
    const anim = ANIMS[this.anim];
    const frame = anim.frames[frameIndex(anim, now - this.t0)];
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    if (frame.length) {
      ctx.fillStyle = 'rgb(61 57 41 / 0.08)';
      ctx.beginPath();
      ctx.ellipse(x, y, 7.5 * this.scale, 1.6 * this.scale, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    const left = Math.round(this.x - CENTER * this.scale);
    drawDressed(ctx, frame, left, y - FEET * this.scale, this.scale, PALETTES[this.kind], this.dir < 0, this.costume);
  }
}

// A game between two Clawds on a rug, the left one facing right. Subclasses
// say where they stand (spots), what they show on arrival (ready), how a round
// goes (play) and how it ends (finale).
class Duo {
  constructor(players, slots) {
    this.players = players;
    this.watchers = [];
    this.slots = slots;
    this.watchable = true;
    for (const c of players) c.release();
    for (const slot of slots) slot.occupant = this;
    const spots = this.spots(slots);
    this.places = spots;
    players.forEach((c, i) => {
      c.locked = false;
      c.plan = null;
      c.duo = this;
      c.duoDir = i === 0 ? 1 : -1;
      c.walkTo(spots[i], c.zone);
    });
  }

  update(now) {
    if (this.over) return;
    if (!this.started) {
      // Wait until both stand on their spot.
      if (this.players.some((c) => c.target)) return;
      this.started = true;
    }
    this.play(now);
  }

  // A third Clawd comes to watch from beside one of the players.
  watch(c) {
    const side = this.watchers.some((w) => w.watchSide === 1) ? -1 : 1;
    // From the planned spots: a player may still be stepping around.
    const outer = side > 0 ? this.places[1] : this.places[0];
    c.release();
    c.locked = false;
    c.plan = null;
    c.duo = this;
    c.watching = true;
    c.watchSide = side;
    c.duoDir = -side;
    this.watchers.push(c);
    c.walkTo({ x: outer.x + side * 28 * c.scale, y: outer.y + 6 * c.scale }, c.zone);
  }

  // Someone is called away: a watcher just leaves, a player ends the game.
  quit(c) {
    if (!c.watching) return this.end(false);
    this.watchers = this.watchers.filter((w) => w !== c);
    c.duo = null;
    c.watching = false;
    c.target = null;
    c.plan = null;
    c.replan = true;
  }

  // played: the game reached its end; otherwise one of them was called away.
  end(played) {
    if (this.over) return;
    this.over = true;
    for (const slot of this.slots) if (slot.occupant === this) slot.occupant = null;
    for (const c of this.watchers) {
      // Only those who got there in time cheer; the others just go on.
      const arrived = !c.target;
      c.duo = null;
      c.watching = false;
      c.target = null;
      c.plan = null;
      if (c.leaving) continue;
      if (played && arrived) c.play('celebrate', 1, true);
      else c.replan = true;
    }
    for (const c of this.players) {
      c.duo = null;
      c.target = null;
      c.plan = null;
      if (c.leaving) continue;
      c.dir = c.duoDir;
      if (played) this.finale(c);
      else c.replan = true;
    }
  }

  // Back-to-front key for what the game draws itself: in front of both players.
  get y() {
    return Math.max(...this.players.map((c) => c.y)) + 1;
  }

  draw() {}

  // Drawn over the whole scene, night included, like the names.
  drawOver() {}
}

const between = ([lo, hi]) => lo + Math.floor(Math.random() * (hi - lo + 1));

// Passing a ball from the left spot of the rug to the right one and back.
class BallGame extends Duo {
  static place(zone, players) {
    return freeRug(zone, players);
  }

  constructor(players, slots) {
    super(players, slots);
    this.ready = 'pass-ready';
    this.passes = between(PASSES);
    this.holder = null;
    this.ball = null;
  }

  spots(slots) {
    return this.players.map((c, i) => slots[i === 0 ? 0 : slots.length - 1].spot(c.scale));
  }

  play(now) {
    if (!this.holder) return this.serve(this.players[Math.floor(Math.random() * 2)], now);
    if (this.ball) {
      if (now - this.ball.t0 < this.ball.ms) return;
      this.ball = null;
      if (--this.passes <= 0) return this.end(true);
      return this.serve(this.other(this.holder), now);
    }
    const anim = ANIMS['pass-throw'];
    if ((now - this.holder.t0) * anim.fps / 1000 < PASS.releaseFrame) return;
    const from = this.holder.hands(PASS.releaseY);
    const to = this.other(this.holder).hands(PASS.catchY);
    const scale = Math.min(...this.players.map((c) => c.scale));
    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    this.ball = { from, to, scale, t0: now, ms: Math.max(500, (dist / (BALL_SPEED * scale)) * 1000), arc: dist * 0.35 };
    this.holder.play('pass-ready', Infinity);
  }

  other(player) {
    return this.players.find((c) => c !== player);
  }

  // The catcher gets the ball: frame 0 of « pass-throw » holds it.
  serve(player, now) {
    this.holder = player;
    player.dir = player.duoDir;
    player.play('pass-throw');
    player.t0 = now;
  }

  finale(c) {
    c.play('jump', 1, true);
  }

  end(played) {
    this.ball = null;
    super.end(played);
  }

  draw(ctx, now) {
    if (!this.ball) return;
    const { from, to, scale, t0, ms, arc } = this.ball;
    const t = Math.min(1, (now - t0) / ms);
    const x = from.x + (to.x - from.x) * t;
    const y = from.y + (to.y - from.y) * t - arc * 4 * t * (1 - t);
    const left = Math.round(x - 2 * scale);
    const top = Math.round(y - 2 * scale);
    BALL.forEach((row, j) => [...row].forEach((c, i) => {
      if (c === '.') return;
      ctx.fillStyle = c === 'W' ? '#ffffff' : '#e5484d';
      ctx.fillRect(left + i * scale, top + j * scale, scale, scale);
    }));
  }
}

// Sword fight in the middle of the rug: exchanges of strike and parry, the
// last one to attack wins and the other one sits down, dizzy.
class SwordDuel extends Duo {
  static place(zone, players) {
    return freeRug(zone, players);
  }

  constructor(players, slots) {
    super(players, slots);
    this.ready = 'sword-guard';
    this.exchanges = between(EXCHANGES);
    this.attacker = players[Math.floor(Math.random() * 2)];
    this.next = 0;
    this.spark = null;
  }

  spots(slots) {
    const scale = Math.min(...this.players.map((c) => c.scale));
    const middle = slots[Math.floor(slots.length / 2)].spot(scale);
    return this.players.map((c, i) => ({ x: middle.x + (i === 0 ? -1 : 1) * DUEL_GAP * c.scale, y: middle.y }));
  }

  play(now) {
    const [a, b] = [this.attacker, this.players.find((c) => c !== this.attacker)];
    if (!this.clash) {
      if (!this.next) this.next = now + 600;
      if (now < this.next) return;
      for (const c of this.players) c.dir = c.duoDir;
      a.play('sword-strike');
      b.play('sword-block');
      a.t0 = b.t0 = now;
      this.clash = { hit: false };
      return;
    }
    const anim = ANIMS['sword-strike'];
    if (!this.clash.hit && (now - a.t0) * anim.fps / 1000 >= 3) {
      this.clash.hit = true;
      const scale = Math.min(a.scale, b.scale);
      // Where the blades meet: level with the hands, halfway between them.
      this.spark = { x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) - 8 * scale, scale, t0: now };
    }
    if (!a.finished(now)) return;
    this.clash = null;
    if (--this.exchanges <= 0) {
      this.winner = a;
      return this.end(true);
    }
    for (const c of this.players) c.play('sword-guard', Infinity);
    this.next = now + 300 + Math.random() * 700;
    if (Math.random() < 0.6) this.attacker = b;
  }

  finale(c) {
    if (c === this.winner) c.play('sword-win', 2, true);
    else c.play('sword-lose', 4, true);
  }

  draw(ctx, now) {
    if (!this.spark) return;
    const { x, y, scale, t0 } = this.spark;
    const t = (now - t0) / SPARK_MS;
    if (t >= 1) return (this.spark = null);
    // A star that bursts out then fades: centre, then rays one cell further each step.
    const reach = 1 + Math.floor(t * 3);
    ctx.fillStyle = t < 0.5 ? '#ffffff' : '#f2c14e';
    const cell = (i, j) => ctx.fillRect(Math.round(x + (i - 0.5) * scale), Math.round(y + (j - 0.5) * scale), scale, scale);
    if (t < 0.4) cell(0, 0);
    ctx.fillStyle = '#f2c14e';
    for (let k = 1; k <= reach; k++) {
      cell(k, 0); cell(-k, 0); cell(0, k); cell(0, -k);
      if (k < reach) { cell(k, k); cell(-k, -k); cell(k, -k); cell(-k, k); }
    }
  }
}

// Done with its work, a Clawd meets an idle one halfway for a high five.
class HighFive extends Duo {
  constructor(players) {
    super(players, []);
    this.ready = 'breathe';
  }

  spots() {
    const [a, b] = this.players;
    const x = (a.x + b.x) / 2;
    const y = (a.y + b.y) / 2;
    return this.players.map((c, i) => ({ x: x + (i === 0 ? -1 : 1) * FIVE_GAP * c.scale, y }));
  }

  play(now) {
    if (!this.slapping) {
      this.slapping = true;
      for (const c of this.players) {
        c.dir = c.duoDir;
        c.play('high-five');
        c.t0 = now;
      }
      return;
    }
    if (this.players.every((c) => c.finished(now))) this.end(true);
  }

  finale(c) {
    c.replan = true;
  }
}

// Dancing face to face in front of a radio, in step.
class DanceDuo extends Duo {
  static place(zone, players) {
    return freeRadio(zone, players);
  }

  constructor(players, slots) {
    super(players, slots);
    this.ready = 'breathe';
    this.until = 0;
  }

  spots(slots) {
    const scale = Math.min(...this.players.map((c) => c.scale));
    const at = slots.map((s) => s.spot(scale));
    const x = at.reduce((sum, a) => sum + a.x, 0) / at.length;
    const y = Math.max(...at.map((a) => a.y)) + 14 * scale;
    return this.players.map((c, i) => ({ x: x + (i === 0 ? -1 : 1) * DANCE_GAP * c.scale, y }));
  }

  play(now) {
    if (!this.until) {
      this.until = now + DANCE_MS[0] + Math.random() * (DANCE_MS[1] - DANCE_MS[0]);
      for (const c of this.players) {
        c.dir = c.duoDir;
        c.play('duo-dance', Infinity);
        c.t0 = now;
      }
      return;
    }
    if (now >= this.until) this.end(true);
  }

  finale(c) {
    c.play('jump', 1, true);
  }
}

// Chatting over a coffee in front of the counter: they take turns, the one
// speaking shows what it says in a bubble, the other nods and sips.
class CoffeeChat extends Duo {
  static place(zone, players) {
    return freeCounter(zone, players);
  }

  constructor(players, slots) {
    super(players, slots);
    this.ready = 'coffee';
    this.watchable = false; // nobody stands around a private conversation
    this.turns = between(CHAT_TURNS);
    this.speaker = null;
    this.until = 0;
    this.bubble = null;
  }

  spots([counter]) {
    const scale = Math.min(...this.players.map((c) => c.scale));
    const { x, y } = counter.spot(scale);
    return this.players.map((c, i) => ({ x: x + (i === 0 ? -1 : 1) * CHAT_GAP * c.scale, y }));
  }

  play(now) {
    if (now < this.until) return;
    if (this.speaker && --this.turns <= 0) return this.end(true);
    // Mostly a reply, sometimes a follow-up from the same one.
    const other = this.players.find((c) => c !== this.speaker);
    this.speaker = !this.speaker ? pick(this.players) : Math.random() < 0.75 ? other : this.speaker;
    for (const c of this.players) {
      c.dir = c.duoDir;
      c.play(c === this.speaker ? 'coffee-talk' : 'coffee-listen', Infinity);
      c.t0 = now;
    }
    const ms = CHAT_MS[0] + Math.random() * (CHAT_MS[1] - CHAT_MS[0]);
    this.until = now + ms;
    const last = this.bubble?.saying;
    this.bubble = { who: this.speaker, saying: pick(SAYINGS.filter((s) => s !== last)), from: now + 200, to: now + ms - 350 };
  }

  finale(c) {
    c.play('coffee', 1, true);
  }

  // A speech bubble over the speaker's head, its tail pointing down at it.
  drawOver(ctx, now) {
    const b = this.bubble;
    if (!b || now < b.from || now > b.to) return;
    const c = b.who;
    const s = c.scale;
    const ink = PALETTES.main;
    const left = Math.round(c.x + c.dir * 3 * s - (BUBBLE[0].length / 2) * s);
    const top = Math.round(c.y - (HEAD + 3 + BUBBLE.length) * s);
    const cell = (i, j, key) => {
      ctx.fillStyle = ink[key];
      ctx.fillRect(left + i * s, top + j * s, s, s);
    };
    const stampAt = (rows, x, y) => rows.forEach((row, j) => [...row].forEach((k, i) => k !== '.' && cell(x + i, y + j, k)));
    stampAt(BUBBLE, 0, 0);
    stampAt(b.saying, 2, 2);
    // Tail on the speaker's side of the bubble.
    const t = Math.round(BUBBLE[0].length / 2 - c.dir * 3);
    const h = BUBBLE.length;
    cell(t, h - 1, 'W');
    cell(t - 1, h, 'K');
    cell(t, h, 'W');
    cell(t + 1, h, 'K');
    cell(t - c.dir, h + 1, 'K');
  }
}

const GAMES = [BallGame, SwordDuel, DanceDuo, CoffeeChat];

// Idle Clawds free to start a game: not walking, not asleep, not already playing.
function available(critter, now) {
  return !critter.leaving && !critter.duo && !critter.locked && !critter.target &&
    critter.state === 'idle' && critter.plan && critter.plan !== SLEEP && now - critter.idleSince < sleepAfter();
}

// A rug with nobody on it but the players (spots come in threes, left to right).
function freeRug(zone, players) {
  const spots = zone.stations.rug ?? [];
  for (let i = 0; i + 2 < spots.length; i += 3) {
    const rug = spots.slice(i, i + 3);
    if (rug.every((s) => !s.occupant || players.includes(s.occupant))) return rug;
  }
  return null;
}

// A coffee counter free but for the players, its machine included.
function freeCounter(zone, players) {
  for (const counter of zone.stations.chat ?? []) {
    const spots = [counter, counter.near];
    if (spots.every((s) => !s.occupant || players.includes(s.occupant))) return spots;
  }
  return null;
}

// A radio whose two listening spots are free but for the players (spots come in pairs).
function freeRadio(zone, players) {
  const spots = zone.stations.radio ?? [];
  for (let i = 0; i + 1 < spots.length; i += 2) {
    const radio = spots.slice(i, i + 2);
    if (radio.every((s) => !s.occupant || players.includes(s.occupant))) return radio;
  }
  return null;
}

function randomSpot(zone, scale) {
  const half = HALF_BODY * scale;
  return {
    x: zone.x0 + half + Math.random() * Math.max(0, zone.x1 - zone.x0 - 2 * half),
    y: zone.y0 + Math.random() * Math.max(0, zone.y1 - zone.y0),
  };
}

// A few steps away, for when every place at a station is taken.
function nearbySpot(critter, zone) {
  const angle = Math.random() * Math.PI * 2;
  const dist = (16 + Math.random() * 24) * critter.scale;
  return { x: critter.x + Math.cos(angle) * dist, y: clamp(critter.y + Math.sin(angle) * dist * 0.6, zone.y0, zone.y1) };
}

// The card shown when a Clawd is clicked.
const STATE_LABELS = { working: 'Travaille', waiting: 'Attend un input', idle: 'Au repos' };
const ACTIVITY_LABELS = {
  type: 'écrit',
  search: 'lit, cherche',
  web: 'sur le web',
  think: 'réfléchit',
  compact: 'compacte le contexte',
  flag: 'demande une permission',
  bubble: 'attend une réponse',
};
const esc = (text) => String(text).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function duration(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`;
}

function cardHtml(c) {
  const a = c.info;
  const now = Date.now();
  const rows = [];
  const row = (label, value) => rows.push(`<dt>${label}</dt><dd>${value}</dd>`);
  if (a.dir) row('Dossier', `<code>${esc(a.dir)}</code>`);
  if (a.kind === 'sub') row('Lancé par', esc(a.parentLabel));
  let state = STATE_LABELS[a.state] ?? esc(a.state);
  if (c.plan === SLEEP) state += ' (dort)';
  else if (c.onBreak) state += ' (pause café)';
  row('État', state);
  const doing = [ACTIVITY_LABELS[a.activity], a.tool && `<code>${esc(a.tool)}</code>`].filter(Boolean).join(' · ');
  if (a.state !== 'idle' && doing) row('En cours', doing);
  if (c.stateSince) row('Depuis', duration(now - c.stateSince));
  if (a.startedAt) row(a.kind === 'sub' ? 'Lancé il y a' : 'Session ouverte', duration(now - a.startedAt));
  if (a.subagents?.length) row('Subagents', a.subagents.map((sub) => esc(sub.type)).join(', '));
  if (a.lastError) row('Dernière erreur', `${a.lastError.tool ? `<code>${esc(a.lastError.tool)}</code> · ` : ''}il y a ${duration(now - a.lastError.at)}`);
  return `
    <header><strong>${esc(a.label)}</strong>${a.kind === 'sub' ? ' <small>subagent</small>' : ''}
      <button type="button" class="close" aria-label="Fermer">×</button></header>
    <dl>${rows.join('')}</dl>`;
}

// Flattens a server snapshot into one entry per agent, main agents first.
function agentsOf(snapshot) {
  const agents = [];
  snapshot.sessions.forEach((s, zone) => {
    const label = s.name || s.id.slice(0, 8);
    agents.push({ ...s, key: s.id, kind: 'main', label, zone });
    for (const sub of s.subagents) {
      agents.push({ ...sub, key: `${s.id}/${sub.id}`, parent: s.id, parentLabel: label, kind: 'sub', label: sub.type, zone });
    }
  });
  return agents;
}

// One scene: fed by the server snapshots, or by a demo model (see demo.js) when
// `demo` is set.
export function createLive(root, { demo = null, settings = DEFAULT_SETTINGS } = {}) {
  root.innerHTML = `
    <div class="stage"><canvas></canvas><div class="agent-card" role="dialog" hidden></div></div>
    <div class="live-bar"><span class="status" data-state="off">hors ligne</span></div>`;
  const stage = root.querySelector('.stage');
  const canvas = root.querySelector('canvas');
  const status = root.querySelector('.status');
  const card = root.querySelector('.agent-card');

  const critters = new Map();
  let duos = [];
  const lastPairing = new Map(); // zone -> time of the last pairing attempt
  let snapshot = { sessions: [] };
  let connected = false;
  let ctx;
  let width = 0;
  let viewHeight = 0;
  let height = 0;
  let office = null;
  let officeKey = '';
  let raf = 0;
  let last = performance.now();
  const demoStart = performance.now();
  // Overrides from the demo bar: a fixed hour, weather or season ('auto' keeps
  // the real one) and a salt that redraws the decor.
  let view = { hour: forcedHour, weather: 'auto', season: 'auto', salt: '' };
  let season = null; // the decor's, which the costumes follow
  const cat = new Cat();
  let shown = null; // the Clawd whose card is open
  let cardAt = 0; // when the card's text was last refreshed

  function resize() {
    width = stage.clientWidth;
    viewHeight = stage.clientHeight;
  }

  function renderStatus() {
    if (demo) {
      status.dataset.state = 'demo';
      status.textContent = demo.describe();
      return;
    }
    const n = snapshot.sessions.length;
    status.dataset.state = connected ? 'on' : 'off';
    status.textContent = connected ? `connecté · ${n} session${n > 1 ? 's' : ''}` : 'hors ligne';
  }

  // Rebuilds the decor when the window, the settings or the list of sessions change.
  function ensureOffice(sessions) {
    const names = sessions.map((s) => s.name || s.id.slice(0, 8));
    const { decor, layout, px } = settings;
    season = view.season === 'auto' ? seasonOf(sceneDate(view.hour)) : view.season;
    const key = `${decor}|${layout}|${px}|${season}|${view.salt}|${width}x${viewHeight}|${names.join('|')}`;
    if (key === officeKey) return;
    officeKey = key;
    office = (DECORS[decor] ?? DECORS[DEFAULT_SETTINGS.decor]).build(width, viewHeight, names, { layout, px, season, salt: view.salt });
    height = office.height;
    ctx = fitCanvas(canvas, width, height);
    for (const critter of critters.values()) {
      critter.scale = scaleFor(critter.kind, px);
      critter.relocate();
    }
    cat.place(office, px, performance.now(), { season, salt: view.salt });
  }

  // Whoever just finished working looks for an idle Clawd close by.
  function highFives(now) {
    for (const c of critters.values()) {
      if (!c.justDone) continue;
      const done = c;
      c.justDone = null;
      if (done.duo || done.leaving) continue;
      const near = [...critters.values()].filter((o) => o !== done && o.zone === done.zone && available(o, now) &&
        Math.hypot(o.x - done.x, o.y - done.y) < FIVE_REACH * done.scale);
      if (!near.length) continue;
      const other = pick(near);
      duos.push(new HighFive(done.x <= other.x ? [done, other] : [other, done]));
    }
  }

  function pairUp(now) {
    for (const zone of office.zones) {
      if (now - (lastPairing.get(zone) ?? 0) < PAIR_EVERY) continue;
      lastPairing.set(zone, now);
      if (Math.random() >= PAIR_CHANCE) continue;
      const free = [...critters.values()].filter((c) => c.zone === zone && available(c, now));
      // A game already on in this zone draws a spectator or two before a new one starts.
      const game = duos.find((d) => d.started && d.watchable && d.players[0].zone === zone && d.watchers.length < 2);
      if (game && free.length) {
        game.watch(pick(free));
        continue;
      }
      if (free.length < 2) continue;
      const a = free.splice(Math.floor(Math.random() * free.length), 1)[0];
      const b = free[Math.floor(Math.random() * free.length)];
      // Games in random order; the first one with a free place wins. Whoever
      // stands further left takes the left spot.
      for (const Game of [...GAMES].sort(() => Math.random() - 0.5)) {
        const slots = Game.place(zone, [a, b]);
        if (!slots) continue;
        duos.push(new Game(a.x <= b.x ? [a, b] : [b, a], slots));
        break;
      }
    }
  }

  function tick(now) {
    const dt = Math.min(now - last, 100);
    last = now;
    const current = demo ? demo.snapshot(Math.max(0, now - demoStart) / 1000) : snapshot;
    ensureOffice(current.sessions);
    const agents = agentsOf(current);

    for (const agent of agents) {
      // Rooms keep each session in its own zone; the shared office has a single one.
      const zone = office.zones[office.shared ? 0 : agent.zone];
      let critter = critters.get(agent.key);
      if (!critter) {
        const scale = scaleFor(agent.kind, settings.px);
        const parent = agent.parent && critters.get(agent.parent);
        critter = parent
          ? new Critter(agent.kind, scale, parent.x + (Math.random() < 0.5 ? -1 : 1) * (12 + Math.random() * 12) * scale, parent.y + (Math.random() - 0.5) * 24 * scale)
          : new Critter(agent.kind, scale, zone.x0 + Math.random() * (zone.x1 - zone.x0), (zone.y0 + zone.y1) / 2);
        critters.set(agent.key, critter);
      }
      critter.label = agent.label;
      critter.info = agent;
      critter.parent = agent.parent ? critters.get(agent.parent) ?? null : null;
      critter.zone = zone;
      critter.costume = costumeFor(agent.key, season);
      critter.update(now, dt, agent, zone);
    }

    for (const duo of duos) duo.update(now);
    duos = duos.filter((d) => !d.over);
    highFives(now);
    pairUp(now);

    const alive = new Set(agents.map((a) => a.key));
    for (const [key, critter] of critters) {
      if (alive.has(key)) continue;
      const parent = critter.kind === 'sub' && critters.get(key.split('/')[0]);
      if (parent && alive.has(key.split('/')[0]) && parent.zone === critter.zone && !critter.leaving) {
        if (!critter.delivering) critter.handOver(parent, now);
      } else {
        critter.leave();
      }
      critter.update(now, dt, critter, critter.zone ?? office.zones[0]);
      if (critter.dead) critters.delete(key);
    }

    const date = sceneDate(view.hour);
    cat.update(now, dt, [...critters.values()], daylight(date).night > 0.5);

    ctx.drawImage(office.background, 0, 0, width, height);
    office.overlay(ctx, date, view.weather === 'auto' ? currentWeather() : view.weather);

    // Furniture and Clawds back to front, so whoever stands lower is drawn over the rest.
    const scene = [
      ...office.props.map((p) => ({ y: p.base, draw: () => p.draw(ctx) })),
      ...[...critters.values()].map((c) => ({ y: c.y, draw: () => c.draw(ctx, now) })),
      ...duos.map((d) => ({ y: d.y, draw: () => d.draw(ctx, now) })),
      { y: cat.key, draw: () => cat.draw(ctx, now) },
    ].sort((a, b) => a.y - b.y);
    for (const item of scene) item.draw();
    // Night falls on furniture and Clawds alike; the names stay readable.
    const night = office.shade?.(ctx, date, width, height) ?? 0;
    const dark = night > 0.5;
    // At night, working at a desk, a shelf or a whiteboard switches its light on;
    // it goes off once nobody works there any more. A click switches it by hand.
    const lit = new Set();
    for (const c of critters.values()) {
      if (night && c.state === 'working' && !c.target && c.slot?.light) lit.add(c.slot.light);
    }
    for (const light of office.workLights ?? []) {
      const level = lightLevel(light, lit.has(light), night);
      if (level) drawLight(ctx, light, level);
    }
    for (const duo of duos) duo.drawOver(ctx, now);
    cat.drawOver(ctx, now, dark);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    for (const critter of critters.values()) {
      if (critter.leaving) continue;
      const main = critter.kind === 'main';
      ctx.font = main ? '600 13px ui-monospace, monospace' : '11px ui-monospace, monospace';
      ctx.fillStyle = dark ? (main ? '#f0eee6' : '#c9c5b9') : main ? '#3d3929' : '#8f8b82';
      ctx.fillText(critter.label ?? '', Math.round(critter.x), Math.round(critter.y) + 12 + critter.scale);
    }

    office.labels?.(ctx);

    if (critters.size === 0) {
      ctx.fillStyle = '#8f8b82';
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText('Aucune session Claude Code active', width / 2, viewHeight / 2);
    }

    updateCard(now);
    raf = requestAnimationFrame(tick);
  }

  // The Clawd under the pointer, if any: its body, or loosely around it and its name
  // (after the lamps, so a desk lamp beside a Clawd can still be switched).
  function critterAt(x, y, loose = false) {
    let best = null;
    let bestDist = Infinity;
    for (const c of critters.values()) {
      if (c.leaving) continue;
      const inside = loose
        ? Math.abs(x - c.x) <= (HALF_BODY + 2) * c.scale && y >= c.y - (HEAD + 4) * c.scale && y <= c.y + 16 + c.scale
        : Math.abs(x - c.x) <= 6.5 * c.scale && y >= c.y - HEAD * c.scale && y <= c.y;
      const dist = Math.hypot(x - c.x, y - (c.y - (HEAD / 2) * c.scale));
      if (inside && dist < bestDist) {
        best = c;
        bestDist = dist;
      }
    }
    return best;
  }

  function openCard(critter) {
    shown = critter;
    card.hidden = !critter;
    cardAt = 0;
  }

  // Follows its Clawd; the text is refreshed twice a second.
  function updateCard(now) {
    if (!shown) return;
    if (shown.dead || shown.leaving || ![...critters.values()].includes(shown)) return openCard(null);
    if (now - cardAt > 500) {
      cardAt = now;
      card.innerHTML = cardHtml(shown);
    }
    const w = card.offsetWidth;
    const h = card.offsetHeight;
    let top = shown.y - (HEAD + 8) * shown.scale - h;
    if (top < stage.scrollTop + 4) top = shown.y + 18 + shown.scale;
    card.style.left = `${Math.round(clamp(shown.x - w / 2, 4, width - w - 4))}px`;
    card.style.top = `${Math.round(top)}px`;
  }

  canvas.addEventListener('click', (e) => {
    const [x, y] = [e.offsetX, e.offsetY];
    if (cat.hit(x, y)) return cat.pet(performance.now());
    const critter = critterAt(x, y);
    if (critter) return openCard(critter);
    if (office.ghosts?.some((g) => g.scare(x, y, performance.now()))) return;
    if (office.toggleAt?.(x, y)) return;
    openCard(critterAt(x, y, true));
  });
  canvas.addEventListener('mousemove', (e) => {
    const [x, y] = [e.offsetX, e.offsetY];
    const any = cat.hit(x, y) || critterAt(x, y, true) || office?.ghosts?.some((g) => g.hit(x, y)) || office?.hitSwitch?.(x, y);
    canvas.style.cursor = any ? 'pointer' : '';
  });
  card.addEventListener('click', (e) => {
    if (e.target.closest('.close')) openCard(null);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !root.hidden) openCard(null);
  });

  new ResizeObserver(() => {
    if (!root.hidden) resize();
  }).observe(stage);

  return {
    show() {
      root.hidden = false;
      resize();
      renderStatus();
      last = performance.now();
      if (!raf) raf = requestAnimationFrame(tick);
    },
    hide() {
      root.hidden = true;
      openCard(null);
      cancelAnimationFrame(raf);
      raf = 0;
    },
    setSnapshot(next) {
      snapshot = next;
      renderStatus();
    },
    setConnected(value) {
      connected = value;
      renderStatus();
    },
    setSettings(next) {
      settings = next;
    },
    setView(next) {
      view = { ...view, ...next };
    },
    refreshStatus: renderStatus,
  };
}
