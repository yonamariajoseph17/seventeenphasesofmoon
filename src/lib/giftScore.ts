import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_BGM_SRC, DEFAULT_BGM_VOLUME } from "@/lib/useAmbient";

/**
 * The score for a gift experience.
 *
 * The default background music (`/The_metro_proposal(128k).mp3`) plays for the
 * whole cinematic sequence. If the sender uploaded a personal song it either
 * takes over the letter chapter only, or — when they chose "play for the entire
 * gift" — replaces the default score entirely.
 */

export type SongScope = "letter" | "all";

function fade(el: HTMLAudioElement, to: number, ms: number, onDone?: () => void) {
  const from = el.volume;
  const t0 = performance.now();
  const step = (t: number) => {
    const k = ms <= 0 ? 1 : Math.min(1, (t - t0) / ms);
    el.volume = Math.max(0, Math.min(1, from + (to - from) * k));
    if (k < 1) requestAnimationFrame(step);
    else onDone?.();
  };
  requestAnimationFrame(step);
}

interface Options {
  /** Signed URL of the sender's personal song, when present. */
  personalSong?: string;
  /** Whether the personal song covers only the letter chapter or the whole gift. */
  songScope?: SongScope;
}

export function useGiftScore({ personalSong, songScope = "letter" }: Options) {
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const songRef = useRef<HTMLAudioElement | null>(null);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);

  const wholeGiftSong = !!personalSong && songScope === "all";

  // Prepare the elements once (no playback until a gesture).
  useEffect(() => {
    const bgm = new Audio(DEFAULT_BGM_SRC);
    bgm.loop = true;
    bgm.preload = "auto";
    bgm.volume = 0;
    bgmRef.current = bgm;
    if (personalSong) {
      const song = new Audio(personalSong);
      song.loop = true;
      song.preload = "auto";
      song.volume = 0;
      song.crossOrigin = "anonymous";
      songRef.current = song;
    }
    return () => {
      bgmRef.current?.pause();
      songRef.current?.pause();
      bgmRef.current = null;
      songRef.current = null;
    };
  }, [personalSong]);

  /** Opening: fade in from silence to 0.18 over 4 seconds. */
  const start = useCallback(() => {
    if (started) return;
    setStarted(true);
    const primary = wholeGiftSong ? songRef.current : bgmRef.current;
    if (!primary) return;
    primary.volume = 0.01;
    primary.play().then(() => fade(primary, DEFAULT_BGM_VOLUME, 4000), () => {});
  }, [started, wholeGiftSong]);

  /** Set the volume of whichever track is currently the score. */
  const setLevel = useCallback((to: number, ms = 2000) => {
    const el = (songRef.current && !songRef.current.paused) ? songRef.current : bgmRef.current;
    if (el) fade(el, to, ms);
  }, []);

  /** Letter chapter — the personal song takes over if scoped to the letter. */
  const enterLetter = useCallback(() => {
    if (!personalSong || wholeGiftSong) { setLevel(DEFAULT_BGM_VOLUME, 2000); return; }
    const song = songRef.current;
    const bgm = bgmRef.current;
    if (bgm) fade(bgm, 0, 2000, () => bgm.pause());
    if (song) {
      song.volume = 0;
      song.play().then(() => fade(song, 0.15, 3000), () => { if (bgm) { bgm.play().catch(() => {}); fade(bgm, DEFAULT_BGM_VOLUME, 1500); } });
    }
  }, [personalSong, setLevel, wholeGiftSong]);

  /** Default score resumes from the bouquet chapter onward. */
  const resumeDefault = useCallback(() => {
    if (wholeGiftSong) return;
    const song = songRef.current;
    const bgm = bgmRef.current;
    if (song && !song.paused) fade(song, 0, 2000, () => song.pause());
    if (bgm) {
      if (bgm.paused) { bgm.volume = 0; bgm.play().catch(() => {}); }
      fade(bgm, DEFAULT_BGM_VOLUME, 2500);
    }
  }, [wholeGiftSong]);

  /** Bloom peak swell, then settle back. */
  const swell = useCallback(() => {
    setLevel(0.25, 2500);
    window.setTimeout(() => setLevel(DEFAULT_BGM_VOLUME, 3000), 4000);
  }, [setLevel]);

  /** Closing: a very slow 10-second fade to complete silence. */
  const fadeOut = useCallback((ms = 10000) => {
    const els = [bgmRef.current, songRef.current].filter(Boolean) as HTMLAudioElement[];
    els.forEach((el) => fade(el, 0, ms, () => el.pause()));
    window.setTimeout(() => setEnded(true), ms + 1000); // one full second of silence
  }, []);

  return { start, started, ended, enterLetter, resumeDefault, swell, setLevel, fadeOut };
}
