// Self-contained Moon Letter payload encoded into the URL — no backend required.
// We base64url-encode a compact JSON blob so the recipient link is self-sufficient.

export const LETTER_STYLES = [
  "midnight", "romantic", "vintage", "archive", "minimal", "golden",
] as const;
export type LetterStyle = (typeof LETTER_STYLES)[number];

export const LETTER_OCCASIONS = [
  "birthday", "anniversary", "first-met", "proposal", "friendship", "memory", "general",
] as const;
export type LetterOccasion = (typeof LETTER_OCCASIONS)[number];

/** Small italic line shown after the scroll unfurls, by occasion. */
export const OCCASION_LINES: Record<LetterOccasion, string> = {
  birthday: "Every year the moon returns to mark the night you arrived.",
  anniversary: "Some nights are remembered not by what happened, but by who was there.",
  "first-met": "The sky was different that night. So was everything after.",
  proposal: "Under this moon, everything changed.",
  friendship: "Not all who share a sky know how rare that is. You do.",
  memory: "Some moments live longer in the heart than in time.",
  general: "The moon kept watch that night. As it always has. As it always will.",
};

export const OCCASION_LABELS: Record<LetterOccasion, string> = {
  birthday: "Birthday",
  anniversary: "Anniversary",
  "first-met": "First met",
  proposal: "Proposal",
  friendship: "Friendship",
  memory: "Memory",
  general: "General",
};

/** Short closing phrase shown on the bouquet tag, by occasion. */
export const OCCASION_CLOSINGS: Record<LetterOccasion, string> = {
  birthday: "With Love,",
  anniversary: "Forever Yours,",
  "first-met": "Fondly,",
  proposal: "All My Heart,",
  friendship: "Warmly,",
  memory: "In Loving Memory,",
  general: "Warm Regards,",
};

// ── Bouquet ─────────────────────────────────────────────────────────
export const FLOWERS = [
  "rose", "peony", "daisy", "lily", "orchid", "marigold",
  "carnation", "sunflower", "hydrangea", "jasmine", "tulip", "lavender",
] as const;
export type FlowerId = (typeof FLOWERS)[number];

export const WRAPS = [
  "kraft", "blush", "sage", "ivory", "dustyblue", "plum", "terracotta", "charcoal",
] as const;
export type WrapId = (typeof WRAPS)[number];

export interface Bouquet {
  flowers: FlowerId[];
  wrap: WrapId;
}

export interface LetterPayload {
  v: 1;
  name: string;
  pronoun: "she/her" | "he/him" | "they/them";
  date: string;
  time: string;
  city: string;
  tz: number;
  lat: number;
  lon: number;
  mode: "custom" | "sunrise" | "sunset";
  to?: string;
  msg?: string;          // up to 1200 chars
  from?: string;
  closing?: string;
  place?: string;
  writtenDate?: string;
  style: LetterStyle;
  occasion?: LetterOccasion;
  song?: string;
  songScope?: "letter" | "all";
  recipientCity?: string;
  bouquet?: Bouquet;
  giftType?: "digital" | "diy";
  giftTagText?: string;  // up to 80 chars
}

function utf8ToB64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64UrlToUtf8(s: string): string {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function encodeLetter(p: LetterPayload): string {
  return utf8ToB64Url(JSON.stringify(p));
}

export function decodeLetter(token: string): LetterPayload | null {
  try {
    const parsed = JSON.parse(b64UrlToUtf8(token));
    if (!parsed || parsed.v !== 1) return null;
    if (typeof parsed.date !== "string" || typeof parsed.time !== "string") return null;
    if (typeof parsed.lat !== "number" || typeof parsed.lon !== "number" || typeof parsed.tz !== "number") return null;
    if (!LETTER_STYLES.includes(parsed.style)) parsed.style = "midnight";
    return parsed as LetterPayload;
  } catch {
    return null;
  }
}
