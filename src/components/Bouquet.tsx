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

/* ─────────── greenery + filler ─────────── */

function EucalyptusSprig({ flip, rotate }: { flip?: boolean; rotate: number }) {
  const leaves = Array.from({ length: 7 });
  return (
    <g transform={`translate(50 50) rotate(${rotate}) ${flip ? "scale(-1,1)" : ""}`}>
      <path d="M0 0 C 6 -30, 4 -70, -2 -104" fill="none" stroke="#6f7d5a" strokeWidth="2" opacity="0.8" />
      {leaves.map((_, i) => {
        const y = -18 - i * 12;
        return (
          <g key={i}>
            <ellipse cx={-8} cy={y} rx="7" ry="4.5" transform={`rotate(-30 -8 ${y})`} fill="#8a9a72" stroke="#5c6a48" strokeWidth="0.6" strokeOpacity="0.5" />
            <ellipse cx={8} cy={y - 5} rx="7" ry="4.5" transform={`rotate(30 8 ${y - 5})`} fill="#9aa982" stroke="#5c6a48" strokeWidth="0.6" strokeOpacity="0.5" />
          </g>
        );
      })}
    </g>
  );
}

function FillerSprig({ rotate }: { rotate: number }) {
  return (
    <g transform={`translate(50 50) rotate(${rotate})`}>
      <path d="M0 0 C 2 -28, 0 -56, -1 -86" fill="none" stroke="#b7c19f" strokeWidth="1.2" opacity="0.7" />
      {Array.from({ length: 9 }).map((_, i) => {
        const y = -22 - i * 8;
        const x = i % 2 ? 6 : -6;
        return <circle key={i} cx={x} cy={y} r="2.2" fill="#f3efe2" stroke="#cdc7b2" strokeWidth="0.5" />;
      })}
    </g>
  );
}

/* ─────────── wrap silhouette (rounded kite tied with bow) ─────────── */

export function WrapShape({ wrap, width = 120 }: { wrap: WrapId; width?: number }) {
  const w = WRAP_META[wrap];
  const uid = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 120 150" width={width} height={width * 1.25} aria-hidden>
      <defs>
        <radialGradient id={`wr-${uid}`} cx="50%" cy="35%" r="75%">
          <stop offset="0%" stopColor={w.fill} />
          <stop offset="100%" stopColor={w.fillDeep} />
        </radialGradient>
      </defs>
      <path d="M60 8 C 104 44, 100 96, 60 142 C 20 96, 16 44, 60 8 Z" fill={`url(#wr-${uid})`} stroke={w.ink} strokeWidth="2" strokeOpacity="0.6" />
      <path d="M60 8 C 78 50, 78 96, 60 142" fill="none" stroke={w.ink} strokeWidth="1" strokeOpacity="0.3" />
      <path d="M60 8 C 42 50, 42 96, 60 142" fill="none" stroke={w.ink} strokeWidth="1" strokeOpacity="0.3" />
      {/* string bow at base */}
      <path d="M60 118 C 48 110, 44 126, 56 122 M60 118 C 72 110, 76 126, 64 122" fill="none" stroke={w.ink} strokeWidth="2" strokeOpacity="0.7" />
      <circle cx="60" cy="119" r="2.5" fill={w.ink} opacity="0.7" />
    </svg>
  );
}

/* ─────────── assembled bouquet preview ─────────── */

export function BouquetArrangement({
  flowers,
  wrap,
  size = 340,
  bloom = false,
  showTag = false,
}: {
  flowers: FlowerId[];
  wrap: WrapId;
  size?: number;
  bloom?: boolean;     // animate blooms in one at a time
  showTag?: boolean;
}) {
  const w = WRAP_META[wrap];
  const uid = useId().replace(/:/g, "");
  const list = flowers.length ? flowers : (["rose", "peony", "daisy"] as FlowerId[]);

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

      {/* wrap behind the blooms */}
      <div style={{ position: "absolute", left: "50%", bottom: 0, transform: "translateX(-50%)", width: size * 0.86 }}>
        <WrapShapeFilled wrap={wrap} width={size * 0.86} uid={uid} />
      </div>

      {/* greenery + filler threading through */}
      <svg viewBox="0 0 100 100" width={size} height={size} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} aria-hidden>
        <EucalyptusSprig rotate={-26} />
        <EucalyptusSprig rotate={22} flip />
        <EucalyptusSprig rotate={-4} />
        <FillerSprig rotate={-14} />
        <FillerSprig rotate={12} />
      </svg>

      {/* blooms */}
      {list.slice(0, 8).map((f, i) => {
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
              zIndex: p.z,
              filter: "drop-shadow(0 3px 4px rgba(50,35,25,0.18))",
              animation: bloom ? `bloom-in 0.7s cubic-bezier(0.34,1.4,0.6,1) both` : undefined,
              animationDelay: bloom ? `${0.25 + i * 0.35}s` : undefined,
            }}
          >
            <FlowerBloom flower={f} size={bloomSize * p.s} />
          </div>
        );
      })}

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

function WrapShapeFilled({ wrap, width, uid }: { wrap: WrapId; width: number; uid: string }) {
  const w = WRAP_META[wrap];
  return (
    <svg viewBox="0 0 120 150" width={width} height={width * 1.25} aria-hidden style={{ display: "block" }}>
      <defs>
        <radialGradient id={`wf-${uid}`} cx="50%" cy="30%" r="80%">
          <stop offset="0%" stopColor={w.fill} />
          <stop offset="100%" stopColor={w.fillDeep} />
        </radialGradient>
      </defs>
      {/* cone/kite wrap holding the blooms */}
      <path d="M60 30 C 100 70, 96 120, 60 148 C 24 120, 20 70, 60 30 Z" fill={`url(#wf-${uid})`} stroke={w.ink} strokeWidth="2" strokeOpacity="0.55" />
      <path d="M60 30 C 76 74, 76 118, 60 148" fill="none" stroke={w.ink} strokeWidth="1" strokeOpacity="0.28" />
      <path d="M60 30 C 44 74, 44 118, 60 148" fill="none" stroke={w.ink} strokeWidth="1" strokeOpacity="0.28" />
      <path d="M60 122 C 46 112, 42 132, 56 127 M60 122 C 74 112, 78 132, 64 127" fill="none" stroke={w.ink} strokeWidth="2.2" strokeOpacity="0.7" />
      <circle cx="60" cy="123" r="3" fill={w.ink} opacity="0.7" />
    </svg>
  );
}

export { FLOWERS, WRAPS };
