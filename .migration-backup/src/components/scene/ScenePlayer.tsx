import { useEffect, useMemo, useRef, useState } from "react";
import { useScene } from "@/lib/useScene";
import { SCENES, MOOD_TO_SCENE, type SceneId } from "@/lib/sceneAudio";
import { useLibrary } from "@/lib/store";
import { usePremium } from "@/lib/usePremium";
import { Button } from "@/components/ui/button";
import { Music2, Play, Pause, Volume2, VolumeX, Lock, Sparkles, ChevronUp, ChevronDown, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/**
 * Global Scene Sync mini-player. Renders a compact pill in the bottom-right
 * (above the mobile nav) and expands into a full panel when tapped. Handles
 * the WebAudio lifecycle for the active scene (or premium custom mix).
 */
export function ScenePlayer() {
  const isPremium = usePremium((s) => s.isPremium);
  const { books, currentId } = useLibrary();
  const current = books.find((b) => b.id === currentId) ?? books.find((b) => b.shelf === "reading");

  const scene = useScene((s) => s.scene);
  const volume = useScene((s) => s.volume);
  const muted = useScene((s) => s.muted);
  const playing = useScene((s) => s.playing);
  const autoSync = useScene((s) => s.autoSync);
  const mix = useScene((s) => s.mix);
  const setScene = useScene((s) => s.setScene);
  const setVolume = useScene((s) => s.setVolume);
  const toggleMute = useScene((s) => s.toggleMute);
  const togglePlay = useScene((s) => s.togglePlay);
  const setPlaying = useScene((s) => s.setPlaying);
  const setAutoSync = useScene((s) => s.setAutoSync);
  const toggleMix = useScene((s) => s.toggleMix);
  const clearMix = useScene((s) => s.clearMix);

  const [open, setOpen] = useState(false);

  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const teardownsRef = useRef<(() => void)[]>([]);

  // Resolve the effective scene IDs to play.
  const effectiveScenes: SceneId[] = useMemo(() => {
    if (isPremium && mix.length > 0) return mix;
    if (isPremium && autoSync && current) {
      const auto = MOOD_TO_SCENE[current.mood];
      if (auto) return [auto];
    }
    return [scene];
  }, [isPremium, mix, autoSync, current?.mood, scene]);

  // Audio engine lifecycle
  useEffect(() => {
    // Tear down any previous nodes
    teardownsRef.current.forEach((fn) => fn());
    teardownsRef.current = [];

    const noopScenes = effectiveScenes.every((s) => s === "silence");
    if (!playing || noopScenes) return;

    const ctx = ctxRef.current ?? new (window.AudioContext || (window as any).webkitAudioContext)();
    ctxRef.current = ctx;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    if (!masterRef.current) {
      const g = ctx.createGain();
      g.connect(ctx.destination);
      masterRef.current = g;
    }
    masterRef.current.gain.value = muted ? 0 : volume;

    effectiveScenes.forEach((id) => {
      const def = SCENES.find((x) => x.id === id);
      if (!def) return;
      const teardown = def.build(ctx, masterRef.current!);
      teardownsRef.current.push(teardown);
    });

    return () => {
      teardownsRef.current.forEach((fn) => fn());
      teardownsRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, effectiveScenes.join("|")]);

  // Keep master gain in sync
  useEffect(() => {
    if (masterRef.current) masterRef.current.gain.value = muted ? 0 : volume;
  }, [volume, muted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      teardownsRef.current.forEach((fn) => fn());
      teardownsRef.current = [];
      try {
        masterRef.current?.disconnect();
        ctxRef.current?.close();
      } catch {}
      masterRef.current = null;
      ctxRef.current = null;
    };
  }, []);

  const activeLabel = effectiveScenes.length > 1
    ? `Mix · ${effectiveScenes.length}`
    : SCENES.find((s) => s.id === effectiveScenes[0])?.label ?? "Silence";
  const activeEmoji = effectiveScenes.length > 1
    ? "🎚️"
    : SCENES.find((s) => s.id === effectiveScenes[0])?.emoji ?? "🤫";

  return (
    <div
      className="fixed right-3 z-40 select-none"
      style={{
        bottom: "calc(env(safe-area-inset-bottom) + 4.5rem)",
      }}
    >
      {open && (
        <div className="mb-2 w-[min(92vw,360px)] rounded-2xl border border-border/60 bg-background/95 backdrop-blur shadow-lg p-4 space-y-3 animate-fade-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Music2 className="h-3.5 w-3.5" />
              <span className="text-xs font-medium uppercase tracking-widest">Scene Sync</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground transition"
              aria-label="Collapse"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {isPremium && current && (
            <button
              onClick={() => {
                setAutoSync(!autoSync);
                if (!autoSync) clearMix();
                toast.success(autoSync ? "Auto-sync off" : `Auto-syncing to ${current.mood}`);
              }}
              className={cn(
                "w-full rounded-xl border px-3 py-2 text-xs flex items-center justify-between transition",
                autoSync ? "bg-foreground text-background border-foreground" : "border-border hover:bg-foreground/5"
              )}
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                Auto-sync to "{current.title}"
              </span>
              <span className="text-[10px] opacity-80">{autoSync ? "On" : "Off"}</span>
            </button>
          )}

          <div className="grid grid-cols-3 gap-1.5">
            {SCENES.map((s) => {
              const locked = s.premium && !isPremium;
              const isActive =
                (mix.length > 0 && mix.includes(s.id)) ||
                (mix.length === 0 && scene === s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    if (locked) {
                      toast("Premium scene", {
                        description: "Unlock the full sound library with Premium.",
                        icon: <Lock className="h-4 w-4" />,
                      });
                      return;
                    }
                    if (autoSync) setAutoSync(false);
                    if (isPremium && mix.length > 0 && s.id !== "silence") {
                      toggleMix(s.id);
                    } else {
                      setScene(s.id);
                    }
                  }}
                  className={cn(
                    "rounded-xl border px-2 py-2 text-[11px] flex flex-col items-center gap-0.5 transition",
                    locked && "opacity-50",
                    isActive
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background/60 border-border hover:bg-foreground/5"
                  )}
                >
                  <span className="text-lg leading-none">
                    {locked ? <Lock className="h-3.5 w-3.5" /> : s.emoji}
                  </span>
                  <span className="leading-tight">{s.label}</span>
                </button>
              );
            })}
          </div>

          {isPremium && (
            <div className="rounded-xl border border-dashed border-border/60 p-2.5 text-[11px] text-muted-foreground space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <Layers className="h-3 w-3" />
                  Custom mix {mix.length > 0 && <>· {mix.length} layered</>}
                </span>
                {mix.length > 0 && (
                  <button onClick={clearMix} className="hover:text-foreground transition">
                    Clear
                  </button>
                )}
              </div>
              <p className="leading-relaxed">
                Tap multiple scenes to layer them. The first tap selects, the next adds to the mix.
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              className="rounded-full gap-1.5 flex-1"
              onClick={() => {
                togglePlay();
              }}
            >
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {playing ? "Pause" : "Play"}
            </Button>
            <button
              onClick={toggleMute}
              className="grid h-8 w-8 place-items-center rounded-full border border-border/60 bg-background/60 hover:bg-foreground/5 transition"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="flex-1 accent-foreground"
              aria-label="Volume"
            />
          </div>

          {!isPremium && (
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              <Lock className="inline h-2.5 w-2.5 mr-1" />
              Free includes Silence, Rain & Fireplace. Premium unlocks the full library, mood
              auto-sync and custom mixes.
            </p>
          )}
        </div>
      )}

      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full border border-border/60 bg-background/95 backdrop-blur px-3 py-2 shadow-md hover:shadow-lg transition"
        >
          <span
            className={cn(
              "grid h-7 w-7 place-items-center rounded-full text-sm",
              playing && !muted && effectiveScenes[0] !== "silence"
                ? "bg-foreground text-background"
                : "bg-foreground/10"
            )}
          >
            {activeEmoji}
          </span>
          <span className="text-xs leading-tight text-left">
            <span className="block font-medium">{activeLabel}</span>
            <span className="block text-[10px] text-muted-foreground">
              {playing && effectiveScenes[0] !== "silence" ? "playing" : "paused"}
            </span>
          </span>
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (effectiveScenes[0] === "silence" && !playing) {
                setScene("rain");
              }
              setPlaying(!playing);
            }}
            className="ml-1 grid h-7 w-7 place-items-center rounded-full bg-foreground text-background"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
        </button>
      )}
    </div>
  );
}