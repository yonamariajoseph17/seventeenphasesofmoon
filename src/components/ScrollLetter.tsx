import { useId, useState, type ReactNode } from "react";

interface Props {
  /** Called the moment the recipient initiates opening (use to start audio). */
  onOpen?: () => void;
  /** Letter body — rendered on the parchment once it unfurls. */
  children: ReactNode;
  accent: string;
  forName: string;
  dateLine: string;
}

type Phase = "sealed" | "breaking" | "open";

const PARCHMENT = "linear-gradient(177deg, #f4e8c8 0%, #efdfb6 38%, #e7d3a0 72%, #dcc488 100%)";
const INK = "#3a2a14";

/**
 * Ancient scroll reveal. A rolled, wax-sealed parchment appears; the seal
 * breaks, the scroll unfurls downward with realistic curl, and the letter
 * fades in like ink on parchment.
 */
export function ScrollLetter({ onOpen, children, accent, forName, dateLine }: Props) {
  const uid = useId().replace(/:/g, "");
  const [phase, setPhase] = useState<Phase>("sealed");

  function open() {
    if (phase !== "sealed") return;
    onOpen?.();
    setPhase("breaking");
    window.setTimeout(() => setPhase("open"), 620);
  }

  const unfurling = phase === "open";

  return (
    <section className="relative mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-5 py-16">
      <p className="mb-2 text-[11px] tracking-[0.4em] uppercase" style={{ color: accent }}>For {forName}</p>
      <p className="mb-8 text-[10px] tracking-[0.3em] uppercase" style={{ color: `${accent}99` }}>{dateLine}</p>

      <div className="relative w-full" style={{ maxWidth: 560 }}>
        {/* Top roller */}
        <div
          className="relative z-20 mx-auto h-7 w-[101%] rounded-full"
          style={{
            background: "linear-gradient(180deg, #8a652f 0%, #5e421f 45%, #3a280f 100%)",
            boxShadow: "inset 0 2px 3px rgba(255,225,170,0.45), inset 0 -3px 5px rgba(0,0,0,0.5), 0 6px 14px rgba(0,0,0,0.45)",
          }}
        >
          <span className="absolute left-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full" style={{ background: "radial-gradient(circle,#caa05a,#5e421f)" }} />
          <span className="absolute right-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full" style={{ background: "radial-gradient(circle,#caa05a,#5e421f)" }} />
        </div>

        {/* Parchment sheet */}
        <div
          className="relative z-10 mx-auto overflow-hidden"
          style={{
            width: "94%",
            maxHeight: phase === "sealed" ? 0 : undefined,
            background: PARCHMENT,
            boxShadow: "inset 0 0 60px rgba(120,90,40,0.3), 0 18px 40px rgba(0,0,0,0.5)",
            borderLeft: "1px solid rgba(120,90,40,0.25)",
            borderRight: "1px solid rgba(120,90,40,0.25)",
            animation: unfurling ? "scroll-unfurl 1.9s cubic-bezier(0.22,0.61,0.36,1) forwards" : undefined,
          }}
        >
          {/* aged paper grain */}
          <svg className="pointer-events-none absolute inset-0 h-full w-full" style={{ opacity: 0.18, mixBlendMode: "multiply" }} aria-hidden>
            <filter id={`p-${uid}`}>
              <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter={`url(#p-${uid})`} />
          </svg>
          {/* curl shadow at the unrolling edge */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10" style={{ background: "linear-gradient(180deg, transparent, rgba(80,55,20,0.28))" }} />

          <div className="relative px-7 py-10 text-center sm:px-10" style={{ color: INK }}>
            {unfurling ? children : <div style={{ height: 1 }} />}
          </div>
        </div>

        {/* Sealed overlay: rolled scroll + ribbon + wax seal */}
        {phase !== "open" && (
          <div className="absolute inset-x-0 top-0 z-30 flex flex-col items-center">
            {/* rolled body */}
            <div
              className="mt-1 h-16 w-[88%] rounded-md"
              style={{
                background: PARCHMENT,
                boxShadow: "inset 0 6px 10px rgba(255,235,185,0.5), inset 0 -8px 14px rgba(90,65,28,0.5), 0 10px 22px rgba(0,0,0,0.5)",
              }}
            />
            {/* ribbon */}
            <div className={`absolute top-0 left-1/2 h-20 w-7 -translate-x-1/2 ${phase === "breaking" ? "" : ""}`}
              style={{
                background: "linear-gradient(90deg, #6e1226, #a3203c 50%, #6e1226)",
                opacity: phase === "breaking" ? 0 : 0.9,
                transition: "opacity 0.5s",
              }}
            />
            {/* wax seal */}
            <div
              className={`absolute left-1/2 top-[2.1rem] flex h-12 w-12 items-center justify-center rounded-full ${phase === "breaking" ? "animate-seal-break" : ""}`}
              style={{
                transform: "translate(-50%,-50%)",
                background: "radial-gradient(circle at 38% 32%, #c23a52, #7e1528 70%, #5c0f1d)",
                boxShadow: "0 4px 10px rgba(0,0,0,0.5), inset 0 2px 3px rgba(255,170,180,0.5)",
                color: "#f3d8b0",
                fontFamily: "'Cormorant Garamond', serif",
              }}
              aria-hidden
            >
              <span className="text-lg" style={{ fontStyle: "italic" }}>☾</span>
            </div>
          </div>
        )}
      </div>

      {phase === "sealed" && (
        <button
          type="button"
          onClick={open}
          className="mt-12 rounded-full px-8 py-3 text-xs tracking-[0.35em] uppercase transition-opacity hover:opacity-80"
          style={{ border: `1px solid ${accent}`, color: accent, background: "transparent" }}
        >
          Break the seal
        </button>
      )}
    </section>
  );
}
