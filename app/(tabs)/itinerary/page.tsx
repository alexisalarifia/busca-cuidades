import { createClient } from "@/lib/supabase/server";
import { getActiveTrip } from "@/lib/trip";
import { CDMX_TZ } from "@/lib/geocode";
import type { Item } from "@/lib/types";
import ItemCard from "@/components/item-card";

// Local date range [starts_on, ends_on] as "YYYY-MM-DD" strings.
function dayRange(start: string, end: string): string[] {
  const days: string[] = [];
  const d = new Date(`${start}T00:00:00`);
  const last = new Date(`${end}T00:00:00`);
  while (d <= last) {
    days.push(d.toLocaleDateString("sv-SE"));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function prettyDay(ymd: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(`${ymd}T12:00:00`));
}

export default async function Itinerary() {
  const supabase = await createClient();
  const trip = await getActiveTrip(supabase);

  const { data } = await supabase
    .from("items")
    .select("*")
    .eq("trip_id", trip!.id)
    .not("starts_at", "is", null)
    .order("starts_at", { ascending: true });

  const items = (data as Item[]) ?? [];

  // Bucket items by their venue-tz local day.
  const byDay = new Map<string, Item[]>();
  for (const item of items) {
    const tz = item.venue_tz ?? CDMX_TZ;
    const day = new Date(item.starts_at!).toLocaleDateString("sv-SE", {
      timeZone: tz,
    });
    (byDay.get(day) ?? byDay.set(day, []).get(day)!).push(item);
  }

  const days = dayRange(trip!.starts_on, trip!.ends_on);

  return (
    <main className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Itinerary</h1>

      {days.map((day) => {
        const dayItems = byDay.get(day) ?? [];
        return (
          <section key={day} className="flex flex-col gap-2">
            <h2 className="tnum text-sm font-semibold text-ink/70">
              {prettyDay(day)}
            </h2>
            {dayItems.length === 0 ? (
              <p className="text-sm text-ink/40">Nothing planned.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {dayItems.map((item) => (
                  <li key={item.id}>
                    <ItemCard item={item} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </main>
  );
}
