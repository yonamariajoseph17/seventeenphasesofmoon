import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  src: string;
  /** When this becomes true, the song fades in (call after a user gesture). */
  autoStart: boolean;
  accent: string;
  panelBg?: string;
}

const TARGET_VOLUME = 0.85;
const FADE_IN_MS = 2600;
const FADE_OUT_MS = 700;

/**
 * Minimal, elegant audio player for an uploaded personal song.
 * Play/pause only — no scrubber, no volume bar. The song fades in gently and
 * loops until paused or the letter is closed.
 */
export function LetterAudio({ src, autoStart, accent, panelBg }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const startedRef = useRef(false);
  const [playing, setPlaying] = useState(false);

  const fadeTo = useCallback((target: number, ms: number, onDone?: () => void) => {
    const a = audioRef.current;
    if (!a) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const from = a.volume;
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / ms);
      a.volume = Math.max(0, Math.min(1, from + (target - from) * k));
      if (k < 1) rafRef.current = requestAnimationFrame(tick);
      else onDone?.();
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const play = useCallback(async () => {
    const a = audioRef.current;
    if (!a) return;
    a.loop = true;
    a.volume = 0;
    try {
      await a.play();
      setPlaying(true);
      fadeTo(TARGET_VOLUME, FADE_IN_MS);
    } catch {
      /* autoplay may be blocked until a gesture; the button still works */
      setPlaying(false);
    }
  }, [fadeTo]);

  const pause = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    fadeTo(0, FADE_OUT_MS, () => a.pause());
    setPlaying(false);
  }, [fadeTo]);

  useEffect(() => {
    if (autoStart && !startedRef.current) {
      startedRef.current = true;
      play();
    }
  }, [autoStart, play]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      audioRef.current?.pause();
    };
  }, []);

  return (
    <>
      <audio ref={audioRef} src={src} preload="auto" crossOrigin="anonymous" />
      <button
        type="button"
        onClick={() => (playing ? pause() : play())}
        aria-label={playing ? "Pause song" : "Play song"}
        className="fixed top-4 right-4 z-50 flex h-11 items-center gap-2 rounded-full px-4 backdrop-blur-md transition-opacity"
        style={{ background: panelBg ?? `${accent}16`, border: `1px solid ${accent}55`, color: accent }}
      >
        {playing ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
        <span className="text-[10px] tracking-[0.3em] uppercase">{playing ? "Their song" : "Play song"}</span>
      </button>
    </>
  );
}
