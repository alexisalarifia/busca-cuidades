"use client";

import { useState } from "react";

// Neighborhood slot options — CDMX seed (brief §8).
const NEIGHBORHOODS = [
  "Roma Norte",
  "Condesa",
  "Juárez",
  "Centro Histórico",
  "Coyoacán",
  "Polanco",
  "San Rafael",
  "Narvarte",
];
const NEAR_ME = ["restaurants", "cafés", "street food", "bars"] as const;
const PLAN_SPANS = ["morning", "afternoon", "evening", "full day", "night out"] as const;

interface Place {
  name: string;
  why: string;
  saved?: string;
}

interface Answer {
  answer: string;
  places: Place[];
  source_count: number;
  sources: { title: string; url: string }[];
  retrieved_at: string;
}

const chip =
  "radius-token border border-ink/20 px-3 py-1.5 text-sm";
const chipActive = "radius-token bg-ink px-3 py-1.5 text-sm text-paper";

export default function AskClient() {
  const [mode, setMode] = useState<"near" | "plan" | "reddit" | "free">("near");
  const [nearWhat, setNearWhat] = useState<(typeof NEAR_ME)[number]>("restaurants");
  const [span, setSpan] = useState<(typeof PLAN_SPANS)[number]>("morning");
  const [hood, setHood] = useState(NEIGHBORHOODS[0]);
  const [goal, setGoal] = useState("food");
  const [freeText, setFreeText] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);

  function requestLocation(): Promise<{ lat: number; lng: number } | null> {
    // Explicit-tap only, never background (brief §8).
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCoords(c);
          resolve(c);
        },
        () => resolve(null),
        { timeout: 8000 }
      );
    });
  }

  async function ask() {
    setLoading(true);
    setError(null);
    setAnswer(null);
    setPlaces([]);

    let prompt = "";
    let reddit = false;
    let wantsPins = false;
    let loc = coords;

    if (mode === "near") {
      loc = await requestLocation();
      prompt = `Top rated ${nearWhat} near me right now in Mexico City`;
      wantsPins = true;
    } else if (mode === "plan") {
      prompt = `Propose a ${span} in ${hood}, Mexico City, prioritizing ${goal}. Give a timed plan.`;
    } else if (mode === "reddit") {
      prompt = `One thing Reddit says I shouldn't miss in ${hood}, Mexico City`;
      reddit = true;
    } else {
      prompt = freeText.trim();
    }
    if (!prompt) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          reddit,
          wants_pins: wantsPins,
          lat: loc?.lat ?? null,
          lng: loc?.lng ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ask failed.");
        return;
      }
      setAnswer(data);
      setPlaces(data.places ?? []);
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function savePin(i: number) {
    const place = places[i];
    if (!place || place.saved) return;
    const res = await fetch("/api/ask/save-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: place.name,
        why: place.why,
        kind: nearWhat === "cafés" ? "cafe" : nearWhat === "bars" ? "bar" : nearWhat === "street food" ? "street_food" : "restaurant",
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setPlaces((ps) => ps.map((p, idx) => (idx === i ? { ...p, saved: data.display_id } : p)));
    }
  }

  return (
    <main className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight">Ask</h1>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["near", "Near me"],
            ["plan", "Plan a block"],
            ["reddit", "Reddit says"],
            ["free", "Freeform"],
          ] as const
        ).map(([m, label]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={mode === m ? chipActive : chip}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="radius-token flex flex-col gap-3 border border-ink/10 bg-white p-4">
        {mode === "near" && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span>Top rated</span>
            <select value={nearWhat} onChange={(e) => setNearWhat(e.target.value as typeof nearWhat)} className="radius-token border border-ink/20 px-2 py-1">
              {NEAR_ME.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <span>near me</span>
          </div>
        )}
        {mode === "plan" && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span>A</span>
            <select value={span} onChange={(e) => setSpan(e.target.value as typeof span)} className="radius-token border border-ink/20 px-2 py-1">
              {PLAN_SPANS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <span>in</span>
            <select value={hood} onChange={(e) => setHood(e.target.value)} className="radius-token border border-ink/20 px-2 py-1">
              {NEIGHBORHOODS.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
            <span>for</span>
            <input value={goal} onChange={(e) => setGoal(e.target.value)} className="radius-token border border-ink/20 px-2 py-1 w-28" />
          </div>
        )}
        {mode === "reddit" && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span>Don&apos;t-miss in</span>
            <select value={hood} onChange={(e) => setHood(e.target.value)} className="radius-token border border-ink/20 px-2 py-1">
              {NEIGHBORHOODS.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
        )}
        {mode === "free" && (
          <textarea
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            rows={3}
            placeholder="Ask anything about Mexico City…"
            className="radius-token border border-ink/20 px-3 py-2 text-base"
          />
        )}

        <button
          onClick={ask}
          disabled={loading}
          className="radius-token shadow-hard bg-accent px-4 py-2.5 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Searching…" : "Ask"}
        </button>
        {mode === "near" && (
          <p className="text-xs text-ink/50">Uses your location once, on tap.</p>
        )}
      </div>

      {error && <p className="text-sm text-accent">{error}</p>}

      {loading && (
        <div className="radius-token h-24 animate-pulse border border-ink/10 bg-white" />
      )}

      {answer && (
        <div className="radius-token flex flex-col gap-3 border border-ink/10 bg-white p-4">
          <p className="whitespace-pre-wrap text-sm">{answer.answer}</p>

          {places.length > 0 && (
            <ul className="flex flex-col gap-2">
              {places.map((p, i) => (
                <li key={i} className="flex items-start justify-between gap-3 border-t border-ink/10 pt-2">
                  <div>
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p className="text-xs text-ink/60">{p.why}</p>
                  </div>
                  <button
                    onClick={() => savePin(i)}
                    disabled={!!p.saved}
                    className="radius-token shrink-0 border border-ink/20 px-2 py-1 text-xs disabled:opacity-60"
                  >
                    {p.saved ? `Saved ${p.saved}` : "Save"}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <p className="tnum text-xs text-ink/40">
            {answer.source_count} sources · retrieved{" "}
            {new Date(answer.retrieved_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
            {" · a synthesis, not a census"}
          </p>
        </div>
      )}
    </main>
  );
}
