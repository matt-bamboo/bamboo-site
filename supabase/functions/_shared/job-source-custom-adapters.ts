export type CustomOfficialSourceAdapter =
  | "amazon"
  | "google_html"
  | "official_detail_seeds"
  | "oracle_hcm"
  | "intuit"
  | "linkedin_guest"
  | "tiktok_api"
  | "shopify_html"
  | "wayfair_api";

export type CustomOfficialSourceErrorCode =
  | "request_failed"
  | "request_timeout"
  | "request_aborted"
  | "request_limit_reached"
  | "parse_failed";

export interface CustomOfficialSourceCard {
  id: string;
  job_result_id: string;
  company: string;
  title: string;
  role_title: string;
  location: string;
  department: string;
  team: string;
  workplace: string;
  workplace_type: string;
  work_style: string;
  posted_date: string;
  updated_at: string;
  provider: CustomOfficialSourceAdapter;
  source_type:
    | "official_ats"
    | "official_ats_api"
    | "official_careers_api"
    | "official_careers_page"
    | "official_careers_detail"
    | "linkedin_company_jobs";
  source_adapter_type: string;
  ats_provider: string;
  source_group: string;
  posting_source_name: string;
  job_url: string;
  source_url: string;
  official_source_url: string;
  ats_source_url: string;
  detail_url: string;
  detail_type: string;
  external_id: string;
  job_id_external: string;
  company_job_id: string;
  salary_snippet: string;
  compensation_snippet: string;
  card_snippet: string;
  short_card_snippet: string;
  summary_text: string;
  description_text: string;
  full_posting_text: string;
  full_job_description: string;
  raw_posting_text: string;
  full_posting_captured: boolean;
  link_health: string;
  active_status: "needs_verification";
  source_verified_by: string;
  source_verification_notes: string;
  detail_capture_error: string;
}

export interface CustomOfficialSourceError {
  code: CustomOfficialSourceErrorCode;
  company: string;
  adapter: CustomOfficialSourceAdapter;
  url: string;
  query: string;
  message: string;
  status?: number;
}

export interface CustomOfficialSourceResult {
  handled: boolean;
  company: string;
  adapter: CustomOfficialSourceAdapter | null;
  cards: CustomOfficialSourceCard[];
  officialUrls: string[];
  errors: CustomOfficialSourceError[];
  limitations: string[];
}

export interface CustomOfficialSourceFetchOptions {
  fetch?: typeof fetch;
  fetcher?: typeof fetch;
  signal?: AbortSignal;
  timeoutMs?: number;
  maxCards?: number;
  maxRequests?: number;
  queries?: string[];
}

export interface CustomOfficialSourceParseContext {
  query?: string;
  requestUrl?: string;
}

interface DetailSeed {
  url: string;
  title: string;
  location?: string;
  department?: string;
  team?: string;
  workplaceType?: string;
  externalId?: string;
  detailType?: "official_html";
  compensationSnippet?: string;
  summaryText?: string;
  candidateOnly?: boolean;
  linkHealth?: string;
  sourceVerifiedBy?: string;
  sourceVerificationNotes?: string;
}

interface SourceDefinition {
  company: string;
  aliases: readonly string[];
  adapter: CustomOfficialSourceAdapter;
  url: string;
  provider: string;
  sourceGroup: string;
  queries: readonly string[];
  seeds?: readonly DetailSeed[];
  limitations?: readonly string[];
}

interface DeferredSourceDefinition {
  company: string;
  aliases: readonly string[];
  url: string;
  reason: string;
}

interface CardInput {
  sourceType: CustomOfficialSourceCard["source_type"];
  sourceUrl: string;
  externalId: string;
  title: string;
  location?: string;
  department?: string;
  team?: string;
  workplaceType?: string;
  postedDate?: string;
  updatedAt?: string;
  compensationSnippet?: string;
  summaryText?: string;
  descriptionText?: string;
  detailUrl?: string;
  detailType?: string;
  fullPostingCaptured?: boolean;
  linkHealth?: string;
  sourceVerifiedBy?: string;
  sourceVerificationNotes?: string;
  detailCaptureError?: string;
}

interface FetchState {
  definition: SourceDefinition;
  fetcher: typeof fetch;
  signal?: AbortSignal;
  timeoutMs: number;
  maxCards: number;
  maxRequests: number;
  queries: string[];
  requestCount: number;
  requestLimitReported: boolean;
  stopped: boolean;
  cards: CustomOfficialSourceCard[];
  seenCards: Set<string>;
  officialUrls: Set<string>;
  errors: CustomOfficialSourceError[];
}

interface PayloadResult {
  ok: boolean;
  payload?: unknown;
}

const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_MAX_CARDS = 200;
const DEFAULT_MAX_REQUESTS = 32;

const SOURCE_DEFINITIONS: readonly SourceDefinition[] = [
  {
    company: "Amazon",
    aliases: ["amazon", "amazon.com", "amazon jobs"],
    adapter: "amazon",
    url: "https://www.amazon.jobs/en/search.json",
    provider: "Amazon Jobs API",
    sourceGroup: "Marketplace / Commerce / Logistics",
    queries: [
      "operations",
      "strategy operations",
      "customer operations",
      "director operations",
    ],
  },
  {
    company: "Google",
    aliases: ["google", "google llc"],
    adapter: "google_html",
    url: "https://www.google.com/about/careers/applications/jobs/results/",
    provider: "Google official careers HTML",
    sourceGroup: "Enterprise / AI / Business Operations",
    queries: [
      "operations",
      "strategy operations",
      "business operations",
      "customer operations",
      "logistics operations",
      "director operations",
    ],
  },
  {
    company: "Microsoft",
    aliases: ["microsoft", "microsoft ai"],
    adapter: "official_detail_seeds",
    url: "https://microsoft.ai/careers/",
    provider: "Microsoft AI official careers",
    sourceGroup: "AI / Strategy & Operations",
    queries: [],
    limitations: [
      "Microsoft's standard Eightfold public jobs API returned HTTP 403 Not authorized for PCSX; this route is limited to curated public microsoft.ai detail seeds.",
    ],
    seeds: [{
      url:
        "https://microsoft.ai/job/director-ai-strategy-operations-program-manager/",
      title: "Director, AI Strategy & Operations Program Manager",
      location: "Mountain View, United States",
      department: "Business Strategy",
      team: "Microsoft Superintelligence / Office of the CEO of Microsoft AI",
      workplaceType: "On-site / relocation likely",
      externalId: "200026167-en-1",
      detailType: "official_html",
      compensationSnippet:
        "Business Strategy IC5 base pay range: U.S. $130,900-$251,900; SF Bay Area and New York City $165,600-$272,300. Other compensation may apply.",
      sourceVerificationNotes:
        "Captured from Microsoft AI official careers. The standard Microsoft Eightfold careers search shell loads, but the direct public jobs API returned 403 Not authorized for PCSX during importer probing.",
      summaryText:
        "Official Microsoft AI careers detail for a Strategy & Operations director role in the Office of the CEO of Microsoft AI, focused on operating cadence, compute and resource allocation, competitive intelligence, cross-functional execution, and executive-ready strategic analysis.",
    }],
  },
  {
    company: "Oracle",
    aliases: ["oracle", "oracle corporation"],
    adapter: "oracle_hcm",
    url: "https://eeho.fa.us2.oraclecloud.com",
    provider: "Oracle HCM Candidate Experience",
    sourceGroup: "Enterprise / Cloud Infrastructure / Operations",
    queries: [
      "director operations",
      "data center operations",
      "strategy operations",
      "business operations",
      "network operations",
      "customer operations",
    ],
  },
  {
    company: "Intuit",
    aliases: ["intuit"],
    adapter: "intuit",
    url: "https://jobs.intuit.com/search-jobs/results",
    provider: "Intuit official careers search",
    sourceGroup: "Fintech / Business Operations",
    queries: [
      "operations",
      "strategy operations",
      "business operations",
      "customer operations",
    ],
  },
  {
    company: "LinkedIn",
    aliases: ["linkedin", "linked in"],
    adapter: "linkedin_guest",
    url:
      "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search",
    provider: "LinkedIn official careers / company jobs",
    sourceGroup: "Enterprise / Business Operations",
    queries: [
      "operations",
      "strategy operations",
      "business operations",
      "customer operations",
      "director operations",
      "program operations",
    ],
    limitations: [
      "Discovery uses LinkedIn's public company-jobs surface because the legacy LinkedIn Greenhouse board is stale and test-heavy.",
    ],
  },
  {
    company: "TikTok / ByteDance",
    aliases: [
      "tiktok / bytedance",
      "tiktok/bytedance",
      "tiktok",
      "bytedance",
      "byte dance",
    ],
    adapter: "tiktok_api",
    url: "https://api.lifeattiktok.com/api/v1/public/supplier/search/job/posts",
    provider: "TikTok official careers API",
    sourceGroup: "Marketplace / Commerce / Customer Operations",
    queries: [
      "operations",
      "strategy operations",
      "business operations",
      "customer experience",
      "marketplace operations",
      "logistics operations",
      "trust safety",
    ],
  },
  {
    company: "Shopify",
    aliases: ["shopify"],
    adapter: "shopify_html",
    url: "https://www.shopify.com/careers",
    provider: "Shopify official careers HTML",
    sourceGroup: "Marketplace / Commerce / Business Operations",
    queries: [],
  },
  {
    company: "Wayfair",
    aliases: ["wayfair"],
    adapter: "wayfair_api",
    url: "https://www.wayfair.com/a/careers/careers/job_search_data",
    provider: "Wayfair official careers API / Avature",
    sourceGroup: "Marketplace / Commerce / Fulfillment Operations",
    queries: [
      "operations",
      "strategy",
      "customer experience",
      "network operations",
      "retail strategy",
      "service provider strategy",
    ],
  },
  {
    company: "Tesla",
    aliases: ["tesla", "tesla motors"],
    adapter: "official_detail_seeds",
    url: "https://www.tesla.com/careers/search/?query=operations&site=US",
    provider: "Tesla official careers detail pages",
    sourceGroup: "Real-World Tech / Automotive / Energy Operations",
    queries: [],
    limitations: [
      "Tesla official careers returned HTTP 403 Access Denied to the non-browser importer; this route emits curated official candidate cards without scraping or claiming full-posting capture.",
    ],
    seeds: [
      {
        url:
          "https://www.tesla.com/careers/search/job/program-manager-service-operations-266960",
        title: "Program Manager, Service Operations",
        location: "Austin, Texas",
        department: "Operations & Business Support",
        team: "North America Service Operations",
        workplaceType: "On-site / relocation likely",
        candidateOnly: true,
        linkHealth: "official_url_indexed_but_importer_403",
        sourceVerifiedBy: "official_url_indexed_candidate_card",
        sourceVerificationNotes:
          "Tesla's official page is indexed and browser-visible, but returned 403 Access Denied to the non-browser importer, so this remains candidate-card-only until a browser capture path is used.",
        summaryText:
          "Official Tesla careers page identifies a service operations program manager role in Austin; full posting capture is blocked by Tesla Access Denied for the importer.",
      },
      {
        url:
          "https://www.tesla.com/careers/search/job/sr-manager-production-operations-energy-products-261348",
        title: "Sr. Manager, Production Operations, Energy Products",
        location: "Lathrop, California",
        department: "Manufacturing",
        team: "Energy Products Production Operations",
        workplaceType: "On-site / relocation likely",
        candidateOnly: true,
        linkHealth: "official_url_indexed_but_importer_403",
        sourceVerifiedBy: "official_url_indexed_candidate_card",
        sourceVerificationNotes:
          "Tesla's official page is indexed and browser-visible, but returned 403 Access Denied to the non-browser importer, so this remains candidate-card-only until a browser capture path is used.",
        summaryText:
          "Official Tesla careers page identifies a senior production operations leadership role; full posting capture is blocked by Tesla Access Denied for the importer.",
      },
      {
        url:
          "https://www.tesla.com/careers/search/job/delivery-operations-manager-semi-265638",
        title: "Delivery Operations Manager, Semi",
        location: "Palo Alto, California",
        department: "Sales & Customer Support",
        team: "Semi Delivery Operations",
        workplaceType: "On-site / relocation likely",
        candidateOnly: true,
        linkHealth: "official_url_indexed_but_importer_403",
        sourceVerifiedBy: "official_url_indexed_candidate_card",
        sourceVerificationNotes:
          "Tesla's official page is indexed and browser-visible, but returned 403 Access Denied to the non-browser importer, so this remains candidate-card-only until a browser capture path is used.",
        summaryText:
          "Official Tesla careers page identifies a delivery operations manager role for Semi; full posting capture is blocked by Tesla Access Denied for the importer.",
      },
    ],
  },
];

const DEFERRED_SOURCE_DEFINITIONS: readonly DeferredSourceDefinition[] = [
  {
    company: "Apple",
    aliases: ["apple", "apple inc"],
    url: "https://jobs.apple.com/en-us/search",
    reason:
      "Deferred by the bounded priority gate. The source importer has a public Apple careers HTML parser; no source-access blocker was established.",
  },
  {
    company: "Meta",
    aliases: ["meta", "meta platforms", "facebook"],
    url: "https://www.metacareers.com/jobs/?q=operations",
    reason:
      "Deferred by the bounded priority gate. The source importer has no deterministic company-wide Meta listing endpoint and only carries a curated public JSON-LD detail seed.",
  },
  {
    company: "Netflix",
    aliases: ["netflix"],
    url: "https://explore.jobs.netflix.net/api/apply/v2/jobs",
    reason:
      "Deferred by the bounded priority gate. The source importer has a public Netflix jobs API adapter; no source-access blocker was established.",
  },
  {
    company: "Rivian",
    aliases: ["rivian", "rivian automotive"],
    url: "https://careers.rivian.com/api/jobs",
    reason:
      "Deferred by the bounded priority gate. The source importer has a public Rivian Jibe API adapter; no source-access blocker was established.",
  },
  {
    company: "Wise",
    aliases: ["wise", "wise plc", "transferwise"],
    url: "https://wise.jobs/jobs",
    reason:
      "Deferred by the bounded priority gate. The source importer has a public Wise Attrax HTML parser; no source-access blocker was established.",
  },
  {
    company: "Atlassian",
    aliases: ["atlassian"],
    url: "https://www.atlassian.com/company/careers/all-jobs?search=operations",
    reason:
      "Deferred by the bounded priority gate. The source importer has no deterministic company-wide Atlassian listing endpoint and only carries curated public detail seeds.",
  },
];

const SOURCE_BY_ALIAS = new Map<string, SourceDefinition>();
for (const definition of SOURCE_DEFINITIONS) {
  SOURCE_BY_ALIAS.set(companyKey(definition.company), definition);
  for (const alias of definition.aliases) {
    SOURCE_BY_ALIAS.set(companyKey(alias), definition);
  }
}

const DEFERRED_SOURCE_BY_ALIAS = new Map<
  string,
  DeferredSourceDefinition
>();
for (const definition of DEFERRED_SOURCE_DEFINITIONS) {
  DEFERRED_SOURCE_BY_ALIAS.set(companyKey(definition.company), definition);
  for (const alias of definition.aliases) {
    DEFERRED_SOURCE_BY_ALIAS.set(companyKey(alias), definition);
  }
}

export async function fetchCustomOfficialSourceJobs(
  company: string,
  options: CustomOfficialSourceFetchOptions = {},
): Promise<CustomOfficialSourceResult> {
  const definition = sourceDefinition(company);
  if (!definition) {
    const deferred = deferredSourceDefinition(company);
    return {
      handled: false,
      company: deferred?.company ?? normalizeWhitespace(company),
      adapter: null,
      cards: [],
      officialUrls: deferred ? [deferred.url] : [],
      errors: [],
      limitations: deferred ? [deferred.reason] : [],
    };
  }

  const state: FetchState = {
    definition,
    fetcher: options.fetch ?? options.fetcher ?? globalThis.fetch,
    signal: options.signal,
    timeoutMs: boundedInteger(
      options.timeoutMs,
      100,
      60_000,
      DEFAULT_TIMEOUT_MS,
    ),
    maxCards: boundedInteger(
      options.maxCards,
      1,
      500,
      DEFAULT_MAX_CARDS,
    ),
    maxRequests: boundedInteger(
      options.maxRequests,
      1,
      100,
      DEFAULT_MAX_REQUESTS,
    ),
    queries: sourceQueries(definition, options.queries),
    requestCount: 0,
    requestLimitReported: false,
    stopped: false,
    cards: [],
    seenCards: new Set(),
    officialUrls: new Set([definition.url]),
    errors: [],
  };

  await runSource(state);

  return {
    handled: true,
    company: definition.company,
    adapter: definition.adapter,
    cards: state.cards,
    officialUrls: [...state.officialUrls],
    errors: state.errors,
    limitations: [...(definition.limitations ?? [])],
  };
}

export function parseCustomOfficialSourcePayload(
  company: string,
  payload: unknown,
  context: CustomOfficialSourceParseContext = {},
): CustomOfficialSourceCard[] {
  const definition = sourceDefinition(company);
  if (!definition) return [];

  switch (definition.adapter) {
    case "amazon":
      return parseAmazon(definition, payload);
    case "google_html":
      return parseGoogle(definition, payload);
    case "official_detail_seeds":
      return parseOfficialDetailSeeds(definition, payload, context);
    case "oracle_hcm":
      return parseOracle(definition, payload);
    case "intuit":
      return parseIntuit(definition, payload);
    case "linkedin_guest":
      return parseLinkedIn(definition, payload, context.query ?? "");
    case "tiktok_api":
      return parseTikTok(definition, payload);
    case "shopify_html":
      return parseShopify(definition, payload);
    case "wayfair_api":
      return parseWayfair(definition, payload);
  }
}

async function runSource(state: FetchState): Promise<void> {
  switch (state.definition.adapter) {
    case "amazon":
      await fetchAmazon(state);
      return;
    case "google_html":
      await fetchGoogle(state);
      return;
    case "official_detail_seeds":
      await fetchOfficialDetailSeeds(state);
      return;
    case "oracle_hcm":
      await fetchOracle(state);
      return;
    case "intuit":
      await fetchIntuit(state);
      return;
    case "linkedin_guest":
      await fetchLinkedIn(state);
      return;
    case "tiktok_api":
      await fetchTikTok(state);
      return;
    case "shopify_html":
      await fetchSingleHtml(state);
      return;
    case "wayfair_api":
      await fetchWayfair(state);
      return;
  }
}

async function fetchAmazon(state: FetchState): Promise<void> {
  for (const query of state.queries) {
    for (let offset = 0; offset < 2_000 && canContinue(state); offset += 20) {
      const url = new URL(state.definition.url);
      url.searchParams.set("base_query", query);
      url.searchParams.set("result_limit", "20");
      url.searchParams.set("offset", String(offset));
      url.searchParams.set("sort", "relevant");
      const result = await requestPayload(state, url.href, {}, query, "json");
      if (!result.ok) break;
      parseAndAppend(state, result.payload, { query, requestUrl: url.href });
      if (asRecordArray(asRecord(result.payload)?.jobs).length === 0) break;
    }
  }
}

async function fetchGoogle(state: FetchState): Promise<void> {
  for (const query of state.queries) {
    if (!canContinue(state)) break;
    const url = new URL(state.definition.url);
    url.searchParams.set("q", query);
    const result = await requestPayload(state, url.href, {}, query, "text");
    if (result.ok) {
      parseAndAppend(state, result.payload, { query, requestUrl: url.href });
    }
  }
}

async function fetchOfficialDetailSeeds(state: FetchState): Promise<void> {
  for (const seed of state.definition.seeds ?? []) {
    if (!canContinue(state)) break;
    state.officialUrls.add(seed.url);
    if (seed.candidateOnly) {
      appendCards(state, [seedCard(state.definition, seed)]);
      continue;
    }

    const result = await requestPayload(
      state,
      seed.url,
      {},
      "",
      "text",
    );
    if (result.ok) {
      parseAndAppend(state, result.payload, { requestUrl: seed.url });
    } else {
      appendCards(state, [
        seedCard(
          state.definition,
          seed,
          state.errors.at(-1)?.message ?? "Official detail capture failed",
        ),
      ]);
    }
  }
}

async function fetchOracle(state: FetchState): Promise<void> {
  const base = state.definition.url;
  for (const query of state.queries) {
    for (let offset = 0; offset <= 250 && canContinue(state); offset += 25) {
      const url = base +
        "/hcmRestApi/resources/latest/recruitingCEJobRequisitions" +
        "?onlyData=true&limit=25&offset=" + offset +
        "&fields=requisitionList&finder=findReqs;siteNumber=CX_45001,keyword=" +
        encodeURIComponent(query) + ",locationId=300000000149325";
      const result = await requestPayload(state, url, {}, query, "json");
      if (!result.ok) break;
      parseAndAppend(state, result.payload, { query, requestUrl: url });
      const root = asRecord(result.payload);
      const rows = asRecordArray(
        asRecordArray(root?.items)[0]?.requisitionList,
      );
      if (rows.length < 25) break;
    }
  }
}

async function fetchIntuit(state: FetchState): Promise<void> {
  for (const query of state.queries) {
    for (let page = 1; page <= 20 && canContinue(state); page += 1) {
      const url = new URL(state.definition.url);
      const parameters: Record<string, string> = {
        ActiveFacetID: "0",
        CurrentPage: String(page),
        RecordsPerPage: "20",
        Distance: "50",
        RadiusUnitType: "0",
        Keywords: query,
        Location: "United States",
        ShowRadius: "False",
        CustomFacetName: "",
        FacetTerm: "",
        FacetType: "0",
        SearchResultsModuleName: "Search Results",
        SearchFiltersModuleName: "Search Filters",
        SearchType: "5",
      };
      for (const [name, value] of Object.entries(parameters)) {
        url.searchParams.set(name, value);
      }
      const result = await requestPayload(state, url.href, {}, query, "json");
      if (!result.ok) break;
      parseAndAppend(state, result.payload, { query, requestUrl: url.href });
      if (intuitRows(result.payload).length === 0) break;
    }
  }
}

async function fetchLinkedIn(state: FetchState): Promise<void> {
  for (const query of state.queries) {
    for (const start of [0, 25, 50, 75]) {
      if (!canContinue(state)) break;
      const url = new URL(state.definition.url);
      url.searchParams.set("keywords", query);
      url.searchParams.set("location", "United States");
      url.searchParams.set("f_C", "1337");
      url.searchParams.set("start", String(start));
      const result = await requestPayload(state, url.href, {}, query, "text");
      if (!result.ok) break;
      const before = state.cards.length;
      parseAndAppend(state, result.payload, { query, requestUrl: url.href });
      const blockCount = linkedInBlocks(result.payload).length;
      if (blockCount === 0 || state.cards.length === before) break;
    }
  }
}

async function fetchTikTok(state: FetchState): Promise<void> {
  for (const query of state.queries) {
    for (let offset = 0; offset < 120 && canContinue(state); offset += 20) {
      const body = { keyword: query, limit: 20, offset };
      const result = await requestPayload(
        state,
        state.definition.url,
        {
          method: "POST",
          headers: {
            accept: "application/json, text/plain, */*",
            "accept-language": "en",
            "content-type": "application/json",
            "language-api-header": "en",
            origin: "https://lifeattiktok.com",
            "website-path": "tiktok",
          },
          body: JSON.stringify(body),
        },
        query,
        "json",
      );
      if (!result.ok) break;
      parseAndAppend(state, result.payload, {
        query,
        requestUrl: state.definition.url,
      });
      const jobs = asRecordArray(
        asRecord(asRecord(result.payload)?.data)?.job_post_list,
      );
      if (jobs.length < 20) break;
    }
  }
}

async function fetchWayfair(state: FetchState): Promise<void> {
  for (const query of state.queries) {
    if (!canContinue(state)) break;
    const result = await requestPayload(
      state,
      state.definition.url,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ keywords: query }),
      },
      query,
      "json",
    );
    if (result.ok) {
      parseAndAppend(state, result.payload, {
        query,
        requestUrl: state.definition.url,
      });
    }
  }
}

async function fetchSingleHtml(state: FetchState): Promise<void> {
  if (!canContinue(state)) return;
  const result = await requestPayload(
    state,
    state.definition.url,
    {},
    "",
    "text",
  );
  if (result.ok) {
    parseAndAppend(state, result.payload, {
      requestUrl: state.definition.url,
    });
  }
}

async function requestPayload(
  state: FetchState,
  url: string,
  init: RequestInit,
  query: string,
  responseType: "json" | "text",
): Promise<PayloadResult> {
  if (!reserveRequest(state, url, query)) return { ok: false };

  const controller = new AbortController();
  let timedOut = false;
  let callerAborted = false;
  const abortFromCaller = () => {
    callerAborted = true;
    controller.abort(state.signal?.reason);
  };
  if (state.signal?.aborted) abortFromCaller();
  else {
    state.signal?.addEventListener("abort", abortFromCaller, { once: true });
  }

  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort(
      new DOMException("Official source request timed out", "TimeoutError"),
    );
  }, state.timeoutMs);

  try {
    const headers = new Headers({
      accept: responseType === "json"
        ? "application/json"
        : "application/json,text/html;q=0.9,*/*;q=0.8",
      "user-agent":
        "Mozilla/5.0 Bamboo Job Command Center official-source adapter",
    });
    new Headers(init.headers).forEach((value, name) => {
      headers.set(name, value);
    });
    const response = await state.fetcher(url, {
      ...init,
      headers,
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new HttpStatusError(response.status, response.statusText);
    }
    return {
      ok: true,
      payload: responseType === "json"
        ? await response.json()
        : await response.text(),
    };
  } catch (cause) {
    const status = cause instanceof HttpStatusError ? cause.status : undefined;
    const code: CustomOfficialSourceErrorCode = timedOut
      ? "request_timeout"
      : callerAborted
      ? "request_aborted"
      : "request_failed";
    const message = timedOut
      ? state.definition.company + " official source request timed out"
      : callerAborted
      ? state.definition.company + " official source request was aborted"
      : cause instanceof HttpStatusError
      ? state.definition.company +
        " official source request failed with HTTP " +
        cause.status + (cause.statusText ? " " + cause.statusText : "")
      : cause instanceof Error
      ? cause.message
      : String(cause);
    state.errors.push({
      code,
      company: state.definition.company,
      adapter: state.definition.adapter,
      url,
      query,
      message,
      ...(status === undefined ? {} : { status }),
    });
    if (callerAborted) state.stopped = true;
    return { ok: false };
  } finally {
    clearTimeout(timeout);
    state.signal?.removeEventListener("abort", abortFromCaller);
  }
}

function reserveRequest(
  state: FetchState,
  url: string,
  query: string,
): boolean {
  state.officialUrls.add(url);
  if (state.stopped || state.cards.length >= state.maxCards) return false;
  if (state.requestCount < state.maxRequests) {
    state.requestCount += 1;
    return true;
  }
  if (!state.requestLimitReported) {
    state.requestLimitReported = true;
    state.errors.push({
      code: "request_limit_reached",
      company: state.definition.company,
      adapter: state.definition.adapter,
      url,
      query,
      message: state.definition.company +
        " reached the bounded request limit of " +
        state.maxRequests,
    });
  }
  state.stopped = true;
  return false;
}

function parseAndAppend(
  state: FetchState,
  payload: unknown,
  context: CustomOfficialSourceParseContext,
): number {
  try {
    return appendCards(
      state,
      parseCustomOfficialSourcePayload(
        state.definition.company,
        payload,
        context,
      ),
    );
  } catch (cause) {
    state.errors.push({
      code: "parse_failed",
      company: state.definition.company,
      adapter: state.definition.adapter,
      url: context.requestUrl ?? state.definition.url,
      query: context.query ?? "",
      message: cause instanceof Error ? cause.message : String(cause),
    });
    return 0;
  }
}

function appendCards(
  state: FetchState,
  cards: CustomOfficialSourceCard[],
): number {
  let added = 0;
  for (const card of cards) {
    if (state.cards.length >= state.maxCards) break;
    const key = normalizeWhitespace(card.external_id || card.source_url)
      .toLowerCase();
    if (!key || state.seenCards.has(key)) continue;
    state.seenCards.add(key);
    state.cards.push(card);
    state.officialUrls.add(card.source_url);
    if (card.detail_url) state.officialUrls.add(card.detail_url);
    added += 1;
  }
  return added;
}

function parseAmazon(
  definition: SourceDefinition,
  payload: unknown,
): CustomOfficialSourceCard[] {
  return asRecordArray(asRecord(payload)?.jobs).flatMap((job) => {
    const externalId = firstString(
      job.id_icims,
      job.id,
      job.job_path,
    );
    const location = firstString(
      job.normalized_location,
      job.location,
      [
        firstString(job.city),
        firstString(job.state),
        firstString(job.country_code),
      ].filter(Boolean).join(", "),
    );
    if (
      !isLikelyUsJob(
        [
          firstString(job.country_code),
          firstString(job.location),
          firstString(job.normalized_location),
        ].join(" "),
      )
    ) return [];
    const description = normalizePostingText(
      [
        htmlToText(job.description),
        firstString(job.basic_qualifications)
          ? "Basic qualifications: " +
            htmlToText(job.basic_qualifications)
          : "",
        firstString(job.preferred_qualifications)
          ? "Preferred qualifications: " +
            htmlToText(job.preferred_qualifications)
          : "",
      ].filter(Boolean).join("\n"),
    );
    const sourceUrl = safeHttpUrl(
      firstString(job.job_path) ||
        "/en/jobs/" + encodeURIComponent(firstString(job.id_icims, job.id)),
      "https://www.amazon.jobs",
    );
    return oneCard(definition, {
      sourceType: "official_careers_api",
      sourceUrl,
      externalId,
      title: firstString(job.title),
      location,
      department: firstString(job.job_category, job.business_category),
      team: firstString(
        asRecord(job.team)?.label,
        job.job_family,
        job.job_category,
      ),
      workplaceType: firstString(job.job_schedule_type),
      postedDate: firstString(job.posted_date),
      updatedAt: firstString(job.updated_time),
      descriptionText: description,
      fullPostingCaptured: Boolean(description),
    });
  });
}

function parseGoogle(
  definition: SourceDefinition,
  payload: unknown,
): CustomOfficialSourceCard[] {
  return extractGoogleJobArrays(String(payload ?? "")).flatMap((job) => {
    const externalId = firstString(job[0]);
    const title = firstString(job[1]);
    const locations = googleLocations(job[9]);
    const description = normalizePostingText(
      [
        htmlToText(googleSection(job[10])),
        htmlToText(googleSection(job[3])),
        htmlToText(googleSection(job[4])),
        htmlToText(googleSection(job[15])),
        htmlToText(googleSection(job[19])),
      ].filter(Boolean).join("\n"),
    );
    const sourceUrl =
      "https://www.google.com/about/careers/applications/jobs/results/" +
      encodeURIComponent(externalId) + "-" + titleSlug(title);
    return oneCard(definition, {
      sourceType: "official_careers_page",
      sourceUrl,
      externalId,
      title,
      location: locations || "Needs verification",
      workplaceType: /remote/i.test(locations + " " + description)
        ? "Remote eligibility needs verification"
        : "",
      compensationSnippet: extractCompensationSnippet(description),
      descriptionText: description,
      fullPostingCaptured: Boolean(description),
    });
  });
}

function parseOracle(
  definition: SourceDefinition,
  payload: unknown,
): CustomOfficialSourceCard[] {
  const search = asRecordArray(asRecord(payload)?.items)[0];
  return asRecordArray(search?.requisitionList).flatMap((job) => {
    const id = firstString(job.Id, job.RequisitionId);
    const summary = htmlToText(job.ShortDescriptionStr);
    const sourceUrl = definition.url +
      "/hcmUI/CandidateExperience/en/sites/jobsearch/job/" +
      encodeURIComponent(id);
    const detailUrl = definition.url +
      "/hcmRestApi/resources/latest/recruitingCEJobRequisitionDetails" +
      "?expand=all&onlyData=true&finder=ById;Id=" +
      encodeURIComponent(id) + ",siteNumber=CX_45001";
    return oneCard(definition, {
      sourceType: "official_ats",
      sourceUrl,
      detailUrl,
      detailType: "oracle_hcm",
      externalId: id,
      title: firstString(job.Title),
      location: firstString(job.PrimaryLocation, job.WorkLocation),
      department: firstString(
        job.Category,
        job.JobFunction,
        job.JobFamily,
        "Technology Operations",
      ),
      team: firstString(
        job.Organization,
        job.BusinessUnit,
        job.Category,
        job.JobFunction,
        "Technology Operations",
      ),
      workplaceType: firstString(
        job.WorkplaceType,
        job.WorkplaceTypeCode,
      ),
      postedDate: firstString(job.PostedDate, job.ExternalPostedStartDate),
      updatedAt: firstString(job.PostedDate, job.ExternalPostedStartDate),
      compensationSnippet: extractCompensationSnippet(summary),
      summaryText: summary,
      fullPostingCaptured: false,
    });
  });
}

function parseIntuit(
  definition: SourceDefinition,
  payload: unknown,
): CustomOfficialSourceCard[] {
  return intuitRows(payload).flatMap((row) => {
    const attributes = row[1] ?? "";
    const body = row[2] ?? "";
    const href = attribute(body, "href");
    const title = attribute(body, "data-title") || textCapture(
      body,
      /<h2[^>]*>([\s\S]*?)<\/h2>/i,
    );
    const location = textCapture(
      body,
      /<span[^>]*class="job-location"[^>]*>([\s\S]*?)<\/span>/i,
    );
    const category = attribute(attributes, "data-category");
    const externalId = attribute(attributes, "data-intuit-jobid") ||
      attribute(body, "data-job-id") || href;
    const sourceUrl = safeHttpUrl(href, "https://jobs.intuit.com");
    return oneCard(definition, {
      sourceType: "official_careers_page",
      sourceUrl,
      detailUrl: sourceUrl,
      detailType: "html",
      externalId,
      title,
      location,
      department: category,
      team: category,
      fullPostingCaptured: false,
    });
  });
}

function parseLinkedIn(
  definition: SourceDefinition,
  payload: unknown,
  query: string,
): CustomOfficialSourceCard[] {
  return linkedInBlocks(payload).flatMap((block) => {
    const entityId = linkedInEntityId("data-entity-urn=" + block);
    const href = linkedInCardHref(block);
    const sourceUrl = safeHttpUrl(href) ||
      (entityId ? "https://www.linkedin.com/jobs/view/" + entityId : "");
    const externalId = entityId || extractLinkedInJobId(sourceUrl);
    const title = textCapture(
      block,
      /<h3[^>]*class="[^"]*base-search-card__title[^"]*"[^>]*>([\s\S]*?)<\/h3>/i,
    );
    const location = textCapture(
      block,
      /<span[^>]*class="[^"]*job-search-card__location[^"]*"[^>]*>([\s\S]*?)<\/span>/i,
    );
    const displayedCompany = textCapture(
      block,
      /<h4[^>]*class="[^"]*base-search-card__subtitle[^"]*"[^>]*>([\s\S]*?)<\/h4>/i,
    ) || definition.company;
    const timeTag = rawCapture(
      block,
      /(<time[^>]*class="[^"]*job-search-card__listdate[^"]*"[^>]*>)/i,
    );
    const postedDate = attribute(timeTag, "datetime");
    const summary = displayedCompany + " public company-job card for " +
      title + " in " + (location || "location not listed") +
      (query ? ". Search query: " + query + "." : ".");
    return oneCard(definition, {
      sourceType: "linkedin_company_jobs",
      sourceUrl,
      detailUrl: externalId
        ? "https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/" +
          encodeURIComponent(externalId)
        : "",
      detailType: "linkedin_guest",
      externalId,
      title,
      location,
      postedDate,
      updatedAt: postedDate,
      summaryText: summary,
      fullPostingCaptured: false,
      sourceVerifiedBy: "linkedin_company_jobs_capture",
      sourceVerificationNotes:
        "Captured from LinkedIn's public company jobs endpoint for the LinkedIn company page; full detail uses LinkedIn jobs-guest jobPosting only after local screening.",
    });
  });
}

function parseTikTok(
  definition: SourceDefinition,
  payload: unknown,
): CustomOfficialSourceCard[] {
  const data = asRecord(asRecord(payload)?.data);
  return asRecordArray(data?.job_post_list).flatMap((job) => {
    const externalId = firstString(job.id, job.code);
    const location = tiktokLocation(job);
    if (!isLikelyUsJob(location) && !/remote/i.test(location)) return [];
    const description = normalizePostingText(
      [
        firstString(job.description)
          ? "Responsibilities: " + firstString(job.description)
          : "",
        firstString(job.requirement)
          ? "Qualifications: " + firstString(job.requirement)
          : "",
      ].filter(Boolean).join("\n"),
    );
    return oneCard(definition, {
      sourceType: "official_ats_api",
      sourceUrl: "https://careers.tiktok.com/position/" +
        encodeURIComponent(externalId) + "/detail",
      externalId,
      title: firstString(job.title),
      location,
      department: objectName(job.job_category),
      team: objectName(job.job_subject) || objectName(job.department_info),
      workplaceType: objectName(job.recruit_type),
      compensationSnippet: tiktokCompensation(job),
      descriptionText: description,
      fullPostingCaptured: Boolean(description),
    });
  });
}

function parseShopify(
  definition: SourceDefinition,
  payload: unknown,
): CustomOfficialSourceCard[] {
  const html = String(payload ?? "");
  const matches = html.matchAll(
    /href=(["'])((?:https:\/\/www\.shopify\.com)?\/careers\/[^"'?#]+_([0-9a-f-]{24,})(?:\?[^"']*)?)\1/gi,
  );
  const seen = new Set<string>();
  const cards: CustomOfficialSourceCard[] = [];
  for (const match of matches) {
    const href = decodeHtmlEntities(match[2]);
    if (seen.has(href) || /\/careers\/extraordinary/i.test(href)) continue;
    seen.add(href);
    const sourceUrl = safeHttpUrl(href, "https://www.shopify.com");
    const slugPart = href.split("/").pop()
      ?.replace(/_[0-9a-f-]{24,}.*$/i, "") ?? "";
    const card = normalizedCard(definition, {
      sourceType: "official_careers_page",
      sourceUrl,
      detailUrl: sourceUrl,
      detailType: "html",
      externalId: match[3],
      title: titleFromPath(slugPart),
      location: "Remote / location varies",
      workplaceType: "Remote or location-flexible needs verification",
      summaryText:
        "Official Shopify careers role. Full posting captured only if this card survives seniority and fit screening.",
      fullPostingCaptured: false,
    });
    if (card) cards.push(card);
  }
  return cards;
}

function parseWayfair(
  definition: SourceDefinition,
  payload: unknown,
): CustomOfficialSourceCard[] {
  return asRecordArray(asRecord(payload)?.jobListData).flatMap((job) => {
    const externalId = firstString(job.requisitionId, job.eid, job.id);
    const location = wayfairLocation(job);
    if (!isLikelyUsJob(location) && !/remote/i.test(location)) return [];
    const description = normalizePostingText(
      [
        htmlToText(job.briefDescription),
        htmlToText(job.description),
      ].filter(Boolean).join("\n"),
    );
    const fallback = "https://wayfair.avature.net/en_US/careers?folderId=" +
      encodeURIComponent(externalId);
    const sourceUrl = safeHttpUrl(
      firstString(job.applyLink, job.structuredDataApplyLink) || fallback,
      "https://www.wayfair.com",
    );
    return oneCard(definition, {
      sourceType: "official_ats_api",
      sourceUrl,
      externalId,
      title: firstString(job.title),
      location,
      department: firstString(asRecord(job.category)?.name),
      team: firstString(
        job.teamName,
        asRecord(job.category)?.description,
      ),
      workplaceType: firstString(job.jobTypeDisplayName),
      postedDate: firstString(job.createdDate),
      updatedAt: firstString(job.lastUpdatedDate),
      compensationSnippet: wayfairCompensation(job) ||
        extractCompensationSnippet(description),
      descriptionText: description,
      fullPostingCaptured: Boolean(
        htmlToText(job.description),
      ),
    });
  });
}

function parseOfficialDetailSeeds(
  definition: SourceDefinition,
  payload: unknown,
  context: CustomOfficialSourceParseContext,
): CustomOfficialSourceCard[] {
  const seeds = definition.seeds ?? [];
  const requestUrl = safeHttpUrl(context.requestUrl);
  const matched = requestUrl
    ? seeds.find((seed) => safeHttpUrl(seed.url) === requestUrl)
    : undefined;
  if (matched) return [parseDetailSeed(definition, matched, payload)];
  if (typeof payload === "string" && seeds.length > 0) {
    return [parseDetailSeed(definition, seeds[0], payload)];
  }
  return seeds.map((seed) => seedCard(definition, seed));
}

function parseDetailSeed(
  definition: SourceDefinition,
  seed: DetailSeed,
  payload: unknown,
): CustomOfficialSourceCard {
  if (seed.candidateOnly || typeof payload !== "string") {
    return seedCard(definition, seed);
  }
  return parseOfficialHtmlDetail(definition, seed, payload);
}

function parseOfficialHtmlDetail(
  definition: SourceDefinition,
  seed: DetailSeed,
  html: string,
): CustomOfficialSourceCard {
  const description = trimOfficialPostingText(htmlToText(html), seed.title);
  const note = seed.sourceVerificationNotes
    ? seed.sourceVerificationNotes +
      " Full posting text captured from official careers detail HTML."
    : "Full posting text captured from official careers detail HTML.";
  return normalizedCard(definition, {
    sourceType: "official_careers_detail",
    sourceUrl: seed.url,
    detailUrl: seed.url,
    detailType: seed.detailType ?? "official_html",
    externalId: seed.externalId ||
      seed.url.split("/").filter(Boolean).at(-1) || seed.title,
    title: seed.title,
    location: seed.location || "Needs verification",
    department: seed.department,
    team: seed.team || seed.department,
    workplaceType: seed.workplaceType,
    compensationSnippet: extractCompensationSnippet(description) ||
      seed.compensationSnippet,
    summaryText: seed.summaryText,
    descriptionText: description || seed.summaryText,
    fullPostingCaptured: Boolean(description),
    sourceVerifiedBy: seed.sourceVerifiedBy || "official_url_capture",
    sourceVerificationNotes: note,
  }) ?? seedCard(definition, seed);
}

function seedCard(
  definition: SourceDefinition,
  seed: DetailSeed,
  detailCaptureError = "",
): CustomOfficialSourceCard {
  return normalizedCard(definition, {
    sourceType: "official_careers_detail",
    sourceUrl: seed.url,
    detailUrl: seed.candidateOnly ? "" : seed.url,
    detailType: seed.detailType ?? "",
    externalId: seed.externalId ||
      seed.url.split("/").filter(Boolean).at(-1) || seed.title,
    title: seed.title,
    location: seed.location || "Needs verification",
    department: seed.department,
    team: seed.team || seed.department,
    workplaceType: seed.workplaceType,
    compensationSnippet: seed.compensationSnippet,
    summaryText: seed.summaryText || "Official careers detail seed.",
    fullPostingCaptured: false,
    linkHealth: detailCaptureError
      ? "detail_capture_failed"
      : seed.linkHealth || "active",
    sourceVerifiedBy: seed.sourceVerifiedBy || "official_url_capture",
    sourceVerificationNotes: seed.sourceVerificationNotes ||
      "Captured from a curated official careers detail page after the source-list adapter could not reliably enumerate this company's roles.",
    detailCaptureError,
  }) as CustomOfficialSourceCard;
}

function oneCard(
  definition: SourceDefinition,
  input: CardInput,
): CustomOfficialSourceCard[] {
  const card = normalizedCard(definition, input);
  return card ? [card] : [];
}

function normalizedCard(
  definition: SourceDefinition,
  input: CardInput,
): CustomOfficialSourceCard | null {
  const title = normalizeWhitespace(input.title);
  const sourceUrl = safeHttpUrl(input.sourceUrl);
  if (!title || !sourceUrl) return null;
  const externalId = normalizeWhitespace(input.externalId || sourceUrl);
  const description = normalizePostingText(input.descriptionText);
  const summary = normalizeWhitespace(input.summaryText) ||
    truncate(description, 360);
  const compensation = normalizeWhitespace(input.compensationSnippet) ||
    extractCompensationSnippet(description || summary);
  const workplace = normalizeWhitespace(input.workplaceType);
  const detailUrl = safeHttpUrl(input.detailUrl);
  const id = stableCardId(
    definition.company,
    definition.adapter,
    externalId || sourceUrl || title,
  );
  const fullPostingCaptured = input.fullPostingCaptured ??
    Boolean(description);
  return {
    id,
    job_result_id: id,
    company: definition.company,
    title,
    role_title: title,
    location: normalizeWhitespace(input.location),
    department: normalizeWhitespace(input.department),
    team: normalizeWhitespace(input.team),
    workplace,
    workplace_type: workplace,
    work_style: workplace,
    posted_date: normalizeWhitespace(input.postedDate),
    updated_at: normalizeWhitespace(input.updatedAt),
    provider: definition.adapter,
    source_type: input.sourceType,
    source_adapter_type: "custom_" + definition.adapter,
    ats_provider: definition.provider,
    source_group: definition.sourceGroup,
    posting_source_name: definition.provider,
    job_url: sourceUrl,
    source_url: sourceUrl,
    official_source_url: sourceUrl,
    ats_source_url: sourceUrl,
    detail_url: detailUrl,
    detail_type: normalizeWhitespace(input.detailType),
    external_id: externalId,
    job_id_external: externalId,
    company_job_id: externalId,
    salary_snippet: compensation,
    compensation_snippet: compensation,
    card_snippet: summary,
    short_card_snippet: summary,
    summary_text: summary,
    description_text: description,
    full_posting_text: description,
    full_job_description: description,
    raw_posting_text: description,
    full_posting_captured: fullPostingCaptured,
    link_health: normalizeWhitespace(input.linkHealth) || "ok",
    active_status: "needs_verification",
    source_verified_by: normalizeWhitespace(input.sourceVerifiedBy) ||
      "official_source_adapter",
    source_verification_notes: normalizeWhitespace(
      input.sourceVerificationNotes,
    ),
    detail_capture_error: normalizeWhitespace(input.detailCaptureError),
  };
}

function sourceDefinition(company: string): SourceDefinition | undefined {
  return SOURCE_BY_ALIAS.get(companyKey(company));
}

function deferredSourceDefinition(
  company: string,
): DeferredSourceDefinition | undefined {
  return DEFERRED_SOURCE_BY_ALIAS.get(companyKey(company));
}

function sourceQueries(
  definition: SourceDefinition,
  override: string[] | undefined,
): string[] {
  const source = override?.length ? override : definition.queries;
  return uniqueStrings(
    source.map((query) => normalizeWhitespace(query).slice(0, 120)),
  ).slice(0, 8);
}

function canContinue(state: FetchState): boolean {
  return !state.stopped && state.cards.length < state.maxCards;
}

function companyKey(value: unknown): string {
  return normalizeWhitespace(value).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function asRecordArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.map(asRecord).filter(
      (item): item is Record<string, unknown> => item !== null,
    )
    : [];
}

function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" || typeof value === "number") {
      const text = normalizeWhitespace(value);
      if (text) return text;
    }
  }
  return "";
}

function normalizeWhitespace(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizePostingText(value: unknown): string {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function safeHttpUrl(value: unknown, base?: string): string {
  const text = decodeHtmlEntities(firstString(value));
  if (!text) return "";
  try {
    const url = base ? new URL(text, base) : new URL(text);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.href
      : "";
  } catch {
    return "";
  }
}

function htmlToText(value: unknown): string {
  const decoded = decodeHtmlEntities(String(value ?? ""));
  return normalizePostingText(
    decoded
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6]|section|article)>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  );
}

function decodeHtmlEntities(value: string): string {
  const named: Record<string, string> = {
    nbsp: " ",
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    mdash: "-",
    ndash: "-",
    rsquo: "'",
    lsquo: "'",
    ldquo: '"',
    rdquo: '"',
  };
  let decoded = value;
  for (let pass = 0; pass < 2; pass += 1) {
    decoded = decoded
      .replace(
        /&([a-z]+);/gi,
        (match, name: string) => named[name.toLowerCase()] ?? match,
      )
      .replace(
        /&#(\d+);/g,
        (_match, code: string) => safeCodePoint(Number(code)),
      )
      .replace(
        /&#x([0-9a-f]+);/gi,
        (_match, code: string) => safeCodePoint(Number.parseInt(code, 16)),
      );
  }
  return decoded;
}

function safeCodePoint(code: number): string {
  try {
    return Number.isInteger(code) && code > 0 ? String.fromCodePoint(code) : "";
  } catch {
    return "";
  }
}

function rawCapture(
  value: unknown,
  pattern: RegExp,
  group = 1,
): string {
  return String(value ?? "").match(pattern)?.[group] ?? "";
}

function textCapture(value: unknown, pattern: RegExp): string {
  return htmlToText(rawCapture(value, pattern));
}

function attribute(html: unknown, name: string): string {
  const escaped = name.replace(/[^a-z0-9_-]/gi, "");
  const match = String(html ?? "").match(
    new RegExp(escaped + "=(['\"])([\\s\\S]*?)\\1", "i"),
  );
  return match ? htmlToText(match[2]) : "";
}

function extractCompensationSnippet(value: unknown): string {
  const text = htmlToText(value);
  if (!text) return "";
  const keyword =
    /\b(compensation|salary|base pay|base salary|pay range|wage|annual base|annual salary|total compensation|ote|on-target earnings)\b/gi;
  let match: RegExpExecArray | null;
  while ((match = keyword.exec(text)) !== null) {
    const window = text.slice(
      Math.max(0, match.index - 100),
      Math.min(text.length, match.index + 420),
    );
    if (containsCompensationAmount(window)) return truncate(window, 360);
  }
  const direct = text.match(
    /.{0,120}(?:USD\s*)?\$\s*\d[\d,]*(?:\.\d+)?\s*[kKmM]?(?:\s*(?:-|to|through)\s*(?:USD\s*)?\$?\s*\d[\d,]*(?:\.\d+)?\s*[kKmM]?)?.{0,160}/i,
  );
  return normalizeWhitespace(direct?.[0] ?? "");
}

function containsCompensationAmount(value: string): boolean {
  return /(?:USD\s*)?\$\s*\d[\d,]*(?:\.\d+)?\s*[kKmM]?/i.test(value) ||
    /\bUSD\s+\d{2,3}(?:,\d{3})+/i.test(value);
}

function truncate(value: unknown, maximum: number): string {
  const text = normalizeWhitespace(value);
  return text.length <= maximum ? text : text.slice(0, maximum - 3) + "...";
}

function boundedInteger(
  value: number | undefined,
  minimum: number,
  maximum: number,
  fallback: number,
): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.round(value as number)));
}

function stableCardId(
  company: string,
  provider: string,
  identity: string,
): string {
  const source = company + "|" + provider + "|" + identity;
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return "source-" + slug(company) + "-" + provider + "-" +
    (hash >>> 0).toString(16).padStart(8, "0");
}

function slug(value: unknown): string {
  return normalizeWhitespace(value || "unknown").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64) || "unknown";
}

function isLikelyUsJob(value: unknown): boolean {
  return /\bUSA\b|United States|\bUS\b|U\.S\./i.test(String(value ?? ""));
}

function intuitRows(
  payload: unknown,
): RegExpMatchArray[] {
  const html = firstString(asRecord(payload)?.results);
  return [...html.matchAll(/<li\b([^>]*)>([\s\S]*?)<\/li>/gi)];
}

function linkedInBlocks(payload: unknown): string[] {
  return String(payload ?? "")
    .split(
      /<div[^>]*class="[^"]*base-card[\s\S]*?job-search-card[^"]*"[^>]*data-entity-urn=/i,
    )
    .slice(1);
}

function linkedInEntityId(html: unknown): string {
  return rawCapture(
    html,
    /data-entity-urn=(["'])urn:li:jobPosting:([0-9]+)\1/i,
    2,
  );
}

function linkedInCardHref(html: unknown): string {
  return rawCapture(
    html,
    /<a[^>]+class="[^"]*base-card__full-link[^"]*"[^>]+href=(["'])([\s\S]*?)\1/i,
    2,
  );
}

function extractLinkedInJobId(url: unknown): string {
  return String(url ?? "")
    .match(/(?:jobPosting:|[-/])([0-9]{8,})(?:[/?#]|$)/)?.[1] ?? "";
}

function extractGoogleJobArrays(html: string): unknown[][] {
  const starts = html.matchAll(
    /\["\d{12,}","[^"]+","https:\/\/www\.google\.com\/about\/careers\/applications\/signin/g,
  );
  const jobs: unknown[][] = [];
  for (const match of starts) {
    const end = findJsonArrayEnd(html, match.index ?? -1);
    if (end < 0 || match.index === undefined) continue;
    try {
      const parsed = JSON.parse(html.slice(match.index, end));
      if (Array.isArray(parsed)) jobs.push(parsed);
    } catch {
      // Other embedded cards can still be parsed.
    }
  }
  return jobs;
}

function findJsonArrayEnd(text: string, start: number): number {
  if (start < 0) return -1;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < text.length; index += 1) {
    const character = text[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }
    if (character === '"') inString = true;
    else if (character === "[") depth += 1;
    else if (character === "]") {
      depth -= 1;
      if (depth === 0) return index + 1;
    }
  }
  return -1;
}

function googleSection(value: unknown): string {
  if (typeof value === "string") return value;
  return Array.isArray(value) ? firstString(value[1]) : "";
}

function googleLocations(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return value.map((item) => Array.isArray(item) ? item[0] : item)
    .map((item) => firstString(item))
    .filter(Boolean)
    .join("; ");
}

function titleSlug(value: unknown): string {
  return normalizeWhitespace(value || "role").toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

function titleFromPath(value: unknown): string {
  return normalizeWhitespace(
    String(value ?? "").replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase()),
  );
}

function wayfairLocation(job: Record<string, unknown>): string {
  const location = asRecord(job.location) ?? {};
  return normalizeWhitespace(
    [
      firstString(location.name),
      firstString(location.city) && firstString(location.state)
        ? firstString(location.city) + ", " + firstString(location.state)
        : "",
      firstString(location.country),
    ].filter(Boolean).join("; "),
  );
}

function wayfairCompensation(job: Record<string, unknown>): string {
  const minimum = Number(job.minSalaryRange ?? 0);
  const maximum = Number(job.maxSalaryRange ?? 0);
  if (!minimum || !maximum) return "";
  const currency = firstString(job.currencyType, "USD");
  const payRate = firstString(job.payRateType, "base pay");
  const prefix = /^usd$/i.test(currency) ? "$" : currency + " ";
  return prefix + Math.round(minimum).toLocaleString("en-US") + " - " +
    prefix + Math.round(maximum).toLocaleString("en-US") + " " + payRate;
}

function tiktokLocation(job: Record<string, unknown>): string {
  return normalizeWhitespace(flattenTikTokLocation(job.city_info).join(", "));
}

function flattenTikTokLocation(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(flattenTikTokLocation);
  const record = asRecord(value);
  if (!record) return [firstString(value)].filter(Boolean);
  const current = objectName(record);
  const parent = flattenTikTokLocation(record.parent);
  return [...(current ? [current] : []), ...parent];
}

function tiktokCompensation(job: Record<string, unknown>): string {
  const info = asRecord(job.job_post_info) ?? {};
  const minimum = Number(info.min_salary ?? 0);
  const maximum = Number(info.max_salary ?? 0);
  if (!minimum || !maximum) return "";
  const currency = firstString(info.currency, "USD");
  const prefix = /^usd$/i.test(currency) ? "$" : currency + " ";
  return prefix + Math.round(minimum).toLocaleString("en-US") + " - " +
    prefix + Math.round(maximum).toLocaleString("en-US") +
    " listed salary";
}

function objectName(value: unknown): string {
  if (!value) return "";
  if (Array.isArray(value)) {
    return value.map(objectName).filter(Boolean).join("; ");
  }
  const record = asRecord(value);
  return record
    ? firstString(record.en_name, record.i18n_name, record.name)
    : firstString(value);
}

function trimOfficialPostingText(pageText: string, title: string): string {
  const text = normalizeWhitespace(pageText);
  const lower = text.toLowerCase();
  const starts = [
    title ? lower.indexOf(title.toLowerCase()) : -1,
    lower.indexOf("apply for this job"),
    lower.indexOf("working at atlassian"),
  ].filter((index) => index >= 0);
  const start = starts.length ? Math.min(...starts) : 0;
  let trimmed = text.slice(start);
  for (
    const marker of [
      "Join the Atlassian Talent Community",
      "Privacy Policy Notice at Collection",
      "Equal Opportunity Employer",
      "Apply for this job First Name",
      "Similar jobs",
      "Explore similar jobs",
      "© Microsoft",
      "This site runs Microsoft Clarity",
    ]
  ) {
    const index = trimmed.toLowerCase().indexOf(marker.toLowerCase());
    if (index > 1_200) trimmed = trimmed.slice(0, index);
  }
  return normalizeWhitespace(trimmed);
}

class HttpStatusError extends Error {
  status: number;
  statusText: string;

  constructor(status: number, statusText: string) {
    super("HTTP " + status + (statusText ? " " + statusText : ""));
    this.status = status;
    this.statusText = statusText;
  }
}
