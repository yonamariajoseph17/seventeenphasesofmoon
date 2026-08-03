import { useEffect, useMemo, useState } from "react";

/**
 * Stars that emerge one by one, like eyes adjusting to darkness — a single star
 * first, then two more, then a sparse field spreading over ~3 seconds.
 */

interface Star { x: number; y: number; r: number; o: number; delay: number }

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function EmergingStars({ seed = 7, count = 150, spread = 3200 }: { seed?: number; count?: number; spread?: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const stars = useMemo<Star[]>(() => {
    const rnd = mulberry(seed * 9176 + 13);
    const out: Star[] = [];
    // the first three, upper centre — deliberately faint
    out.push({ x: 50, y: 16, r: 1.5, o: 0.55, delay: 0 });
    out.push({ x: 43, y: 21, r: 1.1, o: 0.4, delay: 700 });
    out.push({ x: 57, y: 12, r: 1.2, o: 0.45, delay: 1200 });
    for (let i = 0; i < count; i++) {
      const r = 0.5 + rnd() * rnd() * 1.9;
      out.push({
        x: rnd() * 100,
        y: rnd() * 100,
        r,
        o: 0.18 + rnd() * 0.62,
        delay: 1500 + rnd() * spread,
      });
    }
    return out;
  }, [seed, count, spread]);

  if (!mounted) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {stars.map((s, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.r * 2,
            height: s.r * 2,
            borderRadius: "50%",
            background: "#eef3ff",
            opacity: 0,
            boxShadow: s.r > 1.5 ? `0 0 ${s.r * 4}px rgba(210,225,255,0.7)` : undefined,
            ["--star-o" as string]: String(s.o),
            animation: `cine-star-in 1.6s ${s.delay}ms ease-out forwards`,
          }}
        />
      ))}
    </div>
  );
}
