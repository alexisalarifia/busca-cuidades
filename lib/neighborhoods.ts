import type { Item } from "@/lib/types";

// CDMX seed (brief §8). Single source of truth for the Ask slot options and
// neighborhood progress.
export const NEIGHBORHOODS = [
  "Roma Norte",
  "Roma Sur",
  "Condesa",
  "Juárez",
  "Centro Histórico",
  "Coyoacán",
  "Polanco",
  "San Rafael",
  "Narvarte",
  "Chapultepec",
  "Doctores",
  "Escandón",
] as const;

// Derived from the address string — no column, no migration. Items whose
// address doesn't name a known colonia simply don't count toward any
// neighborhood, which is fine: this is a flavor stat, not an accounting one.
export function neighborhoodOf(item: Item): string | null {
  const haystack = `${item.address ?? ""} ${item.venue_address ?? ""}`.toLowerCase();
  if (!haystack.trim()) return null;
  for (const n of NEIGHBORHOODS) {
    if (haystack.includes(n.toLowerCase())) return n;
  }
  return null;
}

export interface NeighborhoodProgress {
  name: string;
  visited: number;
  total: number;
}

export function neighborhoodProgress(items: Item[]): NeighborhoodProgress[] {
  const map = new Map<string, NeighborhoodProgress>();
  for (const item of items) {
    const name = neighborhoodOf(item);
    if (!name) continue;
    const entry = map.get(name) ?? { name, visited: 0, total: 0 };
    entry.total += 1;
    if (item.visited) entry.visited += 1;
    map.set(name, entry);
  }
  return [...map.values()].sort(
    (a, b) => b.total - a.total || a.name.localeCompare(b.name)
  );
}
