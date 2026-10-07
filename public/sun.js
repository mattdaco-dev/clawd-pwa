// Sunrise and sunset for the office's location, in local hours (6.5 is 6:30),
// with the NOAA approximation: a few minutes off at most, plenty for lighting.
import { LAT, LON } from './weather.js';

const rad = (d) => (d * Math.PI) / 180;

export function sunTimes(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const day = Math.floor((date - start) / 86_400_000);
  const g = ((2 * Math.PI) / 365) * (day - 1);
  const eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) +
    0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const cosHa = Math.cos(rad(90.833)) / (Math.cos(rad(LAT)) * Math.cos(decl)) - Math.tan(rad(LAT)) * Math.tan(decl);
  // Midnight sun or polar night: no crossing, keep a day of sorts.
  const ha = (Math.acos(Math.min(1, Math.max(-1, cosHa))) * 180) / Math.PI;
  const offset = -date.getTimezoneOffset(); // minutes ahead of UTC
  const local = (utcMinutes) => (((utcMinutes + offset) / 60) % 24 + 24) % 24;
  return {
    sunrise: local(720 - 4 * (LON + ha) - eqTime),
    sunset: local(720 - 4 * (LON - ha) - eqTime),
  };
}
