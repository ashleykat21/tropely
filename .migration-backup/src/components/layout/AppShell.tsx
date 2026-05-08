import { ReactNode, useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { BookHeart, Home, Compass, Users, BarChart3, User, Sparkles, NotebookPen } from "lucide-react";
import { useLibrary } from "@/lib/store";
import { applyMood } from "@/lib/moods";
import { AddBookDialog } from "@/components/reader/AddBookDialog";
import { cn } from "@/lib/utils";
import { MoodQuiz } from "@/components/onboarding/MoodQuiz";
import { useAuth } from "@/lib/auth";
import { NotificationsBell } from "./NotificationsBell";
import { GlobalSearch } from "./GlobalSearch";
import { OfflineIndicator } from "./OfflineIndicator";
import { ScenePlayer } from "@/components/scene/ScenePlayer";
import { useLocale } from "@/lib/i18n";
import { computeBadges, topEarnedBadge } from "@/lib/badges";

const NAV = [
  { to: "/", key: "nav.home", icon: Home },
  { to: "/discover", key: "nav.discover", icon: Compass },
  { to: "/companion", key: "nav.ai", icon: Sparkles },
  { to: "/social", key: "nav.social", icon: Users },
  { to: "/insights", key: "nav.insights", icon: BarChart3 },
  { to: "/profile", key: "nav.you", icon: User },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { books, currentId, hasOnboarded, sessions, reactionLog, reflections, journal, showBadgeFlair } = useLibrary();
  const { user } = useAuth();
  const { t } = useLocale();
  const [quizOpen, setQuizOpen] = useState(false);
  const topBadge = showBadgeFlair
    ? topEarnedBadge(computeBadges({ books, sessions, reactionLog, reflections, journal }))
    : null;
  const current =
    books.find((b) => b.id === currentId) ??
    books.find((b) => b.shelf === "reading") ??
    books[0];

  useEffect(() => {
    if (current) applyMood(current.mood);
  }, [current?.mood]);

  useEffect(() => {
    if (user && !hasOnboarded) {
      const t = setTimeout(() => setQuizOpen(true), 400);
      return () => clearTimeout(t);
    }
  }, [user, hasOnboarded]);

  const { pathname } = useLocation();

  return (
    <main className="min-h-screen pb-24 sm:pb-10">
      <header className="border-b border-border/40 bg-background/40 backdrop-blur sticky top-0 z-20">
        <div className="container flex items-center justify-between py-4">
          <NavLink to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-foreground text-background">
              <BookHeart className="h-4 w-4" />
            </div>
            <div>
              <div className="font-display text-lg leading-none">Feltly</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {t("common.read_by_emotion")}
              </div>
            </div>
          </NavLink>

          <nav className="hidden sm:flex items-center gap-1 rounded-full border border-border/60 bg-card/70 backdrop-blur p-1">
            {NAV.map((n) => {
              const active = pathname === n.to;
              const isProfile = n.to === "/profile";
              return (
                <NavLink
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-sm transition flex items-center gap-1.5",
                    active
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="relative inline-flex">
                    <n.icon className="h-3.5 w-3.5" />
                    {isProfile && topBadge && (
                      <span
                        title={topBadge.label}
                        className="absolute -top-2 -right-2 text-[10px] leading-none"
                      >
                        {topBadge.emoji}
                      </span>
                    )}
                  </span>
                  {t(n.key)}
                </NavLink>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <OfflineIndicator />
            <NavLink
              to="/journal"
              title={t("nav.journal")}
              className={({ isActive }) =>
                cn(
                  "hidden sm:inline-grid h-9 w-9 place-items-center rounded-full border border-border/60 bg-card/70 backdrop-blur transition",
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              <NotebookPen className="h-4 w-4" />
            </NavLink>
            <GlobalSearch />
            <NotificationsBell />
            <AddBookDialog />
          </div>
        </div>
      </header>

      <div className="container py-8 sm:py-10">{children}</div>

      <nav
        aria-label="Primary"
        className="sm:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border/60 bg-background/85 backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="grid grid-cols-6">
          {NAV.map((n) => {
            const active = pathname === n.to;
            const isProfile = n.to === "/profile";
            return (
              <li key={n.to}>
                <NavLink
                  to={n.to}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px]",
                    active ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  <span className="relative inline-flex">
                    <n.icon
                      className={cn("h-5 w-5 transition", active && "scale-110")}
                      style={active ? { color: "var(--mood-strong)" } : undefined}
                    />
                    {isProfile && topBadge && (
                      <span
                        title={topBadge.label}
                        className="absolute -top-1.5 -right-2 text-[11px] leading-none"
                      >
                        {topBadge.emoji}
                      </span>
                    )}
                  </span>
                  {t(n.key)}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <MoodQuiz open={quizOpen} onComplete={() => setQuizOpen(false)} />
      <ScenePlayer />
    </main>
  );
}