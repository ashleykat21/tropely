import { cn } from "@/lib/utils";

export function BookCover({
  src,
  title,
  className,
}: {
  src?: string;
  title: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative aspect-[2/3] overflow-hidden rounded-md shadow-book bg-mood-soft",
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt={`Cover of ${title}`}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center p-3 text-center">
          <span className="font-display text-base text-mood-ink">{title}</span>
        </div>
      )}
      {/* page-edge highlight */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-r from-black/25 to-transparent" />
    </div>
  );
}
