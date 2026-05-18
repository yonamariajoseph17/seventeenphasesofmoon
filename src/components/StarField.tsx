import { starField } from "@/lib/astro";

interface Props {
  seed: number;
  className?: string;
  count?: number;
}

export function StarField({ seed, className, count = 50 }: Props) {
  const stars = starField(seed, count);
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={className}
      aria-hidden
    >
      {stars.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill="var(--color-star)"
          opacity={s.o}
          style={{
            animation: `twinkle ${2 + (i % 4)}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </svg>
  );
}
