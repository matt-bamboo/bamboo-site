import {
  compactSearchAuditRecord,
  searchAuditSample,
} from "./job-search-audit.ts";

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

Deno.test("keeps search audit records identifying but excludes full posting payloads", () => {
  const compact = compactSearchAuditRecord({
    id: "role-1",
    company: "Example",
    role_title: "Chief Operating Officer",
    source_url: "https://example.com/jobs/role-1",
    listed_base_min: 320000,
    raw_posting_text: "PRIVATE_FULL_POSTING_MARKER".repeat(1000),
    parsed_job_brief: { role_mandate: "PRIVATE_BRIEF_MARKER" },
  });

  assertEquals(compact.id, "role-1");
  assertEquals(compact.listed_base_min, 320000);
  const serialized = JSON.stringify(compact);
  assert(!serialized.includes("PRIVATE_FULL_POSTING_MARKER"));
  assert(!serialized.includes("PRIVATE_BRIEF_MARKER"));
});

Deno.test("reports exact totals while bounding the visible audit sample", () => {
  const records = Array.from({ length: 125 }, (_, index) => ({
    id: `role-${index}`,
    company: "Example",
    role_title: `Operations Role ${index}`,
    raw_posting_text: "large posting text",
  }));
  const result = searchAuditSample(records, 12);

  assertEquals(result.total, 125);
  assertEquals(result.sample_count, 12);
  assertEquals(result.sample.length, 12);
  assertEquals(result.truncated, true);
  assertEquals(result.sample[11].id, "role-11");
});

Deno.test("caps an excessive requested sample size", () => {
  const records = Array.from({ length: 75 }, (_, index) => ({
    id: `role-${index}`,
  }));
  assertEquals(searchAuditSample(records, 500).sample_count, 50);
});
