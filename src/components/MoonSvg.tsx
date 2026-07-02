import { useId } from "react";
import { validateMoonVisualInputs, visualTierForIllumination } from "@/lib/moon-visual";
import moonTexture from "@/assets/moon-texture.jpg.asset.json";

interface Props {
  phaseAngle: number;
  illumination: number;
  waxing: boolean;
  size?: number;
}

const TEXTURE_URL = moonTexture.url;

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
 * A single, photorealistic moon renderer used EVERYWHERE (homepage, birthday
 * scroll, postcards, letters). It layers a real high-resolution lunar texture:
 *   1. atmospheric halo bloom + always-on silver limb ring
 *   2. earthshine — the whole disc faintly perceptible (ghostly blue-grey)
 *   3. the lit portion revealed through a soft-feathered terminator mask
 *   4. limb darkening + a single directional sub-solar highlight (sun)
 */
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

  // Halo & earthshine strength scale with phase — never zero, so the full disc
  // is always perceptible against a dark card.
  const haloOpacity =
    tier === "near-invisible" ? 0.22 : tier === "thin-crescent" ? 0.28 : tier === "crescent" ? 0.4 : tier === "full" ? 0.7 : 0.55;
  const earthshine =
    tier === "near-invisible" ? 0.4 : tier === "thin-crescent" ? 0.34 : tier === "crescent" ? 0.22 : tier === "quarter" ? 0.14 : 0.1;
  // Soft terminator feather: wider near quarter phases, tight near new/full.
  const softness =
    tier === "near-invisible" || tier === "thin-crescent" ? 0.7 : tier === "full" ? 0.5 : tier === "quarter" ? 1.6 : 1.2;

  // Single directional light source — the Sun. Highlight sits on the lit limb.
  const sunX = waxing ? 26 : -26;

  return (
    <svg
      viewBox="-62 -62 124 124"
      width={size}
      height={size}
      role="img"
      aria-label={`Moon, ${(illumination * 100).toFixed(0)}% illuminated`}
    >
      <defs>
        {/* Atmospheric bloom around the disc */}
        <radialGradient id={`halo-${uid}`} cx="50%" cy="50%">
          <stop offset="60%" stopColor="oklch(0.92 0.03 250 / 0.55)" />
          <stop offset="82%" stopColor="oklch(0.9 0.04 250 / 0.18)" />
          <stop offset="100%" stopColor="oklch(0.9 0.04 250 / 0)" />
        </radialGradient>

        {/* Earthshine tint — cool ash-grey/blue over the dim disc */}
        <radialGradient id={`earth-${uid}`} cx="50%" cy="50%">
          <stop offset="0%" stopColor="oklch(0.4 0.03 250)" />
          <stop offset="100%" stopColor="oklch(0.3 0.035 260)" />
        </radialGradient>

        {/* Limb darkening — brighter centre, dimmer edge */}
        <radialGradient id={`limb-${uid}`} cx="46%" cy="44%" r="62%">
          <stop offset="0%" stopColor="oklch(0 0 0 / 0)" />
          <stop offset="72%" stopColor="oklch(0 0 0 / 0)" />
          <stop offset="100%" stopColor="oklch(0.18 0.02 260 / 0.55)" />
        </radialGradient>

        {/* Sub-solar highlight — subtle brightness swell toward the sun */}
        <radialGradient
          id={`sun-${uid}`}
          cx="50%"
          cy="50%"
          r="55%"
          gradientUnits="userSpaceOnUse"
          fx={sunX}
          fy={-8}
          cy2="0"
        >
          <stop offset="0%" stopColor="oklch(1 0.02 95 / 0.28)" />
          <stop offset="55%" stopColor="oklch(1 0.02 95 / 0.06)" />
          <stop offset="100%" stopColor="oklch(1 0.02 95 / 0)" />
        </radialGradient>

        {/* Soft terminator mask: white = lit, blurred edge for atmospheric feather */}
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

      {/* 1 · Atmospheric halo bloom */}
      <circle cx="0" cy="0" r={60} fill={`url(#halo-${uid})`} opacity={haloOpacity} />

      <g clipPath={`url(#disc-${uid})`}>
        {/* 2 · Earthshine — the whole disc faintly perceptible */}
        <circle cx="0" cy="0" r={r} fill="oklch(0.08 0.02 260)" />
        <image
          href={TEXTURE_URL}
          x={-r}
          y={-r}
          width={2 * r}
          height={2 * r}
          preserveAspectRatio="xMidYMid slice"
          opacity={earthshine}
        />
        <circle cx="0" cy="0" r={r} fill={`url(#earth-${uid})`} opacity={earthshine * 0.7} style={{ mixBlendMode: "soft-light" }} />

        {/* 3 · Lit surface — real texture revealed through soft terminator */}
        <g mask={`url(#lit-${uid})`}>
          <image
            href={TEXTURE_URL}
            x={-r}
            y={-r}
            width={2 * r}
            height={2 * r}
            preserveAspectRatio="xMidYMid slice"
          />
          {/* single directional sun highlight */}
          <rect x={-r} y={-r} width={2 * r} height={2 * r} fill={`url(#sun-${uid})`} />
        </g>

        {/* 4 · Limb darkening across the whole disc */}
        <circle cx="0" cy="0" r={r} fill={`url(#limb-${uid})`} />
      </g>

      {/* Always-on thin silver limb ring so the disc reads at any illumination */}
      <circle cx="0" cy="0" r={r - 0.4} fill="none" stroke="oklch(0.85 0.02 250)" strokeWidth="0.7" opacity="0.5" />
    </svg>
  );
}
