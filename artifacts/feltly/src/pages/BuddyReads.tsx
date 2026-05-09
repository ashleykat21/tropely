import { Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { BuddyReads } from "@/components/social/BuddyReads";

export default function BuddyReadsPage() {
  return (
    <AppShell>
      <div className="space-y-8 max-w-4xl">
        <header className="space-y-2 animate-fade-up">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-1.5">
            <Users className="h-3 w-3" /> Social
          </p>
          <h1 className="font-display text-4xl sm:text-5xl leading-[1.05]">
            Buddy{" "}
            <span className="italic" style={{ color: "var(--mood-strong)" }}>
              Reads
            </span>
            .
          </h1>
          <p className="text-muted-foreground max-w-md">
            Create a room, sync your pages, and chat without spoilers — free readers get 1 room with up to 3 members; premium readers get unlimited.
          </p>
        </header>

        <BuddyReads />
      </div>
    </AppShell>
  );
}
