import type { Item } from "@/lib/types";
import { neighborhoodProgress } from "@/lib/neighborhoods";

interface Props {
  items: Item[];
  /** Compact form for the map overlay. */
  compact?: boolean;
}

// The visited mechanic existed but was never scored — 29 saved places and the
// app never said "3 of 29." This is the collection loop made visible.
export default function TripProgress({ items, compact }: Props) {
  const places = items.filter((i) => i.lat != null && i.lng != null);
  const total = places.length;
  if (total === 0) return null;

  const visited = places.filter((i) => i.visited).length;
  const pct = Math.round((visited / total) * 100);

  if (compact) {
    return (
      <div className="radius-token shadow-hard bg-paper/95 px-3 py-2">
        <p className="tnum text-xs font-semibold">
          {visited}
          <span className="text-ink/50"> / {total} explored</span>
        </p>
        <div className="mt-1 h-1 w-24 overflow-hidden rounded-full bg-ink/10">
          <div
            className="bar-fill h-full rounded-full bg-accent"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  const hoods = neighborhoodProgress(places).slice(0, 4);

  return (
    <section className="anim-in radius-token border border-ink/10 bg-white p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">Explored</h2>
        <p className="tnum text-sm">
          <span className="font-semibold">{visited}</span>
          <span className="text-ink/50"> of {total}</span>
        </p>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink/10">
        <div
          className="bar-fill h-full rounded-full bg-accent"
          style={{ width: `${pct}%` }}
        />
      </div>

      {hoods.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {hoods.map((h) => (
            <li key={h.name} className="tnum text-xs text-ink/60">
              {h.name}{" "}
              <span className={h.visited === h.total ? "font-semibold text-accent" : ""}>
                {h.visited}/{h.total}
              </span>
            </li>
          ))}
        </ul>
      )}

      {visited === 0 && (
        <p className="mt-2 text-xs text-ink/50">
          Tap a pin and mark it visited as you go.
        </p>
      )}
    </section>
  );
}
