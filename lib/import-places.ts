// Parsers for Google Maps list exports (brief §11): KML (My Maps / shared
// lists), GeoJSON (Takeout "Saved Places.json"), and CSV (Takeout saved
// lists — Title,Note,URL, no coordinates). Kept dependency-free on purpose.

export interface ImportedPlace {
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  note: string | null;
  raw: string;
}

export function detectFormat(text: string): "kml" | "geojson" | "csv" {
  const t = text.trimStart();
  if (t.startsWith("<?xml") || t.startsWith("<kml")) return "kml";
  if (t.startsWith("{") || t.startsWith("[")) return "geojson";
  return "csv";
}

export function parsePlaces(text: string): ImportedPlace[] {
  switch (detectFormat(text)) {
    case "kml":
      return parseKml(text);
    case "geojson":
      return parseGeoJson(text);
    case "csv":
      return parseCsv(text);
  }
}

function decodeXml(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .trim();
}

function parseKml(text: string): ImportedPlace[] {
  const places: ImportedPlace[] = [];
  const placemarks = text.match(/<Placemark[\s\S]*?<\/Placemark>/g) ?? [];
  for (const pm of placemarks) {
    const name = decodeXml(pm.match(/<name>([\s\S]*?)<\/name>/)?.[1] ?? "");
    const address = pm.match(/<address>([\s\S]*?)<\/address>/)?.[1];
    const coords = pm.match(/<coordinates>([\s\S]*?)<\/coordinates>/)?.[1];
    let lat: number | null = null;
    let lng: number | null = null;
    if (coords) {
      const [lngStr, latStr] = coords.trim().split(",");
      lng = Number(lngStr);
      lat = Number(latStr);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) lat = lng = null;
    }
    if (!name && lat == null) continue;
    places.push({
      name: name || "Imported place",
      address: address ? decodeXml(address) : null,
      lat,
      lng,
      note: null,
      raw: pm,
    });
  }
  return places;
}

interface GeoJsonFeature {
  geometry?: { type?: string; coordinates?: number[] };
  properties?: {
    name?: string;
    Title?: string;
    address?: string;
    location?: { name?: string; address?: string };
    google_maps_url?: string;
    Comment?: string;
  };
}

function parseGeoJson(text: string): ImportedPlace[] {
  let json: { features?: GeoJsonFeature[] };
  try {
    json = JSON.parse(text);
  } catch {
    return [];
  }
  const features = json.features ?? [];
  const places: ImportedPlace[] = [];
  for (const f of features) {
    const p = f.properties ?? {};
    const name = p.location?.name ?? p.Title ?? p.name ?? "";
    const address = p.location?.address ?? p.address ?? null;
    let lat: number | null = null;
    let lng: number | null = null;
    if (f.geometry?.type === "Point" && f.geometry.coordinates?.length === 2) {
      [lng, lat] = f.geometry.coordinates;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) lat = lng = null;
    }
    if (!name && lat == null) continue;
    places.push({
      name: name || "Imported place",
      address,
      lat,
      lng,
      note: p.Comment ?? null,
      raw: JSON.stringify(f),
    });
  }
  return places;
}

// Minimal CSV with quoted-field support; header row expected.
function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f !== "")) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  row.push(field);
  if (row.some((f) => f !== "")) rows.push(row);
  return rows;
}

function parseCsv(text: string): ImportedPlace[] {
  const rows = parseCsvRows(text);
  if (rows.length < 2) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const titleIdx = header.findIndex((h) => h === "title" || h === "name");
  const noteIdx = header.findIndex((h) => h === "note" || h === "comment");
  if (titleIdx === -1) return [];

  return rows.slice(1).flatMap((row) => {
    const name = (row[titleIdx] ?? "").trim();
    if (!name) return [];
    return [
      {
        name,
        address: null,
        lat: null,
        lng: null,
        note: noteIdx >= 0 ? (row[noteIdx] ?? "").trim() || null : null,
        raw: row.join(","),
      },
    ];
  });
}
