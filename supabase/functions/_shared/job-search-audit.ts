const DEFAULT_SAMPLE_LIMIT = 20;
const MAX_SAMPLE_TEXT_LENGTH = 360;

const AUDIT_FIELDS = [
  "id",
  "job_id",
  "external_id",
  "company",
  "role_title",
  "title",
  "location",
  "department",
  "team",
  "workplace_type",
  "remote_eligibility",
  "job_url",
  "source_url",
  "application_url",
  "posting_source_name",
  "source_type",
  "source_group",
  "posted_date",
  "salary_snippet",
  "listed_base_min",
  "listed_base_max",
  "compensation_status",
  "compensation_verdict",
  "candidate_screen_verdict",
  "candidate_screen_reason",
  "full_posting_captured",
  "parsed_job_brief_complete",
  "posting_hash",
  "active_status",
  "link_health",
  "source_verified_by",
  "grounding_metadata_status",
] as const;

export type SearchAuditSample = {
  total: number;
  sample_count: number;
  truncated: boolean;
  sample: Array<Record<string, unknown>>;
};

export function searchAuditSample(
  records: Array<Record<string, unknown>>,
  sampleLimit = DEFAULT_SAMPLE_LIMIT,
): SearchAuditSample {
  const limit = Number.isFinite(sampleLimit)
    ? Math.max(0, Math.min(50, Math.trunc(sampleLimit)))
    : DEFAULT_SAMPLE_LIMIT;
  const sample = records.slice(0, limit).map(compactSearchAuditRecord);
  return {
    total: records.length,
    sample_count: sample.length,
    truncated: records.length > sample.length,
    sample,
  };
}

export function compactSearchAuditRecord(
  record: Record<string, unknown>,
): Record<string, unknown> {
  const compact: Record<string, unknown> = {};
  for (const field of AUDIT_FIELDS) {
    const value = record[field];
    if (value === undefined || value === null || value === "") continue;
    compact[field] = typeof value === "string"
      ? truncateText(value, MAX_SAMPLE_TEXT_LENGTH)
      : value;
  }
  return compact;
}

function truncateText(value: string, maximum: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maximum) return normalized;
  return `${normalized.slice(0, maximum - 3).trimEnd()}...`;
}
