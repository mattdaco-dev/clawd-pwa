import { DECORS, DEFAULT_SETTINGS, LAYOUTS, PIXEL_SIZES } from './decor.js';
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
if (!PIXEL_SIZES.includes(settings.px)) settings.px = DEFAULT_SETTINGS.px;

const live = createLive(document.getElementById('live'), { settings });
const demo = createLive(document.getElementById('demo'), { demo: true, settings });
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

// The layout only means something with furniture: greyed out without a decor.
function renderSettings() {
  for (const input of menu.querySelectorAll('.setting input')) {
    input.checked = String(settings[input.name]) === input.value;
  }
  menu.querySelector('[data-needs-decor]').disabled = settings.decor === 'none';
}

for (const input of menu.querySelectorAll('.setting input')) {
  input.addEventListener('change', () => {
    settings = { ...settings, [input.name]: input.name === 'px' ? Number(input.value) : input.value };
    live.setSettings(settings);
    demo.setSettings(settings);
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

const events = new EventSource('/events');
events.onopen = () => live.setConnected(true);
events.onerror = () => live.setConnected(false);
events.onmessage = (e) => {
  const snapshot = JSON.parse(e.data);
  live.setSnapshot(snapshot);
  showWaiting(snapshot);
};

// Agents waiting for an input are the only ones that need you: count them in
// the tab title and on the installed app's icon.
function showWaiting(snapshot) {
  const n = snapshot.sessions
    .flatMap((s) => [s, ...s.subagents])
    .filter((a) => a.state === 'waiting').length;
  document.title = n ? `(${n}) Clawd` : 'Clawd';
  try {
    if (n) navigator.setAppBadge?.(n)?.catch(() => {});
    else navigator.clearAppBadge?.()?.catch(() => {});
  } catch {}
}

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');
