import { forwardRef } from "react";
import { MoonSvg } from "./MoonSvg";
import { milestoneLabel } from "@/lib/milestones";
import postcardPhoto from "@/assets/file_000000000e5481f4878df9fcaf638fae.png";
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
  name?: string;            // verified phase name, e.g. "Waxing Gibbous"
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

  return (
    <div ref={ref} style={{ ...CARD_STYLE(s.card), fontFamily: s.body, color: s.ink, padding: 72, display: "flex" }}>
      <PaperGrain opacity={s.grainOpacity} light={s.light} />

      {/* fine double ruled frame */}
      <div style={{ position: "absolute", inset: 24, border: `1.5px solid ${s.line}`, borderRadius: 16, opacity: 0.65, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 34, border: `1px solid ${s.line}`, borderRadius: 12, opacity: 0.35, pointerEvents: "none" }} />

      {/* ── Left half — Post Card heading + blank correspondence lines ── */}
      <div style={{ position: "relative", flex: 1.08, paddingRight: 56, display: "flex", flexDirection: "column" }}>
        <p style={{ margin: 0, fontFamily: s.heading, fontSize: 40, letterSpacing: 2, color: s.ink }}>Post Card</p>
        <p style={{ margin: "6px 0 0", fontSize: 11, letterSpacing: 3.5, textTransform: "uppercase", color: s.sub }}>
          This space for correspondence
        </p>
        <div style={{ height: 0, borderTop: `1px solid ${s.line}`, opacity: 0.6, margin: "16px 0 26px", width: "72%" }} />

        <div style={{ marginTop: 40, position: "relative" }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ height: 0, borderBottom: `1.5px solid ${s.line}`, opacity: 0.7, marginBottom: 78, width: i === 2 ? "72%" : "94%" }} />
          ))}
          {/* handwritten message, laid over the ruled lines */}
          <div style={{ position: "absolute", inset: 0, top: -6, right: "8%" }}>
            <p
              style={{
                margin: 0, fontFamily: "'Caveat', cursive", fontSize: 30, lineHeight: "78px",
                color: s.ink, whiteSpace: "pre-wrap", overflow: "hidden",
                display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
              }}
            >
              {p.message || "Every place becomes a little more beautiful when you have someone to share it with."}
            </p>
          </div>
        </div>
        <div style={{ flex: 1 }} />
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

/* ══════════════════════  BACK — REAL PHOTO + MOON  ══════════════════════ */

// Real high-altitude lakes and viewpoints, matched to the region so the caption
// names an actual place — postcard convention, never invented geography.
const SCENE_PLACES: { match: RegExp; place: string }[] = [
  { match: /salem/i, place: "Yercaud Lake, Salem — from the Lake View Point" },
  { match: /tamil\s*nadu/i, place: "Yercaud Lake, Salem — from the Lake View Point" },
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
  return hit?.place ?? "Yercaud Lake, Salem — from the Lake View Point";
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
          position: "relative", margin: "44px 56px 0", padding: 9,
          background: s.light ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.08)",
          boxShadow: `0 0 0 1px ${s.line}`,
        }}
      >
        <div style={{ position: "relative", overflow: "hidden", background: "#04060f" }}>
          <img
            src={postcardPhoto}
            alt=""
            style={{ display: "block", maxWidth: "100%", maxHeight: 620, width: "auto", height: "auto", margin: "0 auto", objectFit: "contain" }}
          />
          {/* subtle darkening so the moon and any text stay legible */}
          <div
            style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(180deg, rgba(4,6,15,0.12) 0%, rgba(4,6,15,0.02) 40%, rgba(4,6,15,0.28) 100%)",
            }}
          />
          {/* the verified, phase-accurate moon — adjust top/left to sit in open sky */}
          <div style={{ position: "absolute", top: "20%", left: "70%", transform: "translate(-50%, -50%)" }}>
            <div style={{ borderRadius: "50%", filter: "drop-shadow(0 0 28px rgba(216,229,255,0.32))" }}>
              <MoonSvg phaseAngle={p.moon.phaseAngle} illumination={p.moon.illumination} waxing={p.moon.waxing} size={120} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Caption line, printed-photo style ── */}
      <div style={{ position: "relative", margin: "14px 56px 0", display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 20 }}>
        <p style={{ margin: 0, fontSize: 13, letterSpacing: 3, textTransform: "uppercase", color: s.ink, fontWeight: 600 }}>
          {scenePlace(p.stateLabel).toUpperCase()}
        </p>
        <p style={{ margin: 0, fontSize: 11, letterSpacing: 2.2, textTransform: "uppercase", color: s.ink, opacity: 0.85, fontWeight: 500 }}>
          {captionLoc || p.city.toUpperCase()} · {p.dateLabel.toUpperCase()} · {phaseText}
        </p>
      </div>

      {/* ── Milestone moon strip — dark plaque, cream type, compact (caption always shows, strip only when data exists) ── */}
      <div style={{ position: "relative", marginTop: "auto", marginBottom: 26, marginLeft: 56, marginRight: 56 }}>
        <div style={{ height: 0, borderTop: `1px solid ${s.line}`, opacity: 0.9, marginBottom: 14 }} />
        {milestones.length > 0 && (
          <div
            style={{
              background: "linear-gradient(160deg, #101830 0%, #0a1022 60%, #070b18 100%)",
              borderRadius: 8, padding: "14px 16px 12px", boxShadow: "inset 0 0 0 1px rgba(226,235,255,0.16)",
              display: "flex", justifyContent: "space-between", alignItems: "flex-end",
            }}
          >
            {milestones.map((m) => (
              <div key={m.age} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
                <div style={{ borderRadius: "50%", boxShadow: "0 0 0 1.5px rgba(214,224,248,0.5), 0 0 14px rgba(180,200,255,0.14)", lineHeight: 0 }}>
                  <MoonSvg phaseAngle={m.phaseAngle} illumination={m.illumination} waxing={m.waxing} size={52} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.8, textTransform: "uppercase", color: "#f7f2e6" }}>
                  {milestoneLabel(m.age)}
                </span>
                {m.name && (
                  <span style={{ fontSize: 9.5, letterSpacing: 1, color: "#dcd3c0", textAlign: "center", whiteSpace: "nowrap" }}>
                    {m.name}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        <p style={{ margin: "10px 0 0", textAlign: "center", fontFamily: s.heading, fontStyle: "italic", fontSize: 15, color: s.ink, opacity: 0.9 }}>
          Below: the moon's phase on {p.recipient || "this"}'s birthday, and how it has changed on each birthday since.
        </p>
      </div>
    </div>
  );
});
