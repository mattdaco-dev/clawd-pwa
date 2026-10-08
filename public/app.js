import { DECORS, DEFAULT_SETTINGS, LAYOUTS, OUTSIDES, PIXEL_SIZES } from './decor.js';
import { createDemoBar, createDemoModel } from './demo.js';
import { createGallery } from './gallery.js';
import { createLive } from './live.js';

// Scene settings are a per-viewer convenience; storage may be unavailable.
const SETTINGS_KEY = 'clawd.settings';
let settings = { ...DEFAULT_SETTINGS };
try {
  settings = { ...settings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') };
} catch {}
if (!(settings.decor in DECORS)) settings.decor = DEFAULT_SETTINGS.decor;
if (!(settings.layout in LAYOUTS)) settings.layout = DEFAULT_SETTINGS.layout;
if (!(settings.outside in OUTSIDES)) settings.outside = DEFAULT_SETTINGS.outside;
if (!['on', 'off'].includes(settings.desk)) settings.desk = DEFAULT_SETTINGS.desk;
if (!PIXEL_SIZES.includes(settings.px)) settings.px = DEFAULT_SETTINGS.px;
const canNotify = 'Notification' in window && 'serviceWorker' in navigator;
if (!canNotify || Notification.permission !== 'granted') settings.notify = 'off';
document.querySelector('[data-notify]').hidden = !canNotify;

const live = createLive(document.getElementById('live'), { settings });
const demoModel = createDemoModel();
const demo = createLive(document.getElementById('demo'), { demo: demoModel, settings });
const demoBar = createDemoBar(document.getElementById('demo'), demoModel, demo, settings);
const views = {
  live,
  demo,
  galerie: createGallery(document.getElementById('gallery')),
};

const menuButton = document.querySelector('.menu-button');
const menu = document.getElementById('menu-nav');

function setMenu(open) {
  menu.hidden = !open;
  menuButton.setAttribute('aria-expanded', String(open));
}

menuButton.addEventListener('click', () => setMenu(menu.hidden));
menu.addEventListener('click', (e) => {
  if (e.target.closest('a')) setMenu(false);
});

// Only the options that apply to the chosen decor are shown.
function renderSettings() {
  for (const input of menu.querySelectorAll('.setting input')) {
    input.checked = String(settings[input.name]) === input.value;
  }
  for (const set of menu.querySelectorAll('[data-needs-decor]')) set.hidden = settings.decor !== 'open-space';
  for (const set of menu.querySelectorAll('[data-needs-bare]')) set.hidden = settings.decor !== 'none';
}

for (const input of menu.querySelectorAll('.setting input')) {
  input.addEventListener('change', async () => {
    // The browser asks once; refused, the setting falls back to « Non ».
    if (input.name === 'notify' && input.value === 'on' && Notification.permission !== 'granted') {
      if ((await Notification.requestPermission()) !== 'granted') return renderSettings();
    }
    settings = { ...settings, [input.name]: input.name === 'px' ? Number(input.value) : input.value };
    if (input.name === 'decor') connect();
    live.setSettings(settings);
    demoBar.setSettings(settings);
    renderSettings();
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {}
  });
}
renderSettings();
document.addEventListener('click', (e) => {
  if (!e.target.closest('.menu')) setMenu(false);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') setMenu(false);
});

function route() {
  const current = location.hash.slice(2) in views ? location.hash.slice(2) : 'live';
  for (const [name, view] of Object.entries(views)) {
    if (name === current) view.show();
    else view.hide();
  }
  for (const link of menu.querySelectorAll('a')) {
    link.toggleAttribute('aria-current', link.dataset.view === current);
  }
}

window.addEventListener('hashchange', route);
route();

// Watching in building site mode is what keeps the sites going: the server is told.
let events = null;
function connect() {
  events?.close();
  events = new EventSource(settings.decor === 'chantier' ? '/events?site=1' : '/events');
  events.onopen = () => live.setConnected(true);
  events.onerror = () => live.setConnected(false);
  events.onmessage = (e) => {
    const snapshot = JSON.parse(e.data);
    live.setSnapshot(snapshot);
    showWaiting(snapshot);
  };
}
connect();

const WAIT_REASONS = {
  AskUserQuestion: 'a une question',
  ExitPlanMode: 'a un plan à valider',
};
let waitingBefore = null; // keys of the agents waiting at the last snapshot

// Agents waiting for an input are the only ones that need you: count them in
// the tab title and on the installed app's icon, and notify the new ones when
// the PWA is not in front.
function showWaiting(snapshot) {
  const waiting = snapshot.sessions.flatMap((s) => [
    ...(s.state === 'waiting' ? [{ key: s.id, name: s.name || s.id.slice(0, 8), agent: s }] : []),
    ...s.subagents.filter((a) => a.state === 'waiting').map((a) => ({ key: `${s.id}/${a.id}`, name: `${a.type} (${s.name})`, agent: a })),
  ]);
  const n = waiting.length;
  const keys = new Set(waiting.map((w) => w.key));
  // Nothing on the first snapshot: those were already waiting before the page opened.
  if (waitingBefore) {
    for (const w of waiting) if (!waitingBefore.has(w.key)) notify(w);
    for (const key of waitingBefore) if (!keys.has(key)) unnotify(key);
  }
  waitingBefore = keys;
  document.title = n ? `(${n}) Clawd` : 'Clawd';
  try {
    if (n) navigator.setAppBadge?.(n)?.catch(() => {});
    else navigator.clearAppBadge?.()?.catch(() => {});
  } catch {}
}

async function notify({ key, name, agent }) {
  if (settings.notify !== 'on' || Notification.permission !== 'granted') return;
  if (document.visibilityState === 'visible' && document.hasFocus()) return;
  const reason = WAIT_REASONS[agent.tool] ?? (agent.tool ? `demande à utiliser ${agent.tool}` : 'attend ta réponse');
  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(`${name} ${reason}`, { tag: key, icon: '/icons/icon-192.png', body: 'Claude Code attend un input.' });
  } catch {}
}

// Answered elsewhere: the notification is no longer news.
async function unnotify(key) {
  try {
    const registration = await navigator.serviceWorker.ready;
    for (const n of await registration.getNotifications({ tag: key })) n.close();
  } catch {}
}

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');
