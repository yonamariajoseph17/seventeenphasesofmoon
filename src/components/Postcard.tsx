import { forwardRef } from "react";
import { MoonSvg } from "./MoonSvg";
import type { AccurateMoonInfo } from "@/lib/astro-accurate";

export const POSTCARD_STYLES = [
  "romantic", "minimal", "vintage", "cinematic", "midnight", "archive",
] as const;
export type PostcardStyle = (typeof POSTCARD_STYLES)[number];

export const POSTCARD_FORMATS = {
  square: { w: 1080, h: 1080, label: "Square · 1080×1080" },
  story: { w: 1080, h: 1920, label: "Story · 1080×1920" },
  print: { w: 1500, h: 1050, label: "Postcard · 6×4.2 in" },
} as const;
export type PostcardFormat = keyof typeof POSTCARD_FORMATS;

interface Props {
  style: PostcardStyle;
  format: PostcardFormat;
  moon: AccurateMoonInfo;
  date: Date;
  tz: number;
  city: string;
  recipient: string;
  occasion: string;
  message: string;
  poetic: string;
  illumPct: string;
  dateLabel: string;
  timeLabel: string;
  moonriseLabel?: string;
  moonsetLabel?: string;
}

const STYLE_SHEETS: Record<PostcardStyle, {
  bg: string; fg: string; accent: string; sub: string; heading: string; body: string; vignette?: string;
}> = {
  // Heirloom palettes — ivory, deep navy, charcoal, silver. Museum-restrained.
  romantic: {
    bg: "radial-gradient(ellipse at 50% 25%, #20242e 0%, #14161d 55%, #0b0c10 100%)",
    fg: "#ece8df", accent: "#c8b9a0", sub: "#9a948a",
    heading: "'Cormorant Garamond', serif", body: "'Cormorant Garamond', serif",
    vignette: "radial-gradient(ellipse at 50% 100%, rgba(200,185,160,0.08), transparent 65%)",
  },
  minimal: {
    bg: "linear-gradient(180deg, #111317 0%, #0a0b0e 100%)",
    fg: "#e8e8ea", accent: "#bdbdc2", sub: "#7c7c84",
    heading: "'Inter', sans-serif", body: "'Inter', sans-serif",
  },
  vintage: {
    bg: "radial-gradient(ellipse at 50% 30%, #211c12 0%, #14110b 60%, #0b0906 100%)",
    fg: "#e6dcc4", accent: "#bb9c63", sub: "#998d6f",
    heading: "'Cormorant Garamond', serif", body: "'Cormorant Garamond', serif",
    vignette: "radial-gradient(ellipse at 50% 100%, rgba(187,156,99,0.1), transparent 70%)",
  },
  cinematic: {
    bg: "linear-gradient(180deg, #0e1320 0%, #080b14 60%, #04060c 100%)",
    fg: "#e7eaf0", accent: "#b3bcc9", sub: "#828a99",
    heading: "'Cormorant Garamond', serif", body: "'Inter', sans-serif",
    vignette: "radial-gradient(ellipse at 50% 0%, rgba(179,188,201,0.1), transparent 55%)",
  },
  midnight: {
    bg: "radial-gradient(ellipse at 50% 22%, #131c34 0%, #0a1124 55%, #03060f 100%)",
    fg: "#e4e8f2", accent: "#a8b6d4", sub: "#7884a0",
    heading: "'Cormorant Garamond', serif", body: "'Inter', sans-serif",
    vignette: "radial-gradient(ellipse at 50% 100%, rgba(168,182,212,0.1), transparent 60%)",
  },
  archive: {
    bg: "linear-gradient(180deg, #f4f0e6 0%, #e9e2d2 100%)",
    fg: "#1c1c1c", accent: "#7a6a4a", sub: "#5e564a",
    heading: "'Cormorant Garamond', serif", body: "'Cormorant Garamond', serif",
  },
};

// Tiny deterministic star pattern for the postcard background
function PostcardStars({ seed = 7, count = 80, color }: { seed?: number; count?: number; color: string }) {
  let s = seed;
  const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const stars = Array.from({ length: count }, () => ({
    x: r() * 100, y: r() * 100, sz: 0.5 + r() * 1.8, o: 0.25 + r() * 0.6,
  }));
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
      {stars.map((st, i) => (
        <circle key={i} cx={st.x} cy={st.y} r={st.sz * 0.08} fill={color} opacity={st.o} />
      ))}
    </svg>
  );
}

export const Postcard = forwardRef<HTMLDivElement, Props>(function Postcard(p, ref) {
  const sh = STYLE_SHEETS[p.style];
  const dim = POSTCARD_FORMATS[p.format];
  const isLight = p.style === "archive";
  const isStory = p.format === "story";
  const padding = isStory ? 80 : 64;
  const moonSize = isStory ? 360 : p.format === "print" ? 280 : 320;
  const seed = Math.floor(p.date.getTime() / 86_400_000) || 7;

  return (
    <div
      ref={ref}
      style={{
        width: dim.w,
        height: dim.h,
        background: sh.bg,
        color: sh.fg,
        position: "relative",
        overflow: "hidden",
        fontFamily: sh.body,
        padding,
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
      }}
    >
      {!isLight && <PostcardStars seed={seed} count={isStory ? 140 : 90} color={sh.fg} />}
      {sh.vignette && <div style={{ position: "absolute", inset: 0, background: sh.vignette, pointerEvents: "none" }} />}

      {/* Header */}
      <div style={{ position: "relative", textAlign: "center" }}>
        <p style={{
          fontFamily: sh.body, fontSize: 14, letterSpacing: 6, textTransform: "uppercase",
          color: sh.accent, margin: 0,
        }}>
          {p.occasion || "A moon for you"}
        </p>
        {p.recipient && (
          <h1 style={{
            fontFamily: sh.heading, fontSize: isStory ? 88 : 72, margin: "12px 0 0",
            fontStyle: p.style === "vintage" || p.style === "romantic" ? "italic" : "normal",
            lineHeight: 1.05, fontWeight: 400,
          }}>
            For {p.recipient}
          </h1>
        )}
      </div>

      {/* Moon */}
      <div style={{
        position: "relative", flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        margin: isStory ? "60px 0" : "32px 0",
      }}>
        <div style={{ filter: isLight ? "invert(1) hue-rotate(180deg)" : "none" }}>
          <MoonSvg phaseAngle={p.moon.phaseAngle} illumination={p.moon.illumination} waxing={p.moon.waxing} size={moonSize} />
        </div>
      </div>

      {/* Verified data block */}
      <div style={{ position: "relative", textAlign: "center" }}>
        <p style={{
          fontFamily: sh.heading, fontSize: isStory ? 44 : 36, margin: 0, fontWeight: 400,
          fontStyle: p.style === "romantic" ? "italic" : "normal",
        }}>
          {p.moon.emoji} {p.moon.name}
        </p>
        <p style={{ fontSize: 16, color: sh.sub, margin: "8px 0 0", letterSpacing: 2 }}>
          {p.illumPct}% illuminated · {p.moon.age.toFixed(1)} days · {p.moon.waxing ? "Waxing" : "Waning"} · Moon in {p.moon.constellation}
        </p>

        {/* Poetic line — derived ONLY from verified data */}
        <p style={{
          fontFamily: sh.heading, fontSize: isStory ? 34 : 28, margin: "40px auto 0",
          maxWidth: isStory ? 880 : 760, lineHeight: 1.35, fontStyle: "italic",
          color: sh.fg,
        }}>
          “{p.poetic}”
        </p>

        {p.message && (
          <p style={{
            fontSize: isStory ? 22 : 18, color: sh.sub, margin: "28px auto 0",
            maxWidth: isStory ? 820 : 700, lineHeight: 1.55,
          }}>
            {p.message}
          </p>
        )}

        {/* Footer: date + place + rise/set */}
        <div style={{
          marginTop: isStory ? 60 : 40, display: "flex", justifyContent: "center",
          gap: 32, flexWrap: "wrap", fontSize: 13, letterSpacing: 3, textTransform: "uppercase", color: sh.sub,
        }}>
          <span>{p.dateLabel}</span>
          <span>·</span>
          <span>{p.timeLabel}</span>
          <span>·</span>
          <span>{p.city}</span>
        </div>
        {(p.moonriseLabel || p.moonsetLabel) && (
          <p style={{ marginTop: 10, fontSize: 12, letterSpacing: 3, textTransform: "uppercase", color: sh.sub }}>
            {p.moonriseLabel && <>moonrise {p.moonriseLabel}</>}
            {p.moonriseLabel && p.moonsetLabel && " · "}
            {p.moonsetLabel && <>moonset {p.moonsetLabel}</>}
          </p>
        )}
        <p style={{ marginTop: 18, fontSize: 10, letterSpacing: 4, textTransform: "uppercase", color: sh.sub, opacity: 0.7 }}>
          Verified · astronomy-engine (VSOP87 / ELP2000)
        </p>
      </div>
    </div>
  );
});
