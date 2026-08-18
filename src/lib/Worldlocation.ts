// Worldwide city presets — extends the existing India-only list so the
// birth-details form works for a global audience.
//
// NOTE on time zones: like the existing India list, each city's `tz` is a
// fixed UTC offset in hours (no daylight-saving adjustment). This matches
// how the rest of the app already treats time zones (see the manual
// "UTC offset" field in Advanced settings). For a handful of months a year,
// DST-observing cities (most of Europe, the US, etc.) will be off by 1 hour —
// users can correct this manually via Advanced settings, same as they
// already can for any city. If you later want automatic DST handling, that
// requires a proper IANA time zone lookup (e.g. the `geo-tz` package) rather
// than a flat offset list like this one.

import { ALL_PRESETS as INDIA_PRESETS, resolvePreset as resolveIndiaPreset, type CityPreset } from "@/lib/india-locations";

export type { CityPreset };

// ── World cities (India already covered by india-locations.ts) ───────
export const WORLD_CITY_PRESETS: CityPreset[] = [
  // North America
  { name: "New York, United States", tz: -5, lat: 40.71, lon: -74.01 },
  { name: "Los Angeles, United States", tz: -8, lat: 34.05, lon: -118.24 },
  { name: "Chicago, United States", tz: -6, lat: 41.88, lon: -87.63 },
  { name: "Houston, United States", tz: -6, lat: 29.76, lon: -95.37 },
  { name: "Miami, United States", tz: -5, lat: 25.76, lon: -80.19 },
  { name: "San Francisco, United States", tz: -8, lat: 37.77, lon: -122.42 },
  { name: "Seattle, United States", tz: -8, lat: 47.61, lon: -122.33 },
  { name: "Denver, United States", tz: -7, lat: 39.74, lon: -104.99 },
  { name: "Anchorage, United States", tz: -9, lat: 61.22, lon: -149.90 },
  { name: "Honolulu, United States", tz: -10, lat: 21.31, lon: -157.86 },
  { name: "Toronto, Canada", tz: -5, lat: 43.65, lon: -79.38 },
  { name: "Vancouver, Canada", tz: -8, lat: 49.28, lon: -123.12 },
  { name: "Montreal, Canada", tz: -5, lat: 45.50, lon: -73.57 },
  { name: "Mexico City, Mexico", tz: -6, lat: 19.43, lon: -99.13 },
  { name: "Havana, Cuba", tz: -5, lat: 23.11, lon: -82.37 },
  { name: "Panama City, Panama", tz: -5, lat: 8.98, lon: -79.52 },
  { name: "Guatemala City, Guatemala", tz: -6, lat: 14.63, lon: -90.51 },
  { name: "San José, Costa Rica", tz: -6, lat: 9.93, lon: -84.08 },
  { name: "Kingston, Jamaica", tz: -5, lat: 17.97, lon: -76.79 },
  { name: "Nassau, Bahamas", tz: -5, lat: 25.05, lon: -77.35 },

  // South America
  { name: "São Paulo, Brazil", tz: -3, lat: -23.55, lon: -46.63 },
  { name: "Rio de Janeiro, Brazil", tz: -3, lat: -22.91, lon: -43.17 },
  { name: "Buenos Aires, Argentina", tz: -3, lat: -34.60, lon: -58.38 },
  { name: "Santiago, Chile", tz: -4, lat: -33.45, lon: -70.65 },
  { name: "Lima, Peru", tz: -5, lat: -12.05, lon: -77.04 },
  { name: "Bogotá, Colombia", tz: -5, lat: 4.71, lon: -74.07 },
  { name: "Caracas, Venezuela", tz: -4, lat: 10.48, lon: -66.90 },
  { name: "Quito, Ecuador", tz: -5, lat: -0.18, lon: -78.47 },
  { name: "La Paz, Bolivia", tz: -4, lat: -16.50, lon: -68.15 },
  { name: "Montevideo, Uruguay", tz: -3, lat: -34.90, lon: -56.16 },
  { name: "Asunción, Paraguay", tz: -4, lat: -25.28, lon: -57.63 },
  { name: "Georgetown, Guyana", tz: -4, lat: 6.80, lon: -58.16 },

  // Europe
  { name: "London, United Kingdom", tz: 0, lat: 51.51, lon: -0.13 },
  { name: "Dublin, Ireland", tz: 0, lat: 53.35, lon: -6.26 },
  { name: "Lisbon, Portugal", tz: 0, lat: 38.72, lon: -9.14 },
  { name: "Reykjavik, Iceland", tz: 0, lat: 64.15, lon: -21.94 },
  { name: "Paris, France", tz: 1, lat: 48.86, lon: 2.35 },
  { name: "Madrid, Spain", tz: 1, lat: 40.42, lon: -3.70 },
  { name: "Berlin, Germany", tz: 1, lat: 52.52, lon: 13.40 },
  { name: "Rome, Italy", tz: 1, lat: 41.90, lon: 12.50 },
  { name: "Amsterdam, Netherlands", tz: 1, lat: 52.37, lon: 4.90 },
  { name: "Brussels, Belgium", tz: 1, lat: 50.85, lon: 4.35 },
  { name: "Vienna, Austria", tz: 1, lat: 48.21, lon: 16.37 },
  { name: "Zurich, Switzerland", tz: 1, lat: 47.37, lon: 8.54 },
  { name: "Stockholm, Sweden", tz: 1, lat: 59.33, lon: 18.07 },
  { name: "Oslo, Norway", tz: 1, lat: 59.91, lon: 10.75 },
  { name: "Copenhagen, Denmark", tz: 1, lat: 55.68, lon: 12.57 },
  { name: "Warsaw, Poland", tz: 1, lat: 52.23, lon: 21.01 },
  { name: "Prague, Czechia", tz: 1, lat: 50.08, lon: 14.44 },
  { name: "Budapest, Hungary", tz: 1, lat: 47.50, lon: 19.04 },
  { name: "Helsinki, Finland", tz: 2, lat: 60.17, lon: 24.94 },
  { name: "Athens, Greece", tz: 2, lat: 37.98, lon: 23.73 },
  { name: "Bucharest, Romania", tz: 2, lat: 44.43, lon: 26.10 },
  { name: "Kyiv, Ukraine", tz: 2, lat: 50.45, lon: 30.52 },
  { name: "Moscow, Russia", tz: 3, lat: 55.76, lon: 37.62 },
  { name: "Istanbul, Turkey", tz: 3, lat: 41.01, lon: 28.98 },

  // Africa
  { name: "Cairo, Egypt", tz: 2, lat: 30.04, lon: 31.24 },
  { name: "Lagos, Nigeria", tz: 1, lat: 6.52, lon: 3.38 },
  { name: "Nairobi, Kenya", tz: 3, lat: -1.29, lon: 36.82 },
  { name: "Addis Ababa, Ethiopia", tz: 3, lat: 9.03, lon: 38.74 },
  { name: "Johannesburg, South Africa", tz: 2, lat: -26.20, lon: 28.05 },
  { name: "Cape Town, South Africa", tz: 2, lat: -33.92, lon: 18.42 },
  { name: "Casablanca, Morocco", tz: 1, lat: 33.57, lon: -7.59 },
  { name: "Algiers, Algeria", tz: 1, lat: 36.75, lon: 3.06 },
  { name: "Tunis, Tunisia", tz: 1, lat: 36.81, lon: 10.18 },
  { name: "Accra, Ghana", tz: 0, lat: 5.60, lon: -0.19 },
  { name: "Dakar, Senegal", tz: 0, lat: 14.72, lon: -17.47 },
  { name: "Kinshasa, DR Congo", tz: 1, lat: -4.32, lon: 15.31 },
  { name: "Kampala, Uganda", tz: 3, lat: 0.35, lon: 32.58 },
  { name: "Dar es Salaam, Tanzania", tz: 3, lat: -6.79, lon: 39.21 },
  { name: "Harare, Zimbabwe", tz: 2, lat: -17.83, lon: 31.05 },

  // Middle East
  { name: "Dubai, United Arab Emirates", tz: 4, lat: 25.20, lon: 55.27 },
  { name: "Abu Dhabi, United Arab Emirates", tz: 4, lat: 24.45, lon: 54.38 },
  { name: "Doha, Qatar", tz: 3, lat: 25.29, lon: 51.53 },
  { name: "Riyadh, Saudi Arabia", tz: 3, lat: 24.71, lon: 46.68 },
  { name: "Jeddah, Saudi Arabia", tz: 3, lat: 21.49, lon: 39.19 },
  { name: "Kuwait City, Kuwait", tz: 3, lat: 29.38, lon: 47.99 },
  { name: "Muscat, Oman", tz: 4, lat: 23.59, lon: 58.41 },
  { name: "Manama, Bahrain", tz: 3, lat: 26.23, lon: 50.59 },
  { name: "Tel Aviv, Israel", tz: 2, lat: 32.08, lon: 34.78 },
  { name: "Jerusalem, Israel", tz: 2, lat: 31.77, lon: 35.21 },
  { name: "Amman, Jordan", tz: 2, lat: 31.95, lon: 35.93 },
  { name: "Beirut, Lebanon", tz: 2, lat: 33.89, lon: 35.50 },
  { name: "Baghdad, Iraq", tz: 3, lat: 33.32, lon: 44.36 },
  { name: "Tehran, Iran", tz: 3.5, lat: 35.69, lon: 51.39 },

  // South & Central Asia (excluding India, already covered)
  { name: "Karachi, Pakistan", tz: 5, lat: 24.86, lon: 67.01 },
  { name: "Lahore, Pakistan", tz: 5, lat: 31.55, lon: 74.34 },
  { name: "Islamabad, Pakistan", tz: 5, lat: 33.68, lon: 73.05 },
  { name: "Dhaka, Bangladesh", tz: 6, lat: 23.81, lon: 90.41 },
  { name: "Colombo, Sri Lanka", tz: 5.5, lat: 6.93, lon: 79.85 },
  { name: "Kathmandu, Nepal", tz: 5.75, lat: 27.72, lon: 85.32 },
  { name: "Thimphu, Bhutan", tz: 6, lat: 27.47, lon: 89.64 },
  { name: "Kabul, Afghanistan", tz: 4.5, lat: 34.56, lon: 69.21 },
  { name: "Tashkent, Uzbekistan", tz: 5, lat: 41.30, lon: 69.24 },
  { name: "Almaty, Kazakhstan", tz: 6, lat: 43.24, lon: 76.95 },
  { name: "Baku, Azerbaijan", tz: 4, lat: 40.41, lon: 49.87 },
  { name: "Tbilisi, Georgia", tz: 4, lat: 41.72, lon: 44.79 },
  { name: "Yerevan, Armenia", tz: 4, lat: 40.18, lon: 44.51 },

  // East Asia
  { name: "Tokyo, Japan", tz: 9, lat: 35.68, lon: 139.69 },
  { name: "Osaka, Japan", tz: 9, lat: 34.69, lon: 135.50 },
  { name: "Seoul, South Korea", tz: 9, lat: 37.57, lon: 126.98 },
  { name: "Beijing, China", tz: 8, lat: 39.90, lon: 116.41 },
  { name: "Shanghai, China", tz: 8, lat: 31.23, lon: 121.47 },
  { name: "Hong Kong", tz: 8, lat: 22.32, lon: 114.17 },
  { name: "Taipei, Taiwan", tz: 8, lat: 25.03, lon: 121.57 },
  { name: "Ulaanbaatar, Mongolia", tz: 8, lat: 47.89, lon: 106.91 },
  { name: "Pyongyang, North Korea", tz: 9, lat: 39.02, lon: 125.75 },

  // Southeast Asia
  { name: "Singapore", tz: 8, lat: 1.35, lon: 103.82 },
  { name: "Bangkok, Thailand", tz: 7, lat: 13.76, lon: 100.50 },
  { name: "Jakarta, Indonesia", tz: 7, lat: -6.21, lon: 106.85 },
  { name: "Manila, Philippines", tz: 8, lat: 14.60, lon: 120.98 },
  { name: "Kuala Lumpur, Malaysia", tz: 8, lat: 3.14, lon: 101.69 },
  { name: "Hanoi, Vietnam", tz: 7, lat: 21.03, lon: 105.85 },
  { name: "Ho Chi Minh City, Vietnam", tz: 7, lat: 10.82, lon: 106.63 },
  { name: "Yangon, Myanmar", tz: 6.5, lat: 16.87, lon: 96.20 },
  { name: "Phnom Penh, Cambodia", tz: 7, lat: 11.56, lon: 104.92 },
  { name: "Vientiane, Laos", tz: 7, lat: 17.97, lon: 102.60 },

  // Oceania
  { name: "Sydney, Australia", tz: 10, lat: -33.87, lon: 151.21 },
  { name: "Melbourne, Australia", tz: 10, lat: -37.81, lon: 144.96 },
  { name: "Brisbane, Australia", tz: 10, lat: -27.47, lon: 153.03 },
  { name: "Perth, Australia", tz: 8, lat: -31.95, lon: 115.86 },
  { name: "Adelaide, Australia", tz: 9.5, lat: -34.93, lon: 138.60 },
  { name: "Auckland, New Zealand", tz: 12, lat: -36.85, lon: 174.76 },
  { name: "Wellington, New Zealand", tz: 12, lat: -41.29, lon: 174.78 },
  { name: "Suva, Fiji", tz: 12, lat: -18.14, lon: 178.44 },
  { name: "Port Moresby, Papua New Guinea", tz: 10, lat: -9.44, lon: 147.18 },
  { name: "Nuku'alofa, Tonga", tz: 13, lat: -21.14, lon: -175.20 },
  { name: "Apia, Samoa", tz: 13, lat: -13.83, lon: -171.77 },
  { name: "Pago Pago, American Samoa", tz: -11, lat: -14.28, lon: -170.70 },
  { name: "Kiritimati, Kiribati", tz: 14, lat: 1.87, lon: -157.40 },
];

// ── Merge with India + de-duplicate by name ────────────────────────────
function dedupe(list: CityPreset[]): CityPreset[] {
  const seen = new Set<string>();
  const out: CityPreset[] = [];
  for (const p of list) {
    const key = p.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

export const GLOBAL_PRESETS: CityPreset[] = dedupe([...INDIA_PRESETS, ...WORLD_CITY_PRESETS]);

// ── Search across the full worldwide list ──────────────────────────────
// Simple ranking: names starting with the query first, then names that
// merely contain it. Same shape/behavior as the original India-only
// searchPresets, just operating over the merged list.
export function searchGlobalPresets(query: string, limit = 14): CityPreset[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const starts: CityPreset[] = [];
  const includes: CityPreset[] = [];
  for (const p of GLOBAL_PRESETS) {
    const name = p.name.toLowerCase();
    if (name.startsWith(q)) {
      starts.push(p);
    } else if (name.includes(q)) {
      includes.push(p);
    }
    if (starts.length >= limit) break;
  }
  return [...starts, ...includes].slice(0, limit);
}

// ── Resolve an exact / aliased name to a preset ─────────────────────────
// Checks the full worldwide list first, then falls back to the original
// India alias resolver (e.g. "Bombay" → "Mumbai", "Madras" → "Chennai")
// so existing alias behavior keeps working unchanged.
export function resolveGlobalPreset(query: string): CityPreset | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  const exact = GLOBAL_PRESETS.find((p) => p.name.toLowerCase() === q);
  if (exact) return exact;
  return resolveIndiaPreset(query);
}
