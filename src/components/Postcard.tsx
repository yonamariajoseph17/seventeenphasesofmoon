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

// Real high-altitude lakes and viewpoints, matched to the region so the caption
// names an actual place — postcard convention, never invented geography.
const SCENE_PLACES: { match: RegExp; place: string }[] = [
  { match: /tamil\s*nadu/i, place: "Emerald Lake, Nilgiris — from the South Shore" },
  { match: /kerala/i, place: "Mattupetty Lake, Munnar — from the Dam Road" },
  { match: /karnataka/i, place: "Kaveri Backwaters, Coorg — from Kushalnagar" },
  { match: /andhra|telangana/i, place: "Himayat Sagar, Deccan Plateau — from the East Bund" },
  { match: /himachal|uttarakhand|ladakh|kashmir|jammu/i, place: "Pangong Tso, Ladakh — from the West Shore" },
  { match: /sikkim|bengal|assam|meghalaya/i, place: "Umiam Lake, Meghalaya — from the Shillong Road" },
  { match: /maharashtra|goa/i, place: "Bhandardara Lake, Sahyadri — from Wilson Dam" },
  { match: /rajasthan|gujarat/i, place: "Lake Pichola, Aravalli — from the Ambrai Ghat" },
];

function scenePlace(stateLabel?: string): string {
  const hit = SCENE_PLACES.find((s) => s.match.test(stateLabel ?? ""));
  return hit?.place ?? "Emerald Lake, Nilgiris — from the South Shore";
}

export const PostcardBack = forwardRef<HTMLDivElement, Props>(function PostcardBack(p, ref) {
  const s = STOCKS[p.style];
  const milestones = p.milestones ?? [];
  const captionLoc = [p.city, p.stateLabel].filter(Boolean).join(", ").toUpperCase();
  const phaseText = `${p.moon.name.toUpperCase()} · ${p.illumPct}% ILLUMINATED`;

  return (
    <div ref={ref} style={{ ...CARD_STYLE(s.card), fontFamily: s.body, color: s.ink, padding: 0, display: "flex", flexDirection: "column" }}>
      <PaperGrain opacity={Math.max(s.grainOpacity, 0.09)} light={s.light} />

      {/* ruled frame on the cream card stock */}
      <div style={{ position: "absolute", inset: 22, border: `1.5px solid ${s.line}`, borderRadius: 16, opacity: 0.6, pointerEvents: "none" }} />

      {/* ── Mounted photograph: cream card-stock mount visible around the scene ── */}
      <div
        style={{
          position: "relative", margin: "52px 56px 0", padding: 9,
          background: s.light ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.08)",
          boxShadow: `0 0 0 1px ${s.line}`,
        }}
      >
        <div style={{ position: "relative", height: 606, overflow: "hidden", background: "#04060f" }}>
          <NightScene moon={p.moon} />
        </div>
      </div>

      {/* ── Caption line, printed-photo style ── */}
      <div style={{ position: "relative", margin: "14px 56px 0", display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 20 }}>
        <p style={{ margin: 0, fontSize: 13, letterSpacing: 3, textTransform: "uppercase", color: s.ink, fontWeight: 600 }}>
          {scenePlace(p.stateLabel).toUpperCase()}
        </p>
        <p style={{ margin: 0, fontSize: 11.5, letterSpacing: 2.5, textTransform: "uppercase", color: s.accent }}>
          {captionLoc || p.city.toUpperCase()} · {p.dateLabel.toUpperCase()} · {phaseText}
        </p>
      </div>

      {/* ── Milestone moon strip — dark plaque, cream type ── */}
      {milestones.length > 0 && (
        <div style={{ position: "relative", marginTop: "auto", marginBottom: 44, marginLeft: 56, marginRight: 56 }}>
          <div style={{ height: 0, borderTop: `1px solid ${s.line}`, opacity: 0.9, marginBottom: 18 }} />
          <div
            style={{
              background: "linear-gradient(160deg, #101830 0%, #0a1022 60%, #070b18 100%)",
              borderRadius: 8, padding: "22px 20px 18px", boxShadow: "inset 0 0 0 1px rgba(226,235,255,0.16)",
              display: "flex", justifyContent: "space-between", alignItems: "flex-end",
            }}
          >
            {milestones.map((m) => (
              <div key={m.age} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 9, flex: 1 }}>
                <div style={{ borderRadius: "50%", boxShadow: "0 0 0 1.5px rgba(214,224,248,0.5), 0 0 22px rgba(180,200,255,0.14)", lineHeight: 0 }}>
                  <MoonSvg phaseAngle={m.phaseAngle} illumination={m.illumination} waxing={m.waxing} size={96} />
                </div>
                {m.name && (
                  <span style={{ fontSize: 10, letterSpacing: 1.4, color: "#c7d2ea", textAlign: "center", whiteSpace: "nowrap" }}>
                    {m.name}
                  </span>
                )}
                <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 2.6, textTransform: "uppercase", color: "#f3efe4" }}>
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

/* ── deterministic pseudo-random so SSR and client render identically ── */
function rng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t * 1664525 + 1013904223) >>> 0;
    return t / 4294967296;
  };
}

/** Organic ridge path: jittered peaks, no straight slopes, no repeated shapes. */
function ridgePath(seed: number, W: number, baseY: number, amp: number, segments: number, floor: number) {
  const r = rng(seed);
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= segments; i++) {
    const x = (W * i) / segments;
    const wobble = Math.sin(i * 1.7 + seed) * 0.35 + Math.sin(i * 0.6 + seed * 0.3) * 0.4;
    const y = baseY - amp * (0.35 + 0.65 * r()) - wobble * amp * 0.3;
    pts.push({ x, y });
  }
  let d = `M0 ${floor} L0 ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const cur = pts[i];
    const cx = (prev.x + cur.x) / 2;
    d += ` Q${cx.toFixed(1)} ${(prev.y + (cur.y - prev.y) * 0.15).toFixed(1)} ${cur.x.toFixed(1)} ${cur.y.toFixed(1)}`;
  }
  d += ` L${W} ${floor} Z`;
  return d;
}

/**
 * A cinematic night landscape: layered organic ridgelines with atmospheric
 * perspective, a dense irregular treeline, a still lake carrying the moon's
 * light path, cloud wisps and naturally clustered stars. The moon itself is
 * always the verified MoonSvg — never a decorative circle.
 */
function NightScene({ moon }: { moon: AccurateMoonInfo }) {
  const W = 1540;
  const H = 606;
  const horizon = 372;
  const moonSize = 190;
  const moonCx = W * 0.755;
  const moonCy = 132;

  // Stars: clustered, size- and brightness-varied, thinning toward the horizon.
  const r = rng(90210);
  const stars = Array.from({ length: 420 }).map((_, i) => {
    const x = r() * W;
    // bias density upward and toward centre
    const y = Math.pow(r(), 1.5) * (horizon - 8);
    const nearHorizon = y / horizon;
    // faint Milky Way diagonal: extra weight for stars near the band
    const bandDist = Math.abs((y - (0.28 * horizon + (x / W) * 0.34 * horizon)) / horizon);
    const bandBoost = Math.max(0, 1 - bandDist * 3.4);
    const keep = r() < 0.55 + bandBoost * 0.4 - nearHorizon * 0.35;
    const roll = r();
    const rad = roll > 0.965 ? 1.9 + r() * 0.7 : roll > 0.85 ? 1.35 : 0.6 + r() * 0.45;
    const o = (roll > 0.965 ? 0.9 + r() * 0.1 : 0.28 + r() * 0.34) * (1 - nearHorizon * 0.45);
    const warm = bandBoost > 0.35;
    // keep the sky around the moon clear
    const nearMoon = Math.hypot(x - moonCx, y - moonCy) < moonSize * 0.85;
    return { x, y, rad, o, warm, key: i, show: keep && !nearMoon, bright: roll > 0.965 };
  }).filter((st) => st.show);

  const treeR = rng(4477);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <linearGradient id="pc-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#02040c" />
            <stop offset="22%" stopColor="#060b1e" />
            <stop offset="44%" stopColor="#0b1330" />
            <stop offset="66%" stopColor="#132043" />
            <stop offset="86%" stopColor="#20305a" />
            <stop offset="100%" stopColor="#3a4a72" />
          </linearGradient>
          <radialGradient id="pc-moonglow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(216,229,255,0.5)" />
            <stop offset="35%" stopColor="rgba(178,199,246,0.22)" />
            <stop offset="70%" stopColor="rgba(140,165,225,0.07)" />
            <stop offset="100%" stopColor="rgba(140,165,225,0)" />
          </radialGradient>
          <linearGradient id="pc-milky" x1="0" y1="0" x2="1" y2="0.7">
            <stop offset="0%" stopColor="rgba(226,214,196,0)" />
            <stop offset="50%" stopColor="rgba(228,216,198,0.12)" />
            <stop offset="100%" stopColor="rgba(226,214,196,0)" />
          </linearGradient>
          <linearGradient id="pc-haze" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(196,214,255,0)" />
            <stop offset="100%" stopColor="rgba(206,221,255,0.3)" />
          </linearGradient>
          <linearGradient id="pc-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#26365e" />
            <stop offset="18%" stopColor="#16224a" />
            <stop offset="60%" stopColor="#0b1330" />
            <stop offset="100%" stopColor="#050a1a" />
          </linearGradient>
          <linearGradient id="pc-path" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(232,240,255,0.62)" />
            <stop offset="45%" stopColor="rgba(216,229,255,0.3)" />
            <stop offset="100%" stopColor="rgba(206,222,255,0.1)" />
          </linearGradient>
          <filter id="pc-blur"><feGaussianBlur stdDeviation="30" /></filter>
          <filter id="pc-blur-md"><feGaussianBlur stdDeviation="14" /></filter>
          <filter id="pc-blur-sm"><feGaussianBlur stdDeviation="5" /></filter>
          <filter id="pc-star-glow"><feGaussianBlur stdDeviation="1.6" /></filter>
          <filter id="pc-ripple">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.16" numOctaves="2" seed="7" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="9" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>

        {/* sky */}
        <rect x="0" y="0" width={W} height={H} fill="url(#pc-sky)" />

        {/* faint warm Milky Way axis */}
        <g filter="url(#pc-blur)" opacity="0.9">
          <ellipse cx={W * 0.5} cy={horizon * 0.44} rx={W * 0.62} ry={96} transform={`rotate(-14 ${W * 0.5} ${horizon * 0.44})`} fill="url(#pc-milky)" />
        </g>

        {/* moonlight spilling into the sky */}
        <circle cx={moonCx} cy={moonCy} r={430} fill="url(#pc-moonglow)" />

        {/* stars */}
        <g>
          {stars.map((st) => (
            <circle
              key={st.key}
              cx={st.x}
              cy={st.y}
              r={st.rad}
              fill={st.warm ? "#f2ecdd" : "#e8eeff"}
              opacity={st.o}
              filter={st.bright ? "url(#pc-star-glow)" : undefined}
            />
          ))}
        </g>

        {/* cloud wisps drifting across the upper sky */}
        <g filter="url(#pc-blur-md)">
          <ellipse cx={W * 0.72} cy={moonCy + 24} rx={330} ry={26} fill="rgba(206,220,255,0.14)" transform={`rotate(-6 ${W * 0.72} ${moonCy + 24})`} />
          <ellipse cx={W * 0.3} cy={116} rx={280} ry={20} fill="rgba(150,170,215,0.1)" transform={`rotate(4 ${W * 0.3} 116)`} />
          <ellipse cx={W * 0.52} cy={214} rx={380} ry={24} fill="rgba(10,14,32,0.35)" transform={`rotate(-3 ${W * 0.52} 214)`} />
          <ellipse cx={W * 0.14} cy={252} rx={230} ry={18} fill="rgba(190,206,248,0.1)" />
        </g>

        {/* atmospheric haze where sky meets the ridges */}
        <rect x="0" y={horizon - 170} width={W} height={170} fill="url(#pc-haze)" opacity="0.55" />

        {/* far ridge — blue-grey, atmospheric perspective */}
        <path d={ridgePath(31, W, horizon, 190, 13, horizon)} fill="#2b3a63" opacity="0.62" />
        {/* middle ridge */}
        <path d={ridgePath(58, W, horizon, 140, 17, horizon)} fill="#1a2748" opacity="0.9" />
        {/* near ridge — charcoal */}
        <path d={ridgePath(97, W, horizon + 4, 92, 23, horizon + 6)} fill="#080d1d" />

        {/* dense irregular treeline along the near shore */}
        <g fill="#050914">
          {Array.from({ length: 120 }).map((_, i) => {
            const cluster = 1 + treeR() * 0.7;
            const x = (W * i) / 118 + (treeR() - 0.5) * 16;
            const h = (18 + treeR() * 34) * cluster;
            const w = 5 + treeR() * 6;
            const base = horizon + 6;
            return (
              <path
                key={i}
                d={`M${x.toFixed(1)} ${base} L${(x - w).toFixed(1)} ${base} L${(x - w * 0.45).toFixed(1)} ${(base - h * 0.55).toFixed(1)} L${x.toFixed(1)} ${(base - h).toFixed(1)} L${(x + w * 0.45).toFixed(1)} ${(base - h * 0.55).toFixed(1)} L${(x + w).toFixed(1)} ${base} Z`}
              />
            );
          })}
          {/* a few taller firs breaking the treeline */}
          {Array.from({ length: 14 }).map((_, i) => {
            const x = 40 + treeR() * (W - 80);
            const h = 58 + treeR() * 40;
            const base = horizon + 6;
            return <path key={`t${i}`} d={`M${x.toFixed(1)} ${base} L${(x - 8).toFixed(1)} ${base} L${x.toFixed(1)} ${(base - h).toFixed(1)} L${(x + 8).toFixed(1)} ${base} Z`} />;
          })}
        </g>

        {/* lake */}
        <rect x="0" y={horizon + 6} width={W} height={H - horizon - 6} fill="url(#pc-water)" />

        {/* distorted reflection of the ridges */}
        <g opacity="0.22" filter="url(#pc-ripple)">
          <g transform={`translate(0 ${(horizon + 6) * 2}) scale(1 -1)`}>
            <path d={ridgePath(97, W, horizon + 4, 92, 23, horizon + 6)} fill="#0d1730" />
          </g>
        </g>

        {/* moonlight path — narrow at the far shore, wider at the near edge */}
        <g filter="url(#pc-blur-sm)" opacity="0.9">
          <path
            d={`M${moonCx - 24} ${horizon + 6} L${moonCx + 24} ${horizon + 6} L${moonCx + 132} ${H} L${moonCx - 132} ${H} Z`}
            fill="url(#pc-path)"
          />
        </g>
        {/* broken glitter across the light path */}
        <g stroke="rgba(240,246,255,0.5)" strokeWidth="1.4" fill="none">
          {Array.from({ length: 26 }).map((_, i) => {
            const t = i / 25;
            const y = horizon + 12 + t * (H - horizon - 16);
            const half = 22 + t * 118;
            const len = half * (0.25 + treeR() * 0.85);
            const x = moonCx - half + treeR() * (2 * half - len);
            return <line key={i} x1={x} y1={y} x2={x + len} y2={y} opacity={0.6 - t * 0.35} />;
          })}
        </g>
        {/* faint overall water texture */}
        <g stroke="rgba(190,208,248,0.13)" strokeWidth="1" fill="none">
          {Array.from({ length: 22 }).map((_, i) => {
            const y = horizon + 14 + i * 10.5;
            const len = 120 + treeR() * 700;
            const x = treeR() * (W - len);
            return <line key={i} x1={x} y1={y} x2={x + len} y2={y} />;
          })}
        </g>
        <rect x="0" y={horizon + 5} width={W} height="2" fill="rgba(214,228,255,0.28)" />
      </svg>

      {/* the verified moon, clearing the ridge at upper right */}
      <div
        style={{
          position: "absolute",
          left: `${(moonCx / W) * 100}%`,
          top: `${(moonCy / H) * 100}%`,
          transform: "translate(-50%, -50%)",
        }}
      >
        <MoonSvg phaseAngle={moon.phaseAngle} illumination={moon.illumination} waxing={moon.waxing} size={moonSize} />
      </div>
      {/* cloud wisp passing in front of the moon */}
      <div
        aria-hidden
        style={{
          position: "absolute", left: 0, right: 0,
          top: `${((moonCy + moonSize * 0.3) / H) * 100}%`,
          height: 46,
          background: "linear-gradient(90deg, rgba(198,214,255,0) 0%, rgba(202,216,255,0.16) 40%, rgba(202,216,255,0.2) 62%, rgba(198,214,255,0) 100%)",
          filter: "blur(13px)", pointerEvents: "none",
        }}
      />
    </div>
  );
}

