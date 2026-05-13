import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home, Compass, Users, BarChart3, User, Sparkles, NotebookPen, Flame, MessageSquare, PenLine, Snowflake, BookPlus, MoreHorizontal, Layers, Heart, Crown, Calendar, Newspaper, MessageSquarePlus, Library } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { useLibrary } from "@/lib/store";
import { applyMood } from "@/lib/moods";
import { AddBookDialog } from "@/components/reader/AddBookDialog";
import { cn } from "@/lib/utils";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { useAuth } from "@/lib/auth";
import { NotificationsBell } from "./NotificationsBell";
import { GlobalSearch } from "./GlobalSearch";
import { OfflineIndicator } from "./OfflineIndicator";
import { UpgradePrompt } from "@/components/premium/UpgradePrompt";
import { usePremium } from "@/lib/usePremium";
import { useLocale } from "@/lib/i18n";
import { computeChapters, topUnlockedChapter } from "@/lib/chapters";
import { computeStreak } from "@/lib/streak";
import { MessagesPanel } from "@/components/social/MessagesPanel";
import { QuickLogSheet } from "@/components/reader/QuickLogSheet";
import { subscribePending } from "@/lib/offlineQueue";
import { ChangelogSheet } from "./ChangelogSheet";
import { FeedbackSheet } from "@/components/feedback/FeedbackSheet";
import { CHANGELOG } from "@/lib/changelog";
import { toast } from "sonner";

const NAV = [
  { to: "/", key: "nav.home", icon: Home },
  { to: "/library", key: "nav.library", icon: Library },
  { to: "/discover", key: "nav.discover", icon: Compass },
  { to: "/journal", key: "nav.journal", icon: NotebookPen },
  { to: "/profile", key: "nav.you", icon: User },
];

// Mobile bottom nav — 5 native tabs, no overflow menu.
const MOBILE_PRIMARY = [
  { to: "/", key: "nav.home", icon: Home },
  { to: "/library", key: "nav.library", icon: Library },
  { to: "/journal", key: "nav.journal", icon: NotebookPen },
  { to: "/discover", key: "nav.discover", icon: Compass },
  { to: "/profile", key: "nav.you", icon: User },
];

const MOBILE_MORE: { to: string; key: string; icon: typeof Home }[] = [
  { to: "/buddy-reads", key: "nav.buddy", icon: Users },
  { to: "/twins", key: "nav.twins", icon: Heart },
  { to: "/social", key: "nav.social", icon: Users },
  { to: "/companion", key: "nav.ai", icon: Sparkles },
  { to: "/insights", key: "nav.insights", icon: BarChart3 },
  { to: "/tropes", key: "nav.tropes", icon: Layers },
  { to: "/wrap", key: "nav.wrap", icon: Calendar },
  { to: "/premium", key: "nav.premium", icon: Crown },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { books, currentId, hasOnboarded, sessions, reactionLog, reflections, journal, showBadgeFlair } = useLibrary();
  const readingFontScale = useLibrary((s) => s.readingFontScale);
  const readingDensity = useLibrary((s) => s.readingDensity);

  useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty("--read-scale", String(readingFontScale ?? 1));
    r.dataset.density = readingDensity ?? "default";
  }, [readingFontScale, readingDensity]);

  const hasSeenWalkthrough = useLibrary((s) => s.hasSeenWalkthrough);
  const { user } = useAuth();
  const { t } = useLocale();
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [onboardingStartAt, setOnboardingStartAt] = useState(0);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [pendingQuickLog, setPendingQuickLog] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setQuickLogOpen(true);
    window.addEventListener("feltly:open-quick-log", handler);
    return () => window.removeEventListener("feltly:open-quick-log", handler);
  }, []);

  // When the quick-log sheet was waiting on the user to pick a book,
  // reopen it as soon as a current book is set.
  const hasCurrentBook = !!(
    books.find((b) => b.id === currentId) ??
    books.find((b) => b.shelf === "reading")
  );
  useEffect(() => {
    if (pendingQuickLog && hasCurrentBook) {
      setPendingQuickLog(false);
      setQuickLogOpen(true);
    }
  }, [pendingQuickLog, hasCurrentBook]);

  const handlePickBookForLog = () => {
    setQuickLogOpen(false);
    setPendingQuickLog(true);
    navigate("/");
  };

  useEffect(() => {
    return subscribePending(setPendingCount);
  }, []);
  const lastChangelogReadAt = useLibrary((s) => s.lastChangelogReadAt);
  const unseenChangelog = useMemo(() => {
    const readAt = lastChangelogReadAt ?? 0;
    return CHANGELOG.filter(
      (e) => new Date(e.date + "T00:00:00").getTime() > readAt
    ).length;
  }, [lastChangelogReadAt]);
  const isPremium = usePremium((s) => s.isPremium);
  const hasSeenUpgradePrompt = usePremium((s) => s.hasSeenUpgradePrompt);
  const _chapters = showBadgeFlair && isPremium
    ? computeChapters({ books, sessions, reactionLog, reflections, journal })
    : null;
  const topChapter = _chapters ? topUnlockedChapter(_chapters) : null;
  const freeze = useLibrary((s) => s.freeze);
  const streak = useMemo(() => computeStreak(sessions, freeze), [sessions, freeze]);
  const current =
    books.find((b) => b.id === currentId) ??
    books.find((b) => b.shelf === "reading") ??
    books[0];

  useEffect(() => {
    if (!current) return;
    applyMood(current.mood);
  }, [current?.mood]);

  // Open onboarding for new users (full flow from step 0).
  useEffect(() => {
    if (!hasOnboarded) {
      const id = setTimeout(() => {
        setOnboardingStartAt(0);
        setOnboardingOpen(true);
      }, 400);
      return () => clearTimeout(id);
    }
    // Already onboarded but hasn't seen the tour — open at the tour section.
    if (hasOnboarded && !hasSeenWalkthrough) {
      const id = setTimeout(() => {
        setOnboardingStartAt(7);
        setOnboardingOpen(true);
      }, 600);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [hasOnboarded, hasSeenWalkthrough]);

  // Allow other parts of the app to reopen the tour via a custom event.
  useEffect(() => {
    const handler = () => {
      setOnboardingStartAt(7);
      setOnboardingOpen(true);
    };
    window.addEventListener("feltly:open-walkthrough", handler);
    return () => window.removeEventListener("feltly:open-walkthrough", handler);
  }, []);

  // Show upgrade prompt after 3rd book added or 1st session logged (free users only)
  useEffect(() => {
    if (!user || isPremium || hasSeenUpgradePrompt) return;
    const triggered = books.length >= 3 || sessions.length >= 1;
    if (!triggered) return;
    const id = setTimeout(() => setUpgradeOpen(true), 900);
    return () => clearTimeout(id);
  }, [user, isPremium, hasSeenUpgradePrompt, books.length, sessions.length]);

  const { pathname, search } = useLocation();

  const changelogNotifyFiredRef = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get("changelog") === "1") {
      setChangelogOpen(true);
      const next = new URL(window.location.href);
      next.searchParams.delete("changelog");
      window.history.replaceState({}, "", next.pathname + (next.search || ""));
    }
  }, [search]);

  // Changelog auto-toast disabled — users can tap "What's new" from the More sheet.

  return (
    <main className="min-h-screen pb-24 sm:pb-10">
      <header className="border-b border-border/40 bg-background/40 backdrop-blur sticky top-0 z-20 h-12 sm:h-14">
        <div className="container flex items-center justify-between h-full">
          <NavLink to="/" className="flex items-center justify-center h-full py-1.5 px-2">
            <span className="font-display text-lg tracking-tight">Tropely</span>
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
                    {isProfile && topChapter && (
                      <span
                        title={topChapter.title}
                        className="absolute -top-2 -right-2 text-[10px] leading-none"
                      >
                        {topChapter.emoji}
                      </span>
                    )}
                  </span>
                  {t(n.key)}
                </NavLink>
              );
            })}
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm transition flex items-center gap-1.5",
                MOBILE_MORE.some((m) => m.to === pathname)
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
              {t("nav.more")}
            </button>
          </nav>

          <div className="flex items-center gap-2">
            <OfflineIndicator />
            {streak.current > 0 && (
              <NavLink
                to="/"
                title={`${streak.current}-day reading streak${isPremium && streak.freezesAvailable > 0 ? ` · ${streak.freezesAvailable} freeze${streak.freezesAvailable === 1 ? "" : "s"} available` : ""}`}
                className="hidden sm:inline-flex items-center gap-1 rounded-full border border-border/60 bg-card/70 backdrop-blur px-2.5 py-1 text-xs font-medium text-foreground transition hover:bg-foreground/5"
              >
                <Flame className="h-3.5 w-3.5" style={{ color: "var(--mood-strong)" }} />
                {streak.current}
                {isPremium && streak.freezesAvailable > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-sky-600">
                    <Snowflake className="h-3 w-3" />
                    {streak.freezesAvailable}
                  </span>
                )}
              </NavLink>
            )}
            <NavLink
              to="/journal"
              title={t("nav.journal")}
              className={({ isActive }) =>
                cn(
                  "inline-grid h-9 w-9 place-items-center rounded-full border border-border/60 bg-card/70 backdrop-blur transition",
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              <NotebookPen className="h-4 w-4" />
            </NavLink>
            <button
              title="Messages"
              onClick={() => setMessagesOpen(true)}
              className="inline-grid h-9 w-9 place-items-center rounded-full border border-border/60 bg-card/70 backdrop-blur transition text-muted-foreground hover:text-foreground"
            >
              <MessageSquare className="h-4 w-4" />
            </button>
            <NavLink
              to="/social"
              title={t("nav.social")}
              className={({ isActive }) =>
                cn(
                  "inline-grid h-9 w-9 place-items-center rounded-full border border-border/60 bg-card/70 backdrop-blur transition",
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              <Users className="h-4 w-4" />
            </NavLink>
            <button
              onClick={() => setQuickLogOpen(true)}
              title="Log a reading session"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-foreground text-background px-3 py-1.5 text-xs font-medium transition hover:opacity-90"
            >
              <BookPlus className="h-3.5 w-3.5" />
              <span>Log session</span>
            </button>
            <button
              title="What's new"
              onClick={() => setChangelogOpen(true)}
              className="relative inline-grid h-9 w-9 place-items-center rounded-full border border-border/60 bg-card/70 backdrop-blur transition text-muted-foreground hover:text-foreground"
            >
              <Newspaper className="h-4 w-4" />
              {unseenChangelog > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[var(--mood-strong)] ring-2 ring-background" />
              )}
            </button>
            <GlobalSearch />
            <NotificationsBell />
            <AddBookDialog />
          </div>
        </div>
      </header>

      {pathname !== "/journal" && (
        <NavLink
          to="/journal"
          className="block border-b border-border/30 bg-card/40 backdrop-blur hover:bg-card/60 transition"
        >
          <div className="container flex items-center gap-3 py-1.5">
            <PenLine className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-xs sm:text-sm text-muted-foreground truncate">
              What moved you today? Write a note, quote, or reflection&hellip;
            </span>
          </div>
        </NavLink>
      )}

      <div className="container py-3 sm:py-6">{children}</div>

      <button
        onClick={() => setQuickLogOpen(true)}
        aria-label="Log a reading session"
        className="sm:hidden fixed right-4 z-40 inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-4 py-3 text-sm font-medium shadow-lg shadow-black/20 transition active:scale-95"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 72px)" }}
      >
        <BookPlus className="h-4 w-4" />
        <span>Log</span>
      </button>

      {/* ── Native mobile bottom tab bar ── */}
      <nav
        aria-label="Primary"
        className="sm:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border/60 bg-background/90 backdrop-blur-md"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="grid grid-cols-5">
          {MOBILE_PRIMARY.map((n) => {
            const active = pathname === n.to;
            const isProfile = n.to === "/profile";
            return (
              <li key={n.to}>
                <NavLink
                  to={n.to}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 py-3 text-[11px] font-medium w-full min-h-[60px] transition-colors",
                    active ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  <span className="relative inline-flex">
                    <n.icon
                      className={cn("h-6 w-6 transition-transform", active && "scale-110")}
                      style={active ? { color: "var(--mood-strong)" } : undefined}
                    />
                    {n.to === "/" && streak.current > 0 && (
                      <span className="absolute -top-1.5 -right-3 inline-flex items-center gap-0.5 rounded-full bg-foreground text-background text-[8px] font-bold leading-none px-1 py-0.5">
                        <Flame className="h-2 w-2" />
                        {streak.current}
                      </span>
                    )}
                    {isProfile && topChapter && (
                      <span
                        title={topChapter.title}
                        className="absolute -top-1.5 -right-2 text-[11px] leading-none"
                      >
                        {topChapter.emoji}
                      </span>
                    )}
                    {isProfile && unseenChangelog > 0 && !topChapter && (
                      <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[var(--mood-strong)] ring-2 ring-background" />
                    )}
                  </span>
                  {t(n.key)}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <OnboardingFlow
        open={onboardingOpen}
        startAt={onboardingStartAt}
        onComplete={() => setOnboardingOpen(false)}
      />
      <UpgradePrompt open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
      <MessagesPanel open={messagesOpen} onClose={() => setMessagesOpen(false)} />
      <QuickLogSheet
        open={quickLogOpen}
        onOpenChange={setQuickLogOpen}
        onPickBook={handlePickBookForLog}
      />
      <ChangelogSheet open={changelogOpen} onOpenChange={setChangelogOpen} />
      <FeedbackSheet open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </main>
  );
}