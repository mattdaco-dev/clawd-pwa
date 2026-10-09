// Weather outside the windows: the current conditions from Open-Meteo (no API
// key), refreshed every half hour. `?weather=rain` (or clear, cloudy,
// fog, snow, storm) forces one, to try them out.
export const LAT = 49.61; // Luxembourg, also used for the sunrise and sunset
export const LON = 6.13;
const REFRESH = 30 * 60_000;

const KINDS = ['clear', 'cloudy', 'fog', 'rain', 'snow', 'storm'];

let kind = 'clear';

// WMO weather codes, folded into what a window can show.
function kindOf(code) {
  if (code >= 95) return 'storm';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 2) return 'cloudy';
  return 'clear';
}

async function refresh() {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=weather_code`;
    const res = await fetch(url);
    if (res.ok) kind = kindOf((await res.json()).current.weather_code);
  } catch {
    // Offline: keep the last known weather.
  }
}

const forced = new URLSearchParams(location.search).get('weather');
if (KINDS.includes(forced)) kind = forced;
else {
  refresh();
  setInterval(refresh, REFRESH);
}

export const currentWeather = () => kind;
