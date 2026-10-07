import { DECORS, LAYOUTS, PIXEL_SIZES } from './decor.js';
import { sunTimes } from './sun.js';

// The demo view: made-up sessions instead of the server's, and a bar to try
// every mode of the scene. Sessions follow a looping script unless one is
// pinned to a state from the bar.

const NAMES = ['démo', 'api', 'web', 'docs', 'infra', 'mobile', 'data', 'design', 'ops', 'auth', 'billing', 'search'];
const SUB_TYPES = ['Explore', 'general-purpose', 'Plan', 'code-reviewer', 'test-engineer', 'security-auditor'];
const MAX_SESSIONS = 12;
const MAX_SUBS = 4;
const STEP = 8; // seconds per step of the script

const ACTIVITIES = { type: 'Clavier', search: 'Recherche', web: 'Web', think: 'Réflexion', compact: 'Compaction' };
const MAIN_STATES = { auto: 'Scénario', working: 'Travaille', waiting: 'Attend', idle: 'Repos' };
const SUB_STATES = { auto: 'Scénario', working: 'Travaille', waiting: 'Attend' };

const scripted = (id, type, state, activity) => ({ id, type, state, activity });
const MAIN_SCRIPT = [
  { state: 'idle', activity: null, subs: [] },
  { state: 'working', activity: 'think', subs: [] },
  { state: 'working', activity: 'think', subs: [scripted('a1', 'Explore', 'working', 'search')] },
  { state: 'waiting', activity: 'flag', subs: [scripted('a1', 'Explore', 'working', 'web'), scripted('a2', 'general-purpose', 'working', 'type')] },
  { state: 'working', activity: 'type', subs: [scripted('a2', 'general-purpose', 'waiting', 'bubble')] },
  { state: 'idle', activity: null, subs: [] },
];
const SUB_SCRIPT = [
  { state: 'working', activity: 'search' },
  { state: 'working', activity: 'web' },
  { state: 'working', activity: 'type' },
  { state: 'waiting', activity: 'bubble' },
  { state: 'working', activity: 'think' },
];

export function createDemoModel() {
  let nextId = 0;
  const sessions = [];
  const model = {
    sessions,
    addSession() {
      if (sessions.length >= MAX_SESSIONS) return;
      const used = new Set(sessions.map((s) => s.name));
      const name = NAMES.find((n) => !used.has(n)) ?? `salle-${nextId}`;
      sessions.push({ id: `d${nextId++}`, name, mode: 'auto', activity: 'type', offset: (sessions.length * 3) % MAIN_SCRIPT.length, subs: [], errorAt: null });
    },
    removeSession(session) {
      sessions.splice(sessions.indexOf(session), 1);
    },
    addSub(session) {
      if (session.subs.length >= MAX_SUBS) return;
      const free = SUB_TYPES.filter((t) => !session.subs.some((sub) => sub.type === t));
      const type = free[Math.floor(Math.random() * free.length)];
      session.subs.push({ id: `s${nextId++}`, type, mode: 'auto', activity: 'search', offset: Math.floor(Math.random() * SUB_SCRIPT.length), errorAt: null });
    },
    removeSub(session, sub) {
      session.subs.splice(session.subs.indexOf(sub), 1);
    },
    // Back to the three scripted sessions. Ids keep counting, so the new
    // Clawds walk in rather than taking over the old ones.
    reset() {
      sessions.length = 0;
      for (let i = 0; i < 3; i++) model.addSession();
    },
    // A random cast: sessions pinned or scripted, with subagents here and there.
    randomize() {
      sessions.length = 0;
      const pickOne = (list) => list[Math.floor(Math.random() * list.length)];
      for (let n = 2 + Math.floor(Math.random() * 6); n > 0; n--) {
        model.addSession();
        const s = sessions[sessions.length - 1];
        s.mode = pickOne(Object.keys(MAIN_STATES));
        s.activity = pickOne(Object.keys(ACTIVITIES));
        for (let k = Math.floor(Math.random() * 3); k > 0; k--) {
          model.addSub(s);
          const sub = s.subs[s.subs.length - 1];
          sub.mode = pickOne(Object.keys(SUB_STATES));
          sub.activity = pickOne(Object.keys(ACTIVITIES));
        }
      }
    },
    // The same shape as a server snapshot.
    snapshot(seconds) {
      const step = Math.floor(seconds / STEP);
      return {
        sessions: sessions.map((s) => {
          const script = MAIN_SCRIPT[(step + s.offset) % MAIN_SCRIPT.length];
          const main = s.mode === 'auto' ? script
            : s.mode === 'working' ? { state: 'working', activity: s.activity }
            : s.mode === 'waiting' ? { state: 'waiting', activity: 'flag' }
            : { state: 'idle', activity: null };
          const subs = (s.mode === 'auto' ? script.subs : []).map((sub) => ({ ...sub, id: `${s.id}-${sub.id}` }));
          for (const sub of s.subs) {
            const auto = SUB_SCRIPT[(step + sub.offset) % SUB_SCRIPT.length];
            const now = sub.mode === 'auto' ? auto
              : sub.mode === 'working' ? { state: 'working', activity: sub.activity }
              : { state: 'waiting', activity: 'bubble' };
            subs.push({ id: sub.id, type: sub.type, ...now, errorAt: sub.errorAt });
          }
          return { id: s.id, name: s.name, state: main.state, activity: main.activity, errorAt: s.errorAt, subagents: subs };
        }),
      };
    },
    describe() {
      const n = sessions.length;
      const subs = sessions.reduce((sum, s) => sum + s.subs.length, 0);
      return `démo · ${n} session${n > 1 ? 's' : ''}${subs ? ` · ${subs} sous-agent${subs > 1 ? 's' : ''} ajouté${subs > 1 ? 's' : ''}` : ''}`;
    },
  };
  model.reset();
  return model;
}

const HOURS = [['auto', 'Maintenant'], ['sunrise', 'Lever'], ['noon', 'Jour'], ['sunset', 'Coucher'], ['night', 'Nuit']];
// Today's hour for each moment, from the real sunrise and sunset.
function hourOf(moment) {
  const { sunrise, sunset } = sunTimes(new Date());
  if (moment === 'sunrise') return sunrise;
  if (moment === 'sunset') return sunset;
  if (moment === 'noon') return (sunrise + sunset) / 2;
  return (sunset + 3) % 24; // well into the night
}
const clock = (h) => `${Math.floor(h)}h${String(Math.round((h % 1) * 60) % 60).padStart(2, '0')}`;
const WEATHERS = { auto: 'Réelle', clear: 'Soleil', cloudy: 'Nuages', fog: 'Brouillard', rain: 'Pluie', snow: 'Neige', storm: 'Orage' };
const SEASONS = {
  auto: 'Du moment', none: 'Aucune',
  'nouvel-an': 'Nouvel An', fuesend: 'Fuesend', buergbrennen: 'Buergbrennen', paques: 'Pâques',
  'fete-lu': 'Fête nationale (LU)', 'fete-fr': '14 juillet (FR)', 'fete-be': 'Fête nationale (BE)',
  fouer: 'Schueberfouer', 'fete-de': 'Tag der Deutschen Einheit (DE)', halloween: 'Halloween',
  kleeschen: 'Kleeschen', noel: 'Noël',
};

const options = (map, current) => Object.entries(map)
  .map(([value, label]) => `<option value="${value}"${String(current) === value ? ' selected' : ''}>${label}</option>`)
  .join('');

// The bar under the demo scene. `scene` is the demo's createLive().
export function createDemoBar(root, model, scene, settings) {
  let base = { ...settings }; // the menu's settings, what a reset goes back to
  let current = { ...base };
  const START_VIEW = { hour: 'auto', weather: 'auto', season: 'auto' };
  let view = { ...START_VIEW };
  const pickOne = (list) => list[Math.floor(Math.random() * list.length)];
  const newSalt = () => Math.random().toString(36).slice(2, 8);
  const bar = document.createElement('div');
  bar.className = 'demo-bar';
  root.querySelector('.live-bar').before(bar);

  function applyView() {
    scene.setView({
      hour: view.hour === 'auto' ? null : hourOf(view.hour),
      weather: view.weather,
      season: view.season === 'auto' ? 'auto' : view.season === 'none' ? null : view.season,
    });
  }

  function renderScene() {
    const seg = (name, map, value, disabled = false) => `
      <fieldset class="demo-seg"${disabled ? ' disabled' : ''}>${(Array.isArray(map) ? map : Object.entries(map)).map(([v, label]) => `
        <label><input type="radio" name="demo-${name}" value="${v}"${String(value) === v ? ' checked' : ''}><span>${label}</span></label>`).join('')}
      </fieldset>`;
    return `
      <div class="demo-row">
        <span class="demo-label">Décor</span>${seg('decor', Object.fromEntries(Object.entries(DECORS).map(([k, d]) => [k, d.label])), current.decor)}
        <span class="demo-label">Disposition</span>${seg('layout', LAYOUTS, current.layout, current.decor === 'none')}
        <span class="demo-label">Pixels</span>${seg('px', Object.fromEntries(PIXEL_SIZES.map((n) => [n, n])), current.px)}
        <button type="button" data-act="randomize" title="Décor, disposition, heure, météo, saison et sessions au hasard ; la taille des pixels ne change pas">Tout au hasard</button>
        <button type="button" data-act="reset" title="Réglages du menu et les trois sessions du scénario">Réinitialiser</button>
        <button type="button" data-act="reseed"${current.decor === 'none' ? ' disabled' : ''}>Régénérer le décor</button>
      </div>
      <div class="demo-row">
        <span class="demo-label">Heure</span>${seg('hour', HOURS.map(([v, label]) => [v, v === 'auto' ? label : `${label} ${clock(hourOf(v))}`]), view.hour)}
        <label class="demo-label">Météo <select data-view="weather">${options(WEATHERS, view.weather)}</select></label>
        <label class="demo-label">Saison <select data-view="season">${options(SEASONS, view.season)}</select></label>
      </div>`;
  }

  function renderAgents() {
    const activity = (value, attr) => `<select ${attr}>${options(ACTIVITIES, value)}</select>`;
    return `
      <div class="demo-row demo-agents">${model.sessions.map((s, i) => `
        <div class="demo-agent" data-session="${i}">
          <strong>${s.name}</strong>
          <select data-field="mode">${options(MAIN_STATES, s.mode)}</select>
          ${s.mode === 'working' ? activity(s.activity, 'data-field="activity"') : ''}
          <button type="button" data-act="error" title="Un outil échoue">Erreur</button>
          <button type="button" data-act="add-sub"${s.subs.length >= MAX_SUBS ? ' disabled' : ''}>+ sous-agent</button>
          <button type="button" data-act="remove" title="Fermer la session" aria-label="Fermer ${s.name}">×</button>
          ${s.subs.map((sub, k) => `
            <span class="demo-sub" data-sub="${k}">
              ${sub.type}
              <select data-field="mode">${options(SUB_STATES, sub.mode)}</select>
              ${sub.mode === 'working' ? activity(sub.activity, 'data-field="activity"') : ''}
              <button type="button" data-act="error" title="Un outil échoue">!</button>
              <button type="button" data-act="remove" title="Terminer le sous-agent" aria-label="Terminer ${sub.type}">×</button>
            </span>`).join('')}
        </div>`).join('')}
        <button type="button" data-act="add-session"${model.sessions.length >= MAX_SESSIONS ? ' disabled' : ''}>+ Clawd</button>
      </div>`;
  }

  function render() {
    bar.innerHTML = renderScene() + renderAgents();
    scene.refreshStatus();
  }

  // Whom a control belongs to: a session, or one of its subagents.
  function target(el) {
    const session = model.sessions[Number(el.closest('[data-session]')?.dataset.session)];
    const subEl = el.closest('[data-sub]');
    return { session, sub: subEl ? session.subs[Number(subEl.dataset.sub)] : null };
  }

  bar.addEventListener('change', (e) => {
    const el = e.target;
    if (el.name?.startsWith('demo-')) {
      const key = el.name.slice(5);
      if (key === 'hour') {
        view.hour = el.value;
        applyView();
      } else {
        current = { ...current, [key]: key === 'px' ? Number(el.value) : el.value };
        scene.setSettings(current);
      }
    } else if (el.dataset.view) {
      view[el.dataset.view] = el.value;
      applyView();
    } else if (el.dataset.field) {
      const { session, sub } = target(el);
      (sub ?? session)[el.dataset.field] = el.value;
    }
    render();
  });

  bar.addEventListener('click', (e) => {
    const el = e.target.closest('button[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    if (act === 'reseed') scene.setView({ salt: newSalt() });
    else if (act === 'reset') {
      current = { ...base };
      view = { ...START_VIEW };
      scene.setSettings(current);
      scene.setView({ salt: '' });
      applyView();
      model.reset();
    } else if (act === 'randomize') {
      // Mostly with furniture: the bare decor shows little of the rest. The
      // pixel size stays as it is.
      current = {
        ...current,
        decor: Math.random() < 0.85 ? 'open-space' : 'none',
        layout: pickOne(Object.keys(LAYOUTS)),
      };
      view = {
        hour: pickOne(HOURS)[0],
        weather: pickOne(Object.keys(WEATHERS)),
        season: pickOne(Object.keys(SEASONS)),
      };
      scene.setSettings(current);
      scene.setView({ salt: newSalt() });
      applyView();
      model.randomize();
    }
    else if (act === 'add-session') model.addSession();
    else {
      const { session, sub } = target(el);
      if (act === 'error') (sub ?? session).errorAt = Date.now();
      else if (act === 'add-sub') model.addSub(session);
      else if (act === 'remove' && sub) model.removeSub(session, sub);
      else if (act === 'remove') model.removeSession(session);
    }
    render();
  });

  render();
  return {
    // The menu's settings reach the demo too.
    setSettings(next) {
      base = { ...next };
      current = { ...next };
      scene.setSettings(current);
      render();
    },
  };
}
