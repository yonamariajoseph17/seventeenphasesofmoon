import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { OCCASION_LINES } from "@/lib/letter";
import type { LetterRecord } from "@/lib/letter-store";
import { accurateMoon, type AccurateMoonInfo } from "@/lib/astro-accurate";
import { POSTCARD_MILESTONE_AGES } from "@/lib/milestones";
import { useGiftScore } from "@/lib/giftScore";
import { MoonSvg } from "@/components/MoonSvg";
import { EmergingStars } from "@/components/EmergingStars";
import { CineEnvelope, type EnvelopePhase } from "@/components/CineEnvelope";
import { CineLetter, type LetterFoldState } from "@/components/CineLetter";
import { BouquetArrangement } from "@/components/Bouquet";
import { PostcardFront, PostcardBack, POSTCARD_W, POSTCARD_H, type PostcardMilestone } from "@/components/Postcard";
import { GiftDownload } from "@/components/GiftDownload";
import type { PrintKitData } from "@/lib/printkit";

/**
 * The cinematic gift reveal — one unhurried sequence: darkness, stars, the
 * envelope arriving, the seal cracking, the letter unfolding and being read,
 * the postcard's night sky and address side, the bouquet blooming, and a
 * closing that ends with tonight's moon. Nothing auto-advances between
 * chapters; every stage waits for a deliberate tap.
 */

type Phase =
  | "opening"
  | "unsealing"
  | "letter"
  | "reclosing"
  | "postcard-back"
  | "postcard-front"
  | "bouquet"
  | "closing"
  | "download";

const BOUQUET_TAG: Record<string, string> = {
  birthday: "For every year the sky has kept watch over you.",
  anniversary: "For every night we've shared the same moon.",
  memory: "Because some people leave a light in the sky.",
  proposal: "Because I want to share every moon with you.",
  friendship: "Because you make the sky feel less infinite.",
  "first-met": "For the night the sky changed.",
  general: "These made me think of you.",
};

function fmtDate(iso: string, tz: number) {
  const s = new Date(new Date(iso).getTime() + tz * 3_600_000);
  return s.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}
function fmtTime(iso: string | null, tz: number) {
  if (!iso) return "—";
  const s = new Date(new Date(iso).getTime() + tz * 3_600_000);
  return s.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
}

export function GiftReveal({ record, onSeeRecord }: { record: LetterRecord; onSeeRecord: () => void }) {
  const { payload, snapshot } = record;
  const [phase, setPhase] = useState<Phase>("opening");
  const [beat, setBeat] = useState(0);          // choreography step inside a phase
  const [tapReady, setTapReady] = useState(false);

  const score = useGiftScore({ personalSong: payload.song, songScope: payload.songScope ?? "letter" });

  const recipient = payload.to || payload.name;
  const occasion = payload.occasion ?? "general";
  const occasionLine = OCCASION_LINES[occasion];
  const dateLine = fmtDate(snapshot.momentISO, payload.tz);
  const tonight = useMemo<AccurateMoonInfo | null>(() => {
    try { return accurateMoon(new Date()); } catch { return null; }
  }, []);

  const moon = useMemo<AccurateMoonInfo>(() => ({
    phaseAngle: snapshot.phaseAngle,
    phaseFraction: snapshot.phaseAngle / 360,
    illumination: snapshot.illumination,
    age: snapshot.age,
    name: snapshot.name,
    emoji: snapshot.emoji,
    waxing: snapshot.waxing,
    constellation: snapshot.constellation,
    constellationSymbol: snapshot.constellationSymbol,
  }), [snapshot]);

  const milestones = useMemo<PostcardMilestone[]>(() => {
    const years = snapshot.years ?? [];
    return years
      .filter((y) => (POSTCARD_MILESTONE_AGES as readonly number[]).includes(y.age))
      .map((y) => ({ age: y.age, phaseAngle: y.phaseAngle, illumination: y.illumination, waxing: y.waxing, name: y.name }));
  }, [snapshot]);

  const narration =
    `On the night of ${dateLine}, above ${payload.city}, the sky held a ${snapshot.name} — ` +
    `${snapshot.illumPct}% lit, ${snapshot.age.toFixed(1)} days into its journey, resting in ${snapshot.constellation}. ` +
    `It rose at ${fmtTime(snapshot.moonriseISO, payload.tz)} and slipped away by ${fmtTime(snapshot.moonsetISO, payload.tz)}.`;

  const kit: PrintKitData = {
    recipient,
    recipientCity: payload.recipientCity,
    sender: payload.from,
    place: payload.place,
    writtenDate: payload.writtenDate,
    greeting: `Dear ${recipient},`,
    occasionLine,
    message: payload.msg ?? "",
    closing: payload.closing || "Forever yours,",
    narration,
    city: payload.city,
    dateLabel: dateLine,
    phaseName: snapshot.name,
    illumPct: snapshot.illumPct,
    moonAge: snapshot.age.toFixed(1),
    constellation: snapshot.constellation,
    moonrise: fmtTime(snapshot.moonriseISO, payload.tz),
    moonset: fmtTime(snapshot.moonsetISO, payload.tz),
    illumination: snapshot.illumination,
    waxing: snapshot.waxing,
    milestones: milestones.map((m) => ({ age: m.age, illumination: m.illumination, waxing: m.waxing, name: m.name })),
  };

  /* ── choreography ─────────────────────────────────────────────── */
  const run = useCallback((steps: [number, number][], done?: () => void) => {
    const timers = steps.map(([b, ms]) => window.setTimeout(() => setBeat(b), ms));
    const total = steps.length ? steps[steps.length - 1][1] : 0;
    if (done) timers.push(window.setTimeout(done, total + 400));
    return () => timers.forEach(window.clearTimeout);
  }, []);

  useEffect(() => {
    setBeat(0);
    setTapReady(false);
    if (phase === "opening") {
      // black → stars → glow → envelope → prompts
      return run([[1, 2000], [2, 3200], [3, 5200], [4, 8600], [5, 10600]], () => setTapReady(true));
    }
    if (phase === "unsealing") {
      // turn → seal glow/crack → flap → letter rises → unfold → read
      const cleanup = run([[1, 1700], [2, 3200], [3, 5000], [4, 6400], [5, 7600]]);
      const t = window.setTimeout(() => { setPhase("letter"); }, 9200);
      return () => { cleanup(); window.clearTimeout(t); };
    }
    if (phase === "letter") {
      score.enterLetter();
      return run([[1, 900], [2, 4200], [3, 6600]], () => setTapReady(true));
    }
    if (phase === "reclosing") {
      const cleanup = run([[1, 1600], [2, 3000], [3, 4200]]);
      const t = window.setTimeout(() => setPhase("postcard-back"), 6200);
      return () => { cleanup(); window.clearTimeout(t); };
    }
    if (phase === "postcard-back") {
      return run([[1, 900], [2, 2400], [3, 4200], [4, 5800]], () => setTapReady(true));
    }
    if (phase === "postcard-front") {
      return run([[1, 900], [2, 2400]], () => setTapReady(true));
    }
    if (phase === "bouquet") {
      score.resumeDefault();
      const cleanup = run([[1, 1000], [2, 2200], [3, 5000], [4, 7000]]);
      const s = window.setTimeout(() => score.swell(), 6500);
      const t = window.setTimeout(() => setPhase("closing"), 15000);
      return () => { cleanup(); window.clearTimeout(s); window.clearTimeout(t); };
    }
    if (phase === "closing") {
      score.fadeOut(10000);
      return run([[1, 3000], [2, 6000], [3, 8500], [4, 11500], [5, 17000], [6, 19500]]);
    }
    return undefined;
    // score identity is stable enough for a chapter transition
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, run]);

  function advance() {
    if (!tapReady) return;
    setTapReady(false);
    if (phase === "opening") { score.start(); setPhase("unsealing"); return; }
    if (phase === "letter") { setPhase("reclosing"); return; }
    if (phase === "postcard-back") { setPhase("postcard-front"); return; }
    if (phase === "postcard-front") { setPhase("bouquet"); return; }
  }

  if (phase === "download") {
    return (
      <div className="relative min-h-screen" style={{ background: "#04060f" }}>
        <EmergingStars seed={4} count={90} />
        <div className="relative z-10">
          <GiftDownload data={kit} giftUrl={typeof window !== "undefined" ? window.location.href : ""} recipient={recipient} />
        </div>
      </div>
    );
  }

  const envelopePhase: EnvelopePhase =
    phase === "opening" ? (beat < 4 ? "arriving" : "rest")
    : phase === "unsealing" ? (beat < 1 ? "turning" : beat < 2 ? "turning" : beat < 3 ? "cracking" : "opening")
    : phase === "reclosing" ? (beat < 2 ? "resealing" : "sealed")
    : "empty";

  const letterState: LetterFoldState =
    phase === "unsealing" ? (beat < 4 ? "inside" : beat < 5 ? "rising" : "unfolding")
    : phase === "letter" ? "open"
    : phase === "reclosing" ? (beat < 1 ? "refolding" : "folded")
    : "inside";

  return (
    <div
      onClick={advance}
      className="relative min-h-screen w-full overflow-hidden"
      style={{ background: "#03040a", cursor: tapReady ? "pointer" : "default" }}
    >
      {/* stars — emerge star by star through the opening */}
      {phase === "opening" && beat >= 1 && <EmergingStars seed={9} count={140} />}
      {phase !== "opening" && phase !== "bouquet" && phase !== "closing" && <EmergingStars seed={9} count={110} spread={1200} />}

      {/* faint navy radial glow, like moonlight behind cloud */}
      {(phase === "opening" ? beat >= 3 : true) && (
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: "150vmax", height: "150vmax",
            background: "radial-gradient(circle, rgba(30,48,110,0.34) 0%, rgba(10,16,40,0.18) 40%, transparent 70%)",
            animation: "cine-glow-bloom 3.5s ease-out both",
          }}
          aria-hidden
        />
      )}

      {/* ── OPENING / UNSEALING / LETTER ── */}
      {(phase === "opening" || phase === "unsealing" || phase === "letter" || phase === "reclosing") && (
        <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-16">
          {/* the envelope */}
          {(phase === "opening" || phase === "unsealing" || phase === "reclosing") && beat >= 0 && (
            <div style={{ opacity: phase === "opening" && beat < 4 ? (beat >= 4 ? 1 : undefined) : 1 }}>
              {(phase !== "opening" || beat >= 4) && (
                <div style={{ perspective: 1400 }}>
                  <CineEnvelope
                    phase={envelopePhase}
                    width={Math.min(330, typeof window !== "undefined" ? window.innerWidth * 0.82 : 330)}
                    recipient={recipient}
                    recipientCity={payload.recipientCity}
                    sender={payload.from}
                    postmarkCity={payload.city}
                    postmarkDate={payload.date}
                  />
                </div>
              )}
            </div>
          )}

          {/* opening captions */}
          {phase === "opening" && beat >= 5 && (
            <div className="mt-12 text-center">
              <p className="cine-fade text-sm" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#e9e0cd", letterSpacing: "0.08em" }}>
                Something arrived for you.
              </p>
              <p className="cine-fade mt-4 text-[11px] tracking-[0.35em] uppercase" style={{ color: "#c9c0ae", animationDelay: "2s", fontFamily: "'Cormorant Garamond', serif" }}>
                Tap to open ↓
              </p>
            </div>
          )}

          {/* the letter itself */}
          {(phase === "unsealing" && beat >= 4) || phase === "letter" || phase === "reclosing" ? (
            <div className="mt-8 flex w-full justify-center">
              <CineLetter state={letterState} bleedText={payload.msg}>
                <p className="cine-fade text-right text-[11px] italic" style={{ color: "#6e5a38", animationDelay: "0.2s" }}>
                  {[payload.place || payload.city, payload.writtenDate || dateLine].filter(Boolean).join(", ")}
                </p>
                <p className="cine-fade mt-5 text-center text-[13px] italic leading-relaxed" style={{ color: "#5a4324", animationDelay: "0.6s", fontFamily: "'Cormorant Garamond', serif" }}>
                  {occasionLine}
                </p>
                <p className="cine-fade mt-7 letterpaper-hand text-2xl" style={{ animationDelay: "1s" }}>
                  Dear {recipient},
                </p>
                <p
                  className="cine-fade mt-4 letterpaper-hand leading-relaxed"
                  style={{ animationDelay: "1.5s", fontSize: (payload.msg?.length ?? 0) > 320 ? 17 : 20, overflowWrap: "anywhere" }}
                >
                  {payload.msg || "I wanted to show you the moon that existed the night you were here."}
                </p>
                <p className="cine-fade mt-7 text-[12px] leading-relaxed" style={{ animationDelay: "3s", color: "#5f4b2c", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>
                  {narration}
                </p>
                <p className="cine-fade mt-8 letterpaper-hand text-xl" style={{ animationDelay: "4.2s" }}>
                  {payload.closing || "Forever yours,"} {payload.from ?? ""}
                </p>
              </CineLetter>
            </div>
          ) : null}

          {phase === "letter" && tapReady && (
            <p className="cine-fade mt-10 text-[10px] tracking-[0.35em] uppercase" style={{ color: "#8e8674" }}>
              Tap to continue ↓
            </p>
          )}
        </section>
      )}

      {/* ── POSTCARD ── */}
      {(phase === "postcard-back" || phase === "postcard-front") && (
        <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-3 py-14">
          <ScaledCard flipped={phase === "postcard-front"}>
            <PostcardBack
              style="vintage" moon={moon} date={new Date(snapshot.momentISO)} tz={payload.tz}
              city={payload.city} recipient={recipient} recipientCity={payload.recipientCity}
              sender={payload.from} occasion={occasion} message={payload.msg ?? ""} poetic={snapshot.poetic}
              letterExcerpt={payload.msg} illumPct={snapshot.illumPct} dateLabel={dateLine}
              timeLabel={fmtTime(snapshot.momentISO, payload.tz)}
              moonriseLabel={fmtTime(snapshot.moonriseISO, payload.tz)}
              moonsetLabel={fmtTime(snapshot.moonsetISO, payload.tz)}
              milestones={milestones}
            />
            <PostcardFront
              style="vintage" moon={moon} date={new Date(snapshot.momentISO)} tz={payload.tz}
              city={payload.city} recipient={recipient} recipientCity={payload.recipientCity}
              sender={payload.from} occasion={occasion} message={payload.msg ?? ""} poetic={snapshot.poetic}
              letterExcerpt={payload.msg} illumPct={snapshot.illumPct} dateLabel={dateLine}
              timeLabel={fmtTime(snapshot.momentISO, payload.tz)}
              milestones={milestones}
            />
          </ScaledCard>
          {tapReady && (
            <p className="cine-fade mt-10 text-[10px] tracking-[0.35em] uppercase" style={{ color: "#9aa6c4" }}>
              {phase === "postcard-back" ? "Tap to read the other side ↓" : "Tap to receive your bouquet ↓"}
            </p>
          )}
        </section>
      )}

      {/* ── BOUQUET ── */}
      {phase === "bouquet" && (
        <section className="relative z-10 flex min-h-screen flex-col items-center justify-end px-4 pb-16">
          {beat >= 1 && (
            <div
              className="pointer-events-none absolute left-1/2 bottom-0 -translate-x-1/2"
              style={{
                width: "120vmin", height: "90vmin",
                background: "radial-gradient(ellipse at 50% 90%, rgba(255,196,110,0.30), rgba(255,170,80,0.10) 45%, transparent 72%)",
                animation: "cine-glow-bloom 2.6s ease-out both",
              }}
              aria-hidden
            />
          )}
          {beat >= 2 && (
            <div style={{ animation: "cine-bouquet-rise 3.2s cubic-bezier(0.22,0.61,0.36,1) both" }}>
              <BouquetArrangement
                flowers={payload.bouquet?.flowers ?? ["rose", "peony", "daisy"]}
                wrap={payload.bouquet?.wrap ?? "kraft"}
                size={Math.min(330, typeof window !== "undefined" ? window.innerWidth * 0.82 : 330)}
                bloom
                occasion={occasion}
                sender={payload.from}
              />
            </div>
          )}
          {beat >= 3 && (
            <p
              className="mt-6 max-w-xs text-center letterpaper-hand text-lg"
              style={{ color: "#f0e4cd", animation: "cine-tag-swing 2.4s ease-out both" }}
            >
              {BOUQUET_TAG[occasion] ?? BOUQUET_TAG.general}
            </p>
          )}
        </section>
      )}

      {/* ── CLOSING ── */}
      {phase === "closing" && (
        <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-20 text-center">
          <div className="pointer-events-none absolute inset-0" aria-hidden style={{ background: "radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,0.85) 100%)", animation: "cine-vignette 4s ease-out both" }} />
          {beat >= 1 && (
            <p className="cine-rise text-2xl md:text-3xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#ece3d6" }}>
              The moon changes every night.
            </p>
          )}
          {beat >= 2 && (
            <p className="cine-rise mt-6 text-xl md:text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#e2d9c8" }}>
              Some nights, it watches over someone irreplaceable.
            </p>
          )}
          {beat >= 3 && (
            <p className="cine-rise mt-6 text-base md:text-lg" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#bdb3a0" }}>
              This was made for you — under the same sky.
            </p>
          )}
          {beat >= 4 && tonight && (
            <div className="cine-fade mt-12 flex flex-col items-center">
              <MoonSvg phaseAngle={tonight.phaseAngle} illumination={tonight.illumination} waxing={tonight.waxing} size={80} />
              <p className="mt-4 text-[9px] tracking-[0.35em] uppercase" style={{ color: "#cfc6b3" }}>
                Tonight's moon · {tonight.name}
              </p>
            </div>
          )}
          {beat >= 5 && (
            <p className="cine-fade mx-auto mt-14 max-w-md text-[9px] leading-relaxed tracking-[0.24em] uppercase" style={{ color: "#8d8674" }}>
              Sky We Share ✦ Built in love, for someone who loved moongazing and never knew how much she was watched over by it.
            </p>
          )}
          {beat >= 6 && (
            <div className="cine-fade mt-8 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setPhase("download"); }}
                className="rounded-full px-6 py-2.5 text-[10px] tracking-[0.3em] uppercase"
                style={{ border: "1px solid rgba(236,227,214,0.4)", color: "#ece3d6" }}
              >
                Download your gift
              </button>
              <Link
                to="/"
                onClick={(e) => e.stopPropagation()}
                className="rounded-full px-6 py-2.5 text-[10px] tracking-[0.3em] uppercase"
                style={{ border: "1px solid rgba(236,227,214,0.25)", color: "#c8c0ae" }}
              >
                Create your own →
              </Link>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onSeeRecord(); }}
                className="rounded-full px-6 py-2.5 text-[10px] tracking-[0.3em] uppercase"
                style={{ border: "1px solid rgba(236,227,214,0.18)", color: "#a49c8c" }}
              >
                See the full moon record
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

/** Postcard scaled to the viewport, with a real 3D flip. */
function ScaledCard({ flipped, children }: { flipped: boolean; children: React.ReactNode }) {
  const [w, setW] = useState(340);
  useEffect(() => {
    const update = () => setW(Math.min(520, window.innerWidth * 0.94));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  const scale = w / POSTCARD_W;
  const kids = Array.isArray(children) ? children : [children];
  return (
    <div style={{ width: w, height: POSTCARD_H * scale, perspective: 2200, animation: "cine-card-slide 1.6s cubic-bezier(0.22,0.61,0.36,1) both" }}>
      <div
        style={{
          position: "relative", width: "100%", height: "100%", transformStyle: "preserve-3d",
          transform: `rotateY(${flipped ? 180 : 0}deg)`, transition: "transform 0.8s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {[0, 1].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute", inset: 0, backfaceVisibility: "hidden",
              transform: i === 1 ? "rotateY(180deg)" : undefined,
              boxShadow: "0 24px 50px rgba(0,0,0,0.6)",
            }}
          >
            <div style={{ width: POSTCARD_W, height: POSTCARD_H, transform: `scale(${scale})`, transformOrigin: "top left" }}>
              {kids[i]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
