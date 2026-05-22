import { validateMoonVisualInputs, visualTierForIllumination } from "@/lib/moon-visual";

interface Props {
  phaseAngle: number;
  illumination: number;
  waxing: boolean;
  size?: number;
}

function illuminatedPath(phaseAngle: number, waxing: boolean, r: number) {
  const angle = (((phaseAngle % 360) + 360) % 360) * Math.PI / 180;
  const terminator = Math.cos(angle);
  const steps = 96;
  const rightEdge: string[] = [];
  const leftEdge: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const y = -r + (2 * r * i) / steps;
    const edge = Math.sqrt(Math.max(0, r * r - y * y));
    const boundary = terminator * edge;
    rightEdge.push(`${edge.toFixed(3)} ${y.toFixed(3)}`);
    leftEdge.push(`${(-edge).toFixed(3)} ${y.toFixed(3)}`);
    if (waxing) leftEdge[i] = `${boundary.toFixed(3)} ${y.toFixed(3)}`;
    else rightEdge[i] = `${boundary.toFixed(3)} ${y.toFixed(3)}`;
  }
  return `M ${rightEdge.join(" L ")} L ${leftEdge.reverse().join(" L ")} Z`;
}

export function MoonSvg({ phaseAngle, illumination, waxing, size = 120 }: Props) {
  const r = 50;
  const visualValidation = validateMoonVisualInputs({ phaseAngle, illumination, waxing });
  const tier = visualTierForIllumination(illumination);
  if (!visualValidation.ok) {
    return (
      <svg viewBox="-60 -60 120 120" width={size} height={size} role="img" aria-label="Unable to verify moon visual">
        <circle cx="0" cy="0" r={r} fill="oklch(0.12 0.03 280)" />
        <line x1="-34" y1="-34" x2="34" y2="34" stroke="oklch(0.72 0.18 40)" strokeWidth="4" />
      </svg>
    );
  }
  const litPath = illuminatedPath(phaseAngle, waxing, r);
  const glowOpacity = tier === "near-invisible" ? 0.04 : tier === "thin-crescent" ? 0.14 : tier === "crescent" ? 0.26 : 0.48;
  const surfaceOpacity = tier === "near-invisible" ? 0.82 : 1;

  return (
    <svg viewBox="-60 -60 120 120" width={size} height={size}>
      <defs>
        <radialGradient id="moonGlow" cx="50%" cy="50%">
          <stop offset="0%" stopColor="oklch(0.75 0.2 280 / 0.55)" />
          <stop offset="100%" stopColor="oklch(0.75 0.2 280 / 0)" />
        </radialGradient>
        <radialGradient id="moonSurface" cx="35%" cy="35%">
          <stop offset="0%" stopColor="oklch(0.98 0.02 90)" />
          <stop offset="100%" stopColor="oklch(0.82 0.04 90)" />
        </radialGradient>
        <radialGradient id="moonDark" cx="50%" cy="50%">
          <stop offset="0%" stopColor="oklch(0.18 0.04 280)" />
          <stop offset="100%" stopColor="oklch(0.12 0.03 280)" />
        </radialGradient>
      </defs>
      <circle cx="0" cy="0" r="58" fill="url(#moonGlow)" opacity={glowOpacity} />
      {/* Dark disc */}
      <circle cx="0" cy="0" r={r} fill="url(#moonDark)" />
      {/* Lit area */}
      <path d={litPath} fill="url(#moonSurface)" opacity={surfaceOpacity} />
      {/* Craters (subtle, clipped to disc) */}
      <g clipPath="circle(50px at 0 0)" opacity="0.5">
        <circle cx="-14" cy="-10" r="4" fill="oklch(0.72 0.03 90)" />
        <circle cx="12" cy="18" r="3" fill="oklch(0.72 0.03 90)" />
        <circle cx="-4" cy="22" r="2" fill="oklch(0.72 0.03 90)" />
        <circle cx="20" cy="-22" r="2.5" fill="oklch(0.72 0.03 90)" />
      </g>
    </svg>
  );
}
