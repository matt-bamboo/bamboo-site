export type OfficialAtsProvider = "greenhouse" | "ashby" | "lever";

export interface OfficialAtsSourceConfig {
  provider: OfficialAtsProvider;
  company: string;
  board: string;
  sourceName?: string;
  sourceGroup?: string;
}

export interface NormalizedCandidateCard {
  company: string;
  title: string;
  role_title: string;
  location: string;
  department: string;
  team: string;
  job_url: string;
  source_url: string;
  official_source_url: string;
  ats_source_url: string;
  external_id: string;
  job_id_external: string;
  posted_date: string;
  updated_at: string;
  workplace: string;
  workplace_type: string;
  work_style: string;
  salary_snippet: string;
  compensation_snippet: string;
  card_snippet: string;
  short_card_snippet: string;
  full_posting_text: string;
  full_job_description: string;
  raw_posting_text: string;
  source_type: "official_ats";
  source_adapter_type: `ats_${OfficialAtsProvider}`;
  ats_provider: "Greenhouse" | "Ashby" | "Lever";
  posting_source_name: string;
  source_group: string;
}

export type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export interface FetchOfficialAtsOptions {
  fetcher?: FetchLike;
  signal?: AbortSignal;
  timeoutMs?: number;
}

const PROVIDER_LABELS: Record<
  OfficialAtsProvider,
  NormalizedCandidateCard["ats_provider"]
> = {
  greenhouse: "Greenhouse",
  ashby: "Ashby",
  lever: "Lever",
};

export function buildOfficialAtsUrl(config: OfficialAtsSourceConfig): string {
  const board = normalizeWhitespace(config.board);
  if (!board) throw new Error("Official ATS source board is required");

  const encodedBoard = encodeURIComponent(board);
  switch (config.provider) {
    case "greenhouse":
      return `https://boards-api.greenhouse.io/v1/boards/${encodedBoard}/jobs?content=true`;
    case "ashby":
      return `https://api.ashbyhq.com/posting-api/job-board/${encodedBoard}`;
    case "lever":
      return `https://api.lever.co/v0/postings/${encodedBoard}?mode=json`;
  }
}

export async function fetchOfficialAtsJobs(
  config: OfficialAtsSourceConfig,
  options: FetchOfficialAtsOptions = {},
): Promise<NormalizedCandidateCard[]> {
  const fetcher = options.fetcher ?? fetch;
  const timeoutMs = boundedTimeout(options.timeoutMs);
  const controller = new AbortController();
  const abortFromCaller = () => controller.abort(options.signal?.reason);

  if (options.signal?.aborted) abortFromCaller();
  else {options.signal?.addEventListener("abort", abortFromCaller, {
      once: true,
    });}

  const timeout = setTimeout(
    () =>
      controller.abort(
        new DOMException("Official ATS request timed out", "TimeoutError"),
      ),
    timeoutMs,
  );

  try {
    const url = buildOfficialAtsUrl(config);
    const response = await fetcher(url, {
      method: "GET",
      headers: { accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(
        `${
          PROVIDER_LABELS[config.provider]
        } jobs request failed with HTTP ${response.status}`,
      );
    }
    return parseOfficialAtsResponse(config, await response.json());
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", abortFromCaller);
  }
}

export function parseOfficialAtsResponse(
  config: OfficialAtsSourceConfig,
  payload: unknown,
): NormalizedCandidateCard[] {
  switch (config.provider) {
    case "greenhouse":
      return parseGreenhouseResponse(config, payload);
    case "ashby":
      return parseAshbyResponse(config, payload);
    case "lever":
      return parseLeverResponse(config, payload);
  }
}

export function parseGreenhouseResponse(
  config: OfficialAtsSourceConfig,
  payload: unknown,
): NormalizedCandidateCard[] {
  const root = asRecord(payload);
  const jobs = Array.isArray(root?.jobs) ? root.jobs : [];

  return jobs.flatMap((value) => {
    const job = asRecord(value);
    if (!job) return [];

    const externalId = firstString(
      job.id,
      job.internal_job_id,
      job.requisition_id,
    );
    const metadata = Array.isArray(job.metadata) ? job.metadata : [];
    const description = htmlToText(job.content);
    const salary = normalizeWhitespace(
      [
        extractSalarySnippet(description),
        metadataSalarySnippet(metadata),
      ].filter(Boolean).join(" "),
    );
    const location = firstString(asRecord(job.location)?.name, job.location);
    const department = Array.isArray(job.departments)
      ? job.departments.map((item) => firstString(asRecord(item)?.name, item))
        .filter(Boolean).join(" / ")
      : "";
    const workplace = metadataValue(metadata, "Workplace Type") ||
      metadataValue(metadata, "Workplace");
    const explicitUrl = safeHttpUrl(job.absolute_url);
    const fallbackUrl = externalId
      ? `https://boards.greenhouse.io/${
        encodeURIComponent(config.board)
      }/jobs/${encodeURIComponent(externalId)}`
      : "";

    return normalizedCard(config, {
      title: firstString(job.title),
      location,
      department,
      team: department,
      jobUrl: explicitUrl || fallbackUrl,
      externalId,
      postedDate: normalizeDate(job.first_published),
      updatedAt: normalizeDate(job.updated_at),
      workplace,
      salary,
      description,
    });
  });
}

export function parseAshbyResponse(
  config: OfficialAtsSourceConfig,
  payload: unknown,
): NormalizedCandidateCard[] {
  const root = asRecord(payload);
  const jobs = Array.isArray(root?.jobs) ? root.jobs : [];

  return jobs.flatMap((value) => {
    const job = asRecord(value);
    if (!job || job.isListed === false) return [];

    const externalId = firstString(job.id);
    const secondaryLocations = Array.isArray(job.secondaryLocations)
      ? job.secondaryLocations.map((item) =>
        firstString(asRecord(item)?.location, item)
      ).filter(Boolean)
      : [];
    const location = uniqueStrings([
      firstString(job.location),
      ...secondaryLocations,
    ]).join("; ");
    const description = postingString(job.descriptionPlain) ||
      htmlToText(job.descriptionHtml);
    const structuredSalary = firstString(
      job.compensationTierSummary,
      job.compensation,
      job.salary,
    );
    const salary = extractSalarySnippet(
      [structuredSalary, description].filter(Boolean).join(" "),
    );
    const explicitUrl = safeHttpUrl(job.jobUrl);
    const fallbackUrl = externalId
      ? `https://jobs.ashbyhq.com/${encodeURIComponent(config.board)}/${
        encodeURIComponent(externalId)
      }`
      : "";
    const department = firstString(job.department);

    return normalizedCard(config, {
      title: firstString(job.title),
      location,
      department,
      team: firstString(job.team) || department,
      jobUrl: explicitUrl || fallbackUrl,
      externalId,
      postedDate: normalizeDate(job.publishedAt),
      updatedAt: normalizeDate(job.updatedAt) || normalizeDate(job.publishedAt),
      workplace: firstString(job.workplaceType) ||
        (job.isRemote === true ? "Remote" : ""),
      salary,
      description,
    });
  });
}

export function parseLeverResponse(
  config: OfficialAtsSourceConfig,
  payload: unknown,
): NormalizedCandidateCard[] {
  const jobs = Array.isArray(payload) ? payload : [];

  return jobs.flatMap((value) => {
    const job = asRecord(value);
    if (!job) return [];

    const categories = asRecord(job.categories) ?? {};
    const listText = Array.isArray(job.lists)
      ? job.lists.map((item) => {
        const list = asRecord(item);
        if (!list) return "";
        return [firstString(list.text), htmlToText(list.content)]
          .filter(Boolean).join("\n");
      }).filter(Boolean).join("\n")
      : "";
    const description = normalizePostingText(
      [
        postingString(job.descriptionPlain),
        htmlToText(job.description),
        listText,
        htmlToText(job.additional),
      ].filter(Boolean).join("\n"),
    );
    const externalId = firstString(job.id, job.reqCode);
    const explicitUrl = safeHttpUrl(job.hostedUrl) || safeHttpUrl(job.applyUrl);
    const fallbackUrl = externalId
      ? `https://jobs.lever.co/${encodeURIComponent(config.board)}/${
        encodeURIComponent(externalId)
      }`
      : "";
    const structuredSalary = structuredSalarySnippet(job.salaryRange);
    const salary = normalizeWhitespace(
      structuredSalary || extractSalarySnippet(description),
    );
    const department = firstString(categories.department);

    return normalizedCard(config, {
      title: firstString(job.text),
      location: firstString(categories.location),
      department,
      team: firstString(categories.team) || department,
      jobUrl: explicitUrl || fallbackUrl,
      externalId: externalId || explicitUrl,
      postedDate: normalizeDate(job.createdAt),
      updatedAt: normalizeDate(job.updatedAt) || normalizeDate(job.createdAt),
      workplace: firstString(job.workplaceType, categories.commitment),
      salary,
      description,
    });
  });
}

interface CandidateCardInput {
  title: string;
  location: string;
  department: string;
  team: string;
  jobUrl: string;
  externalId: string;
  postedDate: string;
  updatedAt: string;
  workplace: string;
  salary: string;
  description: string;
}

function normalizedCard(
  config: OfficialAtsSourceConfig,
  input: CandidateCardInput,
): NormalizedCandidateCard[] {
  const title = normalizeWhitespace(input.title);
  const jobUrl = safeHttpUrl(input.jobUrl);
  if (!title || !jobUrl) return [];

  const description = normalizePostingText(input.description);
  const salary = normalizeWhitespace(input.salary);
  const snippet = truncate(description, 360);
  const providerLabel = PROVIDER_LABELS[config.provider];
  const sourceName = normalizeWhitespace(config.sourceName) ||
    `${config.company} ${providerLabel}`;
  const workplace = normalizeWhitespace(input.workplace);
  const externalId = normalizeWhitespace(input.externalId);

  return [{
    company: normalizeWhitespace(config.company),
    title,
    role_title: title,
    location: normalizeWhitespace(input.location),
    department: normalizeWhitespace(input.department),
    team: normalizeWhitespace(input.team),
    job_url: jobUrl,
    source_url: jobUrl,
    official_source_url: jobUrl,
    ats_source_url: jobUrl,
    external_id: externalId,
    job_id_external: externalId,
    posted_date: input.postedDate,
    updated_at: input.updatedAt,
    workplace,
    workplace_type: workplace,
    work_style: workplace,
    salary_snippet: salary,
    compensation_snippet: salary,
    card_snippet: snippet,
    short_card_snippet: snippet,
    full_posting_text: description,
    full_job_description: description,
    raw_posting_text: description,
    source_type: "official_ats",
    source_adapter_type: `ats_${config.provider}`,
    ats_provider: providerLabel,
    posting_source_name: sourceName,
    source_group: normalizeWhitespace(config.sourceGroup),
  }];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
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

function postingString(value: unknown): string {
  return typeof value === "string" || typeof value === "number"
    ? normalizePostingText(value)
    : "";
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map(normalizeWhitespace).filter(Boolean))];
}

function safeHttpUrl(value: unknown): string {
  const text = firstString(value);
  if (!text) return "";
  try {
    const url = new URL(text);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.href
      : "";
  } catch {
    return "";
  }
}

function normalizeDate(value: unknown): string {
  if (typeof value !== "string" && typeof value !== "number") return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
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

function metadataValue(metadata: unknown[], name: string): string {
  const match = metadata.map(asRecord).find((item) =>
    item && firstString(item.name).toLowerCase() === name.toLowerCase()
  );
  return match ? firstString(match.value) : "";
}

function metadataSalarySnippet(metadata: unknown[]): string {
  return metadata.map(asRecord).flatMap((item) => {
    if (!item) return [];
    const name = firstString(item.name);
    if (
      !/(compensation|salary|base pay|base cash|fixed compensation|pay range|salary band|wage|annual|ote|on-target|total rewards|all-in)/i
        .test(name)
    ) {
      return [];
    }
    const structured = structuredSalarySnippet(item.value, name);
    const text = structured ||
      extractSalarySnippet(`${name}: ${firstString(item.value)}`);
    return text ? [text] : [];
  }).join(" ");
}

function structuredSalarySnippet(value: unknown, label = "Salary"): string {
  const range = asRecord(value);
  if (!range) return "";
  const minimum = numericValue(
    range.min_value ?? range.min ?? range.minimum ?? range.low,
  );
  const maximum = numericValue(
    range.max_value ?? range.max ?? range.maximum ?? range.high,
  );
  if (!minimum || !maximum) return "";
  const currency = firstString(
    range.currency ?? range.currency_code ?? range.unit,
  ) || "USD";
  const interval = firstString(range.interval, range.period);
  const prefix = /^usd$/i.test(currency) ? "$" : `${currency} `;
  const suffix = interval ? ` ${interval}` : "";
  return `${normalizeWhitespace(label)}: ${prefix}${
    formatAmount(minimum)
  } - ${prefix}${formatAmount(maximum)}${suffix}`;
}

function numericValue(value: unknown): number {
  const number = typeof value === "number"
    ? value
    : Number(String(value ?? "").replace(/[$,]/g, ""));
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function formatAmount(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

function extractSalarySnippet(value: unknown): string {
  const text = normalizeWhitespace(value);
  if (!text) return "";

  const keyword =
    /\b(compensation|salary|base pay|base salary|base compensation|base cash|fixed salary|fixed compensation|salary band|pay range|wage|annual base|annual salary|total rewards|all-in compensation|target cash compensation|ote|on-target earnings)\b/gi;
  let match: RegExpExecArray | null;
  while ((match = keyword.exec(text)) !== null) {
    const window = text.slice(
      Math.max(0, match.index - 100),
      Math.min(text.length, match.index + 420),
    );
    const compact = compactSalaryWindow(window);
    if (compact) return compact;
  }

  return compactSalaryWindow(text);
}

function containsSalaryAmount(value: string): boolean {
  return /(?:USD\s*)?\$\s*\d[\d,]*(?:\.\d+)?\s*[kKmM]?/i.test(value) ||
    /\bUSD\s+\d{2,3}(?:,\d{3})+(?:\s*(?:-|to|through|\u2013|\u2014)\s*\d{2,3}(?:,\d{3})+)?/i
      .test(value);
}

function compactSalaryWindow(value: string): string {
  const text = normalizeWhitespace(value);
  if (!text || !containsSalaryAmount(text)) return "";
  const range = text.match(
    /(?:USD\s*)?\$\s*\d[\d,]*(?:\.\d+)?\s*[kKmM]?(?:\s*(?:-|to|through|\u2013|\u2014)\s*(?:USD\s*)?\$?\s*\d[\d,]*(?:\.\d+)?\s*[kKmM]?)?/i,
  );
  if (!range || range.index === undefined) return "";
  const lookBehindStart = Math.max(0, range.index - 180);
  const lookBehind = text.slice(lookBehindStart, range.index);
  const keywordMatches = [...lookBehind.matchAll(
    /\b(?:national\s+)?(?:base pay range|base salary range|base compensation|base cash|fixed salary|fixed compensation|salary band|salary range|compensation range|pay range|annual base salary|annual salary|target cash compensation|all-in compensation|total rewards range|on-target earnings|ote)\b/gi,
  )];
  const keywordStart = keywordMatches.at(-1)?.index;
  const start = keywordStart === undefined
    ? Math.max(0, range.index - 90)
    : lookBehindStart + keywordStart;
  const end = Math.min(text.length, range.index + range[0].length + 170);
  return truncate(text.slice(start, end), 360);
}

function truncate(value: string, maximum: number): string {
  const text = normalizeWhitespace(value);
  return text.length <= maximum ? text : `${text.slice(0, maximum - 3)}...`;
}

function boundedTimeout(value: number | undefined): number {
  if (!Number.isFinite(value)) return 15_000;
  return Math.min(60_000, Math.max(100, Math.round(value as number)));
}
