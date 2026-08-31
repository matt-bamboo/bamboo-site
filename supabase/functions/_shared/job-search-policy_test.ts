import {
  compensationScreenDecision,
  listedBaseRange,
  screenSearchResultsByCompensation,
} from "./job-search-policy.ts";

function assert(
  condition: unknown,
  message = "Assertion failed",
): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEquals<T>(
  actual: T,
  expected: T,
  message = "Values are not equal",
): void {
  if (!Object.is(actual, expected)) {
    throw new Error(
      `${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`,
    );
  }
}

Deno.test("uses the lowest trusted base range and enforces the low end", () => {
  const role = {
    company: "Example",
    role_title: "VP Operations",
    raw_posting_text: [
      "The California base salary range is $320,000 - $390,000.",
      "The Arizona base salary range is $285,000 - $340,000.",
    ].join(" "),
  };
  assertEquals(listedBaseRange(role)?.min, 285000);
  assertEquals(compensationScreenDecision(role, 300000).status, "below_floor");
  assertEquals(compensationScreenDecision(role, 275000).status, "meets_floor");
});

Deno.test("does not confuse total compensation or unrelated numbers with listed base", () => {
  const role = {
    company: "Example",
    role_title: "Senior Manager, Operations",
    raw_posting_text:
      "Total compensation is $350,000 - $450,000 including equity. The team supports 120 locations and job id 450000.",
  };
  assertEquals(listedBaseRange(role), null);
  assertEquals(compensationScreenDecision(role, 300000).status, "missing_comp");
});

Deno.test("keeps senior high-upside roles with missing compensation for verification", () => {
  const decision = compensationScreenDecision({
    company: "Example",
    role_title: "Head of Marketplace Operations",
    department: "Marketplace Operations",
  }, 300000);
  assert(decision.keep);
  assertEquals(decision.status, "senior_missing_comp");
  assertEquals(
    decision.compensationVerdict,
    "unknown_but_senior_enough_to_review",
  );
});

Deno.test("screens junior missing-comp roles and below-floor listed roles separately", () => {
  const summary = screenSearchResultsByCompensation([
    {
      company: "Example",
      role_title: "Director, Operations Control",
      compensation_summary: "Base salary range: $310K - $360K",
    },
    {
      company: "Example",
      role_title: "Director, Operations",
      compensation_summary: "Base salary range: $240,000 to $290,000",
    },
    {
      company: "Example",
      role_title: "Operations Coordinator",
    },
  ], 300000);

  assertEquals(summary.kept.length, 1);
  assertEquals(summary.screenedOut.length, 2);
  assertEquals(summary.screenedOutBelowFloor, 1);
  assertEquals(summary.screenedOutMissingComp, 1);
  assertEquals(summary.kept[0].listed_base_min, 310000);
});

Deno.test("prefers trusted posting text over a stale explicit range", () => {
  const role = {
    role_title: "Director, Operations",
    listed_base_min: 340000,
    listed_base_max: 400000,
    raw_posting_text:
      "The annual base salary range for this role is $275,000 - $325,000.",
  };
  assertEquals(listedBaseRange(role)?.min, 275000);
  assertEquals(compensationScreenDecision(role, 300000).status, "below_floor");
});

Deno.test("opportunity mode keeps listed-below-target and undisclosed senior roles when no hard base floor is requested", () => {
  const summary = screenSearchResultsByCompensation([
    {
      company: "Example",
      role_title: "VP Operations",
      compensation_summary: "Base salary range: $225,000 to $275,000 plus bonus and equity.",
    },
    {
      company: "Example",
      role_title: "Head of Marketplace Operations",
    },
  ], 0);

  assertEquals(summary.kept.length, 2);
  assertEquals(summary.screenedOut.length, 0);
  assertEquals(summary.kept[0].compensation_floor_status, "no_floor");
  assertEquals(
    summary.kept[1].compensation_verdict,
    "unknown_but_senior_enough_to_review",
  );
});

Deno.test("recognizes less common base-pay language without relabeling OTE or total rewards", () => {
  assertEquals(listedBaseRange({
    role_title: "VP Operations",
    raw_posting_text:
      "The fixed compensation for this role is between USD 305,000 and USD 365,000.",
  })?.min, 305000);
  assertEquals(listedBaseRange({
    role_title: "VP Operations",
    raw_posting_text:
      "The salary band runs from $310K to $380K depending on work location.",
  })?.min, 310000);
  assertEquals(listedBaseRange({
    role_title: "VP Operations",
    raw_posting_text:
      "Target total cash compensation is $320,000-$420,000 plus equity.",
  }), null);
  assertEquals(listedBaseRange({
    role_title: "VP Operations",
    raw_posting_text:
      "The total rewards range is $350,000-$500,000 including salary, bonus, and stock.",
  }), null);
});
