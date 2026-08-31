import {
  mergeSourceQueries,
  officialCaptureDisposition,
} from "./job-source-capture-policy.ts";

function assertEquals(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

Deno.test("successful official inventory does not run Scout fallback", () => {
  const result = officialCaptureDisposition({
    company: "DoorDash",
    jobListCaptured: true,
    candidateCardCount: 0,
    errorCount: 0,
  });
  assertEquals(result.handled, true, "successful inventory should be handled");
  assertEquals(result.fallbackReason, "", "successful inventory fallback");
});

Deno.test("failed or empty official inventory runs Scout fallback", () => {
  const result = officialCaptureDisposition({
    company: "Applied Intuition",
    jobListCaptured: false,
    candidateCardCount: 0,
    errorCount: 1,
  });
  assertEquals(result.handled, false, "failed inventory should fall back");
  assertEquals(
    result.fallbackReason,
    "official_job_list_capture_failed_or_empty",
    "failed inventory fallback reason",
  );
});

Deno.test("Uber preserves Freight results and supplements the main company", () => {
  const result = officialCaptureDisposition({
    company: "Uber",
    jobListCaptured: true,
    candidateCardCount: 25,
    errorCount: 0,
  });
  assertEquals(result.handled, false, "Uber should use supplemental Scout");
  assertEquals(
    result.fallbackReason,
    "official_adapter_covers_only_uber_freight",
    "Uber supplemental reason",
  );
});

Deno.test("company-specific source queries survive task query expansion", () => {
  const result = mergeSourceQueries(
    ["technology operations", "director operations"],
    ["operations", "Technology Operations"],
  );
  assertEquals(result.length, 3, "merged query count");
  assertEquals(result[0], "technology operations", "configured query order");
  assertEquals(result[1], "director operations", "second configured query");
  assertEquals(result[2], "operations", "task query appended");
});
