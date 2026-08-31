import {
  fetchCustomOfficialSourceJobs,
  parseCustomOfficialSourcePayload,
} from "./job-source-custom-adapters.ts";

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
      message + "\nExpected: " + String(expected) + "\nActual: " +
        String(actual),
    );
  }
}

function assertIncludes(value: string, expected: string): void {
  assert(
    value.includes(expected),
    "Expected " + JSON.stringify(value) + " to include " +
      JSON.stringify(expected),
  );
}

const AMAZON_PAYLOAD = {
  jobs: [{
    id_icims: "A-100",
    job_path: "/en/jobs/A-100/director-operations?cmpid=official",
    title: "Director, Operations",
    normalized_location: "US, AZ, Phoenix",
    country_code: "US",
    job_category: "Operations",
    team: { label: "Global Operations" },
    job_schedule_type: "Full-time",
    posted_date: "2026-07-01",
    updated_time: "2026-07-12",
    description:
      "<p>Lead global operations.</p><p>Base salary: $310,000 - $370,000.</p>",
    basic_qualifications: "<p>12+ years leading teams.</p>",
  }],
};

const ORACLE_PAYLOAD = {
  items: [{
    requisitionList: [{
      Id: "OR-42",
      Title: "VP, Cloud Operations",
      PrimaryLocation: "United States",
      Category: "Cloud Operations",
      Organization: "OCI",
      WorkplaceType: "Hybrid",
      PostedDate: "2026-07-10",
      ShortDescriptionStr:
        "<p>Own cloud operations. Base salary $325,000 to $410,000.</p>",
    }],
  }],
};

const INTUIT_PAYLOAD = {
  results:
    '<li data-category="Business Operations" data-intuit-jobid="INT-9">' +
    '<a href="/job/phoenix/director-business-operations/27595/12345?src=official" ' +
    'data-title="Director, Business Operations">' +
    "<h2>Director, Business Operations</h2>" +
    '<span class="job-location">Phoenix, Arizona</span></a></li>',
};

const LINKEDIN_HTML = '<div class="base-card result job-search-card" ' +
  'data-entity-urn="urn:li:jobPosting:1234567890">' +
  '<a class="base-card__full-link" ' +
  'href="https://www.linkedin.com/jobs/view/director-operations-1234567890?trk=public_jobs">' +
  "Open role</a>" +
  '<h3 class="base-search-card__title">Director, Operations</h3>' +
  '<h4 class="base-search-card__subtitle">LinkedIn</h4>' +
  '<span class="job-search-card__location">Sunnyvale, CA</span>' +
  '<time class="job-search-card__listdate" datetime="2026-07-11"></time>' +
  "</div>";

const TIKTOK_PAYLOAD = {
  data: {
    job_post_list: [{
      id: "TT-88",
      title: "Director, Marketplace Operations",
      city_info: {
        en_name: "Phoenix",
        parent: {
          en_name: "Arizona",
          parent: { en_name: "United States" },
        },
      },
      job_category: { en_name: "Operations" },
      job_subject: { en_name: "Marketplace" },
      recruit_type: { en_name: "Experienced" },
      description: "Lead marketplace operations and service quality.",
      requirement: "Build and scale senior operating teams.",
      job_post_info: {
        min_salary: 320000,
        max_salary: 390000,
        currency: "USD",
      },
    }],
  },
};

const SHOPIFY_HTML = '<a href="/careers/director-business-operations_' +
  '12345678-1234-1234-1234-123456789abc?source=official">Role</a>';

const WAYFAIR_PAYLOAD = {
  jobListData: [{
    requisitionId: "WF-73",
    title: "Director, Network Operations",
    location: {
      name: "Boston, MA, United States",
      country: "United States",
    },
    category: {
      name: "Operations",
      description: "Fulfillment Network",
    },
    teamName: "Network Operations",
    jobTypeDisplayName: "Full-time",
    createdDate: "2026-07-02",
    lastUpdatedDate: "2026-07-13",
    minSalaryRange: 305000,
    maxSalaryRange: 365000,
    currencyType: "USD",
    payRateType: "annual base pay",
    briefDescription: "<p>Scale the fulfillment network.</p>",
    description: "<p>Own service, cost, and delivery performance.</p>",
    applyLink:
      "https://wayfair.avature.net/en_US/careers/JobDetail?jobId=WF-73&source=official",
  }],
};

const MICROSOFT_HTML =
  "<html><body><h1>Director, AI Strategy &amp; Operations Program Manager</h1>" +
  "<p>Lead operating cadence, resource allocation, and executive strategy.</p>" +
  "<p>Bay Area base salary is $165,600 - $272,300.</p>" +
  "</body></html>";

function googleHtml(): string {
  const job: unknown[] = Array(20).fill(null);
  job[0] = "1234567890123";
  job[1] = "Director, Business Operations";
  job[2] = "https://www.google.com/about/careers/applications/signin";
  job[3] = [null, "<p>Build operating systems.</p>"];
  job[9] = [["Phoenix, AZ, USA"], ["Remote eligible, USA"]];
  job[10] = [
    null,
    "<p>Lead strategy and operations.</p>" +
    "<p>Base salary: $330,000 - $410,000.</p>",
  ];
  return "<html><script>var jobs=" + JSON.stringify(job) +
    ";</script></html>";
}

Deno.test("JSON fixtures normalize Amazon, Oracle, TikTok, and Wayfair", () => {
  const amazon = parseCustomOfficialSourcePayload("Amazon", AMAZON_PAYLOAD);
  assertEquals(amazon.length, 1);
  assertEquals(amazon[0].external_id, "A-100");
  assertIncludes(
    amazon[0].source_url,
    "/en/jobs/A-100/director-operations?cmpid=official",
  );
  assertIncludes(amazon[0].full_job_description, "12+ years");
  assertIncludes(amazon[0].compensation_snippet, "$310,000 - $370,000");

  const oracle = parseCustomOfficialSourcePayload("Oracle", ORACLE_PAYLOAD);
  assertEquals(oracle.length, 1);
  assertIncludes(oracle[0].source_url, "/job/OR-42");
  assertIncludes(oracle[0].detail_url, "ById;Id=OR-42");
  assertEquals(oracle[0].team, "OCI");

  const tiktok = parseCustomOfficialSourcePayload(
    "ByteDance",
    TIKTOK_PAYLOAD,
  );
  assertEquals(tiktok.length, 1);
  assertEquals(tiktok[0].company, "TikTok / ByteDance");
  assertEquals(tiktok[0].location, "Phoenix, Arizona, United States");
  assertEquals(
    tiktok[0].compensation_snippet,
    "$320,000 - $390,000 listed salary",
  );

  const wayfair = parseCustomOfficialSourcePayload(
    "Wayfair",
    WAYFAIR_PAYLOAD,
  );
  assertEquals(wayfair.length, 1);
  assertIncludes(wayfair[0].source_url, "jobId=WF-73&source=official");
  assertEquals(
    wayfair[0].compensation_snippet,
    "$305,000 - $365,000 annual base pay",
  );
  assert(wayfair[0].full_posting_captured);
});

Deno.test("HTML fixtures normalize Google, Intuit, LinkedIn, and Shopify", () => {
  const google = parseCustomOfficialSourcePayload("Google", googleHtml());
  assertEquals(google.length, 1);
  assertEquals(google[0].external_id, "1234567890123");
  assertEquals(
    google[0].source_url,
    "https://www.google.com/about/careers/applications/jobs/results/" +
      "1234567890123-director-business-operations",
  );
  assertEquals(
    google[0].location,
    "Phoenix, AZ, USA; Remote eligible, USA",
  );
  assertIncludes(google[0].compensation_snippet, "$330,000 - $410,000");

  const intuit = parseCustomOfficialSourcePayload("Intuit", INTUIT_PAYLOAD);
  assertEquals(intuit.length, 1);
  assertEquals(intuit[0].external_id, "INT-9");
  assertEquals(intuit[0].department, "Business Operations");
  assertIncludes(
    intuit[0].source_url,
    "/job/phoenix/director-business-operations/27595/12345?src=official",
  );

  const linkedIn = parseCustomOfficialSourcePayload(
    "LinkedIn",
    LINKEDIN_HTML,
    { query: "operations" },
  );
  assertEquals(linkedIn.length, 1);
  assertEquals(linkedIn[0].external_id, "1234567890");
  assertIncludes(linkedIn[0].source_url, "?trk=public_jobs");
  assertEquals(linkedIn[0].posted_date, "2026-07-11");
  assertIncludes(linkedIn[0].summary_text, "Search query: operations");

  const shopify = parseCustomOfficialSourcePayload(
    "Shopify",
    SHOPIFY_HTML,
  );
  assertEquals(shopify.length, 1);
  assertEquals(shopify[0].title, "Director Business Operations");
  assertIncludes(shopify[0].source_url, "?source=official");
  assertEquals(shopify[0].location, "Remote / location varies");
  assertEquals(
    shopify[0].workplace_type,
    "Remote or location-flexible needs verification",
  );
});

Deno.test("seed fixtures preserve Microsoft detail and Tesla candidate limits", () => {
  const microsoftUrl =
    "https://microsoft.ai/job/director-ai-strategy-operations-program-manager/";
  const microsoft = parseCustomOfficialSourcePayload(
    "Microsoft",
    MICROSOFT_HTML,
    { requestUrl: microsoftUrl },
  );
  assertEquals(microsoft.length, 1);
  assertEquals(microsoft[0].external_id, "200026167-en-1");
  assert(microsoft[0].full_posting_captured);
  assertIncludes(microsoft[0].full_job_description, "resource allocation");
  assertIncludes(microsoft[0].compensation_snippet, "$165,600 - $272,300");

  const tesla = parseCustomOfficialSourcePayload("Tesla", null);
  assertEquals(tesla.length, 3);
  assertEquals(tesla[0].full_posting_captured, false);
  assertEquals(
    tesla[0].link_health,
    "official_url_indexed_but_importer_403",
  );
  assertIncludes(tesla[0].source_url, "program-manager-service-operations");
  assertEquals(tesla[0].detail_url, "");
});

Deno.test("router handles all ten priority companies using fixtures only", async () => {
  const fixtures: Array<[string, unknown]> = [
    ["Intuit", INTUIT_PAYLOAD],
    ["Google", googleHtml()],
    ["Oracle", ORACLE_PAYLOAD],
    ["TikTok / ByteDance", TIKTOK_PAYLOAD],
    ["Amazon", AMAZON_PAYLOAD],
    ["Shopify", SHOPIFY_HTML],
    ["LinkedIn", LINKEDIN_HTML],
    ["Microsoft", MICROSOFT_HTML],
    ["Wayfair", WAYFAIR_PAYLOAD],
  ];

  for (const [company, payload] of fixtures) {
    let calls = 0;
    const mockFetch: typeof fetch = () => {
      calls += 1;
      return Promise.resolve(
        typeof payload === "string"
          ? new Response(payload, { status: 200 })
          : Response.json(payload),
      );
    };
    const result = await fetchCustomOfficialSourceJobs(company, {
      fetch: mockFetch,
      maxCards: 1,
      maxRequests: 2,
      queries: ["operations"],
    });
    assert(result.handled, company + " should be handled");
    assertEquals(result.company, company);
    assertEquals(result.cards.length, 1, company + " should return one card");
    assertEquals(calls, 1, company + " should make one fixture request");
    assert(result.officialUrls.includes(result.cards[0].source_url));
  }

  let teslaFetches = 0;
  const tesla = await fetchCustomOfficialSourceJobs("Tesla", {
    fetch: () => {
      teslaFetches += 1;
      throw new Error("Tesla candidate-only route must not fetch");
    },
    maxCards: 1,
  });
  assert(tesla.handled);
  assertEquals(tesla.cards.length, 1);
  assertEquals(teslaFetches, 0);
  assertIncludes(tesla.limitations.join(" "), "403 Access Denied");
});

Deno.test("request builders keep fixed official endpoints and request shapes", async () => {
  let intuitUrl = "";
  const intuit = await fetchCustomOfficialSourceJobs("Intuit", {
    fetch: (input, init) => {
      intuitUrl = String(input);
      assertEquals(init?.method, undefined);
      return Promise.resolve(Response.json(INTUIT_PAYLOAD));
    },
    maxCards: 1,
    queries: ["strategy operations"],
  });
  assertEquals(intuit.cards.length, 1);
  const intuitRequest = new URL(intuitUrl);
  assertEquals(intuitRequest.origin, "https://jobs.intuit.com");
  assertEquals(
    intuitRequest.pathname,
    "/search-jobs/results",
  );
  assertEquals(
    intuitRequest.searchParams.get("Keywords"),
    "strategy operations",
  );
  assertEquals(intuitRequest.searchParams.get("CurrentPage"), "1");
  assertEquals(intuitRequest.searchParams.get("Location"), "United States");

  let tiktokBody: Record<string, unknown> = {};
  let tiktokHeaders = new Headers();
  const tiktok = await fetchCustomOfficialSourceJobs("TikTok", {
    fetch: (input, init) => {
      assertEquals(
        String(input),
        "https://api.lifeattiktok.com/api/v1/public/supplier/search/job/posts",
      );
      assertEquals(init?.method, "POST");
      tiktokBody = JSON.parse(String(init?.body));
      tiktokHeaders = new Headers(init?.headers);
      return Promise.resolve(Response.json(TIKTOK_PAYLOAD));
    },
    maxCards: 1,
    queries: ["marketplace operations"],
  });
  assertEquals(tiktok.cards.length, 1);
  assertEquals(tiktokBody.keyword, "marketplace operations");
  assertEquals(tiktokBody.limit, 20);
  assertEquals(tiktokBody.offset, 0);
  assertEquals(tiktokHeaders.get("website-path"), "tiktok");
  assertEquals(tiktokHeaders.get("origin"), "https://lifeattiktok.com");
});

Deno.test("bounded pagination de-duplicates and reports the request cap", async () => {
  let calls = 0;
  const result = await fetchCustomOfficialSourceJobs("Amazon", {
    fetch: () => {
      calls += 1;
      return Promise.resolve(Response.json(AMAZON_PAYLOAD));
    },
    maxCards: 5,
    maxRequests: 2,
    queries: ["operations"],
  });
  assertEquals(calls, 2);
  assertEquals(result.cards.length, 1);
  assertEquals(
    result.errors.filter((error) => error.code === "request_limit_reached")
      .length,
    1,
  );
  assert(
    result.officialUrls.some((url) => url.includes("offset=40")),
    "The blocked next-page URL should be visible for diagnostics",
  );
});

Deno.test("HTTP failures are returned as structured errors", async () => {
  const result = await fetchCustomOfficialSourceJobs("Google", {
    fetch: () =>
      Promise.resolve(
        new Response("unavailable", {
          status: 503,
          statusText: "Service Unavailable",
        }),
      ),
    queries: ["operations"],
  });
  assert(result.handled);
  assertEquals(result.cards.length, 0);
  assertEquals(result.errors.length, 1);
  assertEquals(result.errors[0].code, "request_failed");
  assertEquals(result.errors[0].status, 503);
  assertIncludes(result.errors[0].message, "HTTP 503");
  assertIncludes(result.errors[0].url, "?q=operations");
});

Deno.test("deferred and unknown companies never invoke network fetch", async () => {
  let calls = 0;
  const noFetch: typeof fetch = () => {
    calls += 1;
    throw new Error("Deferred routes must not fetch");
  };
  const deferredCompanies = [
    "Apple",
    "Meta",
    "Netflix",
    "Rivian",
    "Wise",
    "Atlassian",
  ];
  for (const company of deferredCompanies) {
    const result = await fetchCustomOfficialSourceJobs(company, {
      fetch: noFetch,
    });
    assertEquals(result.handled, false);
    assertEquals(result.company, company);
    assertEquals(result.cards.length, 0);
    assertEquals(result.officialUrls.length, 1);
    assertIncludes(result.limitations.join(" "), "Deferred");
  }

  const unknown = await fetchCustomOfficialSourceJobs("Example Co", {
    fetch: noFetch,
  });
  assertEquals(unknown.handled, false);
  assertEquals(unknown.officialUrls.length, 0);
  assertEquals(unknown.limitations.length, 0);
  assertEquals(calls, 0);
});

Deno.test("malformed fixtures return no parser cards", () => {
  for (
    const company of [
      "Amazon",
      "Google",
      "Oracle",
      "Intuit",
      "LinkedIn",
      "TikTok",
      "Shopify",
      "Wayfair",
    ]
  ) {
    assertEquals(
      parseCustomOfficialSourcePayload(company, null).length,
      0,
      company + " should ignore null",
    );
    assertEquals(
      parseCustomOfficialSourcePayload(company, {}).length,
      0,
      company + " should ignore empty objects",
    );
  }
});
