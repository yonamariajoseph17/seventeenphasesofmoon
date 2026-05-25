import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { toPng } from "html-to-image";
import { zodiacFor } from "@/lib/astro";
import { accurateMoon, riseSetForCivilDate, nextPhaseTransition, eventMomentForCivilDate, type AstroEventKind, type RiseSet } from "@/lib/astro-accurate";
import { validateMoon } from "@/lib/moon-validate";
import { moonVisualDescription } from "@/lib/moon-visual";
import { poeticLine } from "@/lib/poetic";
import { milestoneFor } from "@/lib/milestones";
import { MoonSvg } from "@/components/MoonSvg";
import { StarField } from "@/components/StarField";
import { Postcard, POSTCARD_STYLES, POSTCARD_FORMATS, type PostcardStyle, type PostcardFormat } from "@/components/Postcard";
import { encodeLetter, LETTER_STYLES, type LetterStyle } from "@/lib/letter";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Their Sky · A diary in moonlight" },
      { name: "description", content: "Every birthday's moon phase and night sky, traced from the first night to today — for anyone you love." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Inter:wght@300;400;500;600&display=swap" },
    ],
  }),
});

type CityPreset = { name: string; tz: number; lat: number; lon: number };

const BUILTIN_PRESETS: CityPreset[] = [
  // Tamil Nadu
  { name: "Coimbatore, Tamil Nadu", tz: 5.5, lat: 11.0168, lon: 76.9558 },
  { name: "Chennai, Tamil Nadu", tz: 5.5, lat: 13.0827, lon: 80.2707 },
  { name: "Madurai, Tamil Nadu", tz: 5.5, lat: 9.9252, lon: 78.1198 },
  { name: "Tiruchirappalli, Tamil Nadu", tz: 5.5, lat: 10.7905, lon: 78.7047 },
  { name: "Salem, Tamil Nadu", tz: 5.5, lat: 11.6643, lon: 78.146 },
  { name: "Erode, Tamil Nadu", tz: 5.5, lat: 11.341, lon: 77.7172 },
  { name: "Tirunelveli, Tamil Nadu", tz: 5.5, lat: 8.7139, lon: 77.7567 },
  { name: "Vellore, Tamil Nadu", tz: 5.5, lat: 12.9165, lon: 79.1325 },
  { name: "Thoothukudi, Tamil Nadu", tz: 5.5, lat: 8.7642, lon: 78.1348 },
  { name: "Thanjavur, Tamil Nadu", tz: 5.5, lat: 10.787, lon: 79.1378 },
  { name: "Kanyakumari, Tamil Nadu", tz: 5.5, lat: 8.0883, lon: 77.5385 },
  { name: "Ooty, Tamil Nadu", tz: 5.5, lat: 11.4102, lon: 76.695 },
  // India
  { name: "Mumbai, India", tz: 5.5, lat: 19.076, lon: 72.8777 },
  { name: "Bengaluru, India", tz: 5.5, lat: 12.9716, lon: 77.5946 },
  { name: "Delhi, India", tz: 5.5, lat: 28.6139, lon: 77.209 },
  { name: "Hyderabad, India", tz: 5.5, lat: 17.385, lon: 78.4867 },
  { name: "Kolkata, India", tz: 5.5, lat: 22.5726, lon: 88.3639 },
  { name: "Kochi, India", tz: 5.5, lat: 9.9312, lon: 76.2673 },
  { name: "Thiruvananthapuram, India", tz: 5.5, lat: 8.5241, lon: 76.9366 },
  // World
  { name: "London, UK", tz: 0, lat: 51.5074, lon: -0.1278 },
  { name: "Paris, France", tz: 1, lat: 48.8566, lon: 2.3522 },
  { name: "New York, USA", tz: -5, lat: 40.7128, lon: -74.006 },
  { name: "Los Angeles, USA", tz: -8, lat: 34.0522, lon: -118.2437 },
  { name: "Tokyo, Japan", tz: 9, lat: 35.6762, lon: 139.6503 },
  { name: "Sydney, Australia", tz: 10, lat: -33.8688, lon: 151.2093 },
];

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
});
type FormValues = z.infer<typeof formSchema>;

const DEFAULTS: FormValues = {
  name: "Her",
  pronoun: "she/her",
  date: "2004-04-17",
  time: "12:00",
  city: "Coimbatore, Tamil Nadu",
  tz: 5.5,
  lat: 11.0168,
  lon: 76.9558,
  mode: "sunset",
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
  const birthValidation = useMemo(() => validateMoon(birthMoon), [birthMoon]);
  const birthIllumStr = birthMoon.illumination * 100 >= 1
    ? (birthMoon.illumination * 100).toFixed(1)
    : (birthMoon.illumination * 100).toFixed(2);
  const birthTimeLabel = timeWithVerifiedEvent(birth, applied.tz, birthRiseSet);
  const birthVisualLabel = moonVisualDescription(birthMoon);

  const pronouns = PRONOUN_MAP[applied.pronoun];
  const personName = applied.name.trim() || cap(pronouns.subject);
  const possessive = `${personName}'s`;
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
    const preset = allPresets.find((c) => c.name.toLowerCase() === name.toLowerCase());
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
  const [pcFormat, setPcFormat] = useState<PostcardFormat>("square");
  const [pcRecipient, setPcRecipient] = useState("");
  const [pcOccasion, setPcOccasion] = useState("");
  const [pcMessage, setPcMessage] = useState("");
  const [exporting, setExporting] = useState(false);
  const postcardRef = useRef<HTMLDivElement>(null);

  const recipientForCard = pcRecipient.trim() || personName;
  const occasionForCard = pcOccasion.trim() || "A moon for you";
  const poetic = useMemo(() => poeticLine(birthMoon, recipientForCard), [birthMoon, recipientForCard]);

  async function downloadPostcard() {
    if (!postcardRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(postcardRef.current, {
        pixelRatio: 1,
        cacheBust: true,
        backgroundColor: undefined,
      });
      const a = document.createElement("a");
      const safeName = recipientForCard.replace(/[^a-z0-9-_]+/gi, "_").toLowerCase() || "moon";
      a.download = `moon-postcard-${safeName}-${applied.date}.png`;
      a.href = dataUrl;
      a.click();
    } finally {
      setExporting(false);
    }
  }


  return (
    <main className="relative min-h-screen overflow-hidden">
      <StarField seed={42} className="pointer-events-none fixed inset-0 h-full w-full opacity-70" count={140} />
      <div className="pointer-events-none fixed inset-0" style={{ background: "radial-gradient(ellipse at 50% 0%, oklch(0.3 0.12 280 / 0.4), transparent 60%)" }} />

      {/* Hero */}
      <section className="relative mx-auto flex max-w-5xl flex-col items-center px-6 pt-20 pb-12 text-center md:pt-28">
        <p className="font-display text-sm tracking-[0.4em] text-accent uppercase">A love letter in moonlight</p>
        <h1 className="mt-6 text-balance font-display text-5xl leading-[1.05] md:text-7xl">
          The sky we&apos;ve shared with <em className="text-accent">{personName}</em>,
          <br />
          <span className="text-muted-foreground/80">
            since {birth.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}
          </span>
        </h1>
        <p className="mt-6 max-w-xl text-balance text-base text-muted-foreground md:text-lg">
          Every birthday, the moon returns a little different. Here is its quiet diary — drawn over {applied.city},
          from the night {pronouns.subject} arrived to the sky tonight.
        </p>
      </section>

      {/* Birth details form */}
      <section className="relative mx-auto max-w-3xl px-6 pb-16">
        <form
          onSubmit={submit}
          className="rounded-2xl border border-border bg-card/40 p-6 backdrop-blur-sm md:p-8"
        >
          <p className="font-display text-xs tracking-[0.3em] text-accent uppercase">{possessive} birth details</p>
          <h2 className="mt-2 font-display text-2xl md:text-3xl">When and where the sky opened for {pronouns.object}</h2>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Their name" error={errors.name}>
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
            <Field label="Birth time (local)" error={errors.time}>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="City" error={errors.city}>
              <input
                list="cities"
                type="text"
                value={form.city}
                maxLength={80}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City, region"
                className="input"
              />
              <datalist id="cities">
                {allPresets.map((c) => <option key={c.name} value={c.name} />)}
              </datalist>
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
              Sunrise &amp; sunset are computed per year from latitude &amp; longitude — so the moon and stars reflect the actual night-time window each birthday.
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
          <StatCard label={`Days with ${personName} under the stars`} value={totalDays.toLocaleString()} />
          <StatCard label="Sun sign" value={`${birthZodiac.symbol} ${birthZodiac.sign}`} sub={`${birthZodiac.element} · ruled by ${birthZodiac.ruling}`} />
          <StatCard label="Moon tonight" value={`${todayMoon.emoji} ${todayMoon.name}`} sub={`${Math.round(todayMoon.illumination * 100)}% illuminated`} />
        </div>
      </section>

      {/* The night they were born */}
      <section className="relative mx-auto max-w-5xl px-6 pb-24">
        <div className="overflow-hidden rounded-2xl border border-border bg-card/40 p-8 backdrop-blur-sm md:p-12">
          <div className="grid items-center gap-10 md:grid-cols-[auto_1fr]">
            <div className="relative mx-auto">
              {birthValidation.ok ? (
                <MoonSvg phaseAngle={birthMoon.phaseAngle} illumination={birthMoon.illumination} waxing={birthMoon.waxing} size={180} />
              ) : (
                <div className="flex h-[180px] w-[180px] items-center justify-center rounded-full border border-amber-500/40 text-center text-xs text-amber-200">Unable to verify</div>
              )}
            </div>
            <div>
              <p className="font-display text-xs tracking-[0.3em] text-accent uppercase">Night one</p>
              <h2 className="mt-2 font-display text-3xl md:text-4xl">{fmtDate(birth, applied.tz)}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {birthTimeLabel} · {applied.city}
              </p>
              <p className="mt-3 text-muted-foreground">
                Above {applied.city}, the Moon was a <span className="text-foreground">{birthMoon.name.toLowerCase()}</span>
                {" "}at <span className="text-foreground">{birthMoon.illumination * 100 >= 0.05 ? (birthMoon.illumination * 100).toFixed(1) : (birthMoon.illumination * 100).toFixed(2)}%</span> illumination,
                {" "}{birthMoon.age.toFixed(1)} days into its cycle, {birthMoon.waxing ? "waxing" : "waning"}.
                {" "}Visual: <span className="text-foreground">{birthVisualLabel}</span>.
                {" "}It sat in <span className="text-foreground">{birthMoon.constellationSymbol} {birthMoon.constellation}</span> when {pronouns.subject} {pronouns.was} born.
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
                “{poetic}”
              </p>

              {/* Confidence badge */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] tracking-[0.2em] uppercase ${
                  birthValidation.ok
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : "border-amber-500/40 bg-amber-500/10 text-amber-300"
                }`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {birthValidation.ok ? "Verified astronomical calculation" : "Uncertainty detected"}
                </span>
                <span className="text-[10px] tracking-[0.25em] text-muted-foreground/70 uppercase">
                  UTC{applied.tz >= 0 ? "+" : ""}{applied.tz} · {birthIllumStr}% · age {birthMoon.age.toFixed(2)}d
                </span>
              </div>
              {!birthValidation.ok && (
                <ul className="mt-2 list-disc pl-5 text-xs text-amber-200/80">
                  {birthValidation.reasons.map((r) => <li key={r}>{r}</li>)}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Postcard / Gift */}
      <section className="relative mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-8 text-center">
          <p className="font-display text-xs tracking-[0.3em] text-accent uppercase">A keepsake of that night</p>
          <h2 className="mt-3 font-display text-3xl md:text-5xl">Create a moon postcard</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            A shareable card built entirely from verified astronomy — no invented constellations, no false claims.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          {/* Controls */}
          <div className="rounded-2xl border border-border bg-card/40 p-6 backdrop-blur-sm">
            <Field label="Recipient name">
              <input
                type="text"
                value={pcRecipient}
                maxLength={40}
                onChange={(e) => setPcRecipient(e.target.value)}
                placeholder={personName}
                className="input"
              />
            </Field>
            <div className="mt-4">
              <Field label="Occasion">
                <select
                  value={pcOccasion}
                  onChange={(e) => setPcOccasion(e.target.value)}
                  className="input"
                >
                  <option value="">A moon for you</option>
                  <option>Birthday</option>
                  <option>Anniversary</option>
                  <option>First met</option>
                  <option>Proposal</option>
                  <option>A memory</option>
                  <option>Friendship</option>
                </select>
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Personal message (optional)">
                <textarea
                  value={pcMessage}
                  maxLength={220}
                  rows={3}
                  onChange={(e) => setPcMessage(e.target.value)}
                  placeholder="A few words from you…"
                  className="input resize-none"
                />
              </Field>
            </div>

            <div className="mt-5">
              <span className="mb-2 block text-xs tracking-[0.2em] text-muted-foreground uppercase">Style</span>
              <div className="flex flex-wrap gap-2">
                {POSTCARD_STYLES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setPcStyle(s)}
                    className={`rounded-full border px-3 py-1.5 text-xs tracking-[0.15em] capitalize transition-colors ${
                      pcStyle === s
                        ? "border-accent bg-accent/15 text-accent"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <span className="mb-2 block text-xs tracking-[0.2em] text-muted-foreground uppercase">Format</span>
              <div className="inline-flex rounded-md border border-border bg-card/30 p-1">
                {(Object.keys(POSTCARD_FORMATS) as PostcardFormat[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setPcFormat(k)}
                    className={`rounded px-3 py-1.5 text-[11px] tracking-[0.2em] uppercase transition-colors ${
                      pcFormat === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{POSTCARD_FORMATS[pcFormat].label}</p>
            </div>

            <button
              type="button"
              onClick={downloadPostcard}
              disabled={exporting}
              className="mt-6 w-full rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {exporting ? "Rendering…" : "Download postcard (PNG)"}
            </button>
            <p className="mt-2 text-[10px] tracking-[0.2em] text-muted-foreground/70 uppercase">
              High-resolution · ready to share or print
            </p>
          </div>

          {/* Preview — full-resolution node scaled into view */}
          <PostcardPreview
            width={POSTCARD_FORMATS[pcFormat].w}
            height={POSTCARD_FORMATS[pcFormat].h}
          >
            <Postcard
              ref={postcardRef}
              style={pcStyle}
              format={pcFormat}
              moon={birthMoon}
              date={birth}
              tz={applied.tz}
              city={applied.city}
              recipient={recipientForCard}
              occasion={occasionForCard}
              message={pcMessage}
              poetic={poetic}
              illumPct={birthIllumStr}
              dateLabel={fmtDate(birth, applied.tz)}
              timeLabel={birthTimeLabel}
              moonriseLabel={birthRiseSet.moonrise ? fmtTime(birthRiseSet.moonrise, applied.tz) : undefined}
              moonsetLabel={birthRiseSet.moonset ? fmtTime(birthRiseSet.moonset, applied.tz) : undefined}
            />
          </PostcardPreview>

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
            />
          ))}
        </div>
      </section>

      <footer className="relative border-t border-border/50 py-10 text-center text-xs tracking-widest text-muted-foreground uppercase">
        Made under the same sky · for {personName} · {applied.city}
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

function YearCard({ date, tz, lat, lon, birthYear, currentYear, mode }: {
  date: Date; tz: number; lat: number; lon: number; birthYear: number; currentYear: number; mode: Mode;
}) {
  const m = accurateMoon(date);
  const shifted = new Date(date.getTime() + tz * 3_600_000);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth() + 1;
  const day = shifted.getUTCDate();
  const rs = riseSetForCivilDate(year, month, day, tz, lat, lon);
  const validation = validateMoon(m);
  const seed = year * 10000 + month * 100 + day;
  const ageLabel = `Turning ${year - birthYear}`;
  const dateLabel = shifted.toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
  });
  const timeLabel = timeWithVerifiedEvent(date, tz, rs);
  const illumPct = m.illumination * 100;
  const illumStr = illumPct >= 1 ? illumPct.toFixed(1) : illumPct.toFixed(2);

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-border bg-card/30 p-6 backdrop-blur-sm transition-all hover:border-accent/60 hover:bg-card/50">
      <StarField seed={seed} className="pointer-events-none absolute inset-0 h-full w-full opacity-40 transition-opacity group-hover:opacity-70" count={40} />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs tracking-[0.25em] text-accent uppercase">{ageLabel}</p>
          <p className="mt-1 font-display text-2xl">{dateLabel}</p>
          <p className="text-xs text-muted-foreground">{timeLabel}</p>
        </div>
        <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] tracking-widest text-muted-foreground uppercase">
          {year === birthYear ? "Birth" : year === currentYear ? "Now" : ""}
        </span>
      </div>

      <div className="relative mt-6 flex justify-center">
        {validation.ok ? (
          <MoonSvg phaseAngle={m.phaseAngle} illumination={m.illumination} waxing={m.waxing} size={130} />
        ) : (
          <div className="flex h-[130px] w-[130px] items-center justify-center rounded-full border border-amber-500/40 text-center text-[10px] text-amber-200">Unable to verify</div>
        )}
      </div>

      <div className="relative mt-6 space-y-1.5">
        <p className="font-display text-lg text-foreground">{m.emoji} {m.name}</p>
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
        {month === 4 && day === 17 && milestoneFor(year) && (
          <div className="mt-3 rounded-lg border border-accent/20 bg-accent/5 p-3">
            <p className="text-[10px] tracking-[0.25em] text-accent uppercase">That same day</p>
            <p className="mt-1 text-xs leading-relaxed text-foreground/85">{milestoneFor(year)}</p>
          </div>
        )}
      </div>
    </article>
  );
}

function PostcardPreview({ width, height, children }: { width: number; height: number; children: import("react").ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.001);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / width);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-black/30 p-4 backdrop-blur-sm">
      <div ref={wrapRef} className="relative w-full" style={{ aspectRatio: `${width} / ${height}` }}>
        <div
          className="absolute top-0 left-0 origin-top-left"
          style={{ width, height, transform: `scale(${scale})` }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
