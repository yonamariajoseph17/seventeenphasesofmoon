import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { decodeLetter, type LetterStyle } from "@/lib/letter";
import { fetchLetter, buildLetterSnapshot, type LetterRecord } from "@/lib/letter-store";
import { MoonSvg } from "@/components/MoonSvg";
import { StarField } from "@/components/StarField";
import { useAmbient } from "@/lib/useAmbient";

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

function fmtDateISO(iso: string, tz: number) {
  const s = new Date(new Date(iso).getTime() + tz * 3_600_000);
  return s.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}
function fmtTimeISO(iso: string, tz: number) {
  const s = new Date(new Date(iso).getTime() + tz * 3_600_000);
  return s.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
}

type LoadState =
  | { status: "loading" }
  | { status: "ready"; record: LetterRecord }
  | { status: "notfound" };

function LetterPage() {
  const { id } = Route.useParams();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [screen, setScreen] = useState<1 | 2 | 3>(1);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    (async () => {
      // 1) Permanent, database-backed letter (short id).
      const rec = await fetchLetter(id);
      if (cancelled) return;
      if (rec) {
        setState({ status: "ready", record: rec });
        return;
      }
      // 2) Backward compatibility: legacy self-contained encoded token.
      const decoded = decodeLetter(id);
      if (decoded) {
        setState({ status: "ready", record: { payload: decoded, snapshot: buildLetterSnapshot(decoded) } });
        return;
      }
      setState({ status: "notfound" });
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (state.status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        <p className="font-display text-xs tracking-[0.3em] text-muted-foreground uppercase">Opening the sky…</p>
      </main>
    );
  }

  if (state.status === "notfound") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        <div>
          <p className="font-display text-xs tracking-[0.3em] text-muted-foreground uppercase">Letter not found</p>
          <h1 className="mt-3 font-display text-3xl">This letter could not be opened</h1>
          <p className="mt-3 text-sm text-muted-foreground">The link may be incomplete, expired, or mistyped.</p>
          <Link to="/" className="mt-6 inline-block rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">Create a Moon Letter</Link>
        </div>
      </main>
    );
  }

  const { payload, snapshot } = state.record;
  const theme = STYLE_THEMES[payload.style] ?? STYLE_THEMES.midnight;
  const seed = (() => { const [y, mo, d] = payload.date.split("-").map(Number); return (y * 31 + mo) * 31 + d; })();
  const coreOk = snapshot.confidence !== "UNAVAILABLE";
  const partial = snapshot.confidence === "VERIFIED_PARTIAL";

  function openLetter() {
    setOpening(true);
    setTimeout(() => { setScreen(2); setOpening(false); }, 900);
  }

  return (
    <main style={{ background: theme.bg, color: theme.fg, fontFamily: "'Inter', sans-serif" }} className="relative min-h-screen overflow-hidden">
      {payload.style !== "archive" && (
        <StarField seed={seed} className="pointer-events-none fixed inset-0 h-full w-full opacity-60" count={120} />
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
            <div className="absolute inset-x-0 top-0 h-1/2 origin-top" style={{
              background: theme.envelope,
              clipPath: "polygon(0 0, 100% 0, 50% 100%)",
              borderTop: `1px solid ${theme.accent}33`,
            }} />
            <div
              className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-2xl shadow-lg"
              style={{
                background: `radial-gradient(circle at 35% 30%, ${theme.accent}, ${theme.accent}88 70%, ${theme.accent}55)`,
                border: `1px solid ${theme.accent}`,
                color: theme.bg.includes("f3eee2") ? "#1a1a1a" : "#0a0a0a",
              }}
              aria-hidden
            >
              {snapshot.emoji}
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
            {fmtDateISO(snapshot.momentISO, payload.tz)} · {payload.city}
          </p>
        </section>
      )}

      {/* SCREEN 2 — Message */}
      {screen === 2 && (
        <section className="relative mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-20 text-center animate-in fade-in duration-700">
          <p className="text-[11px] tracking-[0.4em] uppercase" style={{ color: theme.accent }}>For {payload.to || payload.name}</p>
          <div className="mt-10 max-w-xl">
            <p className="text-balance text-2xl leading-relaxed md:text-3xl" style={{ fontFamily: theme.heading, fontStyle: "italic", fontWeight: 400 }}>
              “{payload.msg || "I wanted to show you the moon that existed the night you were here."}”
            </p>
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
              {fmtDateISO(snapshot.momentISO, payload.tz)}
            </h1>
            <p className="mt-2 text-xs tracking-[0.25em] uppercase" style={{ color: theme.sub }}>
              {fmtTimeISO(snapshot.momentISO, payload.tz)} local · UTC{payload.tz >= 0 ? "+" : ""}{payload.tz} · {payload.city}
            </p>
          </div>

          <div className="mt-12 flex flex-col items-center">
            {coreOk ? (
              <MoonSvg phaseAngle={snapshot.phaseAngle} illumination={snapshot.illumination} waxing={snapshot.waxing} size={220} />
            ) : (
              <div className="flex h-[200px] w-[200px] items-center justify-center rounded-full text-xs" style={{ border: `1px solid ${theme.accent}66`, color: theme.accent }}>
                Unable to verify
              </div>
            )}
            <p className="mt-6 text-2xl" style={{ fontFamily: theme.heading }}>{snapshot.emoji} {snapshot.name}</p>
            <p className="mt-1 text-[11px] tracking-[0.25em] uppercase" style={{ color: theme.sub }}>{snapshot.visual}</p>
          </div>

          {/* Facts (strictly scientific) */}
          <div className="mx-auto mt-12 grid max-w-xl grid-cols-2 gap-x-8 gap-y-5 text-sm">
            <Fact theme={theme} k="Moon Phase" v={snapshot.name} />
            <Fact theme={theme} k="Illumination" v={`${snapshot.illumPct}%`} />
            <Fact theme={theme} k="Moon Age" v={`${snapshot.age.toFixed(1)} days`} />
            <Fact theme={theme} k="Direction" v={snapshot.waxing ? "Waxing" : "Waning"} />
            <Fact theme={theme} k="Constellation" v={snapshot.constellation ? `${snapshot.constellationSymbol} ${snapshot.constellation}` : "Unavailable"} />
            <Fact theme={theme} k="Timezone" v={`UTC${payload.tz >= 0 ? "+" : ""}${payload.tz}`} />
            <Fact theme={theme} k="Moonrise" v={snapshot.moonriseISO ? fmtTimeISO(snapshot.moonriseISO, payload.tz) : "Not visible"} />
            <Fact theme={theme} k="Moonset" v={snapshot.moonsetISO ? fmtTimeISO(snapshot.moonsetISO, payload.tz) : "Not visible"} />
          </div>

          {/* Confidence */}
          <div className="mx-auto mt-8 max-w-xl text-center">
            <p className="text-[10px] tracking-[0.35em] uppercase" style={{ color: theme.sub }}>
              {snapshot.confidence === "VERIFIED"
                ? "Verified astronomical calculation"
                : partial
                  ? "Verified astronomical calculation · some secondary metadata unavailable"
                  : "Unable to verify"}
            </p>
          </div>

          {/* Poetry — separated */}
          <div className="mx-auto mt-10 max-w-xl text-center">
            <p className="text-[10px] tracking-[0.4em] uppercase" style={{ color: theme.sub }}>A line for the night</p>
            <p className="mt-3 text-balance text-xl leading-relaxed md:text-2xl" style={{ fontFamily: theme.heading, fontStyle: "italic" }}>
              “{snapshot.poetic}”
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

          {/* Every year — the same date, a different moon */}
          {snapshot.years && snapshot.years.length > 1 && (
            <div className="mx-auto mt-16 max-w-3xl">
              <div className="text-center">
                <p className="text-[10px] tracking-[0.4em] uppercase" style={{ color: theme.sub }}>Every year, the same date</p>
                <h2 className="mt-3 text-2xl md:text-4xl" style={{ fontFamily: theme.heading, fontStyle: "italic", fontWeight: 400 }}>
                  A different moon, each time
                </h2>
                <p className="mt-2 text-xs" style={{ color: theme.sub }}>
                  {snapshot.years[0].year} – {snapshot.years[snapshot.years.length - 1].year} · {payload.city}
                </p>
              </div>

              <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3">
                {snapshot.years.map((yr) => (
                  <div
                    key={yr.year}
                    className="flex flex-col items-center rounded-2xl p-4 text-center"
                    style={{ border: `1px solid ${theme.accent}22`, background: payload.style === "archive" ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.03)" }}
                  >
                    <p className="text-[10px] tracking-[0.3em] uppercase" style={{ color: theme.accent }}>{yr.year}</p>
                    <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: theme.sub }}>
                      {yr.age === 0 ? "Born" : `Turning ${yr.age}`}
                    </p>
                    <div className="mt-3">
                      <MoonSvg phaseAngle={yr.phaseAngle} illumination={yr.illumination} waxing={yr.waxing} size={84} />
                    </div>
                    <p className="mt-3 text-sm" style={{ fontFamily: theme.heading }}>{yr.emoji} {yr.name}</p>
                    <p className="mt-1 text-[10px]" style={{ color: theme.sub }}>
                      {yr.illumPct}% · {yr.waxing ? "waxing" : "waning"}
                    </p>
                    <p className="text-[10px]" style={{ color: theme.sub }}>
                      {yr.constellationSymbol} {yr.constellation}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-center text-[9px] tracking-[0.35em] uppercase" style={{ color: theme.sub, opacity: 0.7 }}>
                Each moon independently computed · astronomy-engine
              </p>
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
