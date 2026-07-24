"use client";

import { useEffect, useState } from "react";

interface TrendEntry {
  title: string;
  line: string;
  neighborhood: string;
}

// Landing-page furniture (brief §6): lazy-loaded so the login paints instantly.
export default function TrendsModule() {
  const [entries, setEntries] = useState<TrendEntry[] | null>(null);
  const [updated, setUpdated] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function load(refresh = false) {
    if (refresh) setRefreshing(true);
    try {
      const res = await fetch(`/api/trends${refresh ? "?refresh=1" : ""}`);
      const data = await res.json();
      setEntries(data.entries ?? []);
      setUpdated(data.updated ?? null);
    } catch {
      setEntries([]);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="radius-token mt-8 w-full border border-ink/10 bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Top things to do in Mexico City</h2>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="text-xs text-ink/50 underline underline-offset-2 disabled:opacity-50"
        >
          {refreshing ? "…" : "Refresh"}
        </button>
      </div>

      {entries === null ? (
        <p className="mt-2 text-sm text-ink/40">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="mt-2 text-sm text-ink/40">Nothing to show right now.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {entries.map((e, i) => (
            <li key={i} className="border-t border-ink/5 pt-2 first:border-0 first:pt-0">
              <p className="text-sm font-medium">{e.title}</p>
              <p className="text-xs text-ink/60">{e.line}</p>
              {e.neighborhood && (
                <p className="text-xs text-ink/40">{e.neighborhood}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="tnum mt-3 text-xs text-ink/40">
        Updated{" "}
        {updated
          ? new Date(updated).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "—"}
      </p>
    </section>
  );
}
