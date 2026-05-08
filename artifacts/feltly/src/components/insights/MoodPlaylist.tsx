import { useLibrary } from "@/lib/store";
import { MOODS, type MoodKey } from "@/lib/moods";
import { LockedFeature } from "@/components/premium/LockedFeature";
import { Music2, ExternalLink } from "lucide-react";

const PLAYLISTS: Record<MoodKey, {
  name: string;
  description: string;
  spotifyUrl: string;
  appleMusicUrl: string;
}> = {
  calm: {
    name: "Still Waters",
    description: "Soft piano, ambient pads, ocean-distant minimalism",
    spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DX4PP3DA4J0N8",
    appleMusicUrl: "https://music.apple.com/us/playlist/peaceful-piano/pl.f4d106fed2bd41149ecdac8f65d0ce59",
  },
  cozy: {
    name: "Fireside Pages",
    description: "Warm acoustic, lo-fi hip-hop, coffee-shop ambiance",
    spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DWTwnEm8PTgKG",
    appleMusicUrl: "https://music.apple.com/us/playlist/a-cozy-afternoon/pl.6e63c37ea9154e5999adbc8d91b2af30",
  },
  melancholy: {
    name: "Rain on Windows",
    description: "Cinematic strings, atmospheric indie, bittersweet ballads",
    spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DX3YSRoSdA634",
    appleMusicUrl: "https://music.apple.com/us/playlist/melancholy-mood/pl.8a978c2c8e3c4c86866ab7e54a8f6f5e",
  },
  intense: {
    name: "Tension Arc",
    description: "Driving orchestral, post-rock climaxes, kinetic energy",
    spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DX7KNKjOK0o75",
    appleMusicUrl: "https://music.apple.com/us/playlist/intense-studying/pl.18d98d5ef7c44b9aaa8a1e5f0cc0c148",
  },
  dreamy: {
    name: "Between Worlds",
    description: "Ethereal vocals, reverb-washed synths, soft dreamscapes",
    spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DX6xZZEgC9Ubl",
    appleMusicUrl: "https://music.apple.com/us/playlist/dreamy/pl.f4d106fed2bd41149ecdac8f65d0c2f3",
  },
  joyful: {
    name: "Sun Through the Pages",
    description: "Upbeat folk, indie pop, feel-good rhythms",
    spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DWU0ScTcjJBdj",
    appleMusicUrl: "https://music.apple.com/us/playlist/feel-good-indie-rock/pl.92ba4e3c7d264e4bbc47a2099e3c24b2",
  },
  mysterious: {
    name: "The Unlit Hall",
    description: "Dark ambient, noir jazz undertones, unsettling quiet",
    spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DX5trt9i14X7j",
    appleMusicUrl: "https://music.apple.com/us/playlist/dark-ambient/pl.e267a028e3c54a04b1b25dab5eb5e4d4",
  },
};

export function MoodPlaylist() {
  const books = useLibrary((s) => s.books);
  const currentId = useLibrary((s) => s.currentId);
  const current = books.find((b) => b.id === currentId) ?? books.find((b) => b.shelf === "reading");

  if (!current) return null;

  const mood = current.mood;
  const playlist = PLAYLISTS[mood];
  const m = MOODS[mood];

  return (
    <LockedFeature
      title="Mood Playlist"
      description="Get curated playlists matched to your book's emotional mood. Upgrade to unlock."
    >
      <section
        className="rounded-2xl border p-5 space-y-4"
        style={{
          background: `hsl(${m.h} ${m.s}% ${m.l}% / 0.07)`,
          borderColor: `hsl(${m.h} ${m.s}% ${m.l}% / 0.25)`,
        }}
      >
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Music2 className="h-4 w-4" style={{ color: `hsl(${m.h} ${m.s}% ${m.l}%)` }} />
            <h3 className="font-display text-xl">Mood Playlist</h3>
          </div>
          <span className="text-xs text-muted-foreground">{m.emoji} matched to {current.title}</span>
        </div>
        <div>
          <div className="font-display text-2xl leading-tight">{playlist.name}</div>
          <div className="text-sm text-muted-foreground mt-1">{playlist.description}</div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <a
            href={playlist.spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs hover:bg-background transition"
          >
            <ExternalLink className="h-3 w-3" /> Open on Spotify
          </a>
          <a
            href={playlist.appleMusicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs hover:bg-background transition"
          >
            <ExternalLink className="h-3 w-3" /> Apple Music
          </a>
        </div>
      </section>
    </LockedFeature>
  );
}
