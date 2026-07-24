"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KINDS, KIND_CATEGORY } from "@/lib/display-id";
import type { Category } from "@/lib/types";

// The persistent "+" (brief §6): ingest is an act, not a place. Two inputs →
// extraction → editable review card → one Add-to-trip tap fans out.

type Stage = "input" | "loading" | "review";

interface Draft {
  category: Category;
  kind: string;
  title: string;
  venue_name: string;
  venue_address: string;
  starts_at_local: string;
  ends_at_local: string;
  confirmation_code: string;
  total_amount: string;
  currency: string;
  purchaser_contact: string;
  purchase_ts: string;
  source_issued_at: string;
  notes: string;
  confidence: number | null;
  venue_tz: string;
  lat: number | null;
  lng: number | null;
  geo_confidence: "high" | "low" | null;
  source_type: string;
  source_raw: string;
  content_hash: string;
}

const field =
  "radius-token border border-ink/20 bg-white px-3 py-2 text-base outline-accent w-full";

function emptyDraft(): Draft {
  return {
    category: "note",
    kind: "other",
    title: "",
    venue_name: "",
    venue_address: "",
    starts_at_local: "",
    ends_at_local: "",
    confirmation_code: "",
    total_amount: "",
    currency: "",
    purchaser_contact: "",
    purchase_ts: "",
    source_issued_at: "",
    notes: "",
    confidence: null,
    venue_tz: "America/Mexico_City",
    lat: null,
    lng: null,
    geo_confidence: null,
    source_type: "paste",
    source_raw: "",
    content_hash: "",
  };
}

export default function IngestButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("input");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());

  function reset() {
    setStage("input");
    setText("");
    setUrl("");
    setError(null);
    setNotice(null);
    setDraft(emptyDraft());
  }

  function close() {
    setOpen(false);
    setTimeout(reset, 200);
  }

  async function extract() {
    setError(null);
    setNotice(null);
    if (!text.trim() && !url.trim()) return;
    setStage("loading");
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(url.trim() ? { url: url.trim() } : { text }),
      });
      const data = await res.json();

      if (data.duplicate) {
        setNotice(`Already imported as ${data.display_id}.`);
        setStage("input");
        return;
      }
      if (!res.ok) {
        setError(data.error || "Extraction failed.");
        setStage("input");
        return;
      }

      const base = emptyDraft();
      base.source_type = data.source_type ?? "paste";
      base.source_raw = data.source_raw ?? "";
      base.content_hash = data.content_hash ?? "";

      if (data.manual) {
        // Never a dead end (brief §7): open the card in manual mode.
        setDraft({ ...base, notes: "Extraction failed — fill this in manually." });
        setStage("review");
        return;
      }

      const e = data.extraction;
      setDraft({
        ...base,
        category: e.category,
        kind: e.kind && KINDS.includes(e.kind) ? e.kind : "other",
        title: e.title ?? "",
        venue_name: e.venue_name ?? "",
        venue_address: data.geo?.address ?? e.venue_address ?? "",
        starts_at_local: e.starts_at_local ?? "",
        ends_at_local: e.ends_at_local ?? "",
        confirmation_code: e.confirmation_code ?? "",
        total_amount: e.total_amount != null ? String(e.total_amount) : "",
        currency: e.currency ?? "",
        purchaser_contact: e.purchaser_contact ?? "",
        purchase_ts: e.purchase_ts ?? "",
        source_issued_at: e.source_issued_at ?? "",
        notes: e.notes ?? "",
        confidence: e.confidence ?? null,
        venue_tz: data.venue_tz ?? "America/Mexico_City",
        lat: data.geo?.lat ?? null,
        lng: data.geo?.lng ?? null,
        geo_confidence: data.geo?.confidence ?? null,
      });
      setStage("review");
    } catch {
      setError("Something went wrong. Try again.");
      setStage("input");
    }
  }

  const [toggles, setToggles] = useState({ itinerary: true, pin: true, calendar: true });

  async function commit() {
    setError(null);
    setStage("loading");
    try {
      const res = await fetch("/api/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          total_amount: draft.total_amount ? Number(draft.total_amount) : null,
          // Pin toggle off → drop coordinates so no map pin is created.
          lat: toggles.pin ? draft.lat : null,
          lng: toggles.pin ? draft.lng : null,
          // Itinerary toggle off → drop the time so it won't show on Today.
          starts_at_local: toggles.itinerary ? draft.starts_at_local : "",
          ends_at_local: toggles.itinerary ? draft.ends_at_local : "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't add to trip.");
        setStage("review");
        return;
      }

      if (toggles.calendar && draft.starts_at_local) {
        // Offer the .ics for this item (brief §7 step 5).
        const a = document.createElement("a");
        a.href = `/api/ics/${data.id}`;
        a.download = `${data.display_id}.ics`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }

      router.refresh();
      close();
    } catch {
      setError("Something went wrong.");
      setStage("review");
    }
  }

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  return (
    <>
      <button
        type="button"
        aria-label="Add to trip"
        onClick={() => setOpen(true)}
        className="tap shadow-hard fixed bottom-20 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-3xl font-light text-white"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        +
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end bg-ink/40" onClick={close}>
          <div
            className="anim-sheet radius-token max-h-[90dvh] w-full overflow-y-auto bg-paper p-5 pb-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex max-w-md flex-col gap-3">
              {stage === "input" && (
                <>
                  <h2 className="text-lg font-semibold">Add to trip</h2>
                  <textarea
                    placeholder="Paste a booking email…"
                    rows={4}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className={field}
                  />
                  <div className="flex items-center gap-2 text-xs text-ink/40">
                    <span className="h-px flex-1 bg-ink/10" /> or{" "}
                    <span className="h-px flex-1 bg-ink/10" />
                  </div>
                  <input
                    placeholder="Paste a URL"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className={field}
                  />
                  {notice && <p className="text-sm text-ink/70">{notice}</p>}
                  {error && <p className="text-sm text-accent">{error}</p>}
                  <button
                    onClick={extract}
                    disabled={!text.trim() && !url.trim()}
                    className="radius-token shadow-hard bg-accent px-4 py-2.5 font-semibold text-white disabled:opacity-40"
                  >
                    Extract
                  </button>
                </>
              )}

              {stage === "loading" && (
                <div className="flex flex-col items-center gap-3 py-10">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink/20 border-t-accent" />
                  <p className="text-sm text-ink/60">Reading it…</p>
                </div>
              )}

              {stage === "review" && (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Review</h2>
                    {draft.confidence != null && (
                      <span className="tnum text-xs text-ink/50">
                        {Math.round(draft.confidence * 100)}% sure
                      </span>
                    )}
                  </div>

                  <label className="flex flex-col gap-1 text-sm">
                    Title
                    <input
                      value={draft.title}
                      onChange={(e) => set("title", e.target.value)}
                      className={field}
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex flex-col gap-1 text-sm">
                      Category
                      <select
                        value={draft.category}
                        onChange={(e) => set("category", e.target.value as Category)}
                        className={field}
                      >
                        {["flight", "ticket", "accommodation", "dining", "excursion", "transport", "note"].map(
                          (c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          )
                        )}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      Kind
                      <select
                        value={draft.kind}
                        onChange={(e) => {
                          const k = e.target.value;
                          set("kind", k);
                          if (KIND_CATEGORY[k]) set("category", KIND_CATEGORY[k]);
                        }}
                        className={field}
                      >
                        {KINDS.map((k) => (
                          <option key={k} value={k}>
                            {k.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="flex flex-col gap-1 text-sm">
                    Starts
                    <input
                      type="datetime-local"
                      value={draft.starts_at_local}
                      onChange={(e) => set("starts_at_local", e.target.value)}
                      className={`${field} tnum`}
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-sm">
                    Venue address
                    <input
                      value={draft.venue_address}
                      onChange={(e) => set("venue_address", e.target.value)}
                      className={field}
                    />
                  </label>
                  {draft.geo_confidence === "low" && (
                    <p className="text-xs text-accent">
                      Location is a rough guess — check it.
                    </p>
                  )}
                  {draft.geo_confidence === null && draft.venue_address && (
                    <p className="text-xs text-ink/50">
                      Couldn&apos;t place this on the map; edit the address to fix.
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex flex-col gap-1 text-sm">
                      Confirmation
                      <input
                        value={draft.confirmation_code}
                        onChange={(e) => set("confirmation_code", e.target.value)}
                        className={field}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      Amount
                      <div className="flex gap-1">
                        <input
                          value={draft.total_amount}
                          onChange={(e) => set("total_amount", e.target.value)}
                          className={`${field} tnum`}
                          inputMode="decimal"
                        />
                        <input
                          value={draft.currency}
                          onChange={(e) => set("currency", e.target.value)}
                          className={`${field} w-20`}
                          placeholder="MXN"
                        />
                      </div>
                    </label>
                  </div>

                  <label className="flex flex-col gap-1 text-sm">
                    Notes
                    <textarea
                      rows={2}
                      value={draft.notes}
                      onChange={(e) => set("notes", e.target.value)}
                      className={field}
                    />
                  </label>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {(
                      [
                        ["itinerary", "Itinerary"],
                        ["pin", "Map pin"],
                        ["calendar", "Calendar file"],
                      ] as const
                    ).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setToggles((t) => ({ ...t, [key]: !t[key] }))}
                        className={`radius-token px-3 py-1.5 text-xs font-semibold ${
                          toggles[key] ? "bg-ink text-paper" : "border border-ink/20 text-ink/50"
                        }`}
                      >
                        {toggles[key] ? "✓ " : ""}
                        {label}
                      </button>
                    ))}
                  </div>

                  {error && <p className="text-sm text-accent">{error}</p>}

                  <button
                    onClick={commit}
                    disabled={!draft.title.trim()}
                    className="radius-token shadow-hard mt-1 bg-accent px-4 py-3 font-semibold text-white disabled:opacity-40"
                  >
                    Add to trip
                  </button>
                  <button
                    onClick={() => setStage("input")}
                    className="text-sm text-ink/50 underline underline-offset-2"
                  >
                    Back
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
