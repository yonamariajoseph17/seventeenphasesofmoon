import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { moonPhase, zodiacFor, visibleConstellations, sunTimes } from "@/lib/astro";
import { MoonSvg } from "@/components/MoonSvg";
import { StarField } from "@/components/StarField";

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
    const st = sunTimes(year, month, day, lat, lon);
    if (st) return mode === "sunrise" ? st.sunrise : st.sunset;
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

// Wikipedia "On this day" events, grouped by year.
interface MilestoneEvent { year: number; text: string; url?: string }
function useMilestones(month: number, day: number) {
  const [events, setEvents] = useState<MilestoneEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    setEvents(null);
    setError(null);
    const mm = String(month).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    fetch(`https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${mm}/${dd}`)
      .then((r) => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then((data) => {
        if (cancelled) return;
        const list: MilestoneEvent[] = (data.events ?? []).map((e: { year: number; text: string; pages?: Array<{ content_urls?: { desktop?: { page?: string } } }> }) => ({
          year: e.year,
          text: e.text,
          url: e.pages?.[0]?.content_urls?.desktop?.page,
        }));
        setEvents(list);
      })
      .catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [month, day]);
  return { events, error };
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

  const birthMoon = moonPhase(birth);
  const birthZodiac = zodiacFor(birthMonth, birthDay);
  const todayMoon = now ? moonPhase(now) : birthMoon;
  const totalDays = now ? Math.max(0, Math.floor((now.getTime() - birth.getTime()) / 86_400_000)) : 0;

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
              <MoonSvg phaseFraction={birthMoon.phaseFraction} size={180} />
            </div>
            <div>
              <p className="font-display text-xs tracking-[0.3em] text-accent uppercase">Night one</p>
              <h2 className="mt-2 font-display text-3xl md:text-4xl">{fmtDate(birth, applied.tz)}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {fmtTime(birth, applied.tz)} local · {applied.city}
              </p>
              <p className="mt-3 text-muted-foreground">
                Above {applied.city}, the moon {pronouns.was === "were" ? "was" : "was"} a <span className="text-foreground">{birthMoon.name.toLowerCase()}</span>,
                {" "}{Math.round(birthMoon.illumination * 100)}% lit, {birthMoon.waxing ? "growing toward fullness" : "softening toward dark"}.
                The constellations of {visibleConstellations(birth).slice(0, 3).join(", ")} kept watch as {pronouns.subject} {pronouns.was} born.
              </p>
            </div>
          </div>
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

function YearCard({ date, tz, birthYear, currentYear, mode }: {
  date: Date; tz: number; birthYear: number; currentYear: number; mode: Mode;
}) {

  const m = moonPhase(date);
  const shifted = new Date(date.getTime() + tz * 3_600_000);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth() + 1;
  const day = shifted.getUTCDate();
  const cons = visibleConstellations(date);
  const seed = year * 10000 + month * 100 + day;
  const ageLabel = `Turning ${year - birthYear}`;
  const dateLabel = shifted.toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
  });
  const timeLabel = `${fmtTime(date, tz)} local${mode === "custom" ? "" : ` · ${mode}`}`;


  return (
    <article className="group relative overflow-hidden rounded-2xl border border-border bg-card/30 p-6 backdrop-blur-sm transition-all hover:border-accent/60 hover:bg-card/50">
      <StarField seed={seed} className="pointer-events-none absolute inset-0 h-full w-full opacity-40 transition-opacity group-hover:opacity-70" count={40} />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs tracking-[0.25em] text-accent uppercase">{ageLabel}</p>
          <p className="mt-1 font-display text-2xl">{dateLabel}</p>
          <p className="text-xs text-muted-foreground">{timeLabel} local</p>
        </div>
        <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] tracking-widest text-muted-foreground uppercase">
          {year === birthYear ? "Birth" : year === currentYear ? "Now" : ""}
        </span>
      </div>

      <div className="relative mt-6 flex justify-center">
        <MoonSvg phaseFraction={m.phaseFraction} size={130} />
      </div>

      <div className="relative mt-6 space-y-2">
        <p className="font-display text-lg text-foreground">{m.emoji} {m.name}</p>
        <p className="text-xs text-muted-foreground">
          {Math.round(m.illumination * 100)}% illuminated · age {m.age.toFixed(1)}d · {m.waxing ? "waxing" : "waning"}
        </p>
        <p className="pt-2 text-xs leading-relaxed text-muted-foreground/90">
          Overhead: <span className="text-foreground/90">{cons.slice(0, 3).join(" · ")}</span>
        </p>
      </div>
    </article>
  );
}
