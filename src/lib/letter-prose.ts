import type { LetterOccasion } from "@/lib/letter";

interface ProseArgs {
  dateText: string;
  city: string;
  phaseName: string;
  illumPct: string;
  ageDays: number;
  constellation: string;
  moonriseText: string | null;
  moonsetText: string | null;
  occasion: LetterOccasion;
}

const OCCASION_CLOSINGS: Record<LetterOccasion, string> = {
  birthday: "the same sky that has quietly returned to mark every year since.",
  anniversary: "a sky that seemed to pause, just long enough to remember.",
  "first-met": "a sky that would never feel quite the same again.",
  proposal: "a sky that held its breath, and then let everything change.",
  friendship: "a sky wide enough to be shared, and rare enough to be treasured.",
  memory: "a sky that keeps the moment long after the night has passed.",
  general: "a sky that has kept its quiet watch ever since.",
};

/**
 * Compose the verified astronomy into flowing, handwritten-feeling prose —
 * every number embedded in a sentence, never a labelled data field.
 */
export function letterProse(a: ProseArgs): string {
  const age = Number.isFinite(a.ageDays) ? a.ageDays.toFixed(1) : "—";
  const phrase = a.phaseName ? a.phaseName.toLowerCase() : "moon";
  const lines: string[] = [];

  lines.push(
    `On the night of ${a.dateText}, above ${a.city}, the sky held a ${phrase}` +
      (a.illumPct ? ` — ${a.illumPct}% lit` : "") +
      (age !== "—" ? `, ${age} days into its journey` : "") +
      (a.constellation ? `, resting in ${a.constellation}` : "") +
      ".",
  );

  if (a.moonriseText && a.moonsetText) {
    lines.push(`It rose at ${a.moonriseText} and slipped away by ${a.moonsetText}, beneath ${OCCASION_CLOSINGS[a.occasion]}`);
  } else if (a.moonriseText) {
    lines.push(`It rose at ${a.moonriseText}, beneath ${OCCASION_CLOSINGS[a.occasion]}`);
  } else if (a.moonsetText) {
    lines.push(`It lingered until ${a.moonsetText}, beneath ${OCCASION_CLOSINGS[a.occasion]}`);
  } else {
    lines.push(`It moved unhurried through the dark, beneath ${OCCASION_CLOSINGS[a.occasion]}`);
  }

  return lines.join(" ");
}
