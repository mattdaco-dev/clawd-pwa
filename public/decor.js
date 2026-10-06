// Decor registry. A decor builds, for a given window size and list of sessions:
// a background canvas, one zone per session (walkable area and stations),
// depth-sorted props and an overlay drawn every frame.
import { buildOffice } from './office.js';

const LABEL_SPACE = 28;
const HEAD_ROOM = 131; // keeps hats and flags inside the window

// No furniture: an empty floor, no stations, the Clawds wander anywhere.
function buildBare(width, height, names) {
  const background = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1;
  background.width = Math.round(width * dpr);
  background.height = Math.round(height * dpr);
  const g = background.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.fillStyle = '#f0eee6';
  g.fillRect(0, 0, width, height);

  const n = Math.max(1, names.length);
  const zoneWidth = width / n;
  const zones = Array.from({ length: n }, (_, i) => ({
    x0: i * zoneWidth + 8,
    x1: (i + 1) * zoneWidth - 8,
    y0: Math.min(HEAD_ROOM, height - LABEL_SPACE),
    y1: height - LABEL_SPACE,
    stations: {},
  }));
  return { background, zones, props: [], overlay() {} };
}

export const DECORS = {
  none: { label: 'Aucun', build: buildBare },
  'open-space': { label: 'Open space', build: buildOffice },
};

export const DEFAULT_DECOR = 'open-space';
