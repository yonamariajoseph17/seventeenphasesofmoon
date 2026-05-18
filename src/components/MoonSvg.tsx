interface Props {
  illumination: number; // 0..1
  waxing: boolean;
  size?: number;
}

// Moon rendered as two overlapping circles + a clip-path produced ellipse.
export function MoonSvg({ illumination, waxing, size = 120 }: Props) {
  const r = 50;
  // terminator ellipse rx based on illumination
  const k = 1 - 2 * illumination; // -1 full, 1 new
  const rx = Math.abs(k) * r;
  // Determine which side is lit. waxing => right side lit.
  const litRight = waxing;

  // Build path: lit area
  // We draw full disc as moon color, then overlay shadow shape.
  const shadowPath = (() => {
    // Outer arc: half circle on the dark side
    // For waxing (right lit), shadow is on left: outer half is left semicircle.
    const sweepOuter = litRight ? 0 : 1;
    const sweepInner = k >= 0 ? sweepOuter : 1 - sweepOuter;
    return [
      `M 0 -${r}`,
      `A ${r} ${r} 0 0 ${sweepOuter} 0 ${r}`,
      `A ${rx} ${r} 0 0 ${sweepInner} 0 -${r}`,
      "Z",
    ].join(" ");
  })();

  return (
    <svg viewBox={`-60 -60 120 120`} width={size} height={size} className="drop-shadow-[0_0_25px_oklch(0.75_0.18_280/0.6)]">
      <defs>
        <radialGradient id="moonSurface" cx="35%" cy="35%">
          <stop offset="0%" stopColor="oklch(0.98 0.02 90)" />
          <stop offset="100%" stopColor="oklch(0.82 0.04 90)" />
        </radialGradient>
        <radialGradient id="moonGlow" cx="50%" cy="50%">
          <stop offset="0%" stopColor="oklch(0.75 0.2 280 / 0.5)" />
          <stop offset="100%" stopColor="oklch(0.75 0.2 280 / 0)" />
        </radialGradient>
      </defs>
      <circle cx="0" cy="0" r="58" fill="url(#moonGlow)" />
      <circle cx="0" cy="0" r={r} fill="url(#moonSurface)" />
      <path d={shadowPath} fill="oklch(0.14 0.04 280)" opacity="0.92" />
      {/* subtle craters */}
      <circle cx="-15" cy="-10" r="4" fill="oklch(0.78 0.03 90)" opacity="0.6" />
      <circle cx="12" cy="18" r="3" fill="oklch(0.78 0.03 90)" opacity="0.5" />
      <circle cx="-5" cy="22" r="2" fill="oklch(0.78 0.03 90)" opacity="0.5" />
      <circle cx="20" cy="-22" r="2.5" fill="oklch(0.78 0.03 90)" opacity="0.55" />
    </svg>
  );
}
