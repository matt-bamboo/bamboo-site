const OFFICIAL_SOURCE_LABELS = new Set([
  "official",
  "ats",
  "official_ats",
  "official ats",
  "official_careers",
  "official careers",
  "official_careers_page",
  "official_careers_detail",
  "company careers",
  "careers",
]);

export type CanonicalJobSourceType =
  | "official"
  | "linkedin"
  | "aggregator"
  | "other";

export function normalizeJobSourceType(
  value: unknown,
): CanonicalJobSourceType {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[-]+/g, "_")
    .replace(/\s+/g, " ");

  if (!normalized) return "official";
  if (OFFICIAL_SOURCE_LABELS.has(normalized)) return "official";
  if (normalized.includes("linkedin")) return "linkedin";
  if (
    normalized.includes("aggregator") ||
    normalized.includes("indeed") ||
    normalized.includes("ziprecruiter") ||
    normalized.includes("glassdoor")
  ) {
    return "aggregator";
  }
  return "other";
}
