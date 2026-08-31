import { DEFAULT_SEARCH_COMPANIES } from "./job-search-roster.ts";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

Deno.test("default search roster contains all 85 unique target companies", () => {
  assert(
    DEFAULT_SEARCH_COMPANIES.length === 85,
    `expected 85 companies, got ${DEFAULT_SEARCH_COMPANIES.length}`,
  );
  assert(
    new Set(DEFAULT_SEARCH_COMPANIES).size === DEFAULT_SEARCH_COMPANIES.length,
    "default search roster contains duplicate company names",
  );
  for (
    const company of [
      "Waymo",
      "Whatnot",
      "Uber",
      "Google",
      "Amazon",
      "TikTok / ByteDance",
      "OpenAI",
      "Atlassian",
    ]
  ) {
    assert(
      DEFAULT_SEARCH_COMPANIES.includes(
        company as (typeof DEFAULT_SEARCH_COMPANIES)[number],
      ),
      `${company} is missing from the default search roster`,
    );
  }
});
