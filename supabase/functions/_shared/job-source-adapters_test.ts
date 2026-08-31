import {
  buildOfficialAtsUrl,
  fetchOfficialAtsJobs,
  type OfficialAtsSourceConfig,
  parseAshbyResponse,
  parseGreenhouseResponse,
  parseLeverResponse,
  parseOfficialAtsResponse,
} from "./job-source-adapters.ts";

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

const greenhouseConfig: OfficialAtsSourceConfig = {
  provider: "greenhouse",
  company: "Acme Market",
  board: "acme-market",
  sourceName: "Acme official careers",
  sourceGroup: "Marketplace Operations",
};

const ashbyConfig: OfficialAtsSourceConfig = {
  provider: "ashby",
  company: "Acme AI",
  board: "acme-ai",
};

const leverConfig: OfficialAtsSourceConfig = {
  provider: "lever",
  company: "Acme Robotics",
  board: "acme-robotics",
};

Deno.test("builds fixed official API URLs for each ATS provider", () => {
  assertEquals(
    buildOfficialAtsUrl(greenhouseConfig),
    "https://boards-api.greenhouse.io/v1/boards/acme-market/jobs?content=true",
  );
  assertEquals(
    buildOfficialAtsUrl(ashbyConfig),
    "https://api.ashbyhq.com/posting-api/job-board/acme-ai",
  );
  assertEquals(
    buildOfficialAtsUrl(leverConfig),
    "https://api.lever.co/v0/postings/acme-robotics?mode=json",
  );
});

Deno.test("parses Greenhouse jobs with metadata and full posting text", () => {
  const cards = parseGreenhouseResponse(greenhouseConfig, {
    jobs: [
      {
        id: 7310,
        title: "Vice President, Marketplace Operations",
        absolute_url: "https://boards.greenhouse.io/acme-market/jobs/7310",
        location: { name: "Phoenix, AZ" },
        departments: [{ name: "Operations" }, { name: "Marketplace" }],
        metadata: [
          { name: "Workplace Type", value: "Hybrid" },
          {
            name: "Base Salary",
            value: {
              currency: "USD",
              min_value: 310000,
              max_value: 365000,
            },
          },
        ],
        first_published: "2026-07-01T12:00:00Z",
        updated_at: "2026-07-11T14:30:00Z",
        content:
          "<p>Lead the marketplace operations organization.</p><p>Own service quality &amp; scaling.</p>",
      },
      null,
      { id: 99 },
    ],
  });

  assertEquals(cards.length, 1);
  assertEquals(cards[0].company, "Acme Market");
  assertEquals(cards[0].department, "Operations / Marketplace");
  assertEquals(cards[0].workplace_type, "Hybrid");
  assertEquals(cards[0].external_id, "7310");
  assertEquals(cards[0].posted_date, "2026-07-01T12:00:00.000Z");
  assert(cards[0].salary_snippet.includes("$310,000 - $365,000"));
  assert(
    cards[0].full_posting_text.includes(
      "Own service quality & scaling.",
    ),
  );
  assertEquals(cards[0].posting_source_name, "Acme official careers");
  assertEquals(cards[0].source_group, "Marketplace Operations");
});

Deno.test("parses listed Ashby jobs and ignores unlisted rows", () => {
  const cards = parseAshbyResponse(ashbyConfig, {
    jobs: [{
      id: "ops-42",
      title: "Head of Business Operations",
      jobUrl: "https://jobs.ashbyhq.com/acme-ai/ops-42",
      location: "New York, NY",
      secondaryLocations: [
        { location: "Remote - US" },
        { location: "New York, NY" },
      ],
      department: "Business Operations",
      team: "Office of the COO",
      workplaceType: "Hybrid",
      publishedAt: "2026-06-30T09:00:00Z",
      descriptionHtml:
        "<h2>The role</h2><p>Build operating systems.</p><p>Base salary: $325,000 to $390,000.</p>",
    }, {
      id: "hidden-1",
      title: "Hidden role",
      isListed: false,
    }],
  });

  assertEquals(cards.length, 1);
  assertEquals(cards[0].location, "New York, NY; Remote - US");
  assertEquals(cards[0].team, "Office of the COO");
  assertEquals(cards[0].ats_provider, "Ashby");
  assert(cards[0].salary_snippet.includes("$325,000 to $390,000"));
  assert(cards[0].card_snippet.includes("Build operating systems"));
  assertEquals(cards[0].full_job_description, cards[0].raw_posting_text);
});

Deno.test("parses Lever arrays, lists, dates, and compensation", () => {
  const createdAt = Date.UTC(2026, 6, 2, 15, 45, 0);
  const cards = parseLeverResponse(leverConfig, [{
    id: "robot-7",
    text: "Director, Fleet Operations",
    hostedUrl: "https://jobs.lever.co/acme-robotics/robot-7",
    createdAt,
    categories: {
      location: "Scottsdale, AZ",
      department: "Operations",
      team: "Fleet",
      commitment: "Full-time",
    },
    descriptionPlain: "Own a national autonomous fleet.",
    lists: [{
      text: "Responsibilities",
      content: "<ul><li>Lead 24/7 operations</li></ul>",
    }],
    additional: "<p>The annual base salary range is $305,000 - $350,000.</p>",
  }]);

  assertEquals(cards.length, 1);
  assertEquals(cards[0].title, "Director, Fleet Operations");
  assertEquals(cards[0].location, "Scottsdale, AZ");
  assertEquals(cards[0].department, "Operations");
  assertEquals(cards[0].team, "Fleet");
  assertEquals(cards[0].workplace, "Full-time");
  assertEquals(cards[0].posted_date, "2026-07-02T15:45:00.000Z");
  assert(cards[0].full_posting_text.includes("Lead 24/7 operations"));
  assert(cards[0].salary_snippet.includes("$305,000 - $350,000"));
});

Deno.test("salary snippets center the actual base range instead of nearby benefit numbers", () => {
  const cards = parseGreenhouseResponse(greenhouseConfig, {
    jobs: [{
      id: 7311,
      title: "Director, Operations",
      absolute_url: "https://boards.greenhouse.io/acme-market/jobs/7311",
      content:
        "<p>Paid time off accrues at about 5.2 hours/month.</p><p>The national base pay range for this position is $310,000 &amp;mdash; $365,000 USD annually, plus equity.</p>",
    }],
  });

  assertEquals(cards.length, 1);
  assert(cards[0].salary_snippet.includes("$310,000 - $365,000"));
  assert(!cards[0].salary_snippet.startsWith("Paid time off"));
});

Deno.test("returns no cards for malformed or empty provider responses", () => {
  const malformed: unknown[] = [
    null,
    undefined,
    "not-json",
    42,
    [],
    {},
    { jobs: "not-an-array" },
    { jobs: [null, "bad-row", { id: "missing-title" }] },
  ];

  for (const payload of malformed) {
    assertEquals(
      parseOfficialAtsResponse(greenhouseConfig, payload).length,
      0,
    );
    assertEquals(parseOfficialAtsResponse(ashbyConfig, payload).length, 0);
    assertEquals(parseOfficialAtsResponse(leverConfig, payload).length, 0);
  }
});

Deno.test("fetch helper uses the official URL and normalized parser", async () => {
  let requestedUrl = "";
  const cards = await fetchOfficialAtsJobs(leverConfig, {
    fetcher: (input, init) => {
      requestedUrl = String(input);
      assertEquals(init?.method, "GET");
      assert(init?.signal instanceof AbortSignal);
      return Promise.resolve(Response.json([{
        id: "ops-1",
        text: "VP Operations",
        hostedUrl: "https://jobs.lever.co/acme-robotics/ops-1",
      }]));
    },
    timeoutMs: 500,
  });

  assertEquals(requestedUrl, buildOfficialAtsUrl(leverConfig));
  assertEquals(cards.length, 1);
  assertEquals(cards[0].source_adapter_type, "ats_lever");
});

Deno.test("fetch helper rejects non-success provider responses", async () => {
  let error = "";
  try {
    await fetchOfficialAtsJobs(ashbyConfig, {
      fetcher: () =>
        Promise.resolve(
          new Response("unavailable", {
            status: 503,
          }),
        ),
      timeoutMs: 500,
    });
  } catch (cause) {
    error = cause instanceof Error ? cause.message : String(cause);
  }
  assert(error.includes("Ashby jobs request failed with HTTP 503"));
});
