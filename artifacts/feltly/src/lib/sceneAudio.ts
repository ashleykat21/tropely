/**
 * Procedural ambient sound generators using the WebAudio API.
 * No network, no licensing — generated in the browser at runtime.
 */

export type SceneId =
  | "silence"
  | "rain"
  | "fireplace"
  | "nature"
  | "ocean"
  | "tension"
  | "cafe"
  | "wind"
  | "vinyl";

export type Scene = {
  id: SceneId;
  label: string;
  emoji: string;
  premium: boolean;
  build: (ctx: AudioContext, out: AudioNode) => () => void;
};

function noiseBuffer(ctx: AudioContext, seconds = 2, kind: "white" | "brown" | "pink" = "white") {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  if (kind === "white") {
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  } else if (kind === "brown") {
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      data[i] = last * 3.5;
    }
  } else {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < data.length; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.96900 * b2 + w * 0.1538520;
      b3 = 0.86650 * b3 + w * 0.3104856;
      b4 = 0.55000 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
  }
  return buffer;
}

function loopedSource(ctx: AudioContext, buf: AudioBuffer) {
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  return src;
}

export const SCENES: Scene[] = [
  {
    id: "silence",
    label: "Silence",
    emoji: "🤫",
    premium: false,
    build: () => () => {},
  },
  {
    id: "rain",
    label: "Rain",
    emoji: "🌧️",
    premium: false,
    build: (ctx, out) => {
      const src = loopedSource(ctx, noiseBuffer(ctx, 3, "pink"));
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1200;
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 400;
      src.connect(lp).connect(hp).connect(out);
      src.start();
      return () => { try { src.stop(); src.disconnect(); lp.disconnect(); hp.disconnect(); } catch {} };
    },
  },
  {
    id: "fireplace",
    label: "Fireplace",
    emoji: "🔥",
    premium: false,
    build: (ctx, out) => {
      const base = loopedSource(ctx, noiseBuffer(ctx, 4, "brown"));
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 700;
      const baseGain = ctx.createGain();
      baseGain.gain.value = 0.6;
      base.connect(lp).connect(baseGain).connect(out);
      base.start();

      let stopped = false;
      const crackle = () => {
        if (stopped) return;
        const burst = ctx.createBufferSource();
        const buf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length * 0.3));
        burst.buffer = buf;
        const g = ctx.createGain();
        g.gain.value = 0.15 + Math.random() * 0.25;
        burst.connect(g).connect(out);
        burst.start();
        burst.stop(ctx.currentTime + 0.06);
        setTimeout(crackle, 80 + Math.random() * 600);
      };
      crackle();

      return () => {
        stopped = true;
        try { base.stop(); base.disconnect(); lp.disconnect(); baseGain.disconnect(); } catch {}
      };
    },
  },
  {
    id: "nature",
    label: "Nature",
    emoji: "🌿",
    premium: true,
    build: (ctx, out) => {
      const wind = loopedSource(ctx, noiseBuffer(ctx, 4, "pink"));
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 800;
      const wg = ctx.createGain();
      wg.gain.value = 0.5;
      wind.connect(lp).connect(wg).connect(out);
      wind.start();

      let stopped = false;
      const chirp = () => {
        if (stopped) return;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const base = 1800 + Math.random() * 1400;
        osc.frequency.setValueAtTime(base, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(base * 1.3, ctx.currentTime + 0.08);
        osc.frequency.exponentialRampToValueAtTime(base * 0.85, ctx.currentTime + 0.16);
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
        osc.connect(g).connect(out);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
        setTimeout(chirp, 1500 + Math.random() * 4000);
      };
      chirp();

      return () => {
        stopped = true;
        try { wind.stop(); wind.disconnect(); lp.disconnect(); wg.disconnect(); } catch {}
      };
    },
  },
  {
    id: "ocean",
    label: "Ocean",
    emoji: "🌊",
    premium: true,
    build: (ctx, out) => {
      const src = loopedSource(ctx, noiseBuffer(ctx, 4, "brown"));
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 600;
      const g = ctx.createGain();
      g.gain.value = 0.5;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.12;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.35;
      lfo.connect(lfoGain).connect(g.gain);
      src.connect(lp).connect(g).connect(out);
      src.start();
      lfo.start();
      return () => { try { src.stop(); lfo.stop(); src.disconnect(); lp.disconnect(); g.disconnect(); lfo.disconnect(); lfoGain.disconnect(); } catch {} };
    },
  },
  {
    id: "tension",
    label: "Low tension",
    emoji: "🎻",
    premium: true,
    build: (ctx, out) => {
      const a = ctx.createOscillator();
      const b = ctx.createOscillator();
      a.type = "sine";
      b.type = "sine";
      a.frequency.value = 55;
      b.frequency.value = 55.7;
      const g = ctx.createGain();
      g.gain.value = 0.35;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 250;
      a.connect(g);
      b.connect(g);
      g.connect(lp).connect(out);
      a.start();
      b.start();
      return () => { try { a.stop(); b.stop(); a.disconnect(); b.disconnect(); g.disconnect(); lp.disconnect(); } catch {} };
    },
  },
  {
    id: "cafe",
    label: "Café murmur",
    emoji: "☕",
    premium: true,
    build: (ctx, out) => {
      const src = loopedSource(ctx, noiseBuffer(ctx, 4, "pink"));
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 500;
      bp.Q.value = 0.6;
      const g = ctx.createGain();
      g.gain.value = 0.5;
      src.connect(bp).connect(g).connect(out);
      src.start();
      return () => { try { src.stop(); src.disconnect(); bp.disconnect(); g.disconnect(); } catch {} };
    },
  },
  {
    id: "wind",
    label: "Wind",
    emoji: "🌬️",
    premium: true,
    build: (ctx, out) => {
      const src = loopedSource(ctx, noiseBuffer(ctx, 4, "white"));
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 350;
      const g = ctx.createGain();
      g.gain.value = 0.5;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.2;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 200;
      lfo.connect(lfoGain).connect(lp.frequency);
      src.connect(lp).connect(g).connect(out);
      src.start();
      lfo.start();
      return () => { try { src.stop(); lfo.stop(); src.disconnect(); lp.disconnect(); g.disconnect(); lfo.disconnect(); lfoGain.disconnect(); } catch {} };
    },
  },
  {
    id: "vinyl",
    label: "Vinyl crackle",
    emoji: "💿",
    premium: true,
    build: (ctx, out) => {
      const src = loopedSource(ctx, noiseBuffer(ctx, 2, "white"));
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 2000;
      const g = ctx.createGain();
      g.gain.value = 0.18;
      src.connect(hp).connect(g).connect(out);
      src.start();
      return () => { try { src.stop(); src.disconnect(); hp.disconnect(); g.disconnect(); } catch {} };
    },
  },
];

import type { MoodKey } from "@/lib/moods";

export const MOOD_TO_SCENE: Record<MoodKey, SceneId> = {
  cozy: "fireplace",
  calm: "nature",
  melancholy: "rain",
  intense: "tension",
  dreamy: "ocean",
  joyful: "cafe",
  mysterious: "wind",
};
