import type { DayPhoto } from "@/lib/photos-by-day";

interface Props {
  photos: DayPhoto[];
}

// A day's photos, inline where that day lives. Scrolls sideways so a heavy
// day doesn't push the itinerary around.
export default function PhotoStrip({ photos }: Props) {
  if (photos.length === 0) return null;

  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {photos.map((p) => (
        <a
          key={p.id}
          href={p.url}
          target="_blank"
          rel="noreferrer"
          className="tap radius-token block h-16 w-16 shrink-0 overflow-hidden border border-ink/10 bg-white"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.url}
            alt={p.caption ?? ""}
            className="h-full w-full object-cover"
          />
        </a>
      ))}
    </div>
  );
}
