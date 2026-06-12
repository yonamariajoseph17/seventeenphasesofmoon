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

// Near-side lunar maria (approximate positions on a disc of radius 50).
const MARIA: Array<{ cx: number; cy: number; rx: number; ry: number; rot: number; o: number }> = [
  { cx: -16, cy: -20, rx: 14, ry: 11, rot: -20, o: 0.5 },  // Imbrium
  { cx: 6, cy: -16, rx: 9, ry: 9, rot: 0, o: 0.46 },        // Serenitatis
  { cx: 18, cy: -6, rx: 8, ry: 9, rot: 10, o: 0.46 },       // Tranquillitatis
  { cx: 32, cy: -9, rx: 5, ry: 5, rot: 0, o: 0.5 },         // Crisium
  { cx: -27, cy: 4, rx: 11, ry: 18, rot: 8, o: 0.4 },       // Oceanus Procellarum
  { cx: 24, cy: 14, rx: 8, ry: 7, rot: 0, o: 0.42 },        // Fecunditatis
  { cx: -8, cy: 24, rx: 11, ry: 7, rot: -8, o: 0.4 },       // Nubium / Humorum
];

const CRATERS: Array<{ cx: number; cy: number; r: number }> = [
  { cx: -2, cy: 34, r: 4.5 },   // Tycho region
  { cx: 4, cy: 8, r: 2.4 },
  { cx: -22, cy: -8, r: 2.2 },
  { cx: 14, cy: 28, r: 2 },
  { cx: 30, cy: 4, r: 1.8 },
  { cx: -34, cy: 18, r: 1.6 },
  { cx: 8, cy: -30, r: 1.7 },
];

export function MoonSvg({ phaseAngle, illumination, waxing, size = 120 }: Props) {
  const r = 50;
  const uid = useId().replace(/:/g, "");
  const visualValidation = validateMoonVisualInputs({ phaseAngle, illumination, waxing });
  const tier = visualTierForIllumination(illumination);

  // BLOCK RENDER when the visual cannot be reconciled with the astronomy.
  if (!visualValidation.ok) {
    return (
      <svg viewBox="-60 -60 120 120" width={size} height={size} role="img" aria-label="Unable to verify moon visual">
        <circle cx="0" cy="0" r={r} fill="oklch(0.12 0.03 280)" />
        <line x1="-34" y1="-34" x2="34" y2="34" stroke="oklch(0.72 0.18 40)" strokeWidth="4" />
      </svg>
    );
  }

  const litPath = illuminatedPath(phaseAngle, waxing, r);
  const glowOpacity = tier === "near-invisible" ? 0.05 : tier === "thin-crescent" ? 0.16 : tier === "crescent" ? 0.3 : 0.55;
  // Soft terminator: wider blur near quarter phases, tight near new/full.
  const softness = tier === "near-invisible" || tier === "thin-crescent" ? 0.6 : tier === "full" ? 0.8 : 2.2;

  return (
    <svg viewBox="-60 -60 120 120" width={size} height={size} role="img" aria-label={`Moon, ${(illumination * 100).toFixed(0)}% illuminated`}>
      <defs>
        <radialGradient id={`glow-${uid}`} cx="50%" cy="50%">
          <stop offset="55%" stopColor="oklch(0.9 0.05 250 / 0.5)" />
          <stop offset="100%" stopColor="oklch(0.9 0.05 250 / 0)" />
        </radialGradient>
        {/* Surface with limb darkening (brighter centre, dimmer edge). */}
        <radialGradient id={`surface-${uid}`} cx="42%" cy="40%" r="65%">
          <stop offset="0%" stopColor="oklch(0.97 0.012 95)" />
          <stop offset="65%" stopColor="oklch(0.88 0.018 90)" />
          <stop offset="100%" stopColor="oklch(0.72 0.02 85)" />
        </radialGradient>
        <radialGradient id={`dark-${uid}`} cx="50%" cy="50%">
          <stop offset="0%" stopColor="oklch(0.16 0.03 270)" />
          <stop offset="100%" stopColor="oklch(0.1 0.025 270)" />
        </radialGradient>
        {/* Fine regolith texture. */}
        <filter id={`tex-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.06 0" />
        </filter>
        {/* Soft terminator mask: white = lit, blurred edge. */}
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

      {/* Outer atmospheric glow */}
      <circle cx="0" cy="0" r="59" fill={`url(#glow-${uid})`} opacity={glowOpacity} />

      {/* Night side (earthshine-dark disc) */}
      <circle cx="0" cy="0" r={r} fill={`url(#dark-${uid})`} />

      {/* Illuminated surface, revealed only on the lit side */}
      <g mask={`url(#lit-${uid})`}>
        <g clipPath={`url(#disc-${uid})`}>
          <circle cx="0" cy="0" r={r} fill={`url(#surface-${uid})`} />
          {/* Maria */}
          {MARIA.map((m, i) => (
            <ellipse
              key={`m${i}`}
              cx={m.cx}
              cy={m.cy}
              rx={m.rx}
              ry={m.ry}
              transform={`rotate(${m.rot} ${m.cx} ${m.cy})`}
              fill="oklch(0.6 0.022 250)"
              opacity={m.o}
            />
          ))}
          {/* Craters with rim highlight + floor shadow */}
          {CRATERS.map((c, i) => (
            <g key={`c${i}`}>
              <circle cx={c.cx} cy={c.cy} r={c.r} fill="oklch(0.62 0.02 90)" opacity="0.55" />
              <circle cx={c.cx - c.r * 0.18} cy={c.cy - c.r * 0.18} r={c.r * 0.7} fill="oklch(0.95 0.01 95)" opacity="0.35" />
            </g>
          ))}
          {/* Regolith texture overlay */}
          <rect x="-50" y="-50" width="100" height="100" filter={`url(#tex-${uid})`} />
          {/* Limb darkening ring */}
          <circle cx="0" cy="0" r={r} fill="none" stroke="oklch(0.55 0.02 80)" strokeWidth="5" opacity="0.35" />
        </g>
      </g>
    </svg>
  );
}
