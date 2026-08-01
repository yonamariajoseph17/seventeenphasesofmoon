// Positive / notable milestones that happened on April 17 of each year.
// Curated from public historical records; focused on uplifting, hopeful, or culturally meaningful moments.
export const APRIL_17_MILESTONES: Record<number, string> = {
  2004: "You arrived — and in the same week, NASA's Gravity Probe B launched to test Einstein's theory of relativity.",
  2005: "Microsoft began rolling out its first 64-bit Windows, opening the door to a faster era of personal computing.",
  2006: "Walt Disney Concert Hall in Los Angeles celebrated a milestone season — a year of music for a city that loves the arts.",
  2007: "Apple's iTunes Store crossed 5 billion songs sold — music going truly global, one download at a time.",
  2008: "The Large Hadron Collider neared completion at CERN, preparing humanity to peer into the building blocks of the universe.",
  2009: "NASA's Kepler space telescope sent back its 'first light' image, beginning the hunt for Earth-like worlds.",
  2010: "The Eyjafjallajökull ash cloud cleared enough for skies over Europe to slowly reopen — reunions resumed.",
  2011: "India's PSLV-C16 successfully launched the Resourcesat-2 satellite from Sriharikota — a proud ISRO moment.",
  2012: "Fenway Park in Boston celebrated its 100th birthday — a century of cheers under open evening skies.",
  2013: "Scientists confirmed Kepler-62e and 62f — two of the most Earth-like planets ever found in a star's habitable zone.",
  2014: "Astronomers announced Kepler-186f, the first Earth-sized planet discovered in another star's habitable zone.",
  2015: "Tamil Nadu observed a vibrant Tamil New Year season — Puthandu greetings echoed across Coimbatore and beyond.",
  2016: "Ecuador and the world rallied with relief efforts after a major earthquake — a reminder of global compassion.",
  2017: "India successfully launched the South Asia Satellite (GSAT-9) as a gift of connectivity to neighbouring nations.",
  2018: "Astronomers using ALMA spotted the most distant oxygen ever detected — light from 13.28 billion years ago.",
  2019: "The first-ever image of a black hole (M87*) from the Event Horizon Telescope continued to inspire the world.",
  2020: "Communities everywhere clapped at sundown for frontline workers — a quiet, worldwide thank-you under the moon.",
  2021: "NASA's Ingenuity helicopter completed final checks on Mars, days before becoming the first craft to fly on another planet.",
  2022: "Easter Sunday — families across the world gathered again in person after long pandemic separations.",
  2023: "ISRO's reusable launch vehicle (RLV-TD) completed its first autonomous landing — India's space dreams climbed higher.",
  2024: "The James Webb Space Telescope released stunning new images of star nurseries — the universe, still painting.",
  2025: "Tamil New Year (Puthandu) fell on April 14 — and the festive glow lingered into the week of your birthday.",
  2026: "A new year still being written — and you are part of its story.",
};

export function milestoneFor(year: number): string | undefined {
  return APRIL_17_MILESTONES[year];
}

// Ages that feel like a landmark on a life timeline — used to gently break
// visual monotony in the long year-by-year scrolls.
const MILESTONE_AGES = new Set([1, 10, 13, 16, 18, 21, 25, 30, 40, 50, 60, 70, 75, 80, 90, 100]);

/** True when an age is a culturally notable milestone birthday. */
export function isMilestoneAge(age: number): boolean {
  return MILESTONE_AGES.has(age);
}

// Ages featured on the postcard's milestone-moon strip.
export const POSTCARD_MILESTONE_AGES = [0, 1, 5, 10, 16, 18, 21, 25, 30] as const;

/** Milestone ages that have already occurred for someone of the given current age. */
export function postcardMilestones(currentAge: number): number[] {
  return POSTCARD_MILESTONE_AGES.filter((a) => a <= currentAge);
}

/** Label for a postcard milestone tile — "BIRTH" for age 0, else "AGE N". */
export function milestoneLabel(age: number): string {
  return age === 0 ? "BIRTH" : `AGE ${age}`;
}
