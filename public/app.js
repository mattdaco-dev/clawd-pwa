import { createGallery } from './gallery.js';
import { createLive } from './live.js';

const live = createLive(document.getElementById('live'));
const views = {
  live,
  demo: createLive(document.getElementById('demo'), { demo: true }),
  galerie: createGallery(document.getElementById('gallery')),
};

const menuButton = document.querySelector('.menu-button');
const menu = document.getElementById('menu-nav');

function setMenu(open) {
  menu.hidden = !open;
  menuButton.setAttribute('aria-expanded', String(open));
}

menuButton.addEventListener('click', () => setMenu(menu.hidden));
menu.addEventListener('click', () => setMenu(false));
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
