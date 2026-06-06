// Verification engine for lunar data.
//
// Philosophy: astronomy-engine (VSOP87 / ELP2000) is self-consistent, so CORE
// astronomy (phase, illumination, age, waxing/waning) is virtually always
// verifiable. We only fall back to "UNAVAILABLE" when the core math itself is
// broken (non-finite or internally contradictory). Missing OPTIONAL metadata
// (constellation/zodiac, rise/set, poetic, cultural notes) only downgrades the
// confidence to VERIFIED (PARTIAL) — it never blocks the moon render.
import type { AccurateMoonInfo } from "./astro-accurate";

export type MoonConfidence = "VERIFIED" | "VERIFIED_PARTIAL" | "UNAVAILABLE";

export interface MoonValidationResult {
  /** Highest-level verdict. */
  confidence: MoonConfidence;
  /** True when core astronomy is valid — render the moon whenever this is true. */
  coreOk: boolean;
  /** Reasons core astronomy failed (only populated when coreOk === false). */
  coreReasons: string[];
  /** Optional metadata that could not be verified (does not block rendering). */
  optionalReasons: string[];
}

const norm360 = (n: number) => ((n % 360) + 360) % 360;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function validateMoon(m: AccurateMoonInfo): MoonValidationResult {
  const coreReasons: string[] = [];
  const optionalReasons: string[] = [];

  // ── CORE 1: numeric integrity ──────────────────────────────────────────
  if (![m.phaseAngle, m.illumination, m.age, m.phaseFraction].every(Number.isFinite)) {
    coreReasons.push("Core lunar values are not finite.");
  }

  const angle = norm360(m.phaseAngle);
  const illumination = clamp01(m.illumination);

  // ── CORE 2: illumination must agree with phase geometry ────────────────
  const expectedIllumination = (1 - Math.cos((angle * Math.PI) / 180)) / 2;
  if (Number.isFinite(m.illumination) && Math.abs(illumination - expectedIllumination) > 0.05) {
    coreReasons.push(
      `Illumination ${(illumination * 100).toFixed(1)}% is inconsistent with the phase geometry.`,
    );
  }

  // ── CORE 3: waxing/waning must agree with phase angle ──────────────────
  const expectWaxing = angle < 180;
  if (m.waxing !== expectWaxing && Math.abs(angle - 180) > 0.5 && angle > 0.5) {
    coreReasons.push("Waxing/waning direction is inconsistent with the phase angle.");
  }

  // ── CORE 4: moon age must fall within one synodic month ────────────────
  if (Number.isFinite(m.age) && (m.age < 0 || m.age > 29.9)) {
    coreReasons.push(`Moon age ${m.age.toFixed(2)}d is outside the valid 0–29.9 day range.`);
  }

  // ── OPTIONAL: constellation / zodiac metadata ──────────────────────────
  if (!m.constellation || m.constellationSymbol === "✦") {
    optionalReasons.push("Constellation/zodiac symbol unavailable.");
  }

  const coreOk = coreReasons.length === 0;
  const confidence: MoonConfidence = !coreOk
    ? "UNAVAILABLE"
    : optionalReasons.length === 0
      ? "VERIFIED"
      : "VERIFIED_PARTIAL";

  return { confidence, coreOk, coreReasons, optionalReasons };
}

/** Combine moon validation with availability of rise/set (also optional data). */
export function combineConfidence(
  base: MoonValidationResult,
  opts: { hasRiseOrSet?: boolean } = {},
): MoonValidationResult {
  if (!base.coreOk) return base;
  const optionalReasons = [...base.optionalReasons];
  if (opts.hasRiseOrSet === false) {
    optionalReasons.push("Moonrise/moonset not available for this location/date.");
  }
  const confidence: MoonConfidence =
    optionalReasons.length === 0 ? "VERIFIED" : "VERIFIED_PARTIAL";
  return { ...base, optionalReasons, confidence };
}

/** Short uppercase tag for the confidence badge. */
export function confidenceTag(c: MoonConfidence): string {
  switch (c) {
    case "VERIFIED":
      return "Verified";
    case "VERIFIED_PARTIAL":
      return "Verified (Partial)";
    case "UNAVAILABLE":
      return "Unavailable";
  }
}

/** Human sentence describing the confidence level. */
export function confidenceLabel(c: MoonConfidence): string {
  switch (c) {
    case "VERIFIED":
      return "Verified astronomical calculation";
    case "VERIFIED_PARTIAL":
      return "Verified astronomical calculation — some secondary metadata unavailable";
    case "UNAVAILABLE":
      return "Unable to verify";
  }
}
