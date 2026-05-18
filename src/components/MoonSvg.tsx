interface Props {
  phaseFraction: number; // 0..1 (0=new, 0.5=full)
  size?: number;
}

/**
 * Moon rendered as a bright disc with a "lit" overlay path.
 * Path math: terminator is a semi-ellipse with rx = |cos(2π·phase)|·r.
 *  - waxing crescent (mag>0, phase<0.5): outer right semicircle, inner ellipse on right  → sliver right
 *  - waxing gibbous  (mag<0, phase<0.5): outer right semicircle, inner ellipse on left   → lit > half
 *  - waning gibbous  (mag<0, phase>0.5): outer left  semicircle, inner ellipse on right
 *  - waning crescent (mag>0, phase>0.5): outer left  semicircle, inner ellipse on left   → sliver left
 */
export function MoonSvg({ phaseFraction, size = 120 }: Props) {
  const r = 50;
  const mag = Math.cos(phaseFraction * 2 * Math.PI); // -1..1
  const rx = Math.abs(mag) * r;
  const waxing = phaseFraction < 0.5;
  const outerSweep = waxing ? 1 : 0;
  const innerSweep = mag > 0 ? 1 : 0;
  const litPath = `M 0 -${r} A ${r} ${r} 0 0 ${outerSweep} 0 ${r} A ${rx} ${r} 0 0 ${innerSweep} 0 -${r} Z`;

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
      {/* Glow */}
      <circle cx="0" cy="0" r="58" fill="url(#moonGlow)" />
      {/* Dark disc */}
      <circle cx="0" cy="0" r={r} fill="url(#moonDark)" />
      {/* Lit area */}
      <path d={litPath} fill="url(#moonSurface)" />
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
