import { createGallery } from './gallery.js';
import { createLive } from './live.js';

const live = createLive(document.getElementById('live'));
const views = {
  live,
  galerie: createGallery(document.getElementById('gallery')),
};

function route() {
  const current = location.hash === '#/galerie' ? 'galerie' : 'live';
  for (const [name, view] of Object.entries(views)) {
    if (name === current) view.show();
    else view.hide();
  }
  for (const link of document.querySelectorAll('nav a')) {
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
