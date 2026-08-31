import {
  assert,
  assertEquals,
  assertRejects,
  assertThrows,
} from "jsr:@std/assert@1";
import {
  actionCreatesManualReviewApproval,
  aggregateProviderUsage,
  type ApplicationPacketStepClaimStore,
  type ApplicationPacketStepPlanStore,
  buildApplicationPacketStepPlanRows,
  buildFinalizedRoleKitDocumentRows,
  canReplayDeferredFinalQualityStep,
  claimApplicationPacketStepOnce,
  currentWorkflowArtifactOutput,
  directAiWorkflowRunSeed,
  documentChannelContract,
  ensureApplicationPacketStepPlanOnce,
  FINAL_ROLE_KIT_QUALITY_THRESHOLD,
  finalQualityCheckPacketBody,
  finalRoleKitReleaseReady,
  geminiRequestBody,
  normalizeCanonMatchOutput,
  normalizeDocumentQualityAssessment,
  normalizeFinalizedPacketEvidence,
  normalizeFinalRoleKitQualityAssessment,
  persistFinalizedRoleKitBeforeApproval,
  providerRequestsRecordedForStep,
  providerRetryCallLimitAllowance,
  replayBodyForRetry,
  retryWindowForFailedStep,
  roleKitDocumentContract,
  savedValidationRepairRetryWindow,
  shouldFallbackGeminiSchema,
  staleActionableRoleKitApprovals,
  stalePreparedBrowserTasks,
  strategistQualificationAssessment,
  validateDocumentQualityAssessment,
  validateDocumentRevisionIntegrity,
  validateFinalizedRoleKitIntegrity,
  validateFinalRoleKitQualityAssessment,
  validateSavedProviderArtifact,
} from "./job-command-center-ai.ts";
import {
  FINALIZED_PACKET_DOCUMENT_TYPES,
  JOB_COMMAND_CENTER_SCHEMAS,
  validateAgainstSchema,
} from "./job-command-center-schemas.ts";

type ClaimEvidence = {
  claim_text: string;
  support_status: "supported" | "unsupported" | "prohibited" | "needs_review";
  matched_fact_ids: string[];
  source_document_ids: string[];
};

type Evidence = {
  claim_evidence: ClaimEvidence[];
  matched_fact_ids: string[];
  claims_used: string[];
  unresolved_issues: string[];
  unsupported_claims: string[];
  prohibited_fact_matches: string[];
  needs_review_fact_matches: string[];
};

function claimEvidence(
  claimText: string,
  supportStatus: ClaimEvidence["support_status"] = "supported",
  matchedFactIds: string[] = [],
  sourceDocumentIds: string[] = [],
): ClaimEvidence {
  return {
    claim_text: claimText,
    support_status: supportStatus,
    matched_fact_ids: matchedFactIds,
    source_document_ids: sourceDocumentIds,
  };
}

function evidence(overrides: Partial<Evidence> = {}): Evidence {
  const claims = overrides.claim_evidence || [];
  return {
    matched_fact_ids: Array.from(
      new Set(claims.flatMap((claim) => claim.matched_fact_ids)),
    ),
    claims_used: Array.from(new Set(claims.map((claim) => claim.claim_text))),
    unresolved_issues: [],
    unsupported_claims: claims
      .filter((claim) => claim.support_status === "unsupported")
      .map((claim) => claim.claim_text),
    prohibited_fact_matches: claims
      .filter((claim) => claim.support_status === "prohibited")
      .map((claim) => claim.claim_text),
    needs_review_fact_matches: claims
      .filter((claim) => claim.support_status === "needs_review")
      .map((claim) => claim.claim_text),
    ...overrides,
    claim_evidence: claims,
  };
}

function completeDocumentEvidence(): Record<string, Evidence> {
  return Object.fromEntries(
    FINALIZED_PACKET_DOCUMENT_TYPES.map((documentType) => [
      documentType,
      evidence(),
    ]),
  );
}

Deno.test("direct AI actions seed one durable lineage run without copying private payloads", () => {
  const seed = directAiWorkflowRunSeed(
    "revision-feedback-123",
    "revise-document",
    {
      job: { id: "job-openai", company: "Example" },
      profile: "must not be copied into workflow lineage",
      resumeBank: { content: "private resume content" },
    },
    "2026-07-15T15:00:00.000Z",
  );

  assertEquals(seed.id, "revision-feedback-123");
  assertEquals(seed.workflow_type, "revise-document");
  assertEquals(seed.status, "running");
  assertEquals(seed.current_step, "revise-document");
  assertEquals(seed.total_steps, 1);
  assertEquals(seed.job_id, "job-openai");
  assertEquals(seed.started_at, "2026-07-15T15:00:00.000Z");
  assertEquals(seed.input_record, {
    direct_ai_action: true,
    action: "revise-document",
    job_id: "job-openai",
  });
  assert(!JSON.stringify(seed).includes("private resume content"));
  assert(!JSON.stringify(seed).includes("must not be copied"));
});

function finalizedPacketFixture(): Record<string, unknown> {
  return {
    schema_version: "job-command-center-v2",
    run_id: "run-integrity",
    job_id: "job-integrity",
    model_role: "OpenAI Finalizer",
    confidence: 0.9,
    approval_required_before_external_action: true,
    accepted_critique_items: [],
    rejected_critique_items: [],
    ats_resume: "Role-specific ATS resume content ready for internal review.",
    executive_resume:
      "Role-specific executive resume content ready for internal review.",
    positioning_memo:
      "Internal positioning memo content ready for careful review.",
    cover_letter:
      "Role-specific cover letter content ready for internal review.",
    recruiter_outreach:
      "Concise recruiter outreach content ready for internal review.",
    hiring_manager_outreach:
      "Concise hiring-manager outreach content ready for internal review.",
    interview_prep:
      "Role-specific interview preparation content ready for review.",
    verification_questions: ["What is the confirmed reporting relationship?"],
    final_resume_summary: "Summary",
    final_resume_bullets: ["Grounded bullet"],
    final_cover_letter: "Cover letter",
    final_recruiter_dm: "Recruiter outreach",
    final_hiring_manager_dm: "Hiring-manager outreach",
    application_answers: ["Grounded application answer ready for review."],
    document_evidence: completeDocumentEvidence(),
    matched_fact_ids: [],
    claims_used: [],
    unresolved_issues: [],
    unsupported_claims: [],
    prohibited_fact_matches: [],
    needs_review_fact_matches: [],
    approval_status: "ready_for_review",
  };
}

function resumeQualityScorecard(
  documentType: "ats_resume" | "executive_resume",
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  const scorecard: Record<string, unknown> = {
    document_type: documentType,
    factual_integrity_score: 20,
    channel_structure_score: 14,
    direct_role_evidence_score: 32,
    executive_operating_proof_score: 14,
    human_scan_channel_fit_score: 13,
    total_score: 93,
    score_threshold: FINAL_ROLE_KIT_QUALITY_THRESHOLD,
    factual_integrity_gate: "pass",
    quality_verdict: "pass",
    strengths: ["Direct evidence is prominent."],
    findings: [],
    required_revisions: [],
    ...overrides,
  };
  scorecard.rubric_evidence = overrides.rubric_evidence || [
    {
      component: "factual_integrity_score",
      posting_quotes: [],
      resume_quotes: ["Role-specific"],
      supporting_fact_ids: [`cf-${documentType}`],
      points_awarded: scorecard.factual_integrity_score,
      rationale: "The cited claims are tied to approved evidence.",
    },
    {
      component: "channel_structure_score",
      posting_quotes: [],
      resume_quotes: ["resume content"],
      supporting_fact_ids: [],
      points_awarded: scorecard.channel_structure_score,
      rationale: "The structure follows the expected resume channel.",
    },
    {
      component: "direct_role_evidence_score",
      posting_quotes: ["Show directly relevant operating evidence."],
      resume_quotes: ["Role-specific"],
      supporting_fact_ids: [`cf-${documentType}`],
      points_awarded: scorecard.direct_role_evidence_score,
      rationale: "Direct operating evidence is prominent and specific.",
    },
    {
      component: "executive_operating_proof_score",
      posting_quotes: ["Show leadership scope and operating proof."],
      resume_quotes: ["internal review"],
      supporting_fact_ids: [`cf-${documentType}`],
      points_awarded: scorecard.executive_operating_proof_score,
      rationale: "The resume supplies verified executive operating proof.",
    },
    {
      component: "human_scan_channel_fit_score",
      posting_quotes: [],
      resume_quotes: ["ready for internal review"],
      supporting_fact_ids: [],
      points_awarded: scorecard.human_scan_channel_fit_score,
      rationale: "The document is concise and easy for a human to scan.",
    },
  ];
  return scorecard;
}

function finalQualityFixture(): Record<string, unknown> {
  return {
    schema_version: "job-command-center-v2",
    run_id: "run-integrity",
    job_id: "job-integrity",
    model_role: "Gemini Quality Auditor",
    confidence: 0.9,
    approval_required_before_external_action: true,
    ats_resume: resumeQualityScorecard("ats_resume"),
    executive_resume: resumeQualityScorecard("executive_resume"),
    supporting_materials: {
      quality_gate: "pass",
      strengths: ["Supporting materials are role specific."],
      findings: [],
      required_revisions: [],
    },
    score_threshold: FINAL_ROLE_KIT_QUALITY_THRESHOLD,
    factual_integrity_gate: "pass",
    quality_gate: "pass",
    blocking_findings: [],
    required_revisions: [],
    quality_summary: "Both resume channels and supporting materials pass.",
  };
}

function finalQualityAuditContextFixture() {
  return {
    verifiedJob: {
      raw_posting_text:
        "Show directly relevant operating evidence. Show leadership scope and operating proof.",
    },
    approvedCareerFacts: [
      {
        fact_id: "cf-ats_resume",
        status: "verified",
        usable_for: ["resume"],
      },
      {
        fact_id: "cf-executive_resume",
        status: "verified",
        usable_for: ["resume"],
      },
    ],
    finalizer: finalizedPacketFixture(),
  };
}

function documentRevisionFixture(): Record<string, unknown> {
  const supportedClaim = "I led verified operations";
  return {
    schema_version: "job-command-center-v2",
    run_id: "run-revision-integrity",
    job_id: "job-integrity",
    model_role: "OpenAI Writer",
    confidence: 0.9,
    approval_required_before_external_action: true,
    document_type: "ats_resume",
    revised_content:
      `${supportedClaim} in a source-backed role-specific resume.`,
    change_summary: ["Tightened the operating evidence."],
    factual_change_summary: [],
    claim_evidence: [
      claimEvidence(supportedClaim, "supported", ["cf-ats"], [
        "source-ats",
      ]),
    ],
    claim_evidence_complete: true,
    factual_claim_count: 1,
    matched_fact_ids: ["cf-ats"],
    applied_rule_ids: [],
    unresolved_feedback: [],
    unsupported_claims: [],
    prohibited_fact_matches: [],
    needs_review_fact_matches: [],
    approval_status: "ready_for_review",
  };
}

function documentQualityFixture(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    schema_version: "job-command-center-v2",
    run_id: "run-document-quality",
    job_id: "job-integrity",
    model_role: "Gemini Quality Auditor",
    confidence: 0.9,
    approval_required_before_external_action: true,
    document_type: "ats_resume",
    factual_integrity_score: 20,
    role_specificity_score: 23,
    channel_structure_score: 18,
    evidence_strength_score: 19,
    human_scan_channel_fit_score: 14,
    total_score: 94,
    score_threshold: FINAL_ROLE_KIT_QUALITY_THRESHOLD,
    factual_integrity_gate: "pass",
    quality_gate: "pass",
    strengths: ["The revision uses direct role evidence."],
    blocking_findings: [],
    required_revisions: [],
    quality_summary: "The targeted revision is ready for Matthew review.",
    approval_status: "ready_for_review",
    ...overrides,
  };
}

function approvedCareerFacts(): Array<Record<string, unknown>> {
  return [
    {
      fact_id: "cf-ats",
      status: "verified",
      source_document_ids: ["source-ats"],
    },
    {
      fact_id: "cf-executive",
      approval_status: "approved",
      source_document_ids: ["source-executive"],
    },
    {
      fact_id: "cf-shared",
      verified: true,
      source_document_ids: ["source-shared"],
    },
  ];
}

function approvedSourceDocuments(): Array<Record<string, unknown>> {
  return [
    { id: "source-ats" },
    { id: "source-executive" },
    { id: "source-shared" },
  ];
}

function normalizedPacket(
  packet: Record<string, unknown>,
): Record<string, unknown> {
  return normalizeFinalizedPacketEvidence(packet);
}

function stableContentFingerprint(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function buildRows(
  output: Record<string, unknown>,
  overrides: Partial<Parameters<typeof buildFinalizedRoleKitDocumentRows>[0]> =
    {},
) {
  return buildFinalizedRoleKitDocumentRows({
    userId: "user-1",
    runId: "run-1",
    action: "openai-finalizer",
    provider: "openai",
    modelName: "test-model",
    jobId: "job-1",
    job: { company: "Example", role_family: "Operations" },
    output,
    careerFacts: approvedCareerFacts(),
    sourceDocuments: approvedSourceDocuments(),
    ...overrides,
  });
}

function createClaimHarness(
  status: string,
  beforeConditional?: () => Promise<void>,
) {
  let row: Record<string, unknown> = {
    id: "step-1",
    run_id: "run-1",
    user_id: "user-1",
    status,
    attempt_count: status === "queued" ? 0 : 1,
  };
  let conditionalCalls = 0;
  const store: ApplicationPacketStepClaimStore = {
    conditionalClaim: async (args) => {
      conditionalCalls += 1;
      if (beforeConditional) await beforeConditional();
      await Promise.resolve();
      if (
        row.id !== args.stepId || row.run_id !== args.runId ||
        row.user_id !== args.userId || row.status !== args.expectedStatus
      ) return null;
      row = { ...row, ...args.update };
      return structuredClone(row);
    },
    read: () => Promise.resolve(structuredClone(row)),
  };
  return {
    store,
    conditionalCalls: () => conditionalCalls,
    row: () => structuredClone(row),
    setRow: (patch: Record<string, unknown>) => {
      row = { ...row, ...patch };
    },
  };
}

Deno.test("resume channel contracts keep internal analysis out of employer-facing resumes", () => {
  const roleKitContract = roleKitDocumentContract();
  const executiveContract = documentChannelContract("executive_resume");
  const atsContract = documentChannelContract("ats_resume");

  assert(roleKitContract.includes("not candidacy dossiers"));
  assert(roleKitContract.includes("resolved by omission"));
  assert(roleKitContract.includes("direct relevance to the captured posting"));
  assert(
    roleKitContract.includes(
      "Never imply Matthew previously held the target employer title",
    ),
  );
  assert(roleKitContract.includes("must have a matched Career Canon fact ID"));
  assert(roleKitContract.includes("claim_evidence"));
  assert(roleKitContract.includes("direct relevance to the captured posting"));
  assert(executiveContract.includes("employer-facing executive resume"));
  assert(executiveContract.includes("Do not write a third-person biography"));
  assert(
    executiveContract.includes(
      "must never displace more relevant professional experience",
    ),
  );
  assert(executiveContract.includes("unresolved_feedback must be empty"));
  assert(atsContract.includes("parser-safe single-column structure"));
  assert(
    atsContract.includes(
      "never present the target role as a title Matthew already held",
    ),
  );
  assert(atsContract.includes("priority over affiliations"));
  assert(atsContract.includes("Do not include gap analysis"));
});

Deno.test("finalized packets require evidence for every generated document", () => {
  const complete = finalizedPacketFixture();
  assertEquals(
    validateAgainstSchema(
      complete,
      JOB_COMMAND_CENTER_SCHEMAS.finalized_packet,
    ),
    [],
  );

  const missing = structuredClone(complete);
  delete (missing.document_evidence as Record<string, unknown>)
    .executive_resume;
  const errors = validateAgainstSchema(
    missing,
    JOB_COMMAND_CENTER_SCHEMAS.finalized_packet,
  );
  assert(
    errors.some((error) =>
      error.includes("document_evidence.executive_resume is required")
    ),
  );

  const short = structuredClone(complete);
  short.ats_resume = "Too short";
  assert(
    validateAgainstSchema(short, JOB_COMMAND_CENTER_SCHEMAS.finalized_packet)
      .some((error) => error.includes("ats_resume expected at least 20")),
  );

  const noApplicationAnswers = structuredClone(complete);
  noApplicationAnswers.application_answers = [];
  assert(
    validateAgainstSchema(
      noApplicationAnswers,
      JOB_COMMAND_CENTER_SCHEMAS.finalized_packet,
    ).some((error) =>
      error.includes("application_answers expected at least 1 items")
    ),
  );
});

Deno.test("final quality check schema and deterministic rubric accept a complete passing audit", () => {
  const quality = finalQualityFixture();
  const auditContext = finalQualityAuditContextFixture();
  assertEquals(
    validateAgainstSchema(
      quality,
      JOB_COMMAND_CENTER_SCHEMAS.final_quality_check,
    ),
    [],
  );
  assertEquals(
    validateFinalRoleKitQualityAssessment(quality, auditContext),
    [],
  );
  const normalized = normalizeFinalRoleKitQualityAssessment(
    quality,
    auditContext,
  );
  assertEquals(normalized.quality_gate, "pass");
  assertEquals(normalized.approval_status, "ready_for_review");
  assertEquals(finalRoleKitReleaseReady(normalized, "ready_for_review"), true);
});

Deno.test("final quality check rejects scorecards whose components do not equal total", () => {
  const quality = finalQualityFixture();
  (quality.ats_resume as Record<string, unknown>).total_score = 92;
  assert(
    validateFinalRoleKitQualityAssessment(quality).some((error) =>
      error.includes("ats_resume.total_score must equal")
    ),
  );
});

Deno.test("targeted document quality check accepts a passing independent audit", () => {
  const quality = documentQualityFixture();
  assertEquals(
    validateAgainstSchema(
      quality,
      JOB_COMMAND_CENTER_SCHEMAS.document_quality_check,
    ),
    [],
  );
  assertEquals(validateDocumentQualityAssessment(quality), []);
  const normalized = normalizeDocumentQualityAssessment(quality);
  assertEquals(normalized.quality_gate, "pass");
  assertEquals(normalized.approval_status, "ready_for_review");
});

Deno.test("targeted document quality check rejects mismatched component totals", () => {
  const quality = documentQualityFixture({ total_score: 95 });
  assert(
    validateDocumentQualityAssessment(quality).some((error) =>
      error.includes("total_score must equal")
    ),
  );
});

Deno.test("targeted document audit deterministically blocks factual failures", () => {
  const quality = documentQualityFixture({
    factual_integrity_gate: "fail",
    quality_gate: "pass",
  });
  const normalized = normalizeDocumentQualityAssessment(quality);
  assertEquals(normalized.quality_gate, "block");
  assertEquals(normalized.approval_status, "needs_manual_review");
});

Deno.test("targeted document audit requires 85 points and no required revisions", () => {
  const belowThreshold = normalizeDocumentQualityAssessment(
    documentQualityFixture({
      role_specificity_score: 13,
      total_score: 84,
      quality_gate: "pass",
    }),
  );
  assertEquals(belowThreshold.quality_gate, "revise");

  const revisionsRemain = normalizeDocumentQualityAssessment(
    documentQualityFixture({
      required_revisions: ["Use the strongest verified operating example."],
    }),
  );
  assertEquals(revisionsRemain.quality_gate, "revise");
});

Deno.test("an 84-point resume deterministically requires revision", () => {
  const quality = finalQualityFixture();
  quality.ats_resume = resumeQualityScorecard("ats_resume", {
    direct_role_evidence_score: 23,
    total_score: 84,
    quality_verdict: "pass",
  });
  assertEquals(validateFinalRoleKitQualityAssessment(quality), []);
  const normalized = normalizeFinalRoleKitQualityAssessment(quality);
  assertEquals(normalized.ats_resume.quality_verdict, "revise");
  assertEquals(normalized.quality_gate, "revise");
  assertEquals(normalized.approval_status, "needs_manual_review");
  assertEquals(
    finalRoleKitReleaseReady(normalized, "needs_manual_review"),
    false,
  );
});

Deno.test("factual integrity failure blocks final role-kit approval", () => {
  const quality = finalQualityFixture();
  quality.executive_resume = resumeQualityScorecard("executive_resume", {
    factual_integrity_gate: "fail",
    quality_verdict: "pass",
  });
  const normalized = normalizeFinalRoleKitQualityAssessment(quality);
  assertEquals(normalized.executive_resume.quality_verdict, "block");
  assertEquals(normalized.factual_integrity_gate, "fail");
  assertEquals(normalized.quality_gate, "block");
  assertEquals(
    finalRoleKitReleaseReady(normalized, "needs_manual_review"),
    false,
  );
});

Deno.test("qualification scores remain strategist-owned and separate from document quality", () => {
  const quality = finalQualityFixture();
  const qualification = strategistQualificationAssessment({
    qualification_match_score: 68,
    qualification_strength_score: 82,
    must_have_coverage_score: 61,
    qualification_gap_risk_score: 43,
    qualification_strengths: ["Strategist-owned strength."],
    transferable_qualifications: ["Strategist-owned transfer."],
    qualification_gaps: ["Strategist-owned gap."],
    qualification_unknowns: ["Strategist-owned unknown."],
    qualification_summary: "Strategist-owned summary.",
  });
  const normalized = normalizeFinalRoleKitQualityAssessment(quality);
  assertEquals(normalized.quality_gate, "pass");
  assertEquals("qualification_match_score" in normalized, false);
  assertEquals(qualification.qualification_match_score, 68);
  assertEquals(qualification.qualification_gaps, ["Strategist-owned gap."]);
});

Deno.test("model-facing final quality schema rejects strategist qualification fields", () => {
  const quality = finalQualityFixture();
  quality.qualification_match_score = 99;
  assert(validateFinalRoleKitQualityAssessment(quality).length > 0);
});

Deno.test("model-facing final quality schema rejects model-selected approval state", () => {
  const quality = finalQualityFixture();
  quality.approval_status = "ready_for_review";
  assert(validateFinalRoleKitQualityAssessment(quality).length > 0);
});

Deno.test("final quality input is blind to prior scoring and critique state", () => {
  const finalizer = finalizedPacketFixture();
  finalizer.accepted_critique_items = ["FINALIZER_COMMENTARY_SENTINEL"];
  finalizer.rejected_critique_items = ["REJECTED_CRITIQUE_SENTINEL"];
  finalizer.approval_status = "PRIOR_APPROVAL_SENTINEL";
  const body = finalQualityCheckPacketBody(
    {
      notes: "PRIOR_NOTES_SENTINEL",
      careerFacts: [
        {
          fact_id: "cf-selected",
          status: "verified",
          usable_for: ["resume"],
          canonical_claim: "Selected evidence.",
          source_document_ids: ["source-selected"],
        },
        {
          fact_id: "cf-stronger-unselected",
          status: "verified",
          usable_for: ["applications"],
          canonical_claim: "Stronger unselected evidence.",
        },
        {
          fact_id: "cf-draft",
          status: "draft",
          usable_for: ["resume"],
          canonical_claim: "DRAFT_FACT_SENTINEL",
        },
      ],
      prohibitedFacts: [],
      sourceDocuments: [{ id: "SOURCE_DOCUMENT_SENTINEL" }],
      resumeLanes: [],
    },
    { id: "job-integrity", title: "Support Operations Manager" },
    finalizer,
  );
  const serialized = JSON.stringify(body);
  assert(!serialized.includes("PRIOR_NOTES_SENTINEL"));
  assert(!serialized.includes("FINALIZER_COMMENTARY_SENTINEL"));
  assert(!serialized.includes("REJECTED_CRITIQUE_SENTINEL"));
  assert(!serialized.includes("PRIOR_APPROVAL_SENTINEL"));
  assert(!serialized.includes("SOURCE_DOCUMENT_SENTINEL"));
  assert(!serialized.includes("DRAFT_FACT_SENTINEL"));
  assert(serialized.includes("Role-specific ATS resume content"));
  assert(!serialized.includes("document_evidence"));
  assert(serialized.includes("cf-selected"));
  assert(serialized.includes("source-selected"));
  assert(serialized.includes("cf-stronger-unselected"));
});

Deno.test("resume quality rubric requires one point-matched row per component", () => {
  const quality = finalQualityFixture();
  const ats = quality.ats_resume as Record<string, unknown>;
  const rows = structuredClone(ats.rubric_evidence) as Array<
    Record<string, unknown>
  >;
  rows[1].component = "factual_integrity_score";
  rows[2].points_awarded = 1;
  ats.rubric_evidence = rows;
  const errors = validateFinalRoleKitQualityAssessment(quality);
  assert(
    errors.some((error) =>
      error.includes("exactly one channel_structure_score row")
    ),
  );
  assert(
    errors.some((error) =>
      error.includes(
        "points_awarded must equal $.ats_resume.direct_role_evidence_score",
      )
    ),
  );
});

Deno.test("resume quality rubric quotes and fact ids must match the final document", () => {
  const quality = finalQualityFixture();
  const auditContext = finalQualityAuditContextFixture();
  assertEquals(
    validateFinalRoleKitQualityAssessment(quality, auditContext),
    [],
  );

  const ats = quality.ats_resume as Record<string, unknown>;
  const rows = structuredClone(ats.rubric_evidence) as Array<
    Record<string, unknown>
  >;
  rows[0].resume_quotes = ["Text not present in the final resume"];
  rows[2].supporting_fact_ids = ["cf-unknown"];
  rows[3].posting_quotes = ["Posting text that does not exist"];
  ats.rubric_evidence = rows;
  const errors = validateFinalRoleKitQualityAssessment(quality, auditContext);
  assert(errors.some((error) => error.includes("quote is not present")));
  assert(errors.some((error) => error.includes("cf-unknown")));
  assert(
    errors.some((error) => error.includes("posting quote is not present")),
  );
});

Deno.test("packet evidence aggregates are unions without changing document evidence", () => {
  const packet = finalizedPacketFixture();
  const documentEvidence = packet.document_evidence as Record<
    string,
    Evidence
  >;
  packet.ats_resume = "ATS claim demonstrates verified operating evidence.";
  packet.executive_resume =
    "Executive claim demonstrates verified leadership evidence. Executive scope needs review.";
  documentEvidence.ats_resume = evidence({
    claim_evidence: [
      claimEvidence("ATS claim", "supported", ["cf-ats", "cf-shared"], [
        "source-ats",
        "source-shared",
      ]),
    ],
  });
  documentEvidence.executive_resume = evidence({
    claim_evidence: [
      claimEvidence(
        "Executive claim",
        "supported",
        ["cf-executive", "cf-shared"],
        ["source-executive", "source-shared"],
      ),
      claimEvidence("Executive scope needs review", "needs_review"),
    ],
  });
  documentEvidence.cover_letter = evidence({
    unresolved_issues: ["Reporting line is unknown"],
  });
  packet.matched_fact_ids = ["packet-wide-stale-id"];

  const normalized = normalizeFinalizedPacketEvidence(packet);
  assertEquals(normalized.matched_fact_ids, [
    "cf-ats",
    "cf-shared",
    "cf-executive",
  ]);
  assertEquals(normalized.claims_used, [
    "ATS claim",
    "Executive claim",
    "Executive scope needs review",
  ]);
  assertEquals(normalized.unresolved_issues, ["Reporting line is unknown"]);
  assertEquals(normalized.needs_review_fact_matches, [
    "Executive scope needs review",
  ]);
  assertEquals(
    (normalized.document_evidence as Record<string, Evidence>).ats_resume
      .matched_fact_ids,
    ["cf-ats", "cf-shared"],
  );
  assertEquals(
    (normalized.document_evidence as Record<string, Evidence>).ats_resume
      .claim_evidence[0].source_document_ids,
    ["source-ats", "source-shared"],
  );
});

Deno.test("integrity validation rejects unapproved facts and unknown sources", () => {
  const output = finalizedPacketFixture();
  output.ats_resume =
    "Unknown claim appears in this role-specific ATS resume content.";
  const documentEvidence = output.document_evidence as Record<
    string,
    Evidence
  >;
  documentEvidence.ats_resume = evidence({
    claim_evidence: [
      claimEvidence("Unknown claim", "supported", ["cf-draft"], [
        "source-unknown",
      ]),
    ],
  });
  const normalized = normalizedPacket(output);
  const errors = validateFinalizedRoleKitIntegrity(normalized, {
    careerFacts: [{
      fact_id: "cf-draft",
      status: "draft",
      source_document_ids: ["source-unknown"],
    }],
    sourceDocuments: [],
  });

  assert(
    errors.some((error) => error.includes("unapproved or unknown")),
  );
  assert(errors.some((error) => error.includes("unknown source document ID")));
});

Deno.test("supported claims require source-document lineage", () => {
  const output = finalizedPacketFixture();
  output.ats_resume =
    "Supported claim appears in this role-specific ATS resume content.";
  const documentEvidence = output.document_evidence as Record<
    string,
    Evidence
  >;
  documentEvidence.ats_resume = evidence({
    claim_evidence: [
      claimEvidence("Supported claim", "supported", ["cf-ats"], []),
    ],
  });
  const normalized = normalizedPacket(output);
  const errors = validateFinalizedRoleKitIntegrity(normalized, {
    careerFacts: approvedCareerFacts(),
    sourceDocuments: approvedSourceDocuments(),
  });

  assert(
    errors.some((error) =>
      error.includes("supported claim requires at least one source document ID")
    ),
  );
});

Deno.test("document revision schema and integrity require complete claim lineage", () => {
  const output = documentRevisionFixture();
  assertEquals(
    validateAgainstSchema(
      output,
      JOB_COMMAND_CENTER_SCHEMAS.document_revision,
    ),
    [],
  );
  assertEquals(
    validateDocumentRevisionIntegrity(output, {
      careerFacts: approvedCareerFacts(),
      sourceDocuments: approvedSourceDocuments(),
    }),
    [],
  );
});

Deno.test("document revision integrity rejects incomplete or ungrounded claim maps", () => {
  const output = documentRevisionFixture();
  output.claim_evidence_complete = false;
  output.factual_claim_count = 2;
  output.revised_content = "The revised document no longer contains the claim.";
  output.claim_evidence = [
    claimEvidence("Unknown operating claim", "supported", ["cf-draft"], [
      "source-unknown",
    ]),
  ];
  output.matched_fact_ids = ["cf-wrong-union"];

  const errors = validateDocumentRevisionIntegrity(output, {
    careerFacts: [{
      fact_id: "cf-draft",
      status: "draft",
      source_document_ids: ["source-unknown"],
    }],
    sourceDocuments: [],
  });
  assert(errors.some((error) => error.includes("must be true")));
  assert(errors.some((error) => error.includes("must equal the number")));
  assert(errors.some((error) => error.includes("must be verbatim")));
  assert(errors.some((error) => error.includes("unapproved or unknown")));
  assert(errors.some((error) => error.includes("unknown source document ID")));
  assert(errors.some((error) => error.includes("matched_fact_ids")));
});

Deno.test("document revision integrity permits a declared complete empty claim map", () => {
  const output = documentRevisionFixture();
  output.revised_content = "Thank you for your time.";
  output.claim_evidence = [];
  output.factual_claim_count = 0;
  output.matched_fact_ids = [];

  assertEquals(
    validateDocumentRevisionIntegrity(output, {
      careerFacts: approvedCareerFacts(),
      sourceDocuments: approvedSourceDocuments(),
    }),
    [],
  );
});

Deno.test("document revision integrity rejects factual text omitted from claim evidence", () => {
  const output = documentRevisionFixture();
  output.revised_content =
    "I scaled an operating company to $8M in peak annual revenue.";
  output.claim_evidence = [];
  output.factual_claim_count = 0;
  output.matched_fact_ids = [];

  const errors = validateDocumentRevisionIntegrity(output, {
    careerFacts: approvedCareerFacts(),
    sourceDocuments: approvedSourceDocuments(),
  });
  assert(
    errors.some((error) => error.includes("omits likely factual")),
  );
});

Deno.test("document rows persist exactly nine document-local evidence records", () => {
  const output = finalizedPacketFixture();
  const documentEvidence = output.document_evidence as Record<
    string,
    Evidence
  >;
  output.ats_resume =
    "ATS-only claim appears in this role-specific resume content.";
  output.executive_resume =
    "Executive-only claim appears here. Unsupported executive metric appears here.";
  documentEvidence.ats_resume = evidence({
    claim_evidence: [
      claimEvidence("ATS-only claim", "supported", ["cf-ats"], [
        "source-ats",
      ]),
    ],
  });
  documentEvidence.executive_resume = evidence({
    claim_evidence: [
      claimEvidence(
        "Executive-only claim",
        "supported",
        ["cf-executive"],
        ["source-executive"],
      ),
      claimEvidence("Unsupported executive metric", "unsupported"),
    ],
  });
  const rows = buildRows(normalizedPacket(output));
  const ats = rows.find((row) => row.document_type === "ats_resume")!;
  const executive = rows.find((row) =>
    row.document_type === "executive_resume"
  )!;
  const atsRecord = ats.record as Record<string, unknown>;
  const executiveRecord = executive.record as Record<string, unknown>;

  assertEquals(rows.length, FINALIZED_PACKET_DOCUMENT_TYPES.length);
  assertEquals(
    new Set(rows.map((row) => row.document_type)),
    new Set(FINALIZED_PACKET_DOCUMENT_TYPES),
  );
  assertEquals(ats.status, "ready_for_review");
  assertEquals(atsRecord.matched_fact_ids, ["cf-ats"]);
  assertEquals(atsRecord.claims_used, ["ATS-only claim"]);
  assertEquals(
    (atsRecord.claim_evidence as ClaimEvidence[])[0].source_document_ids,
    ["source-ats"],
  );
  assertEquals(executive.status, "needs_manual_review");
  assertEquals(executiveRecord.matched_fact_ids, ["cf-executive"]);
  assertEquals(executiveRecord.unsupported_claims, [
    "Unsupported executive metric",
  ]);
  assertEquals(
    (executiveRecord.quality_flags as string[]).some((flag) =>
      flag.includes("Unsupported executive metric")
    ),
    true,
  );
});

Deno.test("a failed packet quality gate blocks every document and preserves compact score evidence", () => {
  const quality = finalQualityFixture();
  quality.ats_resume = resumeQualityScorecard("ats_resume", {
    direct_role_evidence_score: 23,
    total_score: 84,
    findings: ["Verified operating evidence is underused."],
    required_revisions: ["Promote direct workforce execution evidence."],
  });
  const normalizedQuality = normalizeFinalRoleKitQualityAssessment(quality);
  const qualification = strategistQualificationAssessment({
    qualification_match_score: 68,
    qualification_strength_score: 82,
    must_have_coverage_score: 61,
    qualification_gap_risk_score: 43,
    qualification_strengths: ["Direct operating leadership."],
    transferable_qualifications: ["Transferable support operations."],
    qualification_gaps: ["No eight-year support tenure."],
    qualification_unknowns: ["Internal level needs verification."],
    qualification_summary: "Strong operator with a real support-domain gap.",
  });
  const rows = buildRows(finalizedPacketFixture(), {
    qualityAssessment: normalizedQuality,
    qualificationAssessment: qualification,
    qualityRequired: true,
  });
  const ats = rows.find((row) => row.document_type === "ats_resume")!;
  const atsRecord = ats.record as Record<string, unknown>;

  assertEquals(normalizedQuality.quality_gate, "revise");
  assertEquals(rows.every((row) => row.status === "needs_manual_review"), true);
  assertEquals(atsRecord.quality_score, 84);
  assertEquals(atsRecord.quality_threshold, 85);
  assertEquals(atsRecord.factual_integrity_gate, "pass");
  assertEquals(
    atsRecord.quality_content_fingerprint,
    stableContentFingerprint(String(ats.content || "")),
  );
  assertEquals(
    typeof atsRecord.quality_assessment_id === "string" &&
      String(atsRecord.quality_assessment_id).length > 0,
    true,
  );
  assertEquals(atsRecord.quality_gate, "revise");
  assertEquals(atsRecord.packet_quality_gate, "revise");
  assertEquals(atsRecord.quality_findings, [
    "Verified operating evidence is underused.",
  ]);
  assertEquals(
    (atsRecord.quality_rubric_evidence as Array<Record<string, unknown>>)
      .length,
    5,
  );
  assertEquals(
    (atsRecord.quality_rubric_evidence as Array<Record<string, unknown>>)[2]
      .component,
    "direct_role_evidence_score",
  );
  assertEquals(atsRecord.strategist_qualification, qualification);
  assertEquals(atsRecord.qualification_match_score, 68);
  assertEquals(atsRecord.qualification_gaps, [
    "No eight-year support tenure.",
  ]);
  assertEquals("qualification_match_score" in normalizedQuality, false);
  assertEquals(
    "quality_assessment" in atsRecord,
    false,
  );
});

Deno.test("a passing independent quality gate releases all evidence-clean documents", () => {
  const normalizedQuality = normalizeFinalRoleKitQualityAssessment(
    finalQualityFixture(),
  );
  const rows = buildRows(finalizedPacketFixture(), {
    qualityAssessment: normalizedQuality,
    qualityRequired: true,
  });

  assertEquals(normalizedQuality.quality_gate, "pass");
  assertEquals(rows.every((row) => row.status === "ready_for_review"), true);
  assertEquals(
    rows.every((row) => {
      const record = row.record as Record<string, unknown>;
      return typeof record.quality_assessment_id === "string" &&
        record.quality_assessment_id === record.final_quality_check_id &&
        record.quality_content_fingerprint ===
          stableContentFingerprint(String(row.content || ""));
    }),
    true,
  );
});

Deno.test("finalized documents remain blocked when independent quality review is missing", () => {
  const rows = buildRows(finalizedPacketFixture(), { qualityRequired: true });
  assertEquals(rows.every((row) => row.status === "needs_manual_review"), true);
  assertEquals(
    (rows[0].record as Record<string, unknown>).packet_quality_gate,
    "not_run",
  );
});

Deno.test("row construction rejects missing evidence instead of preserving a partial kit", () => {
  const output = finalizedPacketFixture();
  delete (output.document_evidence as Record<string, unknown>).ats_resume;

  assertThrows(
    () => buildRows(output),
    Error,
    "document_evidence.ats_resume is required",
  );
});

Deno.test("row construction rejects short or missing required content", () => {
  const output = finalizedPacketFixture();
  output.cover_letter = "short";

  assertThrows(
    () => buildRows(output),
    Error,
    "cover_letter must contain at least 20 meaningful characters",
  );
});

Deno.test("packet-wide copied claim evidence is rejected", () => {
  const output = finalizedPacketFixture();
  const copiedClaim = "I led verified operations";
  const copiedContent =
    `${copiedClaim} in this intentionally duplicated role-kit document.`;
  for (const documentType of FINALIZED_PACKET_DOCUMENT_TYPES) {
    output[documentType] = documentType === "application_answers" ||
        documentType === "verification_questions"
      ? [copiedContent]
      : copiedContent;
    (output.document_evidence as Record<string, Evidence>)[documentType] =
      evidence({
        claim_evidence: [
          claimEvidence(copiedClaim, "supported", ["cf-shared"], [
            "source-shared",
          ]),
        ],
      });
  }

  const errors = validateFinalizedRoleKitIntegrity(normalizedPacket(output), {
    careerFacts: approvedCareerFacts(),
    sourceDocuments: approvedSourceDocuments(),
  });
  assert(
    errors.some((error) => error.includes("packet-wide copied claim_evidence")),
  );
});

Deno.test("packet aggregate must equal the union of document-local evidence", () => {
  const output = finalizedPacketFixture();
  output.ats_resume =
    "ATS aggregate claim appears in this complete role-specific document.";
  (output.document_evidence as Record<string, Evidence>).ats_resume = evidence({
    claim_evidence: [
      claimEvidence("ATS aggregate claim", "supported", ["cf-ats"], [
        "source-ats",
      ]),
    ],
  });

  const errors = validateFinalizedRoleKitIntegrity(output, {
    careerFacts: approvedCareerFacts(),
    sourceDocuments: approvedSourceDocuments(),
  });
  assert(
    errors.some((error) =>
      error.includes("$.matched_fact_ids must equal the union")
    ),
  );
  assert(
    errors.some((error) =>
      error.includes("$.claims_used must equal the union")
    ),
  );
});

Deno.test("finalized packet rejects factual document text omitted from claim evidence", () => {
  const output = finalizedPacketFixture();
  output.ats_resume =
    "Built a national operation producing $8M in peak annual revenue.";

  const errors = validateFinalizedRoleKitIntegrity(output, {
    careerFacts: approvedCareerFacts(),
    sourceDocuments: approvedSourceDocuments(),
  });
  assert(
    errors.some((error) =>
      error.includes(
        "document_evidence.ats_resume.claim_evidence omits likely factual",
      )
    ),
  );
});

Deno.test("verified target-role language does not require a Career Canon claim map", () => {
  const output = finalizedPacketFixture();
  output.cover_letter =
    "The Global Operations Control mandate stands out because the role combines scaled operations, network integrity, market coordination, and resilient execution.";
  output.positioning_memo =
    "The official posting is for Tempe, Arizona, with a listed base range of $285,000-$352,000 plus bonus and equity.";
  const job = {
    company: "Waymo",
    role_title: "Director, Global Operations Control",
    raw_posting_text:
      "Waymo is hiring a Director, Global Operations Control in Tempe, Arizona. The listed base range is $285,000-$352,000 plus bonus and equity. The role combines scaled operations, network integrity, market coordination, and resilient execution.",
  };

  assertEquals(
    validateFinalizedRoleKitIntegrity(output, { job }),
    [],
  );
  assert(
    validateFinalizedRoleKitIntegrity(output).some((error) =>
      error.includes("document_evidence.cover_letter.claim_evidence omits")
    ),
  );
});

Deno.test("candidate operating claims remain mapped even when job language overlaps", () => {
  const output = finalizedPacketFixture();
  output.ats_resume =
    "Matthew led scaled operations, network integrity, market coordination, and resilient execution.";
  const errors = validateFinalizedRoleKitIntegrity(output, {
    job: {
      company: "Waymo",
      raw_posting_text:
        "The role requires scaled operations, network integrity, market coordination, and resilient execution.",
    },
  });

  assert(
    errors.some((error) =>
      error.includes("document_evidence.ats_resume.claim_evidence omits")
    ),
  );
});

Deno.test("saved Writer artifact can be revalidated locally against verified job text", () => {
  const output = finalizedPacketFixture();
  output.cover_letter =
    "The Global Operations Control mandate stands out because the role combines scaled operations, network integrity, market coordination, and resilient execution.";
  const validation = validateSavedProviderArtifact(
    "openai-writer",
    JSON.stringify(output),
    {
      job: {
        company: "Waymo",
        role_title: "Director, Global Operations Control",
        raw_posting_text:
          "The role combines scaled operations, network integrity, market coordination, and resilient execution.",
      },
    },
  );

  assertEquals(validation.errors, []);
  assertEquals(validation.parsed.cover_letter, output.cover_letter);
});

Deno.test("idempotent row repair replaces bad content at the deterministic ID", () => {
  const initialRows = buildRows(finalizedPacketFixture());
  const existingVersions = structuredClone(initialRows);
  const existingAts = existingVersions.find((row) =>
    row.document_type === "ats_resume"
  )!;
  existingAts.content = "Bad existing row that must be replaced safely.";
  existingAts.record = {
    ...(existingAts.record as Record<string, unknown>),
    matched_fact_ids: ["bad-preserved-id"],
    claim_evidence: [{ claim_text: "bad preserved claim" }],
  };

  const repairedOutput = finalizedPacketFixture();
  repairedOutput.ats_resume =
    "Repaired ATS resume content now replaces the bad existing row.";
  const repairedRows = buildRows(repairedOutput, { existingVersions });
  const repairedAts = repairedRows.find((row) =>
    row.document_type === "ats_resume"
  )!;

  assertEquals(repairedAts.id, existingAts.id);
  assertEquals(repairedAts.version_number, existingAts.version_number);
  assertEquals(repairedAts.content, repairedOutput.ats_resume);
  assertEquals(
    (repairedAts.record as Record<string, unknown>).matched_fact_ids,
    [],
  );
  assertEquals(
    (repairedAts.record as Record<string, unknown>).claim_evidence,
    [],
  );
});

Deno.test("deterministic row identity collision is rejected", () => {
  const existingVersions = buildRows(finalizedPacketFixture());
  const existingAts = existingVersions.find((row) =>
    row.document_type === "ats_resume"
  )!;
  existingAts.document_type = "executive_resume";

  assertThrows(
    () => buildRows(finalizedPacketFixture(), { existingVersions }),
    Error,
    "Deterministic document ID collision",
  );
});

Deno.test("documents persist before the canonical approval with all document IDs", async () => {
  const rows = buildRows(finalizedPacketFixture());
  const events: string[] = [];
  let persistedApproval: Record<string, unknown> | null = null;
  const result = await persistFinalizedRoleKitBeforeApproval(
    {
      supersedeActionableApprovals: () => {
        events.push("supersede-stale-approvals");
        return Promise.resolve();
      },
      upsertDocumentRows: (documentRows) => {
        events.push(`persist-${documentRows.length}-documents`);
        return Promise.resolve();
      },
      upsertCanonicalApproval: (approval) => {
        events.push("persist-canonical-approval");
        persistedApproval = approval;
        return Promise.resolve();
      },
    },
    {
      rows,
      canonicalApprovalRow: {
        id: "approval-1",
        status: "ready_for_review",
        record: { workflow_run_id: "run-1", actionable: false },
      },
    },
  );

  assertEquals(events, [
    "persist-9-documents",
    "supersede-stale-approvals",
    "persist-canonical-approval",
  ]);
  assertEquals(
    (result.record as Record<string, unknown>).document_ids,
    rows.map((row) => row.id),
  );
  assertEquals(
    (persistedApproval!.record as Record<string, unknown>).document_count,
    9,
  );
  assertEquals(
    (persistedApproval!.record as Record<string, unknown>).actionable,
    false,
  );
});

Deno.test("a failed quality approval can never become actionable", async () => {
  const result = await persistFinalizedRoleKitBeforeApproval(
    {
      supersedeActionableApprovals: () => Promise.resolve(),
      upsertDocumentRows: () => Promise.resolve(),
      upsertCanonicalApproval: () => Promise.resolve(),
    },
    {
      rows: buildRows(finalizedPacketFixture()),
      canonicalApprovalRow: {
        id: "approval-blocked",
        status: "needs_manual_review",
        record: { workflow_run_id: "run-blocked", actionable: true },
      },
    },
  );
  assertEquals((result.record as Record<string, unknown>).actionable, false);
});

Deno.test("document persistence failure leaves prior approvals untouched", async () => {
  const events: string[] = [];
  await assertRejects(
    () =>
      persistFinalizedRoleKitBeforeApproval(
        {
          supersedeActionableApprovals: () => {
            events.push("supersede");
            return Promise.resolve();
          },
          upsertDocumentRows: () => {
            events.push("documents");
            return Promise.reject(new Error("document storage failed"));
          },
          upsertCanonicalApproval: () => {
            events.push("approval");
            return Promise.resolve();
          },
        },
        {
          rows: buildRows(finalizedPacketFixture()),
          canonicalApprovalRow: { id: "approval-1", record: {} },
        },
      ),
    Error,
    "document storage failed",
  );
  assertEquals(events, ["documents"]);
});

Deno.test("all older actionable approvals for the same job are superseded", () => {
  const approvals = [
    {
      id: "manual-same",
      job_id: "job-1",
      status: "needs_manual_review",
      record: { workflow_run_id: "run-1", job_id: "job-1" },
    },
    {
      id: "ready-same",
      job_id: "job-1",
      status: "ready_for_review",
      record: { run_id: "run-1", job_id: "job-1" },
    },
    {
      id: "archived-same",
      job_id: "job-1",
      status: "archived",
      record: { workflow_run_id: "run-1", job_id: "job-1" },
    },
    {
      id: "manual-other-run",
      job_id: "job-1",
      status: "needs_manual_review",
      record: { workflow_run_id: "run-2", job_id: "job-1" },
    },
    {
      id: "manual-other-job",
      job_id: "job-2",
      status: "needs_manual_review",
      record: { workflow_run_id: "run-1", job_id: "job-2" },
    },
  ];

  assertEquals(
    staleActionableRoleKitApprovals(
      approvals,
      "run-1",
      "job-1",
      "ready-same",
    ).map((row) => row.id),
    ["manual-same", "manual-other-run"],
  );
});

Deno.test("older prepared browser tasks for the same job are superseded", () => {
  const tasks = [
    {
      id: "task-current",
      job_id: "job-1",
      status: "prepared",
      record: { workflow_run_id: "run-current" },
    },
    {
      id: "task-old",
      job_id: "job-1",
      status: "prepared",
      record: { workflow_run_id: "run-old" },
    },
    {
      id: "task-done",
      job_id: "job-1",
      status: "completed",
      record: { workflow_run_id: "run-old" },
    },
    {
      id: "task-other-job",
      job_id: "job-2",
      status: "prepared",
      record: { workflow_run_id: "run-old" },
    },
  ];
  assertEquals(
    stalePreparedBrowserTasks(
      tasks,
      "run-current",
      "job-1",
      "task-current",
    ).map((task) => task.id),
    ["task-old"],
  );
});

Deno.test("targeted document actions do not create orphan approval items on validation failure", () => {
  assertEquals(actionCreatesManualReviewApproval("revise-document"), false);
  assertEquals(
    actionCreatesManualReviewApproval("gemini-document-quality-check"),
    false,
  );
  assertEquals(actionCreatesManualReviewApproval("openai-finalizer"), true);
});

Deno.test("canonical approval is not touched when the role kit has fewer than nine rows", async () => {
  const events: string[] = [];
  await assertRejects(
    () =>
      persistFinalizedRoleKitBeforeApproval(
        {
          supersedeActionableApprovals: () => {
            events.push("supersede");
            return Promise.resolve();
          },
          upsertDocumentRows: () => {
            events.push("documents");
            return Promise.resolve();
          },
          upsertCanonicalApproval: () => {
            events.push("approval");
            return Promise.resolve();
          },
        },
        {
          rows: buildRows(finalizedPacketFixture()).slice(0, 8),
          canonicalApprovalRow: { id: "approval-1", record: {} },
        },
      ),
    Error,
    "requires exactly 9 document rows",
  );
  assertEquals(events, []);
});

Deno.test("retry guard blocks storage failures and ambiguous provider outcomes", () => {
  const storage = retryWindowForFailedStep(
    {
      status: "failed_storage",
      provider: "openai",
      error: { message: "jobcc_workflow_artifacts write failed" },
    },
    1,
    2,
  );
  assertEquals(storage.allowed, false);
  assertEquals(storage.providerOutcome, "provider_outcome_uncertain");
  assertEquals(storage.manualReconciliationRequired, true);

  const timeout = retryWindowForFailedStep(
    {
      status: "failed_provider",
      provider: "openai",
      error: { message: "Provider request timed out after 90 seconds." },
    },
    1,
    2,
  );
  assertEquals(timeout.allowed, false);
  assertEquals(timeout.providerOutcome, "provider_outcome_uncertain");
  assertEquals(timeout.manualReconciliationRequired, true);
});

Deno.test("retry guard allows bounded definite 4xx and schema repair retries", () => {
  const provider4xx = retryWindowForFailedStep(
    {
      status: "failed_provider",
      provider: "openai",
      error: { message: "Provider request failed: 400 INVALID_ARGUMENT" },
    },
    1,
    2,
  );
  assertEquals(provider4xx.allowed, true);
  assertEquals(provider4xx.providerOutcome, "definite_provider_rejection");
  assertEquals(provider4xx.manualReconciliationRequired, false);

  const validation = retryWindowForFailedStep(
    {
      status: "failed_validation",
      provider: "openai",
      error: { message: "Structured response failed schema validation" },
    },
    1,
    2,
  );
  assertEquals(validation.allowed, true);
  assertEquals(validation.providerOutcome, "known_invalid_response");

  const exhausted = retryWindowForFailedStep(
    {
      status: "failed_provider",
      provider: "openai",
      error: { message: "Provider request failed: 400 INVALID_ARGUMENT" },
    },
    2,
    2,
  );
  assertEquals(exhausted.allowed, false);
  assertEquals(exhausted.manualReconciliationRequired, false);
});

Deno.test("Gemini response-format request uses the provider enum value", () => {
  const body = geminiRequestBody(
    "Return a test object.",
    { type: "object", properties: { ok: { type: "boolean" } } },
    false,
    true,
  );
  assertEquals(body.generationConfig, {
    responseFormat: {
      text: {
        mimeType: "APPLICATION_JSON",
        schema: {
          type: "object",
          properties: { ok: { type: "boolean" } },
        },
      },
    },
  });
});

Deno.test("Gemini MIME field errors fall through to a bounded schema mode", () => {
  assertEquals(
    shouldFallbackGeminiSchema({
      error: {
        code: 400,
        status: "INVALID_ARGUMENT",
        message:
          "Invalid value at 'generation_config.response_format.text.mime_type'",
      },
    }),
    true,
  );
});

Deno.test("saved invalid output gets one direct repair beyond the attempt window", () => {
  const repair = savedValidationRepairRetryWindow(
    {
      status: "failed_validation",
      provider: "openai",
      provider_request_id: "writer-request-1",
      record: { provider_request_count: 1 },
    },
    true,
    2,
    2,
  );
  assert(repair);
  assertEquals(repair.allowed, true);
  assertEquals(repair.maxAttempts, 3);
  assertEquals(repair.providerOutcome, "known_invalid_response");
  assertEquals(repair.manualReconciliationRequired, false);

  assertEquals(
    savedValidationRepairRetryWindow(
      {
        status: "failed_validation",
        provider: "openai",
        record: {},
      },
      true,
      2,
      2,
    ),
    null,
  );
  assertEquals(
    savedValidationRepairRetryWindow(
      {
        status: "failed_validation",
        provider: "openai",
        record: { provider_request_count: 1 },
      },
      false,
      2,
      2,
    ),
    null,
  );
  assertEquals(
    savedValidationRepairRetryWindow(
      {
        status: "failed_validation",
        provider: "openai",
        record: {
          provider_request_count: 2,
          validation_repair_source_artifact_id: "raw-invalid-1",
        },
      },
      true,
      3,
      3,
    ),
    null,
  );
});

Deno.test("retry guard allows a pre-provider call-limit stop exactly once", () => {
  const stoppedBeforeProvider = retryWindowForFailedStep(
    {
      status: "failed_preflight",
      provider: "openai",
      error: {
        message: "Stopped before openai-writer; call limit 1 reached.",
        workflow_stop: "call_limit",
      },
      record: { durable_step_plan: "application-packet-v2-quality-gated" },
    },
    1,
    2,
  );
  assertEquals(stoppedBeforeProvider.allowed, true);
  assertEquals(stoppedBeforeProvider.providerOutcome, "provider_not_called");
  assertEquals(stoppedBeforeProvider.manualReconciliationRequired, false);

  const contradictoryEvidence = retryWindowForFailedStep(
    {
      status: "failed_preflight",
      provider: "openai",
      provider_request_id: "request-already-recorded",
      error: { workflow_stop: "call_limit" },
    },
    1,
    2,
  );
  assertEquals(contradictoryEvidence.allowed, false);
  assertEquals(
    contradictoryEvidence.providerOutcome,
    "provider_outcome_uncertain",
  );
  assertEquals(contradictoryEvidence.manualReconciliationRequired, true);

  const cumulativePriorRequest = {
    status: "failed_preflight",
    provider: "gemini",
    error: {
      message: "Stopped before gemini-critique; call limit 1 reached.",
      workflow_stop: "call_limit",
      provider_outcome: "provider_not_called",
    },
    record: {
      provider_request_count: 1,
      current_provider_request_count: 0,
    },
  };
  const extended = retryWindowForFailedStep(
    cumulativePriorRequest,
    2,
    2,
  );
  assertEquals(extended.allowed, true);
  assertEquals(extended.maxAttempts, 3);
  assertEquals(
    providerRetryCallLimitAllowance(cumulativePriorRequest, 2, 2),
    1,
  );

  const extensionAlreadyUsed = retryWindowForFailedStep(
    {
      ...cumulativePriorRequest,
      record: {
        ...cumulativePriorRequest.record,
        preflight_retry_extension_used: true,
      },
    },
    3,
    3,
  );
  assertEquals(extensionAlreadyUsed.allowed, false);
});

Deno.test("retry guard preserves bounded retries for non-model source steps", () => {
  const sourceRetry = retryWindowForFailedStep(
    {
      status: "failed_provider",
      step_type: "capture-official-source",
      error: { message: "Official source returned 503" },
    },
    1,
    2,
  );

  assertEquals(sourceRetry.allowed, true);
  assertEquals(sourceRetry.providerOutcome, "not_applicable");
  assertEquals(sourceRetry.manualReconciliationRequired, false);
});

Deno.test("Canon match normalization uses actual matcher fact IDs", () => {
  const normalized = normalizeCanonMatchOutput({
    matched_fact_ids: ["cf-all-verified-1", "cf-all-verified-2"],
    claims_used: ["Fallback claim"],
    matches: [
      {
        matched_fact_id: "cf-match-2",
        evidence: "Matched claim two",
      },
      {
        matched_fact_id: null,
        evidence: "No match",
      },
      {
        matched_fact_id: "cf-match-1",
        evidence: "Matched claim one",
      },
      {
        matched_fact_id: "cf-match-2",
        evidence: "Matched claim two",
      },
    ],
  });

  assertEquals(normalized.matched_fact_ids, ["cf-match-2", "cf-match-1"]);
  assertEquals(normalized.claims_used, [
    "Matched claim two",
    "Matched claim one",
  ]);
});

Deno.test("queued packet-step race allows only one provider caller", async () => {
  const harness = createClaimHarness("queued");
  let providerCalls = 0;
  const advance = async () => {
    const claim = await claimApplicationPacketStepOnce(harness.store, {
      stepId: "step-1",
      runId: "run-1",
      userId: "user-1",
      expectedStatus: "queued",
      attemptCount: 1,
      startedAt: "2026-07-15T00:00:00.000Z",
    });
    if (claim.claimed) providerCalls += 1;
    return claim;
  };

  const claims = await Promise.all([advance(), advance()]);
  assertEquals(claims.filter((claim) => claim.claimed).length, 1);
  assertEquals(
    claims.filter((claim) => claim.outcome === "in_progress").length,
    1,
  );
  assertEquals(providerCalls, 1);
});

Deno.test("normal advance cannot reclaim a fast-completed step", async () => {
  const harness = createClaimHarness("queued");
  let providerCalls = 0;
  const first = await claimApplicationPacketStepOnce(harness.store, {
    stepId: "step-1",
    runId: "run-1",
    userId: "user-1",
    expectedStatus: "queued",
    attemptCount: 1,
    startedAt: "2026-07-15T00:00:00.000Z",
  });
  if (first.claimed) providerCalls += 1;
  harness.setRow({
    status: "completed",
    completed_at: "2026-07-15T00:00:01.000Z",
    output_artifact_ids: ["artifact-1"],
  });

  const replay = await claimApplicationPacketStepOnce(harness.store, {
    stepId: "step-1",
    runId: "run-1",
    userId: "user-1",
    expectedStatus: "queued",
    attemptCount: 2,
    startedAt: "2026-07-15T00:00:02.000Z",
  });
  assertEquals(replay.claimed, false);
  assertEquals(replay.outcome, "completed");
  assertEquals(providerCalls, 1);

  const callsBeforeIllegalRepair = harness.conditionalCalls();
  const illegalRepair = await claimApplicationPacketStepOnce(harness.store, {
    stepId: "step-1",
    runId: "run-1",
    userId: "user-1",
    expectedStatus: "completed",
    attemptCount: 2,
  });
  assertEquals(illegalRepair.claimed, false);
  assertEquals(illegalRepair.outcome, "completed");
  assertEquals(harness.conditionalCalls(), callsBeforeIllegalRepair);

  const validatedRepair = await claimApplicationPacketStepOnce(
    harness.store,
    {
      stepId: "step-1",
      runId: "run-1",
      userId: "user-1",
      expectedStatus: "completed",
      attemptCount: 2,
      claimMode: "validated_completed_repair",
      startedAt: "2026-07-15T00:00:03.000Z",
    },
  );
  assertEquals(validatedRepair.claimed, true);
  assertEquals(validatedRepair.outcome, "claimed");
});

Deno.test("failed packet-step retry race allows only one provider caller", async () => {
  const harness = createClaimHarness("failed_provider");
  let providerCalls = 0;
  const retry = async () => {
    const claim = await claimApplicationPacketStepOnce(harness.store, {
      stepId: "step-1",
      runId: "run-1",
      userId: "user-1",
      expectedStatus: "failed_provider",
      attemptCount: 2,
      claimMode: "retry",
      startedAt: "2026-07-15T00:00:00.000Z",
    });
    if (claim.claimed) providerCalls += 1;
    return claim;
  };

  const claims = await Promise.all([retry(), retry()]);
  assertEquals(claims.filter((claim) => claim.claimed).length, 1);
  assertEquals(
    claims.filter((claim) => claim.outcome === "in_progress").length,
    1,
  );
  assertEquals(providerCalls, 1);
});

Deno.test("cancel winning the claim race prevents provider execution", async () => {
  let releaseConditional!: () => void;
  let signalConditionalEntered!: () => void;
  const conditionalReleased = new Promise<void>((resolve) => {
    releaseConditional = resolve;
  });
  const conditionalEntered = new Promise<void>((resolve) => {
    signalConditionalEntered = resolve;
  });
  const harness = createClaimHarness("queued", async () => {
    signalConditionalEntered();
    await conditionalReleased;
  });
  let providerCalls = 0;
  const pendingClaim = claimApplicationPacketStepOnce(harness.store, {
    stepId: "step-1",
    runId: "run-1",
    userId: "user-1",
    expectedStatus: "queued",
    attemptCount: 1,
    startedAt: "2026-07-15T00:00:00.000Z",
  });

  await conditionalEntered;
  harness.setRow({
    status: "cancelled",
    completed_at: "2026-07-15T00:00:00.500Z",
  });
  releaseConditional();
  const claim = await pendingClaim;
  if (claim.claimed) providerCalls += 1;

  assertEquals(claim.claimed, false);
  assertEquals(claim.outcome, "cancelled");
  assertEquals(providerCalls, 0);
});

Deno.test("partial packet-step plan initialization never overwrites durable rows", async () => {
  const planned = buildApplicationPacketStepPlanRows({
    runId: "run-plan",
    userId: "user-plan",
    updatedAt: "2026-07-15T00:00:00.000Z",
  });
  assertEquals(planned.length, 7);
  assertEquals(
    planned.map((step) => step.step_type),
    [
      "verify-job-source",
      "match-job-to-canon",
      "score-job",
      "openai-writer",
      "gemini-critique",
      "openai-finalizer",
      "gemini-final-quality-check",
    ],
  );
  assertEquals(
    (planned[6].record as Record<string, unknown>).durable_step_plan,
    "application-packet-v2-quality-gated",
  );
  const rows = new Map<string, Record<string, unknown>>();
  rows.set(String(planned[0].id), {
    ...planned[0],
    status: "running",
    attempt_count: 1,
    started_at: "2026-07-15T00:00:01.000Z",
  });
  rows.set(String(planned[1].id), {
    ...planned[1],
    status: "completed",
    attempt_count: 1,
    output_artifact_ids: ["artifact-complete"],
    completed_at: "2026-07-15T00:00:02.000Z",
  });
  const preservedRunning = structuredClone(rows.get(String(planned[0].id))!);
  const preservedCompleted = structuredClone(
    rows.get(String(planned[1].id))!,
  );
  let readCount = 0;
  let releaseReads!: () => void;
  const readsReleased = new Promise<void>((resolve) => {
    releaseReads = resolve;
  });
  const attemptedIds: string[] = [];
  const insertedIds: string[] = [];
  const store: ApplicationPacketStepPlanStore = {
    read: async () => {
      readCount += 1;
      if (readCount === 2) releaseReads();
      await readsReleased;
      return Array.from(rows.values(), (row) => structuredClone(row));
    },
    insertIgnoreDuplicates: async (missingRows) => {
      for (const row of missingRows) {
        const id = String(row.id || "");
        attemptedIds.push(id);
        if (rows.has(id)) continue;
        rows.set(id, structuredClone(row));
        insertedIds.push(id);
      }
    },
  };

  const initializations = await Promise.all([
    ensureApplicationPacketStepPlanOnce(store, {
      runId: "run-plan",
      userId: "user-plan",
      updatedAt: "2026-07-15T00:00:03.000Z",
    }),
    ensureApplicationPacketStepPlanOnce(store, {
      runId: "run-plan",
      userId: "user-plan",
      updatedAt: "2026-07-15T00:00:03.000Z",
    }),
  ]);

  const missingCount = planned.length - 2;
  assertEquals(
    initializations.map((missing) => missing.length),
    [missingCount, missingCount],
  );
  assertEquals(attemptedIds.length, missingCount * 2);
  assertEquals(insertedIds.length, missingCount);
  assertEquals(rows.size, planned.length);
  assertEquals(new Set(rows.keys()).size, planned.length);
  assertEquals(rows.get(String(planned[0].id)), preservedRunning);
  assertEquals(rows.get(String(planned[1].id)), preservedCompleted);
});

Deno.test("provider usage aggregation counts both schema attempts", () => {
  assertEquals(
    aggregateProviderUsage(
      {
        input_tokens: 120,
        output_tokens: 30,
        total_tokens: 150,
        input_tokens_details: { cached_tokens: 20 },
      },
      {
        input_tokens: 80,
        output_tokens: 25,
        total_tokens: 105,
        input_tokens_details: { cached_tokens: 5 },
      },
    ),
    {
      input_tokens: 200,
      output_tokens: 55,
      total_tokens: 255,
      input_tokens_details: { cached_tokens: 25 },
    },
  );
});

Deno.test("provider request limits count repair calls and preserve legacy rows", () => {
  assertEquals(
    providerRequestsRecordedForStep({
      status: "completed",
      started_at: "2026-07-15T00:00:00.000Z",
      record: { provider_request_count: 2 },
    }),
    2,
  );
  assertEquals(
    providerRequestsRecordedForStep({
      status: "completed",
      started_at: "2026-07-15T00:00:00.000Z",
      record: {},
    }),
    1,
  );
  assertEquals(
    providerRequestsRecordedForStep({ status: "queued", record: {} }),
    0,
  );
  assertEquals(
    providerRequestsRecordedForStep(
      {
        id: "writer-step",
        status: "running",
        started_at: "2026-07-16T07:00:47.033Z",
        record: { durable_step_plan: "application-packet-v2-quality-gated" },
      },
      "writer-step",
    ),
    0,
  );
  assertEquals(
    providerRequestsRecordedForStep(
      {
        id: "writer-step",
        status: "running",
        started_at: "2026-07-16T07:00:47.033Z",
        provider_request_id: "request-recorded",
        record: {},
      },
      "writer-step",
    ),
    1,
  );
  assertEquals(
    providerRequestsRecordedForStep(
      {
        id: "other-writer-step",
        status: "running",
        started_at: "2026-07-16T07:00:47.033Z",
        record: {},
      },
      "writer-step",
    ),
    1,
  );
});

Deno.test("only validated final-quality artifacts replay deterministic persistence", () => {
  assert(
    canReplayDeferredFinalQualityStep(
      {
        step_type: "gemini-final-quality-check",
        status: "provider_completed",
        record: { provider_completed: true },
      },
      true,
    ),
  );
  assert(
    canReplayDeferredFinalQualityStep(
      {
        step_type: "gemini-final-quality-check",
        status: "failed_storage",
        record: { provider_completed: true },
      },
      true,
    ),
  );
  assert(
    canReplayDeferredFinalQualityStep(
      {
        step_type: "gemini-final-quality-check",
        status: "failed_provider",
        record: {
          provider_completed: true,
          post_processing_completed: false,
        },
      },
      true,
    ),
  );
  assertEquals(
    canReplayDeferredFinalQualityStep(
      {
        step_type: "gemini-final-quality-check",
        status: "failed_provider",
        record: { provider_completed: false },
      },
      true,
    ),
    false,
  );
  assertEquals(
    canReplayDeferredFinalQualityStep(
      {
        step_type: "gemini-final-quality-check",
        status: "failed_storage",
        record: { provider_completed: true },
      },
      false,
    ),
    false,
  );
  assertEquals(
    canReplayDeferredFinalQualityStep(
      {
        step_type: "openai-finalizer",
        status: "failed_storage",
        record: { provider_completed: true },
      },
      true,
    ),
    false,
  );
});

Deno.test("final-quality retry restores canonical packet inputs from the workflow run", () => {
  const restored = replayBodyForRetry(
    {
      step_type: "gemini-final-quality-check",
      record: {
        request_body: {
          careerFacts: [{ fact_id: "narrow-step-fact" }],
          sourceDocuments: [],
        },
      },
    },
    {
      id: "packet-run",
      input_record: {
        request_body: {
          job: { id: "waymo-role" },
          careerFacts: [{
            fact_id: "canonical-fact",
            source_document_ids: ["linkedin-about-current"],
          }],
          sourceDocuments: [{ id: "linkedin-about-current" }],
          limits: { maximum_actual_cost_per_run: 20 },
        },
      },
    },
    { workflow_run_id: "packet-run" },
  );

  assertEquals(restored.job, { id: "waymo-role" });
  assertEquals(restored.careerFacts, [{
    fact_id: "canonical-fact",
    source_document_ids: ["linkedin-about-current"],
  }]);
  assertEquals(restored.sourceDocuments, [{ id: "linkedin-about-current" }]);
  assertEquals(restored.limits, { maximum_actual_cost_per_run: 20 });
});

Deno.test("legacy final-quality artifacts are ineligible for replay", () => {
  const current = finalQualityFixture();
  assertEquals(
    currentWorkflowArtifactOutput("gemini-final-quality-check", current),
    current,
  );

  const missingRubricRows = structuredClone(current);
  delete (missingRubricRows.ats_resume as Record<string, unknown>)
    .rubric_evidence;
  assertEquals(
    currentWorkflowArtifactOutput(
      "gemini-final-quality-check",
      missingRubricRows,
    ),
    null,
  );

  const flattenedQualification = structuredClone(current);
  flattenedQualification.qualification_match_score = 68;
  assertEquals(
    currentWorkflowArtifactOutput(
      "gemini-final-quality-check",
      flattenedQualification,
    ),
    null,
  );
});
