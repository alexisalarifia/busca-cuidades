import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTrip } from "@/lib/trip";
import { CDMX_TZ } from "@/lib/geocode";
import { formatDay, formatTime, todayInTz } from "@/lib/time";
import type { Item } from "@/lib/types";

export default async function Today() {
  const supabase = await createClient();
  const trip = await getActiveTrip(supabase);

  const { data } = await supabase
    .from("items")
    .select("*")
    .eq("trip_id", trip!.id)
    .not("starts_at", "is", null)
    .order("starts_at", { ascending: true });

  const items = ((data as Item[]) ?? []).filter((item) => {
    const tz = item.venue_tz ?? CDMX_TZ;
    return (
      new Date(item.starts_at!).toLocaleDateString("sv-SE", { timeZone: tz }) ===
      todayInTz(tz)
    );
  });

  return (
    <main className="flex flex-col gap-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {formatDay(new Date().toISOString(), CDMX_TZ)}
          </h1>
          <p className="text-sm text-ink/60">{trip!.name}</p>
        </div>
        <Link href="/settings" aria-label="Settings" className="p-1 text-ink/50">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.09a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.09a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z" />
          </svg>
        </Link>
      </header>

      {items.length === 0 ? (
        <p className="text-ink/60">
          Nothing scheduled today. Tap + when a booking comes in.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="radius-token shadow-hard border border-ink/10 bg-white p-4"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold">{item.title}</span>
                <span className="tnum text-sm text-ink/60">
                  {formatTime(item.starts_at!, item.venue_tz ?? CDMX_TZ)}
                </span>
              </div>
              <p className="tnum mt-1 text-xs text-ink/50">{item.display_id}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
