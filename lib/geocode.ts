// Mapbox Geocoding v6, server-side only. Biased toward Mexico City (brief §7:
// fallback query is venue_name + "Mexico City").

export const CDMX = { lat: 19.4326, lng: -99.1332 };
export const CDMX_TZ = "America/Mexico_City";

// Greater CDMX. Results outside this box are worse than no result at all —
// an unlocated item stays editable; a pin in Toluca misleads.
const CDMX_BBOX = "-99.36,19.05,-98.85,19.65";

export interface GeocodeResult {
  lat: number;
  lng: number;
  address: string;
  confidence: "high" | "low";
}

export async function geocode(query: string): Promise<GeocodeResult | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token || !query.trim()) return null;

  const url = new URL("https://api.mapbox.com/search/geocode/v6/forward");
  url.searchParams.set("q", query);
  url.searchParams.set("access_token", token);
  url.searchParams.set("proximity", `${CDMX.lng},${CDMX.lat}`);
  url.searchParams.set("bbox", CDMX_BBOX);
  url.searchParams.set("country", "mx");
  url.searchParams.set("limit", "1");

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;

  const json = await res.json();
  const feature = json.features?.[0];
  if (!feature) return null;

  const [lng, lat] = feature.geometry.coordinates as [number, number];
  const match = feature.properties?.match_code?.confidence;
  return {
    lat,
    lng,
    address: feature.properties?.full_address ?? query,
    confidence: match === "exact" || match === "high" ? "high" : "low",
  };
}
