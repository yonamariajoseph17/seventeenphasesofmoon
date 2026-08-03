import { useId, type ReactNode } from "react";

/**
 * The letter itself — aged cream paper with faint ruled lines, a thin red
 * margin, ink bleed-through from the reverse side, corner foxing and a warm
 * lamp-lit vignette. `state` drives the fold choreography.
 */

export type LetterFoldState = "inside" | "rising" | "unfolding" | "open" | "refolding" | "folded";

const PAPER = "linear-gradient(168deg, #f6ead0 0%, #f1e2c1 40%, #ead8b0 78%, #e2cfa2 100%)";

interface Props {
  state: LetterFoldState;
  children: ReactNode;
  /** Faint reversed text showing through the paper. */
  bleedText?: string;
}

export function CineLetter({ state, children, bleedText }: Props) {
  const uid = useId().replace(/:/g, "");
  const open = state === "open" || state === "unfolding";
  const leftOpen = state === "open" || state === "unfolding";
  const rightOpen = state === "open";

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 620,
        perspective: 1600,
        animation:
          state === "rising" ? "cine-letter-pull 1s cubic-bezier(0.25,0.6,0.3,1) both"
          : state === "open" ? "cine-flutter 1.1s 1.4s ease-out both"
          : undefined,
        opacity: state === "inside" ? 0 : 1,
        transition: "opacity 0.5s",
      }}
    >
      <div
        style={{
          position: "relative",
          background: PAPER,
          borderRadius: 3,
          boxShadow: "0 26px 60px rgba(0,0,0,0.55), inset 0 0 80px rgba(140,105,50,0.22)",
          overflow: "hidden",
          transformOrigin: "center",
        }}
      >
        {/* ruled lines + red margin */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(180deg, transparent 0 31px, rgba(96,116,150,0.20) 31px 32px)",
          }}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-y-0" style={{ left: "9%", width: 1.5, background: "rgba(178,88,96,0.5)" }} aria-hidden />

        {/* ink bleed-through from the other side of the paper */}
        {bleedText && (
          <p
            className="pointer-events-none absolute select-none"
            aria-hidden
            style={{
              inset: "12% 8%",
              margin: 0,
              transform: "scaleX(-1)",
              fontFamily: "'Caveat', cursive",
              fontSize: 20,
              lineHeight: 1.7,
              color: "rgba(70,52,28,0.085)",
              filter: "blur(0.7px)",
              overflow: "hidden",
            }}
          >
            {bleedText}
          </p>
        )}

        {/* aged grain */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full" style={{ opacity: 0.16, mixBlendMode: "multiply" }} aria-hidden>
          <filter id={`lg-${uid}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter={`url(#lg-${uid})`} />
        </svg>

        {/* corner foxing */}
        {[["0%", "0%"], ["100%", "0%"], ["0%", "100%"], ["100%", "100%"]].map(([x, y], i) => (
          <span
            key={i}
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              left: x, top: y, width: 90, height: 90, transform: "translate(-50%,-50%)",
              background: "radial-gradient(circle, rgba(152,112,58,0.24), transparent 68%)",
            }}
          />
        ))}

        {/* warm lamp vignette */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{ background: "radial-gradient(ellipse at 50% 44%, rgba(255,240,200,0.16), transparent 58%), radial-gradient(ellipse at 50% 50%, transparent 52%, rgba(78,54,22,0.26) 100%)" }}
        />

        {/* horizontal fold crease */}
        <div className="pointer-events-none absolute inset-x-0" aria-hidden style={{ top: "33%", height: 1, background: "rgba(140,108,58,0.22)" }} />

        {/* content */}
        <div className="relative px-5 py-8 sm:px-10 sm:py-12" style={{ color: "#33260f" }}>
          {children}
        </div>

        {/* fold flaps that swing open (and closed again on the way back) */}
        <Flap side="left" away={leftOpen} uid={uid} />
        <Flap side="right" away={rightOpen} uid={uid} />
      </div>
      {!open && state !== "folded" && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-8" style={{ background: "linear-gradient(180deg, rgba(120,90,40,0.28), transparent)" }} aria-hidden />
      )}
    </div>
  );
}

function Flap({ side, away, uid }: { side: "left" | "right"; away: boolean; uid: string }) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        top: 0, bottom: 0,
        [side]: 0,
        width: "50%",
        background: PAPER,
        transformStyle: "preserve-3d",
        transformOrigin: side === "left" ? "left center" : "right center",
        transform: `rotateY(${away ? (side === "left" ? -179 : 179) : 0}deg)`,
        transition: `transform 0.8s ${side === "left" ? "0s" : "0.85s"} cubic-bezier(0.36,0.06,0.25,1), opacity 0.2s ${away ? "0.75s" : "0s"}`,
        opacity: away ? 0 : 1,
        boxShadow: side === "left" ? "6px 0 14px rgba(0,0,0,0.22)" : "-6px 0 14px rgba(0,0,0,0.22)",
        pointerEvents: "none",
      }}
    >
      <svg className="h-full w-full" style={{ opacity: 0.16, mixBlendMode: "multiply" }} aria-hidden>
        <rect width="100%" height="100%" filter={`url(#lg-${uid})`} />
      </svg>
    </div>
  );
}
