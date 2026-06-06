// Persistent Moon Letter storage. Every letter is saved to the database under a
// short, permanent id (e.g. /letter/a82jk2) so the recipient link always
// restores the exact original experience — never regenerated, never dependent
// on temporary session state.
import { supabase } from "@/integrations/supabase/client";
import {
  accurateMoon,
  riseSetForCivilDate,
  eventMomentForCivilDate,
} from "@/lib/astro-accurate";
import { moonVisualDescription } from "@/lib/moon-visual";
import { poeticLine } from "@/lib/poetic";
import { validateMoon, combineConfidence, type MoonConfidence } from "@/lib/moon-validate";
import type { LetterPayload } from "@/lib/letter";

export interface LetterSnapshot {
  momentISO: string;
  phaseAngle: number;
  illumination: number;
  illumPct: string;
  age: number;
  waxing: boolean;
  name: string;
  emoji: string;
  constellation: string;
  constellationSymbol: string;
  visual: string;
  poetic: string;
  moonriseISO: string | null;
  moonsetISO: string | null;
  confidence: MoonConfidence;
}

export interface LetterRecord {
  payload: LetterPayload;
  snapshot: LetterSnapshot;
}

function localToUtc(date: string, time: string, tzHours: number): Date {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  return new Date(Date.UTC(y, mo - 1, d, h, mi) - tzHours * 3_600_000);
}

/** Resolve the exact UTC moment a letter refers to. */
export function momentForPayload(p: LetterPayload): Date {
  const [y, mo, d] = p.date.split("-").map(Number);
  if (p.mode === "custom") return localToUtc(p.date, p.time, p.tz);
  const ev = eventMomentForCivilDate(y, mo, d, p.tz, p.lat, p.lon, p.mode);
  return ev?.date ?? localToUtc(p.date, p.time, p.tz);
}

/** Compute and freeze the verified astronomy for a letter. */
export function buildLetterSnapshot(p: LetterPayload): LetterSnapshot {
  const [y, mo, d] = p.date.split("-").map(Number);
  const moment = momentForPayload(p);
  const moon = accurateMoon(moment);
  const rs = riseSetForCivilDate(y, mo, d, p.tz, p.lat, p.lon);
  const base = validateMoon(moon);
  const validation = combineConfidence(base, { hasRiseOrSet: !!(rs.moonrise || rs.moonset) });
  const illumPctNum = moon.illumination * 100;

  return {
    momentISO: moment.toISOString(),
    phaseAngle: moon.phaseAngle,
    illumination: moon.illumination,
    illumPct: illumPctNum >= 1 ? illumPctNum.toFixed(1) : illumPctNum.toFixed(2),
    age: moon.age,
    waxing: moon.waxing,
    name: moon.name,
    emoji: moon.emoji,
    constellation: moon.constellation,
    constellationSymbol: moon.constellationSymbol,
    visual: moonVisualDescription(moon),
    poetic: poeticLine(moon, p.to || p.name),
    moonriseISO: rs.moonrise ? rs.moonrise.toISOString() : null,
    moonsetISO: rs.moonset ? rs.moonset.toISOString() : null,
    confidence: validation.confidence,
  };
}

const ID_ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function shortId(len = 8): string {
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  let out = "";
  for (let i = 0; i < len; i++) out += ID_ALPHABET[arr[i] % ID_ALPHABET.length];
  return out;
}

/** Persist a letter and return its permanent short id. */
export async function createLetter(p: LetterPayload): Promise<string> {
  const snapshot = buildLetterSnapshot(p);
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = shortId(8);
    const { error } = await supabase
      .from("moon_letters")
      .insert({ id, payload: p as never, snapshot: snapshot as never });
    if (!error) return id;
    // 23505 = unique violation (id collision) → retry with a new id.
    if ((error as { code?: string }).code !== "23505") throw error;
  }
  throw new Error("Could not generate a unique letter id.");
}

/** Restore a saved letter by id. Returns null when the id does not exist. */
export async function fetchLetter(id: string): Promise<LetterRecord | null> {
  const { data, error } = await supabase
    .from("moon_letters")
    .select("payload, snapshot")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return {
    payload: data.payload as unknown as LetterPayload,
    snapshot: data.snapshot as unknown as LetterSnapshot,
  };
}
