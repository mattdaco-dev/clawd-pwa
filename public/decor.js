// Decor registry and scene settings. A decor builds, for a window size, a list
// of sessions and the settings: a background canvas and its height (taller
// than the window when rooms overflow), the zones Clawds walk in with their
// stations, depth-sorted props and an overlay drawn every frame.
import { buildOffice } from './office.js';

export const LAYOUTS = { rooms: 'Salles', shared: 'Open space partagé' };
export const PIXEL_SIZES = [1, 2, 3, 4, 5, 6];
export const DEFAULT_SETTINGS = { decor: 'open-space', layout: 'rooms', px: 4, notify: 'off' };

// No furniture: an empty floor split in columns, no stations, Clawds wander anywhere.
function buildBare(width, height, names, { px }) {
  const background = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1;
  background.width = Math.round(width * dpr);
  background.height = Math.round(height * dpr);
  const g = background.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.fillStyle = '#f0eee6';
  g.fillRect(0, 0, width, height);

  const labelSpace = Math.max(20, Math.round(px * 5.6));
  const headRoom = 23 * px + 16; // keeps hats and flags inside the window
  const n = Math.max(1, names.length);
  const zoneWidth = width / n;
  const zones = Array.from({ length: n }, (_, i) => ({
    x0: i * zoneWidth + 8,
    x1: (i + 1) * zoneWidth - 8,
    y0: Math.min(headRoom, height - labelSpace),
    y1: height - labelSpace,
    stations: {},
  }));
  return { background, height, zones, shared: false, props: [], overlay() {} };
}

export const DECORS = {
  none: { label: 'Aucun', build: buildBare },
  'open-space': { label: 'Open space', build: buildOffice },
};
