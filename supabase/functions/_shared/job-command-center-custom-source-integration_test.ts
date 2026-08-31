import {
  buildCustomOfficialSourceCapture,
  officialSourceDispositionForCapture,
} from "./job-command-center-ai.ts";
import type {
  CustomOfficialSourceCard,
  CustomOfficialSourceResult,
} from "./job-source-custom-adapters.ts";

function assert(
  condition: unknown,
  message = "Assertion failed",
): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEquals<T>(actual: T, expected: T, message = "Values differ") {
  if (!Object.is(actual, expected)) {
    throw new Error(
      `${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`,
    );
  }
}

function candidateCard(
  overrides: Partial<CustomOfficialSourceCard> = {},
): CustomOfficialSourceCard {
  const sourceUrl = overrides.source_url ||
    "https://careers.example.com/jobs/director-business-operations";
  return {
    id: "card-1",
    job_result_id: "card-1",
    company: "Tesla",
    title: "Director, Business Operations",
    role_title: "Director, Business Operations",
    location: "Phoenix, Arizona",
    department: "Business Operations",
    team: "Business Operations",
    workplace: "Hybrid",
    workplace_type: "Hybrid",
    work_style: "Hybrid",
    posted_date: "2026-07-01",
    updated_at: "2026-07-10",
    provider: "official_detail_seeds",
    source_type: "official_careers_detail",
    source_adapter_type: "official_detail_seed",
    ats_provider: "Official careers detail",
    source_group: "Marketplace / Commerce / Logistics",
    posting_source_name: "Tesla official careers",
    job_url: sourceUrl,
    source_url: sourceUrl,
    official_source_url: sourceUrl,
    ats_source_url: sourceUrl,
    detail_url: sourceUrl,
    detail_type: "official_html",
    external_id: "TESLA-1",
    job_id_external: "TESLA-1",
    company_job_id: "TESLA-1",
    salary_snippet: "Base salary $310,000 - $360,000.",
    compensation_snippet: "Base salary $310,000 - $360,000.",
    card_snippet: "Lead business operations across a multi-site network.",
    short_card_snippet: "Lead business operations.",
    summary_text: "Lead business operations.",
    description_text: "",
    full_posting_text: "",
    full_job_description: "",
    raw_posting_text: "",
    full_posting_captured: false,
    link_health: "ok",
    active_status: "needs_verification",
    source_verified_by: "official_candidate_card",
    source_verification_notes: "Candidate card only.",
    detail_capture_error: "",
    ...overrides,
  };
}

function customResult(
  cards: CustomOfficialSourceCard[],
  overrides: Partial<CustomOfficialSourceResult> = {},
): CustomOfficialSourceResult {
  return {
    handled: true,
    company: "Tesla",
    adapter: "official_detail_seeds",
    cards,
    officialUrls: ["https://www.tesla.com/careers/search/"],
    errors: [],
    limitations: [],
    ...overrides,
  };
}

const TASK = {
  role_family_cluster: ["Business Operations", "Strategy & Operations"],
};

const LIMITS = {
  maxCandidateCardsPerCompany: 20,
  maxFullPostingsPerCompany: 10,
  minimumListedBaseSalary: 250_000,
};

Deno.test("custom card-only likely matches remain candidates and require Scout", () => {
  const card = candidateCard();
  const result = customResult([card], {
    limitations: [
      "Official detail capture is blocked for non-browser clients.",
    ],
    errors: [{
      code: "request_failed",
      company: "Tesla",
      adapter: "official_detail_seeds",
      url: card.source_url,
      query: "",
      message: "HTTP 403 Access Denied",
      status: 403,
    }],
  });

  const capture = buildCustomOfficialSourceCapture(
    "Tesla",
    result,
    TASK,
    LIMITS,
    ["https://www.tesla.com/careers"],
  );
  const cards = capture.candidate_cards as Array<Record<string, unknown>>;
  const results = capture.results as Array<Record<string, unknown>>;
  const directory = capture.company_source_directory as Record<
    string,
    unknown
  >;

  assertEquals(cards.length, 1);
  assertEquals(cards[0].source_status, "needs_manual_verification");
  assertEquals(cards[0].active_status, "needs_verification");
  assertEquals(results.length, 0);
  assertEquals((capture.likely_candidates as unknown[]).length, 1);
  assertEquals(capture.card_only_likely_candidates, 1);
  assertEquals(
    capture.scout_fallback_reason,
    "official_candidates_found_but_no_full_postings_captured",
  );
  const disposition = officialSourceDispositionForCapture("Tesla", capture);
  assertEquals(disposition.handled, false);
  assertEquals(disposition.supplementalScoutRequired, true);
  assertEquals(
    disposition.fallbackReason,
    "official_candidates_found_but_no_full_postings_captured",
  );
  assertEquals((capture.source_errors as unknown[]).length, 1);
  assertEquals((capture.source_limitations as unknown[]).length, 1);
  assert(
    (directory.official_source_urls as string[]).includes(
      "https://www.tesla.com/careers",
    ),
  );
  assertEquals((directory.source_errors as unknown[]).length, 1);
  assertEquals((directory.source_limitations as unknown[]).length, 1);
});

Deno.test("custom capture promotes only explicitly complete full postings", () => {
  const complete = candidateCard({
    id: "complete",
    job_result_id: "complete",
    source_url: "https://careers.example.com/jobs/complete",
    official_source_url: "https://careers.example.com/jobs/complete",
    detail_url: "https://careers.example.com/jobs/complete",
    full_posting_captured: true,
    raw_posting_text:
      "Responsibilities\nLead business operations.\nQualifications\n12 years of leadership experience.",
  });
  const flagWithoutText = candidateCard({
    id: "no-text",
    job_result_id: "no-text",
    source_url: "https://careers.example.com/jobs/no-text",
    official_source_url: "https://careers.example.com/jobs/no-text",
    detail_url: "https://careers.example.com/jobs/no-text",
    full_posting_captured: true,
  });
  const textWithoutFlag = candidateCard({
    id: "no-flag",
    job_result_id: "no-flag",
    source_url: "https://careers.example.com/jobs/no-flag",
    official_source_url: "https://careers.example.com/jobs/no-flag",
    detail_url: "https://careers.example.com/jobs/no-flag",
    full_posting_captured: false,
    raw_posting_text:
      "A complete-looking description without the capture flag.",
  });

  const capture = buildCustomOfficialSourceCapture(
    "Tesla",
    customResult([complete, flagWithoutText, textWithoutFlag]),
    TASK,
    LIMITS,
  );
  const cards = capture.candidate_cards as Array<Record<string, unknown>>;
  const results = capture.results as Array<Record<string, unknown>>;

  assertEquals(cards.length, 3);
  assertEquals(results.length, 1);
  assertEquals(results[0].source_url, complete.source_url);
  assertEquals(results[0].full_posting_captured, true);
  assertEquals(results[0].active_status, "verified_active");
  assertEquals(
    results[0].source_verified_by,
    "custom_official_source_full_posting_capture",
  );
  assert(String(results[0].raw_posting_text || "").length > 0);
  assertEquals(
    (results[0].company_source_directory as Record<string, unknown>)
      .full_posting_result_gate,
    capture.full_posting_result_gate,
  );
  assertEquals(capture.card_only_likely_candidates, 2);
  assertEquals(capture.scout_fallback_reason, "");
});

Deno.test("custom capture applies the existing compensation floor before promotion", () => {
  const belowFloor = candidateCard({
    full_posting_captured: true,
    compensation_snippet: "Base salary $120,000 - $150,000.",
    salary_snippet: "Base salary $120,000 - $150,000.",
    raw_posting_text:
      "Responsibilities\nLead business operations.\nQualifications\n10 years of experience.",
  });

  const capture = buildCustomOfficialSourceCapture(
    "Tesla",
    customResult([belowFloor]),
    TASK,
    LIMITS,
  );

  assertEquals((capture.candidate_cards as unknown[]).length, 1);
  assertEquals((capture.likely_candidates as unknown[]).length, 0);
  assertEquals((capture.results as unknown[]).length, 0);
  assertEquals(capture.compensation_screened_out_below_floor, 1);
  assertEquals(capture.scout_fallback_reason, "");
});
