import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { toPng } from "html-to-image";
import { zodiacFor } from "@/lib/astro";
import { accurateMoon, riseSetForCivilDate, nextPhaseTransition, eventMomentForCivilDate, type AstroEventKind, type RiseSet } from "@/lib/astro-accurate";
import { validateMoon, combineConfidence, confidenceLabel, confidenceTag } from "@/lib/moon-validate";
import { moonVisualDescription } from "@/lib/moon-visual";
import { poeticLine } from "@/lib/poetic";
import { tzLabel } from "@/lib/tz";
import { MoonSvg } from "@/components/MoonSvg";
import { StarField } from "@/components/StarField";
import { SoundscapeControl } from "@/components/SoundscapeControl";
import { useSoundscape } from "@/lib/useAmbient";
import { PostcardFront, PostcardBack, POSTCARD_STYLES, POSTCARD_W, POSTCARD_H, type PostcardStyle, type PostcardMilestone } from "@/components/Postcard";
import { LETTER_STYLES, LETTER_OCCASIONS, OCCASION_LABELS, type LetterStyle, type LetterOccasion, type LetterPayload } from "@/lib/letter";
import { createLetter, uploadLetterSong, SONG_ACCEPT, SONG_MAX_BYTES } from "@/lib/letter-store";
import { type CityPreset } from "@/lib/india-locations";
import { GLOBAL_PRESETS, searchGlobalPresets, resolveGlobalPreset } from "@/lib/world-locations";
import { isMilestoneAge, postcardMilestones } from "@/lib/milestones";
import { GiftWizard } from "@/components/GiftWizard";
import auroraBg from "@/assets/aurorayellowknife_takasaka.jpg";

const PREVIEW_W = 520;

// Create one real, polished gift through your own flow (clearly demo content,
// not implying a real customer), then drop its permanent link/id here.
// This makes "See a real example" show the ACTUAL cinematic reveal —
// envelope, letter, postcard, bouquet — not a mockup.
const DEMO_LETTER_PATH = "/letter/REPLACE_WITH_YOUR_DEMO_ID";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Sky We Share · A diary in moonlight" },
      { name: "description", content: "The sky remembers what we choose to keep. The verified night sky, traced from someone's first night to today — for anyone you love." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Inter:wght@300;400;500;600&display=swap" },
    ],
  }),
});

const BUILTIN_PRESETS: CityPreset[] = GLOBAL_PRESETS;

const MODE_OPTIONS = ["custom", "sunrise", "sunset"] as const;
type Mode = (typeof MODE_OPTIONS)[number];

const PRONOUN_OPTIONS = ["she/her", "he/him", "they/them"] as const;
type Pronoun = (typeof PRONOUN_OPTIONS)[number];

interface PronounSet {
  subject: string;   // she / he / they
  object: string;    // her / him / them
  possessive: string; // her / his / their
  was: string;       // was / was / were
}
const PRONOUN_MAP: Record<Pronoun, PronounSet> = {
  "she/her": { subject: "she", object: "her", possessive: "her", was: "was" },
  "he/him": { subject: "he", object: "him", possessive: "his", was: "was" },
  "they/them": { subject: "they", object: "them", possessive: "their", was: "were" },
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const PRESETS_STORAGE_KEY = "her-sky:custom-presets:v1";

const formSchema = z.object({
  name: z.string().trim().min(1, "Name required").max(60),
  pronoun: z.enum(PRONOUN_OPTIONS),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM"),
  city: z.string().trim().min(1, "City required").max(80),
  tz: z.coerce.number().min(-12).max(14),
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  mode: z.enum(MODE_OPTIONS),
  occasion: z.enum(LETTER_OCCASIONS),
});
type FormValues = z.infer<typeof formSchema>;

const DEFAULTS: FormValues = {
  name: "",
  pronoun: "they/them",
  date: "2004-04-17",
  time: "12:00",
  city: "Coimbatore, Tamil Nadu",
  tz: 5.5,
  lat: 11.0168,
  lon: 76.9558,
  mode: "sunset",
  occasion: "birthday",
};

function loadSavedPresets(): CityPreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PRESETS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p): p is CityPreset =>
      p && typeof p.name === "string" && typeof p.tz === "number"
      && typeof p.lat === "number" && typeof p.lon === "number",
    );
  } catch {
    return [];
  }
}

function localToUtc(date: string, time: string, tzHours: number): Date {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  return new Date(Date.UTC(y, mo - 1, d, h, mi) - tzHours * 3_600_000);
}

// Resolve the actual moment to use for the given civil date, honoring the night-window mode.
function momentFor(
  year: number, month: number, day: number,
  time: string, tz: number, lat: number, lon: number, mode: Mode,
): Date {
  if (mode !== "custom") {
    const event = eventMomentForCivilDate(year, month, day, tz, lat, lon, mode);
    if (event) return event.date;
  }
  return localToUtc(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`, time, tz);
}

function fmtDate(d: Date, tzHours: number) {
  const shifted = new Date(d.getTime() + tzHours * 3_600_000);
  return shifted.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
  });
}

function fmtTime(d: Date, tzHours: number) {
  const shifted = new Date(d.getTime() + tzHours * 3_600_000);
  return shifted.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", timeZone: "UTC",
  });
}

function eventLabelForMoment(date: Date, events: RiseSet): AstroEventKind | null {
  const candidates: Array<[AstroEventKind, Date | null]> = [
    ["sunrise", events.sunrise], ["sunset", events.sunset], ["moonrise", events.moonrise], ["moonset", events.moonset],
  ];
  const matched = candidates.find(([, eventDate]) => eventDate && Math.abs(eventDate.getTime() - date.getTime()) <= 60_000);
  return matched?.[0] ?? null;
}

function timeWithVerifiedEvent(date: Date, tz: number, events: RiseSet) {
  const event = eventLabelForMoment(date, events);
  return `${fmtTime(date, tz)} local${event ? ` · ${event}` : ""}`;
}



// Per-occasion phrasing for the "Night one" section — same data, different framing.
const OCCASION_EYEBROW: Record<LetterOccasion, string> = {
  birthday: "Night one",
  anniversary: "The night it mattered",
  "first-met": "Where it began",
  proposal: "The night everything changed",
  friendship: "Since then",
  memory: "That night",
  general: "The night",
};

function nightOneOpening(occasion: LetterOccasion, subject: string, was: string): string {
  switch (occasion) {
    case "birthday": return `The night ${subject} ${was} born`;
    case "anniversary": return "The night that mattered most";
    case "first-met": return "The night it all began";
    case "proposal": return "The night everything changed";
    case "friendship": return "The night this friendship began";
    case "memory": return "The night this memory was made";
    default: return "That quiet night";
  }
}

// Subtitle under "The sky we've shared with [name], since [date]" — same per-occasion tone.
function diarySubtitle(occasion: LetterOccasion, city: string): string {
  switch (occasion) {
    case "birthday":
      return `Every birthday, the moon returns a little different. Here is its quiet diary — drawn over ${city}, from the first night to the sky tonight.`;
    case "anniversary":
      return `Every year, the moon returns to mark this day. Here is its quiet diary — drawn over ${city}, from that night to the sky tonight.`;
    case "first-met":
      return `The sky was different the night it all began. Here is its quiet diary — drawn over ${city}, from that first night to the sky tonight.`;
    case "proposal":
      return `Under this moon, everything changed. Here is its quiet diary — drawn over ${city}, from that night to the sky tonight.`;
    case "friendship":
      return `Not all who share a sky know how rare that is. Here is its quiet diary — drawn over ${city}, from that first night to the sky tonight.`;
    case "memory":
      return `Some moments live longer in the heart than in time. Here is its quiet diary — drawn over ${city}, from that night to the sky tonight.`;
    default:
      return `The moon kept watch that night, as it always has. Here is its quiet diary — drawn over ${city}, from that night to the sky tonight.`;
  }
}



function Index() {
  const [form, setForm] = useState<FormValues>(DEFAULTS);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [applied, setApplied] = useState<FormValues>(DEFAULTS);
  const [savedPresets, setSavedPresets] = useState<CityPreset[]>([]);
  // Client-only "now" — avoids SSR/CSR hydration drift.
  const [now, setNow] = useState<Date | null>(null);

  // Load saved presets from localStorage once, on the client.
  useEffect(() => {
    setSavedPresets(loadSavedPresets());
    setNow(new Date());
  }, []);

  // Persist saved presets whenever they change.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(savedPresets));
    } catch {
      // ignore quota errors
    }
  }, [savedPresets]);

  const allPresets = useMemo<CityPreset[]>(() => {
    // Saved first (so user-defined wins datalist preview), then built-ins, dedup by name.
    const seen = new Set<string>();
    return [...savedPresets, ...BUILTIN_PRESETS].filter((p) => {
      const k = p.name.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [savedPresets]);

  // Smart, ranked autocomplete (city / district / state / alias) after 2 chars.
  const citySuggestions = useMemo<CityPreset[]>(() => {
    const q = form.city.trim();
    if (q.length < 2) return savedPresets.slice(0, 10);
    const saved = savedPresets.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
    const seen = new Set<string>();
    return [...saved, ...searchGlobalPresets(q, 14)].filter((p) => {
      const k = p.name.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).slice(0, 14);
  }, [form.city, savedPresets]);

  // Whether the typed city resolves to a known coordinate (else it's approximate).
  const cityKnown = useMemo(() => {
    const q = form.city.trim();
    if (!q) return true;
    return !!(allPresets.find((c) => c.name.toLowerCase() === q.toLowerCase()) || resolveGlobalPreset(q));
  }, [form.city, allPresets]);

  const birthYear = Number(applied.date.slice(0, 4));
  const birthMonth = Number(applied.date.slice(5, 7));
  const birthDay = Number(applied.date.slice(8, 10));

  const birth = useMemo(
    () => momentFor(birthYear, birthMonth, birthDay, applied.time, applied.tz, applied.lat, applied.lon, applied.mode),
    [birthYear, birthMonth, birthDay, applied.time, applied.tz, applied.lat, applied.lon, applied.mode],
  );

  const currentYear = now ? now.getFullYear() : birthYear;

  const years = useMemo(() => {
    const out: Date[] = [];
    for (let y = birthYear; y <= currentYear; y++) {
      out.push(momentFor(y, birthMonth, birthDay, applied.time, applied.tz, applied.lat, applied.lon, applied.mode));
    }
    return out;
  }, [birthYear, birthMonth, birthDay, applied.time, applied.tz, applied.lat, applied.lon, applied.mode, currentYear]);

  const birthMoon = accurateMoon(birth);
  const birthZodiac = zodiacFor(birthMonth, birthDay);
  const todayMoon = now ? accurateMoon(now) : birthMoon;
  const totalDays = now ? Math.max(0, Math.floor((now.getTime() - birth.getTime()) / 86_400_000)) : 0;
  const birthRiseSet = useMemo(
    () => riseSetForCivilDate(birthYear, birthMonth, birthDay, applied.tz, applied.lat, applied.lon),
    [birthYear, birthMonth, birthDay, applied.tz, applied.lat, applied.lon],
  );
  const birthNextPhase = useMemo(() => nextPhaseTransition(birth), [birth]);
  const birthValidation = useMemo(
    () => combineConfidence(validateMoon(birthMoon), { hasRiseOrSet: !!(birthRiseSet.moonrise || birthRiseSet.moonset) }),
    [birthMoon, birthRiseSet],
  );
  const birthIllumStr = birthMoon.illumination * 100 >= 1
    ? (birthMoon.illumination * 100).toFixed(1)
    : (birthMoon.illumination * 100).toFixed(2);
  const birthTimeLabel = timeWithVerifiedEvent(birth, applied.tz, birthRiseSet);
  const birthVisualLabel = moonVisualDescription(birthMoon);
  const dateLabelShort = new Date(birth.getTime() + applied.tz * 3_600_000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
  const pcMilestones = useMemo<PostcardMilestone[]>(() => {
    const maxAge = currentYear - birthYear;
    return postcardMilestones(maxAge).map((age) => {
      const d = years[age];
      const mm = accurateMoon(d);
      return { age, phaseAngle: mm.phaseAngle, illumination: mm.illumination, waxing: mm.waxing, name: mm.name };
    });
  }, [years, currentYear, birthYear]);

  const pronouns = PRONOUN_MAP[applied.pronoun];
  const hasName = applied.name.trim().length > 0;
  const personName = applied.name.trim() || pronouns.object; // "them" until a name is entered
  const possessive = hasName ? `${applied.name.trim()}'s` : cap(pronouns.possessive); // "Their"
  const tzText = tzLabel(applied.tz);
  const isSavedMatch = savedPresets.some(
    (p) =>
      p.name.toLowerCase() === form.city.trim().toLowerCase()
      && Math.abs(p.lat - form.lat) < 1e-4
      && Math.abs(p.lon - form.lon) < 1e-4,
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = formSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Partial<Record<keyof FormValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof FormValues;
        if (!errs[k]) errs[k] = issue.message;
      }
      setErrors(errs);
      return;
    }
    setErrors({});
    setApplied(parsed.data);
  }

  function setCity(name: string) {
    // Exact match first (incl. user-saved presets), then alias resolution
    // (Bombay → Mumbai, Madras → Chennai, …), so coordinates always auto-fill.
    const preset =
      allPresets.find((c) => c.name.toLowerCase() === name.toLowerCase()) ?? resolveGlobalPreset(name);
    setForm((f) => preset
      ? { ...f, city: preset.name, tz: preset.tz, lat: preset.lat, lon: preset.lon }
      : { ...f, city: name });
  }

  function saveCurrentAsPreset() {
    const name = form.city.trim();
    if (!name) return;
    setSavedPresets((prev) => {
      const filtered = prev.filter((p) => p.name.toLowerCase() !== name.toLowerCase());
      return [{ name, tz: form.tz, lat: form.lat, lon: form.lon }, ...filtered].slice(0, 30);
    });
  }

  function removeSavedPreset(name: string) {
    setSavedPresets((prev) => prev.filter((p) => p.name !== name));
  }

  // ── Postcard ────────────────────────────────────────────────────────
  const [pcStyle, setPcStyle] = useState<PostcardStyle>("romantic");
  const [pcRecipient, setPcRecipient] = useState("");
  const [pcSender, setPcSender] = useState("");
  const [pcOccasion, setPcOccasion] = useState("");
  const [pcMessage, setPcMessage] = useState("");
  const [pcFlipped, setPcFlipped] = useState(false);
  const [exporting, setExporting] = useState(false);
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  const recipientForCard = pcRecipient.trim() || personName;
  const occasionForCard = pcOccasion.trim() || "A moon for you";
  const poetic = useMemo(() => poeticLine(birthMoon, recipientForCard), [birthMoon, recipientForCard]);

  const pcProps = {
    style: pcStyle,
    moon: birthMoon,
    date: birth,
    tz: applied.tz,
    city: applied.city,
    recipient: recipientForCard,
    sender: pcSender.trim(),
    occasion: occasionForCard,
    message: pcMessage,
    poetic,
    illumPct: birthIllumStr,
    dateLabel: fmtDate(birth, applied.tz),
    timeLabel: birthTimeLabel,
    moonriseLabel: birthRiseSet.moonrise ? fmtTime(birthRiseSet.moonrise, applied.tz) : undefined,
    moonsetLabel: birthRiseSet.moonset ? fmtTime(birthRiseSet.moonset, applied.tz) : undefined,
  };

  async function downloadPostcard() {
    if (!frontRef.current || !backRef.current) return;
    setExporting(true);
    try {
      const opts = { pixelRatio: 2, cacheBust: true, backgroundColor: undefined as string | undefined };
      const [frontUrl, backUrl] = await Promise.all([
        toPng(frontRef.current, opts),
        toPng(backRef.current, opts),
      ]);
      // Stitch front (left) + back (right) into one wide print template.
      const scale = 2;
      const gap = 60 * scale;
      const canvas = document.createElement("canvas");
      canvas.width = POSTCARD_W * scale * 2 + gap;
      canvas.height = POSTCARD_H * scale;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const [imgF, imgB] = await Promise.all([loadImage(frontUrl), loadImage(backUrl)]);
        ctx.drawImage(imgF, 0, 0, POSTCARD_W * scale, POSTCARD_H * scale);
        ctx.drawImage(imgB, POSTCARD_W * scale + gap, 0, POSTCARD_W * scale, POSTCARD_H * scale);
      }
      const combined = canvas.toDataURL("image/png");
      const safeName = recipientForCard.replace(/[^a-z0-9-_]+/gi, "_").toLowerCase() || "moon";
      const a = document.createElement("a");
      a.download = `moon-postcard-${safeName}-${applied.date}.png`;
      a.href = combined;
      a.click();
    } finally {
      setExporting(false);
    }
  }



  // ── Moon Letter ─────────────────────────────────────────────────────
  const [ltStyle, setLtStyle] = useState<LetterStyle>("midnight");
  const [ltOccasion, setLtOccasion] = useState<LetterOccasion>("birthday");
  const [ltTo, setLtTo] = useState("");
  const [ltFrom, setLtFrom] = useState("");
  const [ltMessage, setLtMessage] = useState("");
  const [ltCopied, setLtCopied] = useState(false);
  const [ltId, setLtId] = useState<string | null>(null);
  const [ltCreating, setLtCreating] = useState(false);
  const [ltError, setLtError] = useState<string | null>(null);
  const [ltSongFile, setLtSongFile] = useState<File | null>(null);
  const songInputRef = useRef<HTMLInputElement>(null);

  const letterPayload = useMemo<LetterPayload>(
    () => ({
      v: 1,
      name: applied.name,
      pronoun: applied.pronoun,
      date: applied.date,
      time: applied.time,
      city: applied.city,
      tz: applied.tz,
      lat: applied.lat,
      lon: applied.lon,
      mode: applied.mode,
      to: ltTo.trim() || undefined,
      from: ltFrom.trim() || undefined,
      msg: ltMessage.trim() || undefined,
      style: ltStyle,
      occasion: ltOccasion,
    }),
    [applied, ltTo, ltFrom, ltMessage, ltStyle, ltOccasion],
  );

  // Editing the letter invalidates any previously generated permanent link.
  useEffect(() => {
    setLtId(null);
    setLtError(null);
  }, [letterPayload]);

  function pickSong(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (file.size > SONG_MAX_BYTES) {
      setLtError("Song must be 20MB or smaller.");
      setLtSongFile(null);
      return;
    }
    setLtError(null);
    setLtSongFile(file);
  }

  const letterUrl = ltId
    ? typeof window !== "undefined"
      ? `${window.location.origin}/letter/${ltId}`
      : `/letter/${ltId}`
    : "";

  async function generateLetter() {
    setLtCreating(true);
    setLtError(null);
    try {
      let payload = letterPayload;
      if (ltSongFile) {
        const songUrl = await uploadLetterSong(ltSongFile);
        payload = { ...payload, song: songUrl };
      }
      const id = await createLetter(payload);
      setLtId(id);
    } catch (err) {
      setLtError(err instanceof Error ? err.message : "Could not create the letter link. Please try again.");
    } finally {
      setLtCreating(false);
    }
  }



  async function copyLetterLink() {
    if (!letterUrl) return;
    try {
      await navigator.clipboard.writeText(letterUrl);
      setLtCopied(true);
      setTimeout(() => setLtCopied(false), 1500);
    } catch { /* ignore */ }
  }

  // ── Soundscape + closing moment ─────────────────────────────────────
  const soundscape = useSoundscape();
  const [showClosing, setShowClosing] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Aurora photo backdrop */}
      <div
        className="pointer-events-none fixed inset-0 h-full w-full bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${auroraBg})` }}
      />
      {/* Dark scrim so text stays readable over the photo */}
      <div className="pointer-events-none fixed inset-0 bg-background/70" />
      <StarField seed={42} className="pointer-events-none fixed inset-0 h-full w-full opacity-50" count={140} />
      <div className="pointer-events-none fixed inset-0" style={{ background: "radial-gradient(ellipse at 50% 0%, oklch(0.3 0.12 280 / 0.35), transparent 60%)" }} />

      <SoundscapeControl current={soundscape.current} onSelect={soundscape.select} />

      {/* Cinematic above-the-fold hero */}
      <section className="relative flex min-h-[88vh] flex-col items-center justify-center px-6 text-center">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[60vmin] w-[60vmin] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl" style={{ background: "radial-gradient(circle, oklch(0.8 0.08 280 / 0.45), transparent 70%)" }} />
        <div className="relative animate-fade-in">
          <div className="mx-auto mb-8 flex justify-center">
            <MoonSvg phaseAngle={todayMoon.phaseAngle} illumination={todayMoon.illumination} waxing={todayMoon.waxing} size={120} />
          </div>
          <h1 className="text-balance font-display text-6xl leading-[1.02] tracking-tight md:text-8xl">Sky We Share</h1>
          <p className="mx-auto mt-6 max-w-md text-balance text-base italic text-muted-foreground md:text-lg">
            The sky remembers what we choose to keep.
          </p>
          <p className="mx-auto mt-4 max-w-md text-balance text-sm text-muted-foreground/80">
            A verified night sky, turned into a letter, postcard, and bouquet — delivered as one link, anywhere in the world.
          </p>
          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#begin"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-xs tracking-[0.3em] text-primary-foreground uppercase transition-colors hover:bg-primary/90"
            >
              Create a gift <span aria-hidden>↓</span>
            </a>
            <a
              href={DEMO_LETTER_PATH}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-accent/40 px-6 py-3 text-xs tracking-[0.3em] text-accent uppercase transition-colors hover:bg-accent/10"
            >
              See a real example ↗
            </a>
          </div>
        </div>
      </section>

      <HowItWorks />
      <SocialProof />
      <PricingAndTrust />

      {/* Personalized intro */}
      <section className="relative mx-auto flex max-w-5xl flex-col items-center px-6 pt-24 pb-12 text-center md:pt-32">
        <p className="font-display text-sm tracking-[0.4em] text-accent uppercase">A diary in moonlight</p>
        <h2 className="mt-6 text-balance font-display text-4xl leading-[1.05] md:text-6xl">
          The sky we&apos;ve shared with <em className="text-accent not-italic">{personName}</em>,
          <br />
          <span className="text-muted-foreground/80">
            since {birth.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}
          </span>
        </h2>
        <p className="mt-6 max-w-xl text-balance text-base text-muted-foreground md:text-lg">
          {diarySubtitle(applied.occasion, applied.city)}
        </p>
      </section>

      {/* Birth details form */}
      <section id="begin" className="relative mx-auto max-w-3xl px-6 pb-16 scroll-mt-20">
        <form
          onSubmit={submit}
          className="rounded-2xl border border-border bg-card/40 p-6 backdrop-blur-sm md:p-8"
        >
          <p className="font-display text-xs tracking-[0.3em] text-accent uppercase">{possessive} birth details</p>
          <h2 className="mt-2 font-display text-2xl md:text-3xl">When and where the sky opened for {personName}</h2>
          <p className="mt-2 text-sm text-muted-foreground">We calculate the rest from your city automatically.</p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name" error={errors.name}>
              <input
                type="text"
                value={form.name}
                maxLength={60}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Aanya, Arjun, Sam"
                className="input"
              />
            </Field>
            <Field label="Pronouns" error={errors.pronoun}>
              <select
                value={form.pronoun}
                onChange={(e) => setForm({ ...form, pronoun: e.target.value as Pronoun })}
                className="input"
              >
                {PRONOUN_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Birth date" error={errors.date}>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="input"
                max="2100-12-31"
              />
            </Field>
            <Field label="City" error={errors.city}>
              <input
                list="cities"
                type="text"
                value={form.city}
                maxLength={80}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Tokyo · São Paulo · Salem · Cairo"
                className="input"
                autoComplete="off"
              />
              <datalist id="cities">
                {citySuggestions.map((c) => <option key={c.name} value={c.name} />)}
              </datalist>
              {!cityKnown && form.city.trim().length >= 2 && (
                <p className="mt-1.5 text-xs text-amber-300/80">
                  Approximate location — set exact latitude &amp; longitude in Advanced settings for a precise sky.
                </p>
              )}
            </Field>

            <Field label="Occasion" error={errors.occasion}>
              <select
                value={form.occasion}
                onChange={(e) => setForm({ ...form, occasion: e.target.value as LetterOccasion })}
                className="input"
              >
                {LETTER_OCCASIONS.map((o) => <option key={o} value={o}>{OCCASION_LABELS[o]}</option>)}
              </select>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Sets the tone here and carries through to the letter and bouquet.
              </p>
            </Field>

          </div>

          {/* Advanced settings — hidden by default */}
          <button
            type="button"
            onClick={() => setShowAdvanced((s) => !s)}
            className="mt-5 inline-flex items-center gap-1.5 text-xs tracking-[0.2em] text-accent uppercase transition-colors hover:text-foreground"
          >
            Advanced settings <span aria-hidden>{showAdvanced ? "↑" : "↓"}</span>
          </button>

          {showAdvanced && (
            <div className="mt-4 grid grid-cols-1 gap-4 rounded-xl border border-border/60 bg-card/30 p-4 sm:grid-cols-2 animate-fade-in">
              <Field label="Birth time (local)" error={errors.time}>
                <input
                  type="time"
                  value={form.time}
                  disabled={form.mode !== "custom"}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className="input disabled:opacity-40"
                />
                {form.mode !== "custom" && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Ignored while computing at local {form.mode}.
                  </p>
                )}
              </Field>
              <Field label="UTC offset (hours)" error={errors.tz}>
                <input
                  type="number"
                  step="0.25"
                  min={-12}
                  max={14}
                  value={form.tz}
                  onChange={(e) => setForm({ ...form, tz: Number(e.target.value) })}
                  className="input"
                />
              </Field>
              <Field label="Latitude (°N)" error={errors.lat}>
                <input
                  type="number"
                  step="0.0001"
                  min={-90}
                  max={90}
                  value={form.lat}
                  onChange={(e) => setForm({ ...form, lat: Number(e.target.value) })}
                  className="input"
                />
              </Field>
              <Field label="Longitude (°E)" error={errors.lon}>
                <input
                  type="number"
                  step="0.0001"
                  min={-180}
                  max={180}
                  value={form.lon}
                  onChange={(e) => setForm({ ...form, lon: Number(e.target.value) })}
                  className="input"
                />
              </Field>
            </div>
          )}

          {/* Saved locations */}
          <div className="mt-6 rounded-xl border border-border/60 bg-card/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">Saved locations</p>
              <button
                type="button"
                onClick={saveCurrentAsPreset}
                disabled={!form.city.trim() || isSavedMatch}
                className="rounded-md border border-accent/40 px-3 py-1 text-xs tracking-widest text-accent uppercase transition-colors hover:bg-accent/10 disabled:opacity-40"
              >
                {isSavedMatch ? "Already saved" : "Save current location"}
              </button>
            </div>
            {savedPresets.length === 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Save any city — even a tiny Tamil Nadu hometown — and it stays here on this device for next time.
              </p>
            ) : (
              <ul className="mt-3 flex flex-wrap gap-2">
                {savedPresets.map((p) => (
                  <li key={p.name} className="flex items-center gap-1 rounded-full border border-border/60 bg-card/50 py-1 pr-1 pl-3 text-xs">
                    <button
                      type="button"
                      onClick={() => setCity(p.name)}
                      className="text-foreground/90 transition-colors hover:text-accent"
                      title={`${p.lat.toFixed(3)}°N, ${p.lon.toFixed(3)}°E · UTC${p.tz >= 0 ? "+" : ""}${p.tz}`}
                    >
                      {p.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSavedPreset(p.name)}
                      aria-label={`Remove ${p.name}`}
                      className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/20 hover:text-destructive"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-6">
            <span className="mb-2 block text-xs tracking-[0.2em] text-muted-foreground uppercase">Compute the sky at</span>
            <div className="inline-flex rounded-md border border-border bg-card/30 p-1">
              {MODE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setForm({ ...form, mode: opt })}
                  className={`rounded px-4 py-1.5 text-xs tracking-[0.2em] uppercase transition-colors ${
                    form.mode === opt
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt === "custom" ? "Birth time" : `Local ${opt}`}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Sunrise &amp; sunset are computed per year from latitude &amp; longitude — so the moon and stars reflect the actual night-time window each year.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Picking a preset city auto-fills offset, latitude, and longitude.
            </p>
            <button
              type="submit"
              className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Update the sky
            </button>
          </div>
        </form>
      </section>

      {/* Stats */}
      <section className="relative mx-auto max-w-5xl px-6 pb-20">
        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
          <StatCard label={`Days with ${personName} under the stars`} value={now ? totalDays.toLocaleString() : "—"} />
          <StatCard label="Sun sign" value={`${birthZodiac.symbol} ${birthZodiac.sign}`} sub={`${birthZodiac.element} · ruled by ${birthZodiac.ruling}`} />
          <StatCard label="Moon tonight" value={todayMoon.name} sub={`${Math.round(todayMoon.illumination * 100)}% illuminated`} />
        </div>
      </section>

      {/* The night they were born — moon is the centerpiece; this section IS the live example linked from the hero */}
      <section id="example" className="relative mx-auto max-w-3xl px-6 pb-28 text-center">
        <p className="font-display text-xs tracking-[0.3em] text-accent uppercase">{OCCASION_EYEBROW[applied.occasion]}</p>
        <h2 className="mt-2 font-display text-3xl md:text-4xl">{fmtDate(birth, applied.tz)}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{birthTimeLabel} · {applied.city} · {tzText}</p>

        <div className="my-12 flex justify-center">
          {birthValidation.coreOk ? (
            <div className="h-[220px] w-[220px] md:h-[300px] md:w-[300px]">
              <MoonSvg phaseAngle={birthMoon.phaseAngle} illumination={birthMoon.illumination} waxing={birthMoon.waxing} size={300} />
            </div>
          ) : (
            <div className="flex h-[220px] w-[220px] items-center justify-center rounded-full border border-amber-500/40 text-center text-xs text-amber-200 md:h-[300px] md:w-[300px]">Unable to verify</div>
          )}
        </div>

        <div className="mx-auto max-w-2xl text-left">
          <p className="font-display text-2xl md:text-3xl">{birthMoon.name}</p>
          <p className="mt-3 text-muted-foreground">
            {nightOneOpening(applied.occasion, pronouns.subject, pronouns.was)}, {applied.city} slept beneath a{" "}
            <span className="text-foreground">{birthMoon.name.toLowerCase()}</span> —{" "}
            <span className="text-foreground">
              {birthMoon.illumination * 100 >= 0.05 ? (birthMoon.illumination * 100).toFixed(1) : (birthMoon.illumination * 100).toFixed(2)}%
            </span>{" "}
            lit, {birthMoon.age.toFixed(1)} days into its journey,{" "}
            {birthMoon.waxing ? "still filling with light" : "quietly letting its light go"}, drifting through{" "}
            <span className="text-foreground">{birthMoon.constellation}</span>.
          </p>
              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-muted-foreground sm:grid-cols-3">
                {birthRiseSet.moonrise && (
                  <div><dt className="tracking-[0.2em] uppercase">Moonrise</dt><dd className="text-foreground/90">{fmtTime(birthRiseSet.moonrise, applied.tz)}</dd></div>
                )}
                {birthRiseSet.moonset && (
                  <div><dt className="tracking-[0.2em] uppercase">Moonset</dt><dd className="text-foreground/90">{fmtTime(birthRiseSet.moonset, applied.tz)}</dd></div>
                )}
                {birthRiseSet.sunrise && (
                  <div><dt className="tracking-[0.2em] uppercase">Sunrise</dt><dd className="text-foreground/90">{fmtTime(birthRiseSet.sunrise, applied.tz)}</dd></div>
                )}
                {birthRiseSet.sunset && (
                  <div><dt className="tracking-[0.2em] uppercase">Sunset</dt><dd className="text-foreground/90">{fmtTime(birthRiseSet.sunset, applied.tz)}</dd></div>
                )}
                {birthNextPhase && (
                  <div className="col-span-2"><dt className="tracking-[0.2em] uppercase">Next phase</dt><dd className="text-foreground/90">{birthNextPhase.name} · {fmtDate(birthNextPhase.date, applied.tz)} {fmtTime(birthNextPhase.date, applied.tz)}</dd></div>
                )}
              </dl>

              {/* Poetic line — generated ONLY from verified astronomy */}
              <p className="mt-5 border-l-2 border-accent/40 pl-4 font-display text-lg leading-relaxed text-foreground/90 italic">
                "{poetic}"
              </p>

              {/* Confidence badge */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] tracking-[0.2em] uppercase ${
                  birthValidation.confidence === "VERIFIED"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : birthValidation.confidence === "VERIFIED_PARTIAL"
                      ? "border-sky-500/30 bg-sky-500/10 text-sky-300"
                      : "border-amber-500/40 bg-amber-500/10 text-amber-300"
                }`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {confidenceTag(birthValidation.confidence)} · {confidenceLabel(birthValidation.confidence)}
                </span>
                <span className="text-[10px] tracking-[0.25em] text-muted-foreground/70 uppercase">
                  {tzText} · {birthIllumStr}% · age {birthMoon.age.toFixed(2)}d
                </span>
              </div>
              {birthValidation.coreOk && birthValidation.optionalReasons.length > 0 && (
                <p className="mt-2 text-xs text-sky-200/70">Some secondary metadata unavailable.</p>
              )}
              {!birthValidation.coreOk && (
                <ul className="mt-2 list-disc pl-5 text-xs text-amber-200/80">
                  {birthValidation.coreReasons.map((r) => <li key={r}>{r}</li>)}
                </ul>
              )}
        </div>
      </section>

      {/* Unified gift experience — Letter · Postcard · Bouquet */}
      <section className="relative mx-auto max-w-4xl px-6 pb-24">
        <div className="mb-10 text-center">
          <p className="font-display text-xs tracking-[0.3em] text-accent uppercase">Made under the same sky</p>
          <h2 className="mt-3 font-display text-3xl md:text-5xl">Create a gift</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            One link, three chapters — a handwritten letter, a vintage moon postcard, and a bouquet — that unfold together when {personName} opens it.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card/40 p-6 backdrop-blur-sm md:p-8">
          <GiftWizard
            base={{
              v: 1,
              name: applied.name,
              pronoun: applied.pronoun,
              date: applied.date,
              time: applied.time,
              city: applied.city,
              tz: applied.tz,
              lat: applied.lat,
              lon: applied.lon,
              mode: applied.mode,
            }}
            occasion={applied.occasion}
            moon={birthMoon}
            city={applied.city}
            dateLabel={dateLabelShort}
            timeLabel={birthTimeLabel}
            sunriseLabel={birthRiseSet.sunrise ? fmtTime(birthRiseSet.sunrise, applied.tz) : undefined}
            sunsetLabel={birthRiseSet.sunset ? fmtTime(birthRiseSet.sunset, applied.tz) : undefined}
            moonriseLabel={birthRiseSet.moonrise ? fmtTime(birthRiseSet.moonrise, applied.tz) : undefined}
            moonsetLabel={birthRiseSet.moonset ? fmtTime(birthRiseSet.moonset, applied.tz) : undefined}
            illumPct={birthIllumStr}
            milestones={pcMilestones}
            personName={personName}
          />
        </div>
      </section>

      {/* Timeline */}
      <section className="relative mx-auto max-w-6xl px-6 pb-32">
        <div className="mb-12 text-center">
          <p className="font-display text-xs tracking-[0.3em] text-accent uppercase">Every year, the same date</p>
          <h2 className="mt-3 font-display text-3xl md:text-5xl">A different moon, each time</h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {years.map((d) => (
            <YearCard
              key={d.getTime()}
              date={d}
              tz={applied.tz}
              lat={applied.lat}
              lon={applied.lon}
              birthYear={birthYear}
              currentYear={currentYear}
              mode={applied.mode}
              occasion={applied.occasion}
            />
          ))}
        </div>
      </section>

      <FAQ />

      {/* Closing moment — a quiet breath before the end */}
      {showClosing && (
        <section className="relative mx-auto flex max-w-2xl flex-col items-center px-6 pb-32 text-center">
          <div className="mb-10 flex justify-center">
            <MoonSvg phaseAngle={todayMoon.phaseAngle} illumination={todayMoon.illumination} waxing={todayMoon.waxing} size={96} />
          </div>
          <p className="max-w-md text-balance text-sm italic text-muted-foreground/90">
            The sky remembers what we choose to keep.
          </p>
          <p className="mt-6 font-display text-xs tracking-[0.4em] text-accent uppercase">The same sky, still turning</p>
          <h2 className="mt-6 text-balance font-display text-3xl leading-[1.1] md:text-5xl">
            Tonight the moon hangs over {applied.city}, as it once did the night {personName} arrived.
          </h2>
          <p className="mt-6 max-w-md text-balance text-sm text-muted-foreground md:text-base">
            Nothing here is invented. Every phase, every rise and set, is computed from the real
            positions of the Sun and Moon — a quiet record kept for {personName}.
          </p>
          <a
            href="#begin"
            className="mt-12 inline-flex items-center gap-2 rounded-full border border-accent/40 px-6 py-3 text-xs tracking-[0.3em] text-accent uppercase transition-colors hover:bg-accent/10"
          >
            Begin again <span aria-hidden>↑</span>
          </a>
        </section>
      )}

      <footer className="relative border-t border-border/50 py-10 text-center text-xs tracking-widest text-muted-foreground uppercase">
        <p className="mb-2 text-[11px] italic normal-case tracking-normal text-muted-foreground/80">
          Made by the creator, with everlasting love for the woman who loved moongazing.
        </p>
        Made under the same sky · for {personName} · {applied.city}
        <p className="mt-4 text-[10px] normal-case tracking-normal text-muted-foreground/60">
          {/* TODO: wire these to real pages before launch */}
          [Add: contact email · privacy policy · refund policy]
        </p>
      </footer>
    </main>
  );
}


function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs tracking-[0.2em] text-muted-foreground uppercase">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/30 p-5 backdrop-blur-sm">
      <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">{label}</p>
      <p className="mt-3 font-display text-2xl text-foreground">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function YearCard({ date, tz, lat, lon, birthYear, currentYear, mode, occasion }: {
  date: Date; tz: number; lat: number; lon: number; birthYear: number; currentYear: number; mode: Mode; occasion: LetterOccasion;
}) {
  const m = accurateMoon(date);
  const shifted = new Date(date.getTime() + tz * 3_600_000);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth() + 1;
  const day = shifted.getUTCDate();
  const rs = riseSetForCivilDate(year, month, day, tz, lat, lon);
  const validation = validateMoon(m);
  const seed = year * 10000 + month * 100 + day;
  const age = year - birthYear;
  const ageLabel = occasion === "birthday" ? (age === 0 ? "Night 1" : `Year ${age}`) : `Year ${age}`;
  const dateLabel = shifted.toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
  });
  const timeLabel = timeWithVerifiedEvent(date, tz, rs);
  const illumPct = m.illumination * 100;
  const illumStr = illumPct >= 1 ? illumPct.toFixed(1) : illumPct.toFixed(2);

  const isRecent = year === currentYear && currentYear !== birthYear;
  const isMilestone = !isRecent && age > 0 && isMilestoneAge(age);

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border bg-card/30 p-6 backdrop-blur-sm transition-all hover:bg-card/50 ${
        isRecent
          ? "border-accent/70 shadow-[0_0_0_1px_hsl(var(--accent)/0.4),0_0_26px_hsl(var(--accent)/0.28)] hover:border-accent"
          : isMilestone
            ? "border-amber-300/50 shadow-[0_0_0_1px_rgba(243,201,105,0.35),0_0_18px_rgba(243,201,105,0.22)] hover:border-amber-300/70"
            : "border-border hover:border-accent/60"
      }`}
    >
      <StarField seed={seed} rich={false} className="pointer-events-none absolute inset-0 h-full w-full opacity-40 transition-opacity group-hover:opacity-70" count={40} />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs tracking-[0.25em] text-accent uppercase">{ageLabel}</p>
          <p className="mt-1 font-display text-2xl">{dateLabel}</p>
          <p className="text-xs text-muted-foreground">{timeLabel}</p>
        </div>
        {isRecent ? (
          <span className="rounded-full border border-accent/60 bg-accent/15 px-2 py-0.5 text-[10px] tracking-widest text-accent uppercase">
            This year
          </span>
        ) : isMilestone ? (
          <span className="rounded-full border border-amber-300/60 bg-amber-300/15 px-2 py-0.5 text-[10px] tracking-widest text-amber-200 uppercase">
            Milestone
          </span>
        ) : (
          <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] tracking-widest text-muted-foreground uppercase">
            {year === birthYear ? "Birth" : ""}
          </span>
        )}
      </div>


      <div className="relative mt-6 flex justify-center">
        {validation.coreOk ? (
          <MoonSvg phaseAngle={m.phaseAngle} illumination={m.illumination} waxing={m.waxing} size={130} />
        ) : (
          <div className="flex h-[130px] w-[130px] items-center justify-center rounded-full border border-amber-500/40 text-center text-[10px] text-amber-200">Unable to verify</div>
        )}
      </div>

      <div className="relative mt-6 space-y-1.5">
        <p className="font-display text-lg text-foreground">{m.name}</p>
        <p className="text-xs text-muted-foreground">
          {illumStr}% illuminated · age {m.age.toFixed(1)}d · {m.waxing ? "waxing" : "waning"}
        </p>
        <p className="text-xs text-muted-foreground">
          Moon in <span className="text-foreground/90">{m.constellationSymbol} {m.constellation}</span>
        </p>
        {(rs.moonrise || rs.moonset) && (
          <p className="text-[11px] text-muted-foreground/90">
            {rs.moonrise && <>rise <span className="text-foreground/85">{fmtTime(rs.moonrise, tz)}</span></>}
            {rs.moonrise && rs.moonset && " · "}
            {rs.moonset && <>set <span className="text-foreground/85">{fmtTime(rs.moonset, tz)}</span></>}
          </p>
        )}
      </div>
    </article>
  );
  }

// ── New sections for a first-time, worldwide visitor ──────────────────
// These sit around the existing cinematic core without changing its behavior.
// Anything in [brackets] below is a placeholder — replace with real copy,
// numbers, and policies before this goes live to paying strangers.

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Tell us the moment",
      body: "A birth, a first meeting, a proposal, a memory — just a date, time, and place.",
    },
    {
      n: "02",
      title: "We verify the sky",
      body: "Real positions of the Sun and Moon are computed for that exact moment — nothing invented, nothing generic.",
    },
    {
      n: "03",
      title: "They open it, live",
      body: "One link unfolds into a handwritten letter, a moon postcard, and a bouquet — anywhere in the world.",
    },
  ];
  return (
    <section className="relative mx-auto max-w-5xl px-6 pb-24">
      <div className="mb-12 text-center">
        <p className="font-display text-xs tracking-[0.3em] text-accent uppercase">How it works</p>
        <h2 className="mt-3 font-display text-3xl md:text-5xl">Three steps, one gift</h2>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {steps.map((s) => (
          <div key={s.n} className="rounded-2xl border border-border bg-card/30 p-6 backdrop-blur-sm">
            <p className="font-display text-3xl text-accent/70">{s.n}</p>
            <p className="mt-3 font-display text-xl text-foreground">{s.title}</p>
            <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// TODO: replace with real sender quotes once you have them.
// Leaving this array empty hides the section entirely — do NOT fill it
// with invented reviews just to make the page look more trafficked.
const TESTIMONIALS: { quote: string; context: string }[] = [
  // { quote: "…", context: "Sent to a father, on his 60th birthday" },
];

function SocialProof() {
  if (TESTIMONIALS.length === 0) return null;
  return (
    <section className="relative mx-auto max-w-5xl px-6 pb-24">
      <div className="mb-12 text-center">
        <p className="font-display text-xs tracking-[0.3em] text-accent uppercase">Real gifts, real moments</p>
        <h2 className="mt-3 font-display text-3xl md:text-5xl">Trusted to carry the right words</h2>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card/30 p-6 backdrop-blur-sm">
            <p className="text-sm italic text-foreground/90">&ldquo;{t.quote}&rdquo;</p>
            <p className="mt-4 text-xs tracking-[0.15em] text-muted-foreground uppercase">{t.context}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// TODO: wire this to your real price/currency logic (Stripe/Razorpay), and
// replace the bracketed policy text with your actual terms before launch.
const PRICE_DISPLAY = "[$—]";

function PricingAndTrust() {
  return (
    <section className="relative mx-auto max-w-4xl px-6 pb-24">
      <div className="rounded-2xl border border-accent/30 bg-card/40 p-6 text-center backdrop-blur-sm md:p-10">
        <p className="font-display text-xs tracking-[0.3em] text-accent uppercase">Simple, one-time price</p>
        <p className="mt-4 font-display text-5xl text-foreground">{PRICE_DISPLAY}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          One gift, three chapters, delivered as a single link. No subscription.
        </p>
        <a
          href="#begin"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-xs tracking-[0.3em] text-primary-foreground uppercase transition-colors hover:bg-primary/90"
        >
          Create a gift <span aria-hidden>↓</span>
        </a>

        <div className="mt-10 grid grid-cols-1 gap-4 border-t border-border/50 pt-8 text-left sm:grid-cols-3">
          <div>
            <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">Payments</p>
            <p className="mt-1 text-sm text-foreground/90">Cards, UPI &amp; Razorpay, via Stripe</p>
          </div>
          <div>
            <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">Your data</p>
            <p className="mt-1 text-sm text-foreground/90">
              [State plainly what you store from the birth-details form, for how long, and who can see it.]
            </p>
          </div>
          <div>
            <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">Refunds</p>
            <p className="mt-1 text-sm text-foreground/90">[State your real refund/cancellation policy here.]</p>
          </div>
        </div>
      </div>
    </section>
  );
}

const FAQS: { q: string; a: string }[] = [
  {
    q: "Is the sky actually accurate?",
    a: "Yes. Every phase, illumination percentage, and rise/set time is computed from the real positions of the Sun and Moon for the exact date, time, and place you enter.",
  },
  {
    q: "What if I don't know the exact birth time?",
    a: "You can compute the sky at local sunrise or sunset instead — the moon phase itself barely changes across a single day, so the result stays accurate.",
  },
  {
    q: "Is my data private?",
    a: "[State clearly what you store, for how long, and who can access it — important for a product built on birth dates and locations.]",
  },
  {
    q: "Will they need an account to receive it?",
    a: "No — the gift opens from a single link, no sign-up required on their end.",
  },
  {
    q: "What if they're not into astronomy?",
    a: "The sky is the frame, not the point — the letter and the words you write are what carry the meaning.",
  },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="relative mx-auto max-w-3xl px-6 pb-28">
      <div className="mb-10 text-center">
        <p className="font-display text-xs tracking-[0.3em] text-accent uppercase">Before you begin</p>
        <h2 className="mt-3 font-display text-3xl md:text-5xl">Questions</h2>
      </div>
      <div className="divide-y divide-border/50 rounded-2xl border border-border bg-card/30 backdrop-blur-sm">
        {FAQS.map((f, i) => (
          <div key={i} className="p-5">
            <button
              type="button"
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between gap-4 text-left"
            >
              <span className="font-display text-base text-foreground md:text-lg">{f.q}</span>
              <span className="text-accent" aria-hidden>{open === i ? "\u2212" : "+"}</span>
            </button>
            {open === i && <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
