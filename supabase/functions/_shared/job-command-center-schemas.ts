export type JsonSchema = Record<string, unknown>;

const MODEL_ROLES = [
  "Gemini Scout",
  "OpenAI Strategist",
  "OpenAI Writer",
  "Gemini Critic",
  "Gemini Quality Auditor",
  "OpenAI Finalizer",
  "Workflow Orchestrator",
];
const WORKFLOW_STATUSES = [
  "queued",
  "running",
  "waiting_for_dependency",
  "waiting_for_user",
  "waiting_for_login",
  "waiting_for_approval",
  "retrying",
  "failed_validation",
  "failed_provider",
  "failed_storage",
  "failed_cost_limit",
  "failed_error_limit",
  "completed",
  "cancelled",
];
const APPROVAL_STATUSES = [
  "ready_for_review",
  "needs_manual_review",
  "approved",
  "rejected",
  "superseded",
];
export const FINALIZED_PACKET_DOCUMENT_TYPES = [
  "ats_resume",
  "executive_resume",
  "positioning_memo",
  "cover_letter",
  "recruiter_outreach",
  "hiring_manager_outreach",
  "application_answers",
  "interview_prep",
  "verification_questions",
] as const;
const LOCATION_CATEGORIES = [
  "Phoenix / Scottsdale / Tempe",
  "Arizona hybrid",
  "U.S. remote",
  "relocation optional",
  "relocation required",
  "travel-heavy",
  "unknown location flexibility",
];
const RELOCATION_VERDICTS = [
  "strong fit, no relocation issue",
  "viable, review normally",
  "possible, but needs stronger comp/scope",
  "high-friction, only advance if exceptional",
  "likely not worth relocation",
  "needs manual review",
];
const COMPENSATION_STATUSES = [
  "listed",
  "partially_listed",
  "not_listed",
  "unclear",
  "needs_verification",
];
const COMPENSATION_VERDICTS = [
  "clearly_above_threshold",
  "likely_above_threshold",
  "possibly_above_threshold",
  "unknown_but_senior_enough_to_review",
  "likely_below_threshold",
  "clearly_below_threshold",
  "needs_verification",
];

const stringSchema = { type: "string" };
const meaningfulDocumentStringSchema = { type: "string", minLength: 20 };
const meaningfulDocumentArraySchema = {
  type: "array",
  minItems: 1,
  items: { type: "string", minLength: 12 },
};
const numberSchema = { type: ["number", "null"] };
const booleanSchema = { type: "boolean" };
const stringArraySchema = { type: "array", items: stringSchema };
const nullableStringSchema = { type: ["string", "null"] };

function objectSchema(
  properties: Record<string, unknown>,
  required = Object.keys(properties),
  additionalProperties = false,
): JsonSchema {
  return {
    type: "object",
    properties,
    required,
    additionalProperties,
  };
}

function arrayOf(items: unknown): JsonSchema {
  return { type: "array", items };
}

function enumSchema(values: string[]): JsonSchema {
  return { type: "string", enum: values };
}

const sourceSchema = objectSchema({
  title: stringSchema,
  url: stringSchema,
  source_type: enumSchema([
    "official",
    "linkedin",
    "aggregator",
    "compensation",
    "other",
  ]),
  official_source: booleanSchema,
  date_checked: stringSchema,
  verification_confidence: { type: "number", minimum: 0, maximum: 1 },
});

const otherDetailSchema = objectSchema({
  detail_id: stringSchema,
  category: stringSchema,
  label: stringSchema,
  detail: stringSchema,
  importance: enumSchema(["low", "medium", "high"]),
  extracted_from: enumSchema([
    "official_job_posting",
    "official_company_page",
    "ATS_page",
    "LinkedIn",
    "aggregator",
    "manual_paste",
    "model_inference",
    "user_note",
  ]),
  source_section: nullableStringSchema,
  evidence_text: nullableStringSchema,
  confidence: { type: "number", minimum: 0, maximum: 1 },
  needs_verification: booleanSchema,
  possible_future_field: nullableStringSchema,
});

const fieldProvenanceSchema = objectSchema({
  value: { type: ["string", "number", "boolean", "array", "object", "null"] },
  extracted_from: enumSchema([
    "official_job_posting",
    "official_company_page",
    "ATS_page",
    "LinkedIn",
    "aggregator",
    "manual_paste",
    "model_inference",
    "user_note",
  ]),
  source_url: nullableStringSchema,
  source_section: nullableStringSchema,
  evidence_text: nullableStringSchema,
  confidence: { type: "number", minimum: 0, maximum: 1 },
  needs_verification: booleanSchema,
  notes: nullableStringSchema,
});

const sourceConflictSchema = objectSchema({
  conflict_id: stringSchema,
  field: stringSchema,
  official_value: nullableStringSchema,
  secondary_value: nullableStringSchema,
  conflict_summary: stringSchema,
  resolution: stringSchema,
  confidence: { type: "number", minimum: 0, maximum: 1 },
});

const questionToVerifySchema = objectSchema({
  question_id: stringSchema,
  question: stringSchema,
  why_it_matters: stringSchema,
  priority: enumSchema(["P0", "P1", "P2", "P3"]),
  owner: stringSchema,
  status: enumSchema(["open", "resolved", "deferred"]),
  source_field: nullableStringSchema,
});

const applicationRequirementsSchema = objectSchema({
  apply_url: nullableStringSchema,
  resume_required: stringSchema,
  cover_letter_required: stringSchema,
  portfolio_required: stringSchema,
  location_answer_required: stringSchema,
  work_authorization_question: stringSchema,
  salary_expectation_question: stringSchema,
  referrals_allowed: stringSchema,
  recruiter_contact_visible: stringSchema,
  application_deadline: nullableStringSchema,
  required_documents: stringArraySchema,
  visible_screening_questions: stringArraySchema,
  notes: stringSchema,
});

const contactReferralSchema = objectSchema({
  recruiter_name: nullableStringSchema,
  recruiter_url: nullableStringSchema,
  hiring_manager_name: nullableStringSchema,
  hiring_manager_url: nullableStringSchema,
  referral_targets: stringArraySchema,
  warm_intro_paths: stringArraySchema,
  contact_notes: stringSchema,
  outreach_status: stringSchema,
});

const manualOverridesSchema = objectSchema({
  matthew_notes: nullableStringSchema,
  scoring_override: nullableStringSchema,
  relocation_override: nullableStringSchema,
  packet_override: nullableStringSchema,
  hidden_from_search: booleanSchema,
  last_updated_by: nullableStringSchema,
  last_updated_at: nullableStringSchema,
});

const knockoutFlagsSchema = {
  type: "object",
  additionalProperties: booleanSchema,
};

const coverageSchema = objectSchema({
  companies_requested: stringArraySchema,
  companies_searched: stringArraySchema,
  companies_failed: stringArraySchema,
  companies_not_searched: stringArraySchema,
  role_families_requested: stringArraySchema,
  role_families_searched: stringArraySchema,
  role_families_failed: stringArraySchema,
  sources_used: stringArraySchema,
  official_sources_checked: { type: "integer" },
  linkedin_sources_checked: { type: "integer" },
  aggregator_sources_checked: { type: "integer" },
  jobs_found: { type: "integer" },
  jobs_verified: { type: "integer" },
  jobs_rejected: { type: "integer" },
  duplicates_removed: { type: "integer" },
  jobs_needing_verification: { type: "integer" },
  search_queries_executed: { type: "integer" },
  search_complete: booleanSchema,
  coverage_percent: { type: "number", minimum: 0, maximum: 100 },
  coverage_notes: stringSchema,
});

const commonProperties = {
  schema_version: { type: "string", enum: ["job-command-center-v2"] },
  run_id: stringSchema,
  job_id: nullableStringSchema,
  model_role: enumSchema(MODEL_ROLES),
  confidence: { type: "number", minimum: 0, maximum: 1 },
  approval_required_before_external_action: booleanSchema,
};

function withCommon(properties: Record<string, unknown>): JsonSchema {
  return objectSchema({ ...commonProperties, ...properties });
}

const factMatchItemSchema = objectSchema({
  job_requirement: stringSchema,
  matched_fact_id: nullableStringSchema,
  match_status: enumSchema([
    "matched",
    "gap",
    "unsupported",
    "prohibited",
    "needs_review",
  ]),
  evidence: stringSchema,
  confidence: { type: "number", minimum: 0, maximum: 1 },
});

const claimEvidenceItemSchema = objectSchema({
  claim_text: { type: "string", minLength: 3 },
  support_status: enumSchema([
    "supported",
    "unsupported",
    "prohibited",
    "needs_review",
  ]),
  matched_fact_ids: stringArraySchema,
  source_document_ids: stringArraySchema,
});

const documentEvidenceItemSchema = objectSchema({
  claim_evidence: arrayOf(claimEvidenceItemSchema),
  matched_fact_ids: stringArraySchema,
  claims_used: stringArraySchema,
  unresolved_issues: stringArraySchema,
  unsupported_claims: stringArraySchema,
  prohibited_fact_matches: stringArraySchema,
  needs_review_fact_matches: stringArraySchema,
});

const finalizedPacketDocumentEvidenceSchema = objectSchema(
  Object.fromEntries(
    FINALIZED_PACKET_DOCUMENT_TYPES.map((documentType) => [
      documentType,
      documentEvidenceItemSchema,
    ]),
  ),
);

const resumeQualityScorecardSchema = objectSchema({
  document_type: enumSchema(["ats_resume", "executive_resume"]),
  factual_integrity_score: { type: "number", minimum: 0, maximum: 20 },
  channel_structure_score: { type: "number", minimum: 0, maximum: 15 },
  direct_role_evidence_score: { type: "number", minimum: 0, maximum: 35 },
  executive_operating_proof_score: {
    type: "number",
    minimum: 0,
    maximum: 15,
  },
  human_scan_channel_fit_score: {
    type: "number",
    minimum: 0,
    maximum: 15,
  },
  total_score: { type: "number", minimum: 0, maximum: 100 },
  score_threshold: { type: "number", minimum: 85, maximum: 85 },
  factual_integrity_gate: enumSchema(["pass", "fail"]),
  quality_verdict: enumSchema(["pass", "revise", "block"]),
  rubric_evidence: {
    type: "array",
    minItems: 5,
    maxItems: 5,
    items: objectSchema({
      component: enumSchema([
        "factual_integrity_score",
        "channel_structure_score",
        "direct_role_evidence_score",
        "executive_operating_proof_score",
        "human_scan_channel_fit_score",
      ]),
      posting_quotes: {
        type: "array",
        items: { type: "string", minLength: 3 },
      },
      resume_quotes: {
        type: "array",
        minItems: 1,
        items: { type: "string", minLength: 3 },
      },
      supporting_fact_ids: stringArraySchema,
      points_awarded: { type: "number", minimum: 0, maximum: 35 },
      rationale: { type: "string", minLength: 8 },
    }),
  },
  strengths: stringArraySchema,
  findings: stringArraySchema,
  required_revisions: stringArraySchema,
});

const supportingMaterialsQualitySchema = objectSchema({
  quality_gate: enumSchema(["pass", "revise", "block"]),
  strengths: stringArraySchema,
  findings: stringArraySchema,
  required_revisions: stringArraySchema,
});

const documentQualityCheckSchema = objectSchema({
  document_type: stringSchema,
  factual_integrity_score: { type: "number", minimum: 0, maximum: 20 },
  role_specificity_score: { type: "number", minimum: 0, maximum: 25 },
  channel_structure_score: { type: "number", minimum: 0, maximum: 20 },
  evidence_strength_score: { type: "number", minimum: 0, maximum: 20 },
  human_scan_channel_fit_score: {
    type: "number",
    minimum: 0,
    maximum: 15,
  },
  total_score: { type: "number", minimum: 0, maximum: 100 },
  score_threshold: { type: "number", minimum: 85, maximum: 85 },
  factual_integrity_gate: enumSchema(["pass", "fail"]),
  quality_gate: enumSchema(["pass", "revise", "block"]),
  strengths: stringArraySchema,
  blocking_findings: stringArraySchema,
  required_revisions: stringArraySchema,
  quality_summary: stringSchema,
  approval_status: enumSchema(APPROVAL_STATUSES),
});

const jobSearchItemSchema = objectSchema({
  job_result_id: stringSchema,
  company: stringSchema,
  role_title: stringSchema,
  location: stringSchema,
  source_url: stringSchema,
  official_source_url: nullableStringSchema,
  ats_source_url: nullableStringSchema,
  linkedin_url: nullableStringSchema,
  posting_source_name: stringSchema,
  job_id_external: nullableStringSchema,
  company_job_id: nullableStringSchema,
  captured_at: stringSchema,
  last_verified_at: stringSchema,
  source_status: enumSchema([
    "official_verified",
    "ats_verified",
    "linkedin_only",
    "aggregator_only",
    "needs_manual_verification",
    "unavailable",
  ]),
  link_health: enumSchema([
    "ok",
    "redirected",
    "login_gated",
    "broken",
    "unknown",
  ]),
  posting_age_days: numberSchema,
  source_type: enumSchema(["official", "linkedin", "aggregator", "other"]),
  active_status: enumSchema([
    "verified_active",
    "needs_verification",
    "expired_or_closed",
    "login_gated",
    "unknown",
  ]),
  date_checked: stringSchema,
  compensation_bucket: enumSchema([
    "$400K+ Primary Target",
    "$250K-$400K Secondary Target",
    "Below Target / Monitor Only",
    "Unknown High Upside",
  ]),
  compensation_listed_yes_no: booleanSchema,
  listed_base_min: numberSchema,
  listed_base_max: numberSchema,
  listed_total_comp_notes: nullableStringSchema,
  estimated_comp_band: nullableStringSchema,
  estimated_comp_confidence: nullableStringSchema,
  compensation_source: nullableStringSchema,
  compensation_status: enumSchema(COMPENSATION_STATUSES),
  compensation_verdict: enumSchema(COMPENSATION_VERDICTS),
  compensation_questions_to_verify: stringArraySchema,
  estimated_total_comp_min: numberSchema,
  estimated_total_comp_max: numberSchema,
  relocation_required: booleanSchema,
  arizona_remote_ok: booleanSchema,
  location_category: enumSchema(LOCATION_CATEGORIES),
  region_preference_score: { type: "number", minimum: -100, maximum: 100 },
  relocation_friction_score: { type: "number", minimum: 0, maximum: 100 },
  relocation_threshold_adjustment: { type: "number", minimum: 0, maximum: 40 },
  compensation_adjusted_for_location: nullableStringSchema,
  family_lifestyle_considerations: nullableStringSchema,
  city_region_notes: nullableStringSchema,
  location_concerns: stringArraySchema,
  relocation_verdict: enumSchema(RELOCATION_VERDICTS),
  seniority_plausible: booleanSchema,
  raw_posting_text: stringSchema,
  parsing_model_version: stringSchema,
  scoring_model_version: stringSchema,
  career_canon_version: stringSchema,
  public_profile_version: stringSchema,
  preference_model_version: stringSchema,
  canonical_job_id: stringSchema,
  posting_hash: stringSchema,
  normalized_posting_hash: stringSchema,
  prior_posting_hash: nullableStringSchema,
  posting_changed_yes_no: booleanSchema,
  first_captured_at: stringSchema,
  last_captured_at: stringSchema,
  analysis_status: stringSchema,
  score_status: stringSchema,
  analysis_reused: booleanSchema,
  rerun_reason: stringSchema,
  analysis_cost: numberSchema,
  packet_eligibility: stringSchema,
  packet_blocked_reason: stringSchema,
  parsed_job_brief: objectSchema({
    company_about_short: nullableStringSchema,
    company_business_model: nullableStringSchema,
    company_stage_or_context: nullableStringSchema,
    role_about_short: nullableStringSchema,
    role_mandate: nullableStringSchema,
    why_they_are_hiring: nullableStringSchema,
    main_responsibilities: stringArraySchema,
    required_qualifications: stringArraySchema,
    preferred_qualifications: stringArraySchema,
    key_skills_and_keywords: stringArraySchema,
    team_context: nullableStringSchema,
    reporting_relationship: nullableStringSchema,
    stakeholders: stringArraySchema,
    success_metrics: stringArraySchema,
    location_requirements: nullableStringSchema,
    remote_eligibility: nullableStringSchema,
    travel_requirements: nullableStringSchema,
    compensation_summary: nullableStringSchema,
    equity_bonus_notes: nullableStringSchema,
    why_it_may_fit_matthew: nullableStringSchema,
    concerns_or_gaps: nullableStringSchema,
    verification_needed: stringArraySchema,
    other_details: arrayOf(otherDetailSchema),
    field_provenance: {
      type: "object",
      additionalProperties: fieldProvenanceSchema,
    },
    source_conflicts: arrayOf(sourceConflictSchema),
  }),
  other_details: arrayOf(otherDetailSchema),
  field_provenance: {
    type: "object",
    additionalProperties: fieldProvenanceSchema,
  },
  source_conflicts: arrayOf(sourceConflictSchema),
  knockout_flags: knockoutFlagsSchema,
  questions_to_verify: arrayOf(questionToVerifySchema),
  application_requirements: applicationRequirementsSchema,
  contact_referral: contactReferralSchema,
  manual_overrides: manualOverridesSchema,
  company_context: objectSchema({
    company_name: stringSchema,
    official_website: nullableStringSchema,
    careers_url: nullableStringSchema,
    company_about: nullableStringSchema,
    business_model: nullableStringSchema,
    industry: nullableStringSchema,
    company_stage: nullableStringSchema,
    public_or_private: nullableStringSchema,
    approximate_size: nullableStringSchema,
    headquarters: nullableStringSchema,
    why_company_may_interest_matthew: nullableStringSchema,
    source_links: stringArraySchema,
    last_updated_at: stringSchema,
  }),
  company_source_directory: objectSchema({
    company_id: stringSchema,
    company_name: stringSchema,
    priority_tier: enumSchema(["P0", "P1", "P2", "P3"]),
    company_group: enumSchema([
      "Highest Priority",
      "Marketplace / Commerce / Logistics",
      "Real-World Tech / Autonomous / Robotics",
      "Fintech / Financial Platforms",
      "AI / Data / Productivity Infrastructure",
      "PE-Backed / Founder-Led / Field Services",
    ]),
    official_website: nullableStringSchema,
    official_careers_home_url: nullableStringSchema,
    official_job_search_url: nullableStringSchema,
    ats_provider: nullableStringSchema,
    ats_job_url_pattern: nullableStringSchema,
    linkedin_company_url: nullableStringSchema,
    linkedin_jobs_url: nullableStringSchema,
    company_about_source_url: nullableStringSchema,
    known_location_filters: stringArraySchema,
    known_remote_filters: stringArraySchema,
    known_keyword_search_patterns: stringArraySchema,
    known_department_filters: stringArraySchema,
    known_keyword_patterns: stringArraySchema,
    target_role_families: stringArraySchema,
    source_adapter_type: enumSchema([
      "direct_html",
      "ats_greenhouse",
      "ats_lever",
      "ats_ashby",
      "ats_workday",
      "ats_smartrecruiters",
      "ats_icims",
      "js_heavy_browser_required",
      "unknown_needs_discovery",
    ]),
    capture_strategy: nullableStringSchema,
    browser_required_yes_no: enumSchema(["yes", "no", "unknown"]),
    compensation_source_notes: nullableStringSchema,
    job_posting_capture_notes: nullableStringSchema,
    navigation_notes: nullableStringSchema,
    source_confidence: enumSchema(["unverified", "low", "medium", "high"]),
    last_verified_at: nullableStringSchema,
  }),
  job_description_text: stringSchema,
  responsibilities: stringArraySchema,
  required_qualifications: stringArraySchema,
  preferred_qualifications: stringArraySchema,
  skills_keywords: stringArraySchema,
  grounding_sources: arrayOf(sourceSchema),
  grounding_metadata_status: enumSchema([
    "metadata_returned",
    "unavailable_provider_response",
    "not_requested",
    "needs_manual_verification",
  ]),
  grounding_source_urls: stringArraySchema,
  grounding_queries: stringArraySchema,
  grounding_chunks_count: { type: "integer" },
  url_context_used: booleanSchema,
  google_search_used: booleanSchema,
  source_verified_by: enumSchema([
    "google_grounding",
    "url_context",
    "official_url_capture",
    "manual_review_needed",
    "not_verified",
  ]),
  source_verification_notes: stringSchema,
  verification_confidence: { type: "number", minimum: 0, maximum: 1 },
  rejection_reason: nullableStringSchema,
});

export const JOB_COMMAND_CENTER_SCHEMAS: Record<string, JsonSchema> = {
  job_search_result: withCommon({
    result: jobSearchItemSchema,
    grounding_metadata: objectSchema({
      webSearchQueries: stringArraySchema,
      groundingChunks: {
        type: "array",
        items: { type: "object", additionalProperties: true },
      },
      groundingSupports: {
        type: "array",
        items: { type: "object", additionalProperties: true },
      },
      urlContextMetadata: {
        type: ["object", "null"],
        additionalProperties: true,
      },
    }),
    grounding_metadata_status: enumSchema([
      "metadata_returned",
      "unavailable_provider_response",
      "not_requested",
      "needs_manual_verification",
    ]),
    grounding_source_urls: stringArraySchema,
    grounding_queries: stringArraySchema,
    grounding_chunks_count: { type: "integer" },
    url_context_used: booleanSchema,
    google_search_used: booleanSchema,
    source_verified_by: enumSchema([
      "google_grounding",
      "url_context",
      "official_url_capture",
      "manual_review_needed",
      "not_verified",
    ]),
    source_verification_notes: stringSchema,
  }),
  search_run: withCommon({
    search_run_id: stringSchema,
    status: enumSchema(["partial", "complete", "failed", "needs_verification"]),
    results: arrayOf(jobSearchItemSchema),
    coverage: coverageSchema,
    webSearchQueries: stringArraySchema,
    groundingChunks: {
      type: "array",
      items: { type: "object", additionalProperties: true },
    },
    groundingSupports: {
      type: "array",
      items: { type: "object", additionalProperties: true },
    },
    urlContextMetadata: {
      type: ["object", "null"],
      additionalProperties: true,
    },
    grounding_metadata_status: enumSchema([
      "metadata_returned",
      "unavailable_provider_response",
      "not_requested",
      "needs_manual_verification",
    ]),
    grounding_source_urls: stringArraySchema,
    grounding_queries: stringArraySchema,
    grounding_chunks_count: { type: "integer" },
    url_context_used: booleanSchema,
    google_search_used: booleanSchema,
    source_verified_by: enumSchema([
      "google_grounding",
      "url_context",
      "official_url_capture",
      "manual_review_needed",
      "not_verified",
    ]),
    source_verification_notes: stringSchema,
    sources: arrayOf(sourceSchema),
    estimated_api_cost: numberSchema,
    actual_api_cost: numberSchema,
  }),
  job_analysis: withCommon({
    fit_score: { type: "number", minimum: 0, maximum: 10 },
    opportunity_score: { type: "number", minimum: 0, maximum: 100 },
    confidence_score: { type: "number", minimum: 0, maximum: 100 },
    qualification_match_score: { type: "number", minimum: 0, maximum: 100 },
    qualification_strength_score: { type: "number", minimum: 0, maximum: 100 },
    must_have_coverage_score: { type: "number", minimum: 0, maximum: 100 },
    qualification_gap_risk_score: { type: "number", minimum: 0, maximum: 100 },
    qualification_strengths: stringArraySchema,
    transferable_qualifications: stringArraySchema,
    qualification_gaps: stringArraySchema,
    qualification_unknowns: stringArraySchema,
    qualification_summary: stringSchema,
    location_category: enumSchema(LOCATION_CATEGORIES),
    region_preference_score: { type: "number", minimum: -100, maximum: 100 },
    relocation_required: booleanSchema,
    relocation_friction_score: { type: "number", minimum: 0, maximum: 100 },
    relocation_threshold_adjustment: {
      type: "number",
      minimum: 0,
      maximum: 40,
    },
    compensation_adjusted_for_location: nullableStringSchema,
    compensation_listed_yes_no: booleanSchema,
    listed_base_min: numberSchema,
    listed_base_max: numberSchema,
    listed_total_comp_notes: nullableStringSchema,
    estimated_comp_band: nullableStringSchema,
    estimated_comp_confidence: nullableStringSchema,
    compensation_source: nullableStringSchema,
    compensation_status: enumSchema(COMPENSATION_STATUSES),
    compensation_verdict: enumSchema(COMPENSATION_VERDICTS),
    compensation_questions_to_verify: stringArraySchema,
    family_lifestyle_considerations: nullableStringSchema,
    city_region_notes: nullableStringSchema,
    location_concerns: stringArraySchema,
    relocation_verdict: enumSchema(RELOCATION_VERDICTS),
    recommendation: enumSchema([
      "apply",
      "prepare_packet",
      "verify_first",
      "watch",
      "pass",
    ]),
    qualification_gate: enumSchema([
      "send_to_writer",
      "approval_inbox_only",
      "verify_first",
      "pass",
    ]),
    resume_lane_id: stringSchema,
    resume_lane_name: stringSchema,
    matched_fact_ids: stringArraySchema,
    claims_used: stringArraySchema,
    unsupported_claims: stringArraySchema,
    prohibited_fact_matches: stringArraySchema,
    needs_review_fact_matches: stringArraySchema,
    requirement_fact_matches: arrayOf(factMatchItemSchema),
    gaps: stringArraySchema,
    risks: stringArraySchema,
    facts_to_emphasize: stringArraySchema,
    facts_to_reduce: stringArraySchema,
    next_steps: stringArraySchema,
  }),
  fact_match: withCommon({
    matches: arrayOf(factMatchItemSchema),
    matched_fact_ids: stringArraySchema,
    claims_used: stringArraySchema,
    qualification_match_score: { type: "number", minimum: 0, maximum: 100 },
    qualification_strength_score: { type: "number", minimum: 0, maximum: 100 },
    must_have_coverage_score: { type: "number", minimum: 0, maximum: 100 },
    qualification_gap_risk_score: { type: "number", minimum: 0, maximum: 100 },
    qualification_strengths: stringArraySchema,
    transferable_qualifications: stringArraySchema,
    qualification_gaps: stringArraySchema,
    qualification_unknowns: stringArraySchema,
    qualification_summary: stringSchema,
    unsupported_claims: stringArraySchema,
    prohibited_fact_matches: stringArraySchema,
    needs_review_fact_matches: stringArraySchema,
  }),
  resume_lane_recommendation: withCommon({
    lane_id: stringSchema,
    lane_name: stringSchema,
    rationale: stringSchema,
    fit_score: { type: "number", minimum: 0, maximum: 10 },
    matched_fact_ids: stringArraySchema,
    gaps: stringArraySchema,
  }),
  resume_packet: withCommon({
    lane_id: stringSchema,
    matched_fact_ids: stringArraySchema,
    claims_used: stringArraySchema,
    unsupported_claims: stringArraySchema,
    prohibited_fact_matches: stringArraySchema,
    needs_review_fact_matches: stringArraySchema,
    resume_tailoring_plan: stringArraySchema,
    resume_summary: stringSchema,
    experience_bullets: stringArraySchema,
    skills_keywords: stringArraySchema,
    approval_status: enumSchema(APPROVAL_STATUSES),
  }),
  outreach_packet: withCommon({
    matched_fact_ids: stringArraySchema,
    claims_used: stringArraySchema,
    unsupported_claims: stringArraySchema,
    prohibited_fact_matches: stringArraySchema,
    needs_review_fact_matches: stringArraySchema,
    recruiter_dm: stringSchema,
    hiring_manager_dm: stringSchema,
    warm_intro_note: stringSchema,
    follow_up_note: stringSchema,
    approval_status: enumSchema(APPROVAL_STATUSES),
  }),
  cover_letter: withCommon({
    matched_fact_ids: stringArraySchema,
    claims_used: stringArraySchema,
    unsupported_claims: stringArraySchema,
    prohibited_fact_matches: stringArraySchema,
    needs_review_fact_matches: stringArraySchema,
    cover_letter: stringSchema,
    approval_status: enumSchema(APPROVAL_STATUSES),
  }),
  application_plan: withCommon({
    matched_fact_ids: stringArraySchema,
    claims_used: stringArraySchema,
    unsupported_claims: stringArraySchema,
    prohibited_fact_matches: stringArraySchema,
    needs_review_fact_matches: stringArraySchema,
    verification_checklist: stringArraySchema,
    tailoring_tasks: stringArraySchema,
    outreach_plan: stringArraySchema,
    browser_agent_stop_points: stringArraySchema,
    next_actions: stringArraySchema,
    approval_status: enumSchema(APPROVAL_STATUSES),
  }),
  interview_prep: withCommon({
    matched_fact_ids: stringArraySchema,
    claims_used: stringArraySchema,
    unsupported_claims: stringArraySchema,
    prohibited_fact_matches: stringArraySchema,
    needs_review_fact_matches: stringArraySchema,
    likely_questions: stringArraySchema,
    story_bank: stringArraySchema,
    gaps_to_prepare: stringArraySchema,
    questions_to_ask: stringArraySchema,
    follow_up_note: stringSchema,
    approval_status: enumSchema(APPROVAL_STATUSES),
  }),
  decision_memo: withCommon({
    matched_fact_ids: stringArraySchema,
    claims_used: stringArraySchema,
    unsupported_claims: stringArraySchema,
    prohibited_fact_matches: stringArraySchema,
    needs_review_fact_matches: stringArraySchema,
    pros: stringArraySchema,
    cons: stringArraySchema,
    compensation_notes: stringSchema,
    lifestyle_notes: stringSchema,
    risk_notes: stringSchema,
    recommendation: enumSchema(["pursue", "watch", "pass", "needs_more_info"]),
    approval_status: enumSchema(APPROVAL_STATUSES),
  }),
  critique: withCommon({
    critique_items: arrayOf(objectSchema({
      severity: enumSchema(["blocker", "major", "minor"]),
      issue: stringSchema,
      evidence: stringSchema,
      recommended_fix: stringSchema,
      blocks_finalization: booleanSchema,
    })),
    unsupported_claims: stringArraySchema,
    prohibited_fact_matches: stringArraySchema,
    needs_review_fact_matches: stringArraySchema,
    missing_requirements: stringArraySchema,
    generic_language: stringArraySchema,
    approval_status: enumSchema(APPROVAL_STATUSES),
  }),
  final_quality_check: withCommon({
    ats_resume: resumeQualityScorecardSchema,
    executive_resume: resumeQualityScorecardSchema,
    supporting_materials: supportingMaterialsQualitySchema,
    score_threshold: { type: "number", minimum: 85, maximum: 85 },
    factual_integrity_gate: enumSchema(["pass", "fail"]),
    quality_gate: enumSchema(["pass", "revise", "block"]),
    blocking_findings: stringArraySchema,
    required_revisions: stringArraySchema,
    quality_summary: stringSchema,
  }),
  document_quality_check: withCommon(
    documentQualityCheckSchema.properties as Record<string, JsonSchema>,
  ),
  finalized_packet: withCommon({
    accepted_critique_items: stringArraySchema,
    rejected_critique_items: stringArraySchema,
    ats_resume: meaningfulDocumentStringSchema,
    executive_resume: meaningfulDocumentStringSchema,
    positioning_memo: meaningfulDocumentStringSchema,
    cover_letter: meaningfulDocumentStringSchema,
    recruiter_outreach: meaningfulDocumentStringSchema,
    hiring_manager_outreach: meaningfulDocumentStringSchema,
    interview_prep: meaningfulDocumentStringSchema,
    verification_questions: meaningfulDocumentArraySchema,
    final_resume_summary: stringSchema,
    final_resume_bullets: stringArraySchema,
    final_cover_letter: stringSchema,
    final_recruiter_dm: stringSchema,
    final_hiring_manager_dm: stringSchema,
    application_answers: meaningfulDocumentArraySchema,
    document_evidence: finalizedPacketDocumentEvidenceSchema,
    matched_fact_ids: stringArraySchema,
    claims_used: stringArraySchema,
    unresolved_issues: stringArraySchema,
    unsupported_claims: stringArraySchema,
    prohibited_fact_matches: stringArraySchema,
    needs_review_fact_matches: stringArraySchema,
    approval_status: enumSchema(APPROVAL_STATUSES),
  }),
  document_revision: withCommon({
    document_type: stringSchema,
    revised_content: stringSchema,
    change_summary: stringArraySchema,
    factual_change_summary: stringArraySchema,
    claim_evidence: arrayOf(claimEvidenceItemSchema),
    claim_evidence_complete: booleanSchema,
    factual_claim_count: { type: "integer", minimum: 0 },
    matched_fact_ids: stringArraySchema,
    applied_rule_ids: stringArraySchema,
    unresolved_feedback: stringArraySchema,
    unsupported_claims: stringArraySchema,
    prohibited_fact_matches: stringArraySchema,
    needs_review_fact_matches: stringArraySchema,
    approval_status: enumSchema(APPROVAL_STATUSES),
  }),
  ranked_recommendations: withCommon({
    recommendations: arrayOf(objectSchema({
      job_id: nullableStringSchema,
      company: stringSchema,
      role_title: stringSchema,
      rank: { type: "integer" },
      recommendation: enumSchema([
        "apply",
        "prepare_packet",
        "verify_first",
        "watch",
        "pass",
      ]),
      rationale: stringSchema,
      next_action: stringSchema,
      matched_fact_ids: stringArraySchema,
      confidence: { type: "number", minimum: 0, maximum: 1 },
    })),
    top_actions_today: stringArraySchema,
    verify_first_roles: stringArraySchema,
    skip_roles: stringArraySchema,
  }),
  agent_run: withCommon({
    workflow_type: stringSchema,
    status: enumSchema(WORKFLOW_STATUSES),
    current_step: stringSchema,
    total_steps: { type: "integer" },
    error_message: nullableStringSchema,
  }),
  agent_step: withCommon({
    step_type: stringSchema,
    status: enumSchema(WORKFLOW_STATUSES),
    provider: nullableStringSchema,
    attempt_count: { type: "integer" },
    error_message: nullableStringSchema,
  }),
  approval_item: withCommon({
    item_type: stringSchema,
    title: stringSchema,
    status: enumSchema(APPROVAL_STATUSES),
    matched_fact_ids: stringArraySchema,
    quality_flags: stringArraySchema,
    content: stringSchema,
  }),
  browser_task: withCommon({
    title: stringSchema,
    status: enumSchema([
      "prepared",
      "waiting_for_user",
      "blocked",
      "completed",
      "cancelled",
    ]),
    stop_point: stringSchema,
    steps: stringArraySchema,
    approval_status: enumSchema(APPROVAL_STATUSES),
  }),
};

const ACTION_TO_SCHEMA: Record<string, string> = {
  "gemini-scout": "search_run",
  "gemini-search-extract": "search_run",
  "run-market-sweep": "search_run",
  "start-controlled-search": "search_run",
  "search-worker": "search_run",
  "verify-job-source": "job_search_result",
  "dedupe-search-results": "search_run",
  "match-job-to-canon": "fact_match",
  "score-job": "job_analysis",
  "rank-role": "job_analysis",
  "openai-strategist": "job_analysis",
  "prepare-qualified-targets": "ranked_recommendations",
  "prepare-top-targets": "ranked_recommendations",
  "rank-current-view": "ranked_recommendations",
  "generate-ranked-recommendations": "ranked_recommendations",
  "resume-packet": "resume_packet",
  "outreach-packet": "outreach_packet",
  "cover-letter": "cover_letter",
  "application-plan": "application_plan",
  "interview-prep": "interview_prep",
  "decision-memo": "decision_memo",
  "openai-writer": "finalized_packet",
  "generate-application-packet": "finalized_packet",
  "prepare-application-packet": "finalized_packet",
  "critique-application-packet": "critique",
  "gemini-critique": "critique",
  "gemini-final-quality-check": "final_quality_check",
  "gemini-document-quality-check": "document_quality_check",
  "finalize-application-packet": "finalized_packet",
  "openai-finalizer": "finalized_packet",
  "revise-document": "document_revision",
  "advance-workflow": "agent_run",
  "retry-workflow-step": "agent_step",
  "cancel-workflow": "agent_run",
  "workflow-status": "agent_run",
};

export function schemaNameForAction(action: string): string {
  return ACTION_TO_SCHEMA[action] || "job_analysis";
}

export function schemaForAction(action: string): JsonSchema {
  return JOB_COMMAND_CENTER_SCHEMAS[schemaNameForAction(action)] ||
    JOB_COMMAND_CENTER_SCHEMAS.job_analysis;
}

export function allSchemaNames(): string[] {
  return Object.keys(JOB_COMMAND_CENTER_SCHEMAS);
}

export function validateAgainstSchema(
  value: unknown,
  schema: JsonSchema,
): string[] {
  const errors: string[] = [];
  validateValue(value, schema, "$", errors);
  return errors;
}

function validateValue(
  value: unknown,
  schema: Record<string, unknown>,
  path: string,
  errors: string[],
) {
  if (schema.anyOf && Array.isArray(schema.anyOf)) {
    const nestedErrors = schema.anyOf.map((candidate) => {
      const candidateErrors: string[] = [];
      validateValue(
        value,
        candidate as Record<string, unknown>,
        path,
        candidateErrors,
      );
      return candidateErrors;
    });
    if (!nestedErrors.some((candidate) => candidate.length === 0)) {
      errors.push(`${path} did not match any allowed shape`);
    }
    return;
  }
  if (schema.oneOf && Array.isArray(schema.oneOf)) {
    const nestedErrors = schema.oneOf.map((candidate) => {
      const candidateErrors: string[] = [];
      validateValue(
        value,
        candidate as Record<string, unknown>,
        path,
        candidateErrors,
      );
      return candidateErrors;
    });
    if (!nestedErrors.some((candidate) => candidate.length === 0)) {
      errors.push(`${path} did not match any allowed shape`);
    }
    return;
  }

  const allowedTypes = Array.isArray(schema.type)
    ? schema.type.map(String)
    : [String(schema.type || "")];
  if (allowedTypes.length && allowedTypes[0]) {
    const actual = jsonType(value);
    const typeMatches = allowedTypes.includes(actual) ||
      (actual === "integer" && allowedTypes.includes("number"));
    if (!typeMatches) {
      errors.push(
        `${path} expected ${allowedTypes.join("|")} but received ${actual}`,
      );
      return;
    }
  }

  if (
    schema.enum && Array.isArray(schema.enum) &&
    !schema.enum.includes(value as never)
  ) {
    errors.push(`${path} expected one of ${schema.enum.join(", ")}`);
  }

  if (typeof value === "string" && typeof schema.minLength === "number") {
    if (value.length < schema.minLength) {
      errors.push(`${path} expected at least ${schema.minLength} characters`);
    }
  }

  if (jsonType(value) === "object") {
    const record = value as Record<string, unknown>;
    const required = Array.isArray(schema.required)
      ? schema.required.map(String)
      : [];
    required.forEach((key) => {
      if (!(key in record)) errors.push(`${path}.${key} is required`);
    });
    const properties =
      (schema.properties && typeof schema.properties === "object")
        ? schema.properties as Record<string, unknown>
        : {};
    if (schema.additionalProperties === false) {
      Object.keys(record).forEach((key) => {
        if (!(key in properties)) errors.push(`${path}.${key} is not allowed`);
      });
    }
    Object.entries(properties).forEach(([key, childSchema]) => {
      if (key in record) {
        validateValue(
          record[key],
          childSchema as Record<string, unknown>,
          `${path}.${key}`,
          errors,
        );
      }
    });
  }

  if (jsonType(value) === "array" && schema.items && Array.isArray(value)) {
    if (
      typeof schema.minItems === "number" && value.length < schema.minItems
    ) {
      errors.push(`${path} expected at least ${schema.minItems} items`);
    }
    value.forEach((item, index) =>
      validateValue(
        item,
        schema.items as Record<string, unknown>,
        `${path}[${index}]`,
        errors,
      )
    );
  }
}

function jsonType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (Number.isInteger(value)) return "integer";
  const type = typeof value;
  if (type === "number") return "number";
  if (type === "boolean") return "boolean";
  if (type === "string") return "string";
  return "object";
}
