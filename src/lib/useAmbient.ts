import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Curated soundscape engine — all sound is synthesized with the Web Audio API,
 * so there are no files to stream and looping is inherently seamless. Every
 * soundscape is instrumental, low-volume, and fades gently in and out. Default
 * state is "off"; audio only starts on an explicit user gesture (autoplay).
 */

export const SOUNDSCAPES = [
  { id: "piano", label: "Moonlight Piano", desc: "soft felt piano, minimalist" },
  { id: "strings", label: "Midnight Strings", desc: "gentle orchestral, warm" },
  { id: "musicbox", label: "Starlit Music Box", desc: "nostalgic, delicate" },
  { id: "garden", label: "Night Garden", desc: "crickets, breeze, ambient" },
  { id: "ocean", label: "Ocean Under Moonlight", desc: "soft waves, spacious" },
  { id: "off", label: "Off", desc: "silence" },
] as const;

export type SoundscapeId = (typeof SOUNDSCAPES)[number]["id"];

interface Engine {
  stop: (ctx: AudioContext) => void;
}

const MASTER_VOLUME: Record<Exclude<SoundscapeId, "off">, number> = {
  piano: 0.16,
  strings: 0.1,
  musicbox: 0.13,
  garden: 0.09,
  ocean: 0.12,
};

function noiseBuffer(ctx: AudioContext, seconds = 2): AudioBuffer {
  const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

// A pentatonic-ish set of frequencies for melodic engines (calm, no dissonance).
const SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33];

function pluck(ctx: AudioContext, master: GainNode, freq: number, when: number, decay: number, type: OscillatorType, bright = 1) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(0.5 * bright, when + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, when + decay);
  osc.connect(g).connect(master);
  osc.start(when);
  osc.stop(when + decay + 0.1);
}

function buildEngine(id: Exclude<SoundscapeId, "off">, ctx: AudioContext, master: GainNode): Engine {
  if (id === "strings") {
    // Warm sustained chord (Cmaj9-ish) with slow vibrato per voice.
    const chord = [130.81, 196.0, 261.63, 329.63, 392.0];
    const nodes: { osc: OscillatorNode; lfo: OscillatorNode }[] = [];
    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = freq;
      osc.detune.value = (i - 2) * 5;
      const voice = ctx.createGain();
      voice.gain.value = 0.0001;
      voice.gain.setTargetAtTime(0.16, ctx.currentTime, 3);
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.06 + i * 0.011;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.06;
      lfo.connect(lfoGain).connect(voice.gain);
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 900;
      osc.connect(voice).connect(filter).connect(master);
      osc.start();
      lfo.start();
      nodes.push({ osc, lfo });
    });
    return {
      stop: () => nodes.forEach(({ osc, lfo }) => { try { osc.stop(); lfo.stop(); } catch { /* */ } }),
    };
  }

  if (id === "piano" || id === "musicbox") {
    // Scheduled gentle notes. Music box = bright, fast decay; piano = mellow.
    const type: OscillatorType = id === "musicbox" ? "triangle" : "sine";
    const decay = id === "musicbox" ? 1.4 : 2.6;
    const bright = id === "musicbox" ? 1.1 : 0.8;
    const octave = id === "musicbox" ? 2 : 1;
    let step = 0;
    const tick = () => {
      const now = ctx.currentTime;
      const root = SCALE[Math.floor(Math.random() * SCALE.length)] * octave;
      pluck(ctx, master, root, now + 0.02, decay, type, bright);
      // Occasional soft harmony note.
      if (Math.random() < 0.5) pluck(ctx, master, SCALE[Math.floor(Math.random() * SCALE.length)] * octave, now + 0.25, decay, type, bright * 0.6);
      step++;
    };
    tick();
    const interval = setInterval(tick, id === "musicbox" ? 1100 : 1900);
    return { stop: () => clearInterval(interval) };
  }

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

export function useSoundscape() {
  const [current, setCurrent] = useState<SoundscapeId>("off");
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const engineRef = useRef<Engine | null>(null);

  const teardown = useCallback((fade = true) => {
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

  const select = useCallback((id: SoundscapeId) => {
    setCurrent(id);
    teardown();
    if (id === "off") return;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    ctxRef.current = ctx;
    const master = ctx.createGain();
    master.gain.value = 0;
    master.gain.setTargetAtTime(MASTER_VOLUME[id], ctx.currentTime, 1.4); // gentle fade-in
    master.connect(ctx.destination);
    masterRef.current = master;
    engineRef.current = buildEngine(id, ctx, master);
  }, [teardown]);

  useEffect(() => () => teardown(false), [teardown]);

  return { current, select, playing: current !== "off" };
}

/** Legacy simple on/off wrapper kept for backwards compatibility. */
export function useAmbient() {
  const { playing, select } = useSoundscape();
  const toggle = useCallback(() => select(playing ? "off" : "strings"), [playing, select]);
  return { enabled: playing, toggle };
}
