import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveTrip } from "@/lib/trip";
import { CDMX_TZ } from "@/lib/geocode";
import { formatTime } from "@/lib/time";
import type { Item } from "@/lib/types";
import "./print.css";

// Print-styled route (brief §9): the user prints to PDF via Safari's share
// sheet — no PDF library. Lives outside the tab shell so it prints clean.
export default async function TripBook() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const trip = await getActiveTrip(supabase);
  if (!trip) redirect("/trip-gate");

  const { data } = await supabase
    .from("items")
    .select("*")
    .eq("trip_id", trip.id)
    .not("starts_at", "is", null)
    .order("starts_at", { ascending: true });
  const items = (data as Item[]) ?? [];

  const byDay = new Map<string, Item[]>();
  for (const item of items) {
    const tz = item.venue_tz ?? CDMX_TZ;
    const day = new Date(item.starts_at!).toLocaleDateString("en-US", {
      timeZone: tz,
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    (byDay.get(day) ?? byDay.set(day, []).get(day)!).push(item);
  }

  return (
    <div className="book">
      <section className="cover">
        <p className="eyebrow">Ciudad de México</p>
        <h1>{trip.name}</h1>
        <p className="dates tnum">
          {trip.starts_on} — {trip.ends_on}
        </p>
      </section>

      {[...byDay.entries()].map(([day, dayItems]) => (
        <section key={day} className="day">
          <h2>{day}</h2>
          {dayItems.map((item) => (
            <div key={item.id} className="entry">
              <span className="time tnum">
                {formatTime(item.starts_at!, item.venue_tz ?? CDMX_TZ)}
              </span>
              <div>
                <p className="title">
                  {item.title} <span className="id tnum">{item.display_id}</span>
                </p>
                {item.address && <p className="addr">{item.address}</p>}
                {item.notes && <p className="notes">{item.notes}</p>}
              </div>
            </div>
          ))}
        </section>
      ))}

      <p className="foot">Print to PDF from the share sheet.</p>
    </div>
  );
}
