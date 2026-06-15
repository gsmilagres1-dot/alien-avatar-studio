import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Volume2, VolumeX, Music } from "lucide-react";

// Royalty-free instrumental tracks (stable public URLs).
// "adventure" plays before the journey starts; "stars" plays during the quiz.
const TRACKS = {
  adventure: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  stars: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
} as const;

type TrackKey = keyof typeof TRACKS;

const STORAGE_KEY = "soundtrack:muted";

export function Soundtrack() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(true);
  const [started, setStarted] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    setMuted(window.localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  // Pick the active track based on the current route.
  const track: TrackKey = pathname.startsWith("/galaxia") ? "stars" : "adventure";

  // Switch source when the track changes.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const next = TRACKS[track];
    if (el.src !== next) {
      el.src = next;
      el.loop = true;
      el.volume = 0.35;
      if (!muted && started) {
        el.play().catch(() => {});
      }
    }
  }, [track, muted, started]);

  // Persist mute and apply to element.
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, muted ? "1" : "0");
    }
    const el = audioRef.current;
    if (!el) return;
    el.muted = muted;
    if (!muted && started) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [muted, started]);

  // Browsers block autoplay until a user gesture — start on first interaction.
  useEffect(() => {
    if (started) return;
    const start = () => {
      setStarted(true);
      const el = audioRef.current;
      if (el && !muted) {
        el.play().catch(() => {});
      }
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
    };
    window.addEventListener("pointerdown", start, { once: true });
    window.addEventListener("keydown", start, { once: true });
    return () => {
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
    };
  }, [started, muted]);

  return (
    <>
      <audio ref={audioRef} preload="none" />
      <button
        type="button"
        suppressHydrationWarning
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? "Ativar trilha sonora" : "Silenciar trilha sonora"}
        title={muted ? "Ativar trilha sonora" : "Silenciar trilha sonora"}
        className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full glass border border-white/10 px-3 py-2 text-xs text-foreground shadow-lg backdrop-blur hover:bg-white/10 transition"
      >
        {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-accent" />}
        <Music className="w-3.5 h-3.5 opacity-70" />
        <span className="font-mono uppercase tracking-widest">
          {hydrated && track === "stars" ? "Estrelas" : "Aventura"}
        </span>
      </button>
    </>
  );
}
