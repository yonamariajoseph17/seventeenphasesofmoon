import { useId } from "react";
import type { LetterStyle } from "@/lib/letter";
import { StarField } from "@/components/StarField";

interface Props {
  style: LetterStyle;
  seed: number;
}

/** Reusable fine-grain noise overlay (paper / film grain). */
function Grain({ opacity, freq = 0.9, blend = "overlay" as const }: { opacity: number; freq?: number; blend?: "overlay" | "multiply" | "soft-light" }) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" style={{ opacity, mixBlendMode: blend }} aria-hidden>
      <filter id={`grain-${uid}`}>
        <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#grain-${uid})`} />
    </svg>
  );
}

/**
 * Premium, emotionally-tuned background for each Moon Letter style.
 * Pure CSS / inline-SVG layers — no images to load, smooth on mobile.
 */
export function LetterBackground({ style, seed }: Props) {
  if (style === "midnight") {
    return (
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" style={{ background: "radial-gradient(ellipse at 50% -10%, #1a2c63 0%, #0b163c 45%, #060c24 72%, #02040f 100%)" }}>
        {/* nebula wisps */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(40% 30% at 78% 18%, rgba(120,150,255,0.16), transparent 70%), radial-gradient(50% 35% at 18% 72%, rgba(90,70,160,0.18), transparent 72%)" }} />
        {/* faint moon glow in corner */}
        <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full" style={{ background: "radial-gradient(circle, rgba(210,222,255,0.35), transparent 65%)", filter: "blur(8px)" }} />
        <StarField seed={seed} className="absolute inset-0 h-full w-full opacity-70" count={150} />
        <Grain opacity={0.06} freq={0.85} blend="soft-light" />
      </div>
    );
  }

  if (style === "romantic") {
    return (
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" style={{ background: "linear-gradient(160deg, #4a0f23 0%, #2a0d2e 48%, #160a26 78%, #0a0514 100%)" }}>
        {/* candlelight vignette */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 38%, rgba(255,190,120,0.12), transparent 55%)", boxShadow: "inset 0 0 220px 60px rgba(20,4,12,0.7)" }} />
        {/* rose petal texture (soft scattered ovals) */}
        <div className="absolute inset-0 opacity-[0.10]" style={{ background: "radial-gradient(8px 14px at 12% 22%, #d98aa0, transparent 60%), radial-gradient(10px 16px at 82% 30%, #c06a86, transparent 60%), radial-gradient(7px 12px at 68% 78%, #d98aa0, transparent 60%), radial-gradient(9px 15px at 28% 84%, #b85e7c, transparent 60%)", filter: "blur(1px)" }} />
        {/* golden particles rising */}
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} className="absolute bottom-0 rounded-full" style={{
            left: `${(i * 37 + seed) % 100}%`,
            height: 4 + (i % 3) * 2, width: 4 + (i % 3) * 2,
            background: "radial-gradient(circle, rgba(255,214,140,0.95), rgba(255,190,110,0))",
            animation: `letter-float-up ${7 + (i % 5)}s linear ${i * 0.8}s infinite`,
          }} />
        ))}
        <Grain opacity={0.05} blend="soft-light" />
      </div>
    );
  }

  if (style === "vintage") {
    return (
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" style={{ background: "linear-gradient(165deg, #efe2c2 0%, #e6d4ac 42%, #d8c193 78%, #c9ad7c 100%)" }}>
        {/* amber warmth + corner ink stains */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(255,236,190,0.5), transparent 60%)", boxShadow: "inset 0 0 200px 50px rgba(120,90,45,0.35)" }} />
        <div className="absolute -left-10 -top-10 h-44 w-44 rounded-full" style={{ background: "radial-gradient(circle, rgba(90,60,25,0.22), transparent 65%)", filter: "blur(6px)" }} />
        <div className="absolute -bottom-12 right-4 h-52 w-52 rounded-full" style={{ background: "radial-gradient(circle, rgba(110,75,35,0.18), transparent 68%)", filter: "blur(8px)" }} />
        <Grain opacity={0.16} freq={0.7} blend="multiply" />
      </div>
    );
  }

  if (style === "archive") {
    return (
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" style={{ background: "linear-gradient(180deg, #26241f 0%, #1c1a16 55%, #121110 100%)" }}>
        {/* light leak at top */}
        <div className="absolute inset-x-0 top-0 h-1/2" style={{ background: "linear-gradient(180deg, rgba(214,170,120,0.22), transparent 70%)" }} />
        <div className="absolute -right-10 -top-10 h-56 w-72 rounded-full" style={{ background: "radial-gradient(circle, rgba(230,180,120,0.3), transparent 65%)", filter: "blur(20px)" }} />
        {/* warm sepia wash */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 60%, rgba(120,90,55,0.12), transparent 70%)" }} />
        <Grain opacity={0.14} freq={1.0} blend="overlay" />
      </div>
    );
  }

  if (style === "minimal") {
    return (
      <div className="pointer-events-none fixed inset-0 -z-10" style={{ background: "linear-gradient(180deg, #f6f6f4 0%, #eeeeec 100%)" }}>
        <div className="absolute left-1/2 top-1/2 h-px w-40 -translate-x-1/2 -translate-y-1/2" style={{ background: "rgba(0,0,0,0.18)" }} />
      </div>
    );
  }

  // golden
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" style={{ background: "radial-gradient(ellipse at 50% 12%, #5a3d0a 0%, #3a2706 45%, #20150300 0%, #271905 60%, #140c02 100%)" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 18%, rgba(255,210,120,0.22), transparent 58%)" }} />
      {/* celestial map lines */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.08]" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        {Array.from({ length: 7 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 16 + 4} x2="100" y2={i * 16 + 4} stroke="#f3c969" strokeWidth="0.15" />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 20 + 6} y1="0" x2={i * 20 + 6} y2="100" stroke="#f3c969" strokeWidth="0.15" />
        ))}
        <circle cx="50" cy="40" r="26" fill="none" stroke="#f3c969" strokeWidth="0.2" />
      </svg>
      {/* bokeh light circles */}
      {Array.from({ length: 9 }).map((_, i) => (
        <span key={i} className="absolute rounded-full" style={{
          left: `${(i * 29 + seed) % 95}%`, top: `${(i * 41 + seed * 2) % 88}%`,
          height: 24 + (i % 4) * 16, width: 24 + (i % 4) * 16,
          background: "radial-gradient(circle, rgba(255,214,140,0.5), transparent 70%)",
          filter: "blur(6px)",
          animation: `letter-bokeh ${6 + (i % 4)}s ease-in-out ${i * 0.6}s infinite`,
        }} />
      ))}
      <Grain opacity={0.05} blend="soft-light" />
    </div>
  );
}
