import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Curated soundscape engine.
 *
 * "Our Song" is a real audio file (the project's own score); the two ambient
 * soundscapes are synthesized with the Web Audio API so looping is inherently
 * seamless. Every option is low-volume with a gentle 1.5s fade in and out.
 *
 * "Our Song" is the default sitewide selection. Browsers block autoplay, so it
 * is armed on mount and starts on the first user interaction anywhere.
 */

/** The default background score used sitewide and for every gift experience. */
export const DEFAULT_BGM_SRC = "/The_metro_proposal(128k).mp3";
export const DEFAULT_BGM_VOLUME = 0.18;
export const BGM_FADE_MS = 1500;

export const SOUNDSCAPES = [
  { id: "oursong", label: "Our Song", desc: "The Metro Proposal" },
  { id: "garden", label: "Night Garden", desc: "crickets, breeze, ambient" },
  { id: "ocean", label: "Ocean Under Moonlight", desc: "soft waves, spacious" },
  { id: "off", label: "Off", desc: "silence" },
] as const;

export type SoundscapeId = (typeof SOUNDSCAPES)[number]["id"];

interface Engine {
  stop: (ctx: AudioContext) => void;
}

const MASTER_VOLUME: Record<"garden" | "ocean", number> = {
  garden: 0.09,
  ocean: 0.12,
};

function noiseBuffer(ctx: AudioContext, seconds = 2): AudioBuffer {
  const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function buildEngine(id: "garden" | "ocean", ctx: AudioContext, master: GainNode): Engine {
  if (id === "ocean") {
    // Filtered noise with slow swelling waves.
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx, 3);
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 500;
    const swell = ctx.createGain();
    swell.gain.value = 0.2;
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.12; // ~8s wave cycle
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.35;
    lfo.connect(lfoGain).connect(swell.gain);
    src.connect(filter).connect(swell).connect(master);
    src.start();
    lfo.start();
    return { stop: () => { try { src.stop(); lfo.stop(); } catch { /* */ } } };
  }

  // garden — breeze (filtered noise) + occasional cricket chirps.
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, 3);
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1800;
  filter.Q.value = 0.6;
  const breeze = ctx.createGain();
  breeze.gain.value = 0.12;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.08;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.06;
  lfo.connect(lfoGain).connect(breeze.gain);
  src.connect(filter).connect(breeze).connect(master);
  src.start();
  lfo.start();
  const chirp = () => {
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = 3200 + Math.random() * 800;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    for (let i = 0; i < 4; i++) {
      g.gain.linearRampToValueAtTime(0.08, now + i * 0.06 + 0.01);
      g.gain.linearRampToValueAtTime(0.0001, now + i * 0.06 + 0.04);
    }
    o.connect(g).connect(master);
    o.start(now);
    o.stop(now + 0.4);
  };
  const interval = setInterval(() => { if (Math.random() < 0.7) chirp(); }, 2600);
  return { stop: () => { clearInterval(interval); try { src.stop(); lfo.stop(); } catch { /* */ } } };
}

/** Fade an <audio> element's volume over `ms`, optionally pausing at the end. */
function fadeAudio(el: HTMLAudioElement, to: number, ms: number, onDone?: () => void) {
  const from = el.volume;
  const t0 = performance.now();
  const step = (t: number) => {
    const k = Math.min(1, (t - t0) / ms);
    el.volume = Math.max(0, Math.min(1, from + (to - from) * k));
    if (k < 1) requestAnimationFrame(step);
    else onDone?.();
  };
  requestAnimationFrame(step);
}

export function useSoundscape() {
  const [current, setCurrent] = useState<SoundscapeId>("oursong");
  const [playing, setPlaying] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const songRef = useRef<HTMLAudioElement | null>(null);
  const currentRef = useRef<SoundscapeId>("oursong");

  const teardown = useCallback((fade = true) => {
    const song = songRef.current;
    if (song) {
      songRef.current = null;
      if (fade) fadeAudio(song, 0, BGM_FADE_MS, () => song.pause());
      else song.pause();
    }
    const ctx = ctxRef.current;
    const master = masterRef.current;
    const engine = engineRef.current;
    if (ctx && master && fade) master.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
    const closeDelay = fade ? 900 : 0;
    setTimeout(() => {
      try { engine?.stop(ctx as AudioContext); } catch { /* */ }
      ctx?.close().catch(() => {});
    }, closeDelay);
    engineRef.current = null;
    masterRef.current = null;
    ctxRef.current = null;
  }, []);

  const start = useCallback((id: SoundscapeId) => {
    if (id === "off") { setPlaying(false); return; }

    if (id === "oursong") {
      const el = new Audio(DEFAULT_BGM_SRC);
      el.loop = true;
      el.preload = "auto";
      el.volume = 0;
      songRef.current = el;
      el.play().then(
        () => { setPlaying(true); fadeAudio(el, DEFAULT_BGM_VOLUME, BGM_FADE_MS); },
        () => { setPlaying(false); }, // autoplay blocked — a gesture will retry
      );
      return;
    }

    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    ctxRef.current = ctx;
    const master = ctx.createGain();
    master.gain.value = 0;
    master.gain.setTargetAtTime(MASTER_VOLUME[id], ctx.currentTime, BGM_FADE_MS / 1000);
    master.connect(ctx.destination);
    masterRef.current = master;
    engineRef.current = buildEngine(id, ctx, master);
    setPlaying(true);
  }, []);

  const select = useCallback((id: SoundscapeId) => {
    setCurrent(id);
    currentRef.current = id;
    teardown();
    start(id);
  }, [start, teardown]);

  // Arm the default track: try immediately, then retry on the first gesture.
  useEffect(() => {
    start("oursong");
    const kick = () => {
      if (currentRef.current !== "off" && !songRef.current && !ctxRef.current) start(currentRef.current);
      else if (songRef.current?.paused) {
        songRef.current.play().then(() => setPlaying(true), () => {});
      }
      window.removeEventListener("pointerdown", kick);
      window.removeEventListener("keydown", kick);
      window.removeEventListener("touchstart", kick);
    };
    window.addEventListener("pointerdown", kick, { once: true });
    window.addEventListener("keydown", kick, { once: true });
    window.addEventListener("touchstart", kick, { once: true });
    return () => {
      window.removeEventListener("pointerdown", kick);
      window.removeEventListener("keydown", kick);
      window.removeEventListener("touchstart", kick);
    };
  }, [start]);

  useEffect(() => () => teardown(false), [teardown]);

  return { current, select, playing: current !== "off" && playing };
}

/** Legacy simple on/off wrapper kept for backwards compatibility. */
export function useAmbient() {
  const { playing, select } = useSoundscape();
  const toggle = useCallback(() => select(playing ? "off" : "oursong"), [playing, select]);
  return { enabled: playing, toggle };
}
