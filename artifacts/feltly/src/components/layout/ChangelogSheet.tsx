import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useLibrary } from "@/lib/store";
import { CHANGELOG, groupChangelog } from "@/lib/changelog";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function ChangelogSheet({ open, onOpenChange }: Props) {
  const setLastChangelogReadAt = useLibrary((s) => s.setLastChangelogReadAt);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setLastChangelogReadAt(Date.now());
    }
  }, [open, setLastChangelogReadAt]);

  const groups = groupChangelog(CHANGELOG);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md flex flex-col gap-0 p-0 overflow-hidden">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/40 shrink-0">
          <SheetTitle className="font-display text-2xl">What's new</SheetTitle>
          <p className="text-sm text-muted-foreground mt-0.5">
            The latest features shipped in Tropely.
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">
          {groups.map((group, gi) => (
            <section key={group.label}>
              <h3
                className={cn(
                  "text-xs font-semibold uppercase tracking-widest mb-4",
                  gi === 0 ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {group.label}
              </h3>
              <ul className="space-y-5">
                {group.entries.map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-2xl border border-border/40 bg-card/60 p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="font-medium text-sm leading-snug">{entry.title}</h4>
                      <time
                        dateTime={entry.date}
                        className="text-[11px] text-muted-foreground shrink-0 mt-0.5"
                      >
                        {formatDate(entry.date)}
                      </time>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{entry.body}</p>
                    {entry.cta && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full text-xs gap-1 mt-1"
                        onClick={() => {
                          onOpenChange(false);
                          navigate(entry.cta!.href);
                        }}
                      >
                        {entry.cta.label}
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
