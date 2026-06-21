import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { OCCASION_LINES, type LetterStyle } from "@/lib/letter";
import type { LetterRecord } from "@/lib/letter-store";
import { letterProse } from "@/lib/letter-prose";
import { MoonSvg } from "@/components/MoonSvg";
import { Bouquet } from "@/components/Bouquet";
import { LetterBackground } from "@/components/LetterBackground";
import { ScrollLetter } from "@/components/ScrollLetter";
import { LetterAudio } from "@/components/LetterAudio";
import { isBouquetMeaningful, type BouquetSpec } from "@/lib/bouquet";
import { isMilestoneAge } from "@/lib/milestones";
import { useAmbient } from "@/lib/useAmbient";
import { tzLabel } from "@/lib/tz";

interface Theme {
  fg: string; accent: string; sub: string; heading: string; onAccent: string; isLight: boolean;
}

const STYLE_THEMES: Record<LetterStyle, Theme> = {
  midnight: { fg: "#e8edff", accent: "#9fb3ff", sub: "#8090c0", heading: "'Cormorant Garamond', serif", onAccent: "#0a1024", isLight: false },
  romantic: { fg: "#f8e8ec", accent: "#f0b9c6", sub: "#d29fae", heading: "'Cormorant Garamond', serif", onAccent: "#2a0d1a", isLight: false },
  vintage: { fg: "#3a2a14", accent: "#8a5a1e", sub: "#6e5a38", heading: "'Cormorant Garamond', serif", onAccent: "#fdf6e6", isLight: true },
  archive: { fg: "#ece3d6", accent: "#d6aa78", sub: "#a08e78", heading: "'Cormorant Garamond', serif", onAccent: "#1a1410", isLight: false },
  minimal: { fg: "#1a1a1f", accent: "#2a2a32", sub: "#6a6a74", heading: "'Inter', sans-serif", onAccent: "#ffffff", isLight: true },
  golden: { fg: "#fbeec1", accent: "#f3c969", sub: "#b89858", heading: "'Cormorant Garamond', serif", onAccent: "#1a1202", isLight: false },
};

function fmtDateISO(iso: string, tz: number) {
  const s = new Date(new Date(iso).getTime() + tz * 3_600_000);
  return s.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}
function fmtTimeISO(iso: string, tz: number) {
  const s = new Date(new Date(iso).getTime() + tz * 3_600_000);
  return s.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
}

type Stage = "intro" | "bouquet" | "scroll" | "moon";

export function LetterView({ record }: { record: LetterRecord }) {
  const { payload, snapshot } = record;
  const theme = STYLE_THEMES[payload.style] ?? STYLE_THEMES.midnight;
  const seed = (() => { const [y, mo, d] = payload.date.split("-").map(Number); return (y * 31 + mo) * 31 + d; })();
  const coreOk = snapshot.confidence !== "UNAVAILABLE";
  const partial = snapshot.confidence === "VERIFIED_PARTIAL";
  const forName = payload.to || payload.name;
  const occasion = payload.occasion ?? "general";
  const occasionLine = OCCASION_LINES[occasion];
  const hasSong = !!payload.song;
  const bouquet: BouquetSpec | null = isBouquetMeaningful(payload.bouquet) ? payload.bouquet : null;
  const cardBg = theme.isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)";

  const [stage, setStage] = useState<Stage>("intro");
  const [songStarted, setSongStarted] = useState(false);
  const ambient = useAmbient();

  function begin() {
    setSongStarted(true);
    setStage(bouquet ? "bouquet" : "scroll");
  }

  const prose = letterProse({
    dateText: fmtDateISO(snapshot.momentISO, payload.tz),
    city: payload.city,
    phaseName: snapshot.name,
    illumPct: snapshot.illumPct,
    ageDays: snapshot.age,
    constellation: snapshot.constellation,
    moonriseText: snapshot.moonriseISO ? fmtTimeISO(snapshot.moonriseISO, payload.tz) : null,
    moonsetText: snapshot.moonsetISO ? fmtTimeISO(snapshot.moonsetISO, payload.tz) : null,
    occasion,
  });

  return (
    <main style={{ color: theme.fg, fontFamily: "'Inter', sans-serif" }} className="relative min-h-screen overflow-hidden">
      <LetterBackground style={payload.style} seed={seed} />

      {/* Audio — a personal song if uploaded, otherwise a gentle soundscape toggle */}
      {hasSong ? (
        <LetterAudio src={payload.song!} autoStart={songStarted} accent={theme.accent} panelBg={`${theme.accent}1c`} />
      ) : (
        <button
          onClick={ambient.toggle}
          aria-label={ambient.enabled ? "Mute ambient music" : "Play ambient music"}
          className="fixed top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-sm transition-opacity hover:opacity-100"
          style={{ background: `${theme.accent}1f`, border: `1px solid ${theme.accent}55`, color: theme.accent }}
        >
          {ambient.enabled ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5 6 9H2v6h4l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M19 5a9 9 0 0 1 0 14" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5 6 9H2v6h4l5 4z" /><line x1="22" y1="9" x2="16" y2="15" /><line x1="16" y1="9" x2="22" y2="15" />
            </svg>
          )}
        </button>
      )}

      {/* STAGE 0 — Entrance */}
      {stage === "intro" && (
        <section className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <div className="animate-fade-in">
            <p className="text-[11px] tracking-[0.45em] uppercase" style={{ color: theme.accent }}>For {forName}</p>
            <h1 className="mt-6 text-balance text-4xl leading-tight md:text-6xl" style={{ fontFamily: theme.heading, fontStyle: "italic", fontWeight: 400 }}>
              {bouquet ? "A gift, under the same sky" : "A letter, under the same sky"}
            </h1>
            <p className="mx-auto mt-5 max-w-sm text-sm" style={{ color: theme.sub }}>
              {bouquet ? "Something was left here for you to open, slowly." : "Take a breath. Then open it slowly."}
            </p>
            <button
              type="button"
              onClick={begin}
              className="mt-12 rounded-full px-8 py-3 text-[11px] tracking-[0.35em] uppercase transition-opacity hover:opacity-80"
              style={{ border: `1px solid ${theme.accent}`, color: theme.accent, background: "transparent" }}
            >
              Tap to open
            </button>
          </div>
        </section>
      )}

      {/* STAGE 1 — Bouquet reveal */}
      {stage === "bouquet" && bouquet && (
        <section className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
          <div className="animate-fade-in">
            <p className="text-[11px] tracking-[0.4em] uppercase" style={{ color: theme.accent }}>For {forName}</p>
            <div className="mt-6 flex justify-center" style={{ animation: "letter-float-up 1.4s ease-out both" }}>
              <Bouquet spec={bouquet} width={340} />
            </div>
            {bouquet.tag && (
              <div
                className="mx-auto mt-4 max-w-xs rounded-md px-5 py-3"
                style={{ background: cardBg, border: `1px solid ${theme.accent}33`, animation: "letter-float-up 1.8s ease-out both" }}
              >
                <p className="text-base leading-relaxed" style={{ fontFamily: theme.heading, fontStyle: "italic" }}>“{bouquet.tag}”</p>
              </div>
            )}
            <button
              type="button"
              onClick={() => setStage("scroll")}
              className="mt-10 rounded-full px-7 py-3 text-[11px] tracking-[0.3em] uppercase transition-opacity hover:opacity-80"
              style={{ border: `1px solid ${theme.accent}`, color: theme.accent, animation: "letter-float-up 2.2s ease-out both" }}
            >
              Read the letter
            </button>
          </div>
        </section>
      )}

      {/* STAGE 2 — Ancient scroll reveal */}
      {stage === "scroll" && (
        <ScrollLetter
          accent={theme.accent}
          forName={forName}
          dateLine={`${fmtDateISO(snapshot.momentISO, payload.tz)} · ${payload.city}`}
          onOpen={() => setSongStarted(true)}
        >
          <p className="ink-line text-sm italic leading-relaxed sm:text-base" style={{ animationDelay: "0.5s", color: "#5a4324" }}>
            {occasionLine}
          </p>
          <p
            className="ink-line mt-7 text-balance text-2xl leading-relaxed sm:text-3xl"
            style={{ animationDelay: "1.3s", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}
          >
            “{payload.msg || "I wanted to show you the moon that existed the night you were here."}”
          </p>
          {payload.from && (
            <p className="ink-line mt-8 text-xs tracking-[0.3em] uppercase" style={{ animationDelay: "2.1s", color: "#6e5a38" }}>
              — {payload.from}
            </p>
          )}
          <button
            type="button"
            onClick={() => setStage("moon")}
            className="ink-line mt-10 rounded-full px-7 py-3 text-[11px] tracking-[0.3em] uppercase transition-opacity hover:opacity-80"
            style={{ animationDelay: "2.7s", border: "1px solid #7a5a2e", color: "#3a2a14", background: "transparent" }}
          >
            See your moon
          </button>
        </ScrollLetter>
      )}

      {/* STAGE 3 — Moon, in prose */}
      {stage === "moon" && (
        <section className="relative mx-auto max-w-2xl px-6 py-16 animate-in fade-in duration-700 md:py-24">
          <div className="text-center">
            <p className="text-[11px] tracking-[0.4em] uppercase" style={{ color: theme.accent }}>The sky above {forName}</p>
          </div>

          <div className="mt-12 flex flex-col items-center">
            {coreOk ? (
              <MoonSvg phaseAngle={snapshot.phaseAngle} illumination={snapshot.illumination} waxing={snapshot.waxing} size={220} />
            ) : (
              <div className="flex h-[200px] w-[200px] items-center justify-center rounded-full text-xs" style={{ border: `1px solid ${theme.accent}66`, color: theme.accent }}>
                Unable to verify
              </div>
            )}
          </div>

          {/* Flowing, handwritten-feeling prose — every number embedded in a sentence */}
          <p
            className="mx-auto mt-12 max-w-xl text-balance text-center text-xl leading-relaxed md:text-2xl"
            style={{ fontFamily: theme.heading }}
          >
            {prose}
          </p>

          {/* The night's poetic line */}
          <p
            className="mx-auto mt-10 max-w-lg text-balance text-center text-lg leading-relaxed italic md:text-xl"
            style={{ fontFamily: theme.heading, color: theme.sub }}
          >
            “{snapshot.poetic}”
          </p>

          {/* Personal sender note — first-person, set apart by an asterism */}
          {payload.msg && (
            <div className="mx-auto mt-12 max-w-lg text-center">
              <p className="text-base tracking-[0.4em]" style={{ color: theme.accent }} aria-hidden>✦</p>
              <p className="mt-5 text-base leading-relaxed md:text-lg" style={{ color: theme.fg }}>{payload.msg}</p>
              {payload.from && (
                <p className="mt-4 text-xs tracking-[0.3em] uppercase" style={{ color: theme.sub }}>— {payload.from}</p>
              )}
            </div>
          )}

          {/* Every-year timeline with milestone + most-recent highlights */}
          {snapshot.years && snapshot.years.length > 1 && (
            <div className="mx-auto mt-16 max-w-3xl">
              <div className="text-center">
                <p className="text-[10px] tracking-[0.4em] uppercase" style={{ color: theme.sub }}>Every year, the same date</p>
                <h2 className="mt-3 text-2xl md:text-4xl" style={{ fontFamily: theme.heading, fontStyle: "italic", fontWeight: 400 }}>
                  A different moon, each time
                </h2>
              </div>
              <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3">
                {snapshot.years.map((yr, idx) => {
                  const isRecent = idx === snapshot.years.length - 1;
                  const milestone = isMilestoneAge(yr.age);
                  const borderColor = isRecent ? theme.accent : milestone ? "#e7c069" : `${theme.accent}22`;
                  return (
                    <div
                      key={yr.year}
                      className="relative flex flex-col items-center rounded-2xl p-4 text-center"
                      style={{
                        border: `1px solid ${borderColor}`,
                        background: cardBg,
                        boxShadow: isRecent ? `0 0 22px -6px ${theme.accent}` : milestone ? "0 0 18px -8px #e7c069" : undefined,
                      }}
                    >
                      {(isRecent || milestone) && (
                        <span
                          className="absolute -top-2 right-3 rounded-full px-2 py-0.5 text-[8px] tracking-[0.2em] uppercase"
                          style={{
                            background: isRecent ? theme.accent : "#e7c069",
                            color: isRecent ? theme.onAccent : "#2a1d04",
                          }}
                        >
                          {isRecent ? "Most recent" : `${yr.age}`}
                        </span>
                      )}
                      <p className="text-[10px] tracking-[0.3em] uppercase" style={{ color: theme.accent }}>{yr.year}</p>
                      <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: theme.sub }}>
                        {yr.age === 0 ? "Born" : `Turning ${yr.age}`}
                      </p>
                      <div className="mt-3">
                        <MoonSvg phaseAngle={yr.phaseAngle} illumination={yr.illumination} waxing={yr.waxing} size={84} />
                      </div>
                      <p className="mt-3 text-sm" style={{ fontFamily: theme.heading }}>{yr.name}</p>
                      <p className="mt-1 text-[10px]" style={{ color: theme.sub }}>{yr.illumPct}% · {yr.waxing ? "waxing" : "waning"}</p>
                      <p className="text-[10px]" style={{ color: theme.sub }}>{yr.constellationSymbol} {yr.constellation}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-14 flex flex-wrap justify-center gap-3">
            <ShareButtons theme={theme} to={forName} />
            <Link to="/" className="rounded-full px-5 py-2.5 text-[11px] tracking-[0.3em] uppercase" style={{ border: `1px solid ${theme.sub}`, color: theme.sub }}>
              Write your own
            </Link>
          </div>

          {/* Quiet watermark — not a data table */}
          <p className="mt-10 text-center text-[10px] tracking-[0.4em] uppercase" style={{ color: theme.sub, opacity: 0.65 }}>
            {partial ? "Verified · astronomy-engine (VSOP87 / ELP2000) · some secondary metadata unavailable" : "Verified · astronomy-engine (VSOP87 / ELP2000)"}
          </p>
        </section>
      )}
    </main>
  );
}

function ShareButtons({ theme, to }: { theme: Theme; to: string }) {
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
        style={{ background: theme.accent, color: theme.onAccent }}
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
