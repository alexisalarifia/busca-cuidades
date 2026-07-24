"use client";

import { useState } from "react";
import type { Item } from "@/lib/types";
import { distanceMeters, formatDistance, walkMinutes } from "@/lib/distance";

interface Props {
  items: Item[];
}

interface Ranked {
  item: Item;
  meters: number;
}

// The app never volunteered anything — you had to go looking. This answers
// "what's around me right now" from places you already saved.
// Location on explicit tap only, never in the background (brief §8).
export default function NearbyCard({ items }: Props) {
  const [state, setState] = useState<"idle" | "locating" | "done" | "denied">(
    "idle"
  );
  const [near, setNear] = useState<Ranked[]>([]);

  const placesWithCoords = items.filter((i) => i.lat != null && i.lng != null);
  if (placesWithCoords.length === 0) return null;

  function locate() {
    if (!navigator.geolocation) {
      setState("denied");
      return;
    }
    setState("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const ranked = placesWithCoords
          .map((item) => ({
            item,
            meters: distanceMeters(latitude, longitude, item.lat!, item.lng!),
          }))
          .sort((a, b) => a.meters - b.meters)
          .slice(0, 4);
        setNear(ranked);
        setState("done");
      },
      () => setState("denied"),
      { timeout: 8000, maximumAge: 60_000 }
    );
  }

  return (
    <section className="anim-in radius-token border border-ink/10 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Near you</h2>
        {state !== "done" && (
          <button
            onClick={locate}
            disabled={state === "locating"}
            className="tap radius-token bg-ink px-3 py-1.5 text-xs font-semibold text-paper disabled:opacity-60"
          >
            {state === "locating" ? "Locating…" : "What's close?"}
          </button>
        )}
        {state === "done" && (
          <button
            onClick={locate}
            className="tap text-xs text-ink/50 underline underline-offset-2"
          >
            Refresh
          </button>
        )}
      </div>

      {state === "idle" && (
        <p className="mt-2 text-xs text-ink/50">
          Uses your location once, only when you tap.
        </p>
      )}

      {state === "denied" && (
        <p className="mt-2 text-xs text-ink/50">
          Couldn&apos;t get your location. You can still browse the map.
        </p>
      )}

      {state === "done" && near.length > 0 && (
        <ul className="stagger mt-3 flex flex-col gap-2">
          {near.map(({ item, meters }) => {
            const mins = walkMinutes(meters);
            return (
              <li
                key={item.id}
                className="flex items-baseline justify-between gap-3 border-t border-ink/5 pt-2 first:border-0 first:pt-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {item.title}
                    {item.visited && (
                      <span className="ml-1 text-xs text-ink/40">· visited</span>
                    )}
                  </p>
                  <p className="tnum text-xs text-ink/50">
                    {formatDistance(meters)}
                    {mins ? ` · ${mins} min walk` : ""}
                  </p>
                </div>
                <a
                  href={`https://maps.apple.com/?daddr=${item.lat},${item.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="tap shrink-0 text-xs underline underline-offset-2"
                >
                  Go
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
