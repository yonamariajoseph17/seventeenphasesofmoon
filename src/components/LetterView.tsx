import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { type LetterStyle } from "@/lib/letter";
import type { LetterRecord } from "@/lib/letter-store";
import { isMilestoneAge } from "@/lib/milestones";
import { MoonSvg } from "@/components/MoonSvg";
import { LetterBackground } from "@/components/LetterBackground";
import { GiftReveal } from "@/components/GiftReveal";
import { useAmbient } from "@/lib/useAmbient";
import { tzLabel } from "@/lib/tz";

/**
 * LetterView — the dedicated Moon Letter experience, entirely separate from the
 * homepage result screen. It always runs the full keepsake flow:
 *   scroll/seal reveal → personal message → moon data → year timeline.
 * The homepage never renders this; the letter page never renders the homepage
 * result screen.
 */

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

const GOLD = "#f3c969";

function fmtDateISO(iso: string, tz: number) {
  const s = new Date(new Date(iso).getTime() + tz * 3_600_000);
  return s.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}
function fmtTimeISO(iso: string, tz: number) {
  const s = new Date(new Date(iso).getTime() + tz * 3_600_000);
  return s.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
}

export function LetterView({ record }: { record: LetterRecord }) {
  const { payload, snapshot } = record;
  const [stage, setStage] = useState<"scroll" | "moon">("scroll");
  const [songStarted, setSongStarted] = useState(false);
  const ambient = useAmbient();

  const theme = STYLE_THEMES[payload.style] ?? STYLE_THEMES.midnight;
  const seed = (() => { const [y, mo, d] = payload.date.split("-").map(Number); return (y * 31 + mo) * 31 + d; })();
  const coreOk = snapshot.confidence !== "UNAVAILABLE";
  const partial = snapshot.confidence === "VERIFIED_PARTIAL";
  const forName = payload.to || payload.name;
  const occasionLine = OCCASION_LINES[payload.occasion ?? "general"];
  const hasSong = !!payload.song;
  const cardBg = theme.isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)";
  const years = snapshot.years ?? [];
  const mostRecentYear = years.length ? years[years.length - 1].year : null;
  // Longer letters shrink to stay within the parchment margins.
  const msgLen = (payload.msg ?? "").length;
  const recipientMsgSize =
    msgLen > 320 ? "clamp(1rem, 3.6vw, 1.35rem)"
    : msgLen > 180 ? "clamp(1.1rem, 4.3vw, 1.55rem)"
    : "clamp(1.25rem, 5vw, 1.875rem)";

  return (
    <main style={{ color: theme.fg, fontFamily: "'Inter', sans-serif" }} className="relative min-h-screen overflow-hidden">
      {/* Style-specific premium backdrop — never a generic navy */}
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

      {/* STAGE 1 — Ancient scroll reveal (greeting, occasion line, personal message) */}
      {stage === "scroll" && (
        <ScrollLetter
          accent={theme.accent}
          forName={forName}
          dateLine={payload.writtenDate ? `${payload.writtenDate}${payload.place ? ` · ${payload.place}` : ""}` : `${fmtDateISO(snapshot.momentISO, payload.tz)} · ${payload.city}`}
          onOpen={() => setSongStarted(true)}
        >
          <p className="ink-line text-sm italic leading-relaxed sm:text-base" style={{ animationDelay: "0.5s", color: "#5a4324" }}>
            {occasionLine}
          </p>
          <p
            className="ink-line mx-auto mt-7 max-w-prose text-balance px-1 leading-relaxed break-words hyphens-auto"
            style={{ animationDelay: "1.3s", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: recipientMsgSize, overflowWrap: "anywhere", wordBreak: "break-word" }}
          >
            “{payload.msg || "I wanted to show you the moon that existed the night you were here."}”
          </p>
          {payload.from && (
            <div className="ink-line mt-8" style={{ animationDelay: "2.1s", color: "#6e5a38", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>
              <p className="text-lg">{payload.closing || "Yours,"}</p>
              <p className="mt-1 text-lg break-words" style={{ overflowWrap: "anywhere" }}>{payload.from}</p>
            </div>
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

      {/* STAGE 2 — Moon details */}
      {stage === "moon" && (
        <section className="relative mx-auto max-w-3xl px-6 py-16 animate-in fade-in duration-700 md:py-24">
          <div className="relative z-10 text-center">
            <p className="text-[11px] tracking-[0.4em] uppercase" style={{ color: theme.accent }}>The sky above {forName}</p>
            <h1 className="mt-4 text-balance text-3xl md:text-5xl" style={{ fontFamily: theme.heading, fontStyle: "italic", fontWeight: 400 }}>
              {fmtDateISO(snapshot.momentISO, payload.tz)}
            </h1>
            <p className="mt-2 text-xs tracking-[0.25em] uppercase" style={{ color: theme.sub }}>
              {fmtTimeISO(snapshot.momentISO, payload.tz)} local · {tzLabel(payload.tz)} · {payload.city}
            </p>
          </div>

          <div className="relative z-10 mt-12 flex flex-col items-center">
            {coreOk ? (
              <MoonSvg phaseAngle={snapshot.phaseAngle} illumination={snapshot.illumination} waxing={snapshot.waxing} size={220} />
            ) : (
              <div className="flex h-[200px] w-[200px] items-center justify-center rounded-full text-xs" style={{ border: `1px solid ${theme.accent}66`, color: theme.accent }}>
                Unable to verify
              </div>
            )}
            <p className="mt-6 text-2xl" style={{ fontFamily: theme.heading }}>{snapshot.name}</p>
            <p className="mt-1 text-[11px] tracking-[0.25em] uppercase" style={{ color: theme.sub }}>{snapshot.visual}</p>
          </div>

          <div className="relative z-10 mx-auto mt-12 grid max-w-xl grid-cols-2 gap-x-8 gap-y-5 text-sm">
            <Fact theme={theme} k="Moon Phase" v={snapshot.name || "—"} />
            <Fact theme={theme} k="Illumination" v={snapshot.illumPct ? `${snapshot.illumPct}%` : "—"} />
            <Fact theme={theme} k="Moon Age" v={Number.isFinite(snapshot.age) ? `${snapshot.age.toFixed(1)} days` : "—"} />
            <Fact theme={theme} k="Direction" v={snapshot.waxing ? "Waxing" : "Waning"} />
            <Fact theme={theme} k="Constellation" v={snapshot.constellation ? `${snapshot.constellationSymbol} ${snapshot.constellation}` : "—"} />
            <Fact theme={theme} k="Timezone" v={tzLabel(payload.tz)} />
            <Fact theme={theme} k="Moonrise" v={snapshot.moonriseISO ? fmtTimeISO(snapshot.moonriseISO, payload.tz) : "—"} />
            <Fact theme={theme} k="Moonset" v={snapshot.moonsetISO ? fmtTimeISO(snapshot.moonsetISO, payload.tz) : "—"} />
            <Fact theme={theme} k="Sunrise" v={snapshot.sunriseISO ? fmtTimeISO(snapshot.sunriseISO, payload.tz) : "—"} />
            <Fact theme={theme} k="Sunset" v={snapshot.sunsetISO ? fmtTimeISO(snapshot.sunsetISO, payload.tz) : "—"} />
          </div>

          <div className="relative z-10 mx-auto mt-8 max-w-xl text-center">
            <p className="text-[10px] tracking-[0.35em] uppercase" style={{ color: theme.sub }}>
              {snapshot.confidence === "VERIFIED"
                ? "Verified astronomical calculation"
                : partial
                  ? "Verified astronomical calculation · some secondary metadata unavailable"
                  : "Unable to verify"}
            </p>
          </div>

          <div className="relative z-10 mx-auto mt-10 max-w-xl text-center">
            <p className="text-[10px] tracking-[0.4em] uppercase" style={{ color: theme.sub }}>A line for the night</p>
            <p className="mt-3 text-balance text-xl leading-relaxed md:text-2xl" style={{ fontFamily: theme.heading, fontStyle: "italic" }}>
              “{snapshot.poetic}”
            </p>
          </div>

          {payload.msg && (
            <div className="relative z-10 mx-auto mt-10 max-w-xl rounded-2xl p-6 text-center" style={{ border: `1px solid ${theme.accent}33`, background: cardBg }}>
              <p className="text-[10px] tracking-[0.3em] uppercase" style={{ color: theme.sub }}>
                {payload.from ? `From ${payload.from}` : "A note for you"}
              </p>
              <p className="mt-3 text-sm leading-relaxed md:text-base">{payload.msg}</p>
            </div>
          )}

          {years.length > 1 && (
            <div className="relative z-10 mx-auto mt-16 max-w-3xl">
              <div className="text-center">
                <p className="text-[10px] tracking-[0.4em] uppercase" style={{ color: theme.sub }}>Every year, the same date</p>
                <h2 className="mt-3 text-2xl md:text-4xl" style={{ fontFamily: theme.heading, fontStyle: "italic", fontWeight: 400 }}>
                  A different moon, each time
                </h2>
                <p className="mt-2 text-xs" style={{ color: theme.sub }}>
                  {years[0].year} – {years[years.length - 1].year} · {payload.city}
                </p>
              </div>

              <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3">
                {years.map((yr) => {
                  const isRecent = yr.year === mostRecentYear;
                  const isMilestone = !isRecent && yr.age > 0 && isMilestoneAge(yr.age);
                  const borderColor = isRecent ? theme.accent : isMilestone ? GOLD : `${theme.accent}22`;
                  const glow = isRecent
                    ? `0 0 0 1px ${theme.accent}66, 0 0 22px ${theme.accent}44`
                    : isMilestone
                      ? `0 0 0 1px ${GOLD}55, 0 0 16px ${GOLD}33`
                      : undefined;
                  return (
                    <div
                      key={yr.year}
                      className="relative flex flex-col items-center rounded-2xl p-4 text-center transition-shadow"
                      style={{ border: `1px solid ${borderColor}`, background: cardBg, boxShadow: glow }}
                    >
                      {isRecent && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full px-2.5 py-0.5 text-[8px] tracking-[0.25em] uppercase" style={{ background: theme.accent, color: theme.onAccent }}>
                          {yr.age === 0 ? "This year" : "Most recent"}
                        </span>
                      )}
                      {isMilestone && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full px-2.5 py-0.5 text-[8px] tracking-[0.25em] uppercase" style={{ background: GOLD, color: "#1a1202" }}>
                          Milestone
                        </span>
                      )}
                      <p className="text-[10px] tracking-[0.3em] uppercase" style={{ color: isMilestone ? GOLD : theme.accent }}>{yr.year}</p>
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
              <p className="mt-6 text-center text-[9px] tracking-[0.35em] uppercase" style={{ color: theme.sub, opacity: 0.7 }}>
                Each moon independently computed · astronomy-engine
              </p>
            </div>
          )}

          <div className="relative z-10 mt-12 flex flex-wrap justify-center gap-3">
            <ShareButtons theme={theme} to={forName} />
            <Link to="/" className="rounded-full px-5 py-2.5 text-[11px] tracking-[0.3em] uppercase" style={{ border: `1px solid ${theme.sub}`, color: theme.sub }}>
              Write your own
            </Link>
          </div>

          <p className="relative z-10 mt-10 text-center text-[10px] tracking-[0.4em] uppercase" style={{ color: theme.sub, opacity: 0.7 }}>
            Verified · astronomy-engine (VSOP87 / ELP2000)
          </p>
        </section>
        </section>
    </main>
  );
}

function Fact({ theme, k, v }: { theme: Theme; k: string; v: string }) {
  return (
    <div>
      <p className="text-[10px] tracking-[0.3em] uppercase" style={{ color: theme.sub }}>{k}</p>
      <p className="mt-1 text-base" style={{ color: theme.fg }}>{v}</p>
    </div>
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
