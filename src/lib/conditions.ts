// Automatic fishing conditions (weather + moon) attached to a post at publish time.
export interface PostConditions {
  temp_c: number | null;
  pressure_hpa: number | null;
  wind_kmh: number | null;
  cloud_pct: number | null;
  weather_code: number | null;
  moon_phase: number; // 0..1 (0 = new, 0.5 = full)
  hour: number;
}

/** Moon phase fraction 0..1 for a date (0 new, 0.5 full). */
export function moonPhase(date: Date): number {
  const knownNew = Date.UTC(2000, 0, 6, 18, 14);
  const synodic = 29.530588853;
  const days = (date.getTime() - knownNew) / 86400000;
  const p = ((days % synodic) + synodic) % synodic;
  return p / synodic;
}

export type MoonKey = 'new' | 'waxing' | 'full' | 'waning';
export function moonKey(phase: number): MoonKey {
  if (phase < 0.0625 || phase >= 0.9375) return 'new';
  if (phase < 0.4375) return 'waxing';
  if (phase < 0.5625) return 'full';
  return 'waning';
}

export type DayPart = 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night';
export function dayPart(hour: number): DayPart {
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export type SkyKey = 'clear' | 'cloudy' | 'rain' | 'snow' | 'storm';
export function skyKey(code: number | null): SkyKey | null {
  if (code == null) return null;
  if (code <= 2) return 'clear';
  if (code <= 48) return 'cloudy';
  if (code >= 95) return 'storm';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  return 'rain';
}

export function pressureKey(hpa: number | null): 'low' | 'normal' | 'high' | null {
  if (hpa == null) return null;
  if (hpa < 1005) return 'low';
  if (hpa > 1020) return 'high';
  return 'normal';
}

/** Fetch current weather (free Open-Meteo, no key). Never throws. */
export async function fetchConditions(lat: number | null, lng: number | null, when = new Date()): Promise<PostConditions> {
  const base: PostConditions = {
    temp_c: null, pressure_hpa: null, wind_kmh: null, cloud_pct: null, weather_code: null,
    moon_phase: Math.round(moonPhase(when) * 1000) / 1000,
    hour: when.getHours(),
  };
  if (lat == null || lng == null) return base;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,surface_pressure,wind_speed_10m,cloud_cover,weather_code`,
      { signal: ctrl.signal },
    );
    clearTimeout(timer);
    if (!res.ok) return base;
    const c = (await res.json())?.current ?? {};
    return {
      ...base,
      temp_c: c.temperature_2m ?? null,
      pressure_hpa: c.surface_pressure ?? null,
      wind_kmh: c.wind_speed_10m ?? null,
      cloud_pct: c.cloud_cover ?? null,
      weather_code: c.weather_code ?? null,
    };
  } catch {
    return base;
  }
}

/** Most frequent value in a list (ties: first seen). */
export function topOf<T>(items: (T | null | undefined)[]): { value: T; count: number } | null {
  const m = new Map<T, number>();
  for (const i of items) if (i != null) m.set(i, (m.get(i) ?? 0) + 1);
  let best: { value: T; count: number } | null = null;
  for (const [value, count] of m) if (!best || count > best.count) best = { value, count };
  return best;
}
