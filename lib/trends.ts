import { unstable_cache } from "next/cache";
import { search } from "@/lib/search";
import { chat } from "@/lib/llm";

export interface TrendEntry {
  title: string;
  line: string;
  neighborhood: string;
}

export interface Trends {
  entries: TrendEntry[];
  updated: string; // ISO
}

export const TRENDS_TAG = "trends";

async function generateTrends(): Promise<Trends> {
  const { results, retrievedAt } = await search(
    "best things to do in Mexico City right now, top attractions by neighborhood",
    { maxResults: 8 }
  );
  const context = results
    .map((r, i) => `[${i + 1}] ${r.title}\n${r.content}`)
    .join("\n\n");

  const result = await chat({
    json: true,
    maxTokens: 1500,
    messages: [
      {
        role: "system",
        content:
          'You curate a short "Top things to do in Mexico City" list from the provided sources. Return JSON: { "entries": [{ "title": string, "line": string (one line), "neighborhood": string }] } with at most 10 entries, most iconic first. Only use places supported by the sources.',
      },
      { role: "user", content: `Sources:\n${context}` },
    ],
  });

  return { entries: parseTrendEntries(result.content), updated: retrievedAt };
}

// Tolerate the model's occasional key drift (entries/attractions/items,
// title/name, line/description) — same robustness posture as extraction.
function parseTrendEntries(content: string): TrendEntry[] {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content);
  } catch {
    return [];
  }
  const arr =
    (Array.isArray(parsed.entries) && parsed.entries) ||
    (Array.isArray(parsed.attractions) && parsed.attractions) ||
    (Array.isArray(parsed.items) && parsed.items) ||
    [];
  return (arr as Record<string, unknown>[])
    .map((e) => ({
      title: String(e.title ?? e.name ?? "").trim(),
      line: String(e.line ?? e.description ?? e.why ?? "").trim(),
      neighborhood: String(e.neighborhood ?? e.area ?? e.colonia ?? "").trim(),
    }))
    .filter((e) => e.title)
    .slice(0, 10);
}

// Cached 7 days (brief §6). Refresh-on-demand via revalidateTag(TRENDS_TAG).
export const getTrends = unstable_cache(generateTrends, ["trends-v1"], {
  revalidate: 60 * 60 * 24 * 7,
  tags: [TRENDS_TAG],
});
