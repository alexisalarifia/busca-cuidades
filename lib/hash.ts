import { createHash } from "node:crypto";

// Dedupe key (brief §4): sha256 of normalized source text.
export function contentHash(source: string): string {
  const normalized = source.trim().replace(/\s+/g, " ").toLowerCase();
  return createHash("sha256").update(normalized).digest("hex");
}
