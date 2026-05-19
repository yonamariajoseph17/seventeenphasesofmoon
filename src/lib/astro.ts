// Moon phase + zodiac calculations for a given date.
// Coimbatore: 11.0168°N, 76.9558°E

const SYNODIC = 29.530588853;
const REF_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14); // Jan 6 2000 18:14 UTC

export interface MoonInfo {
  age: number;            // days since new moon (0..29.53)
  phaseFraction: number;  // 0..1 around the cycle
  illumination: number;   // 0..1
  waxing: boolean;
  name: string;
  emoji: string;
}

export function moonPhase(date: Date): MoonInfo {
  const days = (date.getTime() - REF_NEW_MOON) / 86_400_000;
  const age = ((days % SYNODIC) + SYNODIC) % SYNODIC;
  const phaseFraction = age / SYNODIC;
  const illumination = (1 - Math.cos(phaseFraction * 2 * Math.PI)) / 2;
  const waxing = phaseFraction < 0.5;

  let name = "New Moon";
  let emoji = "🌑";
  if (age < 1.84566) { name = "New Moon"; emoji = "🌑"; }
  else if (age < 5.53699) { name = "Waxing Crescent"; emoji = "🌒"; }
  else if (age < 9.22831) { name = "First Quarter"; emoji = "🌓"; }
  else if (age < 12.91963) { name = "Waxing Gibbous"; emoji = "🌔"; }
  else if (age < 16.61096) { name = "Full Moon"; emoji = "🌕"; }
  else if (age < 20.30228) { name = "Waning Gibbous"; emoji = "🌖"; }
  else if (age < 23.99361) { name = "Last Quarter"; emoji = "🌗"; }
  else if (age < 27.68493) { name = "Waning Crescent"; emoji = "🌘"; }
  else { name = "New Moon"; emoji = "🌑"; }

  return { age, phaseFraction, illumination, waxing, name, emoji };
}

export interface ZodiacInfo {
  sign: string;
  symbol: string;
  element: string;
  ruling: string;
}

export function zodiacFor(month: number, day: number): ZodiacInfo {
  // month 1..12
  const z = (s: string, sy: string, e: string, r: string): ZodiacInfo => ({ sign: s, symbol: sy, element: e, ruling: r });
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return z("Aries", "♈", "Fire", "Mars");
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return z("Taurus", "♉", "Earth", "Venus");
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return z("Gemini", "♊", "Air", "Mercury");
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return z("Cancer", "♋", "Water", "Moon");
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return z("Leo", "♌", "Fire", "Sun");
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return z("Virgo", "♍", "Earth", "Mercury");
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return z("Libra", "♎", "Air", "Venus");
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return z("Scorpio", "♏", "Water", "Pluto");
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return z("Sagittarius", "♐", "Fire", "Jupiter");
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return z("Capricorn", "♑", "Earth", "Saturn");
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return z("Aquarius", "♒", "Air", "Uranus");
  return z("Pisces", "♓", "Water", "Neptune");
}

// Approximate ecliptic longitude of the Sun for the date (degrees).
// Used to derive which constellations were overhead at midnight.
export function sunLongitude(date: Date): number {
  const jd = date.getTime() / 86_400_000 + 2440587.5;
  const n = jd - 2451545.0;
  const L = (280.46 + 0.9856474 * n) % 360;
  const g = ((357.528 + 0.9856003 * n) % 360) * (Math.PI / 180);
  const lambda = L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g);
  return ((lambda % 360) + 360) % 360;
}

// Visible zodiac constellations at local midnight = opposite the sun (±60°).
const ZODIAC_BANDS: Array<{ name: string; start: number }> = [
  { name: "Pisces", start: 0 },
  { name: "Aries", start: 30 },
  { name: "Taurus", start: 60 },
  { name: "Gemini", start: 90 },
  { name: "Cancer", start: 120 },
  { name: "Leo", start: 150 },
  { name: "Virgo", start: 180 },
  { name: "Libra", start: 210 },
  { name: "Scorpio", start: 240 },
  { name: "Sagittarius", start: 270 },
  { name: "Capricorn", start: 300 },
  { name: "Aquarius", start: 330 },
];

export function visibleConstellations(date: Date): string[] {
  const anti = (sunLongitude(date) + 180) % 360;
  const result: string[] = [];
  for (let off = -60; off <= 60; off += 30) {
    const lon = (anti + off + 360) % 360;
    const idx = Math.floor(lon / 30);
    const band = ZODIAC_BANDS[idx];
    if (band && !result.includes(band.name)) result.push(band.name);
  }
  return result;
}

// Deterministic pseudo-random star field for a given seed (yyyymmdd).
export function starField(seed: number, count = 60) {
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  return Array.from({ length: count }, () => ({
    x: rand() * 100,
    y: rand() * 100,
    r: 0.3 + rand() * 1.4,
    o: 0.3 + rand() * 0.7,
    delay: rand() * 4,
  }));
}

// Approximate sunrise/sunset (UTC) for a civil date at lat/lon (degrees, east positive).
// NOAA simplified solar calculator — accurate to ~1 minute for non-polar latitudes.
export function sunTimes(year: number, month: number, day: number, lat: number, lon: number): { sunrise: Date; sunset: Date } | null {
  const start = Date.UTC(year, 0, 0);
  const N = Math.floor((Date.UTC(year, month - 1, day) - start) / 86_400_000);
  const gamma = (2 * Math.PI / 365) * (N - 1);
  const eqtime = 229.18 * (
    0.000075
    + 0.001868 * Math.cos(gamma)
    - 0.032077 * Math.sin(gamma)
    - 0.014615 * Math.cos(2 * gamma)
    - 0.040849 * Math.sin(2 * gamma)
  );
  const decl =
    0.006918
    - 0.399912 * Math.cos(gamma)
    + 0.070257 * Math.sin(gamma)
    - 0.006758 * Math.cos(2 * gamma)
    + 0.000907 * Math.sin(2 * gamma)
    - 0.002697 * Math.cos(3 * gamma)
    + 0.00148 * Math.sin(3 * gamma);
  const latRad = (lat * Math.PI) / 180;
  const zenith = (90.833 * Math.PI) / 180;
  const cosH = (Math.cos(zenith) - Math.sin(latRad) * Math.sin(decl)) / (Math.cos(latRad) * Math.cos(decl));
  if (cosH > 1 || cosH < -1) return null; // sun doesn't rise/set that day
  const ha = (Math.acos(cosH) * 180) / Math.PI;

  const sunriseMin = 720 + 4 * lon - 4 * ha - eqtime;
  const sunsetMin = 720 + 4 * lon + 4 * ha - eqtime;
  const dayStartUTC = Date.UTC(year, month - 1, day);
  return {
    sunrise: new Date(dayStartUTC + sunriseMin * 60_000),
    sunset: new Date(dayStartUTC + sunsetMin * 60_000),
  };
}

