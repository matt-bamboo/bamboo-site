export type SecondaryJobSourceProvider =
  | "workday"
  | "smartrecruiters"
  | "phenom";

export type SecondaryJobDetailType = SecondaryJobSourceProvider;

interface SecondarySourceConfigBase {
  company: string;
  provider?: string;
  sourceGroup?: string;
  queries?: string[];
  maxCards?: number;
  timeoutMs?: number;
}

export interface WorkdaySourceConfig extends SecondarySourceConfigBase {
  type: "workday";
  host: string;
  tenant: string;
  site: string;
  locale?: string;
  pageSize?: number;
  publicUrlKind?: "default" | "walmart";
}

export interface SmartRecruitersSourceConfig extends SecondarySourceConfigBase {
  type: "smartrecruiters";
  companySlug: string;
  pageSize?: number;
}

export interface PhenomSourceConfig extends SecondarySourceConfigBase {
  type: "phenom";
  baseDomain: string;
  basePath: string;
  maxOffset?: number;
  pageSize?: number;
}

export type SecondaryJobSourceConfig =
  | WorkdaySourceConfig
  | SmartRecruitersSourceConfig
  | PhenomSourceConfig;

export interface NormalizedCandidateCard {
  id: string;
  job_result_id: string;
  company: string;
  title: string;
  role_title: string;
  location: string;
  department: string;
  team: string;
  workplace_type: string;
  work_style: string;
  posted_date: string;
  updated_at: string;
  provider: SecondaryJobSourceProvider;
  source_type: "official_ats" | "official_careers_page";
  source_adapter_type:
    | "ats_workday"
    | "ats_smartrecruiters"
    | "official_phenom";
  ats_provider: string;
  source_group: string;
  posting_source_name: string;
  source_url: string;
  official_source_url: string;
  ats_source_url: string;
  detail_url: string;
  detail_type: SecondaryJobDetailType;
  external_id: string;
  job_id_external: string;
  company_job_id: string;
  compensation_snippet: string;
  summary_text: string;
  description_text: string;
  full_job_description: string;
  raw_posting_text: string;
  full_posting_captured: boolean;
  link_health: "ok";
  active_status: "needs_verification";
}

export interface ParsedCandidatePage {
  cards: NormalizedCandidateCard[];
  receivedCount: number;
  total: number;
}

export interface JobSourceRequest {
  url: string;
  init: RequestInit;
}

export interface AdapterFetchOptions {
  fetch?: typeof fetch;
  signal?: AbortSignal;
  timeoutMs?: number;
  maxCards?: number;
}

const DEFAULT_QUERIES = ["operations"];
const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_MAX_CARDS = 200;

export function buildWorkdaySearchRequest(
  config: WorkdaySourceConfig,
  query: string,
  offset = 0,
  limit = config.pageSize ?? 20,
): JobSourceRequest {
  const origin = workdayOrigin(config);
  const url = new URL(
    `/wday/cxs/${encodeURIComponent(config.tenant)}/${
      encodeURIComponent(config.site)
    }/jobs`,
    origin,
  );
  const body = {
    appliedFacets: {},
    limit: boundedInteger(limit, 1, 20, 20),
    offset: boundedInteger(offset, 0, Number.MAX_SAFE_INTEGER, 0),
    searchText: normalizeWhitespace(query),
  };

  return {
    url: url.href,
    init: {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(body),
    },
  };
}

export function buildWorkdayDetailRequest(
  config: WorkdaySourceConfig,
  externalPath: string,
): JobSourceRequest {
  return {
    url: workdayDetailUrl(config, externalPath),
    init: { method: "GET", headers: jsonHeaders() },
  };
}

export function buildSmartRecruitersSearchRequest(
  config: SmartRecruitersSourceConfig,
  query: string,
  offset = 0,
  limit = config.pageSize ?? 100,
): JobSourceRequest {
  const slug = requiredPathSegment(config.companySlug, "companySlug");
  const url = new URL(
    `https://api.smartrecruiters.com/v1/companies/${slug}/postings`,
  );
  url.searchParams.set("limit", String(boundedInteger(limit, 1, 100, 100)));
  url.searchParams.set(
    "offset",
    String(boundedInteger(offset, 0, Number.MAX_SAFE_INTEGER, 0)),
  );
  url.searchParams.set("q", normalizeWhitespace(query));
  return {
    url: url.href,
    init: { method: "GET", headers: jsonHeaders() },
  };
}

export function buildSmartRecruitersDetailRequest(
  config: SmartRecruitersSourceConfig,
  postingId: string,
): JobSourceRequest {
  const slug = requiredPathSegment(config.companySlug, "companySlug");
  const id = requiredPathSegment(postingId, "postingId");
  return {
    url: `https://api.smartrecruiters.com/v1/companies/${slug}/postings/${id}`,
    init: { method: "GET", headers: jsonHeaders() },
  };
}

export function buildPhenomSearchRequest(
  config: PhenomSourceConfig,
  query: string,
  offset = 0,
): JobSourceRequest {
  const url = new URL(`${phenomBaseUrl(config)}/search-results`);
  url.searchParams.set("keywords", normalizeWhitespace(query));
  const safeOffset = boundedInteger(
    offset,
    0,
    Number.MAX_SAFE_INTEGER,
    0,
  );
  if (safeOffset > 0) {
    url.searchParams.set("from", String(safeOffset));
    url.searchParams.set("s", "1");
  }
  return {
    url: url.href,
    init: { method: "GET", headers: htmlHeaders() },
  };
}

export function buildPhenomDetailRequest(
  config: PhenomSourceConfig,
  postingId: string,
  title = "",
): JobSourceRequest {
  return {
    url: phenomPublicUrl(config, { jobId: postingId, title }),
    init: { method: "GET", headers: htmlHeaders() },
  };
}

export function parseWorkdayCandidatePage(
  config: WorkdaySourceConfig,
  payload: unknown,
): ParsedCandidatePage {
  const root = asRecord(payload);
  const rows = asRecordArray(root?.jobPostings);
  const cards = rows.map((row) => workdayCard(config, row)).filter(isCard);
  return {
    cards,
    receivedCount: rows.length,
    total: safeNumber(root?.total),
  };
}

export function parseWorkdayDetailResponse(
  config: WorkdaySourceConfig,
  payload: unknown,
  seed?: NormalizedCandidateCard,
): NormalizedCandidateCard | null {
  const root = asRecord(payload);
  const info = asRecord(root?.jobPostingInfo);
  if (!info) return seed ?? null;
  const externalPath = stringValue(info.externalPath) ||
    externalPathFromCard(seed);
  const externalId = stringValue(info.jobReqId) || seed?.external_id ||
    externalPath;
  const fullText = htmlToText(
    firstNonEmpty(
      info.jobDescription,
      info.description,
      info.descriptionText,
    ),
  );
  const card = normalizeCard({
    ...baseSeed(seed),
    company: config.company,
    provider: "workday",
    sourceType: "official_ats",
    sourceAdapterType: "ats_workday",
    atsProvider: config.provider || "Workday",
    sourceGroup: config.sourceGroup || "",
    sourceUrl: stringValue(info.externalUrl) || seed?.source_url ||
      workdayPublicUrl(config, externalPath, externalId),
    detailUrl: workdayDetailUrl(config, externalPath),
    externalId,
    title: stringValue(info.title) || seed?.title || "",
    location: stringValue(info.location) || seed?.location || "",
    department: stringValue(info.jobFamily) || seed?.department || "",
    team: stringValue(info.jobFamily) || seed?.team || "",
    workplaceType: stringValue(info.remoteType) ||
      stringValue(info.workplaceType) || seed?.workplace_type || "",
    postedDate: stringValue(info.startDate) || seed?.posted_date || "",
    updatedAt: stringValue(info.startDate) || seed?.updated_at || "",
    summaryText: seed?.summary_text || "",
    fullText,
    compensationText: firstNonEmpty(
      info.compensation,
      info.salary,
      info.payRange,
      fullText,
    ),
  });
  return card.external_id && card.title ? card : seed ?? null;
}

export function parseSmartRecruitersCandidatePage(
  config: SmartRecruitersSourceConfig,
  payload: unknown,
): ParsedCandidatePage {
  const root = asRecord(payload);
  const rows = asRecordArray(root?.content);
  const cards = rows.map((row) => smartRecruitersCard(config, row)).filter(
    isCard,
  );
  return {
    cards,
    receivedCount: rows.length,
    total: safeNumber(root?.totalFound),
  };
}

export function parseSmartRecruitersDetailResponse(
  config: SmartRecruitersSourceConfig,
  payload: unknown,
  seed?: NormalizedCandidateCard,
): NormalizedCandidateCard | null {
  const row = asRecord(payload);
  if (!row) return seed ?? null;
  const parsed = smartRecruitersCard(config, row, seed);
  return parsed || seed || null;
}

export function parsePhenomCandidatePage(
  config: PhenomSourceConfig,
  html: unknown,
): ParsedCandidatePage {
  const ddo = parsePhenomDdo(html);
  const search = asRecord(ddo?.eagerLoadRefineSearch);
  const data = asRecord(search?.data);
  const rows = asRecordArray(data?.jobs);
  const cards = rows.map((row) => phenomCard(config, row)).filter(isCard);
  return {
    cards,
    receivedCount: rows.length,
    total: safeNumber(search?.totalHits),
  };
}

export function parsePhenomDetailResponse(
  config: PhenomSourceConfig,
  html: unknown,
  seed?: NormalizedCandidateCard,
): NormalizedCandidateCard | null {
  const ddo = parsePhenomDdo(html);
  const detail = asRecord(ddo?.jobDetail);
  const data = asRecord(detail?.data);
  const row = asRecord(data?.job);
  if (!row) return seed ?? null;
  return phenomCard(config, row, seed) || seed || null;
}

export async function fetchWorkdayCandidateCards(
  config: WorkdaySourceConfig,
  options: AdapterFetchOptions = {},
): Promise<NormalizedCandidateCard[]> {
  return await fetchPaginatedJson(
    config,
    options,
    (query, offset) => buildWorkdaySearchRequest(config, query, offset),
    (payload) => parseWorkdayCandidatePage(config, payload),
  );
}

export async function fetchSmartRecruitersCandidateCards(
  config: SmartRecruitersSourceConfig,
  options: AdapterFetchOptions = {},
): Promise<NormalizedCandidateCard[]> {
  return await fetchPaginatedJson(
    config,
    options,
    (query, offset) => buildSmartRecruitersSearchRequest(config, query, offset),
    (payload) => parseSmartRecruitersCandidatePage(config, payload),
  );
}

export async function fetchPhenomCandidateCards(
  config: PhenomSourceConfig,
  options: AdapterFetchOptions = {},
): Promise<NormalizedCandidateCard[]> {
  const fetchImpl = options.fetch ?? fetch;
  const maxCards = boundedInteger(
    options.maxCards ?? config.maxCards,
    1,
    5_000,
    DEFAULT_MAX_CARDS,
  );
  const pageSize = boundedInteger(config.pageSize, 1, 100, 10);
  const maxOffset = boundedInteger(config.maxOffset, 0, 50_000, 40);
  const cards: NormalizedCandidateCard[] = [];
  const seen = new Set<string>();

  for (const query of sourceQueries(config)) {
    for (let offset = 0; offset <= maxOffset && cards.length < maxCards;) {
      const request = buildPhenomSearchRequest(config, query, offset);
      const html = await requestText(request, config, options, fetchImpl);
      const page = parsePhenomCandidatePage(config, html);
      const addedCount = appendUnique(cards, seen, page.cards, maxCards);
      if (
        page.receivedCount === 0 ||
        (page.total > 0 && offset + page.receivedCount >= page.total) ||
        (page.total === 0 && addedCount === 0)
      ) break;
      offset += pageSize;
    }
  }
  return cards;
}

export async function fetchWorkdayJobDetail(
  config: WorkdaySourceConfig,
  externalPath: string,
  seed?: NormalizedCandidateCard,
  options: AdapterFetchOptions = {},
): Promise<NormalizedCandidateCard | null> {
  const request = buildWorkdayDetailRequest(config, externalPath);
  const payload = await requestJson(
    request,
    config,
    options,
    options.fetch ?? fetch,
  );
  return parseWorkdayDetailResponse(config, payload, seed);
}

export async function fetchSmartRecruitersJobDetail(
  config: SmartRecruitersSourceConfig,
  postingId: string,
  seed?: NormalizedCandidateCard,
  options: AdapterFetchOptions = {},
): Promise<NormalizedCandidateCard | null> {
  const request = buildSmartRecruitersDetailRequest(config, postingId);
  const payload = await requestJson(
    request,
    config,
    options,
    options.fetch ?? fetch,
  );
  return parseSmartRecruitersDetailResponse(config, payload, seed);
}

export async function fetchPhenomJobDetail(
  config: PhenomSourceConfig,
  postingId: string,
  title = "",
  seed?: NormalizedCandidateCard,
  options: AdapterFetchOptions = {},
): Promise<NormalizedCandidateCard | null> {
  const request = seed?.source_url
    ? { url: seed.source_url, init: { method: "GET", headers: htmlHeaders() } }
    : buildPhenomDetailRequest(config, postingId, title);
  const html = await requestText(
    request,
    config,
    options,
    options.fetch ?? fetch,
  );
  return parsePhenomDetailResponse(config, html, seed);
}

async function fetchPaginatedJson(
  config: WorkdaySourceConfig | SmartRecruitersSourceConfig,
  options: AdapterFetchOptions,
  requestForPage: (query: string, offset: number) => JobSourceRequest,
  parsePage: (payload: unknown) => ParsedCandidatePage,
): Promise<NormalizedCandidateCard[]> {
  const fetchImpl = options.fetch ?? fetch;
  const maxCards = boundedInteger(
    options.maxCards ?? config.maxCards,
    1,
    5_000,
    DEFAULT_MAX_CARDS,
  );
  const cards: NormalizedCandidateCard[] = [];
  const seen = new Set<string>();

  for (const query of sourceQueries(config)) {
    let offset = 0;
    while (cards.length < maxCards) {
      const request = requestForPage(query, offset);
      const payload = await requestJson(request, config, options, fetchImpl);
      const page = parsePage(payload);
      const addedCount = appendUnique(cards, seen, page.cards, maxCards);
      if (
        page.receivedCount === 0 ||
        (page.total > 0 && offset + page.receivedCount >= page.total) ||
        (page.total === 0 && addedCount === 0)
      ) break;
      offset += page.receivedCount;
    }
  }
  return cards;
}

function workdayCard(
  config: WorkdaySourceConfig,
  row: Record<string, unknown>,
): NormalizedCandidateCard | null {
  const externalPath = stringValue(row.externalPath);
  const bulletFields = Array.isArray(row.bulletFields)
    ? row.bulletFields.map(stringValue).filter(Boolean)
    : [];
  const externalId = bulletFields[0] || stringValue(row.jobReqId) ||
    externalPath;
  const title = stringValue(row.title);
  if (!externalId || !title) return null;
  const fullText = htmlToText(
    firstNonEmpty(
      row.jobDescription,
      row.description,
      row.descriptionText,
    ),
  );
  const summaryText = htmlToText(
    firstNonEmpty(row.descriptionTeaser, row.summary, row.shortDescription),
  );
  const department = stringValue(row.jobFamily) || stringValue(row.timeType);
  return normalizeCard({
    company: config.company,
    provider: "workday",
    sourceType: "official_ats",
    sourceAdapterType: "ats_workday",
    atsProvider: config.provider || "Workday",
    sourceGroup: config.sourceGroup || "",
    sourceUrl: workdayPublicUrl(config, externalPath, externalId),
    detailUrl: workdayDetailUrl(config, externalPath),
    externalId,
    title,
    location: stringValue(row.locationsText) || stringValue(row.location),
    department,
    team: stringValue(row.team) || department,
    workplaceType: stringValue(row.remoteType) ||
      stringValue(row.workplaceType),
    postedDate: stringValue(row.postedOn),
    updatedAt: stringValue(row.updatedOn) || stringValue(row.postedOn),
    summaryText,
    fullText,
    compensationText: firstNonEmpty(
      row.compensation,
      row.salary,
      row.payRange,
      fullText,
      summaryText,
    ),
  });
}

function smartRecruitersCard(
  config: SmartRecruitersSourceConfig,
  row: Record<string, unknown>,
  seed?: NormalizedCandidateCard,
): NormalizedCandidateCard | null {
  const id = stringValue(row.id) || stringValue(row.uuid) ||
    stringValue(row.refNumber) || seed?.external_id || "";
  const externalId = stringValue(row.refNumber) || id;
  const title = stringValue(row.name) || seed?.title || "";
  if (!externalId || !title) return null;
  const location = smartRecruitersLocation(asRecord(row.location)) ||
    seed?.location || "";
  const department = nestedLabel(row.department) || nestedLabel(row.function) ||
    seed?.department || "";
  const fullText = smartRecruitersDescription(row);
  const postingUrl = safeAbsoluteUrl(
    stringValue(row.postingUrl),
    `https://careers.smartrecruiters.com/${
      requiredPathSegment(config.companySlug, "companySlug")
    }/${encodeURIComponent(id)}`,
  );
  const locationRecord = asRecord(row.location);
  const workplaceType = locationRecord?.remote === true
    ? "Remote"
    : locationRecord?.hybrid === true
    ? "Hybrid"
    : seed?.workplace_type || "";
  return normalizeCard({
    ...baseSeed(seed),
    company: config.company,
    provider: "smartrecruiters",
    sourceType: "official_ats",
    sourceAdapterType: "ats_smartrecruiters",
    atsProvider: config.provider || "SmartRecruiters",
    sourceGroup: config.sourceGroup || "",
    sourceUrl: postingUrl,
    detailUrl: buildSmartRecruitersDetailRequest(config, id).url,
    externalId,
    companyJobId: id,
    title,
    location,
    department,
    team: department || seed?.team || "",
    workplaceType,
    postedDate: stringValue(row.releasedDate) || seed?.posted_date || "",
    updatedAt: stringValue(row.updatedDate) ||
      stringValue(row.releasedDate) || seed?.updated_at || "",
    summaryText: htmlToText(
      firstNonEmpty(row.description, row.shortDescription, row.summary),
    ) || seed?.summary_text || "",
    fullText: fullText || seed?.full_job_description || "",
    compensationText: firstNonEmpty(
      row.compensation,
      row.salary,
      row.payRange,
      fullText,
    ),
  });
}

function phenomCard(
  config: PhenomSourceConfig,
  row: Record<string, unknown>,
  seed?: NormalizedCandidateCard,
): NormalizedCandidateCard | null {
  const externalId = stringValue(row.jobId) || stringValue(row.reqId) ||
    stringValue(row.jobSeqNo) || seed?.external_id || "";
  const title = stringValue(row.title) || seed?.title || "";
  if (!externalId || !title) return null;
  const categories = stringArray(row.multi_category);
  const department = categories.join(" / ") || stringValue(row.category) ||
    seed?.department || "";
  const fullText = phenomFullDescription(row) ||
    seed?.full_job_description || "";
  const summaryText = phenomSummary(row) || seed?.summary_text || "";
  const sourceUrl = phenomPublicUrl(config, row);
  return normalizeCard({
    ...baseSeed(seed),
    company: config.company,
    provider: "phenom",
    sourceType: "official_careers_page",
    sourceAdapterType: "official_phenom",
    atsProvider: config.provider || "Phenom",
    sourceGroup: config.sourceGroup || "",
    sourceUrl,
    detailUrl: sourceUrl,
    externalId,
    title,
    location: phenomLocation(row) || seed?.location || "",
    department,
    team: department || seed?.team || "",
    workplaceType: stringValue(row.remote) || stringValue(row.type) ||
      seed?.workplace_type || "",
    postedDate: stringValue(row.postedDate) || seed?.posted_date || "",
    updatedAt: stringValue(row.dateCreated) ||
      stringValue(row.postedDate) || seed?.updated_at || "",
    summaryText,
    fullText,
    compensationText: firstNonEmpty(
      row.compensation,
      row.salary,
      row.payRange,
      fullText,
      summaryText,
    ),
  });
}

interface CardInput {
  company: string;
  provider: SecondaryJobSourceProvider;
  sourceType: "official_ats" | "official_careers_page";
  sourceAdapterType:
    | "ats_workday"
    | "ats_smartrecruiters"
    | "official_phenom";
  atsProvider: string;
  sourceGroup: string;
  sourceUrl: string;
  detailUrl: string;
  externalId: string;
  companyJobId?: string;
  title: string;
  location: string;
  department: string;
  team: string;
  workplaceType: string;
  postedDate: string;
  updatedAt: string;
  summaryText: string;
  fullText: string;
  compensationText: unknown;
}

function normalizeCard(input: CardInput): NormalizedCandidateCard {
  const title = normalizeWhitespace(input.title);
  const externalId = normalizeWhitespace(input.externalId);
  const sourceUrl = safeAbsoluteUrl(input.sourceUrl, input.detailUrl);
  const detailUrl = safeAbsoluteUrl(input.detailUrl, sourceUrl);
  const summaryText = normalizeWhitespace(input.summaryText);
  const fullText = normalizePostingText(input.fullText);
  const id = stableCardId(
    input.company,
    input.provider,
    externalId || sourceUrl || title,
  );
  return {
    id,
    job_result_id: id,
    company: normalizeWhitespace(input.company),
    title,
    role_title: title,
    location: normalizeWhitespace(input.location),
    department: normalizeWhitespace(input.department),
    team: normalizeWhitespace(input.team),
    workplace_type: normalizeWhitespace(input.workplaceType),
    work_style: normalizeWhitespace(input.workplaceType),
    posted_date: normalizeWhitespace(input.postedDate),
    updated_at: normalizeWhitespace(input.updatedAt),
    provider: input.provider,
    source_type: input.sourceType,
    source_adapter_type: input.sourceAdapterType,
    ats_provider: normalizeWhitespace(input.atsProvider),
    source_group: normalizeWhitespace(input.sourceGroup),
    posting_source_name: `${normalizeWhitespace(input.company)} ${
      normalizeWhitespace(input.atsProvider)
    }`.trim(),
    source_url: sourceUrl,
    official_source_url: sourceUrl,
    ats_source_url: detailUrl,
    detail_url: detailUrl,
    detail_type: input.provider,
    external_id: externalId,
    job_id_external: externalId,
    company_job_id: normalizeWhitespace(input.companyJobId || externalId),
    compensation_snippet: extractCompensationSnippet(input.compensationText),
    summary_text: summaryText,
    description_text: fullText,
    full_job_description: fullText,
    raw_posting_text: fullText,
    full_posting_captured: fullText.length > 0,
    link_health: "ok",
    active_status: "needs_verification",
  };
}

function baseSeed(seed?: NormalizedCandidateCard): Partial<CardInput> {
  if (!seed) return {};
  return {
    company: seed.company,
    sourceUrl: seed.source_url,
    detailUrl: seed.detail_url,
    externalId: seed.external_id,
    companyJobId: seed.company_job_id,
    title: seed.title,
    location: seed.location,
    department: seed.department,
    team: seed.team,
    workplaceType: seed.workplace_type,
    postedDate: seed.posted_date,
    updatedAt: seed.updated_at,
    summaryText: seed.summary_text,
    fullText: seed.full_job_description,
    compensationText: seed.compensation_snippet,
  };
}

function externalPathFromCard(seed?: NormalizedCandidateCard): string {
  if (!seed) return "";
  try {
    const url = new URL(seed.detail_url);
    const marker = "/jobs";
    const index = url.pathname.indexOf(marker);
    return index >= 0 ? url.pathname.slice(index + marker.length) : "";
  } catch {
    return "";
  }
}

function smartRecruitersDescription(row: Record<string, unknown>): string {
  const jobAd = asRecord(row.jobAd);
  const sections = asRecord(jobAd?.sections);
  const values = [
    sectionText(sections?.companyDescription),
    sectionText(sections?.jobDescription),
    sectionText(sections?.qualifications),
    sectionText(sections?.additionalInformation),
  ].filter(Boolean);
  if (!values.length) {
    const direct = firstNonEmpty(
      row.jobDescription,
      row.fullDescription,
      row.descriptionHtml,
    );
    return htmlToText(direct);
  }
  return normalizePostingText(values.join("\n"));
}

function sectionText(value: unknown): string {
  const section = asRecord(value);
  return htmlToText(section?.text);
}

function phenomFullDescription(row: Record<string, unknown>): string {
  const description = htmlToText(row.description);
  const machineDescription = htmlToText(row.ml_Description);
  return normalizePostingText(
    [description, machineDescription].filter(Boolean).join("\n"),
  );
}

function phenomSummary(row: Record<string, unknown>): string {
  const parser = asRecord(row.ml_job_parser);
  const skills = stringArray(row.ml_skills);
  return normalizeWhitespace(
    [
      stringValue(row.descriptionTeaser),
      stringValue(parser?.descriptionTeaser_keyword),
      stringValue(parser?.descriptionTeaser_ats),
      skills.length ? `Skills: ${skills.join(", ")}` : "",
    ].filter(Boolean).join("\n"),
  );
}

function workdayPublicUrl(
  config: WorkdaySourceConfig,
  externalPath = "",
  jobReqId = "",
): string {
  if (config.publicUrlKind === "walmart" && jobReqId) {
    return `https://careers.walmart.com/us/en/jobs/${
      encodeURIComponent(jobReqId)
    }`;
  }
  const locale = requiredPathSegment(config.locale || "en-US", "locale");
  const base = new URL(
    `/${locale}/${encodeURIComponent(config.site)}/`,
    workdayOrigin(config),
  );
  return safeAbsoluteUrl(relativePath(externalPath), base.href);
}

function workdayDetailUrl(
  config: WorkdaySourceConfig,
  externalPath = "",
): string {
  const base = new URL(
    `/wday/cxs/${encodeURIComponent(config.tenant)}/${
      encodeURIComponent(config.site)
    }/`,
    workdayOrigin(config),
  );
  return safeAbsoluteUrl(relativePath(externalPath), base.href);
}

function relativePath(value: unknown): string {
  return stringValue(value).replace(/^\/+/, "");
}

function workdayOrigin(config: WorkdaySourceConfig): string {
  const host = normalizeWhitespace(config.host);
  const value = /^https?:\/\//i.test(host) ? host : `https://${host}`;
  const url = new URL(value);
  if (
    url.protocol !== "https:" || url.username || url.password ||
    (url.pathname && url.pathname !== "/") || url.search || url.hash
  ) {
    throw new Error("Workday host must be an HTTPS hostname without a path");
  }
  return url.origin;
}

function smartRecruitersLocation(
  location: Record<string, unknown> | null,
): string {
  if (!location) return "";
  return stringValue(location.fullLocation) || normalizeWhitespace(
    [
      location.city,
      location.region,
      location.country,
    ].map(stringValue).filter(Boolean).join(", "),
  ) ||
    stringValue(location.address);
}

export function parsePhenomDdo(
  html: unknown,
): Record<string, unknown> | null {
  const source = String(html ?? "");
  const match = source.match(
    /phApp\.ddo\s*=\s*(\{[\s\S]*?\});\s*phApp\.experimentData/,
  );
  if (!match) return null;
  try {
    return asRecord(JSON.parse(match[1]));
  } catch {
    return null;
  }
}

function phenomBaseUrl(config: PhenomSourceConfig): string {
  const base = new URL(config.baseDomain);
  if (
    base.protocol !== "https:" || base.username || base.password ||
    (base.pathname && base.pathname !== "/") || base.search || base.hash
  ) {
    throw new Error("Phenom baseDomain must be an HTTPS origin");
  }
  const path = `/${
    normalizeWhitespace(config.basePath).replace(/^\/+|\/+$/g, "")
  }`;
  const url = new URL(path === "/" ? "/" : `${path}/`, base.origin);
  return url.href.replace(/\/$/, "");
}

function phenomPublicUrl(
  config: PhenomSourceConfig,
  row: Record<string, unknown>,
): string {
  const supplied = firstNonEmpty(
    row.jobDetailUrl,
    row.jobUrl,
    row.postingUrl,
    row.url,
  );
  if (supplied) return safeAbsoluteUrl(supplied, phenomBaseUrl(config));
  const id = stringValue(row.jobId) || stringValue(row.reqId) ||
    stringValue(row.jobSeqNo);
  const title = stringValue(row.title) || id;
  return `${phenomBaseUrl(config)}/job/${encodeURIComponent(id)}/${
    slug(title)
  }`;
}

function phenomLocation(row: Record<string, unknown>): string {
  for (const key of ["multi_location", "standardised_multi_location"]) {
    if (!Array.isArray(row[key]) || row[key].length === 0) continue;
    const locations = row[key].map((item) => {
      if (typeof item === "string") return normalizeWhitespace(item);
      const location = asRecord(item);
      return firstNonEmpty(
        location?.location,
        location?.cityStateCountry,
        location?.cityState,
      );
    }).filter(Boolean);
    if (locations.length) return locations.join("; ");
  }
  return firstNonEmpty(
    row.location,
    row.cityStateCountry,
    row.cityState,
    [row.city, row.state, row.country].map(stringValue).filter(Boolean).join(
      ", ",
    ),
  );
}

async function requestJson(
  request: JobSourceRequest,
  config: SecondaryJobSourceConfig,
  options: AdapterFetchOptions,
  fetchImpl: typeof fetch,
): Promise<unknown> {
  const response = await fetchWithTimeout(request, config, options, fetchImpl);
  const text = await response.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON returned by ${config.type} job source`);
  }
}

async function requestText(
  request: JobSourceRequest,
  config: SecondaryJobSourceConfig,
  options: AdapterFetchOptions,
  fetchImpl: typeof fetch,
): Promise<string> {
  const response = await fetchWithTimeout(request, config, options, fetchImpl);
  return await response.text();
}

async function fetchWithTimeout(
  request: JobSourceRequest,
  config: SecondaryJobSourceConfig,
  options: AdapterFetchOptions,
  fetchImpl: typeof fetch,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutMs = boundedInteger(
    options.timeoutMs ?? config.timeoutMs,
    250,
    120_000,
    DEFAULT_TIMEOUT_MS,
  );
  const abortFromCaller = () => controller.abort(options.signal?.reason);
  if (options.signal?.aborted) abortFromCaller();
  else {options.signal?.addEventListener("abort", abortFromCaller, {
      once: true,
    });}
  const timer = setTimeout(
    () => controller.abort("job source timeout"),
    timeoutMs,
  );
  try {
    const response = await fetchImpl(request.url, {
      ...request.init,
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(
        `${config.type} job source returned ${response.status} ${response.statusText}`,
      );
    }
    return response;
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", abortFromCaller);
  }
}

function appendUnique(
  target: NormalizedCandidateCard[],
  seen: Set<string>,
  cards: NormalizedCandidateCard[],
  maxCards: number,
): number {
  let addedCount = 0;
  for (const card of cards) {
    const key = `${card.provider}:${card.external_id || card.source_url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    target.push(card);
    addedCount += 1;
    if (target.length >= maxCards) return addedCount;
  }
  return addedCount;
}

function sourceQueries(config: SecondaryJobSourceConfig): string[] {
  const queries = (config.queries || DEFAULT_QUERIES).map(normalizeWhitespace)
    .filter(Boolean);
  return Array.from(new Set(queries.length ? queries : DEFAULT_QUERIES));
}

function isCard(
  value: NormalizedCandidateCard | null,
): value is NormalizedCandidateCard {
  return value !== null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function asRecordArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.map(asRecord).filter((row): row is Record<string, unknown> =>
      row !== null
    )
    : [];
}

function stringValue(value: unknown): string {
  return typeof value === "string" || typeof value === "number"
    ? normalizeWhitespace(value)
    : "";
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(stringValue).filter(Boolean) : [];
}

function nestedLabel(value: unknown): string {
  const record = asRecord(value);
  return stringValue(record?.label) || stringValue(record?.name);
}

function safeNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function boundedInteger(
  value: unknown,
  minimum: number,
  maximum: number,
  fallback: number,
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.trunc(parsed)));
}

function firstNonEmpty(...values: unknown[]): string {
  for (const value of values) {
    const text = stringValue(value);
    if (text) return text;
  }
  return "";
}

function requiredPathSegment(value: string, label: string): string {
  const normalized = normalizeWhitespace(value);
  if (!normalized || /[/?#\\]/.test(normalized)) {
    throw new Error(`${label} must be a non-empty URL path segment`);
  }
  return encodeURIComponent(normalized);
}

function safeAbsoluteUrl(value: unknown, base: string): string {
  try {
    const url = new URL(stringValue(value) || base, base);
    if (url.protocol !== "https:") return base;
    return url.href;
  } catch {
    return base;
  }
}

function jsonHeaders(): HeadersInit {
  return {
    "accept": "application/json",
    "content-type": "application/json",
    "user-agent": "Bamboo Job Command Center official-source adapter",
  };
}

function htmlHeaders(): HeadersInit {
  return {
    "accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
    "user-agent": "Bamboo Job Command Center official-source adapter",
  };
}

function normalizeWhitespace(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizePostingText(value: unknown): string {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[\t ]+/g, " ").trim())
    .filter((line, index, lines) => line || (index > 0 && lines[index - 1]))
    .join("\n")
    .trim();
}

function htmlToText(value: unknown): string {
  const html = String(value ?? "");
  const decoded = html
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&mdash;|&#8212;/gi, "-")
    .replace(/&ndash;|&#8211;/gi, "-")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(
      /&#x([0-9a-f]+);/gi,
      (_match, code) => String.fromCodePoint(Number.parseInt(code, 16)),
    );
  return normalizePostingText(
    decoded
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6]|section)>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  );
}

function extractCompensationSnippet(value: unknown): string {
  const text = htmlToText(value);
  if (!text) return "";
  const match = text.match(
    /.{0,120}\$[0-9][0-9,]*(?:\.[0-9]+)?(?:k|K)?(?:\s*(?:-|to|–|—)\s*\$?[0-9][0-9,]*(?:\.[0-9]+)?(?:k|K)?)?.{0,160}/,
  );
  return normalizeWhitespace(match?.[0] || "");
}

function stableCardId(
  company: string,
  provider: string,
  identity: string,
): string {
  const source = `${company}|${provider}|${identity}`;
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `source-${slug(company)}-${provider}-${
    (hash >>> 0).toString(16).padStart(8, "0")
  }`;
}

function slug(value: unknown): string {
  return normalizeWhitespace(value || "unknown").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64) || "unknown";
}
