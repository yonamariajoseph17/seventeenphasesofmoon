import { forwardRef } from "react";
import { MoonSvg } from "./MoonSvg";
import type { AccurateMoonInfo } from "@/lib/astro-accurate";

export const POSTCARD_STYLES = [
  "romantic", "minimal", "vintage", "cinematic", "midnight", "archive",
] as const;
export type PostcardStyle = (typeof POSTCARD_STYLES)[number];

// One true physical postcard size — landscape 6×4 proportions, high-res.
export const POSTCARD_W = 1650;
export const POSTCARD_H = 1100;

export interface PostcardMilestone {
  age: number;              // 0 = birth
  phaseAngle: number;
  illumination: number;
  waxing: boolean;
}

interface Props {
  style: PostcardStyle;
  moon: AccurateMoonInfo;
  date: Date;
  tz: number;
  city: string;
  stateLabel?: string;      // e.g. "Tamil Nadu"
  recipient: string;
  sender?: string;
  occasion: string;
  message: string;
  poetic: string;
  illumPct: string;
  dateLabel: string;
  timeLabel: string;
  moonriseLabel?: string;
  moonsetLabel?: string;
  sunriseLabel?: string;
  sunsetLabel?: string;
  milestones?: PostcardMilestone[];
}

interface Stock {
  card: string;        // base card-stock background
  ink: string;         // primary ink
  sub: string;         // secondary ink
  accent: string;      // accent ink
  line: string;        // ruled / divider line color
  heading: string;
  body: string;
  light: boolean;      // light stock (dark ink) vs dark stock (light ink)
  grainOpacity: number;
}

// Physical card-stock palettes — warm cream / aged paper / deep navy board.
const STOCKS: Record<PostcardStyle, Stock> = {
  romantic: {
    card: "linear-gradient(155deg, #f7f0e4 0%, #efe4d1 55%, #e7d8c0 100%)",
    ink: "#3a3128", sub: "#8a7c68", accent: "#b08b5a", line: "#cdbb9f",
    heading: "'Cormorant Garamond', serif", body: "'Cormorant Garamond', serif",
    light: true, grainOpacity: 0.06,
  },
  minimal: {
    card: "linear-gradient(155deg, #f4f4f2 0%, #e9e9e6 100%)",
    ink: "#26262a", sub: "#83838a", accent: "#5a5a62", line: "#cfcfca",
    heading: "'Inter', sans-serif", body: "'Inter', sans-serif",
    light: true, grainOpacity: 0.05,
  },
  vintage: {
    card: "linear-gradient(155deg, #ece0c4 0%, #ddcda6 55%, #cbb888 100%)",
    ink: "#40331d", sub: "#8a7448", accent: "#9c7a3c", line: "#c1a875",
    heading: "'Cormorant Garamond', serif", body: "'Cormorant Garamond', serif",
    light: true, grainOpacity: 0.1,
  },
  cinematic: {
    card: "linear-gradient(155deg, #141a28 0%, #0d1220 60%, #080b14 100%)",
    ink: "#eef1f6", sub: "#9aa4b6", accent: "#b9c4d6", line: "#33405a",
    heading: "'Cormorant Garamond', serif", body: "'Inter', sans-serif",
    light: false, grainOpacity: 0.07,
  },
  midnight: {
    card: "linear-gradient(155deg, #16203c 0%, #0d1530 55%, #060a1c 100%)",
    ink: "#e9edf7", sub: "#9fabcb", accent: "#b6c4e6", line: "#33406a",
    heading: "'Cormorant Garamond', serif", body: "'Inter', sans-serif",
    light: false, grainOpacity: 0.07,
  },
  archive: {
    card: "linear-gradient(155deg, #f4efe3 0%, #ece3d0 100%)",
    ink: "#2a251c", sub: "#7d7461", accent: "#7a6a47", line: "#cabfa6",
    heading: "'Cormorant Garamond', serif", body: "'Cormorant Garamond', serif",
    light: true, grainOpacity: 0.09,
  },
};

// Fine paper-grain overlay (subtle fractal noise, tuned per stock).
function PaperGrain({ opacity, light }: { opacity: number; light: boolean }) {
  return (
    <svg
      aria-hidden
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", mixBlendMode: light ? "multiply" : "screen", opacity }}
    >
      <filter id="pg">
        <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" seed="11" stitchTiles="stitch" />
        <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#pg)" />
    </svg>
  );
}

const CARD_STYLE = (bg: string): React.CSSProperties => ({
  width: POSTCARD_W,
  height: POSTCARD_H,
  background: bg,
  position: "relative",
  overflow: "hidden",
  borderRadius: 28,
  boxSizing: "border-box",
  boxShadow: "inset 0 0 0 1.5px rgba(0,0,0,0.06)",
});

/* ─────────────────────────────  FRONT  ───────────────────────────── */
export const PostcardFront = forwardRef<HTMLDivElement, Props>(function PostcardFront(p, ref) {
  const s = STOCKS[p.style];
  const moonSize = 420;

  return (
    <div ref={ref} style={{ ...CARD_STYLE(s.card), fontFamily: s.body, color: s.ink, padding: 84, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <PaperGrain opacity={s.grainOpacity} light={s.light} />

      {/* subtle printed frame */}
      <div style={{ position: "absolute", inset: 30, border: `1.5px solid ${s.line}`, borderRadius: 18, opacity: 0.6, pointerEvents: "none" }} />

      {/* Header */}
      <div style={{ position: "relative", textAlign: "center" }}>
        <p style={{ margin: 0, fontFamily: s.body, fontSize: 17, letterSpacing: 7, textTransform: "uppercase", color: s.accent }}>
          {p.occasion || "A moon for you"}
        </p>
        {p.recipient && (
          <h1 style={{ margin: "10px 0 0", fontFamily: s.heading, fontSize: 74, fontWeight: 400, lineHeight: 1.02, fontStyle: p.style === "vintage" || p.style === "romantic" ? "italic" : "normal" }}>
            For {p.recipient}
          </h1>
        )}
      </div>

      {/* Moon — hero, seated in a soft printed sky medallion so it reads on any stock */}
      <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", margin: "18px 0" }}>
        <div style={{ position: "absolute", width: moonSize + 150, height: moonSize + 150, borderRadius: "50%", background: "radial-gradient(circle, rgba(8,10,20,0.92) 40%, rgba(8,10,20,0) 72%)" }} />
        <div style={{ position: "relative" }}>
          <MoonSvg phaseAngle={p.moon.phaseAngle} illumination={p.moon.illumination} waxing={p.moon.waxing} size={moonSize} />
        </div>
      </div>

      {/* Phase + poetic line */}
      <div style={{ position: "relative", textAlign: "center", maxWidth: 1200 }}>
        <p style={{ margin: 0, fontFamily: s.heading, fontSize: 40, fontWeight: 400, letterSpacing: 1, fontStyle: p.style === "romantic" ? "italic" : "normal" }}>
          {p.moon.name}
        </p>
        <p style={{ margin: "20px auto 0", maxWidth: 1000, fontFamily: s.heading, fontSize: 30, lineHeight: 1.35, fontStyle: "italic", color: s.ink, opacity: 0.9 }}>
          “{p.poetic}”
        </p>
      </div>

      {/* Bottom edge — location · date · time */}
      <div style={{ position: "relative", marginTop: 26, display: "flex", gap: 26, justifyContent: "center", fontSize: 15, letterSpacing: 3, textTransform: "uppercase", color: s.sub }}>
        <span>{p.city}</span><span>·</span><span>{p.dateLabel}</span><span>·</span><span>{p.timeLabel}</span>
      </div>
    </div>
  );
});

/* ─────────────────────────────  BACK  ───────────────────────────── */
export const PostcardBack = forwardRef<HTMLDivElement, Props>(function PostcardBack(p, ref) {
  const s = STOCKS[p.style];
  const dear = p.recipient ? `Dear ${p.recipient},` : "Dear friend,";
  const signoff = p.sender ? `— ${p.sender}` : "— with love";

  return (
    <div ref={ref} style={{ ...CARD_STYLE(s.card), fontFamily: s.body, color: s.ink, padding: 76, display: "flex" }}>
      <PaperGrain opacity={s.grainOpacity} light={s.light} />

      {/* Left half — handwritten message */}
      <div style={{ position: "relative", flex: 1.15, paddingRight: 60, display: "flex", flexDirection: "column" }}>
        <p style={{ margin: 0, fontFamily: "'Caveat', cursive", fontSize: 44, color: s.ink }}>{dear}</p>
        <p style={{ margin: "22px 0 0", fontFamily: "'Caveat', cursive", fontSize: 34, lineHeight: 1.5, color: s.ink, opacity: 0.92, flex: 1, whiteSpace: "pre-wrap" }}>
          {p.message || "Wherever you are tonight, the same moon is watching over you."}
        </p>
        <p style={{ margin: "20px 0 0", fontFamily: "'Caveat', cursive", fontSize: 40, color: s.accent }}>{signoff}</p>
      </div>

      {/* Vertical dividing line */}
      <div style={{ position: "relative", width: 0, borderLeft: `2px solid ${s.line}`, opacity: 0.75, margin: "6px 0" }} />

      {/* Right half — stamp + address lines */}
      <div style={{ position: "relative", flex: 1, paddingLeft: 60, display: "flex", flexDirection: "column" }}>
        {/* Stamp + postmark */}
        <div style={{ display: "flex", justifyContent: "flex-end", position: "relative", height: 210 }}>
          <div style={{ position: "relative" }}>
            <div style={{
              width: 158, height: 194, border: `2px dashed ${s.line}`, borderRadius: 6,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              background: p.style === "cinematic" || p.style === "midnight" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
            }}>
              <div style={{ borderRadius: "50%", background: "radial-gradient(circle, rgba(8,10,20,0.9) 45%, rgba(8,10,20,0) 75%)", padding: 6 }}>
                <MoonSvg phaseAngle={p.moon.phaseAngle} illumination={p.moon.illumination} waxing={p.moon.waxing} size={96} />
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: s.sub }}>Sky We Share</p>
            </div>
            {/* circular postmark overlay */}
            <svg width="150" height="150" style={{ position: "absolute", top: -34, left: -58, opacity: 0.55 }}>
              <g fill="none" stroke={s.accent} strokeWidth="2">
                <circle cx="75" cy="75" r="58" />
                <circle cx="75" cy="75" r="42" strokeDasharray="3 5" />
              </g>
              <text x="75" y="52" textAnchor="middle" fontSize="10" letterSpacing="2" fill={s.accent} fontFamily={s.body}>
                {p.city.slice(0, 14).toUpperCase()}
              </text>
              <text x="75" y="104" textAnchor="middle" fontSize="10" letterSpacing="2" fill={s.accent} fontFamily={s.body}>
                {p.dateLabel}
              </text>
            </svg>
          </div>
        </div>

        {/* Address ruled lines */}
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 46 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ height: 0, borderBottom: `1.5px solid ${s.line}`, opacity: 0.8, width: i === 0 ? "62%" : "100%" }} />
          ))}
        </div>

        <div style={{ flex: 1 }} />
      </div>

      {/* Printer credit */}
      <p style={{ position: "absolute", bottom: 30, left: 76, margin: 0, fontSize: 12, letterSpacing: 3, textTransform: "uppercase", color: s.sub, opacity: 0.75 }}>
        Sky We Share · astronomy-engine verified
      </p>
    </div>
  );
});
