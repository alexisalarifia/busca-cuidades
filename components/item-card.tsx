"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Category, Item } from "@/lib/types";
import { CDMX_TZ } from "@/lib/geocode";
import { formatTime } from "@/lib/time";
import { toggleVisited } from "@/app/(tabs)/today/actions";

const CATEGORY_VAR: Record<Category, string> = {
  flight: "--c-flight",
  ticket: "--c-ticket",
  accommodation: "--c-accommodation",
  dining: "--c-dining",
  excursion: "--c-excursion",
  transport: "--c-transport",
  note: "--c-note",
};

interface Props {
  item: Item;
  emphasized?: boolean;
}

// Shared card for Today and Itinerary: category tick, display ID, venue-tz
// time, and quick actions (visited, Add to Calendar, open pin).
export default function ItemCard({ item, emphasized }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [justVisited, setJustVisited] = useState(false);
  const tz = item.venue_tz ?? CDMX_TZ;

  return (
    <div
      className={`radius-token relative border bg-white p-4 ${
        emphasized ? "shadow-hard border-ink/20" : "border-ink/10"
      }`}
    >
      <span
        className="absolute left-0 top-0 h-full w-1.5 rounded-l-[var(--radius)]"
        style={{ background: `var(${CATEGORY_VAR[item.category]})` }}
        aria-hidden
      />
      <div className="flex items-baseline justify-between gap-3 pl-2">
        <span className={`font-semibold ${emphasized ? "text-lg" : ""}`}>
          {item.title}
        </span>
        {item.starts_at && (
          <span className="tnum shrink-0 text-sm text-ink/60">
            {formatTime(item.starts_at, tz)}
          </span>
        )}
      </div>
      <p className="tnum mt-1 pl-2 text-xs text-ink/50">
        {item.display_id}
        {item.visited && " · visited"}
      </p>
      {emphasized && item.notes && (
        <p className="mt-2 pl-2 text-sm text-ink/70">{item.notes}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3 pl-2 text-sm">
        <button
          disabled={pending}
          onClick={() => {
            if (!item.visited) {
              setJustVisited(true);
              setTimeout(() => setJustVisited(false), 260);
            }
            startTransition(async () => {
              await toggleVisited(item.id, !item.visited);
              router.refresh();
            });
          }}
          className={`tap radius-token px-3 py-1.5 text-xs font-semibold ${
            justVisited ? "anim-pop" : ""
          } ${item.visited ? "bg-ink text-paper" : "border border-ink/20"}`}
        >
          {item.visited ? "Visited ✓" : "Mark visited"}
        </button>
        {item.starts_at && (
          <a
            href={`/api/ics/${item.id}`}
            className="tap text-xs underline underline-offset-2"
          >
            Add to Calendar
          </a>
        )}
        {item.lat != null && item.lng != null && (
          <a
            href={`https://maps.apple.com/?daddr=${item.lat},${item.lng}`}
            target="_blank"
            rel="noreferrer"
            className="tap text-xs text-ink/60 underline underline-offset-2"
          >
            Directions
          </a>
        )}
      </div>
    </div>
  );
}
