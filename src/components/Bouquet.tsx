import { useId, useMemo } from "react";
import {
  flowerColor,
  WRAP_MAP,
  type BouquetSpec,
  type BouquetStem,
  type FlowerColor,
} from "@/lib/bouquet";

interface Props {
  spec: BouquetSpec;
  width?: number;
  className?: string;
  /** 0 → 1: drives the bloom-in reveal. 1 = fully open. */
  bloom?: number;
}

// Deterministic pseudo-random in [-1, 1] from an index + salt — keeps a given
// bouquet's natural-looking jitter stable between renders.
function jit(i: number, salt: number): number {
  const v = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return (v - Math.floor(v)) * 2 - 1;
}

const STROKE = "rgba(60,42,20,0.34)";

/** A single botanical flower head, drawn centred on (0,0), ~radius 26. */
function FlowerHead({ type, c }: { type: string; c: FlowerColor }) {
  const petals = (
    count: number, len: number, wid: number, dist: number, fill: string, opacity = 1, startRot = 0,
  ) =>
    Array.from({ length: count }, (_, i) => {
      const a = startRot + (i * 360) / count;
      return (
        <ellipse
          key={`${a}-${dist}-${i}`}
          cx={0} cy={-dist} rx={wid} ry={len}
          fill={fill} opacity={opacity}
          stroke={STROKE} strokeWidth={0.6}
          transform={`rotate(${a})`}
        />
      );
    });

  switch (type) {
    case "daisy":
      return (
        <g>
          {petals(13, 20, 4, 15, c.petal)}
          {petals(13, 18, 3, 14, c.shade, 0.35, 14)}
          <circle r={8} fill={c.center} stroke={STROKE} strokeWidth={0.6} />
          <circle r={5} fill={c.center} opacity={0.6} />
        </g>
      );
    case "sunflower":
      return (
        <g>
          {petals(20, 19, 4.5, 15, c.shade, 1, 9)}
          {petals(20, 20, 5, 15, c.petal)}
          <circle r={13} fill={c.center} stroke={STROKE} strokeWidth={0.7} />
          {Array.from({ length: 26 }, (_, i) => {
            const ang = i * 137.5 * (Math.PI / 180);
            const rr = 2 + Math.sqrt(i) * 2.1;
            return <circle key={i} cx={Math.cos(ang) * rr} cy={Math.sin(ang) * rr} r={0.9} fill="#2c1c0c" opacity={0.55} />;
          })}
        </g>
      );
    case "rose":
      return (
        <g>
          {petals(7, 14, 11, 8, c.shade, 1, 0)}
          {petals(6, 11, 9, 6, c.petal, 1, 26)}
          {petals(5, 8, 7, 4, c.petal, 1, 12)}
          <circle r={4.5} fill={c.shade} stroke={STROKE} strokeWidth={0.5} />
          <path d="M -3 -1 A 4 4 0 1 1 3 1" fill="none" stroke={c.center} strokeWidth={1.1} opacity={0.7} />
        </g>
      );
    case "tulip":
      return (
        <g transform="translate(0,2)">
          <path d="M 0 8 C -12 6 -13 -14 -7 -22 C -5 -16 -2 -16 0 -22 C 2 -16 5 -16 7 -22 C 13 -14 12 6 0 8 Z" fill={c.petal} stroke={STROKE} strokeWidth={0.7} />
          <path d="M 0 8 C -7 6 -7 -12 -4 -20 C -2 -14 -1 -14 0 -20 Z" fill={c.shade} opacity={0.5} />
          <path d="M 0 8 C 7 6 7 -12 4 -20 C 2 -14 1 -14 0 -20 Z" fill={c.shade} opacity={0.3} />
        </g>
      );
    case "lily":
      return (
        <g>
          {Array.from({ length: 6 }, (_, i) => (
            <path
              key={i}
              d="M 0 -4 C -6 -10 -5 -22 0 -26 C 5 -22 6 -10 0 -4 Z"
              fill={i % 2 ? c.shade : c.petal} stroke={STROKE} strokeWidth={0.6}
              transform={`rotate(${i * 60})`}
            />
          ))}
          {Array.from({ length: 5 }, (_, i) => (
            <line key={i} x1={0} y1={0} x2={Math.cos((i * 72 - 90) * Math.PI / 180) * 9} y2={Math.sin((i * 72 - 90) * Math.PI / 180) * 9} stroke={c.center} strokeWidth={1} />
          ))}
          <circle r={3} fill={c.center} />
        </g>
      );
    case "peony":
      return (
        <g>
          {petals(9, 15, 11, 8, c.shade, 1, 0)}
          {petals(9, 12, 9, 6, c.petal, 1, 20)}
          {petals(7, 9, 7, 4, c.petal, 1, 8)}
          {petals(6, 6, 5, 2, c.shade, 0.8, 30)}
          <circle r={3} fill={c.center} opacity={0.7} />
        </g>
      );
    case "orchid":
      return (
        <g>
          {petals(5, 16, 9, 6, c.petal, 1, 0)}
          {petals(3, 11, 7, 4, c.shade, 0.7, 60)}
          <ellipse cx={0} cy={6} rx={6} ry={8} fill={c.shade} stroke={STROKE} strokeWidth={0.6} />
          <circle r={3.5} fill={c.center} />
        </g>
      );
    case "lavender":
      return (
        <g transform="translate(0,4)">
          <line x1={0} y1={8} x2={0} y2={-30} stroke="#6f7a4a" strokeWidth={1.4} />
          {Array.from({ length: 9 }, (_, i) => {
            const yy = 6 - i * 4;
            const off = (i % 2 ? 1 : -1) * (3 + (i % 3));
            return <ellipse key={i} cx={off} cy={yy} rx={3.4} ry={4.4} fill={i % 2 ? c.shade : c.petal} stroke={STROKE} strokeWidth={0.4} />;
          })}
        </g>
      );
    case "carnation":
      return (
        <g>
          {petals(16, 14, 3.4, 9, c.shade, 1, 0)}
          {petals(16, 12, 3, 8, c.petal, 1, 11)}
          {petals(12, 9, 2.6, 5, c.petal, 1, 5)}
          {Array.from({ length: 18 }, (_, i) => (
            <line key={i} x1={0} y1={0} x2={Math.cos(i * 20 * Math.PI / 180) * 13} y2={Math.sin(i * 20 * Math.PI / 180) * 13} stroke={c.shade} strokeWidth={0.5} opacity={0.4} />
          ))}
          <circle r={3} fill={c.center} opacity={0.6} />
        </g>
      );
    case "hydrangea":
      return (
        <g>
          {Array.from({ length: 7 }, (_, i) => {
            const ang = i === 6 ? 0 : (i * 60) * Math.PI / 180;
            const d = i === 6 ? 0 : 12;
            const fx = Math.cos(ang) * d;
            const fy = Math.sin(ang) * d;
            return (
              <g key={i} transform={`translate(${fx} ${fy})`}>
                {Array.from({ length: 4 }, (_, j) => (
                  <ellipse key={j} cx={0} cy={-4.5} rx={3.2} ry={4.5} fill={j % 2 ? c.shade : c.petal} stroke={STROKE} strokeWidth={0.4} transform={`rotate(${j * 90})`} />
                ))}
                <circle r={1.4} fill={c.center} />
              </g>
            );
          })}
        </g>
      );
    case "jasmine":
      return (
        <g>
          {Array.from({ length: 4 }, (_, i) => {
            const ang = i === 3 ? 0 : (i * 120) * Math.PI / 180;
            const d = i === 3 ? 0 : 11;
            return (
              <g key={i} transform={`translate(${Math.cos(ang) * d} ${Math.sin(ang) * d})`}>
                {Array.from({ length: 5 }, (_, j) => (
                  <ellipse key={j} cx={0} cy={-5} rx={2.8} ry={5} fill={c.petal} stroke={STROKE} strokeWidth={0.4} transform={`rotate(${j * 72})`} />
                ))}
                <circle r={1.6} fill={c.center} />
              </g>
            );
          })}
        </g>
      );
    case "marigold":
    default:
      return (
        <g>
          {petals(18, 12, 4, 10, c.shade, 1, 0)}
          {petals(18, 10, 3.6, 8, c.petal, 1, 10)}
          {petals(14, 7, 3, 5, c.shade, 0.9, 6)}
          {petals(12, 5, 2.6, 3, c.petal, 1, 14)}
          <circle r={2.5} fill={c.center} opacity={0.7} />
        </g>
      );
  }
}

export function Bouquet({ spec, width = 360, className, bloom = 1 }: Props) {
  const uid = useId().replace(/:/g, "");
  const wrap = WRAP_MAP[spec.wrap] ?? WRAP_MAP.kraft;
  const VB_W = 400;
  const VB_H = 470;
  const focalX = VB_W / 2;
  const focalY = 332;

  // Lay out flower heads in a natural fan: varying heights, slight overlap.
  const layout = useMemo(() => {
    const n = spec.stems.length;
    return spec.stems.map((stem, i) => {
      const t = n > 1 ? i / (n - 1) : 0.5;
      const angle = (t - 0.5) * 78;                       // -39°..39°
      const rad = (angle * Math.PI) / 180;
      const reach = 138 + jit(i, 3.1) * 14;               // how far up the stem rises
      const x = focalX + Math.sin(rad) * (118 + jit(i, 1.7) * 10);
      const y = focalY - Math.cos(rad) * reach + jit(i, 5.3) * 10;
      const scale = 0.82 + Math.abs(0.5 - t) * 0.22 + jit(i, 8.8) * 0.06;
      return { stem, x, y, scale, angle, i };
    });
  }, [spec.stems]);

  // Draw back-to-front so centre blooms overlap outer ones naturally.
  const ordered = useMemo(
    () => [...layout].sort((a, b) => a.y - b.y),
    [layout],
  );

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width={width} className={className} role="img" aria-label="A bouquet of flowers">
      <defs>
        <linearGradient id={`wrap-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={wrap.light} />
          <stop offset="55%" stopColor={wrap.mid} />
          <stop offset="100%" stopColor={wrap.dark} />
        </linearGradient>
        <radialGradient id={`shadow-${uid}`} cx="50%" cy="50%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.4)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        <filter id={`paper-${uid}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>

      {/* Soft ground shadow beneath the bouquet */}
      <ellipse cx={focalX} cy={452} rx={120} ry={16} fill={`url(#shadow-${uid})`} />

      {/* Stems rising from the wrap into each bloom */}
      <g stroke="#5f7042" strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.85}>
        {layout.map(({ x, y, i }) => {
          const cx = focalX + (x - focalX) * 0.4;
          const cy = (focalY + y) / 2 + jit(i, 2.2) * 8;
          return <path key={i} d={`M ${focalX} ${focalY} Q ${cx} ${cy} ${x} ${y}`} />;
        })}
      </g>

      {/* A few leaves around the gather point */}
      <g>
        {[-34, -16, 16, 34].map((a, i) => (
          <ellipse
            key={i}
            cx={focalX} cy={focalY - 26} rx={7} ry={20}
            fill="#6f8049" stroke={STROKE} strokeWidth={0.6} opacity={0.9}
            transform={`rotate(${a} ${focalX} ${focalY - 26})`}
          />
        ))}
      </g>

      {/* Flower heads */}
      {ordered.map(({ stem, x, y, scale, i }: { stem: BouquetStem; x: number; y: number; scale: number; angle: number; i: number }) => {
        const c = flowerColor(stem);
        const s = scale * bloom;
        return (
          <g key={i} transform={`translate(${x} ${y}) scale(${s}) rotate(${jit(i, 9.4) * 8})`} opacity={bloom}>
            <FlowerHead type={stem.flower} c={c} />
          </g>
        );
      })}

      {/* Wrapping cone — drawn over the stems */}
      <g>
        <path
          d={`M ${focalX - 16} ${focalY - 4} L ${focalX + 16} ${focalY - 4} L ${focalX + 84} 448 L ${focalX - 84} 448 Z`}
          fill={`url(#wrap-${uid})`} stroke="rgba(40,28,12,0.35)" strokeWidth={1}
        />
        {/* paper texture + folds */}
        <path
          d={`M ${focalX - 16} ${focalY - 4} L ${focalX + 16} ${focalY - 4} L ${focalX + 84} 448 L ${focalX - 84} 448 Z`}
          fill={`url(#paper-${uid})`} opacity={0.12} style={{ mixBlendMode: "multiply" }}
        />
        <path d={`M ${focalX} ${focalY - 2} L ${focalX - 30} 448`} stroke="rgba(0,0,0,0.16)" strokeWidth={1} fill="none" />
        <path d={`M ${focalX} ${focalY - 2} L ${focalX + 36} 448`} stroke="rgba(0,0,0,0.14)" strokeWidth={1} fill="none" />
        <path d={`M ${focalX - 40} 448 L ${focalX - 8} ${focalY + 40}`} stroke="rgba(255,255,255,0.18)" strokeWidth={1} fill="none" />

        {/* Ribbon / twine at the throat */}
        {wrap.ribbon ? (
          <g transform={`translate(${focalX} ${focalY + 54})`}>
            <rect x={-66} y={-6} width={132} height={13} rx={3} fill={spec.ribbon} opacity={0.95} />
            <path d="M 0 0 C -22 -16 -40 -14 -34 2 C -40 18 -20 18 0 4 Z" fill={spec.ribbon} stroke="rgba(0,0,0,0.18)" strokeWidth={0.6} />
            <path d="M 0 0 C 22 -16 40 -14 34 2 C 40 18 20 18 0 4 Z" fill={spec.ribbon} stroke="rgba(0,0,0,0.18)" strokeWidth={0.6} />
            <circle r={5} fill={spec.ribbon} stroke="rgba(0,0,0,0.2)" strokeWidth={0.6} />
            <path d="M -4 4 L -16 34" stroke={spec.ribbon} strokeWidth={5} strokeLinecap="round" />
            <path d="M 4 4 L 18 34" stroke={spec.ribbon} strokeWidth={5} strokeLinecap="round" />
          </g>
        ) : (
          <g transform={`translate(${focalX} ${focalY + 54})`} stroke={spec.ribbon} fill="none">
            {[-4, 0, 4].map((o) => (
              <path key={o} d={`M -64 ${o} Q 0 ${o + 8} 64 ${o}`} strokeWidth={2} opacity={0.9} />
            ))}
          </g>
        )}
      </g>
    </svg>
  );
}
