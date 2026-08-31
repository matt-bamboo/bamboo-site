import { normalizeJobSourceType } from "./job-source-normalization.ts";

function assertEquals<T>(actual: T, expected: T): void {
  if (!Object.is(actual, expected)) {
    throw new Error(`Expected ${String(expected)}, received ${String(actual)}`);
  }
}

Deno.test("normalizes ATS labels to the strict official source type", () => {
  for (
    const label of [
      "ATS",
      "official_ats",
      "official careers",
      "official_careers_page",
      "official_careers_detail",
    ]
  ) {
    assertEquals(normalizeJobSourceType(label), "official");
  }
});

Deno.test("preserves supported secondary source classifications", () => {
  assertEquals(normalizeJobSourceType("LinkedIn"), "linkedin");
  assertEquals(normalizeJobSourceType("job aggregator"), "aggregator");
  assertEquals(normalizeJobSourceType("community referral"), "other");
});
