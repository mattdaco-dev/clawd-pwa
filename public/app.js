import { DECORS, DEFAULT_DECOR } from './decor.js';
import { createGallery } from './gallery.js';
import { createLive } from './live.js';

// The decor choice is a per-viewer convenience; storage may be unavailable.
const DECOR_KEY = 'clawd.decor';
let decor = DEFAULT_DECOR;
try {
  decor = localStorage.getItem(DECOR_KEY) ?? DEFAULT_DECOR;
} catch {}
if (!(decor in DECORS)) decor = DEFAULT_DECOR;

const live = createLive(document.getElementById('live'), { decor });
const demo = createLive(document.getElementById('demo'), { demo: true, decor });
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

for (const input of menu.querySelectorAll('input[name="decor"]')) {
  input.checked = input.value === decor;
  input.addEventListener('change', () => {
    decor = input.value;
    live.setDecor(decor);
    demo.setDecor(decor);
    try {
      localStorage.setItem(DECOR_KEY, decor);
    } catch {}
  });
}
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
events.onmessage = (e) => live.setSnapshot(JSON.parse(e.data));

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');
