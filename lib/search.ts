// Tavily search, server-side only (brief §2/§8). Returns normalized results
// the Ask route feeds to the model for grounding.

export interface SearchResult {
  title: string;
  url: string;
  content: string;
}

export interface SearchResponse {
  results: SearchResult[];
  retrievedAt: string;
}

interface TavilyOptions {
  maxResults?: number;
  includeDomains?: string[];
}

export async function search(
  query: string,
  opts: TavilyOptions = {}
): Promise<SearchResponse> {
  const key = process.env.SEARCH_API_KEY;
  if (!key) throw new Error("Search not configured (SEARCH_API_KEY missing).");

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      query,
      max_results: opts.maxResults ?? 8,
      search_depth: "basic",
      ...(opts.includeDomains ? { include_domains: opts.includeDomains } : {}),
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Search ${res.status}: ${detail.slice(0, 200)}`);
  }

  const json = await res.json();
  const results: SearchResult[] = (json.results ?? []).map(
    (r: { title?: string; url?: string; content?: string }) => ({
      title: r.title ?? "",
      url: r.url ?? "",
      content: r.content ?? "",
    })
  );
  return { results, retrievedAt: new Date().toISOString() };
}
