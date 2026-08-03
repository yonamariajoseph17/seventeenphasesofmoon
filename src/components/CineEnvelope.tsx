import { useId } from "react";

/**
 * The envelope of the gift — aged cream paper, vintage moon stamps, a circular
 * birth-city postmark, handwritten names and a burgundy wax seal on the flap.
 * All motion is driven by `phase`, so the reveal sequence controls the timing.
 */

export type EnvelopePhase =
  | "arriving"    // materialising from centre
  | "rest"        // sitting still, sealed
  | "turning"     // rotating to show the back / seal
  | "cracking"    // wax seal glows, then cracks apart
  | "opening"     // flap lifts
  | "empty"       // letter has been drawn out
  | "resealing"   // letter returned, flap closes, seal reforms
  | "sealed";     // whole again

interface Props {
  phase: EnvelopePhase;
  width?: number;
  recipient: string;
  recipientCity?: string;
  sender?: string;
  postmarkCity: string;
  postmarkDate: string;
}

const PAPER = "linear-gradient(146deg, #f3e6cc 0%, #ecdcbc 42%, #e3d0a8 78%, #d8c496 100%)";
const PAPER_DEEP = "linear-gradient(146deg, #e7d5b1 0%, #dcc79c 60%, #cfb787 100%)";
const INK = "#2f2415";
const WAX = "radial-gradient(circle at 36% 30%, #c03a50 0%, #8d1a2c 62%, #5f0f1d 100%)";

export function CineEnvelope({
  phase,
  width = 330,
  recipient,
  recipientCity,
  sender,
  postmarkCity,
  postmarkDate,
}: Props) {
  const uid = useId().replace(/:/g, "");
  const h = width * 0.62;
  const showBack = phase === "turning" || phase === "cracking" || phase === "opening" || phase === "empty" || phase === "resealing" || phase === "sealed";
  const cracked = phase === "cracking" || phase === "opening" || phase === "empty";
  const flapUp = phase === "opening" || phase === "empty";

  return (
    <div
      style={{
        width,
        height: h,
        position: "relative",
        // 2.5° tilt — as if it was just set down
        ["--tilt" as string]: "-2.5deg",
        transform: `rotate(-2.5deg) rotateY(${showBack ? 180 : 0}deg)`,
        transformStyle: "preserve-3d",
        transition: "transform 1.6s cubic-bezier(0.4,0,0.2,1)",
        animation: phase === "arriving" ? "cine-materialise 2.4s cubic-bezier(0.22,0.61,0.36,1) both" : undefined,
        filter: "drop-shadow(0 22px 34px rgba(0,0,0,0.55))",
      }}
    >
      {/* ── FRONT: addressed side ─────────────────────────────────── */}
      <div
        style={{
          position: "absolute", inset: 0, backfaceVisibility: "hidden",
          background: PAPER, borderRadius: 4, overflow: "hidden",
          boxShadow: "inset 0 0 40px rgba(120,90,40,0.28)",
        }}
      >
        <Grain uid={`f${uid}`} />
        <Foxing />
        {/* worn edges */}
        <div style={{ position: "absolute", inset: 0, borderRadius: 4, boxShadow: "inset 0 0 0 1px rgba(120,90,40,0.35), inset 0 0 22px rgba(90,66,30,0.28)", pointerEvents: "none" }} />

        {/* sender, top left */}
        {sender && (
          <p style={{ position: "absolute", top: h * 0.08, left: width * 0.07, margin: 0, fontFamily: "'Caveat', cursive", fontSize: width * 0.052, color: "#4a3a22", transform: "rotate(-1.2deg)" }}>
            {sender}
          </p>
        )}

        {/* stamps + postmark, top right */}
        <div style={{ position: "absolute", top: h * 0.06, right: width * 0.06, display: "flex", gap: width * 0.015 }}>
          <MoonStamp w={width * 0.115} />
          <MoonStamp w={width * 0.115} variant />
        </div>
        <div style={{ position: "absolute", top: h * 0.05, right: width * 0.045 }}>
          <Postmark size={width * 0.2} city={postmarkCity} date={postmarkDate} />
        </div>

        {/* recipient, centre, handwritten */}
        <div style={{ position: "absolute", left: width * 0.2, top: h * 0.47, transform: "rotate(-1deg)" }}>
          <p style={{ margin: 0, fontFamily: "'Caveat', cursive", fontSize: width * 0.086, color: INK, lineHeight: 1.1 }}>{recipient}</p>
          {recipientCity && (
            <p style={{ margin: `${width * 0.012}px 0 0`, fontFamily: "'Caveat', cursive", fontSize: width * 0.058, color: "#54432a", transform: "rotate(0.8deg)" }}>
              {recipientCity}
            </p>
          )}
          <div style={{ marginTop: width * 0.018, width: width * 0.46, height: 1, background: "rgba(90,70,40,0.35)" }} />
          <div style={{ marginTop: width * 0.03, width: width * 0.36, height: 1, background: "rgba(90,70,40,0.28)" }} />
        </div>
      </div>

      {/* ── BACK: flap + wax seal ─────────────────────────────────── */}
      <div
        style={{
          position: "absolute", inset: 0, backfaceVisibility: "hidden",
          transform: "rotateY(180deg)", background: PAPER_DEEP, borderRadius: 4, overflow: "visible",
        }}
      >
        <div style={{ position: "absolute", inset: 0, borderRadius: 4, overflow: "hidden", boxShadow: "inset 0 0 40px rgba(120,90,40,0.3)" }}>
          <Grain uid={`b${uid}`} />
          <Foxing />
          {/* side flaps */}
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, rgba(150,118,70,0.16), transparent 22%, transparent 78%, rgba(150,118,70,0.16))` }} />
          {/* bottom flap seam */}
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: h * 0.52, background: "linear-gradient(180deg, rgba(255,246,222,0.35), rgba(190,160,110,0.18))", clipPath: "polygon(0% 100%, 50% 0%, 100% 100%)" }} />
        </div>

        {/* the flap — hinged at the top, with visible thickness */}
        <div
          style={{
            position: "absolute", left: 0, right: 0, top: 0, height: h * 0.56,
            transformOrigin: "top center",
            transform: `rotateX(${flapUp ? -168 : 0}deg)`,
            transition: "transform 1.5s cubic-bezier(0.33,0.02,0.2,1)",
            transformStyle: "preserve-3d",
          }}
        >
          <div
            style={{
              position: "absolute", inset: 0,
              background: PAPER,
              clipPath: "polygon(0% 0%, 100% 0%, 50% 100%)",
              boxShadow: "0 5px 10px rgba(0,0,0,0.28)",
              borderTop: "1px solid rgba(255,248,226,0.7)",
            }}
          />
          {/* paper thickness at the folded edge */}
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 2, background: "rgba(160,128,78,0.7)" }} />
        </div>

        {/* wax seal at the flap point */}
        <div
          style={{
            position: "absolute", left: "50%", top: h * 0.5,
            width: width * 0.16, height: width * 0.16,
            transform: "translate(-50%,-50%)",
            transition: "opacity 0.6s",
            opacity: phase === "empty" ? 0 : 1,
          }}
        >
          <SealHalf side="l" wax broken={cracked} />
          <SealHalf side="r" wax broken={cracked} />
          <div
            style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              background: WAX,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#f0cfa6", fontFamily: "'Cormorant Garamond', serif", fontSize: width * 0.08,
              clipPath: "polygon(6% 24%, 22% 6%, 62% 2%, 92% 18%, 98% 58%, 84% 88%, 46% 99%, 14% 86%, 2% 56%)",
              boxShadow: "0 4px 10px rgba(0,0,0,0.5), inset 0 2px 3px rgba(255,170,180,0.5)",
              animation: phase === "cracking"
                ? "cine-seal-glow 1.1s ease-in-out 1"
                : phase === "resealing"
                  ? "cine-seal-glow 1.4s ease-in-out 1"
                  : undefined,
              opacity: cracked ? 0 : 1,
              transition: "opacity 0.5s 0.6s",
            }}
          >
            ☾
          </div>
          {cracked && (
            <svg viewBox="0 0 100 100" style={{ position: "absolute", inset: 0 }} aria-hidden>
              <path
                d="M50 4 L44 30 L58 44 L40 58 L52 78 L46 96"
                fill="none" stroke="#3d0a14" strokeWidth="3" strokeLinecap="round"
                strokeDasharray="60" style={{ animation: "cine-crack 0.5s ease-out forwards" }}
              />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

function SealHalf({ side, broken }: { side: "l" | "r"; wax?: boolean; broken: boolean }) {
  return (
    <div
      style={{
        position: "absolute", inset: 0, borderRadius: "50%", background: WAX,
        clipPath: side === "l" ? "polygon(0 0, 52% 0, 44% 100%, 0 100%)" : "polygon(52% 0, 100% 0, 100% 100%, 44% 100%)",
        opacity: broken ? 1 : 0,
        animation: broken ? `${side === "l" ? "cine-seal-split-l" : "cine-seal-split-r"} 1.4s 0.45s cubic-bezier(0.3,0.1,0.2,1) forwards` : undefined,
      }}
    />
  );
}

function Grain({ uid }: { uid: string }) {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" style={{ opacity: 0.22, mixBlendMode: "multiply" }} aria-hidden>
      <filter id={`eg-${uid}`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#eg-${uid})`} />
    </svg>
  );
}

const FOX = [
  [8, 22, 5], [78, 14, 4], [30, 78, 6], [62, 66, 4], [92, 48, 3], [16, 58, 3], [48, 20, 3],
] as const;

function Foxing() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {FOX.map(([x, y, r], i) => (
        <span
          key={i}
          style={{
            position: "absolute", left: `${x}%`, top: `${y}%`, width: r * 2, height: r * 2,
            borderRadius: "50%", background: "radial-gradient(circle, rgba(150,110,60,0.32), transparent 70%)",
          }}
        />
      ))}
    </div>
  );
}

/** Vintage crimson moon stamp with serrated perforation edges. */
function MoonStamp({ w, variant = false }: { w: number; variant?: boolean }) {
  const h = w * 1.25;
  return (
    <div
      style={{
        width: w, height: h, background: variant ? "#8d1f2c" : "#a2262f",
        padding: w * 0.07,
        // serrated edge via a repeating radial mask
        maskImage: "radial-gradient(circle at 3px 3px, transparent 2.4px, #000 2.6px)",
        maskSize: "6px 6px",
        WebkitMaskImage: "radial-gradient(circle at 3px 3px, transparent 2.4px, #000 2.6px)",
        WebkitMaskSize: "6px 6px",
        transform: variant ? "rotate(1.6deg)" : "rotate(-1.4deg)",
      }}
    >
      <div style={{ width: "100%", height: "100%", border: `1px solid rgba(255,225,200,0.6)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: h * 0.05 }}>
        <span style={{ color: "#f7dcbd", fontSize: w * 0.42, lineHeight: 1, fontFamily: "'Cormorant Garamond', serif" }}>{variant ? "☾" : "☽"}</span>
        <span style={{ color: "#f2cfae", fontSize: w * 0.13, letterSpacing: 0.6, textTransform: "uppercase" }}>Sky</span>
      </div>
    </div>
  );
}

/** Classic circular postmark — city arched above, date below. */
function Postmark({ size, city, date }: { size: number; city: string; date: string }) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ opacity: 0.72, transform: "rotate(-8deg)" }} aria-hidden>
      <defs>
        <path id={`arc-${uid}`} d="M18,54 A32,32 0 0 1 82,54" fill="none" />
        <path id={`arcb-${uid}`} d="M20,50 A30,30 0 0 0 80,50" fill="none" />
      </defs>
      <circle cx="50" cy="50" r="46" fill="none" stroke="#5c1420" strokeWidth="2.4" />
      <circle cx="50" cy="50" r="38" fill="none" stroke="#5c1420" strokeWidth="1" />
      <text fontSize="10" fill="#5c1420" letterSpacing="1.4" fontFamily="Inter, sans-serif">
        <textPath href={`#arc-${uid}`} startOffset="50%" textAnchor="middle">{city.toUpperCase().slice(0, 18)}</textPath>
      </text>
      <text fontSize="9" fill="#5c1420" letterSpacing="1" fontFamily="Inter, sans-serif">
        <textPath href={`#arcb-${uid}`} startOffset="50%" textAnchor="middle">{date}</textPath>
      </text>
      <line x1="24" y1="50" x2="76" y2="50" stroke="#5c1420" strokeWidth="1.2" />
      <line x1="28" y1="45" x2="72" y2="45" stroke="#5c1420" strokeWidth="0.8" />
      <line x1="28" y1="55" x2="72" y2="55" stroke="#5c1420" strokeWidth="0.8" />
    </svg>
  );
}
