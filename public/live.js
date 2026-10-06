import { ANIMS, FRAME_H, FRAME_W } from './sprites.js';
import { PALETTES, cycleDone, drawFrame, fitCanvas, frameIndex } from './render.js';

const SCALE = { main: 5, sub: 4 };
const FEET = FRAME_H - 1; // rows from the top of a frame down to below the feet
const LABEL_SPACE = 28; // under the lowest feet line, for the agent names
const WALK_SPEED = 7; // sprite pixels per second
const SLEEP_AFTER = 120_000;

const WORK_ANIMS = {
  type: ['type-front', 'type-laptop'],
  search: ['search'],
  web: ['web'],
  think: ['think'],
};
const WAIT_ANIMS = ['flag', 'bubble', 'wave'];
const IDLE_ANIMS = [['walk', 35], ['breathe', 20], ['look', 15], ['jump', 10], ['dance', 10], ['ball', 10]];

const pick = (list) => list[Math.floor(Math.random() * list.length)];
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), Math.max(lo, hi));

function weighted(list) {
  let r = Math.random() * list.reduce((sum, [, w]) => sum + w, 0);
  for (const [value, w] of list) if ((r -= w) < 0) return value;
  return list[0][0];
}

// A Clawd on the floor: x is the left edge of its frame, y the line under its feet.
class Critter {
  constructor(kind, x, y) {
    this.kind = kind;
    this.scale = SCALE[kind];
    this.x = x;
    this.y = y;
    this.dir = 1;
    this.state = null;
    this.activity = null;
    this.idleSince = performance.now();
    this.play('arrive', 1, true);
  }

  get width() {
    return FRAME_W * this.scale;
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

  leave() {
    if (this.leaving) return;
    this.leaving = true;
    this.play('leave', 1, true);
  }

  update(now, dt, agent, zone) {
    this.x = clamp(this.x, zone.x0, zone.x1 - this.width);
    this.y = clamp(this.y, zone.y0, zone.y1);
    if (this.leaving) {
      if (this.finished(now)) this.dead = true;
      return;
    }
    if (this.locked && !this.finished(now)) return;

    if (agent.state !== this.state || agent.activity !== this.activity) {
      const wasWorking = this.state === 'working';
      this.state = agent.state;
      this.activity = agent.activity;
      if (agent.state === 'idle') this.idleSince = now;
      if (wasWorking && agent.state === 'idle') return this.play('celebrate', 1, true);
      // Head somewhere new before starting the activity, so the scene spreads out.
      if (agent.state !== 'idle') return this.walkTo(this.nearbySpot(zone));
      this.choose(now, zone);
      return;
    }

    if (this.anim === 'walk') this.walk(now, dt, zone);
    else if (this.finished(now)) this.choose(now, zone);
  }

  walk(now, dt, zone) {
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.hypot(dx, dy);
    const step = (WALK_SPEED * this.scale * dt) / 1000;
    if (dist <= step) {
      this.x = this.target.x;
      this.y = this.target.y;
      this.choose(now, zone);
      return;
    }
    this.x += (dx / dist) * step;
    this.y += (dy / dist) * step;
  }

  choose(now, zone) {
    if (this.state === 'working') return this.play(pick(WORK_ANIMS[this.activity] ?? WORK_ANIMS.type), 4);
    if (this.state === 'waiting') return this.play(pick(WAIT_ANIMS), 3);
    if (now - this.idleSince > SLEEP_AFTER) return this.play('sleep', Infinity);

    const next = weighted(IDLE_ANIMS);
    if (next !== 'walk') return this.play(next, next === 'breathe' ? 1 : 2);
    this.walkTo({
      x: zone.x0 + Math.random() * Math.max(0, zone.x1 - this.width - zone.x0),
      y: zone.y0 + Math.random() * Math.max(0, zone.y1 - zone.y0),
    });
  }

  // A random point a few steps away, kept inside the zone.
  nearbySpot(zone) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 120 + Math.random() * 180;
    return {
      x: clamp(this.x + Math.cos(angle) * dist, zone.x0, zone.x1 - this.width),
      y: clamp(this.y + Math.sin(angle) * dist * 0.6, zone.y0, zone.y1),
    };
  }

  walkTo(target) {
    this.target = target;
    if (Math.abs(target.x - this.x) > 1) this.dir = target.x > this.x ? 1 : -1;
    this.play('walk', Infinity);
  }

  draw(ctx, now) {
    const anim = ANIMS[this.anim];
    const frame = anim.frames[frameIndex(anim, now - this.t0)];
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    if (frame.length) {
      ctx.fillStyle = 'rgb(61 57 41 / 0.08)';
      ctx.beginPath();
      ctx.ellipse(x + 15.5 * this.scale, y, 7.5 * this.scale, 1.6 * this.scale, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    drawFrame(ctx, frame, x, y - FEET * this.scale, this.scale, PALETTES[this.kind], this.dir < 0);
  }
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

// Scripted session for trying the scene without Claude Code.
function demoSnapshot(seconds) {
  const step = Math.floor(seconds / 8) % 6;
  const sub = (id, type, state, activity) => ({ id, type, state, activity });
  const steps = [
    { state: 'idle', activity: null, subs: [] },
    { state: 'working', activity: 'think', subs: [] },
    { state: 'working', activity: 'think', subs: [sub('a1', 'Explore', 'working', 'search')] },
    { state: 'waiting', activity: 'flag', subs: [sub('a1', 'Explore', 'working', 'web'), sub('a2', 'general-purpose', 'working', 'type')] },
    { state: 'working', activity: 'type', subs: [sub('a2', 'general-purpose', 'waiting', 'bubble')] },
    { state: 'idle', activity: null, subs: [] },
  ];
  const { state, activity, subs } = steps[step];
  return { sessions: [{ id: 'demo', name: 'démo', state, activity, subagents: subs }] };
}

// One scene: fed by the server snapshots, or by the scripted demo when `demo` is set.
export function createLive(root, { demo = false } = {}) {
  root.innerHTML = `
    <div class="stage"><canvas></canvas></div>
    <div class="live-bar"><span class="status" data-state="off">hors ligne</span></div>`;
  const stage = root.querySelector('.stage');
  const canvas = root.querySelector('canvas');
  const status = root.querySelector('.status');

  const critters = new Map();
  let snapshot = { sessions: [] };
  let connected = false;
  let ctx;
  let width = 0;
  let height = 0;
  let raf = 0;
  let last = performance.now();
  const demoStart = performance.now();

  function resize() {
    width = stage.clientWidth;
    height = stage.clientHeight;
    ctx = fitCanvas(canvas, width, height);
  }

  function renderStatus() {
    if (demo) {
      status.dataset.state = 'demo';
      status.textContent = 'démo · scénario en boucle de 48 s';
      return;
    }
    const n = snapshot.sessions.length;
    status.dataset.state = connected ? 'on' : 'off';
    status.textContent = connected ? `connecté · ${n} session${n > 1 ? 's' : ''}` : 'hors ligne';
  }

  function tick(now) {
    const dt = Math.min(now - last, 100);
    last = now;
    const current = demo ? demoSnapshot(Math.max(0, now - demoStart) / 1000) : snapshot;
    const agents = agentsOf(current);
    const zoneCount = Math.max(1, current.sessions.length);
    const zoneWidth = width / zoneCount;
    // Each session gets a column of the floor; the top keeps room for hats and flags.
    const zoneOf = (i) => ({
      x0: i * zoneWidth + 8,
      x1: (i + 1) * zoneWidth - 8,
      y0: Math.min(FEET * SCALE.main + 16, height - LABEL_SPACE),
      y1: height - LABEL_SPACE,
    });

    for (const agent of agents) {
      let critter = critters.get(agent.key);
      const zone = zoneOf(agent.zone);
      if (!critter) {
        const parent = agent.parent && critters.get(agent.parent);
        critter = parent
          ? new Critter(agent.kind, parent.x + parent.width * (1.2 + Math.random()) * (Math.random() < 0.5 ? -1 : 1), parent.y + (Math.random() - 0.5) * 240)
          : new Critter(agent.kind, (zone.x0 + zone.x1) / 2 - (FRAME_W * SCALE.main) / 2, (zone.y0 + zone.y1) / 2);
        critters.set(agent.key, critter);
      }
      critter.label = agent.label;
      critter.zone = zone;
      critter.update(now, dt, agent, zone);
    }

    const alive = new Set(agents.map((a) => a.key));
    for (const [key, critter] of critters) {
      if (alive.has(key)) continue;
      critter.leave();
      critter.update(now, dt, critter, critter.zone ?? zoneOf(0));
      if (critter.dead) critters.delete(key);
    }

    ctx.clearRect(0, 0, width, height);

    // Back to front, so whoever stands lower on screen is drawn over the others.
    const ordered = [...critters.values()].sort((a, b) => a.y - b.y);
    for (const critter of ordered) critter.draw(ctx, now);

    ctx.textAlign = 'center';
    for (const critter of ordered) {
      if (critter.leaving) continue;
      ctx.font = critter.kind === 'main' ? '600 13px ui-monospace, monospace' : '11px ui-monospace, monospace';
      ctx.fillStyle = critter.kind === 'main' ? '#3d3929' : '#8f8b82';
      ctx.fillText(critter.label ?? '', Math.round(critter.x + 15.5 * critter.scale), Math.round(critter.y) + (critter.kind === 'main' ? 20 : 16));
    }

    if (critters.size === 0) {
      ctx.fillStyle = '#8f8b82';
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText('Aucune session Claude Code active', width / 2, height / 2);
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
  };
}
