"use client";

import { useState } from "react";

// The persistent "+" (brief §6): ingest is an act, not a place. The sheet's
// pipeline arrives in M3; the affordance is here from the first build.
export default function IngestButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Add to trip"
        onClick={() => setOpen(true)}
        className="shadow-hard fixed bottom-20 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-3xl font-light text-white"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        +
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-ink/40"
          onClick={() => setOpen(false)}
        >
          <div
            className="radius-token w-full bg-paper p-5 pb-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex max-w-md flex-col gap-3">
              <h2 className="text-lg font-semibold">Add to trip</h2>
              <textarea
                placeholder="Paste a booking email…"
                rows={4}
                disabled
                className="radius-token border border-ink/20 bg-white px-3 py-2 text-base"
              />
              <input
                placeholder="…or paste a URL"
                disabled
                className="radius-token border border-ink/20 bg-white px-3 py-2 text-base"
              />
              <button
                disabled
                className="radius-token bg-accent px-4 py-2.5 font-semibold text-white opacity-50"
              >
                Add to trip
              </button>
              <p className="text-center text-xs text-ink/50">
                Extraction arrives with the next deploy.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
