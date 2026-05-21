// Poetic line generated ONLY from verified astronomical data.
// No fabricated constellations, no invented facts.
import type { AccurateMoonInfo } from "./astro-accurate";

export function poeticLine(m: AccurateMoonInfo, recipient?: string): string {
  const who = recipient?.trim() || "you";
  const pct = m.illumination * 100;
  const bright =
    pct < 1 ? "nearly hidden"
    : pct < 25 ? "a thin curve of light"
    : pct < 50 ? "a half-secret glow"
    : pct < 75 ? "leaning brighter"
    : pct < 99 ? "almost whole"
    : "complete and full";
  const dir = m.waxing ? "gathering" : "letting go of";

  // Phase-specific imagery, no invented constellations.
  switch (m.name) {
    case "New Moon":
      return `The night ${who} arrived, the moon held its breath — a quiet, unwritten sky.`;
    case "Waxing Crescent":
      return `The moon was ${bright}, ${dir} light slowly above ${who}.`;
    case "First Quarter":
      return `Half-lit and steady, the moon kept its careful watch the night ${who} came.`;
    case "Waxing Gibbous":
      return `The moon leaned brighter into the night, ${dir} light over a quiet sky for ${who}.`;
    case "Full Moon":
      return `A full moon spilled its whole light across the night ${who} arrived.`;
    case "Waning Gibbous":
      return `The moon was ${bright}, softly ${dir} the light it had carried for ${who}.`;
    case "Last Quarter":
      return `Half in shadow, half in glow — the moon paused the night ${who} began.`;
    case "Waning Crescent":
      return `A slender moon held the last of its light, like a hand kept open for ${who}.`;
    default:
      return `The moon was ${bright} above ${who}, ${dir} its light into the quiet.`;
  }
}
