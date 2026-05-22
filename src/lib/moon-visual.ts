export type MoonVisualTier = "near-invisible" | "thin-crescent" | "crescent" | "quarter" | "gibbous" | "full";

export interface MoonVisualInput {
  phaseAngle: number;
  illumination: number;
  waxing: boolean;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const norm360 = (n: number) => ((n % 360) + 360) % 360;

export function visualTierForIllumination(illumination: number): MoonVisualTier {
  const pct = clamp01(illumination) * 100;
  if (pct <= 1) return "near-invisible";
  if (pct <= 10) return "thin-crescent";
  if (pct <= 40) return "crescent";
  if (pct <= 60) return "quarter";
  if (pct < 95) return "gibbous";
  return "full";
}

export function moonVisualDescription(input: MoonVisualInput): string {
  const tier = visualTierForIllumination(input.illumination);
  const side = input.waxing ? "waxing" : "waning";
  if (tier === "near-invisible") return `near invisible dark disk with ultra thin ${side} crescent`;
  if (tier === "thin-crescent") return `thin ${side} crescent`;
  if (tier === "crescent") return `${side} crescent`;
  if (tier === "quarter") return `${side} half moon`;
  if (tier === "gibbous") return `${side} gibbous moon`;
  return "full moon";
}

export function validateMoonVisualInputs(input: MoonVisualInput): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (![input.phaseAngle, input.illumination].every(Number.isFinite)) reasons.push("Moon visual data is not finite.");
  const angle = norm360(input.phaseAngle);
  const illumination = clamp01(input.illumination);
  const expectedIllumination = (1 - Math.cos((angle * Math.PI) / 180)) / 2;
  const expectedWaxing = angle < 180;
  if (Math.abs(illumination - expectedIllumination) > 0.02) {
    reasons.push(`Visual illumination ${(illumination * 100).toFixed(2)}% disagrees with phase angle (${(expectedIllumination * 100).toFixed(2)}%).`);
  }
  if (input.waxing !== expectedWaxing && Math.abs(angle - 180) > 0.01 && angle > 0.01) {
    reasons.push(`Visual direction ${input.waxing ? "waxing" : "waning"} disagrees with phase angle ${angle.toFixed(2)}°.`);
  }
  return { ok: reasons.length === 0, reasons };
}
