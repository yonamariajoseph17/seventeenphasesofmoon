import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { decodeLetter, type LetterStyle } from "@/lib/letter";
import { accurateMoon, riseSetForCivilDate, eventMomentForCivilDate } from "@/lib/astro-accurate";
import { validateMoon } from "@/lib/moon-validate";
import { moonVisualDescription } from "@/lib/moon-visual";
import { poeticLine } from "@/lib/poetic";
import { MoonSvg } from "@/components/MoonSvg";
import { StarField } from "@/components/StarField";

export const Route = createFileRoute("/letter/$id")({
  component: LetterPage,
  head: () => ({
    meta: [
      { title: "A letter written beneath the same sky" },
      { name: "description", content: "A celestial letter — the moon that hung above a chosen night." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const STYLE_THEMES: Record<LetterStyle, { bg: string; fg: string; accent: string; sub: string; envelope: string; heading: string }> = {
  midnight: {
    bg: "radial-gradient(ellipse at 50% 0%, #14224a 0%, #08102a 55%, #02040f 100%)",
    fg: "#e8edff", accent: "#9fb3ff", sub: "#7a86b5",
    envelope: "linear-gradient(160deg, #0c1640 0%, #060b22 100%)",
    heading: "'Cormorant Garamond', serif",
  },
  romantic: {
    bg: "radial-gradient(ellipse at 30% 20%, #3a1f3a 0%, #1a0b1f 55%, #07030d 100%)",
    fg: "#f6e6ea", accent: "#f0b3c3", sub: "#c79aa9",
    envelope: "linear-gradient(160deg, #3a1f3a 0%, #1a0b1f 100%)",
    heading: "'Cormorant Garamond', serif",
  },
  vintage: {
    bg: "radial-gradient(ellipse at 50% 30%, #2a2316 0%, #14110a 60%, #0a0805 100%)",
    fg: "#efe4c8", accent: "#d4a64a", sub: "#a08b5e",
    envelope: "linear-gradient(160deg, #3a2f1c 0%, #1a1408 100%)",
    heading: "'Cormorant Garamond', serif",
  },
  archive: {
    bg: "linear-gradient(180deg, #f3eee2 0%, #e6dfcc 100%)",
    fg: "#1a1a1a", accent: "#7a5a2a", sub: "#5e554a",
    envelope: "linear-gradient(160deg, #efe6d2 0%, #d8cdb2 100%)",
    heading: "'Cormorant Garamond', serif",
  },
  minimal: {
    bg: "linear-gradient(180deg, #0a0a0f 0%, #050507 100%)",
    fg: "#ededf2", accent: "#ffffff", sub: "#8a8a96",
    envelope: "linear-gradient(160deg, #14141a 0%, #06060a 100%)",
    heading: "'Inter', sans-serif",
  },
  golden: {
    bg: "radial-gradient(ellipse at 50% 20%, #2a1d05 0%, #140d02 60%, #060300 100%)",
    fg: "#fbeec1", accent: "#f3c969", sub: "#b89858",
    envelope: "linear-gradient(160deg, #3a2705 0%, #170d02 100%)",
    heading: "'Cormorant Garamond', serif",
  },
};

function localToUtc(date: string, time: string, tzHours: number): Date {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  return new Date(Date.UTC(y, mo - 1, d, h, mi) - tzHours * 3_600_000);
}

function fmtDate(d: Date, tz: number) {
  const s = new Date(d.getTime() + tz * 3_600_000);
  return s.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}
function fmtTime(d: Date, tz: number) {
  const s = new Date(d.getTime() + tz * 3_600_000);
  return s.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
}

function LetterPage() {
  const { id } = Route.useParams();
  const payload = useMemo(() => decodeLetter(id), [id]);
  const [screen, setScreen] = useState<1 | 2 | 3>(1);
  const [opening, setOpening] = useState(false);

  if (!payload) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        <div>
          <p className="font-display text-xs tracking-[0.3em] text-muted-foreground uppercase">Letter not found</p>
          <h1 className="mt-3 font-display text-3xl">This letter could not be opened</h1>
          <p className="mt-3 text-sm text-muted-foreground">The link may be incomplete or damaged.</p>
          <Link to="/" className="mt-6 inline-block rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">Write your own moon letter</Link>
        </div>
      </main>
    );
  }

  const theme = STYLE_THEMES[payload.style];
  const [y, mo, d] = payload.date.split("-").map(Number);
  const moment = payload.mode === "custom"
    ? localToUtc(payload.date, payload.time, payload.tz)
    : eventMomentForCivilDate(y, mo, d, payload.tz, payload.lat, payload.lon, payload.mode)?.date
      ?? localToUtc(payload.date, payload.time, payload.tz);

  const moon = accurateMoon(moment);
  const validation = validateMoon(moon);
  const rise = riseSetForCivilDate(y, mo, d, payload.tz, payload.lat, payload.lon);
  const illumPct = moon.illumination * 100 >= 1
    ? (moon.illumination * 100).toFixed(1)
    : (moon.illumination * 100).toFixed(2);
  const visual = moonVisualDescription(moon);
  const poetic = poeticLine(moon, payload.to || payload.name);

  function openLetter() {
    setOpening(true);
    setTimeout(() => { setScreen(2); setOpening(false); }, 900);
  }

  return (
    <main style={{ background: theme.bg, color: theme.fg, fontFamily: "'Inter', sans-serif" }} className="relative min-h-screen overflow-hidden">
      {payload.style !== "archive" && (
        <StarField seed={(y * 31 + mo) * 31 + d} className="pointer-events-none fixed inset-0 h-full w-full opacity-60" count={120} />
      )}

      {/* SCREEN 1 — Envelope */}
      {screen === 1 && (
        <section className="relative mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
          <p className="text-[11px] tracking-[0.4em] uppercase" style={{ color: theme.accent }}>For {payload.to || payload.name}</p>
          <h1 className="mt-6 max-w-xl text-balance text-3xl leading-tight md:text-5xl" style={{ fontFamily: theme.heading, fontStyle: "italic", fontWeight: 400 }}>
            A letter written beneath the same sky
          </h1>

          <div
            className="relative mt-12 transition-all duration-700 ease-out"
            style={{
              width: "min(360px, 80vw)",
              aspectRatio: "1.6 / 1",
              transform: opening ? "translateY(-30px) rotateX(70deg) scale(0.92)" : "translateY(0) rotateX(0) scale(1)",
              opacity: opening ? 0 : 1,
              transformOrigin: "top center",
              perspective: "1000px",
            }}
          >
            <div className="absolute inset-0 rounded-md shadow-2xl" style={{ background: theme.envelope, border: `1px solid ${theme.accent}33` }} />
            {/* Flap */}
            <div className="absolute inset-x-0 top-0 h-1/2 origin-top" style={{
              background: theme.envelope,
              clipPath: "polygon(0 0, 100% 0, 50% 100%)",
              borderTop: `1px solid ${theme.accent}33`,
            }} />
            {/* Wax seal */}
            <div
              className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-2xl shadow-lg"
              style={{
                background: `radial-gradient(circle at 35% 30%, ${theme.accent}, ${theme.accent}88 70%, ${theme.accent}55)`,
                border: `1px solid ${theme.accent}`,
                color: theme.bg.includes("f3eee2") ? "#1a1a1a" : "#0a0a0a",
              }}
              aria-hidden
            >
              {moon.emoji}
            </div>
          </div>

          <button
            type="button"
            onClick={openLetter}
            disabled={opening}
            className="mt-12 rounded-full px-7 py-3 text-xs tracking-[0.3em] uppercase transition-opacity disabled:opacity-50"
            style={{ border: `1px solid ${theme.accent}`, color: theme.accent, background: "transparent" }}
          >
            {opening ? "Opening…" : "Open letter"}
          </button>
          <p className="mt-6 text-[10px] tracking-[0.3em] uppercase" style={{ color: theme.sub }}>
            {fmtDate(moment, payload.tz)} · {payload.city}
          </p>
        </section>
      )}

      {/* SCREEN 2 — Message */}
      {screen === 2 && (
        <section className="relative mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-20 text-center animate-in fade-in duration-700">
          <p className="text-[11px] tracking-[0.4em] uppercase" style={{ color: theme.accent }}>For {payload.to || payload.name}</p>
          <div className="mt-10 max-w-xl">
            {payload.msg ? (
              <p className="text-balance text-2xl leading-relaxed md:text-3xl" style={{ fontFamily: theme.heading, fontStyle: "italic", fontWeight: 400 }}>
                “{payload.msg}”
              </p>
            ) : (
              <p className="text-balance text-2xl leading-relaxed md:text-3xl" style={{ fontFamily: theme.heading, fontStyle: "italic", fontWeight: 400 }}>
                I wanted to show you the moon that existed the night you were here.
              </p>
            )}
            {payload.from && (
              <p className="mt-8 text-sm tracking-[0.3em] uppercase" style={{ color: theme.sub }}>— {payload.from}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setScreen(3)}
            className="mt-14 rounded-full px-7 py-3 text-xs tracking-[0.3em] uppercase"
            style={{ background: theme.accent, color: theme.bg.includes("f3eee2") ? "#ffffff" : "#0a0a0a" }}
          >
            See your moon
          </button>
        </section>
      )}

      {/* SCREEN 3 — Moon details */}
      {screen === 3 && (
        <section className="relative mx-auto max-w-3xl px-6 py-16 animate-in fade-in duration-700 md:py-24">
          <div className="text-center">
            <p className="text-[11px] tracking-[0.4em] uppercase" style={{ color: theme.accent }}>The sky above {payload.to || payload.name}</p>
            <h1 className="mt-4 text-balance text-3xl md:text-5xl" style={{ fontFamily: theme.heading, fontStyle: "italic", fontWeight: 400 }}>
              {fmtDate(moment, payload.tz)}
            </h1>
            <p className="mt-2 text-xs tracking-[0.25em] uppercase" style={{ color: theme.sub }}>
              {fmtTime(moment, payload.tz)} local · UTC{payload.tz >= 0 ? "+" : ""}{payload.tz} · {payload.city}
            </p>
          </div>

          <div className="mt-12 flex flex-col items-center">
            {validation.ok ? (
              <MoonSvg phaseAngle={moon.phaseAngle} illumination={moon.illumination} waxing={moon.waxing} size={220} />
            ) : (
              <div className="flex h-[200px] w-[200px] items-center justify-center rounded-full text-xs" style={{ border: `1px solid ${theme.accent}66`, color: theme.accent }}>
                Unable to verify
              </div>
            )}
            <p className="mt-6 text-2xl" style={{ fontFamily: theme.heading }}>{moon.emoji} {moon.name}</p>
            <p className="mt-1 text-[11px] tracking-[0.25em] uppercase" style={{ color: theme.sub }}>{visual}</p>
          </div>

          {/* Facts (strictly scientific) */}
          <div className="mx-auto mt-12 grid max-w-xl grid-cols-2 gap-x-8 gap-y-5 text-sm">
            <Fact theme={theme} k="Moon Phase" v={moon.name} />
            <Fact theme={theme} k="Illumination" v={`${illumPct}%`} />
            <Fact theme={theme} k="Moon Age" v={`${moon.age.toFixed(1)} days`} />
            <Fact theme={theme} k="Direction" v={moon.waxing ? "Waxing" : "Waning"} />
            <Fact theme={theme} k="Constellation" v={`${moon.constellationSymbol} ${moon.constellation}`} />
            <Fact theme={theme} k="Timezone" v={`UTC${payload.tz >= 0 ? "+" : ""}${payload.tz}`} />
            <Fact theme={theme} k="Moonrise" v={rise.moonrise ? fmtTime(rise.moonrise, payload.tz) : "Unable to verify"} />
            <Fact theme={theme} k="Moonset" v={rise.moonset ? fmtTime(rise.moonset, payload.tz) : "Unable to verify"} />
          </div>

          {/* Poetry — separated */}
          <div className="mx-auto mt-12 max-w-xl text-center">
            <p className="text-[10px] tracking-[0.4em] uppercase" style={{ color: theme.sub }}>A line for the night</p>
            <p className="mt-3 text-balance text-xl leading-relaxed md:text-2xl" style={{ fontFamily: theme.heading, fontStyle: "italic" }}>
              “{poetic}”
            </p>
          </div>

          {payload.msg && (
            <div className="mx-auto mt-10 max-w-xl rounded-2xl p-6 text-center" style={{ border: `1px solid ${theme.accent}33`, background: payload.style === "archive" ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.03)" }}>
              <p className="text-[10px] tracking-[0.3em] uppercase" style={{ color: theme.sub }}>
                {payload.from ? `From ${payload.from}` : "A note for you"}
              </p>
              <p className="mt-3 text-sm leading-relaxed md:text-base">{payload.msg}</p>
            </div>
          )}

          <div className="mt-12 flex flex-wrap justify-center gap-3">
            <ShareButtons theme={theme} to={payload.to || payload.name} />
            <Link to="/" className="rounded-full px-5 py-2.5 text-[11px] tracking-[0.3em] uppercase" style={{ border: `1px solid ${theme.sub}`, color: theme.sub }}>
              Write your own
            </Link>
          </div>

          <p className="mt-10 text-center text-[10px] tracking-[0.4em] uppercase" style={{ color: theme.sub, opacity: 0.7 }}>
            Verified · astronomy-engine (VSOP87 / ELP2000)
          </p>
        </section>
      )}
    </main>
  );
}

function Fact({ theme, k, v }: { theme: typeof STYLE_THEMES[LetterStyle]; k: string; v: string }) {
  return (
    <div>
      <p className="text-[10px] tracking-[0.3em] uppercase" style={{ color: theme.sub }}>{k}</p>
      <p className="mt-1 text-base" style={{ color: theme.fg }}>{v}</p>
    </div>
  );
}

function ShareButtons({ theme, to }: { theme: typeof STYLE_THEMES[LetterStyle]; to: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : "";
  const text = `A moon letter for ${to}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  }

  const waHref = `https://wa.me/?text=${encodeURIComponent(`${text} — ${url}`)}`;

  return (
    <>
      <button
        type="button"
        onClick={copy}
        className="rounded-full px-5 py-2.5 text-[11px] tracking-[0.3em] uppercase"
        style={{ background: theme.accent, color: theme.bg.includes("f3eee2") ? "#ffffff" : "#0a0a0a" }}
      >
        {copied ? "Link copied" : "Copy link"}
      </button>
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full px-5 py-2.5 text-[11px] tracking-[0.3em] uppercase"
        style={{ border: `1px solid ${theme.accent}`, color: theme.accent }}
      >
        WhatsApp
      </a>
    </>
  );
}
