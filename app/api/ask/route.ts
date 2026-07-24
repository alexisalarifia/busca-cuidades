import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveTrip } from "@/lib/trip";
import { search } from "@/lib/search";
import { chat } from "@/lib/llm";

// Grounded concierge (brief §8): every answer comes from a server route that
// runs search, feeds results to the model, and returns
// answer + source_count + retrieved_at. Rate-limited against ask_log.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const trip = await getActiveTrip(supabase);

  // Server-enforced rate limit (brief §8).
  const limit = Number(process.env.ASK_RATE_LIMIT_PER_HOUR ?? 5);
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("ask_log")
    .select("id", { count: "exact", head: true })
    .gte("created_at", hourAgo);
  if ((count ?? 0) >= limit) {
    return NextResponse.json(
      { error: `Rate limit reached (${limit}/hour). Try again later.`, rate_limited: true },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const prompt = String(body.prompt ?? "").trim();
  if (!prompt) return NextResponse.json({ error: "Empty prompt." }, { status: 400 });

  const lat = typeof body.lat === "number" ? body.lat : null;
  const lng = typeof body.lng === "number" ? body.lng : null;
  const redditOnly = Boolean(body.reddit);
  const wantsPins = Boolean(body.wants_pins);

  // "Locals say" claims must include Spanish-language / .mx sources (brief §8).
  const spanishHint = /local|reddit|hidden|auténtic|auténtico|secret/i.test(prompt);
  const queries = [prompt];
  if (spanishHint && !redditOnly) queries.push(`${prompt} (en español, fuentes .mx)`);

  let allResults: { title: string; url: string; content: string }[] = [];
  let retrievedAt = new Date().toISOString();
  try {
    for (const q of queries) {
      const r = await search(q, {
        maxResults: redditOnly ? 8 : 6,
        includeDomains: redditOnly ? ["reddit.com"] : undefined,
      });
      allResults = allResults.concat(r.results);
      retrievedAt = r.retrievedAt;
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Search failed." },
      { status: 502 }
    );
  }

  // De-dup by URL, cap context.
  const seen = new Set<string>();
  const sources = allResults.filter((r) => {
    if (!r.url || seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  }).slice(0, 10);

  const context = sources
    .map((s, i) => `[${i + 1}] ${s.title}\n${s.url}\n${s.content}`)
    .join("\n\n");

  const system = `You are a concise local concierge for a traveler in Mexico City. Answer ONLY from the provided sources. This is a synthesis of what sources say, not a census — never state "locals say" as fact without attributing it to the sources. If the sources don't answer, say so. Keep it tight: a short answer, then up to ${wantsPins ? 10 : 5} specific places when relevant, each with a one-line why. ${redditOnly ? "These sources are Reddit threads; mention how many threads and their rough dates if visible." : ""}`;

  let answer = "";
  let places: { name: string; why: string; lat?: number; lng?: number }[] = [];
  try {
    if (wantsPins) {
      // Structured list for the dashed AI pin layer (brief §8 chip 1).
      const result = await chat({
        json: true,
        maxTokens: 1500,
        messages: [
          {
            role: "system",
            content: `${system}\nReturn JSON: { "answer": string, "places": [{ "name": string, "why": string }] } with up to 10 places, ranked best first.`,
          },
          {
            role: "user",
            content: `${prompt}${lat != null ? ` (near ${lat},${lng})` : ""}\n\nSources:\n${context}`,
          },
        ],
      });
      const parsed = JSON.parse(result.content || "{}");
      answer = parsed.answer ?? "";
      const rawPlaces = Array.isArray(parsed.places)
        ? parsed.places
        : Array.isArray(parsed.recommendations)
          ? parsed.recommendations
          : [];
      places = rawPlaces
        .map((p: Record<string, unknown>) => ({
          name: String(p.name ?? p.title ?? "").trim(),
          why: String(p.why ?? p.reason ?? p.description ?? "").trim(),
        }))
        .filter((p: { name: string }) => p.name)
        .slice(0, 10);
    } else {
      const result = await chat({
        maxTokens: 1200,
        messages: [
          { role: "system", content: system },
          { role: "user", content: `${prompt}\n\nSources:\n${context}` },
        ],
      });
      answer = result.content;
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Model failed." },
      { status: 502 }
    );
  }

  // Log for rate limit + history (brief §4/§8).
  await supabase.from("ask_log").insert({
    user_id: user.id,
    trip_id: trip?.id ?? null,
    prompt,
    lat,
    lng,
    source_count: sources.length,
    retrieved_at: retrievedAt,
  });

  return NextResponse.json({
    answer,
    places,
    source_count: sources.length,
    sources: sources.map((s) => ({ title: s.title, url: s.url })),
    retrieved_at: retrievedAt,
  });
}
