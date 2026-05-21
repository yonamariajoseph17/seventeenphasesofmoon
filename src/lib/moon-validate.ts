// Cross-check moon phase classification against age & illumination.
// astronomy-engine is already self-consistent; this guards against display drift
// and surfaces a confidence badge.
import type { AccurateMoonInfo } from "./astro-accurate";

export function validateMoon(m: AccurateMoonInfo): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const pct = m.illumination * 100;
  const age = m.age;

  // Age bands → expected phase family
  const ageExpected =
    age < 1.5 ? "New Moon"
    : age < 6.9 ? "Waxing Crescent"
    : age < 8.9 ? "First Quarter"
    : age < 13.9 ? "Waxing Gibbous"
    : age < 15.9 ? "Full Moon"
    : age < 20.9 ? "Waning Gibbous"
    : age < 23.9 ? "Last Quarter"
    : "Waning Crescent";
  if (ageExpected !== m.name) {
    reasons.push(`Age ${age.toFixed(2)}d suggests "${ageExpected}", got "${m.name}".`);
  }

  // Waxing/waning consistency
  const expectWaxing = age < 14.77;
  if (expectWaxing !== m.waxing) {
    reasons.push(`Waxing flag (${m.waxing}) disagrees with age ${age.toFixed(2)}d.`);
  }

  // Illumination vs phase coarse bounds
  const bounds: Record<string, [number, number]> = {
    "New Moon": [0, 3],
    "Waxing Crescent": [0, 55],
    "First Quarter": [40, 60],
    "Waxing Gibbous": [50, 99],
    "Full Moon": [97, 100],
    "Waning Gibbous": [50, 99],
    "Last Quarter": [40, 60],
    "Waning Crescent": [0, 55],
  };
  const b = bounds[m.name];
  if (b && (pct < b[0] - 2 || pct > b[1] + 2)) {
    reasons.push(`Illumination ${pct.toFixed(1)}% outside expected ${b[0]}–${b[1]}% for ${m.name}.`);
  }

  return { ok: reasons.length === 0, reasons };
}
