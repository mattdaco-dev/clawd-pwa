import { ANIMS, BALL, FRAME_H, FRAME_W, PASS } from './sprites.js';
import { PALETTES, cycleDone, drawFrame, fitCanvas, frameIndex } from './render.js';
import { DECORS, DEFAULT_SETTINGS } from './decor.js';

// Subagents are drawn one pixel size smaller than their main agent.
const scaleFor = (kind, px) => (kind === 'main' ? px : Math.max(2, px - 1));
const FEET = FRAME_H - 1; // rows from the top of a frame down to below the feet
const CENTER = 15.5; // frame column under the middle of Clawd's body
const HALF_BODY = 10; // body half-width in sprite pixels, arms included
const WALK_SPEED = 7; // sprite pixels per second, at least
const MAX_TRIP = 3; // seconds; long trips walk faster
const SLEEP_AFTER = 120_000;

// Where each state happens in the office, and what is played once there.
// `loose` replaces `anims` when every place at the station is taken.
const WORK = {
  type: { station: 'desk', anims: ['type-front'], loose: ['type-front', 'type-laptop'] },
  search: { station: 'shelf', anims: ['search'] },
  web: { station: 'shelf', anims: ['globe'] },
  think: { station: 'board', anims: ['think'] },
};
const WAIT = { station: 'front', anims: ['flag', 'bubble', 'wave'] };
const SLEEP = { station: 'beanbag', anims: ['sleep'] };
const IDLE = [
  [{ station: null, wander: true, anims: ['breathe', 'look'] }, 40],
  [{ station: 'coffee', anims: ['breathe', 'look'] }, 25],
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
    this.duo?.end(false);
    this.slot = null;
    this.plan = null;
    this.target = null;
    this.replan = true;
  }

  // A finished subagent walks up to its main agent and hands its report over
  // before vanishing; gives up after a while if the main agent keeps moving.
  handOver(parent, now) {
    this.duo?.end(false);
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
    this.duo?.end(false);
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

    if (agent.state !== this.state || agent.activity !== this.activity) {
      this.duo?.end(false);
      this.replan = false; // decided right below
      const wasWorking = this.state === 'working';
      this.state = agent.state;
      this.activity = agent.activity;
      if (agent.state === 'idle') this.idleSince = now;
      if (wasWorking && agent.state === 'idle') {
        this.target = null;
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
    if (this.state === 'working') return WORK[this.activity] ?? WORK.type;
    if (this.state === 'waiting') return WAIT;
    if (now - this.idleSince > SLEEP_AFTER) return SLEEP;
    return weighted(IDLE);
  }

  decide(now, zone) {
    const plan = this.planFor(now);
    const stay = plan.station && this.plan?.station === plan.station;
    this.plan = plan;
    if (stay) return this.perform();

    this.release();
    if (plan.station) {
      this.slot = zone.stations[plan.station]?.find((s) => !s.occupant) ?? null;
      if (this.slot) this.slot.occupant = this;
    }
    if (this.slot) return this.walkTo(this.slot.spot(this.scale), zone);
    if (plan.wander) return this.walkTo(randomSpot(zone, this.scale), zone);
    if (plan.station) return this.walkTo(nearbySpot(this, zone), zone);
    this.perform();
  }

  perform() {
    const anims = this.slot?.anims ?? (!this.slot && this.plan.loose ? this.plan.loose : this.plan.anims);
    const name = pick(anims);
    if (this.slot) this.dir = this.slot.dir;
    this.play(name, name === 'sleep' ? Infinity : name === 'breathe' ? 1 : CYCLES[this.state]);
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
      this.play(this.duo.ready, Infinity);
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
    drawFrame(ctx, frame, left, y - FEET * this.scale, this.scale, PALETTES[this.kind], this.dir < 0);
  }
}

// A game between two Clawds on a rug, the left one facing right. Subclasses
// say where they stand (spots), what they show on arrival (ready), how a round
// goes (play) and how it ends (finale).
class Duo {
  constructor(players, slots) {
    this.players = players;
    this.slots = slots;
    for (const slot of slots) slot.occupant = this;
    const spots = this.spots(slots);
    players.forEach((c, i) => {
      c.release();
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

  // played: the game reached its end; otherwise one of them was called away.
  end(played) {
    if (this.over) return;
    this.over = true;
    for (const slot of this.slots) if (slot.occupant === this) slot.occupant = null;
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
}

const between = ([lo, hi]) => lo + Math.floor(Math.random() * (hi - lo + 1));

// Passing a ball from the left spot of the rug to the right one and back.
class BallGame extends Duo {
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

const GAMES = [BallGame, SwordDuel];

// Idle Clawds free to start a game: not walking, not asleep, not already playing.
function available(critter, now) {
  return !critter.leaving && !critter.duo && !critter.locked && !critter.target &&
    critter.state === 'idle' && critter.plan && critter.plan !== SLEEP && now - critter.idleSince < SLEEP_AFTER;
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

// Flattens a server snapshot into one entry per agent, main agents first.
function agentsOf(snapshot) {
  const agents = [];
  snapshot.sessions.forEach((s, zone) => {
    agents.push({ key: s.id, kind: 'main', label: s.name || s.id.slice(0, 8), state: s.state, activity: s.activity, zone });
    for (const sub of s.subagents) {
      agents.push({ key: `${s.id}/${sub.id}`, parent: s.id, kind: 'sub', label: sub.type, state: sub.state, activity: sub.activity, zone });
    }
  });
  return agents;
}

// Scripted sessions for trying the scene without Claude Code.
function demoSnapshot(seconds) {
  const sub = (id, type, state, activity) => ({ id, type, state, activity });
  const steps = [
    { state: 'idle', activity: null, subs: [] },
    { state: 'working', activity: 'think', subs: [] },
    { state: 'working', activity: 'think', subs: [sub('a1', 'Explore', 'working', 'search')] },
    { state: 'waiting', activity: 'flag', subs: [sub('a1', 'Explore', 'working', 'web'), sub('a2', 'general-purpose', 'working', 'type')] },
    { state: 'working', activity: 'type', subs: [sub('a2', 'general-purpose', 'waiting', 'bubble')] },
    { state: 'idle', activity: null, subs: [] },
  ];
  const session = (id, name, offset) => {
    const { state, activity, subs } = steps[(Math.floor(seconds / 8) + offset) % steps.length];
    return { id, name, state, activity, subagents: subs.map((s) => ({ ...s, id: `${id}-${s.id}` })) };
  };
  return { sessions: [session('demo', 'démo', 0), session('api', 'api', 3), session('web', 'web', 1)] };
}

// One scene: fed by the server snapshots, or by the scripted demo when `demo` is set.
export function createLive(root, { demo = false, settings = DEFAULT_SETTINGS } = {}) {
  root.innerHTML = `
    <div class="stage"><canvas></canvas></div>
    <div class="live-bar"><span class="status" data-state="off">hors ligne</span></div>`;
  const stage = root.querySelector('.stage');
  const canvas = root.querySelector('canvas');
  const status = root.querySelector('.status');

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

  function resize() {
    width = stage.clientWidth;
    viewHeight = stage.clientHeight;
  }

  function renderStatus() {
    if (demo) {
      status.dataset.state = 'demo';
      status.textContent = 'démo · 3 sessions, scénario en boucle de 48 s';
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
    const key = `${decor}|${layout}|${px}|${width}x${viewHeight}|${names.join('|')}`;
    if (key === officeKey) return;
    officeKey = key;
    office = (DECORS[decor] ?? DECORS[DEFAULT_SETTINGS.decor]).build(width, viewHeight, names, { layout, px });
    height = office.height;
    ctx = fitCanvas(canvas, width, height);
    for (const critter of critters.values()) {
      critter.scale = scaleFor(critter.kind, px);
      critter.relocate();
    }
  }

  function pairUp(now) {
    for (const zone of office.zones) {
      if (now - (lastPairing.get(zone) ?? 0) < PAIR_EVERY) continue;
      lastPairing.set(zone, now);
      if (Math.random() >= PAIR_CHANCE) continue;
      const free = [...critters.values()].filter((c) => c.zone === zone && available(c, now));
      if (free.length < 2) continue;
      const a = free.splice(Math.floor(Math.random() * free.length), 1)[0];
      const b = free[Math.floor(Math.random() * free.length)];
      const rug = freeRug(zone, [a, b]);
      if (!rug) continue;
      // Whoever stands further left takes the left spot.
      const Game = pick(GAMES);
      duos.push(new Game(a.x <= b.x ? [a, b] : [b, a], rug));
    }
  }

  function tick(now) {
    const dt = Math.min(now - last, 100);
    last = now;
    const current = demo ? demoSnapshot(Math.max(0, now - demoStart) / 1000) : snapshot;
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
      critter.zone = zone;
      critter.update(now, dt, agent, zone);
    }

    for (const duo of duos) duo.update(now);
    duos = duos.filter((d) => !d.over);
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

    ctx.drawImage(office.background, 0, 0, width, height);
    office.overlay(ctx, new Date());

    // Furniture and Clawds back to front, so whoever stands lower is drawn over the rest.
    const scene = [
      ...office.props.map((p) => ({ y: p.base, draw: () => p.draw(ctx) })),
      ...[...critters.values()].map((c) => ({ y: c.y, draw: () => c.draw(ctx, now) })),
      ...duos.map((d) => ({ y: d.y, draw: () => d.draw(ctx, now) })),
    ].sort((a, b) => a.y - b.y);
    for (const item of scene) item.draw();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    for (const critter of critters.values()) {
      if (critter.leaving) continue;
      const main = critter.kind === 'main';
      ctx.font = main ? '600 13px ui-monospace, monospace' : '11px ui-monospace, monospace';
      ctx.fillStyle = main ? '#3d3929' : '#8f8b82';
      ctx.fillText(critter.label ?? '', Math.round(critter.x), Math.round(critter.y) + 12 + critter.scale);
    }

    if (critters.size === 0) {
      ctx.fillStyle = '#8f8b82';
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText('Aucune session Claude Code active', width / 2, viewHeight / 2);
    }

    raf = requestAnimationFrame(tick);
  }

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
  };
}
