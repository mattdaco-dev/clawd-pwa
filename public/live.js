import { ANIMS, FRAME_H, FRAME_W } from './sprites.js';
import { PALETTES, cycleDone, drawFrame, fitCanvas, frameIndex } from './render.js';

const SCALE = { main: 5, sub: 4 };
const HEIGHT = 320;
const GROUND = 260;
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

function weighted(list) {
  let r = Math.random() * list.reduce((sum, [, w]) => sum + w, 0);
  for (const [value, w] of list) if ((r -= w) < 0) return value;
  return list[0][0];
}

class Critter {
  constructor(kind, x) {
    this.kind = kind;
    this.scale = SCALE[kind];
    this.x = x;
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
    this.x = Math.min(Math.max(this.x, zone.x0), Math.max(zone.x0, zone.x1 - this.width));
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
      if (wasWorking && agent.state === 'idle') this.play('celebrate', 1, true);
      else this.choose(now, zone);
      return;
    }

    if (this.anim === 'walk') this.walk(now, dt, zone);
    else if (this.finished(now)) this.choose(now, zone);
  }

  walk(now, dt, zone) {
    this.x += (this.dir * WALK_SPEED * this.scale * dt) / 1000;
    if (this.dir > 0 ? this.x >= this.target : this.x <= this.target) {
      this.x = this.target;
      this.choose(now, zone);
    }
  }

  choose(now, zone) {
    if (this.state === 'working') return this.play(pick(WORK_ANIMS[this.activity] ?? WORK_ANIMS.type), 4);
    if (this.state === 'waiting') return this.play(pick(WAIT_ANIMS), 3);
    if (now - this.idleSince > SLEEP_AFTER) return this.play('sleep', Infinity);

    const next = weighted(IDLE_ANIMS);
    if (next !== 'walk') return this.play(next, next === 'breathe' ? 1 : 2);
    const hi = Math.max(zone.x0, zone.x1 - this.width);
    this.target = zone.x0 + Math.random() * (hi - zone.x0);
    this.dir = this.target >= this.x ? 1 : -1;
    this.play('walk', Infinity);
  }

  draw(ctx, now) {
    const anim = ANIMS[this.anim];
    const frame = anim.frames[frameIndex(anim, now - this.t0)];
    const top = GROUND - (FRAME_H - 1) * this.scale;
    drawFrame(ctx, frame, Math.round(this.x), top, this.scale, PALETTES[this.kind], this.dir < 0);
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

export function createLive(root) {
  root.innerHTML = `
    <div class="stage"><canvas></canvas></div>
    <div class="live-bar">
      <span class="status" data-state="off">hors ligne</span>
      <label class="demo"><input type="checkbox"> Démo</label>
    </div>`;
  const stage = root.querySelector('.stage');
  const canvas = root.querySelector('canvas');
  const status = root.querySelector('.status');
  const demoToggle = root.querySelector('.demo input');

  const critters = new Map();
  let snapshot = { sessions: [] };
  let connected = false;
  let ctx;
  let width = 0;
  let raf = 0;
  let last = performance.now();
  const demoStart = performance.now();

  function resize() {
    width = stage.clientWidth;
    ctx = fitCanvas(canvas, width, HEIGHT);
  }

  function renderStatus() {
    if (demoToggle.checked) {
      status.dataset.state = 'demo';
      status.textContent = 'démo';
      return;
    }
    const n = snapshot.sessions.length;
    status.dataset.state = connected ? 'on' : 'off';
    status.textContent = connected ? `connecté · ${n} session${n > 1 ? 's' : ''}` : 'hors ligne';
  }

  function tick(now) {
    const dt = Math.min(now - last, 100);
    last = now;
    const current = demoToggle.checked ? demoSnapshot((now - demoStart) / 1000) : snapshot;
    const agents = agentsOf(current);
    const zoneCount = Math.max(1, current.sessions.length);
    const zoneWidth = width / zoneCount;
    const zoneOf = (i) => ({ x0: i * zoneWidth + 8, x1: (i + 1) * zoneWidth - 8 });

    for (const agent of agents) {
      let critter = critters.get(agent.key);
      const zone = zoneOf(agent.zone);
      if (!critter) {
        const parent = agent.parent && critters.get(agent.parent);
        const x = parent ? parent.x + parent.width * (0.6 + Math.random()) : (zone.x0 + zone.x1) / 2 - (FRAME_W * SCALE.main) / 2;
        critter = new Critter(agent.kind, x);
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

    ctx.clearRect(0, 0, width, HEIGHT);
    ctx.fillStyle = '#d8d4c8';
    ctx.fillRect(0, GROUND, width, 2);

    // Subagents first so the main Clawd stays in front.
    const ordered = [...critters.values()].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'sub' ? -1 : 1));
    for (const critter of ordered) critter.draw(ctx, now);

    ctx.textAlign = 'center';
    for (const critter of ordered) {
      if (critter.leaving) continue;
      ctx.font = critter.kind === 'main' ? '600 13px ui-monospace, monospace' : '11px ui-monospace, monospace';
      ctx.fillStyle = critter.kind === 'main' ? '#3d3929' : '#8f8b82';
      ctx.fillText(critter.label ?? '', Math.round(critter.x + critter.width / 2), GROUND + (critter.kind === 'main' ? 22 : 38));
    }

    if (critters.size === 0) {
      ctx.fillStyle = '#8f8b82';
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText('Aucune session Claude Code active', width / 2, GROUND / 2);
    }

    raf = requestAnimationFrame(tick);
  }

  demoToggle.addEventListener('change', renderStatus);
  window.addEventListener('resize', resize);

  return {
    show() {
      root.hidden = false;
      resize();
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
