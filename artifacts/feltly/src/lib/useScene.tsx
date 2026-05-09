import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SceneId } from "@/lib/sceneAudio";

type SceneState = {
  scene: SceneId;
  volume: number;
  muted: boolean;
  playing: boolean;
  autoSync: boolean;
  mix: SceneId[];
  setScene: (s: SceneId) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  togglePlay: () => void;
  setPlaying: (v: boolean) => void;
  setAutoSync: (v: boolean) => void;
  toggleMix: (s: SceneId) => void;
  clearMix: () => void;
};

export const useScene = create<SceneState>()(
  persist(
    (set, get) => ({
      scene: "silence",
      volume: 0.4,
      muted: false,
      playing: false,
      autoSync: false,
      mix: [],
      setScene: (scene) => set({ scene, playing: scene !== "silence" ? true : get().playing, mix: [] }),
      setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
      toggleMute: () => set({ muted: !get().muted }),
      togglePlay: () => set({ playing: !get().playing }),
      setPlaying: (playing) => set({ playing }),
      setAutoSync: (autoSync) => set({ autoSync }),
      toggleMix: (s) => {
        const cur = get().mix;
        if (cur.includes(s)) set({ mix: cur.filter((x) => x !== s) });
        else set({ mix: [...cur, s].slice(0, 4) });
      },
      clearMix: () => set({ mix: [] }),
    }),
    { name: "feltly-scene" }
  )
);
