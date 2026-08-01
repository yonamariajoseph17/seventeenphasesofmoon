import { forwardRef } from "react";
import { MoonSvg } from "./MoonSvg";
import { milestoneLabel } from "@/lib/milestones";
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
  recipientCity?: string;   // written on the address lines
  sender?: string;
  occasion: string;
  message: string;
  poetic: string;
  letterExcerpt?: string;   // short preview of the personal letter
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

/* ══════════════════════════  FRONT — ADDRESS SIDE  ══════════════════════════ */
export const PostcardFront = forwardRef<HTMLDivElement, Props>(function PostcardFront(p, ref) {
  const s = STOCKS[p.style];
  const dear = p.recipient ? `Dear ${p.recipient},` : "Dear friend,";
  const signoff = p.sender ? `Yours, ${p.sender}` : "Yours, always";
  const messageLen = (p.message || "").length;
  const msgFont = messageLen > 320 ? 26 : messageLen > 200 ? 30 : 34;

  return (
    <div ref={ref} style={{ ...CARD_STYLE(s.card), fontFamily: s.body, color: s.ink, padding: 72, display: "flex" }}>
      <PaperGrain opacity={s.grainOpacity} light={s.light} />

      {/* fine double ruled frame */}
      <div style={{ position: "absolute", inset: 24, border: `1.5px solid ${s.line}`, borderRadius: 16, opacity: 0.65, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 34, border: `1px solid ${s.line}`, borderRadius: 12, opacity: 0.35, pointerEvents: "none" }} />

      {/* ── Left half — Post Card heading + handwritten message ── */}
      <div style={{ position: "relative", flex: 1.08, paddingRight: 56, display: "flex", flexDirection: "column" }}>
        <p style={{ margin: 0, fontFamily: s.heading, fontSize: 40, letterSpacing: 2, color: s.ink }}>Post Card</p>
        <p style={{ margin: "6px 0 0", fontSize: 11, letterSpacing: 3.5, textTransform: "uppercase", color: s.sub }}>
          This space for writing messages
        </p>
        <div style={{ height: 0, borderTop: `1px solid ${s.line}`, opacity: 0.6, margin: "16px 0 26px", width: "72%" }} />

        <p style={{ margin: 0, fontFamily: "'Caveat', cursive", fontSize: 38, color: s.ink }}>{dear}</p>
        <p
          style={{
            margin: "14px 0 0", fontFamily: "'Caveat', cursive", fontSize: msgFont, lineHeight: 1.45,
            color: s.ink, opacity: 0.93, flex: 1, whiteSpace: "pre-wrap",
            overflowWrap: "anywhere", wordBreak: "break-word", overflow: "hidden",
          }}
        >
          {p.message || "Wherever you are tonight, the same moon is watching over you."}
        </p>
        <p style={{ margin: "12px 0 0", fontFamily: "'Caveat', cursive", fontSize: 34, color: s.accent }}>{signoff}</p>
      </div>

      {/* ── Vertical dividing line ── */}
      <div style={{ position: "relative", width: 0, borderLeft: `2px solid ${s.line}`, opacity: 0.8, margin: "8px 0 60px" }} />

      {/* ── Right half — celestial stamp + address lines ── */}
      <div style={{ position: "relative", flex: 1, paddingLeft: 56, display: "flex", flexDirection: "column" }}>
        {/* Celestial stamp with birth postmark */}
        <div style={{ display: "flex", justifyContent: "flex-end", position: "relative", height: 216 }}>
          <div style={{ position: "relative" }}>
            <div style={{
              width: 162, height: 198, border: `2px dashed ${s.line}`, borderRadius: 6,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              background: s.light ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.03)",
            }}>
              <div style={{ borderRadius: "50%", background: "radial-gradient(circle, rgba(8,10,20,0.92) 45%, rgba(8,10,20,0) 76%)", padding: 6 }}>
                <MoonSvg phaseAngle={p.moon.phaseAngle} illumination={p.moon.illumination} waxing={p.moon.waxing} size={98} />
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: s.sub }}>Sky We Share</p>
            </div>
            {/* circular birth postmark */}
            <svg width="164" height="164" style={{ position: "absolute", top: 6, left: -70, opacity: 0.6 }} aria-hidden>
              <g fill="none" stroke={s.accent} strokeWidth="2">
                <circle cx="82" cy="82" r="62" />
                <circle cx="82" cy="82" r="45" strokeDasharray="3 5" />
              </g>
              <text x="82" y="56" textAnchor="middle" fontSize="10.5" letterSpacing="2" fill={s.accent} fontFamily={s.body}>
                {p.city.slice(0, 14).toUpperCase()}
              </text>
              <text x="82" y="114" textAnchor="middle" fontSize="10.5" letterSpacing="2" fill={s.accent} fontFamily={s.body}>
                {p.dateLabel}
              </text>
            </svg>
          </div>
        </div>

        {/* Address block — recipient name & city written on ruled lines */}
        <div style={{ marginTop: 10 }}>
          <p style={{ margin: "0 0 22px", fontSize: 10.5, letterSpacing: 3.5, textTransform: "uppercase", color: s.sub }}>To</p>
          <AddressLine ink={s.ink} line={s.line} width="80%" value={p.recipient} />
          <AddressLine ink={s.ink} line={s.line} width="100%" value={p.recipientCity ?? ""} />
          <AddressLine ink={s.ink} line={s.line} width="100%" value="" />
        </div>

        <div style={{ flex: 1 }} />
      </div>

      {/* Printer's credit */}
      <p style={{ position: "absolute", bottom: 26, left: "50%", transform: "translateX(-50%)", margin: 0, fontSize: 10.5, letterSpacing: 2.5, textTransform: "uppercase", color: s.sub, opacity: 0.75, whiteSpace: "nowrap" }}>
        Printed under the same sky · Sky We Share · astronomy-engine (VSOP87/ELP2000)
      </p>
    </div>
  );
});

function AddressLine({ ink, line, width, value }: { ink: string; line: string; width: string; value: string }) {
  return (
    <div style={{ width, marginBottom: 44, position: "relative" }}>
      <p style={{
        margin: 0, fontFamily: "'Caveat', cursive", fontSize: 32, color: ink,
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingLeft: 4,
        minHeight: 38, lineHeight: "38px",
      }}>
        {value}
      </p>
      <div style={{ height: 0, borderBottom: `1.5px solid ${line}`, opacity: 0.85 }} />
    </div>
  );
}

/* ══════════════════════  BACK — NIGHT SKY SCENE  ══════════════════════ */
export const PostcardBack = forwardRef<HTMLDivElement, Props>(function PostcardBack(p, ref) {
  const s = STOCKS[p.style];
  const milestones = p.milestones ?? [];
  const captionLoc = [p.city, p.stateLabel].filter(Boolean).join(", ").toUpperCase();
  const phaseText = `${p.moon.name.toUpperCase()} · ${p.illumPct}% ILLUMINATED`;

  return (
    <div ref={ref} style={{ ...CARD_STYLE(s.card), fontFamily: s.body, color: s.ink, padding: 0, display: "flex", flexDirection: "column" }}>
      <PaperGrain opacity={s.grainOpacity} light={s.light} />

      {/* ruled frame */}
      <div style={{ position: "absolute", inset: 22, border: `1.5px solid ${s.line}`, borderRadius: 16, opacity: 0.6, pointerEvents: "none" }} />

      {/* ── Painted night-sky scene ── */}
      <div style={{ position: "relative", height: 700, margin: "42px 42px 0", borderRadius: 12, overflow: "hidden", background: "#070b1b" }}>
        <NightScene moon={p.moon} />
      </div>

      {/* ── Caption line ── */}
      <div style={{ position: "relative", textAlign: "center", marginTop: 16 }}>
        <p style={{ margin: 0, fontSize: 15, letterSpacing: 5, textTransform: "uppercase", color: s.ink }}>
          {captionLoc || p.city.toUpperCase()} · {p.dateLabel.toUpperCase()}
        </p>
        <p style={{ margin: "7px 0 0", fontSize: 12, letterSpacing: 4, textTransform: "uppercase", color: s.sub }}>
          {phaseText}
        </p>
      </div>

      {/* ── Milestone moon strip — birth through 30 ── */}
      {milestones.length > 0 && (
        <div style={{ position: "relative", marginTop: "auto", marginBottom: 34, marginLeft: 42, marginRight: 42 }}>
          <div style={{ height: 0, borderTop: `1px solid ${s.line}`, opacity: 0.55, marginBottom: 14 }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            {milestones.map((m) => (
              <div key={m.age} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1 }}>
                <div style={{ borderRadius: "50%", background: "radial-gradient(circle, rgba(8,10,22,0.9) 45%, rgba(8,10,22,0) 78%)", padding: 4 }}>
                  <MoonSvg phaseAngle={m.phaseAngle} illumination={m.illumination} waxing={m.waxing} size={74} />
                </div>
                <span style={{ fontSize: 10.5, letterSpacing: 2.5, textTransform: "uppercase", color: s.sub }}>
                  {milestoneLabel(m.age)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

/**
 * A quiet, painted landscape: silhouetted ridgelines and pines, a still lake
 * with the moon's reflected column, drifting Milky Way haze and layered stars.
 * The moon itself is the verified MoonSvg — never a decorative circle.
 */
function NightScene({ moon }: { moon: AccurateMoonInfo }) {
  const W = 1566;
  const H = 700;
  const horizon = 430;
  const moonSize = 250;

  const stars = Array.from({ length: 190 }).map((_, i) => {
    const x = ((i * 137.508) % 100) / 100 * W;
    const y = ((i * 61.803) % 100) / 100 * horizon;
    const r = i % 17 === 0 ? 2.1 : i % 5 === 0 ? 1.4 : 0.85;
    const o = 0.18 + ((i * 7) % 10) / 14;
    return { x, y, r, o, key: i };
  });

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <linearGradient id="pc-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#050818" />
            <stop offset="45%" stopColor="#0d1533" />
            <stop offset="78%" stopColor="#1b2a52" />
            <stop offset="100%" stopColor="#2b3c66" />
          </linearGradient>
          <linearGradient id="pc-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1c2c54" />
            <stop offset="60%" stopColor="#0d1730" />
            <stop offset="100%" stopColor="#070c1c" />
          </linearGradient>
          <linearGradient id="pc-milky" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(190,205,255,0)" />
            <stop offset="45%" stopColor="rgba(202,214,255,0.28)" />
            <stop offset="100%" stopColor="rgba(190,205,255,0)" />
          </linearGradient>
          <linearGradient id="pc-glow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(226,235,255,0.4)" />
            <stop offset="100%" stopColor="rgba(226,235,255,0)" />
          </linearGradient>
          <filter id="pc-blur"><feGaussianBlur stdDeviation="26" /></filter>
          <filter id="pc-blur-sm"><feGaussianBlur stdDeviation="7" /></filter>
        </defs>

        {/* sky */}
        <rect x="0" y="0" width={W} height={H} fill="url(#pc-sky)" />

        {/* Milky Way band */}
        <g filter="url(#pc-blur)" opacity="0.85">
          <ellipse cx={W * 0.62} cy={horizon * 0.36} rx={W * 0.52} ry={82} transform={`rotate(-17 ${W * 0.62} ${horizon * 0.36})`} fill="url(#pc-milky)" />
        </g>

        {/* stars */}
        <g>
          {stars.map((st) => (
            <circle key={st.key} cx={st.x} cy={st.y} r={st.r} fill="#e6ecff" opacity={st.o} />
          ))}
        </g>

        {/* horizon glow */}
        <rect x="0" y={horizon - 150} width={W} height={150} fill="url(#pc-glow)" opacity="0.35" />

        {/* far ridgeline */}
        <path
          d={`M0 ${horizon} L0 ${horizon - 96} L150 ${horizon - 150} L300 ${horizon - 88} L460 ${horizon - 176} L620 ${horizon - 96} L790 ${horizon - 190} L960 ${horizon - 104} L1140 ${horizon - 168} L1320 ${horizon - 92} L${W} ${horizon - 140} L${W} ${horizon} Z`}
          fill="#131d3c"
          opacity="0.95"
        />
        {/* near ridgeline */}
        <path
          d={`M0 ${horizon} L0 ${horizon - 52} L210 ${horizon - 108} L420 ${horizon - 44} L640 ${horizon - 122} L880 ${horizon - 50} L1120 ${horizon - 96} L1360 ${horizon - 40} L${W} ${horizon - 78} L${W} ${horizon} Z`}
          fill="#0a1128"
        />

        {/* pine tree line along the shore */}
        <g fill="#060a19">
          {Array.from({ length: 34 }).map((_, i) => {
            const x = 14 + i * 46 + ((i * 13) % 17);
            const h = 46 + ((i * 29) % 44);
            const w = 13 + ((i * 7) % 9);
            return (
              <path key={i} d={`M${x} ${horizon + 2} L${x - w} ${horizon + 2} L${x} ${horizon - h} L${x + w} ${horizon + 2} Z`} />
            );
          })}
        </g>

        {/* lake */}
        <rect x="0" y={horizon} width={W} height={H - horizon} fill="url(#pc-water)" />
        {/* reflected moon column */}
        <g opacity="0.4" filter="url(#pc-blur-sm)">
          <rect x={W * 0.5 - 58} y={horizon} width={116} height={H - horizon} fill="rgba(224,233,255,0.42)" />
        </g>
        {/* water ripples */}
        <g stroke="rgba(214,226,255,0.3)" strokeWidth="1.6" fill="none">
          {Array.from({ length: 13 }).map((_, i) => {
            const y = horizon + 16 + i * 20;
            const len = 120 + ((i * 47) % 190);
            const x = W * 0.5 - len / 2 + (((i * 31) % 60) - 30);
            return <line key={i} x1={x} y1={y} x2={x + len} y2={y} opacity={0.55 - i * 0.03} />;
          })}
        </g>
        <rect x="0" y={horizon} width={W} height="3" fill="rgba(226,235,255,0.22)" />
      </svg>

      {/* the verified moon, high in the sky above the lake */}
      <div style={{ position: "absolute", left: "50%", top: 54, transform: "translateX(-50%)" }}>
        <MoonSvg phaseAngle={moon.phaseAngle} illumination={moon.illumination} waxing={moon.waxing} size={moonSize} />
      </div>
      <p style={{ position: "absolute", left: "50%", top: 54 + moonSize + 10, transform: "translateX(-50%)", margin: 0, fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 28, color: "#e8eeff", whiteSpace: "nowrap" }}>
        {moon.name}
      </p>
    </div>
  );
}
