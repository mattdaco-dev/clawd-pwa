// Weather outside the windows: the current conditions from Open-Meteo (no API
// key), refreshed every half hour. `?meteo=pluie` (or soleil, nuages,
// brouillard, neige, orage) forces one, to try them out.
const LAT = 49.61; // Luxembourg
const LON = 6.13;
const REFRESH = 30 * 60_000;

const FORCED = {
  soleil: 'clear', nuages: 'cloudy', brouillard: 'fog', pluie: 'rain', neige: 'snow', orage: 'storm',
};

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

const forced = FORCED[new URLSearchParams(location.search).get('meteo')];
if (forced) kind = forced;
else {
  refresh();
  setInterval(refresh, REFRESH);
}

export const currentWeather = () => kind;
