import {
  buildPhenomSearchRequest,
  buildSmartRecruitersSearchRequest,
  buildWorkdaySearchRequest,
  fetchWorkdayCandidateCards,
  parsePhenomCandidatePage,
  parsePhenomDetailResponse,
  parseSmartRecruitersCandidatePage,
  parseSmartRecruitersDetailResponse,
  parseWorkdayCandidatePage,
  type PhenomSourceConfig,
  type SmartRecruitersSourceConfig,
  type WorkdaySourceConfig,
} from "./job-source-secondary-adapters.ts";

function assert(
  condition: unknown,
  message = "Assertion failed",
): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEquals<T>(
  actual: T,
  expected: T,
  message = "Values differ",
): void {
  if (!Object.is(actual, expected)) {
    throw new Error(
      `${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`,
    );
  }
}

const workdayConfig: WorkdaySourceConfig = {
  type: "workday",
  company: "Example Retail",
  host: "example.wd5.myworkdayjobs.com",
  tenant: "example",
  site: "External",
  queries: ["operations"],
};

const smartRecruitersConfig: SmartRecruitersSourceConfig = {
  type: "smartrecruiters",
  company: "Example Cloud",
  companySlug: "examplecloud",
};

const phenomConfig: PhenomSourceConfig = {
  type: "phenom",
  company: "Example Commerce",
  baseDomain: "https://careers.example.com",
  basePath: "/us/en",
};

Deno.test("Workday request and parser preserve pagination, full text, and official URLs", () => {
  const request = buildWorkdaySearchRequest(
    workdayConfig,
    "strategy operations",
    20,
    50,
  );
  assertEquals(
    request.url,
    "https://example.wd5.myworkdayjobs.com/wday/cxs/example/External/jobs",
  );
  const body = JSON.parse(String(request.init.body));
  assertEquals(body.searchText, "strategy operations");
  assertEquals(body.offset, 20);
  assertEquals(body.limit, 20);

  const page = parseWorkdayCandidatePage(workdayConfig, {
    total: 1,
    jobPostings: [{
      title: "VP, Global Operations",
      externalPath: "/job/Phoenix-AZ/VP-Global-Operations_R-1001",
      bulletFields: ["R-1001"],
      locationsText: "Phoenix, AZ",
      jobFamily: "Operations",
      remoteType: "Hybrid",
      postedOn: "Posted 2 Days Ago",
      jobDescription:
        "<p>Lead global operations.</p><p>Base salary: $310,000 - $390,000.</p>",
    }],
  });

  assertEquals(page.receivedCount, 1);
  assertEquals(page.total, 1);
  assertEquals(page.cards[0].external_id, "R-1001");
  assertEquals(
    page.cards[0].source_url,
    "https://example.wd5.myworkdayjobs.com/en-US/External/job/Phoenix-AZ/VP-Global-Operations_R-1001",
  );
  assertEquals(
    page.cards[0].detail_url,
    "https://example.wd5.myworkdayjobs.com/wday/cxs/example/External/job/Phoenix-AZ/VP-Global-Operations_R-1001",
  );
  assert(page.cards[0].full_posting_captured);
  assert(page.cards[0].raw_posting_text.includes("Lead global operations"));
  assert(page.cards[0].compensation_snippet.includes("$310,000"));
});

Deno.test("Workday fetcher advances offsets and de-duplicates across pages", async () => {
  const offsets: number[] = [];
  const mockFetch: typeof fetch = (_input, init) => {
    const body = JSON.parse(String(init?.body || "{}"));
    offsets.push(body.offset);
    const row = body.offset === 0
      ? {
        title: "Director, Operations",
        externalPath: "/job/Director-Operations_R-1",
        bulletFields: ["R-1"],
      }
      : {
        title: "Senior Director, Operations",
        externalPath: "/job/Senior-Director-Operations_R-2",
        bulletFields: ["R-2"],
      };
    return Promise.resolve(
      new Response(JSON.stringify({ total: 2, jobPostings: [row] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
  };

  const cards = await fetchWorkdayCandidateCards(workdayConfig, {
    fetch: mockFetch,
  });
  assertEquals(offsets.join(","), "0,1");
  assertEquals(cards.length, 2);
  assertEquals(cards[1].external_id, "R-2");
});

Deno.test("fetchers stop when an uncounted provider page makes no progress", async () => {
  let calls = 0;
  const repeatedRow = {
    title: "Director, Operations",
    externalPath: "/job/Director-Operations_R-1",
    bulletFields: ["R-1"],
  };
  const mockFetch: typeof fetch = () => {
    calls += 1;
    return Promise.resolve(
      new Response(
        JSON.stringify({ total: 0, jobPostings: [repeatedRow] }),
        { status: 200 },
      ),
    );
  };

  const cards = await fetchWorkdayCandidateCards(workdayConfig, {
    fetch: mockFetch,
  });
  assertEquals(cards.length, 1);
  assertEquals(calls, 2);
});

Deno.test("SmartRecruiters request and parsers expose public and API detail URLs", () => {
  const request = buildSmartRecruitersSearchRequest(
    smartRecruitersConfig,
    "business operations",
    100,
  );
  const url = new URL(request.url);
  assertEquals(url.searchParams.get("q"), "business operations");
  assertEquals(url.searchParams.get("offset"), "100");

  const page = parseSmartRecruitersCandidatePage(smartRecruitersConfig, {
    totalFound: 1,
    content: [{
      id: "743999",
      refNumber: "REF-88",
      name: "Director, Business Operations",
      postingUrl:
        "https://jobs.smartrecruiters.com/examplecloud/743999-director-business-operations",
      location: {
        fullLocation: "Scottsdale, AZ, United States",
        hybrid: true,
      },
      department: { label: "Business Operations" },
      releasedDate: "2026-07-10T00:00:00Z",
    }],
  });
  const card = page.cards[0];
  assertEquals(card.external_id, "REF-88");
  assertEquals(
    card.source_url,
    "https://jobs.smartrecruiters.com/examplecloud/743999-director-business-operations",
  );
  assertEquals(
    card.detail_url,
    "https://api.smartrecruiters.com/v1/companies/examplecloud/postings/743999",
  );
  assertEquals(card.workplace_type, "Hybrid");
  assertEquals(card.full_posting_captured, false);

  const detailed = parseSmartRecruitersDetailResponse(
    smartRecruitersConfig,
    {
      id: "743999",
      refNumber: "REF-88",
      name: "Director, Business Operations",
      postingUrl: card.source_url,
      location: { fullLocation: "Scottsdale, AZ, United States" },
      jobAd: {
        sections: {
          companyDescription: { text: "<p>Build the future.</p>" },
          jobDescription: {
            text: "<p>Own operating strategy and execution.</p>",
          },
          qualifications: { text: "<ul><li>10+ years</li></ul>" },
          additionalInformation: {
            text: "Base salary $325,000 to $400,000.",
          },
        },
      },
    },
    card,
  );
  assert(detailed?.full_posting_captured);
  assert(detailed?.raw_posting_text.includes("Own operating strategy"));
  assert(detailed?.compensation_snippet.includes("$325,000"));
});

Deno.test("Phenom request and parsers read list and detail DDO payloads", () => {
  const request = buildPhenomSearchRequest(
    phenomConfig,
    "marketplace operations",
    10,
  );
  const url = new URL(request.url);
  assertEquals(url.pathname, "/us/en/search-results");
  assertEquals(url.searchParams.get("keywords"), "marketplace operations");
  assertEquals(url.searchParams.get("from"), "10");

  const listHtml = phenomHtml({
    eagerLoadRefineSearch: {
      totalHits: 1,
      data: {
        jobs: [{
          jobId: "J-42",
          title: "Head of Marketplace Operations",
          cityStateCountry: "Tempe, AZ, United States",
          multi_category: ["Operations", "Marketplace"],
          descriptionTeaser: "Scale a high-volume marketplace.",
          postedDate: "2026-07-11",
        }],
      },
    },
  });
  const page = parsePhenomCandidatePage(phenomConfig, listHtml);
  assertEquals(page.cards.length, 1);
  assertEquals(
    page.cards[0].source_url,
    "https://careers.example.com/us/en/job/J-42/head-of-marketplace-operations",
  );
  assertEquals(page.cards[0].summary_text, "Scale a high-volume marketplace.");
  assertEquals(page.cards[0].full_posting_captured, false);

  const detail = parsePhenomDetailResponse(
    phenomConfig,
    phenomHtml({
      jobDetail: {
        data: {
          job: {
            jobId: "J-42",
            title: "Head of Marketplace Operations",
            cityStateCountry: "Tempe, AZ, United States",
            description:
              "<p>Lead marketplace operations.</p><p>Base salary $330,000 - $410,000.</p>",
            ml_skills: ["P&L", "Scaling"],
          },
        },
      },
    }),
    page.cards[0],
  );
  assert(detail?.full_posting_captured);
  assert(detail?.raw_posting_text.includes("Lead marketplace operations"));
  assert(detail?.compensation_snippet.includes("$330,000"));
});

Deno.test("pure parsers safely return empty pages for empty or malformed responses", () => {
  assertEquals(
    parseWorkdayCandidatePage(workdayConfig, null).cards.length,
    0,
  );
  assertEquals(
    parseWorkdayCandidatePage(workdayConfig, { jobPostings: "bad" }).cards
      .length,
    0,
  );
  assertEquals(
    parseSmartRecruitersCandidatePage(smartRecruitersConfig, {}).cards.length,
    0,
  );
  assertEquals(
    parseSmartRecruitersCandidatePage(smartRecruitersConfig, {
      content: [null, "bad"],
    }).cards.length,
    0,
  );
  assertEquals(
    parsePhenomCandidatePage(phenomConfig, "<html>no ddo</html>").cards
      .length,
    0,
  );
  assertEquals(
    parsePhenomCandidatePage(
      phenomConfig,
      "<script>phApp.ddo = {bad}; phApp.experimentData = {};</script>",
    ).cards.length,
    0,
  );
});

function phenomHtml(payload: Record<string, unknown>): string {
  return `<html><script>phApp.ddo = ${
    JSON.stringify(payload)
  }; phApp.experimentData = {};</script></html>`;
}
