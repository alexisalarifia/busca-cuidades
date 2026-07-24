import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTrip } from "@/lib/trip";
import { CDMX_TZ } from "@/lib/geocode";
import { formatDay, formatTime, todayInTz } from "@/lib/time";
import { getTripPhase } from "@/lib/trip-phase";
import type { Item } from "@/lib/types";
import ItemCard from "@/components/item-card";
import TripProgress from "@/components/trip-progress";

export default async function Today() {
  const supabase = await createClient();
  const trip = await getActiveTrip(supabase);
  const phase = getTripPhase(trip!);

  const { data } = await supabase
    .from("items")
    .select("*")
    .eq("trip_id", trip!.id)
    .order("starts_at", { ascending: true });

  const all = (data as Item[]) ?? [];
  const timed = all.filter((i) => i.starts_at);

  const items = timed.filter((item) => {
    const tz = item.venue_tz ?? CDMX_TZ;
    return (
      new Date(item.starts_at!).toLocaleDateString("sv-SE", { timeZone: tz }) ===
      todayInTz(tz)
    );
  });

  const now = Date.now();
  const nextIdx = items.findIndex((i) => new Date(i.starts_at!).getTime() >= now);
  const nextUp = nextIdx >= 0 ? items[nextIdx] : null;

  // Next thing anywhere in the trip — what to show when today is empty.
  const nextAnywhere = timed.find((i) => new Date(i.starts_at!).getTime() >= now);

  return (
    <main className="flex flex-col gap-5">
      <header className="anim-in flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">
            {phase.label}
          </p>
          <h1 className="text-2xl font-bold tracking-tight">
            {formatDay(new Date().toISOString(), CDMX_TZ)}
          </h1>
        </div>
        <Link
          href="/settings"
          aria-label="Settings"
          className="tap p-1 text-ink/50"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.09a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.09a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z" />
          </svg>
        </Link>
      </header>

      {items.length > 0 ? (
        <ul className="stagger flex flex-col gap-3">
          {items.map((item, i) => (
            <li key={item.id}>
              {i === nextIdx && (
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">
                  Next up
                </p>
              )}
              <ItemCard item={item} emphasized={i === nextIdx} />
            </li>
          ))}
        </ul>
      ) : (
        // Empty today is the common case (most days have no booking). Make it
        // useful instead of a dead end.
        <section className="anim-in radius-token border border-ink/10 bg-white p-4">
          <p className="font-medium">
            {phase.phase === "before"
              ? "Nothing booked for today — the trip hasn't started."
              : phase.phase === "after"
                ? "The trip is done."
                : "Nothing scheduled today. The day is yours."}
          </p>
          {nextAnywhere ? (
            <p className="tnum mt-2 text-sm text-ink/60">
              Next: {nextAnywhere.title} ·{" "}
              {formatDay(nextAnywhere.starts_at!, nextAnywhere.venue_tz ?? CDMX_TZ)},{" "}
              {formatTime(nextAnywhere.starts_at!, nextAnywhere.venue_tz ?? CDMX_TZ)}
            </p>
          ) : (
            <p className="mt-2 text-sm text-ink/60">
              Tap + to paste a booking, or open the map to see your saved places.
            </p>
          )}
        </section>
      )}

      {nextUp && items.length > 0 && (
        <p className="tnum text-xs text-ink/40">
          {items.length} today · next at{" "}
          {formatTime(nextUp.starts_at!, nextUp.venue_tz ?? CDMX_TZ)}
        </p>
      )}

      <TripProgress items={all} />
    </main>
  );
}
