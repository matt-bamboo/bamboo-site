type UnknownRecord = Record<string, unknown>;

const PACKET_SOURCE_DOCUMENT_LIMIT = 4;
const PACKET_SOURCE_CHARACTER_LIMIT = 12_000;

function nestedRecord(value: UnknownRecord): UnknownRecord {
  const record = value.record;
  return record && typeof record === "object" && !Array.isArray(record)
    ? record as UnknownRecord
    : {};
}

function firstValue(
  primary: UnknownRecord,
  nested: UnknownRecord,
  keys: string[],
): unknown {
  for (const key of keys) {
    const value = primary[key] ?? nested[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function compactObject(value: UnknownRecord): UnknownRecord {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) =>
      item !== undefined && item !== null && item !== ""
    ),
  );
}

function arrayOfStrings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
}

function uniqueStrings(values: unknown[]): string[] {
  return Array.from(
    new Set(values.map((value) => String(value || "").trim()).filter(Boolean)),
  );
}

export function compactJobForPacket(job: UnknownRecord): UnknownRecord {
  const record = nestedRecord(job);
  const rawPostingText = String(
    firstValue(job, record, [
      "raw_posting_text",
      "job_description_text_full",
      "full_job_description",
      "job_description_text",
      "description_text",
      "posting_text",
    ]) || "",
  ).trim();
  const parsedBrief = firstValue(job, record, ["parsed_job_brief"]);

  return compactObject({
    id: firstValue(job, record, ["id", "job_result_id", "job_id"]),
    job_result_id: firstValue(job, record, ["job_result_id", "id"]),
    company: firstValue(job, record, ["company"]),
    role_title: firstValue(job, record, ["role_title", "title"]),
    location: firstValue(job, record, ["location"]),
    department: firstValue(job, record, ["department", "team"]),
    remote_hybrid_onsite: firstValue(job, record, [
      "remote_hybrid_onsite",
      "work_style",
      "location_type",
    ]),
    official_source_url: firstValue(job, record, [
      "official_source_url",
      "ats_source_url",
      "posting_source_url",
      "source_url",
      "application_link",
    ]),
    source_name: firstValue(job, record, ["source_name"]),
    source_type: firstValue(job, record, ["source_type"]),
    source_verified_by: firstValue(job, record, ["source_verified_by"]),
    source_verification_notes: firstValue(job, record, [
      "source_verification_notes",
    ]),
    grounding_metadata_status: firstValue(job, record, [
      "grounding_metadata_status",
    ]),
    active_status: firstValue(job, record, ["active_status"]),
    link_health: firstValue(job, record, ["link_health"]),
    posting_capture_date: firstValue(job, record, [
      "posting_capture_date",
      "captured_at",
    ]),
    last_verified_at: firstValue(job, record, ["last_verified_at"]),
    company_requisition_id: firstValue(job, record, [
      "company_requisition_id",
      "external_job_id",
      "ats_job_id",
    ]),
    compensation_summary: firstValue(job, record, [
      "compensation_summary",
      "comp_notes",
    ]),
    listed_base_min: firstValue(job, record, ["listed_base_min"]),
    listed_base_max: firstValue(job, record, ["listed_base_max"]),
    listed_total_comp_notes: firstValue(job, record, [
      "listed_total_comp_notes",
    ]),
    compensation_status: firstValue(job, record, ["compensation_status"]),
    compensation_verdict: firstValue(job, record, ["compensation_verdict"]),
    location_category: firstValue(job, record, ["location_category"]),
    relocation_required: firstValue(job, record, ["relocation_required"]),
    posting_hash: firstValue(job, record, ["posting_hash"]),
    normalized_posting_hash: firstValue(job, record, [
      "normalized_posting_hash",
    ]),
    raw_posting_text: rawPostingText,
    parsed_job_brief: parsedBrief && typeof parsedBrief === "object" &&
        !Array.isArray(parsedBrief)
      ? parsedBrief
      : undefined,
  });
}

export function selectPacketCareerFacts(
  facts: UnknownRecord[],
  preferredFactIds: unknown[],
): UnknownRecord[] {
  const preferred = new Set(uniqueStrings(preferredFactIds));
  const selected = facts.filter((fact) => {
    const factId = String(fact.fact_id || fact.id || "");
    const usableFor = arrayOfStrings(fact.usable_for);
    const isResumeIdentity = String(fact.category || "") === "identity" &&
      (usableFor.includes("resume") || usableFor.includes("applications"));
    const isPreferred = preferred.has(factId);
    return String(fact.status || "") === "verified" &&
      (isPreferred || isResumeIdentity || preferred.size === 0);
  });

  return selected.slice(0, 40).map((fact) =>
    compactObject({
      fact_id: fact.fact_id || fact.id,
      category: fact.category,
      canonical_claim: fact.canonical_claim,
      approved_variants: fact.approved_variants,
      prohibited_variants: fact.prohibited_variants,
      sensitivity: fact.sensitivity,
      usable_for: fact.usable_for,
      status: fact.status,
      source_document_ids: fact.source_document_ids,
    })
  );
}

export function selectPacketResumeLanes(
  lanes: UnknownRecord[],
  selectedLaneId: unknown,
): UnknownRecord[] {
  const laneId = String(selectedLaneId || "").trim();
  if (!laneId) return lanes.slice(0, 1);
  const selected = lanes.find((lane) =>
    String(lane.id || lane.resume_lane_id || "") === laneId
  );
  return selected ? [selected] : lanes.slice(0, 1);
}

export function selectPacketSourceDocuments(
  documents: UnknownRecord[],
  preferredDocumentIds: unknown[],
): UnknownRecord[] {
  const preferred = new Set(uniqueStrings(preferredDocumentIds));
  const ranked = documents
    .map((document, index) => {
      const record = nestedRecord(document);
      const normalizedDocument: UnknownRecord = {
        ...record,
        ...document,
        content: firstValue(document, record, ["content"]),
      };
      return {
        document: normalizedDocument,
        index,
      };
    })
    .filter(({ document }) => {
      const content = String(document.content || "").trim();
      return content.length > 0 &&
        !/^placeholder source document\b/i.test(content);
    })
    .sort((a, b) => {
      const aId = String(a.document.id || "");
      const bId = String(b.document.id || "");
      const aPreferred = preferred.has(aId) ? 1 : 0;
      const bPreferred = preferred.has(bId) ? 1 : 0;
      if (aPreferred !== bPreferred) return bPreferred - aPreferred;
      const aCanon = a.document.authority_level === "canon_source" ? 1 : 0;
      const bCanon = b.document.authority_level === "canon_source" ? 1 : 0;
      if (aCanon !== bCanon) return bCanon - aCanon;
      return a.index - b.index;
    });

  const result: UnknownRecord[] = [];
  const seenContent = new Set<string>();
  let remaining = PACKET_SOURCE_CHARACTER_LIMIT;
  for (const { document } of ranked) {
    if (result.length >= PACKET_SOURCE_DOCUMENT_LIMIT || remaining <= 0) break;
    const rawContent = String(document.content || "").trim();
    const fingerprint = rawContent.toLowerCase().replace(/\s+/g, " ").slice(
      0,
      400,
    );
    if (seenContent.has(fingerprint)) continue;
    seenContent.add(fingerprint);
    const content = rawContent.slice(0, remaining);
    remaining -= content.length;
    result.push(compactObject({
      id: document.id,
      title: document.title,
      type: document.type,
      authority_level: document.authority_level,
      source_date: document.source_date,
      notes: document.notes,
      content,
    }));
  }
  return result;
}

function clampScore(value: unknown): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.min(100, numeric)) : 0;
}

export function normalizeStrategistScore(
  score: UnknownRecord,
): UnknownRecord {
  const fit = clampScore(score.fit_score);
  const qualification = clampScore(score.qualification_match_score);
  const strength = clampScore(score.qualification_strength_score);
  const mustHave = clampScore(score.must_have_coverage_score);
  const opportunity = clampScore(score.opportunity_score);
  const sendToWriter = String(score.qualification_gate || "") ===
    "send_to_writer";
  const proceedRecommendation = ["apply", "prepare_packet", "verify_first"]
    .includes(String(score.recommendation || ""));

  if (
    fit <= 5 && qualification >= 40 && sendToWriter && proceedRecommendation
  ) {
    return {
      ...score,
      fit_score: Math.round(
        qualification * 0.5 + strength * 0.2 + mustHave * 0.2 +
          opportunity * 0.1,
      ),
    };
  }
  return { ...score, fit_score: fit };
}
