import { useId } from "react";
import { validateMoonVisualInputs, visualTierForIllumination } from "@/lib/moon-visual";

interface Props {
  phaseAngle: number;
  illumination: number;
  waxing: boolean;
  size?: number;
}

/**
 * Build the lit-region polygon. The terminator is the projected ellipse of the
 * day/night boundary; cos(phaseAngle) gives its signed semi-minor axis. We trace
 * the disc edge on the illuminated side and the terminator curve back.
 */
function illuminatedPath(phaseAngle: number, waxing: boolean, r: number) {
  const angle = (((phaseAngle % 360) + 360) % 360) * Math.PI / 180;
  const terminator = Math.cos(angle);
  const steps = 96;
  const rightEdge: string[] = [];
  const leftEdge: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const y = -r + (2 * r * i) / steps;
    const edge = Math.sqrt(Math.max(0, r * r - y * y));
    const boundary = (waxing ? terminator : -terminator) * edge;
    rightEdge.push(`${edge.toFixed(3)} ${y.toFixed(3)}`);
    leftEdge.push(`${(-edge).toFixed(3)} ${y.toFixed(3)}`);
    if (waxing) leftEdge[i] = `${boundary.toFixed(3)} ${y.toFixed(3)}`;
    else rightEdge[i] = `${boundary.toFixed(3)} ${y.toFixed(3)}`;
  }
  return `M ${rightEdge.join(" L ")} L ${leftEdge.reverse().join(" L ")} Z`;
}

/**
 * Near-side lunar maria — irregular, asymmetric, varied in size and depth, placed
 * to echo the real near-side map (Imbrium, Serenitatis, Tranquillitatis, Crisium,
 * Procellarum, Fecunditatis, Nubium, Frigoris, Nectaris, Vaporum, Cognitum) on a
 * disc of radius 50. `o` = darkness, `d` = soft falloff radius for a non-stamped edge.
 */
const MARIA: Array<{ cx: number; cy: number; rx: number; ry: number; rot: number; o: number }> = [
  { cx: -15, cy: -22, rx: 15, ry: 12, rot: -22, o: 0.5 },   // Mare Imbrium (large, irregular)
  { cx: 7, cy: -17, rx: 9.5, ry: 8.5, rot: 6, o: 0.44 },    // Mare Serenitatis
  { cx: 19, cy: -5, rx: 8.5, ry: 9.5, rot: 14, o: 0.47 },   // Mare Tranquillitatis
  { cx: 33, cy: -10, rx: 5.5, ry: 5, rot: 0, o: 0.52 },     // Mare Crisium (isolated, dark)
  { cx: -29, cy: 2, rx: 11, ry: 20, rot: 6, o: 0.38 },      // Oceanus Procellarum (vast, faint)
  { cx: 25, cy: 13, rx: 7.5, ry: 6.5, rot: -4, o: 0.4 },    // Mare Fecunditatis
  { cx: 28, cy: 24, rx: 4.5, ry: 4, rot: 0, o: 0.46 },      // Mare Nectaris (small, defined)
  { cx: -9, cy: 25, rx: 12, ry: 7, rot: -10, o: 0.36 },     // Mare Nubium / Humorum (broad, faint)
  { cx: 4, cy: 6, rx: 4, ry: 3.5, rot: 0, o: 0.34 },        // Mare Vaporum (subtle)
  { cx: -2, cy: -38, rx: 17, ry: 4, rot: -4, o: 0.28 },     // Mare Frigoris (thin arc, barely visible)
  { cx: -12, cy: 11, rx: 5, ry: 4, rot: 8, o: 0.3 },        // Mare Cognitum (faint)
];

const CRATERS: Array<{ cx: number; cy: number; r: number; o: number }> = [
  { cx: -2, cy: 35, r: 5, o: 0.6 },     // Tycho with bright ejecta
  { cx: 4, cy: 9, r: 2.6, o: 0.5 },
  { cx: -23, cy: -8, r: 2.3, o: 0.45 },
  { cx: 14, cy: 29, r: 2.1, o: 0.5 },
  { cx: 31, cy: 5, r: 1.9, o: 0.42 },
  { cx: -35, cy: 18, r: 1.6, o: 0.4 },
  { cx: 9, cy: -31, r: 1.8, o: 0.46 },
  { cx: -8, cy: -3, r: 1.3, o: 0.36 },  // Copernicus-ish
  { cx: 20, cy: 33, r: 1.4, o: 0.4 },
];

export function MoonSvg({ phaseAngle, illumination, waxing, size = 120 }: Props) {
  const r = 50;
  const uid = useId().replace(/:/g, "");
  const visualValidation = validateMoonVisualInputs({ phaseAngle, illumination, waxing });
  const tier = visualTierForIllumination(illumination);

  // BLOCK RENDER when the visual cannot be reconciled with the astronomy.
  if (!visualValidation.ok) {
    return (
      <svg viewBox="-64 -64 128 128" width={size} height={size} role="img" aria-label="Unable to verify moon visual">
        <circle cx="0" cy="0" r={r} fill="oklch(0.12 0.03 280)" />
        <line x1="-34" y1="-34" x2="34" y2="34" stroke="oklch(0.72 0.18 40)" strokeWidth="4" />
      </svg>
    );
  }

  const litPath = illuminatedPath(phaseAngle, waxing, r);
  // Halo strengthens with illumination but never fully vanishes — the disc is
  // always faintly perceptible against the sky.
  const haloOpacity = tier === "near-invisible" ? 0.14 : tier === "thin-crescent" ? 0.22 : tier === "crescent" ? 0.34 : tier === "quarter" ? 0.42 : tier === "gibbous" ? 0.52 : 0.62;
  // Soft terminator feather: wider near quarter phases, tighter near new/full.
  const softness = tier === "near-invisible" || tier === "thin-crescent" ? 0.9 : tier === "full" ? 0.7 : 2.4;
  // Earthshine — the ghostly "old moon in the new moon's arms". Strongest at thin
  // phases, but ALWAYS faintly present so the full circle reads at any phase.
  const earthshine = tier === "near-invisible" ? 0.6 : tier === "thin-crescent" ? 0.5 : tier === "crescent" ? 0.3 : tier === "quarter" ? 0.16 : tier === "gibbous" ? 0.1 : 0.08;
  // Direction the sunlight comes from (for a consistent single-source feel).
  const sunSide = waxing ? 1 : -1;

  return (
    <svg viewBox="-64 -64 128 128" width={size} height={size} role="img" aria-label={`Moon, ${(illumination * 100).toFixed(0)}% illuminated`}>
      <defs>
        {/* Soft atmospheric halo — light scattering through the night sky, not a UI ring */}
        <radialGradient id={`glow-${uid}`} cx="50%" cy="50%">
          <stop offset="42%" stopColor="oklch(0.92 0.04 250 / 0.55)" />
          <stop offset="72%" stopColor="oklch(0.9 0.05 250 / 0.18)" />
          <stop offset="100%" stopColor="oklch(0.9 0.05 250 / 0)" />
        </radialGradient>
        {/* Lit surface with limb darkening + single directional source (sun side brighter). */}
        <radialGradient id={`surface-${uid}`} cx={`${50 + sunSide * 14}%`} cy="40%" r="72%">
          <stop offset="0%" stopColor="oklch(0.98 0.012 95)" />
          <stop offset="48%" stopColor="oklch(0.91 0.016 92)" />
          <stop offset="78%" stopColor="oklch(0.82 0.02 88)" />
          <stop offset="100%" stopColor="oklch(0.68 0.022 82)" />
        </radialGradient>
        {/* Night side base — deep blue-grey, slightly lit toward centre for earthshine. */}
        <radialGradient id={`dark-${uid}`} cx="50%" cy="50%">
          <stop offset="0%" stopColor="oklch(0.2 0.025 262)" />
          <stop offset="70%" stopColor="oklch(0.14 0.022 265)" />
          <stop offset="100%" stopColor="oklch(0.1 0.02 268)" />
        </radialGradient>
        {/* Earthshine glow — faint blue-grey radial on the unlit side. */}
        <radialGradient id={`earth-${uid}`} cx={`${50 - sunSide * 12}%`} cy="48%" r="75%">
          <stop offset="0%" stopColor="oklch(0.42 0.02 255)" />
          <stop offset="60%" stopColor="oklch(0.34 0.02 258)" />
          <stop offset="100%" stopColor="oklch(0.26 0.018 262)" />
        </radialGradient>
        {/* Fine regolith texture. */}
        <filter id={`tex-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="11" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.05 0" />
        </filter>
        {/* Maria soft-edge blur so patches don't look stamped. */}
        <filter id={`mblur-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.1" />
        </filter>
        {/* Soft terminator mask: white = lit, feathered edge. */}
        <filter id={`soft-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={softness} />
        </filter>
        <mask id={`lit-${uid}`}>
          <path d={litPath} fill="white" filter={`url(#soft-${uid})`} />
        </mask>
        <clipPath id={`disc-${uid}`}>
          <circle cx="0" cy="0" r={r} />
        </clipPath>
      </defs>

      {/* Outer atmospheric glow — soft bloom against the dark sky (always present) */}
      <circle cx="0" cy="0" r="62" fill={`url(#glow-${uid})`} opacity={haloOpacity} />

      {/* Night side (dark disc) — visible at every phase */}
      <circle cx="0" cy="0" r={r} fill={`url(#dark-${uid})`} />

      {/* Earthshine — faint ghostly visibility of the unlit side */}
      <g clipPath={`url(#disc-${uid})`} opacity={earthshine}>
        <circle cx="0" cy="0" r={r} fill={`url(#earth-${uid})`} />
        <g filter={`url(#mblur-${uid})`}>
          {MARIA.map((m, i) => (
            <ellipse
              key={`e${i}`}
              cx={m.cx}
              cy={m.cy}
              rx={m.rx}
              ry={m.ry}
              transform={`rotate(${m.rot} ${m.cx} ${m.cy})`}
              fill="oklch(0.24 0.02 258)"
              opacity={m.o * 0.8}
            />
          ))}
        </g>
      </g>

      {/* Illuminated surface, revealed only on the lit side */}
      <g mask={`url(#lit-${uid})`}>
        <g clipPath={`url(#disc-${uid})`}>
          <circle cx="0" cy="0" r={r} fill={`url(#surface-${uid})`} />
          {/* Maria — irregular, varied opacity, soft edges */}
          <g filter={`url(#mblur-${uid})`}>
            {MARIA.map((m, i) => (
              <ellipse
                key={`m${i}`}
                cx={m.cx}
                cy={m.cy}
                rx={m.rx}
                ry={m.ry}
                transform={`rotate(${m.rot} ${m.cx} ${m.cy})`}
                fill="oklch(0.58 0.022 248)"
                opacity={m.o}
              />
            ))}
          </g>
          {/* Craters with rim highlight + floor shadow */}
          {CRATERS.map((c, i) => (
            <g key={`c${i}`}>
              <circle cx={c.cx} cy={c.cy} r={c.r} fill="oklch(0.6 0.02 88)" opacity={c.o} />
              <circle cx={c.cx - sunSide * c.r * 0.2} cy={c.cy - c.r * 0.2} r={c.r * 0.7} fill="oklch(0.96 0.01 95)" opacity={c.o * 0.55} />
              <circle cx={c.cx + sunSide * c.r * 0.22} cy={c.cy + c.r * 0.22} r={c.r * 0.55} fill="oklch(0.45 0.02 80)" opacity={c.o * 0.4} />
            </g>
          ))}
          {/* Regolith texture overlay */}
          <rect x="-50" y="-50" width="100" height="100" filter={`url(#tex-${uid})`} />
          {/* Limb darkening ring */}
          <circle cx="0" cy="0" r={r} fill="none" stroke="oklch(0.5 0.02 78)" strokeWidth="6" opacity="0.32" />
        </g>
      </g>

      {/* Thin silver/grey outline ring — defines the full disc at every illumination level */}
      <circle cx="0" cy="0" r={r - 0.6} fill="none" stroke="oklch(0.82 0.02 250)" strokeWidth="0.9" opacity={0.55} />
    </svg>
  );
}
