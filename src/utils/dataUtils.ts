import { AgencyData, RegionName, WeatherData } from '../types/console';
import { EXACT_COORDINATES } from '../data/consoleData';

export const formatNumber = (n: number | string): string => {
  return Number(n || 0).toLocaleString('es-EC');
};

export const formatPercentage = (num: number, den: number): string => {
  if (!den) return '0%';
  const val = Math.round((1000 * num) / den) / 10;
  return `${val.toString().replace('.', ',')}%`;
};

// Open-Meteo weather code interpreter
export const interpretWeatherCode = (code: number, isDay: boolean = true): { icon: string; desc: string } => {
  if (code === 0) return isDay ? { icon: '☀️', desc: 'Despejado' } : { icon: '🌙', desc: 'Despejado' };
  if (code === 1) return { icon: '🌤️', desc: 'Mayormente despejado' };
  if (code === 2) return { icon: '⛅', desc: 'Parcialmente nublado' };
  if (code === 3) return { icon: '☁️', desc: 'Nublado' };
  if (code === 45 || code === 48) return { icon: '🌫️', desc: 'Niebla' };
  if (code >= 51 && code <= 57) return { icon: '🌦️', desc: 'Llovizna' };
  if (code >= 61 && code <= 67) return { icon: '🌧️', desc: 'Lluvia' };
  if (code >= 71 && code <= 77) return { icon: '❄️', desc: 'Nieve' };
  if (code >= 80 && code <= 82) return { icon: '🌦️', desc: 'Chubascos' };
  if (code >= 95) return { icon: '⛈️', desc: 'Tormenta eléctrica' };
  return { icon: '☁️', desc: 'Nublado' };
};

export async function fetchLiveWeatherData(): Promise<Record<string, WeatherData>> {
  const agencyNames = Object.keys(EXACT_COORDINATES);
  const lats = agencyNames.map(k => EXACT_COORDINATES[k].la).join(',');
  const lons = agencyNames.map(k => EXACT_COORDINATES[k].lo).join(',');

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=America%2FGuayaquil&forecast_days=1`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(url, { cache: 'no-store', signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error('Network error fetching weather');

    const json = await res.json();
    const dataList = Array.isArray(json) ? json : [json];
    const results: Record<string, WeatherData> = {};

    dataList.forEach((item, idx) => {
      const name = agencyNames[idx];
      const cur = item.current;
      const daily = item.daily;
      const { icon, desc } = interpretWeatherCode(cur.weather_code, cur.is_day === 1);

      results[name] = {
        temp: Math.round(cur.temperature_2m),
        icon,
        desc,
        tempMax: Math.round(daily.temperature_2m_max?.[0] ?? cur.temperature_2m),
        tempMin: Math.round(daily.temperature_2m_min?.[0] ?? cur.temperature_2m),
        rainProb: Math.round(daily.precipitation_probability_max?.[0] ?? 0)
      };
    });

    return results;
  } catch (err) {
    console.warn('Weather service unavailable or offline:', err);
    // Return graceful estimated regional fallback
    const fallback: Record<string, WeatherData> = {};
    agencyNames.forEach(name => {
      const isCoast = EXACT_COORDINATES[name].lo < -79.5;
      fallback[name] = {
        temp: isCoast ? 28 : 19,
        icon: isCoast ? '⛅' : '🌤️',
        desc: isCoast ? 'Cálido variable' : 'Templado andino',
        tempMax: isCoast ? 30 : 21,
        tempMin: isCoast ? 23 : 13,
        rainProb: 20
      };
    });
    return fallback;
  }
}

export function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
  }
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const success = document.execCommand('copy');
    el.remove();
    return Promise.resolve(success);
  } catch {
    return Promise.resolve(false);
  }
}
