"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Category, Item } from "@/lib/types";
import { KINDS } from "@/lib/display-id";
import { formatDay, formatTime } from "@/lib/time";
import { CDMX, CDMX_TZ } from "@/lib/geocode";
import { createManualPin, setVisited } from "@/app/(tabs)/map/actions";
import TripProgress from "@/components/trip-progress";

const CATEGORY_VAR: Record<Category, string> = {
  flight: "--c-flight",
  ticket: "--c-ticket",
  accommodation: "--c-accommodation",
  dining: "--c-dining",
  excursion: "--c-excursion",
  transport: "--c-transport",
  note: "--c-note",
};

// One glyph per category, drawn as a tiny path so pins stay legible at 28px.
const CATEGORY_GLYPH: Record<Category, string> = {
  flight: "M2 12l20-8-6 8 6 8z",
  ticket: "M3 8h18v3a2 2 0 0 0 0 2v3H3v-3a2 2 0 0 0 0-2z",
  accommodation: "M3 18v-8h11a4 4 0 0 1 4 4v4h-2v-2H5v2zM6 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  dining: "M7 2v9a2 2 0 0 1-2 2v9h-1V2h1v5h1V2h1zm3 0h1v20h-1v-9a3 3 0 0 1-2-3V6a4 4 0 0 1 2-4z",
  excursion: "M12 2l5 18-5-4-5 4z",
  transport: "M5 4h14v12H5zM7 18l-2 3M17 18l2 3M8 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
  note: "M5 3h14v18l-4-3H5z",
};

interface DraftPin {
  lat: number;
  lng: number;
}

interface Props {
  items: Item[];
  photoCounts: Record<string, number>;
  lodging: { lat: number; lng: number } | null;
}

export default function MapView({ items, photoCounts, lodging }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftPin | null>(null);
  const [layers, setLayers] = useState({ saved: true, visited: true, ai: true });

  const selected = items.find((i) => i.id === selectedId) ?? null;

  // Map init, once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: lodging ? [lodging.lng, lodging.lat] : [CDMX.lng, CDMX.lat],
      zoom: 12.5,
      attributionControl: false,
    });
    map.addControl(new mapboxgl.AttributionControl({ compact: true }));
    mapRef.current = map;

    // Long-press (600ms, still finger) drops a manual pin (brief §6).
    let timer: ReturnType<typeof setTimeout> | null = null;
    const start = (e: mapboxgl.MapMouseEvent | mapboxgl.MapTouchEvent) => {
      const { lat, lng } = e.lngLat;
      timer = setTimeout(() => setDraft({ lat, lng }), 600);
    };
    const cancel = () => {
      if (timer) clearTimeout(timer);
      timer = null;
    };
    map.on("mousedown", start);
    map.on("touchstart", start);
    for (const ev of ["mouseup", "touchend", "move", "drag", "zoom"] as const) {
      map.on(ev, cancel);
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Markers follow items + layer toggles.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const shown = items.filter((item) =>
      item.visited ? layers.visited : layers.saved
    );

    for (const item of shown) {
      const el = document.createElement("button");
      el.setAttribute("aria-label", `${item.display_id} ${item.title}`);
      el.className = "anim-pin";
      el.style.cssText = `
        width:28px;height:28px;border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);cursor:pointer;padding:0;
        display:flex;align-items:center;justify-content:center;
        border:2px solid var(${CATEGORY_VAR[item.category]});
        background:${item.visited ? `var(${CATEGORY_VAR[item.category]})` : "var(--paper)"};
        box-shadow:1px 1px 0 rgba(26,26,26,.25);
      `;
      el.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" style="transform:rotate(45deg)"
        fill="${item.visited ? "white" : `var(${CATEGORY_VAR[item.category]})`}">
        <path d="${item.visited ? "M4 12l5 5 11-11-1.5-1.5L9 14 5.5 10.5z" : CATEGORY_GLYPH[item.category]}"/></svg>`;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        setSelectedId(item.id);
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([item.lng!, item.lat!])
        .addTo(map);
      markersRef.current.push(marker);
    }
  }, [items, layers]);

  const toggle = (key: keyof typeof layers) =>
    setLayers((l) => ({ ...l, [key]: !l[key] }));

  return (
    <div className="fixed inset-x-0 top-0 bottom-[calc(56px+env(safe-area-inset-bottom))]">
      <div ref={containerRef} className="h-full w-full" />

      <div className="absolute left-3 top-3 flex gap-2">
        {(
          [
            ["saved", "Saved"],
            ["visited", "Visited"],
            ["ai", "AI"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => toggle(key)}
            className={`tap radius-token shadow-hard px-3 py-1.5 text-xs font-semibold ${
              layers[key] ? "bg-ink text-paper" : "bg-paper text-ink/60"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="anim-in absolute right-3 top-3">
        <TripProgress items={items} compact />
      </div>

      {selected && (
        <div className="anim-sheet radius-token shadow-hard absolute inset-x-3 bottom-3 border border-ink/10 bg-paper p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{selected.title}</p>
              <p className="tnum text-xs text-ink/50">
                {selected.display_id}
                {selected.starts_at &&
                  ` · ${formatDay(selected.starts_at, selected.venue_tz ?? CDMX_TZ)}, ${formatTime(selected.starts_at, selected.venue_tz ?? CDMX_TZ)}`}
                {` · ${photoCounts[selected.id] ?? 0} photos`}
              </p>
            </div>
            <button
              onClick={() => setSelectedId(null)}
              aria-label="Close"
              className="px-1 text-ink/50"
            >
              ✕
            </button>
          </div>
          {selected.notes && (
            <p className="mt-2 text-sm text-ink/70">{selected.notes}</p>
          )}
          <div className="mt-3 flex items-center gap-3 text-sm">
            <button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await setVisited(selected.id, !selected.visited);
                  router.refresh();
                })
              }
              className={`radius-token px-3 py-1.5 font-semibold ${
                selected.visited
                  ? "bg-ink text-paper"
                  : "border border-ink/20 bg-white"
              }`}
            >
              {selected.visited ? "Visited ✓" : "Mark visited"}
            </button>
            <a
              href={`https://maps.apple.com/?daddr=${selected.lat},${selected.lng}`}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              Directions
            </a>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`}
              target="_blank"
              rel="noreferrer"
              className="text-ink/60 underline underline-offset-2"
            >
              Google
            </a>
          </div>
        </div>
      )}

      {draft && (
        <div
          className="absolute inset-0 z-10 flex items-end bg-ink/40"
          onClick={() => setDraft(null)}
        >
          <form
            action={(formData) => {
              startTransition(async () => {
                await createManualPin(formData);
                setDraft(null);
                router.refresh();
              });
            }}
            onClick={(e) => e.stopPropagation()}
            className="anim-sheet w-full bg-paper p-5 pb-10"
          >
            <h2 className="text-lg font-semibold">New pin</h2>
            <p className="tnum mt-0.5 text-xs text-ink/50">
              {draft.lat.toFixed(5)}, {draft.lng.toFixed(5)}
            </p>
            <input type="hidden" name="lat" value={draft.lat} />
            <input type="hidden" name="lng" value={draft.lng} />
            <div className="mt-3 flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Kind
                <select
                  name="kind"
                  defaultValue="landmark"
                  className="radius-token border border-ink/20 bg-white px-3 py-2 text-base"
                >
                  {KINDS.map((k) => (
                    <option key={k} value={k}>
                      {k.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Name
                <input
                  name="title"
                  placeholder="What is this place?"
                  className="radius-token border border-ink/20 bg-white px-3 py-2 text-base"
                />
              </label>
              <button
                disabled={pending}
                className="radius-token shadow-hard bg-accent px-4 py-2.5 font-semibold text-white disabled:opacity-60"
              >
                {pending ? "Saving…" : "Add pin"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
