import { useId } from "react";
import { FLOWERS, WRAPS, OCCASION_CLOSINGS, type FlowerId, type WrapId, type LetterOccasion } from "@/lib/letter";

/**
 * Hand-illustrated, watercolor-style bouquet.
 * Only flower heads (no leaves, greenery or stems) gathered tightly into a
 * folded kraft-paper cone tied with a ribbon bow. The builder and the
 * recipient's bouquet render identically.
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

/* ─────────── solid, folded kraft-paper cone tied with brown twine ─────────── */

// Warm brown twine/rope — always the same regardless of wrap tint.
const TWINE = "#8a6a3f";
const TWINE_DK = "#5f4526";

function KraftCone({ wrap, width, uid }: { wrap: WrapId; width: number; uid: string }) {
  const w = WRAP_META[wrap];
  return (
    <svg viewBox="0 0 120 170" width={width} height={width * (170 / 120)} aria-hidden style={{ display: "block", overflow: "visible" }}>
      <defs>
        {/* solid paper body with a soft cross-fold sheen */}
        <linearGradient id={`kc-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={w.fill} />
          <stop offset="48%" stopColor={w.fill} />
          <stop offset="100%" stopColor={w.fillDeep} />
        </linearGradient>
        <linearGradient id={`kcb-${uid}`} x1="0" y1="0" x2="1" y2="0.3">
          <stop offset="0%" stopColor={w.fillDeep} />
          <stop offset="100%" stopColor={w.fill} />
        </linearGradient>
        {/* twine rope gradient for a round, corded look */}
        <linearGradient id={`tw-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={TWINE} />
          <stop offset="100%" stopColor={TWINE_DK} />
        </linearGradient>
      </defs>

      {/* back paper flare — outer sheet spreading wide at the top, fully solid */}
      <path d="M6 40 Q 60 20 114 40 L74 108 Q60 120 46 108 Z" fill={`url(#kcb-${uid})`} stroke={w.ink} strokeWidth="1.4" strokeOpacity="0.55" />

      {/* front folded cone, gathered to a point, fully solid */}
      <path d="M16 46 Q 60 30 104 46 L64 150 Q60 156 56 150 Z" fill={`url(#kc-${uid})`} stroke={w.ink} strokeWidth="1.6" strokeOpacity="0.6" />

      {/* shaded folds — filled wedges (not wireframe) for real paper depth */}
      <path d="M16 46 Q 38 36 44 44 L58 149 Q57 152 55 150 Z" fill={w.fillDeep} opacity="0.28" />
      <path d="M78 44 Q 92 38 104 46 L64 150 Q63 152 62 150 Z" fill={w.fillDeep} opacity="0.22" />
      <path d="M52 44 Q 60 40 68 44 L61 149 Q60 151 59 149 Z" fill="#ffffff" opacity="0.12" />

      {/* crease lines converging to the gathered point */}
      {[34, 48, 72, 86].map((x, i) => (
        <path key={i} d={`M${x} 45 L${60 + (i - 1.5) * 0.7} 148`} fill="none" stroke={w.ink} strokeWidth="0.7" strokeOpacity="0.22" />
      ))}
      {/* pinched creases near the gather */}
      <path d="M40 96 Q60 104 80 96" fill="none" stroke={w.ink} strokeWidth="1" strokeOpacity="0.3" />
      <path d="M44 118 Q60 126 76 118" fill="none" stroke={w.ink} strokeWidth="1" strokeOpacity="0.26" />

      {/* top rim highlight */}
      <path d="M16 46 Q 60 30 104 46" fill="none" stroke="#ffffff" strokeWidth="1.4" strokeOpacity="0.22" />

      {/* twine wrapped around the gathered neck — a few corded turns */}
      {[92, 98, 104].map((y, i) => (
        <path key={i} d={`M${41 + i} ${y} Q60 ${y + 7} ${79 - i} ${y}`} fill="none" stroke={`url(#tw-${uid})`} strokeWidth="3.4" strokeLinecap="round" />
      ))}
      {/* twine bow — two rope loops + knot + tails */}
      <path d="M60 98 C 38 82, 31 112, 55 103" fill="none" stroke={`url(#tw-${uid})`} strokeWidth="4" strokeLinecap="round" />
      <path d="M60 98 C 82 82, 89 112, 65 103" fill="none" stroke={`url(#tw-${uid})`} strokeWidth="4" strokeLinecap="round" />
      <circle cx="60" cy="99.5" r="4.4" fill={TWINE_DK} stroke={TWINE} strokeWidth="1.2" />
      <path d="M57 103 C 51 122, 49 138, 45 152" fill="none" stroke={`url(#tw-${uid})`} strokeWidth="3.4" strokeLinecap="round" />
      <path d="M63 103 C 69 122, 71 138, 75 152" fill="none" stroke={`url(#tw-${uid})`} strokeWidth="3.4" strokeLinecap="round" />
    </svg>
  );
}

/** Compact cone for the picker thumbnails. */
export function WrapShape({ wrap, width = 120 }: { wrap: WrapId; width?: number }) {
  const uid = useId().replace(/:/g, "");
  return <KraftCone wrap={wrap} width={width} uid={uid} />;
}

/* ─────────── assembled bouquet preview ─────────── */

// Tight, dense phyllotaxis packing so every head sits at a similar height and
// the cluster reads as a hand-tied dome with no gaps or staggered stems.
// Seeded PRNG — same flower selection always renders the same "handmade"
// jitter, but different selections look distinctly different from each other.
function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hashFlowers(list: FlowerId[]) {
  const str = list.join("|");
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h) || 1;
}

// Larger/denser bloom types read as focal flowers and sit in the
// outer-middle ring as accents, instead of buried in the center or on the rim.
const FOCAL_ARCH: Arch[] = ["daisy", "dense"];

function distributeSpecies(list: FlowerId[]) {
  const groups = new Map<FlowerId, FlowerId[]>();
  list.forEach((f) => {
    if (!groups.has(f)) groups.set(f, []);
    groups.get(f)!.push(f);
  });
  // Sort buckets smallest-first so minority flowers (like your pinks) get
  // placed early and often, instead of being left for the end.
  const buckets = Array.from(groups.values()).sort((a, b) => a.length - b.length);
  const out: FlowerId[] = [];
  let remaining = list.length;
  while (remaining > 0) {
    for (const bucket of buckets) {
      if (bucket.length) {
        out.push(bucket.shift()!);
        remaining--;
      }
    }
  }
  return out;
}

function clusterSpots(list: FlowerId[]) {
  const golden = Math.PI * (3 - Math.sqrt(5)); // ~137.5°
  const ordered = list.length > 2 ? distributeSpecies(list) : list;
  const rand = seededRandom(hashFlowers(list));
  const n = ordered.length;

  const raw = ordered.map((f, i) => {
    const t = (i + 0.5) / n;
    let radius = Math.sqrt(t); // 0 (center) → 1 (edge)

    // Gentle outward nudge for focal flowers — not a fixed band, so they
    // don't all stack into one ring and leave the center empty.
    const isFocal = FOCAL_ARCH.includes(FLOWER_META[f].arch);
    if (isFocal) radius = Math.min(1, radius * 1.12 + 0.04);

    const angle = i * golden + (rand() - 0.5) * 0.18; // small angular jitter only
    const jitterR = radius + (rand() - 0.5) * 0.03;     // tight, gathered

    return {
      x: 0.5 + Math.cos(angle) * jitterR * 0.36,
      y: 0.5 + Math.sin(angle) * jitterR * 0.30,
      r: radius,
      rotation: (rand() - 0.5) * 24,
      scale: 0.95 + rand() * 0.1,
      flower: f,
      i,
    };
  });

  return raw.sort((a, b) => b.r - a.r);
}


export function BouquetArrangement({
  flowers,
  wrap,
  size = 340,
  bloom = false,
  occasion,
  sender,
}: {
  flowers: FlowerId[];
  wrap: WrapId;
  size?: number;
  bloom?: boolean;     // animate blooms in one at a time
  occasion?: LetterOccasion;  // sets the closing phrase on the tag
  sender?: string;            // sender name shown under the phrase
  /** @deprecated legacy props */
  showTag?: boolean;
  monogram?: string;
}) {
  const uid = useId().replace(/:/g, "");
  // Use the exact chosen flowers (with duplicates for quantities). Fall back to
  // a small default so the picker preview never looks empty.
  const list = flowers.length ? flowers.slice(0, 15) : (["rose", "peony", "daisy"] as FlowerId[]);
  const spots = clusterSpots(list);

  // Head size shrinks as the bunch grows so heads stay tightly packed, never sparse.
  const headSize = size * (list.length <= 5 ? 0.34 : list.length <= 9 ? 0.28 : 0.23);

  // The flower dome sits over the top of the cone, gathered from one point.
  const clusterBox = size * 0.78;
  const clusterLeft = (size - clusterBox) / 2;
  const clusterTop = size * 0.04;

  const tagPhrase = occasion ? OCCASION_CLOSINGS[occasion] : "";
  const tagName = (sender ?? "").trim();

  return (
    <div style={{ position: "relative", width: size, height: size * 1.32 }}>
      {/* soft ground shadow */}
      <div style={{ position: "absolute", left: "50%", bottom: size * 0.04, width: size * 0.5, height: size * 0.06, transform: "translateX(-50%)", background: "radial-gradient(ellipse, rgba(60,45,35,0.28), transparent 70%)", filter: "blur(4px)" }} />

      {/* kraft cone wrap behind the blooms */}
      <div style={{ position: "absolute", left: "50%", bottom: 0, transform: "translateX(-50%)", width: size * 0.66, zIndex: 2 }}>
        <KraftCone wrap={wrap} width={size * 0.66} uid={uid} />
      </div>

      {/* gift tag hanging from the twine bow */}
      {tagPhrase && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: size * 0.16,
            transform: "translateX(-50%) rotate(-5deg)",
            transformOrigin: "top center",
            zIndex: 20,
          }}
        >
          {/* short twine linking the bow to the tag */}
          <div style={{ position: "absolute", left: "50%", top: -size * 0.05, width: 2, height: size * 0.05, transform: "translateX(-50%)", background: TWINE }} />
          <div
            style={{
              position: "relative",
              minWidth: size * 0.34,
              padding: `${size * 0.028}px ${size * 0.05}px`,
              background: "linear-gradient(160deg, #e7d3a6 0%, #dcc48f 100%)",
              border: "1px solid rgba(110,83,52,0.5)",
              borderRadius: 6,
              boxShadow: "0 4px 10px rgba(50,35,20,0.28), inset 0 0 18px rgba(150,115,55,0.25)",
              textAlign: "center",
              color: "#4a3417",
            }}
          >
            {/* punched hole */}
            <span style={{ position: "absolute", left: "50%", top: 4, width: 6, height: 6, transform: "translateX(-50%)", borderRadius: "50%", background: "#c9b184", boxShadow: "inset 0 0 2px rgba(70,52,23,0.7)" }} />
            <span style={{ display: "block", marginTop: 6, fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: Math.max(12, size * 0.052), lineHeight: 1.1 }}>
              {tagPhrase}
            </span>
            {tagName && (
              <span style={{ display: "block", marginTop: 2, fontFamily: "'Caveat', cursive", fontSize: Math.max(15, size * 0.07), lineHeight: 1.1, color: "#5a3e1c" }}>
                {tagName}
              </span>
            )}
          </div>
        </div>
      )}

    {/* stems — trail down from each flower head into a natural gathered band */}
<svg
  viewBox={`0 0 ${size} ${size * 1.32}`}
  width={size}
  height={size * 1.32}
  style={{ position: "absolute", left: 0, top: 0, zIndex: 5, overflow: "visible" }}
>
  {spots.map((s) => {
    const fx = clusterLeft + s.x * clusterBox;
    const fy = clusterTop + s.y * clusterBox + headSize * 0.32;
    // Spread each stem's endpoint slightly instead of one shared pixel,
    // so they read as a gathered bunch rather than a single clumped knot.
    const neckX = size / 2 + (s.x - 0.5) * size * 0.12;
    const neckY = size * 0.7 + s.i % 3 * size * 0.01;
    return (
      <path
        key={`stem-${s.i}`}
        d={`M${fx} ${fy} Q${(fx + neckX) / 2} ${(fy + neckY) / 2 + 10} ${neckX} ${neckY}`}
        fill="none"
        stroke="#5c7a4f"
        strokeWidth={size * 0.004}
        strokeOpacity="0.55"
        strokeLinecap="round"
      />
    );
  })}
</svg>
      {/* flower heads — tightly clustered dome, all from one point at the top */}
      {spots.map((s) => {
        const depth = s.r; // 0 = front/center, 1 = back/outer
        const layerScale = depth > 0.62 ? 0.92 : depth < 0.32 ? 1.06 : 1;
        const layerOpacity = depth > 0.62 ? 0.94 : 1;
        return (
          <div
            key={s.i}
            style={{
              position: "absolute",
              left: clusterLeft + s.x * clusterBox,
              top: clusterTop + s.y * clusterBox,
              width: headSize,
              height: headSize,
              opacity: layerOpacity,
              transform: `translate(-50%,-50%) rotate(${s.rotation}deg) scale(${s.scale * layerScale})`,
              zIndex: 10 + Math.round((1 - s.r) * 20),
              filter: "drop-shadow(0 2px 4px rgba(50,35,25,0.22))",
              animation: bloom ? `bloom-in 0.6s cubic-bezier(0.34,1.4,0.6,1) both` : undefined,
              animationDelay: bloom ? `${0.15 + s.i * 0.12}s` : undefined,
            }}
          >
            <FlowerBloom flower={s.flower} size={headSize} />
          </div>
        );
})}
        </div>
      );
    }

    export { FLOWERS, WRAPS };
