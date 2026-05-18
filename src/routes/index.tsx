import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { moonPhase, zodiacFor, visibleConstellations } from "@/lib/astro";
import { MoonSvg } from "@/components/MoonSvg";
import { StarField } from "@/components/StarField";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Her Sky · Moons & Stars from April 17, 2004" },
      { name: "description", content: "Every birthday's moon phase and night sky from Coimbatore, traced from 2004 to today." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Inter:wght@300;400;500;600&display=swap" },
    ],
  }),
});

const BIRTH_YEAR = 2004;
const BIRTH_MONTH = 4; // April
const BIRTH_DAY = 17;
const LOCATION = "Coimbatore, Tamil Nadu";

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function Index() {
  const today = new Date();
  const years = useMemo(() => {
    const out: Date[] = [];
    for (let y = BIRTH_YEAR; y <= today.getFullYear(); y++) {
      out.push(new Date(Date.UTC(y, BIRTH_MONTH - 1, BIRTH_DAY, 6, 0))); // ~local noon Coimbatore
    }
    return out;
  }, [today]);

  const birth = years[0];
  const birthMoon = moonPhase(birth);
  const birthZodiac = zodiacFor(BIRTH_MONTH, BIRTH_DAY);
  const todayMoon = moonPhase(today);
  const totalDays = Math.floor((today.getTime() - birth.getTime()) / 86_400_000);

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Ambient sky */}
      <StarField seed={42} className="pointer-events-none fixed inset-0 h-full w-full opacity-70" count={140} />
      <div className="pointer-events-none fixed inset-0" style={{ background: "radial-gradient(ellipse at 50% 0%, oklch(0.3 0.12 280 / 0.4), transparent 60%)" }} />

      {/* Hero */}
      <section className="relative mx-auto flex max-w-5xl flex-col items-center px-6 pt-24 pb-20 text-center md:pt-32">
        <p className="font-display text-sm tracking-[0.4em] text-accent uppercase">A love letter in moonlight</p>
        <h1 className="mt-6 text-balance font-display text-5xl leading-[1.05] md:text-7xl">
          The sky we&apos;ve shared,
          <br />
          <em className="text-accent">since April 17, 2004</em>
        </h1>
        <p className="mt-6 max-w-xl text-balance text-base text-muted-foreground md:text-lg">
          Every birthday, the moon returns a little different. Here is its quiet diary — drawn over {LOCATION},
          from the night you arrived to the sky tonight.
        </p>

        <div className="mt-14 grid w-full grid-cols-1 gap-6 md:grid-cols-3">
          <StatCard label="Days together with the stars" value={totalDays.toLocaleString()} />
          <StatCard label="Sun sign" value={`${birthZodiac.symbol} ${birthZodiac.sign}`} sub={`${birthZodiac.element} · ruled by ${birthZodiac.ruling}`} />
          <StatCard label="Moon tonight" value={`${todayMoon.emoji} ${todayMoon.name}`} sub={`${Math.round(todayMoon.illumination * 100)}% illuminated`} />
        </div>
      </section>

      {/* The night she was born */}
      <section className="relative mx-auto max-w-5xl px-6 pb-24">
        <div className="overflow-hidden rounded-2xl border border-border bg-card/40 p-8 backdrop-blur-sm md:p-12">
          <div className="grid items-center gap-10 md:grid-cols-[auto_1fr]">
            <div className="relative mx-auto">
              <MoonSvg illumination={birthMoon.illumination} waxing={birthMoon.waxing} size={180} />
            </div>
            <div>
              <p className="font-display text-xs tracking-[0.3em] text-accent uppercase">Night one</p>
              <h2 className="mt-2 font-display text-3xl md:text-4xl">{fmtDate(birth)}</h2>
              <p className="mt-3 text-muted-foreground">
                Above {LOCATION}, the moon was a <span className="text-foreground">{birthMoon.name.toLowerCase()}</span>,
                {" "}{Math.round(birthMoon.illumination * 100)}% lit, {birthMoon.waxing ? "growing toward fullness" : "softening toward dark"}.
                The constellations of {visibleConstellations(birth).slice(0, 3).join(", ")} kept watch.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="relative mx-auto max-w-6xl px-6 pb-32">
        <div className="mb-12 text-center">
          <p className="font-display text-xs tracking-[0.3em] text-accent uppercase">Every year, the same date</p>
          <h2 className="mt-3 font-display text-3xl md:text-5xl">A different moon, each time</h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {years.map((d) => (
            <YearCard key={d.getUTCFullYear()} date={d} />
          ))}
        </div>
      </section>

      <footer className="relative border-t border-border/50 py-10 text-center text-xs tracking-widest text-muted-foreground uppercase">
        Made under the same sky · {LOCATION}
      </footer>
    </main>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/30 p-5 backdrop-blur-sm">
      <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">{label}</p>
      <p className="mt-3 font-display text-2xl text-foreground">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function YearCard({ date }: { date: Date }) {
  const m = moonPhase(date);
  const year = date.getUTCFullYear();
  const cons = visibleConstellations(date);
  const seed = year * 10000 + (date.getUTCMonth() + 1) * 100 + date.getUTCDate();
  const ageLabel = `Turning ${year - BIRTH_YEAR}`;

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-border bg-card/30 p-6 backdrop-blur-sm transition-all hover:border-accent/60 hover:bg-card/50">
      <StarField seed={seed} className="pointer-events-none absolute inset-0 h-full w-full opacity-40 transition-opacity group-hover:opacity-70" count={40} />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs tracking-[0.25em] text-accent uppercase">{ageLabel}</p>
          <p className="mt-1 font-display text-2xl">April 17, {year}</p>
        </div>
        <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] tracking-widest text-muted-foreground uppercase">
          {year === BIRTH_YEAR ? "Birth" : year === new Date().getFullYear() ? "Now" : ""}
        </span>
      </div>

      <div className="relative mt-6 flex justify-center">
        <MoonSvg illumination={m.illumination} waxing={m.waxing} size={130} />
      </div>

      <div className="relative mt-6 space-y-2">
        <p className="font-display text-lg text-foreground">{m.emoji} {m.name}</p>
        <p className="text-xs text-muted-foreground">
          {Math.round(m.illumination * 100)}% illuminated · age {m.age.toFixed(1)}d · {m.waxing ? "waxing" : "waning"}
        </p>
        <p className="pt-2 text-xs leading-relaxed text-muted-foreground/90">
          Overhead: <span className="text-foreground/90">{cons.slice(0, 3).join(" · ")}</span>
        </p>
      </div>
    </article>
  );
}
