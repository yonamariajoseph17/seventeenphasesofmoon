import { useMemo } from "react";
import { starField } from "@/lib/astro";

interface Props {
  seed: number;
  className?: string;
  count?: number;
  /** Show drifting shooting stars + Milky Way band. Disable on small cards for perf. */
  rich?: boolean;
}

/**
 * Realistic night sky: a deterministic field of varied stars with gentle
 * twinkle, a soft Milky Way gradient band, and occasional shooting stars.
 * No bokeh circles — sizes and brightness follow a natural distribution.
 */
export function StarField({ seed, className, count = 120, rich = true }: Props) {
  const stars = useMemo(() => starField(seed, count), [seed, count]);

  // Deterministic shooting-star streaks from the same seed.
  const shooters = useMemo(() => {
    if (!rich) return [];
    let s = seed * 7919 + 13;
    const rand = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    return Array.from({ length: 3 }, (_, i) => ({
      top: 6 + rand() * 45,
      left: 4 + rand() * 60,
      delay: 4 + i * 7 + rand() * 6,
      dur: 6 + rand() * 6,
      len: 60 + rand() * 90,
    }));
  }, [seed, rich]);

  return (
    <div className={className} aria-hidden style={{ overflow: "hidden" }}>
      {/* Soft Milky Way gradient band */}
      {rich && (
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 60% at 70% 18%, oklch(0.7 0.06 270 / 0.10), transparent 60%), radial-gradient(90% 50% at 25% 80%, oklch(0.72 0.05 250 / 0.08), transparent 55%)",
          }}
        />
      )}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        {stars.map((st, i) => {
          const bright = st.o > 0.85;
          return (
            <circle
              key={i}
              cx={st.x}
              cy={st.y}
              r={st.r * (bright ? 0.9 : 0.55)}
              fill="var(--color-star)"
              opacity={st.o}
              style={{ animation: `twinkle ${2.4 + (i % 5)}s ease-in-out ${st.delay}s infinite` }}
            />
          );
        })}
      </svg>
      {/* Shooting stars */}
      {shooters.map((sh, i) => (
        <span
          key={`sh-${i}`}
          className="pointer-events-none absolute"
          style={{
            top: `${sh.top}%`,
            left: `${sh.left}%`,
            width: `${sh.len}px`,
            height: "1.5px",
            background: "linear-gradient(90deg, transparent, var(--color-star), transparent)",
            opacity: 0,
            ["--shoot-x" as string]: `${sh.len * 1.6}px`,
            ["--shoot-y" as string]: `${sh.len * 0.5}px`,
            ["--shoot-rot" as string]: "20deg",
            animation: `shoot ${sh.dur}s ease-in ${sh.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
