import { useEffect } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useLibrary } from "./store";

type FinishedDetail = { bookId: string; bookTitle: string; finishedAt: number };

export function useCompanionFinishedToast() {
  const navigate = useNavigate();
  const markShown = useLibrary((s) => s.markCompanionFinishedToastShown);

  useEffect(() => {
    const handler = (e: Event) => {
      const { bookId, bookTitle, finishedAt } = (e as CustomEvent<FinishedDetail>).detail;

      // Stable dedupe key comes directly from the event payload — no state lookup needed.
      const key = `${bookId}:${finishedAt}`;

      const state = useLibrary.getState();
      if (state.companionFinishedToastsShown.includes(key)) return;

      markShown(key);

      toast(
        `I'll remember our chats about ${bookTitle}. They'll come up if you re-read or pick up the sequel.`,
        {
          duration: 8000,
          action: {
            label: "Open",
            onClick: () => {
              // Switch the active book so Companion opens on the right one.
              useLibrary.getState().setCurrent(bookId);
              navigate("/companion");
            },
          },
        }
      );
    };

    window.addEventListener("feltly:companion-memory-finished", handler);
    return () => window.removeEventListener("feltly:companion-memory-finished", handler);
  }, [navigate, markShown]);
}
