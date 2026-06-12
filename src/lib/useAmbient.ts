import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Gentle, seamless ambient soundscape generated with the Web Audio API — no
 * audio files to stream. A soft pad of detuned sine voices over a slow chord
 * drift, kept at a low, instrumental volume. Default state is MUTED; sound only
 * starts on an explicit user gesture (browser autoplay policy).
 */
export function useAmbient() {
  const [enabled, setEnabled] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const nodesRef = useRef<{ osc: OscillatorNode; lfo: OscillatorNode }[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const teardown = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    nodesRef.current.forEach(({ osc, lfo }) => {
      try { osc.stop(); lfo.stop(); } catch { /* already stopped */ }
    });
    nodesRef.current = [];
    if (masterRef.current && ctxRef.current) {
      masterRef.current.gain.setTargetAtTime(0, ctxRef.current.currentTime, 0.3);
    }
    const ctx = ctxRef.current;
    if (ctx) setTimeout(() => { ctx.close().catch(() => {}); }, 800);
    ctxRef.current = null;
    masterRef.current = null;
  }, []);

  const start = useCallback(() => {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    ctxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.value = 0;
    master.gain.setTargetAtTime(0.08, ctx.currentTime, 1.2); // gentle fade-in
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1400;
    master.connect(filter).connect(ctx.destination);
    masterRef.current = master;

    // Soft chord (A minor 9-ish), instrumental and timeless.
    const chord = [220, 261.63, 329.63, 392, 493.88];
    nodesRef.current = chord.map((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.detune.value = (i - 2) * 4;
      const voice = ctx.createGain();
      voice.gain.value = 0.0001;

      // Slow breathing amplitude per voice.
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.05 + i * 0.013;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.5;
      lfo.connect(lfoGain).connect(voice.gain);
      voice.gain.setTargetAtTime(0.5, ctx.currentTime, 2);

      osc.connect(voice).connect(master);
      osc.start();
      lfo.start();
      return { osc, lfo };
    });
  }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      if (next) start();
      else teardown();
      return next;
    });
  }, [start, teardown]);

  // Stop sound when leaving the page / unmounting.
  useEffect(() => () => teardown(), [teardown]);

  return { enabled, toggle };
}
