// Astronomy-grade lunar calculations using astronomy-engine (VSOP87/ELP2000-based,
// arc-second accuracy). No approximations or fictional facts.
import * as Astro from "astronomy-engine";

export interface AccurateMoonInfo {
  phaseAngle: number;       // 0..360 — ecliptic longitude of Moon minus Sun
  phaseFraction: number;    // 0..1 around the synodic cycle (0 = new, 0.5 = full)
  illumination: number;     // 0..1 — fraction of disk illuminated
  age: number;              // days since previous new moon
  name: string;             // canonical phase name
  emoji: string;
  waxing: boolean;
  constellation: string;    // IAU constellation containing the Moon
  constellationSymbol: string;
}

const PHASE_NAMES: Array<{ max: number; name: string; emoji: string }> = [
  { max: 22.5, name: "New Moon", emoji: "🌑" },
  { max: 67.5, name: "Waxing Crescent", emoji: "🌒" },
  { max: 112.5, name: "First Quarter", emoji: "🌓" },
  { max: 157.5, name: "Waxing Gibbous", emoji: "🌔" },
  { max: 202.5, name: "Full Moon", emoji: "🌕" },
  { max: 247.5, name: "Waning Gibbous", emoji: "🌖" },
  { max: 292.5, name: "Last Quarter", emoji: "🌗" },
  { max: 337.5, name: "Waning Crescent", emoji: "🌘" },
  { max: 360.1, name: "New Moon", emoji: "🌑" },
];

const CONSTELLATION_SYMBOLS: Record<string, string> = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋",
  Leo: "♌", Virgo: "♍", Libra: "♎", Scorpius: "♏",
  Sagittarius: "♐", Capricornus: "♑", Aquarius: "♒", Pisces: "♓",
  Ophiuchus: "⛎",
};

function phaseNameFromAngle(angle: number) {
  for (const p of PHASE_NAMES) if (angle < p.max) return p;
  return PHASE_NAMES[PHASE_NAMES.length - 1];
}

export function accurateMoon(date: Date): AccurateMoonInfo {
  const time = Astro.MakeTime(date);
  const phaseAngle = Astro.MoonPhase(time); // 0..360 degrees
  const illum = Astro.Illumination(Astro.Body.Moon, time); // .phase_fraction
  const illumination = illum.phase_fraction;

  // Age in days since the most recent new moon.
  const prevNew = Astro.SearchMoonPhase(0, time, -40);
  const age = prevNew ? (time.ut - prevNew.ut) : (phaseAngle / 360) * 29.530588853;

  const phaseFraction = ((phaseAngle % 360) + 360) % 360 / 360;
  const waxing = phaseAngle < 180;

  // Constellation containing the Moon at this instant (geocentric, equator-of-date).
  const geoObs = new Astro.Observer(0, 0, 0);
  const eq = Astro.Equator(Astro.Body.Moon, time, geoObs, true, true);
  const con = Astro.Constellation(eq.ra, eq.dec);

  const { name, emoji } = phaseNameFromAngle(phaseAngle);
  return {
    phaseAngle,
    phaseFraction,
    illumination,
    age,
    name,
    emoji,
    waxing,
    constellation: con.name,
    constellationSymbol: CONSTELLATION_SYMBOLS[con.name] ?? "✦",
  };
}

export interface RiseSet {
  moonrise: Date | null;
  moonset: Date | null;
  sunrise: Date | null;
  sunset: Date | null;
}

// Find rise/set for Moon and Sun within ±24h of `date` at the given observer.
export function riseSetFor(date: Date, lat: number, lon: number): RiseSet {
  const observer = new Astro.Observer(lat, lon, 0);
  const start = Astro.MakeTime(new Date(date.getTime() - 12 * 3_600_000));
  const search = (body: Astro.Body, dir: 1 | -1) =>
    Astro.SearchRiseSet(body, observer, dir, start, 2)?.date ?? null;
  return {
    moonrise: search(Astro.Body.Moon, +1),
    moonset: search(Astro.Body.Moon, -1),
    sunrise: search(Astro.Body.Sun, +1),
    sunset: search(Astro.Body.Sun, -1),
  };
}

// Next phase transition after the given moment.
export interface NextPhase { name: string; date: Date; }
export function nextPhaseTransition(date: Date): NextPhase | null {
  const time = Astro.MakeTime(date);
  const current = Astro.MoonPhase(time);
  // Next quarter boundary at 0/90/180/270.
  const quarters = [0, 90, 180, 270];
  const next = quarters
    .map((q) => ({ q, delta: ((q - current) % 360 + 360) % 360 || 360 }))
    .sort((a, b) => a.delta - b.delta)[0];
  const found = Astro.SearchMoonPhase(next.q, time, 40);
  if (!found) return null;
  const labels: Record<number, string> = { 0: "New Moon", 90: "First Quarter", 180: "Full Moon", 270: "Last Quarter" };
  return { name: labels[next.q], date: found.date };
}
