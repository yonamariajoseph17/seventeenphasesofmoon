import { useId } from "react";
import { FLOWERS, WRAPS, type FlowerId, type WrapId } from "@/lib/letter";

/**
 * Hand-illustrated, watercolor-style bouquet system.
 * Ink outlines + soft watercolor fills that bleed slightly past the linework.
 * All flowers, greenery, wraps and the gift tag share one cohesive look so the
 * builder and the recipient's bouquet render identically.
 */

const INK = "#4a3b33";

type Arch = "round" | "daisy" | "star" | "dense" | "cluster" | "spike";

interface FlowerMeta {
  label: string;
  arch: Arch;
  petal: string;     // main watercolor fill
  petalDeep: string; // shaded inner
  center: string;
}

// Muted, dusty palette only — dusty rose, cream, coral, lavender, mustard, burgundy.
export const FLOWER_META: Record<FlowerId, FlowerMeta> = {
  rose:      { label: "Rose",      arch: "round",   petal: "#cf8a95", petalDeep: "#a85f6d", center: "#8f4a58" },
  peony:     { label: "Peony",     arch: "round",   petal: "#e6bcbe", petalDeep: "#cf9298", center: "#b97880" },
  daisy:     { label: "Daisy",     arch: "daisy",   petal: "#f3ead7", petalDeep: "#e3d5ba", center: "#c99a3a" },
  lily:      { label: "Lily",      arch: "star",    petal: "#e4a583", petalDeep: "#cf8259", center: "#a8623c" },
  orchid:    { label: "Orchid",    arch: "star",    petal: "#bda7cf", petalDeep: "#9a86bb", center: "#7d68a0" },
  marigold:  { label: "Marigold",  arch: "dense",   petal: "#d8a63e", petalDeep: "#c1861f", center: "#9c6a16" },
  carnation: { label: "Carnation", arch: "dense",   petal: "#c47f8b", petalDeep: "#a85f6d", center: "#8c4b58" },
  sunflower: { label: "Sunflower", arch: "daisy",   petal: "#dcac36", petalDeep: "#c1891f", center: "#5a4326" },
  hydrangea: { label: "Hydrangea", arch: "cluster", petal: "#a3b6cd", petalDeep: "#849bb8", center: "#e9ddc4" },
  jasmine:   { label: "Jasmine",   arch: "cluster", petal: "#f4efe4", petalDeep: "#e6dcc6", center: "#d9c67e" },
  tulip:     { label: "Tulip",     arch: "star",    petal: "#a6485a", petalDeep: "#853a49", center: "#6e2f3c" },
  lavender:  { label: "Lavender",  arch: "spike",   petal: "#9d8cc0", petalDeep: "#7d6aa8", center: "#6a5794" },
};

export const WRAP_META: Record<WrapId, { label: string; fill: string; fillDeep: string; ink: string }> = {
  kraft:      { label: "Kraft",       fill: "#c9a87e", fillDeep: "#a9885f", ink: "#6e5334" },
  blush:      { label: "Blush",       fill: "#e6c3c2", fillDeep: "#cf9d9c", ink: "#8f5f5e" },
  sage:       { label: "Sage",        fill: "#a9b79b", fillDeep: "#88977a", ink: "#566047" },
  ivory:      { label: "Ivory",       fill: "#efe7d6", fillDeep: "#d9cdb6", ink: "#8a7c60" },
  dustyblue:  { label: "Dusty Blue",  fill: "#a2b3c6", fillDeep: "#8194ab", ink: "#4f6070" },
  plum:       { label: "Plum",        fill: "#8f6f86", fillDeep: "#6f5268", ink: "#493343" },
  terracotta: { label: "Terracotta",  fill: "#c07b5c", fillDeep: "#a05f43", ink: "#6b3c28" },
  charcoal:   { label: "Charcoal",    fill: "#5c5a5e", fillDeep: "#434247", ink: "#26252a" },
};

/* ─────────── one bloom, top-down, in a 100×100 box centred at 50,50 ─────────── */

function ringPetals(count: number, rx: number, ry: number, cy: number, rot = 0) {
  return Array.from({ length: count }, (_, i) => (360 / count) * i + rot).map((a) => ({ a, rx, ry, cy }));
}

export function FlowerBloom({ flower, size = 100 }: { flower: FlowerId; size?: number }) {
  const uid = useId().replace(/:/g, "");
  const m = FLOWER_META[flower];
  const blur = `wc-${uid}`;
  const grad = `g-${uid}`;

  const petalFill = `url(#${grad})`;

  const renderRoundOrStar = (petalPath?: string) => {
    const outer = ringPetals(m.arch === "star" ? 6 : 8, 15, 19, 26);
    const inner = ringPetals(m.arch === "star" ? 5 : 7, 11, 14, 33, 25);
    return (
      <>
        {/* soft watercolor bleed behind */}
        <circle cx="50" cy="50" r="34" fill={m.petal} opacity="0.55" filter={`url(#${blur})`} />
        {outer.map((p, i) =>
          petalPath ? (
            <path key={`o${i}`} d={petalPath} transform={`rotate(${p.a} 50 50)`} fill={petalFill} stroke={INK} strokeWidth="1.1" strokeOpacity="0.55" />
          ) : (
            <ellipse key={`o${i}`} cx="50" cy={p.cy} rx={p.rx} ry={p.ry} transform={`rotate(${p.a} 50 50)`} fill={petalFill} stroke={INK} strokeWidth="1.1" strokeOpacity="0.5" />
          ),
        )}
        {inner.map((p, i) => (
          <ellipse key={`i${i}`} cx="50" cy={p.cy} rx={p.rx} ry={p.ry} transform={`rotate(${p.a} 50 50)`} fill={m.petalDeep} opacity="0.9" stroke={INK} strokeWidth="0.9" strokeOpacity="0.4" />
        ))}
        <circle cx="50" cy="50" r={m.arch === "star" ? 6 : 8} fill={m.center} stroke={INK} strokeWidth="0.9" strokeOpacity="0.5" />
      </>
    );
  };

  const renderDaisy = () => {
    const petals = ringPetals(m.label === "Sunflower" ? 18 : 14, 5.5, 23, 27);
    return (
      <>
        <circle cx="50" cy="50" r="30" fill={m.petal} opacity="0.4" filter={`url(#${blur})`} />
        {petals.map((p, i) => (
          <ellipse key={i} cx="50" cy={p.cy} rx={p.rx} ry={p.ry} transform={`rotate(${p.a} 50 50)`} fill={petalFill} stroke={INK} strokeWidth="1" strokeOpacity="0.5" />
        ))}
        <circle cx="50" cy="50" r="13" fill={m.center} stroke={INK} strokeWidth="1" strokeOpacity="0.6" />
        {/* seed stipple */}
        {ringPetals(8, 0, 0, 0).map((p, i) => (
          <circle key={`s${i}`} cx={50 + Math.cos((p.a * Math.PI) / 180) * 6} cy={50 + Math.sin((p.a * Math.PI) / 180) * 6} r="1.3" fill={INK} opacity="0.35" />
        ))}
      </>
    );
  };

  const renderDense = () => {
    const rings = [
      ringPetals(12, 6, 12, 26, 0),
      ringPetals(11, 6, 11, 31, 16),
      ringPetals(9, 5, 9, 36, 30),
    ];
    return (
      <>
        <circle cx="50" cy="50" r="32" fill={m.petal} opacity="0.5" filter={`url(#${blur})`} />
        {rings.flatMap((ring, r) =>
          ring.map((p, i) => (
            <ellipse key={`${r}-${i}`} cx="50" cy={p.cy} rx={p.rx} ry={p.ry} transform={`rotate(${p.a} 50 50)`} fill={r === 0 ? petalFill : m.petalDeep} opacity={r === 0 ? 1 : 0.92} stroke={INK} strokeWidth="0.8" strokeOpacity="0.4" />
          )),
        )}
        <circle cx="50" cy="50" r="7" fill={m.center} stroke={INK} strokeWidth="0.8" strokeOpacity="0.5" />
      </>
    );
  };

  const renderCluster = () => {
    const florets = ringPetals(6, 0, 0, 0, 0).map((p) => ({
      cx: 50 + Math.cos((p.a * Math.PI) / 180) * 18,
      cy: 50 + Math.sin((p.a * Math.PI) / 180) * 18,
    }));
    florets.push({ cx: 50, cy: 50 });
    return (
      <>
        <circle cx="50" cy="50" r="33" fill={m.petal} opacity="0.45" filter={`url(#${blur})`} />
        {florets.map((f, i) => (
          <g key={i}>
            {[0, 90, 180, 270].map((a) => (
              <ellipse key={a} cx={f.cx} cy={f.cy - 6} rx="5" ry="7" transform={`rotate(${a} ${f.cx} ${f.cy})`} fill={petalFill} stroke={INK} strokeWidth="0.7" strokeOpacity="0.45" />
            ))}
            <circle cx={f.cx} cy={f.cy} r="2.4" fill={m.center} />
          </g>
        ))}
      </>
    );
  };

  const renderSpike = () => (
    <>
      <ellipse cx="50" cy="46" rx="16" ry="40" fill={m.petal} opacity="0.4" filter={`url(#${blur})`} />
      {Array.from({ length: 7 }).map((_, row) =>
        [-1, 1].map((side) => {
          const y = 14 + row * 11;
          const x = 50 + side * (7 - row * 0.4);
          return (
            <ellipse key={`${row}-${side}`} cx={x} cy={y} rx="6.5" ry="8" fill={row % 2 ? m.petalDeep : petalFill} stroke={INK} strokeWidth="0.7" strokeOpacity="0.45" />
          );
        }),
      )}
      <ellipse cx="50" cy="10" rx="5" ry="7" fill={petalFill} stroke={INK} strokeWidth="0.7" strokeOpacity="0.45" />
    </>
  );

  const starPetal = "M50 50 C 40 32, 42 14, 50 6 C 58 14, 60 32, 50 50 Z";

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ overflow: "visible" }} aria-hidden>
      <defs>
        <filter id={blur} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4.5" />
        </filter>
        <radialGradient id={grad} cx="45%" cy="38%" r="70%">
          <stop offset="0%" stopColor={m.petal} />
          <stop offset="70%" stopColor={m.petal} />
          <stop offset="100%" stopColor={m.petalDeep} />
        </radialGradient>
      </defs>
      {m.arch === "round" && renderRoundOrStar()}
      {m.arch === "star" && renderRoundOrStar(starPetal)}
      {m.arch === "daisy" && renderDaisy()}
      {m.arch === "dense" && renderDense()}
      {m.arch === "cluster" && renderCluster()}
      {m.arch === "spike" && renderSpike()}
    </svg>
  );
}

/* ─────────── greenery + filler (thin, pushed to the back/edges) ─────────── */

// Slim eucalyptus sprig — small paired leaves, low opacity, sits behind blooms.
function EucalyptusSprig({ flip, rotate }: { flip?: boolean; rotate: number }) {
  const leaves = Array.from({ length: 6 });
  return (
    <g transform={`translate(50 50) rotate(${rotate}) ${flip ? "scale(-1,1)" : ""}`} opacity="0.7">
      <path d="M0 0 C 4 -30, 3 -72, -1 -108" fill="none" stroke="#6f7d5a" strokeWidth="1.2" opacity="0.7" />
      {leaves.map((_, i) => {
        const y = -30 - i * 14;
        return (
          <g key={i}>
            <ellipse cx={-4} cy={y} rx="3.6" ry="2.2" transform={`rotate(-32 -4 ${y})`} fill="#9aa982" stroke="#6c7a54" strokeWidth="0.4" strokeOpacity="0.4" />
            <ellipse cx={4} cy={y - 6} rx="3.6" ry="2.2" transform={`rotate(32 4 ${y - 6})`} fill="#8a9a72" stroke="#6c7a54" strokeWidth="0.4" strokeOpacity="0.4" />
          </g>
        );
      })}
    </g>
  );
}

// Baby's-breath style filler — airy tiny dots.
function FillerSprig({ rotate }: { rotate: number }) {
  return (
    <g transform={`translate(50 50) rotate(${rotate})`} opacity="0.75">
      <path d="M0 0 C 2 -30, 0 -62, -1 -94" fill="none" stroke="#b7c19f" strokeWidth="0.9" opacity="0.6" />
      {Array.from({ length: 10 }).map((_, i) => {
        const y = -24 - i * 8;
        const x = i % 2 ? 5 : -5;
        return <circle key={i} cx={x} cy={y} r="1.8" fill="#f3efe2" stroke="#cdc7b2" strokeWidth="0.4" />;
      })}
    </g>
  );
}

/* ─────────── kraft-paper cone wrap ─────────── */

function KraftCone({ wrap, width, uid }: { wrap: WrapId; width: number; uid: string }) {
  const w = WRAP_META[wrap];
  return (
    <svg viewBox="0 0 120 160" width={width} height={width * (160 / 120)} aria-hidden style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={`kc-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={w.fill} />
          <stop offset="55%" stopColor={w.fill} />
          <stop offset="100%" stopColor={w.fillDeep} />
        </linearGradient>
      </defs>
      {/* the paper cone */}
      <path d="M14 52 L106 52 L61 157 Q60 159 59 157 Z" fill={`url(#kc-${uid})`} stroke={w.ink} strokeWidth="1.6" strokeOpacity="0.55" />
      {/* crinkle fold lines converging to the point */}
      {[34, 50, 70, 86].map((x, i) => (
        <path key={i} d={`M${x} 52 L${60 + (i - 1.5) * 0.8} 150`} fill="none" stroke={w.ink} strokeWidth="0.8" strokeOpacity="0.22" />
      ))}
      {/* top rim highlight */}
      <path d="M14 52 L106 52" fill="none" stroke="#ffffff" strokeWidth="1.4" strokeOpacity="0.18" />
      {/* ribbon band around the neck */}
      <path d="M30 88 L90 88 L86 100 L34 100 Z" fill={w.fillDeep} stroke={w.ink} strokeWidth="1" strokeOpacity="0.5" />
      <path d="M30 88 L90 88" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.2" />
      {/* bow knot + loops */}
      <circle cx="60" cy="94" r="4.5" fill={w.ink} opacity="0.85" />
      <path d="M60 94 C 44 82, 40 104, 56 98 M60 94 C 76 82, 80 104, 64 98" fill={w.fill} stroke={w.ink} strokeWidth="1" strokeOpacity="0.6" />
      {/* trailing ribbon tails */}
      <path d="M58 97 C 52 116, 50 132, 46 146 M62 97 C 68 116, 70 132, 74 146" fill="none" stroke={w.ink} strokeWidth="1.4" strokeOpacity="0.55" />
    </svg>
  );
}

/** Compact cone for the picker thumbnails. */
export function WrapShape({ wrap, width = 120 }: { wrap: WrapId; width?: number }) {
  const uid = useId().replace(/:/g, "");
  return <KraftCone wrap={wrap} width={width} uid={uid} />;
}

/* ─────────── assembled bouquet preview ─────────── */

export function BouquetArrangement({
  flowers,
  wrap,
  size = 340,
  bloom = false,
  showTag = false,
  monogram = "",
}: {
  flowers: FlowerId[];
  wrap: WrapId;
  size?: number;
  bloom?: boolean;     // animate blooms in one at a time
  showTag?: boolean;
  monogram?: string;   // recipient initial for the ribbon tag
}) {
  const w = WRAP_META[wrap];
  const uid = useId().replace(/:/g, "");
  const chosen = flowers.length ? flowers : (["rose", "peony", "daisy"] as FlowerId[]);
  // Fill every arrangement slot by cycling through the chosen flower types so
  // the bouquet always looks full and every selected type appears together.
  const list = Array.from({ length: 8 }, (_, i) => chosen[i % chosen.length]);
  const initial = monogram.trim().charAt(0).toUpperCase();

  // Natural, slightly asymmetric placement (not a grid).
  const spots = [
    { x: 0.5, y: 0.16, s: 1.05, z: 6 },
    { x: 0.3, y: 0.26, s: 0.92, z: 4 },
    { x: 0.7, y: 0.26, s: 0.95, z: 4 },
    { x: 0.18, y: 0.42, s: 0.82, z: 3 },
    { x: 0.5, y: 0.4, s: 1.0, z: 5 },
    { x: 0.82, y: 0.42, s: 0.85, z: 3 },
    { x: 0.36, y: 0.55, s: 0.8, z: 2 },
    { x: 0.64, y: 0.55, s: 0.82, z: 2 },
  ];

  const bloomSize = size * 0.34;

  return (
    <div style={{ position: "relative", width: size, height: size * 1.25 }}>
      {/* soft ground shadow */}
      <div style={{ position: "absolute", left: "50%", bottom: size * 0.06, width: size * 0.5, height: size * 0.06, transform: "translateX(-50%)", background: "radial-gradient(ellipse, rgba(60,45,35,0.28), transparent 70%)", filter: "blur(4px)" }} />

      {/* greenery + filler pushed to the back and edges (behind blooms) */}
      <svg viewBox="0 0 100 100" width={size} height={size} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", zIndex: 1 }} aria-hidden>
        <EucalyptusSprig rotate={-40} />
        <EucalyptusSprig rotate={40} flip />
        <FillerSprig rotate={-22} />
        <FillerSprig rotate={20} />
        <FillerSprig rotate={-2} />
      </svg>

      {/* kraft cone wrap behind the blooms */}
      <div style={{ position: "absolute", left: "50%", bottom: 0, transform: "translateX(-50%)", width: size * 0.7, zIndex: 2 }}>
        <KraftCone wrap={wrap} width={size * 0.7} uid={uid} />
      </div>

      {/* blooms */}
      {list.map((f, i) => {
        const p = spots[i] ?? spots[i % spots.length];
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${p.x * 100}%`,
              top: `${p.y * 100}%`,
              width: bloomSize * p.s,
              height: bloomSize * p.s,
              transform: "translate(-50%,-50%)",
              zIndex: 4 + p.z,
              filter: "drop-shadow(0 3px 4px rgba(50,35,25,0.18))",
              animation: bloom ? `bloom-in 0.7s cubic-bezier(0.34,1.4,0.6,1) both` : undefined,
              animationDelay: bloom ? `${0.25 + i * 0.35}s` : undefined,
            }}
          >
            <FlowerBloom flower={f} size={bloomSize * p.s} />
          </div>
        );
      })}

      {/* monogram ribbon tag — hangs from the bow */}
      {initial && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: size * 0.34,
            transform: "translateX(-140%)",
            zIndex: 30,
            animation: bloom ? "bloom-in 0.6s ease-out both" : undefined,
            animationDelay: bloom ? "3s" : undefined,
          }}
        >
          <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 1.5, height: 18, background: w.ink, opacity: 0.6 }} />
            <div style={{ width: 40, height: 48, background: "#f3ecdc", border: `1px solid ${w.ink}`, borderRadius: "4px 4px 6px 6px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 8px rgba(0,0,0,0.22)", transform: "rotate(-5deg)", position: "relative" }}>
              <span style={{ position: "absolute", top: 4, width: 5, height: 5, borderRadius: "50%", border: `1px solid ${w.ink}` }} />
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 24, color: "#4a3b33", marginTop: 6 }}>{initial}</span>
            </div>
          </div>
        </div>
      )}

      {/* gift tag */}
      {showTag && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: size * 0.14,
            transform: "translateX(6%)",
            zIndex: 20,
            animation: bloom ? "bloom-in 0.6s ease-out both" : undefined,
            animationDelay: bloom ? "3.2s" : undefined,
          }}
        >
          <div style={{ position: "relative" }}>
            <div style={{ width: 1, height: 26, background: w.ink, opacity: 0.6, position: "absolute", left: 8, top: -22 }} />
            <div style={{ background: "#f3ecdc", border: `1px solid ${w.ink}`, borderRadius: 4, padding: "8px 12px", boxShadow: "0 4px 10px rgba(0,0,0,0.2)", transform: "rotate(-4deg)" }}>
              <span style={{ position: "absolute", left: 6, top: 4, width: 5, height: 5, borderRadius: "50%", border: `1px solid ${w.ink}` }} />
              <p style={{ margin: 0, fontFamily: "'Caveat', cursive", fontSize: 17, color: "#4a3b33", whiteSpace: "nowrap" }}>
                These made me think of you.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export { FLOWERS, WRAPS };
