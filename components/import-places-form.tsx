"use client";

import { useActionState } from "react";
import { importPlaces, type ImportState } from "@/app/(tabs)/settings/actions";
import { KINDS } from "@/lib/display-id";

const initial: ImportState = {};

export default function ImportPlacesForm() {
  const [state, action, pending] = useActionState(importPlaces, initial);

  return (
    <form action={action} className="flex flex-col gap-3">
      <p className="text-sm text-ink/60">
        Google Maps list exports — KML, GeoJSON, or Takeout CSV. Paste or pick
        a file; places without coordinates get geocoded.
      </p>
      <input
        type="file"
        name="file"
        accept=".csv,.kml,.json,.geojson,text/csv,application/json"
        className="text-sm"
      />
      <textarea
        name="text"
        rows={3}
        placeholder="…or paste the export here"
        className="radius-token border border-ink/20 bg-white px-3 py-2 text-sm"
      />
      <label className="flex flex-col gap-1 text-sm">
        Import as
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

      {state.error && <p className="text-sm text-accent">{state.error}</p>}
      {state.imported != null && (
        <p className="tnum text-sm">
          Imported {state.imported}
          {state.skipped ? ` · ${state.skipped} already in` : ""}
          {state.unlocated ? ` · ${state.unlocated} without a location` : ""}
        </p>
      )}

      <button
        disabled={pending}
        className="radius-token shadow-hard bg-accent px-4 py-2 font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Importing…" : "Import places"}
      </button>
    </form>
  );
}
