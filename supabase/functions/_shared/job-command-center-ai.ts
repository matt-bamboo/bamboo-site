import {
  createClient,
  type SupabaseClient as SupabaseClientType,
} from "npm:@supabase/supabase-js@2";
import {
  allSchemaNames,
  FINALIZED_PACKET_DOCUMENT_TYPES,
  JsonSchema,
  schemaForAction,
  schemaNameForAction,
  validateAgainstSchema,
} from "./job-command-center-schemas.ts";
import {
  listedBaseRange,
  screenSearchResultsByCompensation,
} from "./job-search-policy.ts";
import { searchAuditSample } from "./job-search-audit.ts";
import {
  type CustomOfficialSourceError,
  type CustomOfficialSourceResult,
  fetchCustomOfficialSourceJobs,
} from "./job-source-custom-adapters.ts";
import {
  buildOfficialAtsUrl,
  fetchOfficialAtsJobs,
  type NormalizedCandidateCard,
  type OfficialAtsSourceConfig,
} from "./job-source-adapters.ts";
import {
  buildPhenomSearchRequest,
  buildSmartRecruitersSearchRequest,
  buildWorkdaySearchRequest,
  fetchPhenomCandidateCards,
  fetchPhenomJobDetail,
  fetchSmartRecruitersCandidateCards,
  fetchSmartRecruitersJobDetail,
  fetchWorkdayCandidateCards,
  fetchWorkdayJobDetail,
  type NormalizedCandidateCard as NormalizedSecondaryCandidateCard,
  type SecondaryJobSourceConfig,
} from "./job-source-secondary-adapters.ts";
import {
  mergeSourceQueries,
  officialCaptureDisposition,
} from "./job-source-capture-policy.ts";
import { DEFAULT_SEARCH_COMPANIES } from "./job-search-roster.ts";
import { normalizeJobSourceType } from "./job-source-normalization.ts";
import {
  compactJobForPacket,
  normalizeStrategistScore,
  selectPacketCareerFacts,
  selectPacketResumeLanes,
  selectPacketSourceDocuments,
} from "./job-packet-context.ts";

type OfficialSourceMetadata = {
  provider: string;
  sourceGroup: string;
  officialJobSearchUrl: string;
  sourceAdapterType: string;
  careersHomeUrl: string;
};

type SupabaseClient = SupabaseClientType<any, "public", any, any, any>;
type Provider = "openai" | "gemini";
type WorkflowStatus =
  | "queued"
  | "running"
  | "waiting_for_dependency"
  | "waiting_for_user"
  | "waiting_for_login"
  | "waiting_for_approval"
  | "retrying"
  | "failed_preflight"
  | "failed_validation"
  | "failed_provider"
  | "failed_storage"
  | "failed_cost_limit"
  | "failed_error_limit"
  | "completed"
  | "completed_with_failures"
  | "cancelled";

type RequestBody = {
  job?: Record<string, unknown>;
  jobs?: Array<Record<string, unknown>>;
  resumeBank?: Record<string, unknown>;
  careerFacts?: Array<Record<string, unknown>>;
  prohibitedFacts?: Array<Record<string, unknown>>;
  sourceDocuments?: Array<Record<string, unknown>>;
  resumeLanes?: Array<Record<string, unknown>>;
  promptContracts?: Record<string, string>;
  document?: Record<string, unknown>;
  feedback?: Record<string, unknown>;
  documentRules?: Array<Record<string, unknown>>;
  target_document_id?: string;
  schemas?: string[];
  workflow_type?: string;
  workflow_run_id?: string;
  workflow_id?: string;
  run_id?: string;
  search_run_id?: string;
  step_id?: string;
  companies?: string[];
  role_families?: string[];
  official_career_urls?: string[] | Record<string, string[]>;
  include_packet_generation?: boolean;
  source_first_official_capture?: boolean;
  compensation_target?: {
    mode?: "opportunity_target" | "strict_listed_base" | "scope_first";
    total_compensation_target?: number;
    listed_base_minimum?: number;
    include_unlisted_senior_roles?: boolean;
    rule?: string;
  };
  approved?: boolean;
  test_phase?: string;
  profile?: string;
  sourceText?: string;
  prompt?: string;
  notes?: string;
  consent_gates?: string;
  test_models?: boolean;
  run_synchronously?: boolean;
  limits?: Record<string, number | boolean>;
};

type AuthContext = {
  user: { id: string; email?: string };
  supabase: SupabaseClient;
};

type ProviderResult = {
  model: string;
  providerRequestId: string;
  providerRequestIds?: string[];
  providerRequestCount?: number;
  text: string;
  parsed: Record<string, unknown>;
  raw: Record<string, unknown>;
  grounding: Record<string, unknown>;
  usage: Record<string, unknown>;
  searchQueryCount: number;
  latencyMs: number;
  repaired: boolean;
  validationErrors: string[];
  deterministicReplay?: boolean;
  replaySourceArtifactId?: string;
};

type ValidationRepairCandidate = {
  artifactId: string;
  rawText: string;
  validationErrors: string[];
};

type FinalizedPacketDocumentType =
  typeof FINALIZED_PACKET_DOCUMENT_TYPES[number];

export type FinalizedPacketClaimEvidence = {
  claim_text: string;
  support_status: "supported" | "unsupported" | "prohibited" | "needs_review";
  matched_fact_ids: string[];
  source_document_ids: string[];
};

export type FinalizedPacketDocumentEvidence = {
  claim_evidence: FinalizedPacketClaimEvidence[];
  matched_fact_ids: string[];
  claims_used: string[];
  unresolved_issues: string[];
  unsupported_claims: string[];
  prohibited_fact_matches: string[];
  needs_review_fact_matches: string[];
};

type FinalizedRoleKitDocument = {
  documentType: FinalizedPacketDocumentType;
  sourceField: FinalizedPacketDocumentType;
  content: string;
  evidence: FinalizedPacketDocumentEvidence | null;
};

export type ResumeQualityScorecard = {
  document_type: "ats_resume" | "executive_resume";
  factual_integrity_score: number;
  channel_structure_score: number;
  direct_role_evidence_score: number;
  executive_operating_proof_score: number;
  human_scan_channel_fit_score: number;
  total_score: number;
  score_threshold: number;
  factual_integrity_gate: "pass" | "fail";
  quality_verdict: "pass" | "revise" | "block";
  rubric_evidence: Array<{
    component:
      | "factual_integrity_score"
      | "channel_structure_score"
      | "direct_role_evidence_score"
      | "executive_operating_proof_score"
      | "human_scan_channel_fit_score";
    posting_quotes: string[];
    resume_quotes: string[];
    supporting_fact_ids: string[];
    points_awarded: number;
    rationale: string;
  }>;
  strengths: string[];
  findings: string[];
  required_revisions: string[];
};

export type FinalRoleKitQualityAssessment = Record<string, unknown> & {
  ats_resume: ResumeQualityScorecard;
  executive_resume: ResumeQualityScorecard;
  supporting_materials: Record<string, unknown>;
  score_threshold: number;
  factual_integrity_gate: "pass" | "fail";
  quality_gate: "pass" | "revise" | "block";
  blocking_findings: string[];
  required_revisions: string[];
  approval_status: "ready_for_review" | "needs_manual_review";
};

export type FinalQualityAuditContext = {
  verifiedJob?: Record<string, unknown>;
  approvedCareerFacts?: Array<Record<string, unknown>>;
  finalizer?: Record<string, unknown>;
};

export type GeneratedOutputPersistenceResult = {
  approvalId: string;
  approvalStatus: "ready_for_review" | "needs_manual_review";
  documentIds: string[];
};

export type FinalizedRoleKitIntegrityContext = {
  careerFacts?: Array<Record<string, unknown>>;
  sourceDocuments?: Array<Record<string, unknown>>;
  job?: Record<string, unknown>;
};

export type FinalizedRoleKitPersistenceStore = {
  supersedeActionableApprovals: () => Promise<void>;
  upsertDocumentRows: (rows: Array<Record<string, unknown>>) => Promise<void>;
  upsertCanonicalApproval: (row: Record<string, unknown>) => Promise<void>;
};

export type ProviderRetryOutcome =
  | "not_applicable"
  | "provider_not_called"
  | "known_invalid_response"
  | "definite_provider_rejection"
  | "provider_outcome_uncertain";

export type RetryWindowDecision = {
  allowed: boolean;
  maxAttempts: number;
  message: string;
  providerOutcome: ProviderRetryOutcome;
  manualReconciliationRequired: boolean;
};

class ValidationFailure extends Error {
  rawText: string;
  validationErrors: string[];
  providerRequestIds: string[];
  providerRequestCount: number;
  usage: Record<string, unknown>;
  searchQueryCount: number;
  latencyMs: number;
  model: string;

  constructor(
    message: string,
    rawText: string,
    validationErrors: string[],
    accounting: {
      providerRequestIds?: string[];
      providerRequestCount?: number;
      usage?: Record<string, unknown>;
      searchQueryCount?: number;
      latencyMs?: number;
      model?: string;
    } = {},
  ) {
    super(message);
    this.name = "ValidationFailure";
    this.rawText = rawText;
    this.validationErrors = validationErrors;
    this.providerRequestIds = accounting.providerRequestIds || [];
    this.providerRequestCount = Math.max(
      0,
      Number(accounting.providerRequestCount || 0),
    );
    this.usage = accounting.usage || {};
    this.searchQueryCount = Math.max(
      0,
      Number(accounting.searchQueryCount || 0),
    );
    this.latencyMs = Math.max(0, Number(accounting.latencyMs || 0));
    this.model = String(accounting.model || "");
  }
}

class WorkflowStop extends Error {
  status: WorkflowStatus | "waiting_for_user";
  code: string;
  details: Record<string, unknown>;

  constructor(
    status: WorkflowStatus | "waiting_for_user",
    code: string,
    message: string,
    details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "WorkflowStop";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

class ProviderRequestFailure extends Error {
  provider: Provider;
  model: string;
  httpStatus: number;
  providerStatus: string;
  providerMessage: string;
  requestMode: string;
  attempts: Array<Record<string, unknown>>;

  constructor(args: {
    provider: Provider;
    model: string;
    httpStatus: number;
    providerStatus: string;
    providerMessage: string;
    requestMode: string;
    attempts: Array<Record<string, unknown>>;
  }) {
    super(
      `${
        args.provider === "gemini" ? "Gemini" : "Provider"
      } request failed: ${args.httpStatus} ${
        args.providerStatus || ""
      } ${args.providerMessage}`.trim(),
    );
    this.name = "ProviderRequestFailure";
    this.provider = args.provider;
    this.model = args.model;
    this.httpStatus = args.httpStatus;
    this.providerStatus = args.providerStatus;
    this.providerMessage = args.providerMessage;
    this.requestMode = args.requestMode;
    this.attempts = args.attempts;
  }
}

const ALLOWED_CORS_ORIGINS = new Set([
  "https://app.bamboo.holdings",
  "http://127.0.0.1:8765",
  "http://localhost:8765",
]);

const CONTROLLED_COMPANIES = [...DEFAULT_SEARCH_COMPANIES];
const DEFAULT_OFFICIAL_CAREER_URLS: Record<string, string[]> = {
  waymo: ["https://careers.withwaymo.com/jobs"],
  whatnot: ["https://careers.whatnot.com", "https://jobs.ashbyhq.com/whatnot"],
  doordash: ["https://careers.doordash.com/jobs"],
  uber: ["https://www.uber.com/us/en/careers/list/"],
  google: ["https://www.google.com/about/careers/applications/jobs/results"],
  apple: ["https://jobs.apple.com/en-us/search"],
  meta: ["https://www.metacareers.com/jobs"],
  amazon: ["https://www.amazon.jobs/en/search"],
  microsoft: ["https://jobs.careers.microsoft.com/global/en/search"],
  netflix: ["https://jobs.netflix.com/search"],
  nvidia: [
    "https://www.nvidia.com/en-us/about-nvidia/careers/",
    "https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite",
  ],
  oracle: [
    "https://eeho.fa.us2.oraclecloud.com/hcmUI/CandidateExperience/en/sites/jobsearch",
  ],
  salesforce: ["https://careers.salesforce.com/en/jobs/"],
  adobe: ["https://careers.adobe.com/us/en/search-results"],
  servicenow: ["https://careers.servicenow.com/careers/jobs"],
  intuit: ["https://jobs.intuit.com/search-jobs"],
  paypal: ["https://paypal.eightfold.ai/careers"],
  block_square: [
    "https://block.xyz/careers/jobs",
    "https://careers.squareup.com/us/en/jobs",
  ],
  stripe: ["https://stripe.com/jobs/search"],
  linkedin: ["https://www.linkedin.com/company/linkedin/jobs"],
  tiktok_bytedance: [
    "https://careers.tiktok.com/search",
    "https://jobs.bytedance.com/en/position",
  ],
  snap: ["https://www.snap.com/en-US/jobs"],
  pinterest: ["https://www.pinterestcareers.com/jobs"],
  airbnb: ["https://careers.airbnb.com/positions/"],
  instacart: ["https://www.instacart.careers/jobs"],
  walmart_global_tech: [
    "https://careers.walmart.com/technology",
    "https://careers.walmart.com/results",
  ],
  ebay: ["https://jobs.ebayinc.com/us/en/search-results"],
  etsy: ["https://www.etsy.com/careers"],
  shopify: ["https://www.shopify.com/careers/search"],
  flexport: ["https://www.flexport.com/careers"],
  faire: ["https://www.faire.com/careers/jobs"],
  stockx: ["https://stockx.com/careers"],
  goat: ["https://www.goatgroup.com/careers"],
  wayfair: ["https://www.wayfair.com/careers/jobs"],
  fanatics: ["https://www.fanaticsinc.com/careers"],
  ticketmaster_live_nation: [
    "https://www.livenationentertainment.com/careers/",
  ],
  gopuff: ["https://www.gopuff.com/go/careers"],
  chewy: ["https://careers.chewy.com/us/en/search-results"],
  toast: ["https://careers.toasttab.com/jobs"],
  servicetitan: ["https://www.servicetitan.com/careers"],
  zoox: ["https://zoox.com/careers"],
  nuro: ["https://www.nuro.ai/careers"],
  aurora: ["https://aurora.tech/careers"],
  gatik: ["https://gatik.ai/careers/"],
  tesla: ["https://www.tesla.com/careers/search"],
  rivian: ["https://careers.rivian.com/jobs"],
  lucid: ["https://lucidmotors.com/careers/search"],
  samsara: ["https://www.samsara.com/company/careers/roles"],
  anduril: ["https://www.anduril.com/careers"],
  applied_intuition: ["https://www.appliedintuition.com/careers"],
  skydio: ["https://www.skydio.com/careers"],
  shield_ai: ["https://shield.ai/careers"],
  figure_ai: ["https://www.figure.ai/careers"],
  agility_robotics: ["https://agilityrobotics.com/careers"],
  serve_robotics: ["https://www.serverobotics.com/careers"],
  gecko_robotics: ["https://www.geckorobotics.com/careers"],
  kraken: ["https://www.kraken.com/careers"],
  coinbase: ["https://www.coinbase.com/careers/positions"],
  robinhood: ["https://careers.robinhood.com"],
  ramp: ["https://ramp.com/careers"],
  brex: ["https://www.brex.com/careers"],
  chime: ["https://www.chime.com/careers/"],
  plaid: ["https://plaid.com/careers/openings/"],
  affirm: ["https://www.affirm.com/careers"],
  sofi: ["https://www.sofi.com/careers/"],
  adyen: ["https://careers.adyen.com"],
  marqeta: ["https://www.marqeta.com/careers"],
  wise: ["https://www.wise.jobs"],
  fis: ["https://careers.fisglobal.com/us/en/search-results"],
  fiserv: ["https://careers.fiserv.com/us/en/search-results"],
  openai: ["https://openai.com/careers/search/"],
  anthropic: ["https://www.anthropic.com/jobs"],
  scale_ai: ["https://www.scale.com/careers"],
  palantir: ["https://www.palantir.com/careers/"],
  databricks: ["https://www.databricks.com/company/careers/open-positions"],
  snowflake: ["https://careers.snowflake.com/us/en/search-results"],
  cloudflare: ["https://www.cloudflare.com/careers/jobs/"],
  vercel: ["https://vercel.com/careers"],
  mongodb: ["https://www.mongodb.com/company/careers/jobs"],
  atlassian: ["https://www.atlassian.com/company/careers/all-jobs"],
  asana: ["https://asana.com/jobs"],
  monday_com: ["https://monday.com/careers/jobs"],
  notion: ["https://www.notion.com/careers"],
  airtable: ["https://www.airtable.com/careers"],
  zapier: ["https://zapier.com/jobs"],
};
const OFFICIAL_ATS_SOURCE_CONFIGS: OfficialAtsSourceConfig[] = [
  {
    provider: "greenhouse",
    company: "DoorDash",
    board: "doordashusa",
    sourceGroup: "Marketplace / Commerce / Logistics",
  },
  {
    provider: "greenhouse",
    company: "Airbnb",
    board: "airbnb",
    sourceGroup: "Marketplace / Commerce / Logistics",
  },
  {
    provider: "greenhouse",
    company: "Coinbase",
    board: "coinbase",
    sourceGroup: "Fintech / Marketplace Operations",
  },
  {
    provider: "greenhouse",
    company: "Instacart",
    board: "instacart",
    sourceGroup: "Marketplace / Commerce / Logistics",
  },
  {
    provider: "greenhouse",
    company: "Stripe",
    board: "stripe",
    sourceGroup: "Fintech / Business Operations",
  },
  {
    provider: "greenhouse",
    company: "Databricks",
    board: "databricks",
    sourceGroup: "Enterprise / Business Operations",
  },
  {
    provider: "greenhouse",
    company: "Robinhood",
    board: "robinhood",
    sourceGroup: "Fintech / Customer Operations",
  },
  {
    provider: "greenhouse",
    company: "Brex",
    board: "brex",
    sourceGroup: "Fintech / Operations",
  },
  {
    provider: "greenhouse",
    company: "MongoDB",
    board: "mongodb",
    sourceGroup: "Enterprise / Business Operations",
  },
  {
    provider: "greenhouse",
    company: "Cloudflare",
    board: "cloudflare",
    sourceGroup: "Enterprise / Network Operations",
  },
  {
    provider: "greenhouse",
    company: "Asana",
    board: "asana",
    sourceGroup: "Enterprise / Business Operations",
  },
  {
    provider: "greenhouse",
    company: "Faire",
    board: "faire",
    sourceGroup: "Marketplace / Commerce / Logistics",
  },
  {
    provider: "greenhouse",
    company: "Affirm",
    board: "affirm",
    sourceGroup: "Fintech / Operations",
  },
  {
    provider: "greenhouse",
    company: "Chime",
    board: "chime",
    sourceGroup: "Fintech / Customer Operations",
  },
  {
    provider: "greenhouse",
    company: "Airtable",
    board: "airtable",
    sourceGroup: "Enterprise / Business Operations",
  },
  {
    provider: "greenhouse",
    company: "Flexport",
    board: "flexport",
    sourceGroup: "Logistics / Network Operations",
  },
  {
    provider: "greenhouse",
    company: "Anduril",
    board: "andurilindustries",
    sourceGroup: "Real-World Tech / Defense / Robotics",
  },
  {
    provider: "greenhouse",
    company: "Samsara",
    board: "samsara",
    sourceGroup: "Real-World Tech / Fleet Operations",
  },
  {
    provider: "greenhouse",
    company: "Uber",
    board: "uberfreight",
    sourceGroup: "Marketplace / Commerce / Logistics",
  },
  {
    provider: "greenhouse",
    company: "Block / Square",
    board: "block",
    sourceGroup: "Fintech / Operations",
  },
  {
    provider: "greenhouse",
    company: "Pinterest",
    board: "pinterest",
    sourceGroup: "Marketplace / Commerce / Operations",
  },
  {
    provider: "greenhouse",
    company: "StockX",
    board: "stockx",
    sourceGroup: "Marketplace / Commerce / Logistics",
  },
  {
    provider: "greenhouse",
    company: "GOAT",
    board: "goatgroup",
    sourceGroup: "Marketplace / Commerce / Logistics",
  },
  {
    provider: "greenhouse",
    company: "Fanatics",
    board: "fanaticsinc",
    sourceName: "Fanatics Inc. official Greenhouse",
    sourceGroup: "Marketplace / Commerce / Sports Operations",
  },
  {
    provider: "greenhouse",
    company: "Fanatics",
    board: "fanaticscollectibles",
    sourceName: "Fanatics Collectibles official Greenhouse",
    sourceGroup: "Marketplace / Commerce / Collectibles Operations",
  },
  {
    provider: "greenhouse",
    company: "Toast",
    board: "toast",
    sourceGroup: "Marketplace / Commerce / Customer Operations",
  },
  {
    provider: "greenhouse",
    company: "Gatik",
    board: "gatikaiinc",
    sourceGroup: "Real-World Tech / Autonomous / Logistics Operations",
  },
  {
    provider: "greenhouse",
    company: "Nuro",
    board: "nuro",
    sourceGroup: "Real-World Tech / Autonomous / Robotics",
  },
  {
    provider: "greenhouse",
    company: "Aurora",
    board: "aurorainnovation",
    sourceGroup: "Real-World Tech / Autonomous / Robotics",
  },
  {
    provider: "greenhouse",
    company: "Lucid",
    board: "lucidmotors",
    sourceGroup: "Real-World Tech / Automotive Operations",
  },
  {
    provider: "greenhouse",
    company: "Applied Intuition",
    board:
      "co58owxtuvc3ql11n5p1b79mj5flai45kbbwmpk5zvyfvj7tphwrf7kj9r0vr8krxku3n93jffzugl2w8420bfji9ar3q8hle6ty",
    sourceGroup: "Real-World Tech / Autonomous / Robotics",
  },
  {
    provider: "greenhouse",
    company: "Figure AI",
    board: "figureai",
    sourceGroup: "Real-World Tech / Robotics",
  },
  {
    provider: "greenhouse",
    company: "Agility Robotics",
    board: "agilityrobotics",
    sourceGroup: "Real-World Tech / Robotics",
  },
  {
    provider: "greenhouse",
    company: "SoFi",
    board: "sofi",
    sourceGroup: "Fintech / Operations",
  },
  {
    provider: "greenhouse",
    company: "Adyen",
    board: "adyen",
    sourceGroup: "Fintech / Operations",
  },
  {
    provider: "greenhouse",
    company: "Marqeta",
    board: "marqeta",
    sourceGroup: "Fintech / Operations",
  },
  {
    provider: "greenhouse",
    company: "Anthropic",
    board: "anthropic",
    sourceGroup: "AI / Business Operations",
  },
  {
    provider: "greenhouse",
    company: "Scale AI",
    board: "scaleai",
    sourceGroup: "AI / Business Operations",
  },
  {
    provider: "greenhouse",
    company: "Vercel",
    board: "vercel",
    sourceGroup: "Enterprise / Business Operations",
  },
  {
    provider: "ashby",
    company: "OpenAI",
    board: "openai",
    sourceGroup: "AI / Business Operations",
  },
  {
    provider: "ashby",
    company: "Ramp",
    board: "ramp",
    sourceGroup: "Fintech / Operations",
  },
  {
    provider: "ashby",
    company: "Notion",
    board: "notion",
    sourceGroup: "Enterprise / Business Operations",
  },
  {
    provider: "ashby",
    company: "Skydio",
    board: "skydio",
    sourceGroup: "Real-World Tech / Robotics",
  },
  {
    provider: "ashby",
    company: "Gecko Robotics",
    board: "gecko-robotics",
    sourceGroup: "Real-World Tech / Robotics / Industrial Operations",
  },
  {
    provider: "ashby",
    company: "Serve Robotics",
    board: "serverobotics",
    sourceGroup: "Real-World Tech / Robotics",
  },
  {
    provider: "ashby",
    company: "Plaid",
    board: "plaid",
    sourceGroup: "Fintech / Operations",
  },
  {
    provider: "ashby",
    company: "Kraken",
    board: "kraken.com",
    sourceGroup: "Fintech / Crypto / Operations",
  },
  {
    provider: "ashby",
    company: "Snowflake",
    board: "snowflake",
    sourceGroup: "Enterprise / Business Operations",
  },
  {
    provider: "ashby",
    company: "Zapier",
    board: "zapier",
    sourceGroup: "Enterprise / Business Operations",
  },
  {
    provider: "ashby",
    company: "Monday.com",
    board: "monday.com",
    sourceGroup: "Enterprise / Work OS / GTM Operations",
  },
  {
    provider: "lever",
    company: "Gopuff",
    board: "gopuff",
    sourceGroup: "Marketplace / Commerce / Logistics",
  },
  {
    provider: "lever",
    company: "Zoox",
    board: "zoox",
    sourceGroup: "Real-World Tech / Autonomous / Robotics",
  },
  {
    provider: "lever",
    company: "Shield AI",
    board: "shieldai",
    sourceGroup: "Real-World Tech / Defense / Robotics",
  },
  {
    provider: "lever",
    company: "Palantir",
    board: "palantir",
    sourceGroup: "Enterprise / Business Operations",
  },
];
const SECONDARY_OFFICIAL_SOURCE_CONFIGS: SecondaryJobSourceConfig[] = [
  {
    company: "Walmart Global Tech",
    type: "workday",
    host: "walmart.wd504.myworkdayjobs.com",
    tenant: "walmart",
    site: "WalmartExternal",
    publicUrlKind: "walmart",
    provider: "Workday",
    sourceGroup: "Marketplace / Retail / Technology Operations",
    queries: [
      "technology operations",
      "strategy operations",
      "business operations",
      "marketplace operations",
      "customer operations",
      "director operations",
    ],
  },
  {
    company: "Nvidia",
    type: "workday",
    host: "nvidia.wd5.myworkdayjobs.com",
    tenant: "nvidia",
    site: "NVIDIAExternalCareerSite",
    provider: "Workday",
    sourceGroup: "Real-World Tech / AI Infrastructure / Operations",
    queries: [
      "operations",
      "strategy operations",
      "business operations",
      "customer operations",
    ],
  },
  {
    company: "PayPal",
    type: "workday",
    host: "paypal.wd1.myworkdayjobs.com",
    tenant: "paypal",
    site: "jobs",
    provider: "Workday",
    sourceGroup: "Fintech / Marketplace Operations",
    queries: [
      "operations",
      "strategy operations",
      "business operations",
      "customer operations",
    ],
  },
  {
    company: "Adobe",
    type: "workday",
    host: "adobe.wd5.myworkdayjobs.com",
    tenant: "adobe",
    site: "external_experienced",
    provider: "Workday",
    sourceGroup: "Enterprise / Creative Cloud / Business Operations",
    queries: [
      "operations",
      "strategy operations",
      "business operations",
      "customer operations",
    ],
  },
  {
    company: "ServiceTitan",
    type: "workday",
    host: "servicetitan.wd1.myworkdayjobs.com",
    tenant: "servicetitan",
    site: "ServiceTitan",
    provider: "Workday",
    sourceGroup: "Enterprise / Vertical SaaS / Customer Operations",
    queries: [
      "operations",
      "strategy operations",
      "business operations",
      "customer success",
      "support operations",
      "regional president",
    ],
  },
  {
    company: "Fiserv",
    type: "workday",
    host: "fiserv.wd5.myworkdayjobs.com",
    tenant: "fiserv",
    site: "EXT",
    provider: "Workday",
    sourceGroup: "Fintech / Payments Operations",
    queries: [
      "operations",
      "strategy operations",
      "business operations",
      "customer operations",
    ],
  },
  {
    company: "Salesforce",
    type: "workday",
    host: "salesforce.wd12.myworkdayjobs.com",
    tenant: "salesforce",
    site: "External_Career_Site",
    provider: "Workday",
    sourceGroup: "Enterprise / Customer Operations",
    queries: [
      "operations",
      "strategy operations",
      "business operations",
      "customer operations",
    ],
  },
  {
    company: "Snap",
    type: "workday",
    host: "snapchat.wd1.myworkdayjobs.com",
    tenant: "snapchat",
    site: "snap",
    provider: "Workday",
    sourceGroup: "Marketplace / Social / Trust & Safety / Operations",
    queries: [
      "operations",
      "strategy operations",
      "growth strategy operations",
      "business operations",
      "partnership operations",
      "trust safety operations",
      "platform integrity",
    ],
  },
  {
    company: "Ticketmaster / Live Nation",
    type: "workday",
    host: "livenation.wd503.myworkdayjobs.com",
    tenant: "livenation",
    site: "LNExternalSite",
    provider: "Workday",
    sourceGroup: "Marketplace / Live Events / Ticketing Operations",
    queries: [
      "operations",
      "strategy operations",
      "business operations",
      "ticketing operations",
      "customer operations",
      "director operations",
    ],
  },
  {
    company: "Etsy",
    type: "workday",
    host: "etsy.wd5.myworkdayjobs.com",
    tenant: "etsy",
    site: "Etsy_Careers",
    provider: "Workday",
    sourceGroup: "Marketplace / Commerce / Trust & Safety",
    queries: [
      "operations",
      "marketplace operations",
      "trust safety",
      "customer operations",
      "director operations",
    ],
  },
  {
    company: "ServiceNow",
    type: "smartrecruiters",
    companySlug: "servicenow",
    provider: "SmartRecruiters",
    sourceGroup: "Enterprise / Customer Operations",
    queries: [
      "operations",
      "strategy operations",
      "business operations",
      "customer operations",
    ],
  },
  {
    company: "eBay",
    type: "phenom",
    baseDomain: "https://jobs.ebayinc.com",
    basePath: "/us/en",
    provider: "Phenom / official careers",
    sourceGroup: "Marketplace / Commerce / Business Operations",
    maxOffset: 40,
    queries: [
      "business operations",
      "strategy operations",
      "operations",
      "customer operations",
      "trust safety",
    ],
  },
  {
    company: "Chewy",
    type: "phenom",
    baseDomain: "https://careers.chewy.com",
    basePath: "/us/en",
    provider: "Phenom / official careers",
    sourceGroup: "Marketplace / Commerce / Fulfillment / Customer Operations",
    maxOffset: 40,
    queries: [
      "operations",
      "strategy operations",
      "business operations",
      "customer operations",
      "program management",
    ],
  },
  {
    company: "FIS",
    type: "phenom",
    baseDomain: "https://careers.fisglobal.com",
    basePath: "/us/en",
    provider: "Phenom / FIS official careers",
    sourceGroup: "Fintech / Payments / Banking Operations",
    maxOffset: 40,
    queries: [
      "operations",
      "strategy operations",
      "business operations",
      "client services",
      "customer operations",
    ],
  },
];
const CONTROLLED_ROLE_FAMILIES = [
  "Operations Control / Network Operations",
  "Strategy & Operations",
  "Business Operations",
  "Customer Experience / Support Operations",
  "Partner / Vendor Operations",
  "Marketplace / Commerce Operations",
  "Product Operations",
  "Senior General Manager / Head of Operations roles",
];
const PARSING_MODEL_VERSION = "2026-06-21-no-detail-left-behind";
const SCORING_MODEL_VERSION = "2026-06-21-source-first-calibration";
const CAREER_CANON_VERSION = "2026-06-21-profile-canon-refresh";
const PUBLIC_PROFILE_VERSION = "2026-06-21-profile-public-refresh";
const PREFERENCE_MODEL_VERSION = "2026-06-21-location-relocation-weighted";
const FINALIZER_ROLE_KIT_VERSION = "2026-07-15-claim-evidence-role-kit-v4";
export const FINAL_ROLE_KIT_QUALITY_THRESHOLD = 85;
const MIN_ROLE_KIT_DOCUMENT_CONTENT_LENGTH = 20;
const ACTIONABLE_APPROVAL_STATUSES = new Set([
  "ready_for_review",
  "needs_manual_review",
]);

const WORKFLOW_TERMINAL_STATUSES = new Set([
  "completed",
  "completed_with_failures",
  "cancelled",
  "failed_validation",
  "failed_provider",
  "failed_storage",
  "failed_cost_limit",
  "failed_error_limit",
]);
const SEARCH_ACTIVE_STATUSES = new Set(["queued", "claimed", "running"]);
const APPLICATION_PACKET_STEPS = [
  {
    action: "verify-job-source",
    provider: "gemini",
    stepOrder: 1,
    modelRole: "Gemini Scout",
    maxAttempts: 2,
  },
  {
    action: "match-job-to-canon",
    provider: "local",
    stepOrder: 2,
    modelRole: "Workflow Orchestrator",
    maxAttempts: 1,
  },
  {
    action: "score-job",
    provider: "openai",
    stepOrder: 3,
    modelRole: "OpenAI Strategist",
    maxAttempts: 2,
  },
  {
    action: "openai-writer",
    provider: "openai",
    stepOrder: 4,
    modelRole: "OpenAI Writer",
    maxAttempts: 2,
  },
  {
    action: "gemini-critique",
    provider: "gemini",
    stepOrder: 5,
    modelRole: "Gemini Critic",
    maxAttempts: 2,
  },
  {
    action: "openai-finalizer",
    provider: "openai",
    stepOrder: 6,
    modelRole: "OpenAI Finalizer",
    maxAttempts: 2,
  },
  {
    action: "gemini-final-quality-check",
    provider: "gemini",
    stepOrder: 7,
    modelRole: "Gemini Quality Auditor",
    maxAttempts: 2,
  },
] as const;
const MODEL_COST_ESTIMATES: Record<string, number> = {
  "gemini-scout": 0.18,
  "gemini-search-extract": 0.12,
  "verify-job-source": 0.08,
  "dedupe-search-results": 0,
  "match-job-to-canon": 0,
  "score-job": 0.22,
  "openai-strategist": 0.28,
  "openai-writer": 0.85,
  "gemini-critique": 0.18,
  "openai-finalizer": 0.65,
  "gemini-final-quality-check": 0.22,
  "gemini-document-quality-check": 0.1,
  "prepare-qualified-targets": 0.2,
  "prepare-top-targets": 0.2,
  "generate-ranked-recommendations": 0.2,
};
const PROVIDER_TIMEOUT_MS = 60_000;
const LONG_FORM_PROVIDER_TIMEOUT_MS = 110_000;
const SEARCH_TASK_CLAIM_TTL_SECONDS = 180;
const SOURCE_CAPTURE_TIMEOUT_MS = 15_000;
const SOURCE_CAPTURE_COMPANY_TIMEOUT_MS = 45_000;
const SOURCE_CAPTURE_MAX_PAGES = 2;
const SOURCE_CAPTURE_MAX_CANDIDATE_CARDS = 200;
const SOURCE_CAPTURE_MAX_FULL_POSTINGS_PER_COMPANY = 10;
const SOURCE_CAPTURE_MAX_SCORED_JOBS_PER_COMPANY = 5;
const SOURCE_ADAPTER_TYPES = [
  "direct_html",
  "ats_greenhouse",
  "ats_lever",
  "ats_ashby",
  "ats_workday",
  "ats_smartrecruiters",
  "ats_icims",
  "js_heavy_browser_required",
  "unknown_needs_discovery",
] as const;

export async function handleOpenAiAction(
  req: Request,
  action: string,
): Promise<Response> {
  return handleAiAction(req, action, "openai");
}

export async function handleGeminiAction(
  req: Request,
  action: string,
): Promise<Response> {
  return handleAiAction(req, action, "gemini");
}

export async function handleWorkflowAction(
  req: Request,
  action: string,
): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }
  if (req.method !== "POST") {
    return json(req, { error: "Method not allowed" }, 405);
  }

  const auth = await requireAllowedUser(req);
  if (!auth.ok) return json(req, { error: auth.error }, auth.status);

  const body = await safeJson(req);
  try {
    if (action === "workflow-status") return workflowStatus(req, auth, body);
    if (action === "cancel-workflow") return cancelWorkflow(req, auth, body);
    if (action === "retry-workflow-step") {
      return retryWorkflowStep(req, auth, body);
    }
    if (
      action === "prepare-application-packet" ||
      action === "generate-application-packet"
    ) {
      const result = await prepareApplicationPacketWorkflow(auth, body, action);
      return json(req, result);
    }
    if (action === "start-controlled-search" || action === "run-market-sweep") {
      const run = await startControlledSearchWorkflow(auth, body, action);
      return json(req, run, 202);
    }
    if (action === "search-worker") return searchWorker(req, auth, body);
    if (action === "advance-workflow") return advanceWorkflow(req, auth, body);

    return executeAiAction(
      req,
      action,
      action.includes("gemini") || action.includes("search") ||
        action.includes("verify")
        ? "gemini"
        : "openai",
      auth,
      body,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (error instanceof WorkflowStop) {
      return json(req, {
        action,
        status: error.status,
        error_code: error.code,
        error: message,
        details: error.details,
      }, 409);
    }
    return json(
      req,
      { action, error: message },
      error instanceof ValidationFailure ? 422 : 500,
    );
  }
}

async function handleAiAction(
  req: Request,
  action: string,
  provider: Provider,
): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }
  if (req.method !== "POST") {
    return json(req, { error: "Method not allowed" }, 405);
  }

  const auth = await requireAllowedUser(req);
  if (!auth.ok) return json(req, { error: auth.error }, auth.status);

  const body = await safeJson(req);
  return executeAiAction(req, action, provider, auth, body);
}

async function executeAiAction(
  req: Request,
  action: string,
  provider: Provider,
  auth: AuthContext,
  body: RequestBody,
): Promise<Response> {
  const runId = String(
    body.workflow_run_id || body.run_id || crypto.randomUUID(),
  );
  const schemaName = schemaNameForAction(action);
  const schema = schemaForAction(action);
  const modelRole = provider === "openai"
    ? openAiRole(action)
    : geminiRole(action);
  const prompt = buildPrompt(action, body, runId, schemaName);
  let ownsDirectWorkflowRun = false;
  try {
    ownsDirectWorkflowRun = await ensureDirectAiWorkflowRun(
      auth,
      runId,
      action,
      body,
    );
    await logAgentRun(
      auth.supabase,
      auth.user.id,
      runId,
      action,
      modelRole,
      provider,
      "running",
      body,
    );
    await logAgentStep(
      auth.supabase,
      auth.user.id,
      runId,
      0,
      "auth_and_prompt",
      modelRole,
      provider,
      action,
      "completed",
      "Authenticated allowed user and built schema-bound prompt.",
    );
    const result = await runStructuredProvider({
      auth,
      action,
      provider,
      prompt,
      schema,
      schemaName,
      runId,
      modelRole,
      body,
      useGrounding: shouldUseGeminiGrounding(action),
    });
    await saveGeneratedOutput(
      auth.supabase,
      auth.user.id,
      runId,
      action,
      provider,
      body,
      result.parsed,
      schemaName,
      modelRole,
      result.model,
    );
    await logAgentStep(
      auth.supabase,
      auth.user.id,
      runId,
      2,
      "save_output",
      modelRole,
      provider,
      action,
      "completed",
      "Validated output and canonical run records saved.",
      {
        repaired: result.repaired,
        search_query_count: result.searchQueryCount,
      },
    );
    await logModelUsage(auth.supabase, auth.user.id, {
      provider,
      model: result.model,
      workflow_type: action,
      action,
      run_id: runId,
      job_id: jobIdFromBody(body),
      token_usage: result.usage,
      search_query_count: result.searchQueryCount,
      latency_ms: result.latencyMs,
      provider_request_count: providerRequestCountForResult(result),
      provider_request_ids: providerRequestIdsForResult(result),
      actual_cost: actualModelCost(
        provider,
        action,
        result.usage,
        result.searchQueryCount,
        0,
      ),
      status: "completed",
    });
    await logAgentRun(
      auth.supabase,
      auth.user.id,
      runId,
      action,
      modelRole,
      provider,
      "complete",
      body,
      result.parsed,
    );
    if (ownsDirectWorkflowRun) {
      await upsertWorkflowRun(auth.supabase, auth.user.id, {
        id: runId,
        workflow_type: action,
        status: "completed",
        trigger_type: "manual",
        job_id: jobIdFromBody(body),
        current_step: `${action}:completed`,
        total_steps: 1,
        completed_at: new Date().toISOString(),
        error_code: null,
        error_message: null,
        output_record: {
          direct_ai_action: true,
          schema_name: schemaName,
          provider,
          provider_request_count: providerRequestCountForResult(result),
          validation_passed: true,
        },
      });
    }

    return json(req, {
      action,
      provider,
      schema_name: schemaName,
      run_id: runId,
      authenticated: true,
      allowed_email_match: true,
      validation: { passed: true, repaired: result.repaired },
      grounding: result.grounding,
      provider_request_count: providerRequestCountForResult(result),
      output: result.parsed,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const providerAccounting = providerAccountingFromError(error);
    const actualCost = actualModelCost(
      provider,
      action,
      providerAccounting.usage,
      providerAccounting.searchQueryCount,
      0,
    );
    const status = workflowStatusForError(error);
    await logAgentStep(
      auth.supabase,
      auth.user.id,
      runId,
      2,
      status,
      modelRole,
      provider,
      action,
      status,
      message,
      {
        validation_errors: error instanceof ValidationFailure
          ? error.validationErrors
          : [],
        provider_request_count: providerAccounting.providerRequestCount,
      },
    ).catch(console.error);
    await logAgentRun(
      auth.supabase,
      auth.user.id,
      runId,
      action,
      modelRole,
      provider,
      status,
      body,
      {
        error: message,
        validation_errors: error instanceof ValidationFailure
          ? error.validationErrors
          : [],
        provider_request_count: providerAccounting.providerRequestCount,
      },
    ).catch(console.error);
    if (providerAccounting.providerRequestCount > 0) {
      await logModelUsage(auth.supabase, auth.user.id, {
        provider,
        model: providerAccounting.model,
        workflow_type: action,
        action,
        run_id: runId,
        job_id: jobIdFromBody(body),
        token_usage: providerAccounting.usage,
        search_query_count: providerAccounting.searchQueryCount,
        latency_ms: providerAccounting.latencyMs,
        provider_request_count: providerAccounting.providerRequestCount,
        provider_request_ids: providerAccounting.providerRequestIds,
        actual_cost: actualCost,
        status,
      }).catch(console.error);
    }
    if (ownsDirectWorkflowRun) {
      await upsertWorkflowRun(auth.supabase, auth.user.id, {
        id: runId,
        workflow_type: action,
        status,
        trigger_type: "manual",
        job_id: jobIdFromBody(body),
        current_step: `${action}:${status}`,
        total_steps: 1,
        completed_at: new Date().toISOString(),
        error_code: status,
        error_message: message,
        output_record: {
          direct_ai_action: true,
          schema_name: schemaName,
          provider,
          validation_errors: error instanceof ValidationFailure
            ? error.validationErrors
            : [],
          provider_request_count: providerAccounting.providerRequestCount,
        },
      }).catch(console.error);
    }
    if (
      error instanceof ValidationFailure &&
      actionCreatesManualReviewApproval(action)
    ) {
      await saveManualReviewApproval(
        auth.supabase,
        auth.user.id,
        runId,
        action,
        jobIdFromBody(body),
        message,
        error.rawText,
        error.validationErrors,
      ).catch(console.error);
    }
    return json(req, {
      action,
      provider,
      schema_name: schemaName,
      run_id: runId,
      error: message,
      validation_errors: error instanceof ValidationFailure
        ? error.validationErrors
        : [],
    }, error instanceof ValidationFailure ? 422 : 500);
  }
}

export function directAiWorkflowRunSeed(
  runId: string,
  action: string,
  body: RequestBody,
  now = new Date().toISOString(),
): Record<string, unknown> {
  return {
    id: runId,
    workflow_type: action,
    status: "running",
    trigger_type: "manual",
    job_id: jobIdFromBody(body),
    current_step: action,
    total_steps: 1,
    started_at: now,
    input_record: {
      direct_ai_action: true,
      action,
      job_id: jobIdFromBody(body),
    },
    output_record: {},
    idempotency_key: stableId("direct-ai-action", runId, action),
  };
}

async function ensureDirectAiWorkflowRun(
  auth: AuthContext,
  runId: string,
  action: string,
  body: RequestBody,
): Promise<boolean> {
  const existing = await selectOne(
    auth.supabase,
    "jobcc_workflow_runs",
    runId,
  ) as Record<string, unknown> | null;
  if (existing) return false;
  await upsertWorkflowRun(
    auth.supabase,
    auth.user.id,
    directAiWorkflowRunSeed(runId, action, body),
  );
  return true;
}

export async function handleHealthCheck(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }
  const body = await safeJson(req);
  const access = await checkAllowedUserForHealth(req);
  if (!access.authenticated) {
    return json(req, {
      available: true,
      authenticated: false,
      allowed: false,
      allowed_email_match: false,
      timestamp: new Date().toISOString(),
    });
  }
  if (!access.allowed || !access.supabase || !access.user) {
    return json(req, {
      available: true,
      authenticated: true,
      allowed: false,
      allowed_email_match: false,
      user_email: access.user?.email || "",
      timestamp: new Date().toISOString(),
    });
  }

  const openaiConfigured = Boolean(Deno.env.get("OPENAI_API_KEY"));
  const geminiConfigured = Boolean(Deno.env.get("GEMINI_API_KEY"));
  let databaseReachable = false;
  let databaseProbeError = "";
  const { error } = await access.supabase.from("jobcc_user_settings").select(
    "id",
  ).limit(1);
  if (error) {
    databaseProbeError = `${error.code || "unknown"} ${error.message}`;
    console.warn(`health-check database probe failed: ${databaseProbeError}`);
  }
  databaseReachable = !error;
  const result = {
    authenticated: true,
    allowed: true,
    allowed_email_match: true,
    user_email: access.user.email || "",
    openai_configured: openaiConfigured,
    gemini_configured: geminiConfigured,
    database_reachable: databaseReachable,
    timestamp: new Date().toISOString(),
  };
  if (body.test_models) {
    return json(req, {
      ...result,
      model_test_skipped: true,
      note:
        "Model tests are disabled by default to avoid paid calls from health checks.",
    });
  }
  return json(req, result);
}

async function requireAllowedUser(req: Request, strict = true): Promise<
  | ({ ok: true } & AuthContext)
  | { ok: false; status: number; error: string }
> {
  const authorization = req.headers.get("Authorization") || "";
  if (!authorization) {
    return {
      ok: false,
      status: strict ? 401 : 200,
      error: "Missing Authorization header.",
    };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ||
    firstPublishableKey();
  if (!supabaseUrl || !supabaseKey) {
    return {
      ok: false,
      status: strict ? 500 : 200,
      error: "Supabase function auth is not configured.",
    };
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return {
      ok: false,
      status: strict ? 401 : 200,
      error: "Invalid or expired Supabase session.",
    };
  }

  const allowedEmail = (Deno.env.get("ALLOWED_EMAIL") || "").trim()
    .toLowerCase();
  const userEmail = (data.user.email || "").trim().toLowerCase();
  if (!allowedEmail || userEmail !== allowedEmail) {
    return {
      ok: false,
      status: strict ? 403 : 200,
      error:
        "This account is not allowed to use the job command center AI functions.",
    };
  }

  return {
    ok: true,
    user: { id: data.user.id, email: data.user.email || "" },
    supabase,
  };
}

async function checkAllowedUserForHealth(req: Request): Promise<{
  authenticated: boolean;
  allowed: boolean;
  user?: { id: string; email?: string };
  supabase?: SupabaseClient;
  error?: string;
}> {
  const authorization = req.headers.get("Authorization") || "";
  if (!authorization) {
    return {
      authenticated: false,
      allowed: false,
      error: "Missing Authorization header.",
    };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ||
    firstPublishableKey();
  if (!supabaseUrl || !supabaseKey) {
    return {
      authenticated: false,
      allowed: false,
      error: "Supabase function auth is not configured.",
    };
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return {
      authenticated: false,
      allowed: false,
      error: "Invalid or expired Supabase session.",
    };
  }

  const allowedEmail = (Deno.env.get("ALLOWED_EMAIL") || "").trim()
    .toLowerCase();
  const userEmail = (data.user.email || "").trim().toLowerCase();
  const allowed = Boolean(allowedEmail && userEmail === allowedEmail);
  return {
    authenticated: true,
    allowed,
    user: { id: data.user.id, email: data.user.email || "" },
    supabase: allowed ? supabase : undefined,
  };
}

function firstPublishableKey(): string {
  const raw = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "";
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    const first = Object.values(parsed).find((value) =>
      typeof value === "string"
    );
    return typeof first === "string" ? first : "";
  } catch {
    return "";
  }
}

export function aggregateProviderUsage(
  ...records: Array<Record<string, unknown>>
): Record<string, unknown> {
  const combined: Record<string, unknown> = {};
  for (const record of records) {
    for (const [key, value] of Object.entries(record || {})) {
      if (typeof value === "number" && Number.isFinite(value)) {
        combined[key] = Number(combined[key] || 0) + value;
        continue;
      }
      if (
        value && typeof value === "object" && !Array.isArray(value)
      ) {
        const prior = combined[key] && typeof combined[key] === "object" &&
            !Array.isArray(combined[key])
          ? combined[key] as Record<string, unknown>
          : {};
        combined[key] = aggregateProviderUsage(
          prior,
          value as Record<string, unknown>,
        );
        continue;
      }
      if (combined[key] === undefined) combined[key] = value;
    }
  }
  return combined;
}

function providerRequestCountForResult(result: ProviderResult): number {
  if (result.deterministicReplay) return 0;
  return Math.max(1, Number(result.providerRequestCount || 1));
}

function providerRequestIdsForResult(result: ProviderResult): string[] {
  return uniqueStrings([
    ...arrayFromUnknown(result.providerRequestIds),
    result.providerRequestId,
  ]);
}

function providerRequestEvidenceCountForStep(
  step: Record<string, unknown>,
): number {
  const record = step.record && typeof step.record === "object" &&
      !Array.isArray(step.record)
    ? step.record as Record<string, unknown>
    : {};
  const explicit = Number(record.provider_request_count || 0);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  const requestIds = uniqueStrings([
    ...arrayFromUnknown(record.provider_request_ids),
    record.provider_request_id,
    step.provider_request_id,
  ]);
  if (requestIds.length) return requestIds.length;
  return record.provider_completed === true ? 1 : 0;
}

export function providerRequestsRecordedForStep(
  step: Record<string, unknown>,
  currentClaimStepId = "",
): number {
  const explicit = providerRequestEvidenceCountForStep(step);
  if (explicit > 0) return explicit;
  if (currentClaimStepId && String(step.id || "") === currentClaimStepId) {
    return 0;
  }
  const status = String(step.status || "");
  if (["queued", "cancelled", "waiting_for_user"].includes(status)) return 0;
  return step.started_at ||
      ["running", "provider_completed", "completed"].includes(status)
    ? 1
    : 0;
}

export function canReplayDeferredFinalQualityStep(
  step: Record<string, unknown>,
  validatedArtifactAvailable: boolean,
): boolean {
  if (!validatedArtifactAvailable) return false;
  if (String(step.step_type || "") !== "gemini-final-quality-check") {
    return false;
  }
  const status = String(step.status || "");
  const record = step.record && typeof step.record === "object" &&
      !Array.isArray(step.record)
    ? step.record as Record<string, unknown>
    : {};
  return status === "provider_completed" ||
    (["failed_storage", "failed_provider"].includes(status) &&
      Boolean(record.provider_completed));
}

export function savedValidationRepairRetryWindow(
  step: Record<string, unknown>,
  validatedArtifactAvailable: boolean,
  attemptCount: number,
  maxAttempts: number,
): RetryWindowDecision | null {
  if (!validatedArtifactAvailable) return null;
  if (String(step.status || "") !== "failed_validation") return null;
  if (
    !["openai", "gemini"].includes(
      String(step.provider || "").toLowerCase(),
    )
  ) return null;
  if (providerRequestEvidenceCountForStep(step) < 1) return null;
  const record = step.record && typeof step.record === "object" &&
      !Array.isArray(step.record)
    ? step.record as Record<string, unknown>
    : {};
  if (String(record.validation_repair_source_artifact_id || "")) return null;
  return {
    allowed: true,
    maxAttempts: Math.max(maxAttempts, attemptCount + 1),
    message:
      "The saved invalid provider artifact will be repaired directly; the full generation call will not be repeated.",
    providerOutcome: "known_invalid_response",
    manualReconciliationRequired: false,
  };
}

function providerAccountingFromError(error: unknown): {
  providerRequestIds: string[];
  providerRequestCount: number;
  usage: Record<string, unknown>;
  searchQueryCount: number;
  latencyMs: number;
  model: string;
} {
  if (error instanceof ValidationFailure) {
    return {
      providerRequestIds: error.providerRequestIds,
      providerRequestCount: error.providerRequestCount,
      usage: error.usage,
      searchQueryCount: error.searchQueryCount,
      latencyMs: error.latencyMs,
      model: error.model,
    };
  }
  if (error instanceof ProviderRequestFailure) {
    return {
      providerRequestIds: [],
      providerRequestCount: error.attempts.length,
      usage: {},
      searchQueryCount: 0,
      latencyMs: 0,
      model: error.model,
    };
  }
  const details = error instanceof WorkflowStop ? error.details : {};
  const genericMessage = error instanceof Error ? error.message : String(error);
  const inferredGenericCount = error instanceof WorkflowStop ||
      /not configured/i.test(genericMessage)
    ? 0
    : 1;
  return {
    providerRequestIds: arrayFromUnknown(details.provider_request_ids),
    providerRequestCount: Math.max(
      0,
      Number(details.provider_request_count || inferredGenericCount),
    ),
    usage: details.usage && typeof details.usage === "object" &&
        !Array.isArray(details.usage)
      ? details.usage as Record<string, unknown>
      : {},
    searchQueryCount: Math.max(
      0,
      Number(details.search_query_count || 0),
    ),
    latencyMs: Math.max(0, Number(details.latency_ms || 0)),
    model: String(details.model || ""),
  };
}

async function runStructuredProvider(args: {
  auth: AuthContext;
  action: string;
  provider: Provider;
  prompt: string;
  schema: JsonSchema;
  schemaName: string;
  runId: string;
  agentRunId?: string;
  modelRole: string;
  body: RequestBody;
  useGrounding: boolean;
  maxProviderRequests?: number;
  finalQualityAuditContext?: FinalQualityAuditContext;
}): Promise<ProviderResult> {
  const first = args.provider === "openai"
    ? await callOpenAiStructured(
      args.prompt,
      args.schemaName,
      args.schema,
      args.action,
    )
    : await callGeminiStructured(
      args.prompt,
      args.schemaName,
      args.schema,
      args.useGrounding,
      args.maxProviderRequests,
    );
  const firstValidation = validateProviderResult(first, args.schema, {
    schemaName: args.schemaName,
    useGrounding: args.useGrounding,
    integrityContext: args.body,
    finalQualityAuditContext: args.finalQualityAuditContext,
  });
  if (!firstValidation.errors.length) {
    return {
      ...first,
      parsed: firstValidation.parsed,
      providerRequestIds: providerRequestIdsForResult(first),
      providerRequestCount: providerRequestCountForResult(first),
      repaired: false,
      validationErrors: [],
    };
  }

  const agentRunId = args.agentRunId || args.runId;
  await logAgentStep(
    args.auth.supabase,
    args.auth.user.id,
    agentRunId,
    1,
    "validate_output",
    args.modelRole,
    args.provider,
    args.action,
    "failed_validation",
    "Initial model output failed schema validation.",
    {
      validation_errors: firstValidation.errors,
      raw_output_excerpt: first.text.slice(0, 2000),
    },
  );
  await saveWorkflowArtifact(args.auth.supabase, args.auth.user.id, {
    id: stableId(
      "artifact",
      args.runId,
      args.action,
      "raw-invalid",
      "attempt-1",
    ),
    run_id: args.runId,
    step_id: `${args.runId}-step-1`,
    artifact_type: "raw_model_output",
    schema_name: args.schemaName,
    schema_version: "job-command-center-v2",
    job_id: jobIdFromBody(args.body),
    status: "failed_validation",
    record: {
      validation_errors: firstValidation.errors,
      provider: args.provider,
      action: args.action,
    },
    raw_output: first.text,
  });

  const repairPrompt = buildRepairPrompt(
    args.prompt,
    args.schemaName,
    args.schema,
    first.text,
    firstValidation.errors,
  );
  const firstRequestCount = providerRequestCountForResult(first);
  const remainingProviderRequests = Number.isFinite(
      Number(args.maxProviderRequests),
    )
    ? Math.max(0, Number(args.maxProviderRequests) - firstRequestCount)
    : undefined;
  if (remainingProviderRequests === 0) {
    throw new ValidationFailure(
      "Model output failed schema validation and the provider-call limit prevented a repair request.",
      first.text,
      firstValidation.errors,
      {
        providerRequestIds: providerRequestIdsForResult(first),
        providerRequestCount: firstRequestCount,
        usage: first.usage,
        searchQueryCount: first.searchQueryCount,
        latencyMs: first.latencyMs,
        model: first.model,
      },
    );
  }
  const repaired = args.provider === "openai"
    ? await callOpenAiStructured(
      repairPrompt,
      args.schemaName,
      args.schema,
      args.action,
    )
    : await callGeminiStructured(
      repairPrompt,
      args.schemaName,
      args.schema,
      false,
      remainingProviderRequests,
    );
  const repairedValidation = validateProviderResult(repaired, args.schema, {
    schemaName: args.schemaName,
    useGrounding: args.useGrounding,
    integrityContext: args.body,
    finalQualityAuditContext: args.finalQualityAuditContext,
  });
  if (!repairedValidation.errors.length) {
    await logAgentStep(
      args.auth.supabase,
      args.auth.user.id,
      agentRunId,
      1,
      "validate_output",
      args.modelRole,
      args.provider,
      args.action,
      "retrying",
      "Schema repair retry succeeded.",
      {
        initial_errors: firstValidation.errors,
      },
    );
    return {
      ...repaired,
      parsed: repairedValidation.parsed,
      grounding: args.useGrounding ? first.grounding : repaired.grounding,
      usage: aggregateProviderUsage(first.usage, repaired.usage),
      searchQueryCount: first.searchQueryCount + repaired.searchQueryCount,
      latencyMs: first.latencyMs + repaired.latencyMs,
      providerRequestIds: uniqueStrings([
        ...providerRequestIdsForResult(first),
        ...providerRequestIdsForResult(repaired),
      ]),
      providerRequestCount: firstRequestCount +
        providerRequestCountForResult(repaired),
      repaired: true,
      validationErrors: firstValidation.errors,
    };
  }

  await saveWorkflowArtifact(args.auth.supabase, args.auth.user.id, {
    id: stableId(
      "artifact",
      args.runId,
      args.action,
      "raw-invalid",
      "attempt-2",
    ),
    run_id: args.runId,
    step_id: `${args.runId}-step-1`,
    artifact_type: "raw_model_output",
    schema_name: args.schemaName,
    schema_version: "job-command-center-v2",
    job_id: jobIdFromBody(args.body),
    status: "failed_validation",
    record: {
      validation_errors: repairedValidation.errors,
      provider: args.provider,
      action: args.action,
      repair_attempt: true,
    },
    raw_output: repaired.text,
  });
  throw new ValidationFailure(
    "Model output failed schema validation after one repair retry.",
    repaired.text,
    repairedValidation.errors,
    {
      providerRequestIds: uniqueStrings([
        ...providerRequestIdsForResult(first),
        ...providerRequestIdsForResult(repaired),
      ]),
      providerRequestCount: firstRequestCount +
        providerRequestCountForResult(repaired),
      usage: aggregateProviderUsage(first.usage, repaired.usage),
      searchQueryCount: first.searchQueryCount + repaired.searchQueryCount,
      latencyMs: first.latencyMs + repaired.latencyMs,
      model: repaired.model,
    },
  );
}

async function runStructuredProviderRepair(args: {
  auth: AuthContext;
  action: string;
  provider: Provider;
  prompt: string;
  schema: JsonSchema;
  schemaName: string;
  runId: string;
  agentRunId?: string;
  modelRole: string;
  body: RequestBody;
  useGrounding: boolean;
  maxProviderRequests?: number;
  finalQualityAuditContext?: FinalQualityAuditContext;
  repairCandidate: ValidationRepairCandidate;
  repairAttempt: number;
}): Promise<ProviderResult> {
  if (
    Number.isFinite(Number(args.maxProviderRequests)) &&
    Number(args.maxProviderRequests) < 1
  ) {
    throw new WorkflowStop(
      "waiting_for_user",
      "call_limit",
      `Stopped before ${args.action} validation repair; call limit reached.`,
      { action: args.action, validation_repair: true },
    );
  }
  const repairPrompt = buildRepairPrompt(
    args.prompt,
    args.schemaName,
    args.schema,
    args.repairCandidate.rawText,
    args.repairCandidate.validationErrors,
  );
  const repaired = args.provider === "openai"
    ? await callOpenAiStructured(
      repairPrompt,
      args.schemaName,
      args.schema,
      args.action,
    )
    : await callGeminiStructured(
      repairPrompt,
      args.schemaName,
      args.schema,
      false,
      1,
    );
  const repairedValidation = validateProviderResult(repaired, args.schema, {
    schemaName: args.schemaName,
    useGrounding: args.useGrounding,
    integrityContext: args.body,
    finalQualityAuditContext: args.finalQualityAuditContext,
  });
  const providerRequestIds = providerRequestIdsForResult(repaired);
  const providerRequestCount = providerRequestCountForResult(repaired);
  if (!repairedValidation.errors.length) {
    await logAgentStep(
      args.auth.supabase,
      args.auth.user.id,
      args.agentRunId || args.runId,
      1,
      "validate_output",
      args.modelRole,
      args.provider,
      args.action,
      "retrying",
      "Saved invalid output was repaired without repeating generation.",
      {
        source_artifact_id: args.repairCandidate.artifactId,
        initial_errors: args.repairCandidate.validationErrors,
      },
    );
    return {
      ...repaired,
      parsed: repairedValidation.parsed,
      providerRequestIds,
      providerRequestCount,
      repaired: true,
      validationErrors: args.repairCandidate.validationErrors,
    };
  }
  await saveWorkflowArtifact(args.auth.supabase, args.auth.user.id, {
    id: stableId(
      "artifact",
      args.runId,
      args.action,
      "raw-invalid",
      `durable-repair-${args.repairAttempt}`,
    ),
    run_id: args.runId,
    step_id: `${args.runId}-step-${args.repairAttempt}`,
    artifact_type: "raw_model_output",
    schema_name: args.schemaName,
    schema_version: "job-command-center-v2",
    job_id: jobIdFromBody(args.body),
    status: "failed_validation",
    record: {
      validation_errors: repairedValidation.errors,
      provider: args.provider,
      action: args.action,
      repair_attempt: true,
      repair_source_artifact_id: args.repairCandidate.artifactId,
    },
    raw_output: repaired.text,
  });
  throw new ValidationFailure(
    "Saved model output still failed validation after one bounded repair call.",
    repaired.text,
    repairedValidation.errors,
    {
      providerRequestIds,
      providerRequestCount,
      usage: repaired.usage,
      searchQueryCount: repaired.searchQueryCount,
      latencyMs: repaired.latencyMs,
      model: repaired.model,
    },
  );
}

export function normalizeFinalizedPacketEvidence(
  output: Record<string, unknown>,
): Record<string, unknown> {
  const documentEvidence = output.document_evidence;
  if (
    !documentEvidence || typeof documentEvidence !== "object" ||
    Array.isArray(documentEvidence)
  ) {
    return output;
  }

  const evidenceByType = documentEvidence as Record<string, unknown>;
  const normalizedEvidenceByType: Record<string, unknown> = {};
  const aggregate = {
    matched_fact_ids: [] as string[],
    claims_used: [] as string[],
    unresolved_issues: [] as string[],
    unsupported_claims: [] as string[],
    prohibited_fact_matches: [] as string[],
    needs_review_fact_matches: [] as string[],
  };
  for (const documentType of FINALIZED_PACKET_DOCUMENT_TYPES) {
    const evidence = evidenceByType[documentType];
    if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) {
      continue;
    }
    const record = normalizeFinalizedPacketDocumentEvidenceRecord(
      evidence as Record<string, unknown>,
    );
    normalizedEvidenceByType[documentType] = record;
    aggregate.matched_fact_ids.push(
      ...arrayFromUnknown(record.matched_fact_ids),
    );
    aggregate.claims_used.push(...arrayFromUnknown(record.claims_used));
    aggregate.unresolved_issues.push(
      ...arrayFromUnknown(record.unresolved_issues),
    );
    aggregate.unsupported_claims.push(
      ...arrayFromUnknown(record.unsupported_claims),
    );
    aggregate.prohibited_fact_matches.push(
      ...arrayFromUnknown(record.prohibited_fact_matches),
    );
    aggregate.needs_review_fact_matches.push(
      ...arrayFromUnknown(record.needs_review_fact_matches),
    );
  }

  return {
    ...output,
    document_evidence: normalizedEvidenceByType,
    matched_fact_ids: uniqueStrings(aggregate.matched_fact_ids),
    claims_used: uniqueStrings(aggregate.claims_used),
    unresolved_issues: uniqueStrings(aggregate.unresolved_issues),
    unsupported_claims: uniqueStrings(aggregate.unsupported_claims),
    prohibited_fact_matches: uniqueStrings(
      aggregate.prohibited_fact_matches,
    ),
    needs_review_fact_matches: uniqueStrings(
      aggregate.needs_review_fact_matches,
    ),
  };
}

function normalizeFinalizedPacketDocumentEvidenceRecord(
  record: Record<string, unknown>,
): FinalizedPacketDocumentEvidence {
  const claimEvidence = finalizedPacketClaimEvidence(record.claim_evidence);
  return {
    claim_evidence: claimEvidence,
    matched_fact_ids: uniqueStrings(
      claimEvidence.flatMap((claim) => claim.matched_fact_ids),
    ),
    claims_used: uniqueStrings(
      claimEvidence.map((claim) => claim.claim_text),
    ),
    unresolved_issues: uniqueStrings(
      arrayFromUnknown(record.unresolved_issues),
    ),
    unsupported_claims: uniqueStrings(
      claimEvidence.filter((claim) => claim.support_status === "unsupported")
        .map((claim) => claim.claim_text),
    ),
    prohibited_fact_matches: uniqueStrings(
      claimEvidence.filter((claim) => claim.support_status === "prohibited")
        .map((claim) => claim.claim_text),
    ),
    needs_review_fact_matches: uniqueStrings(
      claimEvidence.filter((claim) => claim.support_status === "needs_review")
        .map((claim) => claim.claim_text),
    ),
  };
}

function finalizedPacketClaimEvidence(
  value: unknown,
): FinalizedPacketClaimEvidence[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const record = item as Record<string, unknown>;
    const supportStatus = String(record.support_status || "");
    if (
      !["supported", "unsupported", "prohibited", "needs_review"].includes(
        supportStatus,
      )
    ) return [];
    return [{
      claim_text: String(record.claim_text || "").trim(),
      support_status: supportStatus as FinalizedPacketClaimEvidence[
        "support_status"
      ],
      matched_fact_ids: uniqueStrings(
        arrayFromUnknown(record.matched_fact_ids),
      ),
      source_document_ids: uniqueStrings(
        arrayFromUnknown(record.source_document_ids),
      ),
    }];
  });
}

function likelyFactualClaimUnits(content: string): string[] {
  const factualSignal = new RegExp(
    [
      String.raw`(?:[$€£]\s*\d)`,
      String.raw`(?:\b(?:19|20)\d{2}\b)`,
      String
        .raw`(?:\b\d+(?:[.,]\d+)?\s*(?:%|k|m|b|million|billion|thousand|years?|months?|employees?|people|teams?|locations?|states?|countries?|customers?|clients?|users?|partners?|vendors?|contracts?|agreements?|sites?|markets?|revenue|sales|budget|p&l)\b)`,
      String
        .raw`(?:\b(?:i\s+)?(?:co-founded|founded|built|led|managed|scaled|grew|created|launched|owned|ran|operated|directed|transformed|delivered|increased|reduced|drove|oversaw|established|designed|implemented|negotiated|developed|executed|expanded|achieved|served|worked|spent)\b)`,
      String
        .raw`(?:\b(?:former|current|previously)\s+(?:chief|ceo|coo|president|vice president|vp|director|head|general manager|founder)\b)`,
    ].join("|"),
    "i",
  );
  return uniqueStrings(
    String(content || "")
      .replace(/\r/g, "\n")
      .split(/\n+|(?<=[.!;])\s+(?=[A-Z0-9$])/)
      .map((unit) => unit.replace(/^\s*[-*•]\s*/, "").trim())
      .filter((unit) => unit.length >= 12 && !unit.endsWith("?"))
      .filter((unit) => factualSignal.test(unit)),
  );
}

const JOB_SOURCE_STOPWORDS = new Set([
  "about",
  "and",
  "because",
  "candidate",
  "company",
  "combines",
  "for",
  "from",
  "into",
  "job",
  "mandate",
  "opportunity",
  "position",
  "role",
  "stands",
  "that",
  "the",
  "their",
  "this",
  "with",
]);

function collectJobEvidenceStrings(
  value: unknown,
  output: string[] = [],
  depth = 0,
): string[] {
  if (depth > 5 || output.join(" ").length >= 160_000) return output;
  if (typeof value === "string") {
    const text = value.trim();
    if (text) output.push(text);
    return output;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      collectJobEvidenceStrings(item, output, depth + 1);
    }
    return output;
  }
  if (!value || typeof value !== "object") return output;
  for (const item of Object.values(value as Record<string, unknown>)) {
    collectJobEvidenceStrings(item, output, depth + 1);
  }
  return output;
}

function significantJobEvidenceTokens(value: string): string[] {
  return uniqueStrings(
    normalizeTokens(value).filter((token) =>
      token.length >= 4 && !JOB_SOURCE_STOPWORDS.has(token)
    ),
  );
}

function likelyVerifiedJobSourceStatement(
  unit: string,
  job: Record<string, unknown> | undefined,
): boolean {
  if (!job || !Object.keys(job).length) return false;
  if (
    !/\b(?:role|position|job|posting|mandate|responsibilit(?:y|ies)|scope|waymo|global operations control)\b/i
      .test(unit)
  ) return false;
  if (
    /\b(?:i|matthew|grossman)\s+(?:have\s+|had\s+|was\s+|am\s+|personally\s+)?(?:co-founded|founded|built|led|managed|scaled|grew|created|launched|owned|ran|operated|directed|transformed|delivered|increased|reduced|drove|oversaw|established|designed|implemented|negotiated|developed|executed|expanded|achieved|served|worked|spent)\b/i
      .test(unit) ||
    /\bmy\s+(?:background|career|company|experience|history|record|team|work)\b/i
      .test(unit)
  ) return false;

  const unitTokens = significantJobEvidenceTokens(unit);
  if (unitTokens.length < 3) return false;
  const jobTokens = new Set(
    significantJobEvidenceTokens(collectJobEvidenceStrings(job).join(" ")),
  );
  const overlap = unitTokens.filter((token) => jobTokens.has(token)).length;
  return overlap >= 3 && overlap / unitTokens.length >= 0.45;
}

function unmappedLikelyFactualClaims(
  content: string,
  claimEvidence: FinalizedPacketClaimEvidence[],
  job?: Record<string, unknown>,
): string[] {
  const mappedClaims = claimEvidence
    .map((claim) => normalizeEvidenceText(claim.claim_text))
    .filter((claim) => claim.length >= 8);
  return likelyFactualClaimUnits(content).filter((unit) => {
    const normalizedUnit = normalizeEvidenceText(unit);
    const mapped = mappedClaims.some((claim) =>
      normalizedUnit.includes(claim) || claim.includes(normalizedUnit)
    );
    return !mapped && !likelyVerifiedJobSourceStatement(unit, job);
  });
}

export function validateFinalizedRoleKitIntegrity(
  output: Record<string, unknown>,
  context: FinalizedRoleKitIntegrityContext = {},
): string[] {
  const errors: string[] = [];
  const approvedFacts = approvedCareerFactsById(context.careerFacts || []);
  const knownSourceDocumentIds = new Set<string>();
  for (const sourceDocument of context.sourceDocuments || []) {
    const sourceDocumentId = String(
      sourceDocument.id || sourceDocument.source_document_id || "",
    ).trim();
    if (sourceDocumentId) knownSourceDocumentIds.add(sourceDocumentId);
  }
  for (const fact of approvedFacts.values()) {
    for (const sourceDocumentId of arrayFromUnknown(fact.source_document_ids)) {
      knownSourceDocumentIds.add(sourceDocumentId);
    }
  }

  const evidenceByType = output.document_evidence;
  const evidenceRecord = evidenceByType && typeof evidenceByType === "object" &&
      !Array.isArray(evidenceByType)
    ? evidenceByType as Record<string, unknown>
    : {};
  const aggregate = {
    matched_fact_ids: [] as string[],
    claims_used: [] as string[],
    unresolved_issues: [] as string[],
    unsupported_claims: [] as string[],
    prohibited_fact_matches: [] as string[],
    needs_review_fact_matches: [] as string[],
  };
  const evidenceFingerprints: string[] = [];

  for (const documentType of FINALIZED_PACKET_DOCUMENT_TYPES) {
    const content = roleKitDocumentContent(output[documentType]);
    if (!isMeaningfulRoleKitDocumentContent(content)) {
      errors.push(
        `$.${documentType} must contain at least ${MIN_ROLE_KIT_DOCUMENT_CONTENT_LENGTH} meaningful characters`,
      );
    }
    const rawEvidence = evidenceRecord[documentType];
    if (
      !rawEvidence || typeof rawEvidence !== "object" ||
      Array.isArray(rawEvidence)
    ) {
      errors.push(`$.document_evidence.${documentType} is required`);
      continue;
    }
    const rawRecord = rawEvidence as Record<string, unknown>;
    if (!Array.isArray(rawRecord.claim_evidence)) {
      errors.push(
        `$.document_evidence.${documentType}.claim_evidence must be an array`,
      );
      continue;
    }
    const claimEvidence = finalizedPacketClaimEvidence(
      rawRecord.claim_evidence,
    );
    const duplicateClaims = duplicateNormalizedClaims(claimEvidence);
    for (const claim of duplicateClaims) {
      errors.push(
        `$.document_evidence.${documentType}.claim_evidence duplicates claim: ${claim}`,
      );
    }
    const normalizedContent = normalizeEvidenceText(content);
    for (const claim of claimEvidence) {
      const claimPath = `$.document_evidence.${documentType}.claim_evidence`;
      if (
        !claim.claim_text ||
        !normalizedContent.includes(normalizeEvidenceText(claim.claim_text))
      ) {
        errors.push(
          `${claimPath} claim_text must be verbatim document-local text: ${claim.claim_text}`,
        );
      }
      if (
        claim.support_status === "supported" &&
        claim.matched_fact_ids.length === 0
      ) {
        errors.push(
          `${claimPath} supported claim requires at least one approved Career Canon fact ID: ${claim.claim_text}`,
        );
      }
      if (
        claim.support_status === "supported" &&
        claim.source_document_ids.length === 0
      ) {
        errors.push(
          `${claimPath} supported claim requires at least one source document ID: ${claim.claim_text}`,
        );
      }
      const matchedFacts = claim.matched_fact_ids.map((factId) =>
        approvedFacts.get(factId)
      );
      claim.matched_fact_ids.forEach((factId, index) => {
        if (!matchedFacts[index]) {
          errors.push(
            `${claimPath} references unapproved or unknown Career Canon fact ID ${factId}: ${claim.claim_text}`,
          );
        }
      });
      for (const sourceDocumentId of claim.source_document_ids) {
        if (!knownSourceDocumentIds.has(sourceDocumentId)) {
          errors.push(
            `${claimPath} references unknown source document ID ${sourceDocumentId}: ${claim.claim_text}`,
          );
        }
      }
      const linkedSourceDocumentIds = new Set(
        matchedFacts.flatMap((fact) =>
          fact ? arrayFromUnknown(fact.source_document_ids) : []
        ),
      );
      if (
        linkedSourceDocumentIds.size > 0 &&
        !claim.source_document_ids.some((sourceDocumentId) =>
          linkedSourceDocumentIds.has(sourceDocumentId)
        )
      ) {
        errors.push(
          `${claimPath} must cite a source document linked to its matched Canon facts: ${claim.claim_text}`,
        );
      }
      for (const sourceDocumentId of claim.source_document_ids) {
        if (
          linkedSourceDocumentIds.size > 0 &&
          !linkedSourceDocumentIds.has(sourceDocumentId)
        ) {
          errors.push(
            `${claimPath} source document ${sourceDocumentId} is not linked to its matched Canon facts: ${claim.claim_text}`,
          );
        }
      }
    }
    for (
      const unmappedClaim of unmappedLikelyFactualClaims(
        content,
        claimEvidence,
        context.job,
      )
    ) {
      errors.push(
        `$.document_evidence.${documentType}.claim_evidence omits likely factual document text: ${unmappedClaim}`,
      );
    }

    const normalizedEvidence = normalizeFinalizedPacketDocumentEvidenceRecord(
      rawRecord,
    );
    for (
      const key of [
        "matched_fact_ids",
        "claims_used",
        "unsupported_claims",
        "prohibited_fact_matches",
        "needs_review_fact_matches",
      ] as const
    ) {
      if (
        !sameStringSet(
          arrayFromUnknown(rawRecord[key]),
          normalizedEvidence[key],
        )
      ) {
        errors.push(
          `$.document_evidence.${documentType}.${key} must equal the document-local claim_evidence union`,
        );
      }
    }
    aggregate.matched_fact_ids.push(...normalizedEvidence.matched_fact_ids);
    aggregate.claims_used.push(...normalizedEvidence.claims_used);
    aggregate.unresolved_issues.push(...normalizedEvidence.unresolved_issues);
    aggregate.unsupported_claims.push(...normalizedEvidence.unsupported_claims);
    aggregate.prohibited_fact_matches.push(
      ...normalizedEvidence.prohibited_fact_matches,
    );
    aggregate.needs_review_fact_matches.push(
      ...normalizedEvidence.needs_review_fact_matches,
    );
    evidenceFingerprints.push(
      JSON.stringify(normalizedEvidence.claim_evidence),
    );
  }

  if (
    evidenceFingerprints.length === FINALIZED_PACKET_DOCUMENT_TYPES.length &&
    evidenceFingerprints[0] !== "[]" &&
    evidenceFingerprints.every((fingerprint) =>
      fingerprint === evidenceFingerprints[0]
    )
  ) {
    errors.push(
      "$.document_evidence contains packet-wide copied claim_evidence across all nine documents",
    );
  }

  for (
    const key of [
      "matched_fact_ids",
      "claims_used",
      "unresolved_issues",
      "unsupported_claims",
      "prohibited_fact_matches",
      "needs_review_fact_matches",
    ] as const
  ) {
    if (!sameStringSet(arrayFromUnknown(output[key]), aggregate[key])) {
      errors.push(`$.${key} must equal the union of per-document evidence`);
    }
  }
  return uniqueStrings(errors);
}

export function validateDocumentRevisionIntegrity(
  output: Record<string, unknown>,
  context: FinalizedRoleKitIntegrityContext = {},
): string[] {
  const errors: string[] = [];
  const rawClaimEvidence = output.claim_evidence;
  if (!Array.isArray(rawClaimEvidence)) {
    return ["$.claim_evidence must be an array"];
  }

  const claimEvidence = finalizedPacketClaimEvidence(rawClaimEvidence);
  const revisedContent = String(output.revised_content || "").trim();
  const normalizedContent = normalizeEvidenceText(revisedContent);
  const approvedFacts = approvedCareerFactsById(context.careerFacts || []);
  const knownSourceDocumentIds = new Set<string>();
  for (const sourceDocument of context.sourceDocuments || []) {
    const sourceDocumentId = String(
      sourceDocument.id || sourceDocument.source_document_id || "",
    ).trim();
    if (sourceDocumentId) knownSourceDocumentIds.add(sourceDocumentId);
  }
  for (const fact of approvedFacts.values()) {
    for (const sourceDocumentId of arrayFromUnknown(fact.source_document_ids)) {
      knownSourceDocumentIds.add(sourceDocumentId);
    }
  }

  if (output.claim_evidence_complete !== true) {
    errors.push("$.claim_evidence_complete must be true");
  }
  if (Number(output.factual_claim_count) !== claimEvidence.length) {
    errors.push(
      "$.factual_claim_count must equal the number of claim_evidence items",
    );
  }
  for (const claim of duplicateNormalizedClaims(claimEvidence)) {
    errors.push(`$.claim_evidence duplicates claim: ${claim}`);
  }

  for (const claim of claimEvidence) {
    if (
      !claim.claim_text ||
      !normalizedContent.includes(normalizeEvidenceText(claim.claim_text))
    ) {
      errors.push(
        `$.claim_evidence claim_text must be verbatim revised_content text: ${claim.claim_text}`,
      );
    }
    if (
      claim.support_status === "supported" &&
      claim.matched_fact_ids.length === 0
    ) {
      errors.push(
        `$.claim_evidence supported claim requires at least one approved Career Canon fact ID: ${claim.claim_text}`,
      );
    }
    if (
      claim.support_status === "supported" &&
      claim.source_document_ids.length === 0
    ) {
      errors.push(
        `$.claim_evidence supported claim requires at least one source document ID: ${claim.claim_text}`,
      );
    }

    const matchedFacts = claim.matched_fact_ids.map((factId) =>
      approvedFacts.get(factId)
    );
    claim.matched_fact_ids.forEach((factId, index) => {
      if (!matchedFacts[index]) {
        errors.push(
          `$.claim_evidence references unapproved or unknown Career Canon fact ID ${factId}: ${claim.claim_text}`,
        );
      }
    });
    for (const sourceDocumentId of claim.source_document_ids) {
      if (!knownSourceDocumentIds.has(sourceDocumentId)) {
        errors.push(
          `$.claim_evidence references unknown source document ID ${sourceDocumentId}: ${claim.claim_text}`,
        );
      }
    }
    const linkedSourceDocumentIds = new Set(
      matchedFacts.flatMap((fact) =>
        fact ? arrayFromUnknown(fact.source_document_ids) : []
      ),
    );
    if (
      linkedSourceDocumentIds.size > 0 &&
      !claim.source_document_ids.some((sourceDocumentId) =>
        linkedSourceDocumentIds.has(sourceDocumentId)
      )
    ) {
      errors.push(
        `$.claim_evidence must cite a source document linked to its matched Canon facts: ${claim.claim_text}`,
      );
    }
    for (const sourceDocumentId of claim.source_document_ids) {
      if (
        linkedSourceDocumentIds.size > 0 &&
        !linkedSourceDocumentIds.has(sourceDocumentId)
      ) {
        errors.push(
          `$.claim_evidence source document ${sourceDocumentId} is not linked to its matched Canon facts: ${claim.claim_text}`,
        );
      }
    }
  }
  for (
    const unmappedClaim of unmappedLikelyFactualClaims(
      revisedContent,
      claimEvidence,
      context.job,
    )
  ) {
    errors.push(
      `$.claim_evidence omits likely factual revised_content text: ${unmappedClaim}`,
    );
  }

  const matchedFactIds = uniqueStrings(
    claimEvidence.flatMap((claim) => claim.matched_fact_ids),
  );
  const unsupportedClaims = uniqueStrings(
    claimEvidence
      .filter((claim) => claim.support_status === "unsupported")
      .map((claim) => claim.claim_text),
  );
  const prohibitedFactMatches = uniqueStrings(
    claimEvidence
      .filter((claim) => claim.support_status === "prohibited")
      .map((claim) => claim.claim_text),
  );
  const needsReviewFactMatches = uniqueStrings(
    claimEvidence
      .filter((claim) => claim.support_status === "needs_review")
      .map((claim) => claim.claim_text),
  );
  for (
    const [key, expected] of [
      ["matched_fact_ids", matchedFactIds],
      ["unsupported_claims", unsupportedClaims],
      ["prohibited_fact_matches", prohibitedFactMatches],
      ["needs_review_fact_matches", needsReviewFactMatches],
    ] as const
  ) {
    if (!sameStringSet(arrayFromUnknown(output[key]), expected)) {
      errors.push(`$.${key} must equal the claim_evidence union`);
    }
  }
  if (
    claimEvidence.some((claim) => claim.support_status !== "supported") &&
    output.approval_status !== "needs_manual_review"
  ) {
    errors.push(
      "$.approval_status must be needs_manual_review while claim_evidence contains blocked claims",
    );
  }
  return uniqueStrings(errors);
}

function approvedCareerFactsById(
  careerFacts: Array<Record<string, unknown>>,
): Map<string, Record<string, unknown>> {
  const approved = new Map<string, Record<string, unknown>>();
  for (const fact of careerFacts) {
    const factId = String(fact.fact_id || fact.id || "").trim();
    if (!factId || !careerFactIsApproved(fact)) continue;
    approved.set(factId, fact);
  }
  return approved;
}

function careerFactIsApproved(fact: Record<string, unknown>): boolean {
  const statuses = [fact.status, fact.verification_status, fact.approval_status]
    .map((status) => String(status || "").trim().toLowerCase());
  return statuses.includes("verified") || statuses.includes("approved") ||
    fact.verified === true || fact.approved === true;
}

function duplicateNormalizedClaims(
  claimEvidence: FinalizedPacketClaimEvidence[],
): string[] {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const claim of claimEvidence) {
    const normalized = normalizeEvidenceText(claim.claim_text);
    if (!normalized) continue;
    if (seen.has(normalized)) duplicates.push(claim.claim_text);
    seen.add(normalized);
  }
  return uniqueStrings(duplicates);
}

function normalizeEvidenceText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function sameStringSet(left: unknown[], right: unknown[]): boolean {
  const leftValues = [...new Set(left.map(String).filter(Boolean))].sort();
  const rightValues = [...new Set(right.map(String).filter(Boolean))].sort();
  return leftValues.length === rightValues.length &&
    leftValues.every((value, index) => value === rightValues[index]);
}

export function normalizeCanonMatchOutput(
  output: Record<string, unknown>,
): Record<string, unknown> {
  const matches = Array.isArray(output.matches)
    ? output.matches.filter((match) =>
      match && typeof match === "object" && !Array.isArray(match)
    ) as Array<Record<string, unknown>>
    : [];
  const matchedFactIds = uniqueStrings(
    matches.map((match) => match.matched_fact_id),
  );
  const claimsUsed = uniqueStrings(
    matches
      .filter((match) => String(match.matched_fact_id || "").trim())
      .map((match) => match.evidence),
  );
  return {
    ...output,
    matched_fact_ids: matches.length
      ? matchedFactIds
      : uniqueStrings(arrayFromUnknown(output.matched_fact_ids)),
    claims_used: matches.length
      ? claimsUsed
      : uniqueStrings(arrayFromUnknown(output.claims_used)),
  };
}

function validateProviderResult(
  result: ProviderResult,
  schema: JsonSchema,
  options: {
    schemaName?: string;
    useGrounding?: boolean;
    integrityContext?: FinalizedRoleKitIntegrityContext;
    finalQualityAuditContext?: FinalQualityAuditContext;
  } = {},
): { parsed: Record<string, unknown>; errors: string[] } {
  const parsed = parseModelJson(result.text);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { parsed: {}, errors: ["$ expected object JSON output"] };
  }
  const shouldEnrich = options.schemaName === "job_search_result" ||
    options.schemaName === "search_run";
  const enriched = shouldEnrich
    ? enrichParsedWithGrounding(
      parsed as Record<string, unknown>,
      result.grounding,
      Boolean(options.useGrounding),
    )
    : parsed as Record<string, unknown>;
  const schemaErrors = validateAgainstSchema(enriched, schema);
  const integrityErrors = options.schemaName === "finalized_packet"
    ? validateFinalizedRoleKitIntegrity(
      enriched,
      options.integrityContext || {},
    )
    : [];
  const revisionIntegrityErrors = options.schemaName === "document_revision"
    ? validateDocumentRevisionIntegrity(
      enriched,
      options.integrityContext || {},
    )
    : [];
  const documentQualityErrors = options.schemaName === "document_quality_check"
    ? validateDocumentQualityAssessment(enriched)
    : [];
  const finalQualityErrors = options.schemaName === "final_quality_check"
    ? validateFinalRoleKitQualityAssessment(
      enriched,
      options.finalQualityAuditContext || {},
    )
    : [];
  const normalized = options.schemaName === "finalized_packet"
    ? normalizeFinalizedPacketEvidence(enriched)
    : options.schemaName === "fact_match"
    ? normalizeCanonMatchOutput(enriched)
    : options.schemaName === "document_quality_check" &&
        !documentQualityErrors.length
    ? normalizeDocumentQualityAssessment(enriched)
    : enriched;
  return {
    parsed: normalized,
    errors: uniqueStrings([
      ...schemaErrors,
      ...integrityErrors,
      ...revisionIntegrityErrors,
      ...documentQualityErrors,
      ...finalQualityErrors,
    ]),
  };
}

export function validateSavedProviderArtifact(
  action: string,
  rawText: string,
  context: FinalizedRoleKitIntegrityContext = {},
): { parsed: Record<string, unknown>; errors: string[] } {
  const schemaName = schemaNameForAction(action);
  return validateProviderResult(
    {
      model: "",
      providerRequestId: "",
      providerRequestIds: [],
      providerRequestCount: 0,
      text: rawText,
      parsed: {},
      raw: {},
      grounding: {},
      usage: {},
      searchQueryCount: 0,
      latencyMs: 0,
      repaired: true,
      validationErrors: [],
    },
    schemaForAction(action),
    { schemaName, integrityContext: context },
  );
}

function revalidatedSavedProviderResult(
  action: string,
  candidate: ValidationRepairCandidate | null,
  body: RequestBody,
  step: Record<string, unknown>,
): ProviderResult | null {
  if (
    !candidate ||
    !["openai-writer", "openai-finalizer"].includes(action)
  ) return null;
  const validation = validateSavedProviderArtifact(
    action,
    candidate.rawText,
    body,
  );
  if (validation.errors.length) return null;
  return {
    model: String(step.actual_model || ""),
    providerRequestId: "",
    providerRequestIds: [],
    providerRequestCount: 0,
    text: candidate.rawText,
    parsed: validation.parsed,
    raw: {
      deterministic_revalidation: true,
      source_artifact_id: candidate.artifactId,
    },
    grounding: {},
    usage: {},
    searchQueryCount: 0,
    latencyMs: 0,
    repaired: true,
    validationErrors: candidate.validationErrors,
    deterministicReplay: true,
    replaySourceArtifactId: candidate.artifactId,
  };
}

function enrichParsedWithGrounding(
  parsed: Record<string, unknown>,
  grounding: Record<string, unknown>,
  useGrounding: boolean,
): Record<string, unknown> {
  const summary = groundingSummaryFields(parsed, grounding, useGrounding);
  const result = parsed.result && typeof parsed.result === "object" &&
      !Array.isArray(parsed.result)
    ? enrichJobRecordWithGrounding(
      parsed.result as Record<string, unknown>,
      grounding,
      useGrounding,
    )
    : parsed.result;
  const results = Array.isArray(parsed.results)
    ? parsed.results.map((item) =>
      item && typeof item === "object" && !Array.isArray(item)
        ? enrichJobRecordWithGrounding(
          item as Record<string, unknown>,
          grounding,
          useGrounding,
        )
        : item
    )
    : parsed.results;
  return {
    ...parsed,
    ...summary,
    ...(result ? { result } : {}),
    ...(results ? { results } : {}),
  };
}

function enrichJobRecordWithGrounding(
  record: Record<string, unknown>,
  grounding: Record<string, unknown>,
  useGrounding: boolean,
): Record<string, unknown> {
  return {
    ...record,
    ...groundingSummaryFields(record, grounding, useGrounding),
  };
}

function groundingSummaryFields(
  record: Record<string, unknown>,
  grounding: Record<string, unknown>,
  useGrounding: boolean,
): Record<string, unknown> {
  const groundingChunks = Array.isArray(grounding.groundingChunks)
    ? grounding.groundingChunks as Array<Record<string, unknown>>
    : [];
  const metadataUrls = urlsFromGroundingChunks(groundingChunks);
  const sourceUrls = uniqueStrings([
    ...arrayFromUnknown(record.grounding_source_urls),
    ...arrayFromUnknown(record.source_links),
    ...arrayFromUnknown(record.source_urls),
    primarySourceUrl(record),
    ...metadataUrls,
  ]);
  const queries = uniqueStrings([
    ...arrayFromUnknown(record.grounding_queries),
    ...arrayFromUnknown(grounding.webSearchQueries),
  ]);
  const urlContextMetadata = grounding.urlContextMetadata &&
      typeof grounding.urlContextMetadata === "object"
    ? grounding.urlContextMetadata as Record<string, unknown>
    : null;
  const urlContextReturned = Boolean(
    urlContextMetadata && Object.keys(urlContextMetadata).length,
  );
  const metadataReturned = groundingChunks.length > 0 || queries.length > 0 ||
    urlContextReturned;
  const hasOfficialOrAtsSource = Boolean(primarySourceUrl(record)) ||
    sourceUrls.some((url) =>
      /careers|jobs|greenhouse|lever|ashby|workday|smartrecruiters|icims/i.test(
        url,
      )
    );
  const sourceVerifiedBy = metadataReturned
    ? (urlContextReturned ? "url_context" : "google_grounding")
    : hasOfficialOrAtsSource
    ? "official_url_capture"
    : (useGrounding ? "manual_review_needed" : "not_verified");
  const status = metadataReturned
    ? "metadata_returned"
    : (useGrounding
      ? "unavailable_provider_response"
      : (hasOfficialOrAtsSource
        ? "needs_manual_verification"
        : "not_requested"));
  const notes = metadataReturned
    ? "Provider response included grounding metadata."
    : (useGrounding
      ? "Provider returned schema-valid JSON without grounding metadata; source verification falls back to captured source URL, posting text, timestamp, and link health."
      : "Grounding tools were not requested for this action.");
  return {
    grounding_metadata_status: status,
    grounding_source_urls: sourceUrls,
    grounding_queries: queries,
    grounding_chunks_count: groundingChunks.length,
    url_context_used: useGrounding,
    google_search_used: useGrounding,
    source_verified_by: sourceVerifiedBy,
    source_verification_notes: String(
      record.source_verification_notes || notes,
    ),
  };
}

function urlsFromGroundingChunks(
  chunks: Array<Record<string, unknown>>,
): string[] {
  const urls: string[] = [];
  for (const chunk of chunks) {
    for (const key of ["web", "retrievedContext"]) {
      const value = chunk[key];
      if (value && typeof value === "object" && !Array.isArray(value)) {
        urls.push(
          String(
            (value as Record<string, unknown>).uri ||
              (value as Record<string, unknown>).url || "",
          ),
        );
      }
    }
  }
  return uniqueStrings(urls);
}

async function callOpenAiStructured(
  prompt: string,
  schemaName: string,
  schema: JsonSchema,
  action: string,
): Promise<ProviderResult> {
  const key = Deno.env.get("OPENAI_API_KEY") || "";
  if (!key) throw new Error("OPENAI_API_KEY is not configured.");
  const model = Deno.env.get("OPENAI_MODEL") || "gpt-5.5";
  const started = Date.now();
  const { response, jsonBody } = await fetchJsonWithTimeout(
    "https://api.openai.com/v1/responses",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "system",
            content:
              "Return only schema-valid JSON. Never perform external actions. Never include secrets.",
          },
          { role: "user", content: prompt },
        ],
        store: false,
        reasoning: {
          effort: ["openai-writer", "openai-finalizer", "revise-document"]
              .includes(action)
            ? "low"
            : "medium",
        },
        text: {
          format: {
            type: "json_schema",
            name: safeSchemaName(schemaName),
            schema,
            strict: true,
          },
        },
      }),
    },
    providerTimeoutMs(action),
  );
  if (!response.ok) {
    throw new Error(
      `OpenAI request failed: ${response.status} ${
        JSON.stringify(jsonBody).slice(0, 1200)
      }`,
    );
  }
  return {
    model,
    providerRequestId: String(
      jsonBody.id || response.headers.get("request-id") ||
        response.headers.get("x-request-id") || "",
    ),
    providerRequestIds: uniqueStrings([
      String(
        jsonBody.id || response.headers.get("request-id") ||
          response.headers.get("x-request-id") || "",
      ),
    ]),
    providerRequestCount: 1,
    text: extractOpenAiText(jsonBody),
    parsed: {},
    raw: jsonBody,
    grounding: {},
    usage: usageFromOpenAi(jsonBody),
    searchQueryCount: 0,
    latencyMs: Date.now() - started,
    repaired: false,
    validationErrors: [],
  };
}

async function callGeminiStructured(
  prompt: string,
  schemaName: string,
  schema: JsonSchema,
  useGrounding: boolean,
  maxProviderRequests?: number,
): Promise<ProviderResult> {
  const key = Deno.env.get("GEMINI_API_KEY") || "";
  if (!key) throw new Error("GEMINI_API_KEY is not configured.");
  const model = Deno.env.get("GEMINI_MODEL") || "gemini-3.5-flash";
  const started = Date.now();
  const requestLimit = Number.isFinite(Number(maxProviderRequests))
    ? Math.max(1, Number(maxProviderRequests))
    : Number.POSITIVE_INFINITY;
  const attempts = geminiAttemptPlans(prompt, schema, useGrounding).slice(
    0,
    requestLimit,
  );
  const failedAttempts: Array<Record<string, unknown>> = [];
  let lastFailure: ProviderRequestFailure | null = null;
  for (const attempt of attempts) {
    const geminiResponse = await fetchJsonWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": key,
        },
        body: JSON.stringify(attempt.body),
      },
    );
    const response = geminiResponse.response;
    const jsonBody = geminiResponse.jsonBody;
    if (response.ok) {
      const grounding = extractGeminiGrounding(jsonBody);
      return {
        model,
        providerRequestId: String(response.headers.get("x-request-id") || ""),
        providerRequestIds: uniqueStrings([
          String(response.headers.get("x-request-id") || ""),
        ]),
        providerRequestCount: failedAttempts.length + 1,
        text: extractGeminiText(jsonBody),
        parsed: {},
        raw: { ...jsonBody, request_mode: attempt.mode },
        grounding,
        usage: usageFromGemini(jsonBody),
        searchQueryCount: Array.isArray(grounding.webSearchQueries)
          ? new Set(grounding.webSearchQueries.map(String).filter(Boolean)).size
          : 0,
        latencyMs: Date.now() - started,
        repaired: false,
        validationErrors: [],
      };
    }
    const providerError = providerErrorFromGeminiBody(jsonBody);
    const failedAttempt = {
      mode: attempt.mode,
      http_status: response.status,
      provider_status: providerError.status,
      provider_message: providerError.message,
      retryable: shouldFallbackGeminiSchema(jsonBody),
      sanitized_request_summary: summarizeGeminiRequest(
        attempt.body,
        schemaName,
      ),
    };
    failedAttempts.push(failedAttempt);
    lastFailure = new ProviderRequestFailure({
      provider: "gemini",
      model,
      httpStatus: response.status,
      providerStatus: providerError.status,
      providerMessage: providerError.message,
      requestMode: attempt.mode,
      attempts: failedAttempts,
    });
    if (!shouldFallbackGeminiSchema(jsonBody)) break;
  }
  throw lastFailure ||
    new Error(
      "Gemini request failed before a provider response was available.",
    );
}

async function fetchJsonWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = PROVIDER_TIMEOUT_MS,
): Promise<{ response: Response; jsonBody: Record<string, unknown> }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const jsonBody = await response.json().catch(() => ({}));
    return {
      response,
      jsonBody:
        jsonBody && typeof jsonBody === "object" && !Array.isArray(jsonBody)
          ? jsonBody as Record<string, unknown>
          : {},
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        `Provider request timed out after ${
          Math.round(timeoutMs / 1000)
        } seconds.`,
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function providerTimeoutMs(action: string): number {
  return [
      "score-job",
      "openai-strategist",
      "openai-writer",
      "openai-finalizer",
      "revise-document",
    ].includes(action)
    ? LONG_FORM_PROVIDER_TIMEOUT_MS
    : PROVIDER_TIMEOUT_MS;
}

export function geminiRequestBody(
  prompt: string,
  schema: JsonSchema,
  useGrounding: boolean,
  useResponseFormat: boolean,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  };
  if (useGrounding) body.tools = [{ googleSearch: {} }, { urlContext: {} }];
  body.generationConfig = useResponseFormat
    ? { responseFormat: { text: { mimeType: "APPLICATION_JSON", schema } } }
    : { responseMimeType: "application/json", responseJsonSchema: schema };
  return body;
}

function geminiAttemptPlans(
  prompt: string,
  schema: JsonSchema,
  useGrounding: boolean,
): Array<{ mode: string; body: Record<string, unknown> }> {
  if (useGrounding) {
    return [
      {
        mode: "grounded_structured_response_format",
        body: geminiRequestBody(prompt, schema, true, true),
      },
      {
        mode: "grounded_tools_json_prompt",
        body: geminiGroundedJsonPromptRequestBody(prompt),
      },
    ];
  }
  return [
    {
      mode: "structured_response_format",
      body: geminiRequestBody(prompt, schema, false, true),
    },
    {
      mode: "structured_response_json_schema",
      body: geminiRequestBody(prompt, schema, false, false),
    },
    { mode: "loose_json", body: geminiLooseJsonRequestBody(prompt, false) },
  ];
}

function geminiGroundedJsonPromptRequestBody(
  prompt: string,
): Record<string, unknown> {
  return {
    contents: [{
      role: "user",
      parts: [{
        text: [
          prompt,
          "",
          "Return exactly one strict JSON object and no Markdown. The application will validate this JSON against its schema after the provider response.",
        ].join("\n"),
      }],
    }],
    tools: [{ googleSearch: {} }, { urlContext: {} }],
  };
}

function geminiLooseJsonRequestBody(
  prompt: string,
  useGrounding: boolean,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json" },
  };
  if (useGrounding) body.tools = [{ googleSearch: {} }, { urlContext: {} }];
  return body;
}

export function shouldFallbackGeminiSchema(
  response: Record<string, unknown>,
): boolean {
  const text = JSON.stringify(response).toLowerCase();
  return /responseformat|response_format|responsejsonschema|response_json_schema|mime[_ -]?type|controlled generation|tool use|schema complexity|unknown name|unknown field|invalid json payload|unsupported|invalid argument/i
    .test(text);
}

function providerErrorFromGeminiBody(
  response: Record<string, unknown>,
): { status: string; message: string } {
  const error = response.error && typeof response.error === "object" &&
      !Array.isArray(response.error)
    ? response.error as Record<string, unknown>
    : {};
  return {
    status: String(error.status || ""),
    message: sanitizeProviderMessage(
      String(error.message || JSON.stringify(response).slice(0, 500)),
    ),
  };
}

function sanitizeProviderMessage(message: string): string {
  return message
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, "[REDACTED_GOOGLE_API_KEY]")
    .replace(/sk-[0-9A-Za-z_-]{20,}/g, "[REDACTED_OPENAI_API_KEY]")
    .replace(/Bearer\s+[0-9A-Za-z._-]+/gi, "Bearer [REDACTED_TOKEN]")
    .slice(0, 900);
}

function summarizeGeminiRequest(
  requestBody: Record<string, unknown>,
  schemaName: string,
): Record<string, unknown> {
  const contents = Array.isArray(requestBody.contents)
    ? requestBody.contents
    : [];
  const promptChars = contents.reduce((sum, content) => {
    const parts =
      content && typeof content === "object" && !Array.isArray(content)
        ? (content as Record<string, unknown>).parts
        : [];
    return sum +
      (Array.isArray(parts)
        ? parts.reduce(
          (partSum, part) =>
            partSum +
            String((part as Record<string, unknown>)?.text || "").length,
          0,
        )
        : 0);
  }, 0);
  const tools = Array.isArray(requestBody.tools)
    ? requestBody.tools.map((tool) =>
      Object.keys((tool || {}) as Record<string, unknown>)[0]
    ).filter(Boolean)
    : [];
  const generationConfig = requestBody.generationConfig &&
      typeof requestBody.generationConfig === "object" &&
      !Array.isArray(requestBody.generationConfig)
    ? requestBody.generationConfig as Record<string, unknown>
    : {};
  return {
    schema_name: schemaName,
    prompt_chars: promptChars,
    tools,
    generation_config_keys: Object.keys(generationConfig),
    response_format_requested: Boolean(
      generationConfig.responseFormat || generationConfig.response_format,
    ),
    response_mime_type: String(generationConfig.responseMimeType || ""),
  };
}

function providerFailureDiagnostics(error: unknown, context: {
  runId: string;
  action: string;
  provider: Provider;
  modelRole: string;
  schemaName: string;
  body: RequestBody;
  prompt: string;
  useGrounding: boolean;
}): Record<string, unknown> {
  const task = taskFromRequestBody(context.body);
  const companyName = firstNonEmpty([
    arrayFromUnknown(task.company_cluster)[0],
    String(context.body.job?.company || ""),
  ]);
  const providerFailure = error instanceof ProviderRequestFailure
    ? error
    : null;
  const providerMessage = providerFailure
    ? providerFailure.providerMessage
    : sanitizeProviderMessage(
      error instanceof Error ? error.message : String(error),
    );
  const retryable = providerFailure
    ? providerFailure.attempts.some((attempt) => Boolean(attempt.retryable))
    : /invalid argument|schema|response mime|controlled generation|timeout/i
      .test(providerMessage);
  return {
    run_id: context.runId,
    company_id: companyName ? stableId("company", companyName) : null,
    company_name: companyName || null,
    task_id: String(task.id || ""),
    search_phase: context.action === "gemini-scout" ? "Scout" : context.action,
    action: context.action,
    model_role: context.modelRole,
    model_name: providerFailure?.model || "",
    feature_flags: {
      google_search_used: context.useGrounding,
      url_context_used: context.useGrounding,
      structured_output_requested: true,
      tools_only_json_fallback_available: context.useGrounding,
    },
    sanitized_request_summary: {
      schema_name: context.schemaName,
      prompt_chars: context.prompt.length,
      source_text_chars: String(context.body.sourceText || "").length,
      company_cluster: arrayFromUnknown(task.company_cluster),
      role_family_cluster: arrayFromUnknown(task.role_family_cluster),
      official_career_urls: arrayFromUnknown(task.official_career_urls),
      location_constraints: String(task.location_constraints || ""),
      compensation_constraints: String(task.compensation_constraints || ""),
      include_packet_generation: Boolean(
        context.body.include_packet_generation,
      ),
      run_synchronously: Boolean(context.body.run_synchronously),
      limits: context.body.limits || {},
    },
    provider_error_code: providerFailure?.providerStatus ||
      (error instanceof ValidationFailure ? "failed_validation" : "unknown"),
    provider_http_status: providerFailure?.httpStatus || null,
    provider_error_message: providerMessage,
    retryable,
    attempts: providerFailure?.attempts || [],
    next_suggested_fix: suggestedProviderFix(
      providerMessage,
      context.useGrounding,
    ),
  };
}

function taskFromRequestBody(body: RequestBody): Record<string, unknown> {
  const raw = String(body.sourceText || "").trim();
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}

function suggestedProviderFix(message: string, useGrounding: boolean): string {
  if (
    useGrounding &&
    /response mime|controlled generation|responseformat|response_format|schema/i
      .test(message)
  ) {
    return "Retry grounded Scout with Google Search and URL Context enabled but without provider-enforced JSON response format; validate JSON in the app after response.";
  }
  if (/schema complexity|too large|invalid argument/i.test(message)) {
    return "Simplify the provider schema or use a prompt-only JSON response plus application-side validation.";
  }
  if (/timeout/i.test(message)) {
    return "Retry one task at a time with a narrower company/role query.";
  }
  return "Review provider response and retry only the failed durable step after fixing request shape.";
}

async function prepareApplicationPacketWorkflow(
  auth: AuthContext,
  body: RequestBody,
  workflowType: string,
): Promise<Record<string, unknown>> {
  const packetBody: RequestBody = { ...body, include_packet_generation: true };
  const job = packetBody.job || {};
  const jobId = jobIdFromBody(packetBody);
  if (!jobId) {
    throw new Error(
      "Prepare Complete Application Packet requires a selected job.",
    );
  }
  if (!hasPostingContent(job)) {
    throw new Error(
      "Prepare Complete Application Packet requires full posting content before AI drafting.",
    );
  }

  const runId = String(
    packetBody.workflow_run_id || packetBody.run_id ||
      stableId("workflow", workflowType, jobId, inputVersion(packetBody)),
  );
  const limits = controlledLimits(packetBody);
  const existingRun = await selectOne(
    auth.supabase,
    "jobcc_workflow_runs",
    runId,
  ).catch(() => null) as Record<string, unknown> | null;
  if (
    existingRun &&
    WORKFLOW_TERMINAL_STATUSES.has(String(existingRun.status || "")) &&
    (packetBody.workflow_run_id || packetBody.run_id || packetBody.workflow_id)
  ) {
    return {
      workflow_run_id: runId,
      status: String(existingRun.status || "completed"),
      job_id: jobId,
      current_step: String(existingRun.current_step || ""),
      message:
        "Existing terminal workflow was preserved. Start a new run id to build a fresh packet.",
    };
  }
  await ensureSelectedJobPersisted(auth.supabase, auth.user.id, job);
  await upsertWorkflowRun(auth.supabase, auth.user.id, {
    id: runId,
    workflow_type: workflowType,
    status: "queued",
    trigger_type: "manual",
    parent_run_id: null,
    search_run_id: stringOrNull(packetBody.search_run_id),
    job_id: jobId,
    current_step: "verify-job-source",
    total_steps: APPLICATION_PACKET_STEPS.length,
    started_at: new Date().toISOString(),
    cost_estimate: 0,
    actual_cost: 0,
    max_estimated_cost: limits.maximumEstimatedCostPerRun,
    max_actual_cost: limits.maximumActualCostPerRun,
    max_error_rate: limits.maximumErrorRate,
    input_record: {
      ...redactRequest(packetBody),
      request_body: safeWorkflowRequest(packetBody),
      limits,
    },
  });
  await ensureApplicationPacketStepPlan(auth, runId);
  return {
    workflow_run_id: runId,
    status: "queued",
    job_id: jobId,
    current_step: APPLICATION_PACKET_STEPS[0].action,
    next_step: APPLICATION_PACKET_STEPS[0].action,
    total_steps: APPLICATION_PACKET_STEPS.length,
    estimated_cost_cap: limits.maximumEstimatedCostPerRun,
    message:
      "Packet workflow prepared. Call advance-workflow to run exactly one durable step.",
  };
}

async function advanceApplicationPacketWorkflow(
  auth: AuthContext,
  runId: string,
  body: RequestBody,
  workflowType: string,
  limits: ReturnType<typeof controlledLimits>,
): Promise<Record<string, unknown>> {
  const jobId = jobIdFromBody(body);
  if (!jobId) {
    throw new Error(
      "Application packet workflow cannot resume without a job id.",
    );
  }
  const run = await selectOne(auth.supabase, "jobcc_workflow_runs", runId) as
    | Record<string, unknown>
    | null;
  if (!run) throw new Error("Workflow run not found.");
  if (String(run.status || "") === "waiting_for_approval") {
    const currentStep = String(run.current_step || "");
    const errorCode = String(run.error_code || "");
    if (!body.approved) {
      return {
        workflow_run_id: runId,
        status: "waiting_for_approval",
        job_id: jobId,
        current_step: currentStep,
        message: currentStep === "approval-review"
          ? "Final role-kit approval is required before completion."
          : "A review gate is active. Resolve or approve the review before continuing.",
      };
    }
    if (
      currentStep === "strategist-review" &&
      errorCode === "strategist_gate_blocked"
    ) {
      await ensureApplicationPacketStepPlan(auth, runId);
      const next = await nextApplicationPacketStep(auth, runId);
      if (!next.definition || next.definition.action !== "openai-writer") {
        throw new Error(
          "Strategist approval could not resolve the next durable Writer step.",
        );
      }
      await upsertWorkflowRun(auth.supabase, auth.user.id, {
        id: runId,
        workflow_type: workflowType,
        status: "queued",
        job_id: jobId,
        current_step: next.definition.action,
        error_code: null,
        error_message: null,
        last_heartbeat_at: new Date().toISOString(),
      });
      return {
        workflow_run_id: runId,
        status: "queued",
        job_id: jobId,
        step_executed: "strategist-review-approval",
        next_step: next.definition.action,
        message:
          "Strategist review approved. Writer is queued as the next durable step; no model step ran in this advance call.",
      };
    }
    if (currentStep !== "approval-review") {
      return {
        workflow_run_id: runId,
        status: "waiting_for_approval",
        job_id: jobId,
        current_step: currentStep,
        blockers: [
          String(
            run.error_message ||
              "Evidence or source blockers remain unresolved.",
          ),
        ],
        message:
          "This evidence gate cannot be bypassed by approval. Correct the source or Career Canon evidence, then retry the blocked step.",
      };
    }
    await upsertWorkflowRun(auth.supabase, auth.user.id, {
      id: runId,
      workflow_type: workflowType,
      status: "completed",
      job_id: jobId,
      current_step: "completed",
      completed_at: new Date().toISOString(),
    });
    return {
      workflow_run_id: runId,
      status: "completed",
      job_id: jobId,
      message: "Approved workflow marked completed.",
    };
  }
  await ensureApplicationPacketStepPlan(auth, runId);
  await assertNotCancelled(auth, runId, "packet generation");
  const next = await nextApplicationPacketStep(auth, runId);
  if (next.failedStep) {
    return {
      workflow_run_id: runId,
      status: String(run.status || "failed_provider"),
      job_id: jobId,
      failed_step: next.failedStep.step_type,
      message:
        "Use retry-workflow-step for the failed step; advance will not skip failures.",
    };
  }
  if (!next.definition) {
    await upsertWorkflowRun(auth.supabase, auth.user.id, {
      id: runId,
      workflow_type: workflowType,
      status: "waiting_for_approval",
      job_id: jobId,
      current_step: "approval-review",
      total_steps: APPLICATION_PACKET_STEPS.length,
    });
    return {
      workflow_run_id: runId,
      status: "waiting_for_approval",
      job_id: jobId,
      message:
        "All packet steps are complete and waiting for Matthew approval.",
    };
  }

  const stepDef = next.definition;
  const deferredProviderStep = stepDef.action === "gemini-final-quality-check"
    ? await providerCompletedPacketStepResult(auth, runId, stepDef)
    : null;
  if (deferredProviderStep) {
    await upsertWorkflowRun(auth.supabase, auth.user.id, {
      id: runId,
      workflow_type: workflowType,
      status: "running",
      job_id: jobId,
      current_step: stepDef.action,
      total_steps: APPLICATION_PACKET_STEPS.length,
      last_heartbeat_at: new Date().toISOString(),
      error_code: null,
      error_message: null,
    });
    try {
      return await executeApplicationPacketStep(
        auth,
        runId,
        body,
        workflowType,
        limits,
        stepDef,
        deferredProviderStep.step,
        deferredProviderStep.result,
      );
    } catch (error) {
      return failApplicationPacketStep(
        auth,
        runId,
        body,
        workflowType,
        stepDef,
        error,
      );
    }
  }
  const stepClaim = await claimApplicationPacketStep(auth, runId, stepDef);
  if (!stepClaim.claimed) {
    return applicationPacketClaimResponse(runId, jobId, stepDef, stepClaim);
  }
  await upsertWorkflowRun(auth.supabase, auth.user.id, {
    id: runId,
    workflow_type: workflowType,
    status: "running",
    job_id: jobId,
    current_step: stepDef.action,
    total_steps: APPLICATION_PACKET_STEPS.length,
    last_heartbeat_at: new Date().toISOString(),
  });

  try {
    return await executeApplicationPacketStep(
      auth,
      runId,
      body,
      workflowType,
      limits,
      stepDef,
    );
  } catch (error) {
    return failApplicationPacketStep(
      auth,
      runId,
      body,
      workflowType,
      stepDef,
      error,
    );
  }
}

type ApplicationPacketStepDefinition = typeof APPLICATION_PACKET_STEPS[number];

export type ApplicationPacketStepClaimStore = {
  conditionalClaim: (args: {
    stepId: string;
    runId: string;
    userId: string;
    expectedStatus: string;
    update: Record<string, unknown>;
  }) => Promise<Record<string, unknown> | null>;
  read: (stepId: string) => Promise<Record<string, unknown> | null>;
};

export type ApplicationPacketStepClaimMode =
  | "advance"
  | "retry"
  | "validated_completed_repair";

export type ApplicationPacketStepClaimResult = {
  claimed: boolean;
  outcome:
    | "claimed"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "failed"
    | "not_claimable";
  step: Record<string, unknown> | null;
};

function applicationPacketStepClaimResult(
  step: Record<string, unknown> | null,
): ApplicationPacketStepClaimResult {
  const status = String(step?.status || "");
  const outcome = status === "completed"
    ? "completed"
    : status === "running" || status === "retrying"
    ? "in_progress"
    : status === "cancelled"
    ? "cancelled"
    : isFailedStepStatus(status)
    ? "failed"
    : "not_claimable";
  return { claimed: false, outcome, step };
}

function applicationPacketStepClaimTransitionAllowed(
  claimMode: ApplicationPacketStepClaimMode,
  expectedStatus: string,
): boolean {
  if (claimMode === "advance") return expectedStatus === "queued";
  if (claimMode === "retry") return isFailedStepStatus(expectedStatus);
  if (claimMode === "validated_completed_repair") {
    return expectedStatus === "completed";
  }
  return false;
}

export async function claimApplicationPacketStepOnce(
  store: ApplicationPacketStepClaimStore,
  args: {
    stepId: string;
    runId: string;
    userId: string;
    expectedStatus: string;
    attemptCount: number;
    startedAt?: string;
    claimMode?: ApplicationPacketStepClaimMode;
  },
): Promise<ApplicationPacketStepClaimResult> {
  const claimMode = args.claimMode || "advance";
  if (
    !applicationPacketStepClaimTransitionAllowed(
      claimMode,
      args.expectedStatus,
    )
  ) {
    return applicationPacketStepClaimResult(await store.read(args.stepId));
  }
  const claimTimestamp = args.startedAt || new Date().toISOString();
  const claimed = await store.conditionalClaim({
    stepId: args.stepId,
    runId: args.runId,
    userId: args.userId,
    expectedStatus: args.expectedStatus,
    update: {
      status: "running",
      attempt_count: args.attemptCount,
      started_at: claimTimestamp,
      completed_at: null,
      error: null,
      updated_at: claimTimestamp,
    },
  });
  if (claimed) return { claimed: true, outcome: "claimed", step: claimed };
  return applicationPacketStepClaimResult(await store.read(args.stepId));
}

function supabaseApplicationPacketStepClaimStore(
  supabase: SupabaseClient,
): ApplicationPacketStepClaimStore {
  return {
    conditionalClaim: async (args) => {
      const { data, error } = await supabase.from("jobcc_workflow_steps")
        .update(args.update)
        .eq("id", args.stepId)
        .eq("run_id", args.runId)
        .eq("user_id", args.userId)
        .eq("status", args.expectedStatus)
        .select("*")
        .limit(1);
      if (error) {
        throw new Error(
          `jobcc_workflow_steps conditional claim failed: ${error.message}`,
        );
      }
      return Array.isArray(data) && data.length
        ? data[0] as Record<string, unknown>
        : null;
    },
    read: async (stepId) =>
      await selectOne(supabase, "jobcc_workflow_steps", stepId) as
        | Record<string, unknown>
        | null,
  };
}

async function claimApplicationPacketStep(
  auth: AuthContext,
  runId: string,
  step: ApplicationPacketStepDefinition,
  retryStep: Record<string, unknown> | null = null,
  claimMode: ApplicationPacketStepClaimMode = retryStep ? "retry" : "advance",
): Promise<ApplicationPacketStepClaimResult> {
  const stepId = String(
    retryStep?.id ||
      stableId("workflow-step", runId, step.action, step.stepOrder),
  );
  const store = supabaseApplicationPacketStepClaimStore(auth.supabase);
  const current = retryStep ? retryStep : await store.read(stepId);
  const retryStatus = String(retryStep?.status || "");
  let expectedStatus = "queued";
  if (retryStep) {
    if (retryStatus === "blocked_review_retry") {
      if (claimMode !== "validated_completed_repair") {
        throw new Error(
          "Completed packet-step repair requires the validated blocked-review retry path.",
        );
      }
      expectedStatus = "completed";
    } else {
      if (claimMode !== "retry" || !isFailedStepStatus(retryStatus)) {
        throw new Error(
          "Packet-step retry requires a validated failed durable step.",
        );
      }
      expectedStatus = retryStatus;
    }
  } else if (claimMode !== "advance") {
    throw new Error(
      "Normal packet advance may claim only a queued durable step.",
    );
  }
  const attemptCount = retryStep
    ? Number(retryStep.attempt_count || 0) + 1
    : Math.max(1, Number(current?.attempt_count || 0) + 1);
  return claimApplicationPacketStepOnce(
    store,
    {
      stepId,
      runId,
      userId: auth.user.id,
      expectedStatus,
      attemptCount,
      claimMode,
    },
  );
}

function applicationPacketClaimResponse(
  runId: string,
  jobId: string,
  step: ApplicationPacketStepDefinition,
  claim: ApplicationPacketStepClaimResult,
): Record<string, unknown> {
  const stepStatus = String(claim.step?.status || claim.outcome);
  return {
    workflow_run_id: runId,
    status: stepStatus,
    job_id: jobId,
    step: step.action,
    step_status: stepStatus,
    idempotent: true,
    provider_invoked: false,
    message: claim.outcome === "completed"
      ? "This durable step was already completed; no provider call was made."
      : claim.outcome === "in_progress"
      ? "This durable step is already in progress; no duplicate provider call was made."
      : `This durable step is ${claim.outcome}; no provider call was made.`,
  };
}

export type ApplicationPacketStepPlanStore = {
  read: (runId: string) => Promise<Array<Record<string, unknown>>>;
  insertIgnoreDuplicates: (
    rows: Array<Record<string, unknown>>,
  ) => Promise<void>;
};

export function buildApplicationPacketStepPlanRows(args: {
  runId: string;
  userId: string;
  updatedAt?: string;
}): Array<Record<string, unknown>> {
  const updatedAt = args.updatedAt || new Date().toISOString();
  return APPLICATION_PACKET_STEPS.map((step) => ({
    id: stableId(
      "workflow-step",
      args.runId,
      step.action,
      step.stepOrder,
    ),
    user_id: args.userId,
    run_id: args.runId,
    step_id: `${args.runId}-${step.stepOrder}-${step.action}`,
    step_order: step.stepOrder,
    step_type: step.action,
    model_role: step.modelRole,
    provider: step.provider,
    function_name: step.action,
    status: "queued",
    attempt_count: 0,
    max_attempts: step.maxAttempts,
    input_artifact_ids: [],
    output_artifact_ids: [],
    estimated_cost: estimateModelCost(step.action),
    actual_cost: 0,
    cost: 0,
    idempotency_key: stableId(
      "idem",
      args.runId,
      step.action,
      step.stepOrder,
    ),
    record: { durable_step_plan: "application-packet-v2-quality-gated" },
    updated_at: updatedAt,
  }));
}

export async function ensureApplicationPacketStepPlanOnce(
  store: ApplicationPacketStepPlanStore,
  args: {
    runId: string;
    userId: string;
    updatedAt?: string;
  },
): Promise<Array<Record<string, unknown>>> {
  const existing = await store.read(args.runId);
  const existingIds = new Set(existing.map((step) => String(step.id || "")));
  const missing = buildApplicationPacketStepPlanRows(args).filter((step) =>
    !existingIds.has(String(step.id || ""))
  );
  if (missing.length) await store.insertIgnoreDuplicates(missing);
  return missing;
}

async function ensureApplicationPacketStepPlan(
  auth: AuthContext,
  runId: string,
) {
  await ensureApplicationPacketStepPlanOnce(
    {
      read: async (selectedRunId) =>
        await selectMany(
          auth.supabase,
          "jobcc_workflow_steps",
          "run_id",
          selectedRunId,
        ) as Array<Record<string, unknown>>,
      insertIgnoreDuplicates: async (rows) =>
        await criticalInsertIgnoreDuplicates(
          auth.supabase,
          "jobcc_workflow_steps",
          rows,
        ),
    },
    { runId, userId: auth.user.id },
  );
}

async function nextApplicationPacketStep(
  auth: AuthContext,
  runId: string,
): Promise<
  {
    definition: ApplicationPacketStepDefinition | null;
    failedStep: Record<string, unknown> | null;
  }
> {
  const steps = await selectMany(
    auth.supabase,
    "jobcc_workflow_steps",
    "run_id",
    runId,
  ) as Array<Record<string, unknown>>;
  const failedStep = steps
    .filter((step) => isFailedStepStatus(String(step.status || "")))
    .sort((a, b) => Number(a.step_order || 0) - Number(b.step_order || 0))[0] ||
    null;
  if (failedStep) return { definition: null, failedStep };
  for (const definition of APPLICATION_PACKET_STEPS) {
    const completed = await completedStepResult(
      auth.supabase,
      runId,
      definition.action,
      definition.stepOrder,
      "",
    );
    if (!completed) return { definition, failedStep: null };
  }
  return { definition: null, failedStep: null };
}

function applicationPacketStepForAction(
  action: string,
): ApplicationPacketStepDefinition | null {
  return APPLICATION_PACKET_STEPS.find((step) => step.action === action) ||
    null;
}

async function executeApplicationPacketStep(
  auth: AuthContext,
  runId: string,
  body: RequestBody,
  workflowType: string,
  limits: ReturnType<typeof controlledLimits>,
  step: ApplicationPacketStepDefinition,
  retryStep: Record<string, unknown> | null = null,
  replayedProviderResult: ProviderResult | null = null,
  validationRepairCandidate: ValidationRepairCandidate | null = null,
): Promise<Record<string, unknown>> {
  const jobId = jobIdFromBody(body);
  if (!jobId) {
    throw new Error(
      "Application packet workflow cannot run a step without a job id.",
    );
  }
  await assertNotCancelled(auth, runId, step.action);
  const context = await applicationPacketContext(auth, runId, body);
  const retryAttemptCount = Number(retryStep?.attempt_count || 0);
  const retryMaxAttempts = Number(
    retryStep?.max_attempts || step.maxAttempts,
  );
  const retryProviderCallAllowance = retryStep
    ? providerRetryCallLimitAllowance(
      retryStep,
      retryAttemptCount,
      retryMaxAttempts,
    )
    : 0;
  const retryError = retryStep?.error &&
      typeof retryStep.error === "object" &&
      !Array.isArray(retryStep.error)
    ? retryStep.error as Record<string, unknown>
    : {};
  const retryRecord = retryStep?.record &&
      typeof retryStep.record === "object" &&
      !Array.isArray(retryStep.record)
    ? retryStep.record as Record<string, unknown>
    : {};
  const consumesPreflightRetryExtension = Boolean(
    retryStep &&
      String(retryStep.status || "") === "failed_preflight" &&
      String(retryError.workflow_stop || "") === "call_limit" &&
      retryAttemptCount >= retryMaxAttempts &&
      retryRecord.preflight_retry_extension_used !== true,
  );
  const retryOptions = retryStep
    ? {
      step_primary_id: retryStep.id,
      step_id: retryStep.step_id,
      attempt_count: Number(retryStep.attempt_count || 0) + 1,
      max_attempts: Number(retryStep.max_attempts || step.maxAttempts),
      idempotency_key: retryStep.idempotency_key ||
        stableId("idem", runId, step.action, step.stepOrder),
      prior_provider_request_count: providerRequestEvidenceCountForStep(
        retryStep,
      ),
      prior_provider_request_ids: uniqueStrings([
        ...arrayFromUnknown(
          (retryStep.record as Record<string, unknown> | undefined)
            ?.provider_request_ids,
        ),
        retryStep.provider_request_id,
      ]),
      prior_token_usage: retryStep.token_usage,
      prior_search_query_count: Number(retryStep.search_query_count || 0),
      prior_actual_cost: Number(retryStep.actual_cost || 0),
      prior_estimated_cost: Number(retryStep.estimated_cost || 0),
      prior_latency_ms: Number(retryStep.latency_ms || 0),
      prior_actual_model: String(retryStep.actual_model || ""),
      prior_provider_request_id: String(
        retryStep.provider_request_id || "",
      ),
      validation_repair_candidate: validationRepairCandidate,
      provider_retry_call_allowance: retryProviderCallAllowance,
      preflight_retry_extension_used:
        retryRecord.preflight_retry_extension_used === true ||
        consumesPreflightRetryExtension,
    }
    : { max_attempts: step.maxAttempts };

  if (step.action === "verify-job-source") {
    const localVerification =
      await runApplicationPacketOfficialVerificationStep(
        auth,
        runId,
        body,
        step,
        retryOptions,
      );
    if (localVerification) {
      const verifiedJob = mergeJobRecords(
        body.job || {},
        (localVerification.parsed.result as Record<string, unknown>) || {},
      );
      await ensureSelectedJobPersisted(
        auth.supabase,
        auth.user.id,
        verifiedJob,
      );
      const blockers = postingVerificationGate(verifiedJob);
      if (blockers.length) {
        return blockApplicationPacket(
          auth,
          runId,
          workflowType,
          jobId,
          "posting-verification-review",
          "posting_verification_blocked",
          "Posting verification blocked packet generation.",
          blockers,
          { verification: localVerification.parsed },
        );
      }
      return markApplicationPacketStepAdvanced(
        auth,
        runId,
        workflowType,
        jobId,
        step.action,
        { verification: localVerification.parsed },
      );
    }
    const verification = await runWorkflowModelStep(
      auth,
      runId,
      body,
      step.action,
      "gemini",
      step.stepOrder,
      step.modelRole,
      limits,
      retryOptions,
    );
    const verifiedJob = mergeJobRecords(
      body.job || {},
      (verification.parsed.result as Record<string, unknown>) || {},
    );
    await ensureSelectedJobPersisted(auth.supabase, auth.user.id, verifiedJob);
    const blockers = postingVerificationGate(verifiedJob);
    if (blockers.length) {
      return blockApplicationPacket(
        auth,
        runId,
        workflowType,
        jobId,
        "posting-verification-review",
        "posting_verification_blocked",
        "Posting verification blocked packet generation.",
        blockers,
        { verification: verification.parsed },
      );
    }
    return markApplicationPacketStepAdvanced(
      auth,
      runId,
      workflowType,
      jobId,
      step.action,
      { verification: verification.parsed },
    );
  }

  if (step.action === "match-job-to-canon") {
    const canon = await getOrRunCanonMatchStep(
      auth,
      runId,
      { ...body, job: context.verifiedJob },
      step.stepOrder,
      Boolean(retryStep),
    );
    const blockers = blockingClaims(canon.parsed);
    if (blockers.length) {
      return blockApplicationPacket(
        auth,
        runId,
        workflowType,
        jobId,
        "career-canon-review",
        "career_canon_blocked",
        "Career Canon validation blocked packet generation.",
        blockers,
        { verification: context.verification?.parsed, canon: canon.parsed },
      );
    }
    return markApplicationPacketStepAdvanced(
      auth,
      runId,
      workflowType,
      jobId,
      step.action,
      { canon: canon.parsed },
    );
  }

  if (step.action === "score-job") {
    const canon = requirePacketResult(context.canon, "match-job-to-canon");
    const strategistBody = strategistPacketBody(
      body,
      context.verifiedJob,
      canon.parsed,
    );
    const strategist = await runWorkflowModelStep(
      auth,
      runId,
      strategistBody,
      step.action,
      "openai",
      step.stepOrder,
      step.modelRole,
      limits,
      retryOptions,
    );
    await applyScoreToJob(auth.supabase, jobId, strategist.parsed);
    const blockers = [
      ...blockingClaims(strategist.parsed),
      ...writerGateBlockers(strategist.parsed, context.verifiedJob),
    ];
    if (blockers.length) {
      return blockApplicationPacket(
        auth,
        runId,
        workflowType,
        jobId,
        "strategist-review",
        "strategist_gate_blocked",
        "Strategist scoring blocked packet generation.",
        blockers,
        {
          verification: context.verification?.parsed,
          canon: canon.parsed,
          strategist: strategist.parsed,
        },
      );
    }
    return markApplicationPacketStepAdvanced(
      auth,
      runId,
      workflowType,
      jobId,
      step.action,
      { strategist: strategist.parsed },
    );
  }

  if (step.action === "openai-writer") {
    const canon = requirePacketResult(context.canon, "match-job-to-canon");
    const strategist = requirePacketResult(context.strategist, "score-job");
    const writerBody = writerPacketBody(
      body,
      context.verifiedJob,
      canon.parsed,
      strategist.parsed,
    );
    const writer = await runWorkflowModelStep(
      auth,
      runId,
      writerBody,
      step.action,
      "openai",
      step.stepOrder,
      step.modelRole,
      limits,
      {
        ...retryOptions,
        revalidated_provider_result: replayedProviderResult
            ?.deterministicReplay
          ? replayedProviderResult
          : null,
      },
    );
    return markApplicationPacketStepAdvanced(
      auth,
      runId,
      workflowType,
      jobId,
      step.action,
      { writer: writer.parsed },
    );
  }

  if (step.action === "gemini-critique") {
    const canon = requirePacketResult(context.canon, "match-job-to-canon");
    const strategist = requirePacketResult(context.strategist, "score-job");
    const writer = requirePacketResult(context.writer, "openai-writer");
    const critiqueBody = critiquePacketBody(
      body,
      context.verifiedJob,
      canon.parsed,
      strategist.parsed,
      writer.parsed,
    );
    const critic = await runWorkflowModelStep(
      auth,
      runId,
      critiqueBody,
      step.action,
      "gemini",
      step.stepOrder,
      step.modelRole,
      limits,
      retryOptions,
    );
    return markApplicationPacketStepAdvanced(
      auth,
      runId,
      workflowType,
      jobId,
      step.action,
      { critic: critic.parsed },
    );
  }

  if (step.action === "openai-finalizer") {
    const canon = requirePacketResult(context.canon, "match-job-to-canon");
    const strategist = requirePacketResult(context.strategist, "score-job");
    const writer = requirePacketResult(context.writer, "openai-writer");
    const critic = requirePacketResult(context.critic, "gemini-critique");
    const finalizerBody = finalizerPacketBody(
      body,
      context.verifiedJob,
      canon.parsed,
      strategist.parsed,
      writer.parsed,
      critic.parsed,
    );
    const finalizer = await runWorkflowModelStep(
      auth,
      runId,
      finalizerBody,
      step.action,
      "openai",
      step.stepOrder,
      step.modelRole,
      limits,
      {
        ...retryOptions,
        revalidated_provider_result: replayedProviderResult
            ?.deterministicReplay
          ? replayedProviderResult
          : null,
      },
    );
    return markApplicationPacketStepAdvanced(
      auth,
      runId,
      workflowType,
      jobId,
      step.action,
      { finalizer: finalizer.parsed },
    );
  }

  if (step.action === "gemini-final-quality-check") {
    const canon = requirePacketResult(context.canon, "match-job-to-canon");
    const strategist = requirePacketResult(context.strategist, "score-job");
    const writer = requirePacketResult(context.writer, "openai-writer");
    const critic = requirePacketResult(context.critic, "gemini-critique");
    const finalizer = requirePacketResult(
      context.finalizer,
      "openai-finalizer",
    );
    const roleKitBody = finalizerPacketBody(
      body,
      context.verifiedJob,
      canon.parsed,
      strategist.parsed,
      writer.parsed,
      critic.parsed,
    );
    const qualityBody = finalQualityCheckPacketBody(
      body,
      context.verifiedJob,
      finalizer.parsed,
    );
    const finalQualityAuditContext: FinalQualityAuditContext = {
      verifiedJob: qualityRecord(qualityBody.job),
      approvedCareerFacts: Array.isArray(qualityBody.careerFacts)
        ? qualityBody.careerFacts
        : [],
      finalizer: finalizer.parsed,
    };
    const quality = replayedProviderResult || await runWorkflowModelStep(
      auth,
      runId,
      qualityBody,
      step.action,
      "gemini",
      step.stepOrder,
      step.modelRole,
      limits,
      {
        ...retryOptions,
        defer_completion: true,
        final_quality_audit_context: finalQualityAuditContext,
      },
    );
    const qualityAssessment = {
      ...normalizeFinalRoleKitQualityAssessment(
        quality.parsed,
        finalQualityAuditContext,
      ),
      auditor_model: quality.model,
      audited_at: new Date().toISOString(),
      quality_check_action: step.action,
    };
    const persisted = await saveGeneratedOutput(
      auth.supabase,
      auth.user.id,
      runId,
      workflowType,
      "openai",
      roleKitBody,
      finalizer.parsed,
      "finalized_packet",
      "OpenAI Finalizer",
      finalizer.model,
      qualityAssessment,
      strategistQualificationAssessment(strategist.parsed),
    );
    const qualityGate = String(qualityAssessment.quality_gate || "revise");
    const releaseReady = finalRoleKitReleaseReady(
      qualityAssessment,
      persisted.approvalStatus,
    );
    let browserTaskId: string | null = null;
    if (releaseReady) {
      await saveBrowserTask(
        auth.supabase,
        auth.user.id,
        runId,
        jobId,
        "Verify posting and prepare application safely",
      );
      browserTaskId = stableId("browser-task", runId, jobId);
      await activateCanonicalRoleKitApproval(
        auth.supabase,
        auth.user.id,
        persisted.approvalId,
        browserTaskId,
      );
    }
    const blockers = releaseReady
      ? []
      : qualityReviewBlockers(qualityAssessment, finalizer.parsed);
    await completeDeferredWorkflowStep(auth, runId, step);
    await upsertWorkflowRun(auth.supabase, auth.user.id, {
      id: runId,
      workflow_type: workflowType,
      status: "waiting_for_approval",
      job_id: jobId,
      current_step: releaseReady ? "approval-review" : "quality-review",
      total_steps: APPLICATION_PACKET_STEPS.length,
      error_code: releaseReady
        ? null
        : qualityGate === "block"
        ? "final_quality_gate_blocked"
        : "final_quality_gate_revise",
      error_message: releaseReady ? null : blockers.join("; "),
      output_record: await mergedRunOutput(auth.supabase, runId, {
        finalizer: finalizer.parsed,
        final_quality_check: qualityAssessment,
      }),
    });
    return {
      workflow_run_id: runId,
      status: "waiting_for_approval",
      job_id: jobId,
      step_executed: step.action,
      quality_gate: qualityGate,
      approval_id: persisted.approvalId,
      browser_task_id: browserTaskId,
      blockers,
      message: releaseReady
        ? "Independent quality review passed. The canonical approval and preparation-only browser task are ready for Matthew review."
        : "Independent quality review requires revision. Drafts were saved for review, but employer-use approval and browser preparation remain blocked.",
    };
  }

  throw new Error(
    `Unsupported application packet step: ${
      (step as { action: string }).action
    }`,
  );
}

async function runApplicationPacketOfficialVerificationStep(
  auth: AuthContext,
  runId: string,
  body: RequestBody,
  step: ApplicationPacketStepDefinition,
  options: Record<string, unknown>,
): Promise<ProviderResult | null> {
  const jobId = jobIdFromBody(body);
  if (!jobId) return null;
  const existing = await selectOne(auth.supabase, "jobcc_jobs", jobId).catch(
    () => null,
  ) as Record<string, unknown> | null;
  const existingRecord =
    existing?.record && typeof existing.record === "object" &&
      !Array.isArray(existing.record)
      ? existing.record as Record<string, unknown>
      : {};
  const candidate = mergeJobRecords(existingRecord, body.job || {});
  candidate.id = jobId;
  const sourceUrl = primarySourceUrl(candidate);
  const hasOfficialSource = Boolean(sourceUrl) && (
    String(candidate.source_type || "") === "official" ||
    String(candidate.source_status || "").includes("verified") ||
    /careers|jobs|greenhouse|lever|ashby|workday|smartrecruiters|icims|withwaymo/i
      .test(sourceUrl)
  );
  if (!hasOfficialSource || !hasPacketReadyContent(candidate)) return null;

  const now = new Date().toISOString();
  const result = completeJobSearchRecord({
    ...candidate,
    job_result_id: String(candidate.job_result_id || jobId),
    source_url: sourceUrl,
    official_source_url: candidate.official_source_url || sourceUrl,
    source_status: candidate.source_status || "official_verified",
    source_type: normalizeJobSourceType(candidate.source_type || "official"),
    active_status: candidate.active_status || "verified_active",
    link_health: candidate.link_health || "ok",
    date_checked: candidate.date_checked || now,
    captured_at: candidate.captured_at || now,
    last_verified_at: now,
    source_verification_notes: candidate.source_verification_notes ||
      "Verified by deterministic official URL capture with full posting text, parsed Job Brief, timestamp, and link health. Provider grounding metadata was unavailable or not needed for this source-first packet step.",
  });
  const output = {
    schema_version: "job-command-center-v2",
    run_id: runId,
    job_id: jobId,
    model_role: "Workflow Orchestrator",
    confidence: Number(result.verification_confidence || 0.95),
    approval_required_before_external_action: true,
    result,
    grounding_metadata: {
      webSearchQueries: [],
      groundingChunks: [],
      groundingSupports: [],
      urlContextMetadata: null,
    },
    grounding_metadata_status: "unavailable_provider_response",
    grounding_source_urls: uniqueStrings(
      [sourceUrl, result.official_source_url, result.ats_source_url].filter(
        Boolean,
      ),
    ),
    grounding_queries: [],
    grounding_chunks_count: 0,
    url_context_used: false,
    google_search_used: false,
    source_verified_by: "official_url_capture",
    source_verification_notes:
      "Provider grounding metadata was not returned for this packet step; source verification is backed by official URL capture, durable posting text, parsed brief, timestamp, and link health.",
  };
  const validationErrors = validateAgainstSchema(
    output,
    schemaForAction("verify-job-source"),
  );
  if (validationErrors.length) {
    throw new ValidationFailure(
      "Local official-source verification output failed schema validation.",
      JSON.stringify(output),
      validationErrors,
    );
  }

  const stepPrimaryId = String(
    options.step_primary_id ||
      stableId("workflow-step", runId, "verify-job-source", step.stepOrder),
  );
  const stepId = String(
    options.step_id || `${runId}-${step.stepOrder}-verify-job-source`,
  );
  const idempotencyKey = String(
    options.idempotency_key ||
      stableId("idem", runId, "verify-job-source", step.stepOrder),
  );
  const agentRunId = stableId(
    "agent-run",
    runId,
    "verify-job-source",
    step.stepOrder,
  );
  const artifactId = stableId(
    "artifact",
    runId,
    "verify-job-source",
    inputVersion({ ...body, job: result }),
    idempotencyKey,
  );
  await upsertWorkflowStep(auth.supabase, auth.user.id, {
    id: stepPrimaryId,
    run_id: runId,
    step_id: stepId,
    step_order: step.stepOrder,
    step_type: "verify-job-source",
    model_role: "Workflow Orchestrator",
    provider: "local",
    function_name: "verify-job-source",
    status: "completed",
    error: null,
    attempt_count: Number(options.attempt_count || 1),
    max_attempts: Number(options.max_attempts || 1),
    input_artifact_ids: [],
    output_artifact_ids: [artifactId],
    completed_at: now,
    token_usage: {},
    search_query_count: 0,
    actual_model: "local-official-source-verifier",
    provider_request_id: "",
    latency_ms: 0,
    estimated_cost: 0,
    actual_cost: 0,
    cost: 0,
    idempotency_key: idempotencyKey,
    record: {
      request_body: safeWorkflowRequest(body),
      official_url_capture: true,
      source_verified_by: "official_url_capture",
      grounding_metadata_status: "unavailable_provider_response",
    },
  });
  await saveWorkflowArtifact(auth.supabase, auth.user.id, {
    id: artifactId,
    run_id: runId,
    step_id: stepId,
    artifact_type: "verify-job-source",
    schema_name: schemaNameForAction("verify-job-source"),
    schema_version: "job-command-center-v2",
    job_id: jobId,
    status: "validated",
    idempotency_key: stableId(
      "artifact-idem",
      runId,
      "verify-job-source",
      inputVersion({ ...body, job: result }),
      idempotencyKey,
    ),
    record: {
      output,
      grounding: output.grounding_metadata,
      usage: {},
      validation: { passed: true, repaired: false },
    },
    raw_output: JSON.stringify(output, null, 2),
  });
  await criticalUpsert(auth.supabase, "jobcc_agent_runs", {
    id: agentRunId,
    user_id: auth.user.id,
    workflow_type: "verify-job-source",
    model_role: "Workflow Orchestrator",
    function_name: "verify-job-source",
    status: "complete",
    job_id: jobId,
    started_at: now,
    completed_at: now,
    record: {
      request: redactRequest(body),
      output,
      provider: "local",
      workflow_run_id: runId,
      workflow_step_id: stepPrimaryId,
      source_verified_by: "official_url_capture",
    },
  });
  await criticalUpsert(auth.supabase, "jobcc_agent_steps", {
    id: `${agentRunId}-step-2`,
    user_id: auth.user.id,
    run_id: agentRunId,
    step_index: 2,
    status: "completed",
    label:
      "Verified official source from captured posting without provider call.",
    record: {
      label:
        "Verified official source from captured posting without provider call.",
      status: "completed",
      step_type: "save_output",
      model_role: "Workflow Orchestrator",
      provider: "local",
      action: "verify-job-source",
      workflow_run_id: runId,
      workflow_step_id: stepPrimaryId,
      source_verified_by: "official_url_capture",
    },
  });
  return {
    model: "local-official-source-verifier",
    providerRequestId: "",
    text: JSON.stringify(output),
    parsed: output,
    raw: output,
    grounding: output.grounding_metadata,
    usage: {},
    searchQueryCount: 0,
    latencyMs: 0,
    repaired: false,
    validationErrors: [],
  };
}

async function applicationPacketContext(
  auth: AuthContext,
  runId: string,
  body: RequestBody,
) {
  const verification = await completedStepResult(
    auth.supabase,
    runId,
    "verify-job-source",
    1,
    "",
  );
  const verifiedJob = mergeJobRecords(
    body.job || {},
    (verification?.parsed.result || {}) as Record<string, unknown>,
  );
  return {
    verification,
    verifiedJob,
    canon: await completedStepResult(
      auth.supabase,
      runId,
      "match-job-to-canon",
      2,
      "",
    ),
    strategist: await completedStepResult(
      auth.supabase,
      runId,
      "score-job",
      3,
      "",
    ),
    writer: await completedStepResult(
      auth.supabase,
      runId,
      "openai-writer",
      4,
      "",
    ),
    critic: await completedStepResult(
      auth.supabase,
      runId,
      "gemini-critique",
      5,
      "",
    ),
    finalizer: await completedStepResult(
      auth.supabase,
      runId,
      "openai-finalizer",
      6,
      "",
    ),
  };
}

function requirePacketResult(
  result: ProviderResult | null,
  action: string,
): ProviderResult {
  if (!result) {
    throw new WorkflowStop(
      "waiting_for_dependency",
      `missing_${action}`,
      `Cannot run the next packet step because ${action} has not completed.`,
      { missing_step: action },
    );
  }
  return result;
}

function strategistPacketBody(
  body: RequestBody,
  verifiedJob: Record<string, unknown>,
  canon: Record<string, unknown>,
): RequestBody {
  const factIds = arrayFromUnknown(canon.matched_fact_ids);
  const laneId = String(canon.resume_lane_id || "");
  return compactPacketStageBody(body, verifiedJob, factIds, laneId, [
    "Career Canon match output:",
    JSON.stringify(
      compactPacketRecord(canon, [
        "matched_fact_ids",
        "claims_used",
        "prohibited_fact_matches",
        "needs_review_fact_matches",
        "requirement_fact_matches",
        "gaps",
        "risks",
        "recommended_lane",
        "resume_lane_id",
        "resume_lane_name",
      ]),
      null,
      2,
    ),
  ]);
}

function writerPacketBody(
  body: RequestBody,
  verifiedJob: Record<string, unknown>,
  canon: Record<string, unknown>,
  strategist: Record<string, unknown>,
): RequestBody {
  const factIds = uniqueStrings([
    ...arrayFromUnknown(canon.matched_fact_ids),
    ...arrayFromUnknown(strategist.matched_fact_ids),
    ...arrayFromUnknown(strategist.facts_to_emphasize),
  ]);
  const laneId = String(
    strategist.resume_lane_id || canon.resume_lane_id || "",
  );
  return compactPacketStageBody(body, verifiedJob, factIds, laneId, [
    "Strategist evidence map:",
    JSON.stringify(
      compactPacketRecord(strategist, [
        "fit_score",
        "opportunity_score",
        "confidence_score",
        "qualification_match_score",
        "qualification_strength_score",
        "must_have_coverage_score",
        "qualification_gap_risk_score",
        "qualification_strengths",
        "transferable_qualifications",
        "qualification_gaps",
        "qualification_unknowns",
        "qualification_summary",
        "requirement_fact_matches",
        "matched_fact_ids",
        "claims_used",
        "unsupported_claims",
        "prohibited_fact_matches",
        "needs_review_fact_matches",
        "facts_to_emphasize",
        "facts_to_reduce",
        "risks",
        "next_steps",
        "resume_lane_id",
        "resume_lane_name",
        "location_category",
        "relocation_verdict",
        "compensation_adjusted_for_location",
        "compensation_questions_to_verify",
      ]),
      null,
      2,
    ),
  ]);
}

function critiquePacketBody(
  body: RequestBody,
  verifiedJob: Record<string, unknown>,
  canon: Record<string, unknown>,
  strategist: Record<string, unknown>,
  writer: Record<string, unknown>,
): RequestBody {
  const factIds = uniqueStrings([
    ...arrayFromUnknown(canon.matched_fact_ids),
    ...arrayFromUnknown(strategist.matched_fact_ids),
    ...arrayFromUnknown(writer.matched_fact_ids),
  ]);
  const laneId = String(
    strategist.resume_lane_id || canon.resume_lane_id || "",
  );
  return compactPacketStageBody(body, verifiedJob, factIds, laneId, [
    "Strategist qualification summary:",
    String(strategist.qualification_summary || ""),
    "Known qualification gaps:",
    JSON.stringify(strategist.qualification_gaps || [], null, 2),
    "Writer output:",
    JSON.stringify(writer, null, 2),
  ]);
}

function finalizerPacketBody(
  body: RequestBody,
  verifiedJob: Record<string, unknown>,
  canon: Record<string, unknown>,
  strategist: Record<string, unknown>,
  writer: Record<string, unknown>,
  critic: Record<string, unknown>,
): RequestBody {
  const factIds = uniqueStrings([
    ...arrayFromUnknown(canon.matched_fact_ids),
    ...arrayFromUnknown(strategist.matched_fact_ids),
    ...arrayFromUnknown(writer.matched_fact_ids),
  ]);
  const laneId = String(
    strategist.resume_lane_id || canon.resume_lane_id || "",
  );
  return compactPacketStageBody(body, verifiedJob, factIds, laneId, [
    "Strategist qualification summary:",
    String(strategist.qualification_summary || ""),
    "Writer output:",
    JSON.stringify(writer, null, 2),
    "Gemini critique:",
    JSON.stringify(critic, null, 2),
  ]);
}

export function finalQualityCheckPacketBody(
  body: RequestBody,
  verifiedJob: Record<string, unknown>,
  finalizer: Record<string, unknown>,
): RequestBody {
  return {
    job: compactJobForPacket(verifiedJob),
    careerFacts: approvedResumeFactsForFinalQuality(
      Array.isArray(body.careerFacts) ? body.careerFacts : [],
    ),
    prohibitedFacts: prohibitedFactsForFinalQuality(
      Array.isArray(body.prohibitedFacts) ? body.prohibitedFacts : [],
    ),
    sourceText: "",
    prompt: "",
    consent_gates: body.consent_gates,
    notes: [
      "Blind final audit: no earlier critique, qualification score, prior quality score, approval state, or Finalizer commentary is supplied.",
      `Independent final quality threshold: ${FINAL_ROLE_KIT_QUALITY_THRESHOLD}/100 for each resume.`,
      "Return exactly five rubric_evidence rows for each resume. Each row must name one rubric component, quote the exact posting text judged when the component evaluates role evidence, quote the exact resume text used for the award, list only supporting approved fact IDs, state points awarded, and explain the award.",
      "Judge how effectively the current resume selects, positions, and substantiates the strongest approved evidence available for this posting. Genuine candidate qualification gaps stay separate and must not be double-counted as document-quality defects.",
      "Finalized documents and document-local claim evidence to audit:",
      JSON.stringify(finalQualityAuditView(finalizer), null, 2),
    ].join("\n"),
  };
}

function finalQualityAuditView(
  finalizer: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    FINALIZED_PACKET_DOCUMENT_TYPES.map((documentType) => [
      documentType,
      finalizer[documentType],
    ]),
  );
}

function approvedResumeFactsForFinalQuality(
  facts: Array<Record<string, unknown>>,
): Array<Record<string, unknown>> {
  return facts
    .filter((fact) => {
      if (String(fact.status || "") !== "verified") return false;
      const usableFor = arrayFromUnknown(fact.usable_for);
      return usableFor.length === 0 || usableFor.includes("resume") ||
        usableFor.includes("applications");
    })
    .map((fact) => ({
      fact_id: fact.fact_id || fact.id,
      category: fact.category,
      canonical_claim: fact.canonical_claim,
      approved_variants: arrayFromUnknown(fact.approved_variants),
      usable_for: arrayFromUnknown(fact.usable_for),
      source_document_ids: arrayFromUnknown(fact.source_document_ids),
      status: "verified",
    }));
}

function prohibitedFactsForFinalQuality(
  facts: Array<Record<string, unknown>>,
): Array<Record<string, unknown>> {
  return facts.map((fact) => ({
    fact_id: fact.fact_id || fact.id,
    canonical_claim: fact.canonical_claim,
    prohibited_variants: arrayFromUnknown(fact.prohibited_variants),
    status: fact.status || "prohibited",
  }));
}

function compactPacketStageBody(
  body: RequestBody,
  verifiedJob: Record<string, unknown>,
  preferredFactIds: string[],
  selectedLaneId: string,
  stageNotes: string[],
): RequestBody {
  const lanes = selectPacketResumeLanes(
    Array.isArray(body.resumeLanes) ? body.resumeLanes : [],
    selectedLaneId,
  );
  const preferredDocumentIds = uniqueStrings(
    lanes.flatMap((lane) => [
      ...arrayFromUnknown(lane.source_document_ids),
      ...arrayFromUnknown(lane.base_resume_source_ids),
      ...arrayFromUnknown(lane.resume_source_document_ids),
    ]),
  );
  const userNotes = String(body.notes || "")
    .split(
      /\n(?:Verified posting record|Career Canon match output|Strategist output|Writer output|Gemini critique):/,
    )[0]
    .trim()
    .slice(0, 2_000);

  return {
    ...body,
    job: compactJobForPacket(verifiedJob),
    jobs: undefined,
    resumeBank: undefined,
    careerFacts: selectPacketCareerFacts(
      Array.isArray(body.careerFacts) ? body.careerFacts : [],
      preferredFactIds,
    ),
    sourceDocuments: selectPacketSourceDocuments(
      Array.isArray(body.sourceDocuments) ? body.sourceDocuments : [],
      preferredDocumentIds,
    ),
    resumeLanes: lanes,
    sourceText: "",
    prompt: "",
    notes: [userNotes, ...stageNotes].filter(Boolean).join("\n"),
  };
}

function compactPacketRecord(
  record: Record<string, unknown>,
  keys: string[],
): Record<string, unknown> {
  return Object.fromEntries(
    keys.map((key) => [key, record[key]]).filter(([, value]) =>
      value !== undefined && value !== null && value !== ""
    ),
  );
}

async function markApplicationPacketStepAdvanced(
  auth: AuthContext,
  runId: string,
  workflowType: string,
  jobId: string,
  stepAction: string,
  outputPatch: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const next = await nextApplicationPacketStep(auth, runId);
  await upsertWorkflowRun(auth.supabase, auth.user.id, {
    id: runId,
    workflow_type: workflowType,
    status: next.definition ? "queued" : "waiting_for_approval",
    job_id: jobId,
    current_step: next.definition ? next.definition.action : "approval-review",
    total_steps: APPLICATION_PACKET_STEPS.length,
    output_record: await mergedRunOutput(auth.supabase, runId, outputPatch),
    last_heartbeat_at: new Date().toISOString(),
  });
  return {
    workflow_run_id: runId,
    status: next.definition ? "queued" : "waiting_for_approval",
    job_id: jobId,
    step_executed: stepAction,
    next_step: next.definition?.action || "approval-review",
    message: next.definition
      ? "One durable packet step completed. Call advance-workflow for the next step."
      : "All durable packet steps completed; approval review is next.",
  };
}

async function blockApplicationPacket(
  auth: AuthContext,
  runId: string,
  workflowType: string,
  jobId: string,
  currentStep: string,
  errorCode: string,
  message: string,
  blockers: string[],
  outputPatch: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  await saveManualReviewApproval(
    auth.supabase,
    auth.user.id,
    runId,
    workflowType,
    jobId,
    message,
    JSON.stringify(outputPatch, null, 2),
    blockers,
  );
  await upsertWorkflowRun(auth.supabase, auth.user.id, {
    id: runId,
    workflow_type: workflowType,
    status: "waiting_for_approval",
    job_id: jobId,
    current_step: currentStep,
    error_code: errorCode,
    error_message: blockers.join("; "),
    output_record: await mergedRunOutput(auth.supabase, runId, outputPatch),
  });
  return {
    workflow_run_id: runId,
    status: "waiting_for_approval",
    job_id: jobId,
    blockers,
    message,
  };
}

async function failApplicationPacketStep(
  auth: AuthContext,
  runId: string,
  body: RequestBody,
  workflowType: string,
  step: ApplicationPacketStepDefinition,
  error: unknown,
): Promise<Record<string, unknown>> {
  const message = error instanceof Error ? error.message : String(error);
  const preProviderStop = error instanceof WorkflowStop &&
    ["call_limit", "cost_limit"].includes(error.code);
  const status: WorkflowStatus = preProviderStop
    ? "failed_preflight"
    : workflowStatusForError(error);
  const validationErrors = error instanceof ValidationFailure
    ? error.validationErrors
    : [];
  const stepId = stableId(
    "workflow-step",
    runId,
    step.action,
    step.stepOrder,
  );
  const currentStep = await selectOne(
    auth.supabase,
    "jobcc_workflow_steps",
    stepId,
  ).catch(() => null) as Record<string, unknown> | null;
  const currentRecord = currentStep?.record &&
      typeof currentStep.record === "object" &&
      !Array.isArray(currentStep.record)
    ? currentStep.record as Record<string, unknown>
    : {};
  const currentAttemptCount = Number(currentStep?.attempt_count || 0);
  const currentMaxAttempts = Number(
    currentStep?.max_attempts || step.maxAttempts,
  );
  const preflightRetryExtensionUsed =
    currentRecord.preflight_retry_extension_used === true ||
    (preProviderStop && currentAttemptCount > currentMaxAttempts);
  const retryError = {
    message,
    validation_errors: validationErrors,
    workflow_stop: error instanceof WorkflowStop ? error.code : null,
    provider_outcome: preProviderStop ? "provider_not_called" : null,
  };
  const retryDecision = retryWindowForFailedStep(
    {
      status,
      provider: step.provider,
      model_role: step.modelRole,
      provider_request_id: currentStep?.provider_request_id,
      record: {
        ...currentRecord,
        current_provider_request_count: preProviderStop
          ? 0
          : currentRecord.current_provider_request_count,
        preflight_retry_extension_used: preflightRetryExtensionUsed,
      },
      error: retryError,
    },
    currentAttemptCount,
    currentMaxAttempts,
  );
  const jobId = jobIdFromBody(body);
  await upsertWorkflowStep(auth.supabase, auth.user.id, {
    id: stepId,
    run_id: runId,
    step_id: `${runId}-${step.stepOrder}-${step.action}`,
    step_order: step.stepOrder,
    step_type: step.action,
    model_role: step.modelRole,
    provider: step.provider,
    function_name: step.action,
    status,
    attempt_count: currentAttemptCount,
    max_attempts: Math.max(
      currentMaxAttempts,
      retryDecision.maxAttempts,
      currentAttemptCount,
    ),
    error: {
      message,
      validation_errors: validationErrors,
      workflow_stop: error instanceof WorkflowStop ? error.code : null,
      provider_outcome: retryDecision.providerOutcome,
      manual_reconciliation_required:
        retryDecision.manualReconciliationRequired,
    },
    record: {
      ...currentRecord,
      current_provider_request_count: preProviderStop
        ? 0
        : currentRecord.current_provider_request_count,
      preflight_retry_extension_used: preflightRetryExtensionUsed,
    },
    completed_at: new Date().toISOString(),
  });
  if (
    error instanceof ValidationFailure &&
    actionCreatesManualReviewApproval(step.action)
  ) {
    await saveManualReviewApproval(
      auth.supabase,
      auth.user.id,
      runId,
      step.action,
      jobId,
      message,
      error.rawText,
      error.validationErrors,
    );
  }
  await upsertWorkflowRun(auth.supabase, auth.user.id, {
    id: runId,
    workflow_type: workflowType,
    status,
    job_id: jobId,
    current_step: step.action,
    error_code: error instanceof WorkflowStop ? error.code : status,
    error_message: message,
    output_record: error instanceof WorkflowStop
      ? error.details
      : await mergedRunOutput(auth.supabase, runId, {
        error: message,
        failed_step: step.action,
      }),
  });
  return {
    workflow_run_id: runId,
    status,
    job_id: jobId,
    failed_step: step.action,
    error: message,
    retry_available: retryDecision.allowed,
    provider_outcome: retryDecision.providerOutcome,
    manual_reconciliation_required: retryDecision.manualReconciliationRequired,
  };
}

async function mergedRunOutput(
  supabase: SupabaseClient,
  runId: string,
  patch: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const run = await selectOne(supabase, "jobcc_workflow_runs", runId).catch(
    () => null,
  ) as Record<string, unknown> | null;
  return {
    ...((run?.output_record || {}) as Record<string, unknown>),
    ...patch,
  };
}

function workflowStatusForError(error: unknown): WorkflowStatus {
  if (error instanceof WorkflowStop) return error.status;
  if (error instanceof ValidationFailure) return "failed_validation";
  const message = error instanceof Error ? error.message : String(error);
  if (
    /write failed|update failed|upsert failed|select failed|storage|persist/i
      .test(message)
  ) return "failed_storage";
  return "failed_provider";
}

function isFailedStepStatus(status: string): boolean {
  return [
    "failed",
    "failed_validation",
    "failed_provider",
    "failed_storage",
    "failed_cost_limit",
    "failed_error_limit",
  ].includes(status) || /^failed/i.test(status);
}

async function startControlledSearchWorkflow(
  auth: AuthContext,
  body: RequestBody,
  workflowType: string,
): Promise<Record<string, unknown>> {
  const requestedRunId = String(body.workflow_run_id || body.run_id || "")
    .trim();
  const runId = requestedRunId || stableId(
    "workflow",
    workflowType,
    new Date().toISOString(),
    crypto.randomUUID(),
  );
  const searchRunId = String(body.search_run_id || stableId("search", runId));
  const limits = controlledLimits(body);
  const tasks = buildSearchTasks(
    runId,
    searchRunId,
    body,
    limits.maxScoutTasks,
  );
  const estimatedRunCost = estimateSearchRunCost(tasks.length, limits);
  if (workflowType === "run-market-sweep" && !body.approved) {
    await upsertWorkflowRun(auth.supabase, auth.user.id, {
      id: runId,
      workflow_type: workflowType,
      status: "waiting_for_user",
      trigger_type: "manual",
      search_run_id: searchRunId,
      current_step: "approval-required",
      total_steps: tasks.length * 5,
      cost_estimate: estimatedRunCost,
      actual_cost: 0,
      max_estimated_cost: limits.maximumEstimatedCostPerRun,
      max_actual_cost: limits.maximumActualCostPerRun,
      max_error_rate: limits.maximumErrorRate,
      input_record: {
        ...redactRequest(body),
        request_body: safeWorkflowRequest(body),
        limits,
        tasks: tasks.length,
        approval_required: true,
      },
      output_record: sweepApprovalEstimate(tasks, limits, estimatedRunCost),
    });
    for (const task of tasks) {
      await upsertSearchTask(auth.supabase, auth.user.id, task);
    }
    await upsertSearchCoverage(
      auth.supabase,
      auth.user.id,
      initialCoverage(runId, searchRunId, tasks, body),
    );
    await upsertSearchRunReceipt(
      auth.supabase,
      auth.user.id,
      runId,
      searchRunId,
      body,
      {
        status: "waiting_for_user",
        tasks_queued: tasks.length,
        estimated_cost: estimatedRunCost,
      },
    );
    return {
      workflow_run_id: runId,
      search_run_id: searchRunId,
      status: "waiting_for_user",
      estimated_cost: estimatedRunCost,
      message: "Controlled sweep prepared and waiting for Matthew approval.",
    };
  }

  await upsertWorkflowRun(auth.supabase, auth.user.id, {
    id: runId,
    workflow_type: workflowType,
    status: "queued",
    trigger_type: "manual",
    parent_run_id: null,
    search_run_id: searchRunId,
    job_id: null,
    current_step: "search-worker",
    total_steps: tasks.length * 5,
    started_at: new Date().toISOString(),
    cost_estimate: 0,
    actual_cost: 0,
    max_estimated_cost: limits.maximumEstimatedCostPerRun,
    max_actual_cost: limits.maximumActualCostPerRun,
    max_error_rate: limits.maximumErrorRate,
    input_record: {
      ...redactRequest(body),
      request_body: safeWorkflowRequest(body),
      limits,
      tasks: tasks.length,
    },
  });
  for (const task of tasks) {
    await upsertSearchTask(auth.supabase, auth.user.id, task);
  }
  await upsertSearchCoverage(
    auth.supabase,
    auth.user.id,
    initialCoverage(runId, searchRunId, tasks, body),
  );
  await upsertSearchRunReceipt(
    auth.supabase,
    auth.user.id,
    runId,
    searchRunId,
    body,
    {
      status: "queued",
      tasks_queued: tasks.length,
      estimated_cost: estimatedRunCost,
    },
  );

  const backgroundPromise = processSearchQueue(
    auth,
    runId,
    searchRunId,
    body,
    limits,
  );
  const runtime = globalThis as unknown as {
    EdgeRuntime?: { waitUntil?: (promise: Promise<unknown>) => void };
  };
  if (body.run_synchronously || !runtime.EdgeRuntime?.waitUntil) {
    await backgroundPromise;
  } else {
    runtime.EdgeRuntime.waitUntil(backgroundPromise);
  }
  return {
    workflow_run_id: runId,
    search_run_id: searchRunId,
    status: body.run_synchronously ? "worker_finished" : "queued",
    tasks_queued: tasks.length,
    estimated_cost: estimatedRunCost,
    message:
      "Controlled search workflow accepted. Poll workflow-status or call search-worker to resume the durable queue.",
  };
}

async function processSearchQueue(
  auth: AuthContext,
  runId: string,
  searchRunId: string,
  body: RequestBody,
  limits: ReturnType<typeof controlledLimits>,
) {
  let stopped: WorkflowStop | null = null;
  const invocationLimit = searchTasksPerInvocation(body, limits);
  let processedThisInvocation = 0;
  try {
    await recoverStaleSearchTasks(auth.supabase, runId);
    await upsertWorkflowRun(auth.supabase, auth.user.id, {
      id: runId,
      workflow_type: String(body.workflow_type || "start-controlled-search"),
      status: "running",
      search_run_id: searchRunId,
      current_step: "gemini-scout",
      last_heartbeat_at: new Date().toISOString(),
    });
    const workerCount = Math.max(
      1,
      Math.min(limits.maxConcurrentScoutTasks, limits.maxScoutTasks),
    );
    await Promise.all(Array.from({ length: workerCount }, async (_, index) => {
      const workerId = stableId("worker", runId, index, Date.now());
      while (!stopped) {
        if (processedThisInvocation >= invocationLimit) break;
        await assertNotCancelled(auth, runId, "claiming search task");
        await enforceErrorRate(auth, runId, limits);
        if (processedThisInvocation >= invocationLimit) break;
        const task = await claimNextSearchTask(auth.supabase, runId, workerId);
        if (!task) break;
        try {
          await processSearchTask(
            auth,
            runId,
            searchRunId,
            body,
            task,
            limits,
            workerId,
          );
          processedThisInvocation += 1;
        } catch (error) {
          if (error instanceof WorkflowStop) {
            await pauseSearchTaskForWorkflowStop(
              auth.supabase,
              String(task.id),
              error,
              workerId,
            );
            stopped = error;
            break;
          }
          await failSearchTask(auth.supabase, String(task.id), error);
          processedThisInvocation += 1;
          await recordWorkflowErrorStep(
            auth,
            runId,
            "search-worker",
            error,
            task,
          ).catch((stepError) => {
            console.error("search-worker error step write failed", stepError);
          });
          await updateCoverageFromDb(auth, runId, searchRunId);
          await enforceErrorRate(auth, runId, limits);
        }
      }
    }));

    await updateCoverageFromDb(auth, runId, searchRunId);
    if (stopped) throw stopped;
    await finalizeSearchWorkflowIfDone(auth, runId, searchRunId, body);
    const remainingTasks = await selectMany(
      auth.supabase,
      "jobcc_search_tasks",
      "run_id",
      runId,
    ) as Array<Record<string, unknown>>;
    const hasRemainingWork = remainingTasks.some((task) =>
      ["queued", "claimed", "running"].includes(String(task.status || ""))
    );
    if (processedThisInvocation >= invocationLimit && hasRemainingWork) {
      await upsertWorkflowRun(auth.supabase, auth.user.id, {
        id: runId,
        workflow_type: String(body.workflow_type || "start-controlled-search"),
        status: "running",
        search_run_id: searchRunId,
        current_step: "search-worker-ready",
        output_record: await mergedRunOutput(auth.supabase, runId, {
          processed_this_invocation: processedThisInvocation,
          max_tasks_per_invocation: invocationLimit,
          message:
            "Processed a bounded search-worker chunk. Call search-worker again to continue.",
        }),
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (error instanceof WorkflowStop) {
      await upsertWorkflowRun(auth.supabase, auth.user.id, {
        id: runId,
        workflow_type: String(body.workflow_type || "start-controlled-search"),
        status: error.status,
        search_run_id: searchRunId,
        current_step: error.code,
        error_code: error.code,
        error_message: message,
        output_record: error.details,
      }).catch(console.error);
      await updateCoverageFromDb(auth, runId, searchRunId).catch(console.error);
      return;
    }
    await upsertWorkflowRun(auth.supabase, auth.user.id, {
      id: runId,
      workflow_type: String(body.workflow_type || "start-controlled-search"),
      status: error instanceof ValidationFailure
        ? "failed_validation"
        : "failed_provider",
      search_run_id: searchRunId,
      current_step: "failed",
      error_code: error instanceof ValidationFailure
        ? "failed_validation"
        : "workflow_error",
      error_message: message,
    }).catch(console.error);
  }
}

function searchTasksPerInvocation(
  body: RequestBody,
  limits: ReturnType<typeof controlledLimits>,
): number {
  const rawLimits = body.limits || {};
  const requested = Number(
    rawLimits.max_search_tasks_per_invocation ??
      rawLimits.maximum_search_tasks_per_invocation,
  );
  if (Number.isFinite(requested) && requested > 0) {
    return Math.min(Math.floor(requested), limits.maxScoutTasks);
  }
  return limits.maxScoutTasks;
}

async function runWorkflowModelStep(
  auth: AuthContext,
  runId: string,
  body: RequestBody,
  action: string,
  provider: Provider,
  stepOrder: number,
  modelRole: string,
  limits: ReturnType<typeof controlledLimits>,
  options: Record<string, unknown> = {},
): Promise<ProviderResult> {
  const deferCompletion = options.defer_completion === true;
  const schemaName = schemaNameForAction(action);
  const schema = schemaForAction(action);
  const prompt = buildPrompt(
    action,
    { ...body, workflow_run_id: runId },
    runId,
    schemaName,
  );
  const stepPrimaryId = String(
    options.step_primary_id ||
      (options.idempotency_key
        ? stableId(
          "workflow-step",
          runId,
          action,
          stepOrder,
          options.idempotency_key,
        )
        : stableId("workflow-step", runId, action, stepOrder)),
  );
  const stepId = String(options.step_id || `${runId}-${stepOrder}-${action}`);
  const agentRunId = String(
    options.agent_run_id ||
      (options.idempotency_key
        ? stableId(
          "agent-run",
          runId,
          action,
          stepOrder,
          options.idempotency_key,
        )
        : stableId("agent-run", runId, action, stepOrder)),
  );
  const existingAttempt = Number(options.attempt_count || 0);
  const attemptCount = existingAttempt > 0 ? existingAttempt : 1;
  const validationRepairCandidate = options.validation_repair_candidate &&
      typeof options.validation_repair_candidate === "object" &&
      !Array.isArray(options.validation_repair_candidate)
    ? options.validation_repair_candidate as ValidationRepairCandidate
    : null;
  const revalidatedProviderResult = options.revalidated_provider_result &&
      typeof options.revalidated_provider_result === "object" &&
      !Array.isArray(options.revalidated_provider_result) &&
      (options.revalidated_provider_result as ProviderResult)
          .deterministicReplay === true
    ? options.revalidated_provider_result as ProviderResult
    : null;
  const deterministicReplay = Boolean(revalidatedProviderResult);
  const priorProviderRequestCount = Math.max(
    0,
    Number(options.prior_provider_request_count || 0),
  );
  const priorProviderRequestIds = uniqueStrings(
    arrayFromUnknown(options.prior_provider_request_ids),
  );
  const providerRetryCallAllowance = Math.max(
    0,
    Math.floor(Number(options.provider_retry_call_allowance || 0)),
  );
  const preflightRetryExtensionUsed =
    options.preflight_retry_extension_used === true;
  const inputArtifactIds = uniqueStrings([
    ...arrayFromUnknown(options.input_artifact_ids),
    validationRepairCandidate?.artifactId,
    revalidatedProviderResult?.replaySourceArtifactId,
  ]);
  const estimatedCost = deterministicReplay ? 0 : estimateModelCost(action);
  await assertNotCancelled(auth, runId, action);
  if (!deterministicReplay) {
    await enforceCostLimit(auth, runId, action, estimatedCost, limits);
  }
  const remainingProviderRequests = deterministicReplay
    ? 0
    : await enforceCallLimit(
      auth,
      runId,
      action,
      limits,
      stepPrimaryId,
      Math.max(
        validationRepairCandidate ? 1 : 0,
        providerRetryCallAllowance,
      ),
    );
  await upsertWorkflowStep(auth.supabase, auth.user.id, {
    id: stepPrimaryId,
    run_id: runId,
    step_id: stepId,
    step_order: stepOrder,
    step_type: action,
    model_role: modelRole,
    provider,
    function_name: action,
    status: "running",
    attempt_count: attemptCount,
    max_attempts: Number(options.max_attempts || 2),
    input_artifact_ids: inputArtifactIds,
    output_artifact_ids: [],
    started_at: new Date().toISOString(),
    estimated_cost: estimatedCost,
    idempotency_key: String(
      options.idempotency_key || stableId("idem", runId, action, stepOrder),
    ),
    record: {
      request_body: safeWorkflowRequest(body),
      task_id: options.task_id || null,
      note: options.note || "",
      provider_request_count: priorProviderRequestCount,
      provider_request_ids: priorProviderRequestIds,
      current_provider_request_count: 0,
      preflight_retry_extension_used: preflightRetryExtensionUsed,
      validation_repair_source_artifact_id:
        validationRepairCandidate?.artifactId || null,
      deterministic_revalidation_source_artifact_id:
        revalidatedProviderResult?.replaySourceArtifactId || null,
    },
  });
  await logAgentRun(
    auth.supabase,
    auth.user.id,
    agentRunId,
    action,
    modelRole,
    provider,
    "running",
    body,
  );
  await logAgentStep(
    auth.supabase,
    auth.user.id,
    agentRunId,
    0,
    "auth_and_prompt",
    modelRole,
    provider,
    action,
    "completed",
    "Authenticated allowed user and built schema-bound prompt.",
    {
      workflow_run_id: runId,
      workflow_step_id: stepPrimaryId,
      durable_step_order: stepOrder,
    },
  );
  let result: ProviderResult;
  try {
    const structuredProviderArgs = {
      auth,
      action,
      provider,
      prompt,
      schema,
      schemaName,
      runId,
      agentRunId,
      modelRole,
      body,
      useGrounding: shouldUseGeminiGrounding(action),
      maxProviderRequests: remainingProviderRequests,
      finalQualityAuditContext: options.final_quality_audit_context &&
          typeof options.final_quality_audit_context === "object" &&
          !Array.isArray(options.final_quality_audit_context)
        ? options.final_quality_audit_context as FinalQualityAuditContext
        : undefined,
    };
    result = revalidatedProviderResult ||
      (validationRepairCandidate
        ? await runStructuredProviderRepair({
          ...structuredProviderArgs,
          repairCandidate: validationRepairCandidate,
          repairAttempt: attemptCount,
        })
        : await runStructuredProvider(structuredProviderArgs));
    if (action === "score-job") {
      result = {
        ...result,
        parsed: normalizeStrategistScore(result.parsed),
      };
    }
  } catch (error) {
    const status = workflowStatusForError(error);
    const providerAccounting = providerAccountingFromError(error);
    const providerRequestCount = providerAccounting.providerRequestCount;
    const cumulativeProviderRequestCount = priorProviderRequestCount +
      providerRequestCount;
    const cumulativeProviderRequestIds = uniqueStrings([
      ...priorProviderRequestIds,
      ...providerAccounting.providerRequestIds,
    ]);
    const failureEstimatedCost = roundMoney(
      estimatedCost * providerRequestCount,
    );
    const failureActualCost = actualModelCost(
      provider,
      action,
      providerAccounting.usage,
      providerAccounting.searchQueryCount,
      0,
    );
    const providerDiagnostics = providerFailureDiagnostics(error, {
      runId,
      action,
      provider,
      modelRole,
      schemaName,
      body,
      prompt,
      useGrounding: shouldUseGeminiGrounding(action),
    });
    await upsertWorkflowStep(auth.supabase, auth.user.id, {
      id: stepPrimaryId,
      run_id: runId,
      step_id: stepId,
      step_order: stepOrder,
      step_type: action,
      model_role: modelRole,
      provider,
      function_name: action,
      status,
      attempt_count: attemptCount,
      max_attempts: Number(options.max_attempts || 2),
      input_artifact_ids: inputArtifactIds,
      token_usage: providerAccounting.usage,
      search_query_count: providerAccounting.searchQueryCount,
      actual_model: providerAccounting.model,
      provider_request_id: providerAccounting.providerRequestIds.at(-1) || "",
      latency_ms: providerAccounting.latencyMs,
      estimated_cost: failureEstimatedCost,
      actual_cost: failureActualCost,
      cost: failureActualCost,
      error: {
        message: error instanceof Error ? error.message : String(error),
        validation_errors: error instanceof ValidationFailure
          ? error.validationErrors
          : [],
        workflow_stop: error instanceof WorkflowStop ? error.code : null,
        provider_diagnostics: providerDiagnostics,
      },
      completed_at: new Date().toISOString(),
      idempotency_key: String(
        options.idempotency_key || stableId("idem", runId, action, stepOrder),
      ),
      record: {
        request_body: safeWorkflowRequest(body),
        task_id: options.task_id || null,
        provider_diagnostics: providerDiagnostics,
        provider_request_count: cumulativeProviderRequestCount,
        provider_request_ids: cumulativeProviderRequestIds,
        current_provider_request_count: providerRequestCount,
        preflight_retry_extension_used: preflightRetryExtensionUsed,
        validation_repair_source_artifact_id:
          validationRepairCandidate?.artifactId || null,
      },
    });
    if (providerRequestCount > 0) {
      await addRunUsage(
        auth.supabase,
        runId,
        failureEstimatedCost,
        failureActualCost,
        providerAccounting.searchQueryCount,
        providerRequestCount,
      );
      await logModelUsage(auth.supabase, auth.user.id, {
        provider,
        model: providerAccounting.model,
        workflow_type: action,
        action,
        workflow_id: runId,
        run_id: runId,
        job_id: jobIdFromBody(body),
        token_usage: providerAccounting.usage,
        search_query_count: providerAccounting.searchQueryCount,
        latency_ms: providerAccounting.latencyMs,
        estimated_cost: failureEstimatedCost,
        actual_cost: failureActualCost,
        provider_request_count: providerRequestCount,
        provider_request_ids: providerAccounting.providerRequestIds,
        status,
      });
    }
    await logAgentStep(
      auth.supabase,
      auth.user.id,
      agentRunId,
      2,
      status,
      modelRole,
      provider,
      action,
      status,
      error instanceof Error ? error.message : String(error),
      {
        workflow_run_id: runId,
        workflow_step_id: stepPrimaryId,
        validation_errors: error instanceof ValidationFailure
          ? error.validationErrors
          : [],
        provider_diagnostics: providerDiagnostics,
        provider_request_count: providerRequestCount,
      },
    );
    await logAgentRun(
      auth.supabase,
      auth.user.id,
      agentRunId,
      action,
      modelRole,
      provider,
      status,
      body,
      {
        error: error instanceof Error ? error.message : String(error),
        workflow_run_id: runId,
        workflow_step_id: stepPrimaryId,
        provider_diagnostics: providerDiagnostics,
        provider_request_count: providerRequestCount,
      },
    );
    throw error;
  }
  // Provider completion and durable persistence are separate events. This
  // workflow does not claim provider exactly-once behavior: a later storage
  // failure or an ambiguous timeout must be reconciled before another call.
  await assertNotCancelled(auth, runId, `${action} persistence`);
  const providerRequestCount = providerRequestCountForResult(result);
  const providerRequestIds = providerRequestIdsForResult(result);
  const cumulativeProviderRequestCount = priorProviderRequestCount +
    providerRequestCount;
  const cumulativeProviderRequestIds = uniqueStrings([
    ...priorProviderRequestIds,
    ...providerRequestIds,
  ]);
  const aggregateEstimatedCost = roundMoney(
    estimatedCost * providerRequestCount,
  );
  const actualCost = deterministicReplay ? 0 : actualModelCost(
    provider,
    action,
    result.usage,
    result.searchQueryCount,
    aggregateEstimatedCost,
  );
  const persistedTokenUsage = deterministicReplay &&
      options.prior_token_usage &&
      typeof options.prior_token_usage === "object" &&
      !Array.isArray(options.prior_token_usage)
    ? options.prior_token_usage as Record<string, unknown>
    : result.usage;
  const persistedSearchQueryCount = deterministicReplay
    ? Number(options.prior_search_query_count || 0)
    : result.searchQueryCount;
  const persistedModel = deterministicReplay
    ? String(options.prior_actual_model || result.model || "")
    : result.model;
  const persistedProviderRequestId = deterministicReplay
    ? String(
      options.prior_provider_request_id ||
        priorProviderRequestIds.at(-1) ||
        "",
    )
    : result.providerRequestId;
  const persistedLatencyMs = deterministicReplay
    ? Number(options.prior_latency_ms || 0)
    : result.latencyMs;
  const persistedEstimatedCost = deterministicReplay
    ? Number(options.prior_estimated_cost || 0)
    : aggregateEstimatedCost;
  const persistedActualCost = deterministicReplay
    ? Number(options.prior_actual_cost || 0)
    : actualCost;
  const artifactId = stableId(
    "artifact",
    runId,
    action,
    "validated",
    inputVersion(body),
    options.idempotency_key || "",
  );
  await saveWorkflowArtifact(auth.supabase, auth.user.id, {
    id: artifactId,
    run_id: runId,
    step_id: stepId,
    artifact_type: action,
    schema_name: schemaName,
    schema_version: "job-command-center-v2",
    job_id: jobIdFromBody(body),
    status: "validated",
    idempotency_key: stableId(
      "artifact-idem",
      runId,
      action,
      inputVersion(body),
      options.idempotency_key || "",
    ),
    record: {
      output: result.parsed,
      grounding: result.grounding,
      usage: persistedTokenUsage,
      validation: {
        passed: true,
        repaired: result.repaired,
        deterministic_revalidation: deterministicReplay,
      },
      provider_request_count: cumulativeProviderRequestCount,
      provider_request_ids: cumulativeProviderRequestIds,
      current_provider_request_count: providerRequestCount,
      current_provider_request_ids: providerRequestIds,
      preflight_retry_extension_used: preflightRetryExtensionUsed,
      validation_repair_source_artifact_id:
        validationRepairCandidate?.artifactId || null,
      deterministic_revalidation_source_artifact_id:
        result.replaySourceArtifactId || null,
    },
    raw_output: result.text,
  });
  await upsertWorkflowStep(auth.supabase, auth.user.id, {
    id: stepPrimaryId,
    run_id: runId,
    step_id: stepId,
    step_order: stepOrder,
    step_type: action,
    model_role: modelRole,
    provider,
    function_name: action,
    status: deferCompletion ? "provider_completed" : "completed",
    error: null,
    attempt_count: attemptCount,
    max_attempts: Number(options.max_attempts || 2),
    input_artifact_ids: inputArtifactIds,
    output_artifact_ids: [artifactId],
    completed_at: deferCompletion ? null : new Date().toISOString(),
    token_usage: persistedTokenUsage,
    search_query_count: persistedSearchQueryCount,
    actual_model: persistedModel,
    provider_request_id: persistedProviderRequestId,
    latency_ms: persistedLatencyMs,
    estimated_cost: persistedEstimatedCost,
    actual_cost: persistedActualCost,
    cost: persistedActualCost,
    idempotency_key: String(
      options.idempotency_key || stableId("idem", runId, action, stepOrder),
    ),
    record: {
      request_body: safeWorkflowRequest(body),
      task_id: options.task_id || null,
      provider_completed: true,
      post_processing_completed: !deferCompletion,
      output_artifact_id: artifactId,
      provider_request_count: cumulativeProviderRequestCount,
      provider_request_ids: cumulativeProviderRequestIds,
      current_provider_request_count: providerRequestCount,
      current_provider_request_ids: providerRequestIds,
      validation_repair_source_artifact_id:
        validationRepairCandidate?.artifactId || null,
      deterministic_revalidation_source_artifact_id:
        result.replaySourceArtifactId || null,
    },
  });
  if (providerRequestCount > 0) {
    await addRunUsage(
      auth.supabase,
      runId,
      aggregateEstimatedCost,
      actualCost,
      result.searchQueryCount,
      providerRequestCount,
    );
    await logModelUsage(auth.supabase, auth.user.id, {
      provider,
      model: result.model,
      workflow_type: action,
      action,
      workflow_id: runId,
      run_id: runId,
      job_id: jobIdFromBody(body),
      token_usage: result.usage,
      search_query_count: result.searchQueryCount,
      latency_ms: result.latencyMs,
      estimated_cost: aggregateEstimatedCost,
      actual_cost: actualCost,
      provider_request_id: result.providerRequestId,
      provider_request_count: providerRequestCount,
      provider_request_ids: providerRequestIds,
      status: "completed",
    });
  }
  await logAgentStep(
    auth.supabase,
    auth.user.id,
    agentRunId,
    2,
    "save_output",
    modelRole,
    provider,
    action,
    "completed",
    deterministicReplay
      ? "Saved provider output passed current validation and was persisted without another model call."
      : deferCompletion
      ? "Validated provider output saved; deterministic post-processing remains pending."
      : "Validated output and durable workflow records saved.",
    {
      workflow_run_id: runId,
      workflow_step_id: stepPrimaryId,
      repaired: result.repaired,
      deterministic_revalidation: deterministicReplay,
      search_query_count: deterministicReplay ? 0 : result.searchQueryCount,
      provider_request_count: providerRequestCount,
    },
  );
  await logAgentRun(
    auth.supabase,
    auth.user.id,
    agentRunId,
    action,
    modelRole,
    provider,
    "complete",
    body,
    {
      output: result.parsed,
      workflow_run_id: runId,
      workflow_step_id: stepPrimaryId,
    },
  );
  return result;
}

async function workflowStatus(
  req: Request,
  auth: AuthContext,
  body: RequestBody,
): Promise<Response> {
  const runId = String(
    body.workflow_run_id || body.run_id || body.workflow_id || "",
  );
  if (!runId) {
    return json(req, { error: "workflow-status requires run_id." }, 400);
  }
  const runRow = await selectOne(auth.supabase, "jobcc_workflow_runs", runId) as
    | Record<string, unknown>
    | null;
  if (runRow?.search_run_id) {
    await updateCoverageFromDb(auth, runId, String(runRow.search_run_id)).catch(
      console.error,
    );
    await finalizeSearchWorkflowIfDone(
      auth,
      runId,
      String(runRow.search_run_id),
      replayBodyFromRun(runRow, body),
    ).catch(console.error);
  }
  if (runRow && isCancellationRecord(runRow)) {
    await markCancelledIfIdle(auth, runId, String(runRow.search_run_id || ""))
      .catch(console.error);
  }
  const [run, steps, artifacts, coverage, tasks] = await Promise.all([
    selectOne(auth.supabase, "jobcc_workflow_runs", runId),
    selectMany(auth.supabase, "jobcc_workflow_steps", "run_id", runId),
    selectMany(auth.supabase, "jobcc_workflow_artifacts", "run_id", runId),
    selectMany(auth.supabase, "jobcc_search_coverage", "run_id", runId),
    selectMany(auth.supabase, "jobcc_search_tasks", "run_id", runId),
  ]);
  return json(req, {
    workflow_run_id: runId,
    run,
    steps,
    artifacts,
    coverage,
    tasks,
  });
}

async function cancelWorkflow(
  req: Request,
  auth: AuthContext,
  body: RequestBody,
): Promise<Response> {
  const runId = String(
    body.workflow_run_id || body.run_id || body.workflow_id || "",
  );
  if (!runId) {
    return json(req, { error: "cancel-workflow requires run_id." }, 400);
  }
  const run = await selectOne(auth.supabase, "jobcc_workflow_runs", runId) as
    | Record<string, unknown>
    | null;
  if (!run) return json(req, { error: "Workflow run not found." }, 404);
  const nowIso = new Date().toISOString();
  await auth.supabase.from("jobcc_search_tasks").update({
    status: "cancelled",
    cancelled_at: nowIso,
    updated_at: nowIso,
  }).eq("run_id", runId).in("status", ["queued", "claimed"]);
  const { error: stepCancelError } = await auth.supabase.from(
    "jobcc_workflow_steps",
  ).update({
    status: "cancelled",
    completed_at: nowIso,
    updated_at: nowIso,
  }).eq("run_id", runId).in("status", [
    "queued",
    "running",
    "retrying",
    "waiting_for_user",
    "waiting_for_approval",
  ]);
  if (stepCancelError) {
    throw new Error(
      `jobcc_workflow_steps cancel failed: ${stepCancelError.message}`,
    );
  }
  const active = await activeSearchTaskCount(auth.supabase, runId);
  const finalStatus = active > 0
    ? String(run.status || "running")
    : "cancelled";
  await upsertWorkflowRun(auth.supabase, auth.user.id, {
    id: runId,
    workflow_type: String(run.workflow_type || body.workflow_type || "unknown"),
    status: finalStatus,
    current_step: active > 0 ? "cancel_requested" : "cancelled",
    cancellation_requested_at: nowIso,
    cancelled_at: active > 0 ? run.cancelled_at || null : nowIso,
    error_code: active > 0 ? "cancel_requested" : "cancelled",
    error_message: active > 0
      ? `${active} active task(s) are stopping before the next model call or persistence step.`
      : "Workflow cancelled before additional work ran.",
  });
  if (String(run.search_run_id || "")) {
    await updateCoverageFromDb(auth, runId, String(run.search_run_id)).catch(
      console.error,
    );
  }
  return json(req, {
    workflow_run_id: runId,
    status: active > 0 ? "cancel_requested" : "cancelled",
    active_tasks: active,
    message: active > 0
      ? "Cancel requested. Running workers will stop at the next safe checkpoint."
      : "Workflow cancelled.",
  });
}

async function retryWorkflowStep(
  req: Request,
  auth: AuthContext,
  body: RequestBody,
): Promise<Response> {
  const runId = String(
    body.workflow_run_id || body.run_id || body.workflow_id || "",
  );
  if (!runId) {
    return json(req, { error: "retry-workflow-step requires run_id." }, 400);
  }
  const run = await selectOne(auth.supabase, "jobcc_workflow_runs", runId) as
    | Record<string, unknown>
    | null;
  if (!run) return json(req, { error: "Workflow run not found." }, 404);
  let failedStep = await latestRetryableStep(
    auth.supabase,
    runId,
    body.step_id,
  );
  if (!failedStep) {
    failedStep = await latestBlockedReviewStep(
      auth.supabase,
      runId,
      run,
      body.step_id,
    );
  }
  if (!failedStep) {
    return json(req, {
      workflow_run_id: runId,
      status: String(run.status || ""),
      message: "No retryable failed step was found.",
    }, 409);
  }
  const attemptCount = Number(failedStep.attempt_count || 0);
  const maxAttempts = Number(failedStep.max_attempts || 1);
  const failedAction = String(failedStep.step_type || "");
  const restoredBody = replayBodyForRetry(failedStep, run, body);
  const validationRepairCandidate = failedAction
    ? await workflowValidationRepairCandidate(
      auth.supabase,
      runId,
      failedAction,
      failedStep,
    )
    : null;
  const replayCandidate = failedAction === "gemini-final-quality-check"
    ? await workflowStepArtifactResult(
      auth.supabase,
      runId,
      failedAction,
      failedStep,
    )
    : null;
  const deferredProviderResult = canReplayDeferredFinalQualityStep(
      failedStep,
      Boolean(replayCandidate),
    )
    ? replayCandidate
    : null;
  const deterministicReplayResult = revalidatedSavedProviderResult(
    failedAction,
    validationRepairCandidate,
    restoredBody,
    failedStep,
  );
  const replayedProviderResult = deterministicReplayResult ||
    deferredProviderResult;
  const savedRepairWindow = savedValidationRepairRetryWindow(
    failedStep,
    Boolean(validationRepairCandidate),
    attemptCount,
    maxAttempts,
  );
  const retryWindow: RetryWindowDecision = deterministicReplayResult
    ? {
      allowed: true,
      maxAttempts: Math.max(maxAttempts, attemptCount + 1),
      message:
        "The saved provider artifact passes current validation; it will be persisted without another model call.",
      providerOutcome: "not_applicable",
      manualReconciliationRequired: false,
    }
    : deferredProviderResult
    ? {
      allowed: true,
      maxAttempts: Math.max(1, maxAttempts),
      message:
        "The validated provider artifact will be reused; only deterministic role-kit persistence will run again.",
      providerOutcome: "not_applicable",
      manualReconciliationRequired: false,
    }
    : savedRepairWindow
    ? savedRepairWindow
    : retryWindowForFailedStep(
      failedStep,
      attemptCount,
      maxAttempts,
    );
  if (!retryWindow.allowed) {
    return json(req, {
      workflow_run_id: runId,
      status: String(run.status || ""),
      error: retryWindow.message,
      provider_outcome: retryWindow.providerOutcome,
      manual_reconciliation_required: retryWindow.manualReconciliationRequired,
    }, 409);
  }
  const stepForRetry = retryWindow.maxAttempts > maxAttempts
    ? { ...failedStep, max_attempts: retryWindow.maxAttempts }
    : failedStep;
  const retryingSearchWorkflow =
    String(run.workflow_type || "").includes("search") ||
    String(run.workflow_type || "") === "run-market-sweep";
  let packetStepForRetry: ApplicationPacketStepDefinition | null = null;
  if (!retryingSearchWorkflow) {
    packetStepForRetry = applicationPacketStepForAction(
      String(stepForRetry.step_type || ""),
    );
    if (!packetStepForRetry) {
      return json(req, {
        workflow_run_id: runId,
        status: String(run.status || ""),
        error: `No packet step definition exists for ${
          String(stepForRetry.step_type || "unknown")
        }.`,
      }, 409);
    }
    const retryClaim = await claimApplicationPacketStep(
      auth,
      runId,
      packetStepForRetry,
      stepForRetry,
      String(stepForRetry.status || "") === "blocked_review_retry"
        ? "validated_completed_repair"
        : "retry",
    );
    if (!retryClaim.claimed) {
      return json(
        req,
        applicationPacketClaimResponse(
          runId,
          String(run.job_id || jobIdFromBody(body) || ""),
          packetStepForRetry,
          retryClaim,
        ),
      );
    }
  }
  await upsertWorkflowRun(auth.supabase, auth.user.id, {
    id: runId,
    workflow_type: String(
      run.workflow_type || body.workflow_type || "retry-workflow-step",
    ),
    status: "retrying",
    current_step: String(stepForRetry.step_type || "retrying"),
    error_code: null,
    error_message: null,
  });
  const limits = controlledLimits(restoredBody);
  try {
    if (retryingSearchWorkflow) {
      const retryTask = await searchTaskForRetry(
        auth.supabase,
        runId,
        stepForRetry,
      );
      const taskId = String(retryTask?.id || "");
      if (taskId) {
        await auth.supabase.from("jobcc_search_tasks").update({
          status: "queued",
          error: null,
          claimed_at: null,
          worker_id: null,
          lock_owner: null,
          lock_expires_at: null,
          task_heartbeat_at: null,
          failed_at: null,
          cancelled_at: null,
          stale_reason: null,
          recovery_status: "manual_retry_queued",
          updated_at: new Date().toISOString(),
        }).eq("id", taskId);
      }
      await processSearchQueue(
        auth,
        runId,
        String(run.search_run_id || ""),
        restoredBody,
        limits,
      );
    } else {
      await executeApplicationPacketStep(
        auth,
        runId,
        restoredBody,
        String(run.workflow_type || "prepare-application-packet"),
        limits,
        packetStepForRetry as ApplicationPacketStepDefinition,
        stepForRetry,
        replayedProviderResult,
        validationRepairCandidate,
      );
    }
  } catch (error) {
    if (!retryingSearchWorkflow && packetStepForRetry) {
      const failed = await failApplicationPacketStep(
        auth,
        runId,
        restoredBody,
        String(run.workflow_type || "prepare-application-packet"),
        packetStepForRetry,
        error,
      );
      return json(
        req,
        failed,
        error instanceof ValidationFailure ? 422 : 500,
      );
    }
    const message = error instanceof Error ? error.message : String(error);
    const status: WorkflowStatus = workflowStatusForError(error);
    await upsertWorkflowRun(auth.supabase, auth.user.id, {
      id: runId,
      workflow_type: String(
        run.workflow_type || body.workflow_type || "retry-workflow-step",
      ),
      status,
      current_step: status,
      error_code: status,
      error_message: message,
      output_record: { error: message, retried_step: stepForRetry.step_type },
    });
    const retryDecision = retryWindowForFailedStep(
      {
        status,
        provider: stepForRetry.provider,
        model_role: stepForRetry.model_role,
        error: { message },
      },
      Number(stepForRetry.attempt_count || 0),
      Number(stepForRetry.max_attempts || 1),
    );
    return json(req, {
      workflow_run_id: runId,
      status,
      retried_step: stepForRetry.step_type,
      error: message,
      retry_available: retryDecision.allowed,
      provider_outcome: retryDecision.providerOutcome,
      manual_reconciliation_required:
        retryDecision.manualReconciliationRequired,
    }, error instanceof ValidationFailure ? 422 : 500);
  }
  const updatedRun = await selectOne(
    auth.supabase,
    "jobcc_workflow_runs",
    runId,
  ) as Record<string, unknown> | null;
  return json(req, {
    workflow_run_id: runId,
    status: String(updatedRun?.status || "retried"),
    retried_step: stepForRetry.step_type,
    message:
      "Failed step was retried and the workflow resumed from durable state.",
  });
}

export function retryWindowForFailedStep(
  step: Record<string, unknown>,
  attemptCount: number,
  maxAttempts: number,
): RetryWindowDecision {
  const errorRecord = (step.error || {}) as Record<string, unknown>;
  const message = String(errorRecord.message || "");
  const status = String(step.status || "");
  if (status === "blocked_review_retry") {
    return {
      allowed: true,
      maxAttempts: Math.max(maxAttempts, attemptCount + 1),
      message: "",
      providerOutcome: "not_applicable",
      manualReconciliationRequired: false,
    };
  }

  const workflowStop = String(errorRecord.workflow_stop || "");
  if (
    status === "failed_preflight" &&
    ["call_limit", "cost_limit"].includes(workflowStop)
  ) {
    const record = step.record && typeof step.record === "object" &&
        !Array.isArray(step.record)
      ? step.record as Record<string, unknown>
      : {};
    const providerEvidence = providerRequestEvidenceCountForStep(step);
    const currentRequestCount = Number(
      record.current_provider_request_count,
    );
    const providerNotCalled = providerEvidence === 0 ||
      currentRequestCount === 0 ||
      String(errorRecord.provider_outcome || "") === "provider_not_called";
    const canExtendCallLimitRetry = workflowStop === "call_limit" &&
      providerNotCalled &&
      record.preflight_retry_extension_used !== true &&
      attemptCount >= maxAttempts;
    const nextMaxAttempts = canExtendCallLimitRetry
      ? attemptCount + 1
      : maxAttempts;
    const allowed = providerNotCalled &&
      (attemptCount < maxAttempts || canExtendCallLimitRetry);
    return {
      allowed,
      maxAttempts: nextMaxAttempts,
      message: allowed
        ? ""
        : !providerNotCalled
        ? "Automatic retry is blocked because provider-request evidence exists for a preflight-stopped step."
        : `Step reached max attempts (${maxAttempts}).`,
      providerOutcome: providerNotCalled
        ? "provider_not_called"
        : "provider_outcome_uncertain",
      manualReconciliationRequired: !providerNotCalled,
    };
  }

  const billableModelStep = ["openai", "gemini"].includes(
    String(step.provider || "").toLowerCase(),
  ) || /openai|gemini/i.test(String(step.model_role || ""));
  if (!billableModelStep) {
    const allowed = attemptCount < maxAttempts;
    return {
      allowed,
      maxAttempts,
      message: allowed ? "" : `Step reached max attempts (${maxAttempts}).`,
      providerOutcome: "not_applicable",
      manualReconciliationRequired: false,
    };
  }

  if (status === "failed_storage") {
    return {
      allowed: false,
      maxAttempts,
      message:
        "Automatic retry is blocked because the provider may already have completed before durable storage failed. Reconcile provider usage and persisted artifacts manually before another model call.",
      providerOutcome: "provider_outcome_uncertain",
      manualReconciliationRequired: true,
    };
  }

  const explicitSchemaFailure = status === "failed_validation" ||
    /invalid argument|response[ _-]?format|response_json_schema|responsejsonschema|schema validation/i
      .test(message);
  const explicitProvider4xx = status === "failed_provider" &&
    /request failed:\s*4\d\d\b/i.test(message);
  if (explicitSchemaFailure || explicitProvider4xx) {
    const allowed = attemptCount < maxAttempts;
    const providerOutcome: ProviderRetryOutcome = status === "failed_validation"
      ? "known_invalid_response"
      : "definite_provider_rejection";
    return {
      allowed,
      maxAttempts,
      message: allowed ? "" : `Step reached max attempts (${maxAttempts}).`,
      providerOutcome,
      manualReconciliationRequired: false,
    };
  }

  return {
    allowed: false,
    maxAttempts,
    message:
      "Automatic retry is blocked because the provider outcome is ambiguous. Reconcile provider usage and durable artifacts manually before another model call.",
    providerOutcome: "provider_outcome_uncertain",
    manualReconciliationRequired: true,
  };
}

export function providerRetryCallLimitAllowance(
  step: Record<string, unknown>,
  attemptCount: number,
  maxAttempts: number,
): number {
  const decision = retryWindowForFailedStep(step, attemptCount, maxAttempts);
  if (!decision.allowed) return 0;
  if (
    ["definite_provider_rejection", "known_invalid_response"].includes(
      decision.providerOutcome,
    )
  ) return 1;
  const error = step.error && typeof step.error === "object" &&
      !Array.isArray(step.error)
    ? step.error as Record<string, unknown>
    : {};
  return String(step.status || "") === "failed_preflight" &&
      String(error.workflow_stop || "") === "call_limit" &&
      decision.providerOutcome === "provider_not_called" &&
      providerRequestEvidenceCountForStep(step) > 0
    ? 1
    : 0;
}

async function advanceWorkflow(
  req: Request,
  auth: AuthContext,
  body: RequestBody,
): Promise<Response> {
  const runId = String(
    body.workflow_run_id || body.run_id || body.workflow_id || "",
  );
  if (!runId) {
    return json(req, { error: "advance-workflow requires run_id." }, 400);
  }
  const run = await selectOne(auth.supabase, "jobcc_workflow_runs", runId) as
    | Record<string, unknown>
    | null;
  if (!run) return json(req, { error: "Workflow run not found." }, 404);
  if (WORKFLOW_TERMINAL_STATUSES.has(String(run.status || ""))) {
    return json(req, {
      workflow_run_id: runId,
      status: run.status,
      message: "Workflow is already terminal.",
    });
  }
  if (String(run.status || "") === "waiting_for_approval" && !body.approved) {
    return json(req, {
      workflow_run_id: runId,
      status: run.status,
      message:
        "Approval gate is active. Matthew approval is required before advance.",
    }, 409);
  }
  if (/failed/i.test(String(run.status || ""))) {
    return json(req, {
      workflow_run_id: runId,
      status: run.status,
      message: "Use retry for failed steps; advance will not skip failures.",
    }, 409);
  }
  const restoredBody = replayBodyFromRun(run, body);
  const limits = controlledLimits(restoredBody);
  let result: Record<string, unknown>;
  if (
    String(run.workflow_type || "").includes("search") ||
    String(run.workflow_type || "") === "run-market-sweep"
  ) {
    await processSearchQueue(
      auth,
      runId,
      String(run.search_run_id || ""),
      restoredBody,
      limits,
    );
    result = {
      workflow_run_id: runId,
      status: "worker_finished",
      message: "Search workflow advanced through currently claimable tasks.",
    };
  } else {
    result = await advanceApplicationPacketWorkflow(
      auth,
      runId,
      restoredBody,
      String(run.workflow_type || "prepare-application-packet"),
      limits,
    );
  }
  return json(req, result);
}

async function searchWorker(
  req: Request,
  auth: AuthContext,
  body: RequestBody,
): Promise<Response> {
  const runId = String(
    body.workflow_run_id || body.run_id || body.workflow_id || "",
  );
  if (!runId) {
    return json(req, { error: "search-worker requires run_id." }, 400);
  }
  const run = await selectOne(auth.supabase, "jobcc_workflow_runs", runId) as
    | Record<string, unknown>
    | null;
  if (!run) return json(req, { error: "Workflow run not found." }, 404);
  const restoredBody = replayBodyFromRun(run, body);
  await processSearchQueue(
    auth,
    runId,
    String(run.search_run_id || body.search_run_id || ""),
    restoredBody,
    controlledLimits(restoredBody),
  );
  return json(req, {
    workflow_run_id: runId,
    status: "worker_finished",
    message: "Search worker processed currently claimable tasks.",
  });
}

type OfficialSourceCaptureResult = {
  handled: boolean;
  results: Array<Record<string, unknown>>;
  coverage: Record<string, unknown>;
};

export function officialSourceDispositionForCapture(
  company: string,
  capture: Record<string, unknown>,
): ReturnType<typeof officialCaptureDisposition> {
  const candidateCards = Array.isArray(capture.candidate_cards)
    ? capture.candidate_cards
    : [];
  const baseDisposition = officialCaptureDisposition({
    company,
    jobListCaptured: Boolean(capture.job_list_captured),
    candidateCardCount: Number(
      capture.candidate_cards_total || candidateCards.length,
    ),
    errorCount: arrayFromUnknown(capture.errors).length,
  });
  const customFallbackReason = capture.custom_source_capture === true
    ? String(capture.scout_fallback_reason || "")
    : "";
  return customFallbackReason
    ? {
      ...baseDisposition,
      handled: false,
      supplementalScoutRequired: true,
      fallbackReason: customFallbackReason,
    }
    : baseDisposition;
}

async function runProviderVerificationStep(
  auth: AuthContext,
  runId: string,
  searchRunId: string,
  body: RequestBody,
  task: Record<string, unknown>,
  result: Record<string, unknown>,
  limits: ReturnType<typeof controlledLimits>,
  stepOrder: number,
  index: number,
): Promise<Record<string, unknown>> {
  const verificationBody: RequestBody = {
    ...body,
    workflow_run_id: runId,
    search_run_id: searchRunId,
    sourceText: JSON.stringify(result, null, 2),
    notes:
      "Verify this exact posting. Confirm active status, official source, title, location, Arizona remote eligibility, compensation text, requisition id, posting age, and full job description completeness.",
  };
  const verification = await getOrRunModelStep(
    auth,
    runId,
    verificationBody,
    "verify-job-source",
    "gemini",
    stepOrder,
    "Gemini Scout",
    limits,
    {
      task_id: task.id,
      idempotency_key: stableId(
        "verify",
        String(task.id),
        canonicalDedupeKey(result),
        index,
      ),
      attempt_count: Number(task.attempts || 1),
      max_attempts: Number(task.max_attempts || 2),
    },
  );
  return mergeJobRecords(
    result,
    (verification.parsed.result as Record<string, unknown>) || {},
  );
}

async function runOfficialSourceFirstCapture(
  auth: AuthContext,
  runId: string,
  searchRunId: string,
  body: RequestBody,
  task: Record<string, unknown>,
  taskIndex: number,
  limits: ReturnType<typeof controlledLimits>,
  workerId: string,
): Promise<OfficialSourceCaptureResult> {
  if (body.source_first_official_capture === false) {
    return { handled: false, results: [], coverage: {} };
  }
  const company = arrayFromUnknown(task.company_cluster)[0] || "";
  const atsSources = officialAtsSourcesForCompany(company);
  const secondarySources = secondarySourcesForCompany(company);

  await heartbeatSearchProgress(
    auth,
    runId,
    String(task.id),
    workerId,
    "company-source-refresh",
  );
  const started = Date.now();
  const customCapture = /^(waymo|whatnot)$/i.test(company)
    ? null
    : await captureCustomOfficialSource(company, task, body, limits);
  if (
    !/^(waymo|whatnot)$/i.test(company) && !customCapture &&
    !atsSources.length && !secondarySources.length
  ) {
    return { handled: false, results: [], coverage: {} };
  }
  const capture = /^waymo$/i.test(company)
    ? await captureWaymoOfficialSource(task, body, limits)
    : /^whatnot$/i.test(company)
    ? await captureWhatnotOfficialSource(task, body, limits)
    : customCapture
    ? customCapture
    : atsSources.length
    ? await captureOfficialAtsSource(company, atsSources, task, body, limits)
    : await captureSecondaryOfficialSource(
      company,
      secondarySources,
      task,
      body,
      limits,
    );
  const timedOut = Date.now() - started > SOURCE_CAPTURE_COMPANY_TIMEOUT_MS;
  const captureWithTiming = {
    ...capture,
    company_timeout_ms: SOURCE_CAPTURE_COMPANY_TIMEOUT_MS,
    company_elapsed_ms: Date.now() - started,
    timed_out: timedOut,
  };
  const candidateCards = Array.isArray(capture.candidate_cards)
    ? capture.candidate_cards as Array<Record<string, unknown>>
    : [];
  const likelyCandidates = Array.isArray(capture.likely_candidates)
    ? capture.likely_candidates as Array<Record<string, unknown>>
    : [];
  const captureResults = Array.isArray(capture.results)
    ? capture.results as Array<Record<string, unknown>>
    : [];
  const captureErrors = arrayFromUnknown(capture.errors);
  const candidateCardCount = Number(
    capture.candidate_cards_total || candidateCards.length,
  );
  const disposition = officialSourceDispositionForCapture(company, capture);
  await upsertCompanySourceFromCapture(
    auth.supabase,
    auth.user.id,
    captureWithTiming,
  );
  await recordLocalSearchStep(
    auth,
    runId,
    task,
    "company-source-refresh",
    (taskIndex * 100) + 2,
    {
      ...baseSearchRunOutput(runId, searchRunId, body),
      status: capture.source_refresh_completed
        ? "partial"
        : "needs_verification",
      coverage: searchCoverageFromCapture(captureWithTiming, body, 0),
      results: [],
      sources: capture.sources,
      source_adapter_report: capture.company_source_directory,
    },
  );

  await heartbeatSearchProgress(
    auth,
    runId,
    String(task.id),
    workerId,
    "official-job-list-capture",
  );
  await recordLocalSearchStep(
    auth,
    runId,
    task,
    "official-job-list-capture",
    (taskIndex * 100) + 4,
    {
      ...baseSearchRunOutput(runId, searchRunId, body),
      status: capture.job_list_captured ? "partial" : "needs_verification",
      coverage: searchCoverageFromCapture(captureWithTiming, body, 0),
      results: [],
      sources: capture.sources,
      candidate_card_sample: searchAuditSample(candidateCards),
      official_job_list_capture: {
        source_url: capture.official_job_search_url,
        source_adapter_type: capture.source_adapter_type,
        list_page_status: capture.list_page_status,
        candidate_cards_extracted: Number(
          capture.candidate_cards_total || candidateCards.length,
        ),
        candidate_cards_retained: candidateCards.length,
        browser_required: capture.browser_required,
      },
    },
  );

  await heartbeatSearchProgress(
    auth,
    runId,
    String(task.id),
    workerId,
    "candidate-card-extraction",
  );
  await recordLocalSearchStep(
    auth,
    runId,
    task,
    "candidate-card-extraction",
    (taskIndex * 100) + 6,
    {
      ...baseSearchRunOutput(runId, searchRunId, body),
      status: "partial",
      coverage: searchCoverageFromCapture(captureWithTiming, body, 0),
      results: [],
      sources: capture.sources,
      candidate_cards: searchAuditSample(candidateCards),
    },
  );

  await heartbeatSearchProgress(
    auth,
    runId,
    String(task.id),
    workerId,
    "cheap-role-family-filtering",
  );
  await recordLocalSearchStep(
    auth,
    runId,
    task,
    "cheap-role-family-filtering",
    (taskIndex * 100) + 8,
    {
      ...baseSearchRunOutput(runId, searchRunId, body),
      status: "partial",
      coverage: searchCoverageFromCapture(captureWithTiming, body, 0),
      results: [],
      sources: capture.sources,
      likely_candidate_sample: searchAuditSample(likelyCandidates),
      cheap_filtering: {
        candidate_cards_extracted: Number(
          capture.candidate_cards_total || candidateCards.length,
        ),
        candidate_cards_retained: candidateCards.length,
        likely_fit_candidates: likelyCandidates.length,
        cheap_screened_out: Number(capture.cheap_screened_out || 0),
        compensation_screened_out: Number(
          capture.compensation_screened_out || 0,
        ),
        compensation_screened_out_below_floor: Number(
          capture.compensation_screened_out_below_floor || 0,
        ),
        compensation_screened_out_missing_comp: Number(
          capture.compensation_screened_out_missing_comp || 0,
        ),
        deferred_due_to_full_posting_cap: Number(
          capture.deferred_due_to_full_posting_cap || 0,
        ),
        minimum_listed_base_salary: limits.minimumListedBaseSalary,
        role_families: arrayFromUnknown(task.role_family_cluster),
        max_full_postings_per_company: limits.maxFullPostingsPerCompany,
      },
    },
  );

  await heartbeatSearchProgress(
    auth,
    runId,
    String(task.id),
    workerId,
    "official-posting-capture",
  );
  await recordLocalSearchStep(
    auth,
    runId,
    task,
    "official-posting-capture",
    (taskIndex * 100) + 10,
    {
      ...baseSearchRunOutput(runId, searchRunId, body),
      status: captureResults.length ? "partial" : "needs_verification",
      coverage: searchCoverageFromCapture(
        captureWithTiming,
        body,
        captureResults.length,
      ),
      results: [],
      sources: capture.sources,
      posting_capture_sample: searchAuditSample(captureResults),
      official_posting_capture: {
        full_postings_captured: captureResults.length,
        parsed_job_briefs_created:
          captureResults.filter((result: Record<string, unknown>) =>
            parsedBriefComplete(parsedJobBriefFromRecord(result))
          ).length,
        max_full_postings_per_company: limits.maxFullPostingsPerCompany,
      },
    },
  );

  return {
    handled: disposition.handled,
    results: captureResults,
    coverage: {
      source_first_official_capture: true,
      official_capture_failed: disposition.officialCaptureFailed,
      supplemental_scout_required: disposition.supplementalScoutRequired,
      scout_fallback_required: Boolean(disposition.fallbackReason),
      official_capture_fallback_reason: disposition.fallbackReason,
      source_refresh_completed: capture.source_refresh_completed,
      job_list_captured: capture.job_list_captured,
      browser_required: capture.browser_required,
      source_adapter_type: capture.source_adapter_type,
      official_job_search_url: capture.official_job_search_url,
      list_page_status: capture.list_page_status,
      candidate_cards_extracted: candidateCardCount,
      candidate_cards_retained: candidateCards.length,
      official_candidate_cards: searchAuditSample(candidateCards, 50),
      likely_fit_candidates: likelyCandidates.length,
      card_only_likely_candidates: Number(
        capture.card_only_likely_candidates || 0,
      ),
      full_postings_captured: captureResults.length,
      parsed_job_briefs_created:
        captureResults.filter((result: Record<string, unknown>) =>
          parsedBriefComplete(parsedJobBriefFromRecord(result))
        ).length,
      cheap_screened_out: Number(capture.cheap_screened_out || 0),
      compensation_screened_out: Number(capture.compensation_screened_out || 0),
      compensation_screened_out_below_floor: Number(
        capture.compensation_screened_out_below_floor || 0,
      ),
      compensation_screened_out_missing_comp: Number(
        capture.compensation_screened_out_missing_comp || 0,
      ),
      screened_out_roles: Number(capture.cheap_screened_out || 0) +
        Number(capture.compensation_screened_out || 0),
      deferred_due_to_full_posting_cap: Number(
        capture.deferred_due_to_full_posting_cap || 0,
      ),
      minimum_listed_base_salary: limits.minimumListedBaseSalary,
      official_sources_checked: capture.official_sources_checked,
      max_pages_per_source: SOURCE_CAPTURE_MAX_PAGES,
      max_candidate_cards_per_company: limits.maxCandidateCardsPerCompany,
      max_full_postings_per_company: limits.maxFullPostingsPerCompany,
      max_scored_jobs_per_company: limits.maxScoredJobsPerCompany,
      source_urls_checked: capture.source_urls_checked,
      source_limitations: arrayFromUnknown(capture.source_limitations),
      source_errors: Array.isArray(capture.source_errors)
        ? capture.source_errors
        : [],
      full_posting_result_gate: String(
        capture.full_posting_result_gate || "",
      ),
      analysis_reused: false,
      analysis_cache_checked: true,
      failed_tasks: captureErrors.length ? 1 : 0,
      errors: captureErrors,
    },
  };
}

async function captureWaymoOfficialSource(
  task: Record<string, unknown>,
  body: RequestBody,
  limits: ReturnType<typeof controlledLimits>,
): Promise<Record<string, unknown>> {
  const company = "Waymo";
  const searchUrl =
    "https://careers.withwaymo.com/jobs/search?query=Operations";
  const sourceUrls = uniqueStrings([
    searchUrl,
    ...arrayFromUnknown(task.official_career_urls),
    ...officialUrlsForCompany(body, company),
  ]);
  const errors: string[] = [];
  let html = "";
  try {
    html = await fetchTextWithTimeout(searchUrl);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
  const links = html ? extractJobLinks(html, searchUrl) : [];
  const cards = uniqueByKey(
    links.map((link, index) =>
      candidateCardFromLink(company, "direct_html", link, index)
    ),
    (card) => normalizeUrl(String(card.source_url || "")),
  )
    .slice(0, limits.maxCandidateCardsPerCompany)
    .map((card) => enrichCandidateCard(card, task));
  const directorUrl =
    "https://careers.withwaymo.com/jobs/director-global-operations-control-tempe-arizona-united-states";
  if (
    !cards.some((card) =>
      normalizeUrl(String(card.source_url || "")) === normalizeUrl(directorUrl)
    )
  ) {
    cards.unshift(
      enrichCandidateCard(
        candidateCardFromLink(company, "direct_html", {
          href: directorUrl,
          text: "Director, Global Operations Control",
        }, -1),
        task,
      ),
    );
  }
  const titleQualifiedCandidates = filterLikelyCandidates(cards);
  const compensationScreen = screenSearchResultsByCompensation(
    titleQualifiedCandidates,
    limits.minimumListedBaseSalary,
  );
  const likelyCandidates = compensationScreen.kept.slice(
    0,
    limits.maxFullPostingsPerCompany,
  );
  const deferredDueToFullPostingCap = Math.max(
    0,
    compensationScreen.kept.length - likelyCandidates.length,
  );
  const results: Array<Record<string, unknown>> = [];
  for (const candidate of likelyCandidates) {
    try {
      const postingHtml = await fetchTextWithTimeout(
        String(candidate.source_url),
      );
      results.push(buildWaymoJobResult(candidate, postingHtml));
    } catch (error) {
      errors.push(
        `Waymo posting capture failed for ${candidate.source_url}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
  return {
    company,
    source_refresh_completed: Boolean(html),
    job_list_captured: cards.length > 0,
    browser_required: false,
    source_adapter_type: "direct_html",
    official_job_search_url: searchUrl,
    official_careers_home_url: "https://careers.withwaymo.com/jobs",
    ats_provider: "",
    list_page_status: html ? "ok" : "broken",
    candidate_cards: cards,
    likely_candidates: likelyCandidates,
    cheap_screened_out: Math.max(
      0,
      cards.length - titleQualifiedCandidates.length,
    ),
    compensation_screened_out: compensationScreen.screenedOut.length,
    compensation_screened_out_below_floor:
      compensationScreen.screenedOutBelowFloor,
    compensation_screened_out_missing_comp:
      compensationScreen.screenedOutMissingComp,
    deferred_due_to_full_posting_cap: deferredDueToFullPostingCap,
    results,
    source_urls_checked: uniqueStrings([
      searchUrl,
      ...results.map((result) => primarySourceUrl(result)),
    ]),
    official_sources_checked: 1 + results.length,
    errors,
    sources: [{
      type: "official",
      url: searchUrl,
      title: "Waymo official job search",
      captured_at: new Date().toISOString(),
      status: html ? "ok" : "broken",
    }],
    company_source_directory: companySourceDirectoryRecord(company, {
      official_website: "https://waymo.com",
      official_careers_home_url: "https://careers.withwaymo.com/jobs",
      official_job_search_url: searchUrl,
      ats_provider: "",
      source_adapter_type: "direct_html",
      capture_strategy:
        "Direct HTML job search list plus direct HTML posting capture.",
      browser_required_yes_no: "no",
      source_confidence: html ? "high" : "low",
      source_group: "Real-World Tech / Autonomous / Robotics",
    }),
  };
}

async function captureWhatnotOfficialSource(
  task: Record<string, unknown>,
  body: RequestBody,
  limits: ReturnType<typeof controlledLimits>,
): Promise<Record<string, unknown>> {
  const company = "Whatnot";
  const listUrl = "https://jobs.whatnot.com/api/jobs";
  const errors: string[] = [];
  let payload: Record<string, unknown> = {};
  try {
    payload = await fetchJsonRecordWithTimeout(listUrl);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
  const rows = Array.isArray(payload.results)
    ? payload.results as Array<Record<string, unknown>>
    : [];
  const cards = rows
    .filter((row) => row.isListed !== false)
    .map((row, index) => whatnotCandidateCard(row, index))
    .slice(0, limits.maxCandidateCardsPerCompany)
    .map((card) => enrichCandidateCard(card, task));
  const titleQualifiedCandidates = filterLikelyCandidates(cards);
  const compensationScreen = screenSearchResultsByCompensation(
    titleQualifiedCandidates,
    limits.minimumListedBaseSalary,
  );
  const likelyCandidates = compensationScreen.kept.slice(
    0,
    limits.maxFullPostingsPerCompany,
  );
  const deferredDueToFullPostingCap = Math.max(
    0,
    compensationScreen.kept.length - likelyCandidates.length,
  );
  const results: Array<Record<string, unknown>> = [];
  for (const candidate of likelyCandidates) {
    try {
      const postingHtml = await fetchTextWithTimeout(
        String(candidate.source_url),
      );
      results.push(buildAshbyJobResult(company, candidate, postingHtml));
    } catch (error) {
      errors.push(
        `Whatnot posting capture failed for ${candidate.source_url}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
  return {
    company,
    source_refresh_completed: rows.length > 0,
    job_list_captured: cards.length > 0,
    browser_required: false,
    source_adapter_type: "ats_ashby",
    official_job_search_url: listUrl,
    official_careers_home_url: "https://careers.whatnot.com",
    ats_provider: "Ashby",
    list_page_status: rows.length ? "ok" : "needs_manual_verification",
    candidate_cards: cards,
    likely_candidates: likelyCandidates,
    cheap_screened_out: Math.max(
      0,
      cards.length - titleQualifiedCandidates.length,
    ),
    compensation_screened_out: compensationScreen.screenedOut.length,
    compensation_screened_out_below_floor:
      compensationScreen.screenedOutBelowFloor,
    compensation_screened_out_missing_comp:
      compensationScreen.screenedOutMissingComp,
    deferred_due_to_full_posting_cap: deferredDueToFullPostingCap,
    results,
    source_urls_checked: uniqueStrings([
      listUrl,
      ...results.map((result) => primarySourceUrl(result)),
    ]),
    official_sources_checked: 1 + results.length,
    errors,
    sources: [{
      type: "official_ats",
      url: listUrl,
      title: "Whatnot official jobs API",
      captured_at: new Date().toISOString(),
      status: rows.length ? "ok" : "needs_manual_verification",
    }],
    company_source_directory: companySourceDirectoryRecord(company, {
      official_website: "https://www.whatnot.com",
      official_careers_home_url: "https://careers.whatnot.com",
      official_job_search_url: listUrl,
      ats_provider: "Ashby",
      ats_job_url_pattern: "https://jobs.ashbyhq.com/whatnot/{posting_id}",
      source_adapter_type: "ats_ashby",
      capture_strategy:
        "Official Whatnot careers page links to a first-party jobs API; full posting text is captured from Ashby JSON-LD on selected postings.",
      browser_required_yes_no: "no",
      source_confidence: rows.length ? "high" : "low",
      source_group: "Marketplace / Commerce / Logistics",
    }),
  };
}

function officialAtsSourcesForCompany(
  company: string,
): OfficialAtsSourceConfig[] {
  const key = normalizeKey(company);
  return OFFICIAL_ATS_SOURCE_CONFIGS.filter((source) =>
    normalizeKey(source.company) === key
  );
}

function secondarySourcesForCompany(
  company: string,
): SecondaryJobSourceConfig[] {
  const key = normalizeKey(company);
  return SECONDARY_OFFICIAL_SOURCE_CONFIGS.filter((source) =>
    normalizeKey(source.company) === key
  );
}

async function captureCustomOfficialSource(
  company: string,
  task: Record<string, unknown>,
  body: RequestBody,
  limits: ReturnType<typeof controlledLimits>,
): Promise<Record<string, unknown> | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    SOURCE_CAPTURE_COMPANY_TIMEOUT_MS,
  );
  try {
    const customResult = await fetchCustomOfficialSourceJobs(company, {
      signal: controller.signal,
      timeoutMs: SOURCE_CAPTURE_TIMEOUT_MS,
      maxCards: limits.maxCandidateCardsPerCompany,
    });
    if (!customResult.handled) return null;
    return buildCustomOfficialSourceCapture(
      company,
      customResult,
      task,
      limits,
      uniqueStrings([
        ...arrayFromUnknown(task.official_career_urls),
        ...officialUrlsForCompany(body, company),
      ]),
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export function buildCustomOfficialSourceCapture(
  requestedCompany: string,
  customResult: CustomOfficialSourceResult,
  task: Record<string, unknown>,
  limits: {
    maxCandidateCardsPerCompany: number;
    maxFullPostingsPerCompany: number;
    minimumListedBaseSalary: number;
  },
  configuredOfficialUrls: string[] = [],
): Record<string, unknown> {
  const company = customResult.company || requestedCompany;
  const allCards = customResult.cards.map((card) =>
    enrichCandidateCard({
      ...card,
      compensation_summary: firstNonEmpty([
        card.compensation_snippet,
        card.salary_snippet,
      ]),
    }, task)
  );
  const candidateCards = allCards.slice(
    0,
    limits.maxCandidateCardsPerCompany,
  );
  const titleQualifiedCandidates = filterLikelyCandidates(candidateCards);
  const compensationScreen = screenSearchResultsByCompensation(
    titleQualifiedCandidates,
    limits.minimumListedBaseSalary,
  );
  const likelyCandidates = compensationScreen.kept;
  const fullPostingCandidates = likelyCandidates.filter((candidate) =>
    candidate.full_posting_captured === true &&
    Boolean(customOfficialFullPostingText(candidate))
  );
  const selectedFullPostings = fullPostingCandidates.slice(
    0,
    limits.maxFullPostingsPerCompany,
  );
  const sourceUrls = uniqueStrings([
    ...customResult.officialUrls,
    ...candidateCards.flatMap((card) => [
      card.source_url,
      card.official_source_url,
      card.detail_url,
    ]),
  ]);
  const knownOfficialUrls = uniqueStrings([
    ...sourceUrls,
    ...configuredOfficialUrls,
  ]);
  const officialJobSearchUrl = customResult.officialUrls[0] ||
    sourceUrls[0] || "";
  const careersHomeUrl = configuredOfficialUrls[0] ||
    officialJobSearchUrl;
  const providerLabels = uniqueStrings(
    candidateCards.map((card) => card.ats_provider || card.provider),
  );
  const adapterTypes = uniqueStrings([
    ...candidateCards.map((card) => card.source_adapter_type),
    customResult.adapter ? `custom_${customResult.adapter}` : "",
  ]);
  const sourceGroup = firstNonEmpty(
    candidateCards.map((card) => card.source_group),
  ) || "Executive Operations";
  const provider = providerLabels.join(", ") ||
    String(customResult.adapter || "custom official source");
  const sourceAdapterType = adapterTypes.join(",") ||
    "custom_official_source";
  const sourceMetadata: OfficialSourceMetadata = {
    provider,
    sourceGroup,
    officialJobSearchUrl,
    sourceAdapterType,
    careersHomeUrl,
  };
  const results = selectedFullPostings.map((candidate) => {
    const rawText = customOfficialFullPostingText(candidate);
    return {
      ...buildOfficialAtsJobResult(company, {
        ...candidate,
        raw_posting_text: rawText,
        full_job_description: rawText,
        full_posting_text: rawText,
      }, sourceMetadata),
      full_posting_captured: true,
      full_job_description: rawText,
      full_posting_text: rawText,
      source_verified_by: "custom_official_source_full_posting_capture",
      source_verification_notes: uniqueStrings([
        candidate.source_verification_notes,
        "Full posting text was captured deterministically from the official source.",
      ]).join(" "),
    };
  });
  const errorMessages = customResult.errors.map(customOfficialSourceErrorText);
  const cardOnlyLikelyCandidates = Math.max(
    0,
    likelyCandidates.length - fullPostingCandidates.length,
  );
  const fallbackReason = likelyCandidates.length > 0 && results.length === 0
    ? "official_candidates_found_but_no_full_postings_captured"
    : "";
  const listPageStatus = candidateCards.length
    ? (customResult.errors.length
      ? "partial"
      : customResult.limitations.length
      ? "limited"
      : "ok")
    : (customResult.errors.length
      ? "broken"
      : customResult.limitations.length
      ? "limited"
      : "empty");
  const sourceReports = sourceUrls.map((url, index) => {
    const matchingError = customResult.errors.find((error) =>
      normalizeUrl(error.url) === normalizeUrl(url)
    );
    const matchingCard = candidateCards.find((card) =>
      [card.source_url, card.official_source_url, card.detail_url].some(
        (cardUrl) => normalizeUrl(String(cardUrl || "")) === normalizeUrl(url),
      )
    );
    const status = matchingError
      ? "broken"
      : matchingCard && matchingCard.full_posting_captured !== true
      ? "candidate_only"
      : index === 0 && customResult.limitations.length
      ? "limited"
      : "ok";
    return {
      type: String(matchingCard?.source_type || "official"),
      provider,
      url,
      title: `${company} official source`,
      captured_at: new Date().toISOString(),
      status,
      candidate_cards: matchingCard ? 1 : undefined,
      error: matchingError?.message,
    };
  });
  const fullPostingResultGate =
    "Only cards with full_posting_captured=true and non-empty raw/full posting text may become verified full-posting results.";
  const directory = {
    ...companySourceDirectoryRecord(company, {
      official_website: httpOrigin(careersHomeUrl),
      official_careers_home_url: careersHomeUrl,
      official_job_search_url: officialJobSearchUrl,
      ats_provider: provider,
      source_adapter_type: sourceAdapterType,
      capture_strategy:
        "Bounded deterministic official-source inventory, cheap title and compensation screening, then strict full-posting promotion.",
      browser_required_yes_no: "no",
      source_confidence: candidateCards.length && !customResult.errors.length
        ? (customResult.limitations.length ? "medium" : "high")
        : "low",
      source_group: sourceGroup,
    }),
    source_urls_checked: sourceUrls,
    official_source_urls: knownOfficialUrls,
    configured_official_urls: configuredOfficialUrls,
    source_limitations: customResult.limitations,
    source_errors: customResult.errors,
    candidate_cards_extracted: candidateCards.length,
    likely_fit_candidates: likelyCandidates.length,
    card_only_likely_candidates: cardOnlyLikelyCandidates,
    full_postings_captured: results.length,
    full_posting_result_gate: fullPostingResultGate,
    job_posting_capture_notes: fullPostingResultGate,
  };
  const resultsWithDirectory = results.map((result) => ({
    ...result,
    company_source_directory: directory,
  }));

  return {
    company,
    custom_source_capture: true,
    custom_source_adapter: customResult.adapter,
    source_refresh_completed: candidateCards.length > 0 ||
      customResult.errors.length === 0,
    job_list_captured: candidateCards.length > 0,
    browser_required: false,
    source_adapter_type: sourceAdapterType,
    official_job_search_url: officialJobSearchUrl,
    official_careers_home_url: careersHomeUrl,
    ats_provider: provider,
    list_page_status: listPageStatus,
    candidate_cards_total: candidateCards.length,
    candidate_cards: candidateCards,
    likely_candidates: likelyCandidates,
    card_only_likely_candidates: cardOnlyLikelyCandidates,
    full_posting_candidates_available: fullPostingCandidates.length,
    cheap_screened_out: Math.max(
      0,
      candidateCards.length - titleQualifiedCandidates.length,
    ),
    compensation_screened_out: compensationScreen.screenedOut.length,
    compensation_screened_out_below_floor:
      compensationScreen.screenedOutBelowFloor,
    compensation_screened_out_missing_comp:
      compensationScreen.screenedOutMissingComp,
    deferred_due_to_full_posting_cap: Math.max(
      0,
      fullPostingCandidates.length - selectedFullPostings.length,
    ),
    results: resultsWithDirectory,
    scout_fallback_reason: fallbackReason,
    full_posting_result_gate: fullPostingResultGate,
    source_urls_checked: sourceUrls,
    official_sources_checked: sourceUrls.length,
    source_limitations: customResult.limitations,
    source_errors: customResult.errors,
    errors: errorMessages,
    sources: sourceReports,
    company_source_directory: directory,
  };
}

function customOfficialFullPostingText(
  card: Record<string, unknown>,
): string {
  return firstNonEmpty([
    card.raw_posting_text,
    card.full_job_description,
    card.full_posting_text,
  ]);
}

function customOfficialSourceErrorText(
  error: CustomOfficialSourceError,
): string {
  const status = error.status ? ` HTTP ${error.status}` : "";
  const url = error.url ? ` (${error.url})` : "";
  return `${error.company} ${error.adapter} ${error.code}${status}: ${error.message}${url}`;
}

async function captureOfficialAtsSource(
  company: string,
  sourceConfigs: OfficialAtsSourceConfig[],
  task: Record<string, unknown>,
  body: RequestBody,
  limits: ReturnType<typeof controlledLimits>,
): Promise<Record<string, unknown>> {
  const errors: string[] = [];
  const cardsBySource: NormalizedCandidateCard[][] = [];
  const sourceReports: Array<Record<string, unknown>> = [];

  for (const source of sourceConfigs) {
    const sourceUrl = buildOfficialAtsUrl(source);
    try {
      const cards = await fetchOfficialAtsJobs(source, {
        timeoutMs: SOURCE_CAPTURE_COMPANY_TIMEOUT_MS,
      });
      cardsBySource.push(cards);
      sourceReports.push({
        type: "official_ats",
        provider: source.provider,
        url: sourceUrl,
        title: source.sourceName ||
          `${company} ${source.provider} official jobs`,
        captured_at: new Date().toISOString(),
        status: "ok",
        candidate_cards: cards.length,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${company} ${source.provider} capture failed: ${message}`);
      sourceReports.push({
        type: "official_ats",
        provider: source.provider,
        url: sourceUrl,
        title: source.sourceName ||
          `${company} ${source.provider} official jobs`,
        captured_at: new Date().toISOString(),
        status: "broken",
        error: message,
      });
    }
  }

  const allCards = uniqueByKey(
    cardsBySource.flat().map((card) =>
      enrichCandidateCard(card as unknown as Record<string, unknown>, task)
    ),
    (card) =>
      normalizeUrl(String(card.source_url || "")) ||
      String(card.job_id_external || ""),
  );
  const retainedCards = allCards.slice(0, limits.maxCandidateCardsPerCompany);
  const titleQualifiedCandidates = filterLikelyCandidates(allCards);
  const compensationScreen = screenSearchResultsByCompensation(
    titleQualifiedCandidates,
    limits.minimumListedBaseSalary,
  );
  const likelyCandidates = compensationScreen.kept.slice(
    0,
    limits.maxFullPostingsPerCompany,
  );
  const deferredDueToFullPostingCap = Math.max(
    0,
    compensationScreen.kept.length - likelyCandidates.length,
  );
  const successfulSources =
    sourceReports.filter((source) => source.status === "ok").length;
  const sourceUrls = sourceConfigs.map(buildOfficialAtsUrl);
  const providerLabels = uniqueStrings(
    sourceConfigs.map((source) => titleCaseLocation(source.provider)),
  );
  const adapterTypes = uniqueStrings(
    sourceConfigs.map((source) => `ats_${source.provider}`),
  );
  const careersUrls = uniqueStrings([
    ...arrayFromUnknown(task.official_career_urls),
    ...officialUrlsForCompany(body, company),
  ]);
  const careersHome = careersUrls[0] || sourceUrls[0] || "";
  const sourceGroup =
    sourceConfigs.map((source) => source.sourceGroup || "").find(Boolean) ||
    "Executive Operations";
  const primarySource = sourceConfigs[0];
  if (!primarySource) {
    throw new Error(
      `No official ATS source configuration exists for ${company}.`,
    );
  }
  const sourceMetadata: OfficialSourceMetadata = {
    provider: providerLabels.join(", ") || primarySource.provider,
    sourceGroup,
    officialJobSearchUrl: sourceUrls[0] || "",
    sourceAdapterType: adapterTypes.join(",") ||
      `ats_${primarySource.provider}`,
    careersHomeUrl: careersHome,
  };
  const results = likelyCandidates.map((candidate) =>
    buildOfficialAtsJobResult(company, candidate, sourceMetadata)
  );

  return {
    company,
    source_refresh_completed: successfulSources > 0,
    job_list_captured: allCards.length > 0,
    browser_required: false,
    source_adapter_type: adapterTypes.join(","),
    official_job_search_url: sourceUrls[0] || "",
    official_careers_home_url: careersHome,
    ats_provider: providerLabels.join(", "),
    list_page_status: successfulSources === sourceConfigs.length
      ? "ok"
      : successfulSources > 0
      ? "partial"
      : "broken",
    candidate_cards_total: allCards.length,
    candidate_cards: retainedCards,
    likely_candidates: likelyCandidates,
    cheap_screened_out: Math.max(
      0,
      allCards.length - titleQualifiedCandidates.length,
    ),
    compensation_screened_out: compensationScreen.screenedOut.length,
    compensation_screened_out_below_floor:
      compensationScreen.screenedOutBelowFloor,
    compensation_screened_out_missing_comp:
      compensationScreen.screenedOutMissingComp,
    deferred_due_to_full_posting_cap: deferredDueToFullPostingCap,
    results,
    source_urls_checked: sourceUrls,
    official_sources_checked: sourceConfigs.length,
    errors,
    sources: sourceReports,
    company_source_directory: companySourceDirectoryRecord(company, {
      official_website: httpOrigin(careersHome),
      official_careers_home_url: careersHome,
      official_job_search_url: sourceUrls[0] || "",
      ats_provider: providerLabels.join(", "),
      source_adapter_type: adapterTypes.join(","),
      capture_strategy:
        "Direct official ATS inventory, cheap title/location/compensation screening, then durable full-posting capture only for likely and high-upside candidates.",
      browser_required_yes_no: "no",
      source_confidence: successfulSources ? "high" : "low",
      source_group: sourceGroup,
    }),
  };
}

async function captureSecondaryOfficialSource(
  company: string,
  sourceConfigs: SecondaryJobSourceConfig[],
  task: Record<string, unknown>,
  body: RequestBody,
  limits: ReturnType<typeof controlledLimits>,
): Promise<Record<string, unknown>> {
  const errors: string[] = [];
  const cardsBySource: NormalizedSecondaryCandidateCard[][] = [];
  const sourceReports: Array<Record<string, unknown>> = [];
  const configuredSources = sourceConfigs.map((source) => ({
    ...source,
    queries: mergeSourceQueries(source.queries, secondarySearchQueries(task)),
  } as SecondaryJobSourceConfig));
  const maxCardsToScan = Math.min(
    2_000,
    Math.max(500, limits.maxCandidateCardsPerCompany * 5),
  );

  for (const source of configuredSources) {
    const sourceUrl = secondarySourceListUrl(source);
    try {
      const cards = await fetchSecondaryCandidateCards(source, maxCardsToScan);
      cardsBySource.push(cards);
      sourceReports.push({
        type: source.type === "phenom" ? "official" : "official_ats",
        provider: source.provider || source.type,
        url: sourceUrl,
        title: `${company} ${source.provider || source.type} official jobs`,
        captured_at: new Date().toISOString(),
        status: "ok",
        candidate_cards: cards.length,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${company} ${source.type} capture failed: ${message}`);
      sourceReports.push({
        type: source.type === "phenom" ? "official" : "official_ats",
        provider: source.provider || source.type,
        url: sourceUrl,
        title: `${company} ${source.provider || source.type} official jobs`,
        captured_at: new Date().toISOString(),
        status: "broken",
        error: message,
      });
    }
  }

  const allCards = uniqueByKey(
    cardsBySource.flat().map((card) =>
      enrichCandidateCard(card as unknown as Record<string, unknown>, task)
    ),
    (card) =>
      normalizeUrl(String(card.source_url || "")) ||
      String(card.job_id_external || ""),
  );
  const retainedCards = allCards.slice(0, limits.maxCandidateCardsPerCompany);
  const titleQualifiedCandidates = filterLikelyCandidates(allCards);
  const cardCompensationScreen = screenSearchResultsByCompensation(
    titleQualifiedCandidates,
    limits.minimumListedBaseSalary,
  );
  const detailCandidateLimit = Math.max(
    limits.maxFullPostingsPerCompany,
    limits.maxFullPostingsPerCompany * 3,
  );
  const detailCandidates = cardCompensationScreen.kept.slice(
    0,
    detailCandidateLimit,
  );
  const detailedCandidates: Array<Record<string, unknown>> = [];

  for (const candidate of detailCandidates) {
    const source = configuredSources.find((config) =>
      config.type === String(candidate.detail_type || candidate.provider || "")
    ) || configuredSources[0];
    if (!source) {
      continue;
    }
    try {
      const detail = await fetchSecondaryCandidateDetail(source, candidate);
      if (!detail?.full_posting_captured || !detail.raw_posting_text) {
        errors.push(
          `${company} ${
            candidate.role_title || candidate.title
          } returned no full posting text.`,
        );
        continue;
      }
      detailedCandidates.push(
        enrichCandidateCard(
          detail as unknown as Record<string, unknown>,
          task,
        ),
      );
    } catch (error) {
      errors.push(
        `${company} detail capture failed for ${candidate.source_url}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  const detailCompensationScreen = screenSearchResultsByCompensation(
    detailedCandidates,
    limits.minimumListedBaseSalary,
  );
  const likelyCandidates = detailCompensationScreen.kept.slice(
    0,
    limits.maxFullPostingsPerCompany,
  );
  const deferredDueToFullPostingCap = Math.max(
    0,
    cardCompensationScreen.kept.length - detailCandidates.length,
  ) + Math.max(
    0,
    detailCompensationScreen.kept.length - likelyCandidates.length,
  );
  const sourceUrls = configuredSources.map(secondarySourceListUrl);
  const providerLabels = uniqueStrings(
    configuredSources.map((source) => source.provider || source.type),
  );
  const adapterTypes = uniqueStrings(
    configuredSources.map(secondarySourceAdapterType),
  );
  const careersUrls = uniqueStrings([
    ...arrayFromUnknown(task.official_career_urls),
    ...officialUrlsForCompany(body, company),
  ]);
  const careersHome = careersUrls[0] || sourceUrls[0] || "";
  const sourceGroup = configuredSources
    .map((source) => source.sourceGroup || "")
    .find(Boolean) || "Executive Operations";
  const sourceMetadata: OfficialSourceMetadata = {
    provider: providerLabels.join(", "),
    sourceGroup,
    officialJobSearchUrl: sourceUrls[0] || "",
    sourceAdapterType: adapterTypes.join(","),
    careersHomeUrl: careersHome,
  };
  const results = likelyCandidates.map((candidate) =>
    buildOfficialAtsJobResult(company, candidate, sourceMetadata)
  );
  const successfulSources =
    sourceReports.filter((source) => source.status === "ok").length;
  const compensationScreenedOut = cardCompensationScreen.screenedOut.length +
    detailCompensationScreen.screenedOut.length;

  return {
    company,
    source_refresh_completed: successfulSources > 0,
    job_list_captured: allCards.length > 0,
    browser_required: false,
    source_adapter_type: adapterTypes.join(","),
    official_job_search_url: sourceUrls[0] || "",
    official_careers_home_url: careersHome,
    ats_provider: providerLabels.join(", "),
    list_page_status: successfulSources === configuredSources.length
      ? "ok"
      : successfulSources > 0
      ? "partial"
      : "broken",
    candidate_cards_total: allCards.length,
    candidate_cards: retainedCards,
    likely_candidates: likelyCandidates,
    cheap_screened_out: Math.max(
      0,
      allCards.length - titleQualifiedCandidates.length,
    ),
    compensation_screened_out: compensationScreenedOut,
    compensation_screened_out_below_floor:
      cardCompensationScreen.screenedOutBelowFloor +
      detailCompensationScreen.screenedOutBelowFloor,
    compensation_screened_out_missing_comp:
      cardCompensationScreen.screenedOutMissingComp +
      detailCompensationScreen.screenedOutMissingComp,
    deferred_due_to_full_posting_cap: deferredDueToFullPostingCap,
    results,
    source_urls_checked: uniqueStrings([
      ...sourceUrls,
      ...detailedCandidates.map((candidate) =>
        String(candidate.source_url || "")
      ),
    ]),
    official_sources_checked: configuredSources.length,
    errors,
    sources: sourceReports,
    company_source_directory: companySourceDirectoryRecord(company, {
      official_website: httpOrigin(careersHome),
      official_careers_home_url: careersHome,
      official_job_search_url: sourceUrls[0] || "",
      ats_provider: providerLabels.join(", "),
      source_adapter_type: adapterTypes.join(","),
      capture_strategy:
        "Targeted official inventory queries, cheap title/location/compensation screening, then detail capture only for likely and high-upside candidates.",
      browser_required_yes_no: "no",
      source_confidence: successfulSources ? "high" : "low",
      source_group: sourceGroup,
    }),
  };
}

function secondarySearchQueries(task: Record<string, unknown>): string[] {
  return uniqueStrings([
    "operations",
    "strategy",
    "business operations",
    "customer experience",
    "marketplace",
    "general manager",
    "chief of staff",
    ...arrayFromUnknown(task.role_family_cluster),
  ]);
}

function secondarySourceListUrl(source: SecondaryJobSourceConfig): string {
  const query = source.queries?.[0] || "operations";
  switch (source.type) {
    case "workday":
      return buildWorkdaySearchRequest(source, query).url;
    case "smartrecruiters":
      return buildSmartRecruitersSearchRequest(source, query).url;
    case "phenom":
      return buildPhenomSearchRequest(source, query).url;
  }
}

function secondarySourceAdapterType(
  source: SecondaryJobSourceConfig,
): string {
  return source.type === "phenom" ? "official_phenom" : `ats_${source.type}`;
}

async function fetchSecondaryCandidateCards(
  source: SecondaryJobSourceConfig,
  maxCards: number,
): Promise<NormalizedSecondaryCandidateCard[]> {
  const options = {
    timeoutMs: SOURCE_CAPTURE_COMPANY_TIMEOUT_MS,
    maxCards,
  };
  switch (source.type) {
    case "workday":
      return await fetchWorkdayCandidateCards(source, options);
    case "smartrecruiters":
      return await fetchSmartRecruitersCandidateCards(source, options);
    case "phenom":
      return await fetchPhenomCandidateCards(source, options);
  }
}

async function fetchSecondaryCandidateDetail(
  source: SecondaryJobSourceConfig,
  candidate: Record<string, unknown>,
): Promise<NormalizedSecondaryCandidateCard | null> {
  const seed = candidate as unknown as NormalizedSecondaryCandidateCard;
  const options = { timeoutMs: SOURCE_CAPTURE_COMPANY_TIMEOUT_MS };
  switch (source.type) {
    case "workday":
      return await fetchWorkdayJobDetail(
        source,
        workdayExternalPath(source, String(candidate.detail_url || "")),
        seed,
        options,
      );
    case "smartrecruiters":
      return await fetchSmartRecruitersJobDetail(
        source,
        secondaryPostingId(candidate),
        seed,
        options,
      );
    case "phenom":
      return await fetchPhenomJobDetail(
        source,
        String(candidate.external_id || candidate.job_id_external || ""),
        String(candidate.role_title || candidate.title || ""),
        seed,
        options,
      );
  }
}

function workdayExternalPath(
  source: Extract<SecondaryJobSourceConfig, { type: "workday" }>,
  detailUrl: string,
): string {
  const url = new URL(detailUrl);
  const prefix = `/wday/cxs/${encodeURIComponent(source.tenant)}/${
    encodeURIComponent(source.site)
  }/`;
  if (!url.pathname.startsWith(prefix)) {
    throw new Error("Workday detail URL did not match the configured tenant.");
  }
  return decodeURIComponent(url.pathname.slice(prefix.length));
}

function secondaryPostingId(candidate: Record<string, unknown>): string {
  const explicit = String(
    candidate.company_job_id || candidate.external_id ||
      candidate.job_id_external || "",
  );
  if (explicit) return explicit;
  const url = new URL(String(candidate.detail_url || candidate.source_url));
  return decodeURIComponent(
    url.pathname.split("/").filter(Boolean).pop() || "",
  );
}

function candidateCardFromLink(
  company: string,
  adapter: string,
  link: { href: string; text: string },
  index: number,
): Record<string, unknown> {
  const sourceUrl = absolutizeUrl(link.href, "https://careers.withwaymo.com");
  const title = normalizeWhitespace(link.text).replace(/\s+Read more$/i, "");
  const location = locationFromUrl(sourceUrl);
  return {
    job_result_id: stableId("candidate", company, sourceUrl, index),
    company,
    role_title: title,
    title,
    location,
    team: /operations/i.test(title) ? "Operations" : "",
    source_url: sourceUrl,
    official_source_url: sourceUrl,
    posting_source_name: `${company} official careers`,
    source_type: "official",
    source_adapter_type: adapter,
    link_health: "ok",
    active_status: "needs_verification",
    captured_at: new Date().toISOString(),
  };
}

function whatnotCandidateCard(
  row: Record<string, unknown>,
  index: number,
): Record<string, unknown> {
  const locations = uniqueStrings([
    row.locationName,
    ...arrayFromUnknown(row.secondaryLocationNames),
  ]);
  return {
    job_result_id: stableId(
      "candidate",
      "Whatnot",
      row.id || row.externalLink || index,
    ),
    company: "Whatnot",
    role_title: String(row.title || ""),
    title: String(row.title || ""),
    location: locations.join("; "),
    team: String(row.teamName || row.departmentName || ""),
    department: String(row.departmentName || ""),
    work_style: String(row.workplaceType || ""),
    employment_type: String(row.employmentType || ""),
    source_url: String(row.externalLink || row.applyLink || ""),
    official_source_url: String(row.externalLink || row.applyLink || ""),
    ats_source_url: String(row.externalLink || row.applyLink || ""),
    posting_source_name: "Whatnot Ashby",
    source_type: "official",
    source_adapter_type: "ats_ashby",
    ats_provider: "Ashby",
    job_id_external: String(row.id || ""),
    company_job_id: String(row.jobId || ""),
    compensation_summary: String(row.compensationTierSummary || ""),
    compensation_bucket: compensationBucket(
      String(row.compensationTierSummary || ""),
    ),
    ...compRangeFields(String(row.compensationTierSummary || "")),
    link_health: "ok",
    active_status: "needs_verification",
    captured_at: new Date().toISOString(),
    source_card: row,
  };
}

function enrichCandidateCard(
  card: Record<string, unknown>,
  task: Record<string, unknown>,
): Record<string, unknown> {
  const fit = cheapCandidateFit(
    card,
    arrayFromUnknown(task.role_family_cluster),
  );
  const location = classifyLocation(
    String(card.location || ""),
    String(card.work_style || ""),
    String(card.source_url || ""),
  );
  return {
    ...card,
    ...location,
    role_family_match: fit.roleFamilyMatch,
    cheap_filter_score: fit.score,
    cheap_filter_status: fit.status,
    cheap_filter_reasons: fit.reasons,
    seniority_plausible: fit.seniorityPlausible,
    source_status: "needs_manual_verification",
    last_verified_at: new Date().toISOString(),
    date_checked: new Date().toISOString(),
    posting_age_days: 0,
  };
}

function filterLikelyCandidates(
  cards: Array<Record<string, unknown>>,
): Array<Record<string, unknown>> {
  return cards
    .filter((card) =>
      ["likely_fit", "borderline_high_upside"].includes(
        String(card.cheap_filter_status || ""),
      )
    )
    .sort((a, b) =>
      Number(b.cheap_filter_score || 0) - Number(a.cheap_filter_score || 0)
    );
}

function seniorRoleSignal(text: string): boolean {
  return /(vp|vice president|head of|chief operating officer|\bcoo\b|president|general manager|\bgm\b|senior director|sr\.?\s*director|director|regional operations leader|site operations leader|chief of staff)/i
    .test(text);
}

function targetOperationsSignal(text: string): boolean {
  return /(operations control|network operations|operational intelligence|strategy\s*&?\s*operations|business operations|marketplace|commerce operations|customer experience|post-purchase|partner operations|vendor operations|support operations|trust\s*&?\s*safety|logistics|fulfillment|process improvement|operational excellence|field operations|multi-site|launch operations|high-volume operations|service operations|transformation|automation|p&l|team leadership)/i
    .test(text);
}

function cautionKeywordSignal(text: string): boolean {
  return /(entry-level|coordinator|associate|individual contributor only|pure sales|account executive|deep software engineering|highly technical product|warehouse supervisor|support agent|frontline support|low-scope manager|required credential)/i
    .test(text);
}

function cheapCandidateFit(
  card: Record<string, unknown>,
  roleFamilies: string[],
): Record<string, unknown> {
  const text = normalizeWhitespace([
    card.role_title,
    card.title,
    card.team,
    card.department,
    card.location,
    card.compensation_summary,
    card.source_url,
  ].join(" "));
  const lower = text.toLowerCase();
  const reasons: string[] = [];
  let score = 0;
  const senior = seniorRoleSignal(text);
  const roleMatch = targetOperationsSignal(text);
  const caution = cautionKeywordSignal(text);
  const seniorityPlausible =
    !/(agent|associate|specialist|coordinator|representative|new grad|intern|hourly|contract)/i
      .test(text) || senior;
  if (senior) {
    score += 35;
    reasons.push("senior title");
  } else if (/(senior manager|sr manager|manager|lead|principal)/i.test(text)) {
    score += 18;
    reasons.push("manager-plus title");
  }
  if (roleMatch) {
    score += 35;
    reasons.push("target role family");
  }
  if (
    /(phoenix|tempe|scottsdale|arizona|remote-united-states|remote us)/i.test(
      text,
    )
  ) {
    score += 20;
    reasons.push("Arizona or U.S. remote signal");
  } else if (
    /(los angeles|san francisco|seattle|new york|mountain view)/i.test(text)
  ) {
    score += 5;
    reasons.push("acceptable relocation market, needs threshold");
  }
  const comp = compRangeFields(String(card.compensation_summary || ""));
  if (Number(comp.estimated_total_comp_max || 0) >= 250000) {
    score += 15;
    reasons.push("visible comp near target");
  } else if (senior && !/\$\s*\d/.test(text)) {
    score += 12;
    reasons.push("senior no listed comp, keep for verification");
  } else if (/equity|stock option|high upside/i.test(text)) {
    score += 8;
    reasons.push("equity/high-upside signal");
  }
  if (caution && !senior) {
    score -= 25;
    reasons.push("caution keyword");
  } else if (caution) {
    reasons.push("caution keyword, needs review");
  }
  if (!seniorityPlausible) score -= 45;
  const status = score >= 55 && seniorityPlausible
    ? "likely_fit"
    : score >= 38 && seniorityPlausible
    ? "borderline_high_upside"
    : "skip_after_cheap_filter";
  return {
    score,
    status,
    reasons,
    seniorityPlausible,
    roleFamilyMatch: roleMatch ? "target" : "weak",
  };
}

function buildWaymoJobResult(
  candidate: Record<string, unknown>,
  html: string,
): Record<string, unknown> {
  const text = visibleTextFromHtml(html);
  const title = firstNonEmpty([
    String(candidate.role_title || ""),
    titleFromHtml(html),
  ]).replace(/\s+-\s+.*$/, "");
  const location = firstNonEmpty([
    String(candidate.location || ""),
    lineAfter(text, title),
    locationFromText(text),
  ]);
  const compensationText = firstMatch(text, /\$[\d,]+[—-]\$[\d,]+\s*USD/i);
  const responsibilities = sectionBullets(text, "You will:", "You have:");
  const required = sectionBullets(text, "You have:", "We prefer:");
  const preferred = sectionBullets(
    text,
    "We prefer:",
    "The expected base salary",
  );
  const teamContext = sentenceContaining(text, "Waymo Operations exists") ||
    sentenceContaining(text, "global team building and scaling");
  const reporting = sentenceContaining(text, "report to");
  const compactText = compactPostingText(text, title);
  const postingText = compactText.length >= 500
    ? compactText
    : text.slice(0, 30000);
  return completeJobSearchRecord({
    company: "Waymo",
    role_title: title,
    location,
    team: "Operations",
    work_style: /hybrid role/i.test(text)
      ? "Hybrid"
      : (/On Site/i.test(text) ? "On Site" : ""),
    source_url: String(candidate.source_url || ""),
    official_source_url: String(candidate.source_url || ""),
    posting_source_name: "Waymo official careers",
    source_type: "official",
    source_status: "official_verified",
    active_status: "verified_active",
    link_health: "ok",
    company_job_id: firstMatch(text, /Full-Time\s+Operations\s+(\d+)/i) ||
      firstMatch(text, /\n\s*(\d{4})\s*\n\s*On Site/i),
    raw_posting_text: postingText,
    job_description_text: postingText,
    responsibilities,
    required_qualifications: required,
    preferred_qualifications: preferred,
    skills_keywords: keywordsFromText(
      [title, ...responsibilities, ...required, ...preferred].join(" "),
    ),
    parsed_job_brief: parsedBriefForPosting({
      company: "Waymo",
      title,
      text,
      responsibilities,
      required,
      preferred,
      teamContext,
      reporting,
      location,
      workStyle: /hybrid role/i.test(text) ? "Hybrid" : "On Site",
      compensationText,
      companyAbout: sentenceContaining(
        text,
        "autonomous driving technology company",
      ),
      businessModel:
        "Autonomous driving technology and fully autonomous ride-hail operations.",
    }),
    company_context: companyContextRecord(
      "Waymo",
      "https://waymo.com",
      "https://careers.withwaymo.com/jobs",
      sentenceContaining(text, "autonomous driving technology company"),
      "Autonomous driving technology and ride-hail operations.",
    ),
    company_source_directory: companySourceDirectoryRecord("Waymo", {
      official_website: "https://waymo.com",
      official_careers_home_url: "https://careers.withwaymo.com/jobs",
      official_job_search_url:
        "https://careers.withwaymo.com/jobs/search?query=Operations",
      source_adapter_type: "direct_html",
      capture_strategy: "Direct HTML list and posting capture.",
      browser_required_yes_no: "no",
      source_confidence: "high",
      source_group: "Real-World Tech / Autonomous / Robotics",
    }),
    ...compRangeFields(compensationText),
    compensation_bucket: compensationBucket(compensationText),
    ...classifyLocation(
      location,
      /hybrid role/i.test(text) ? "Hybrid" : "On Site",
      text,
    ),
  });
}

function buildAshbyJobResult(
  company: string,
  candidate: Record<string, unknown>,
  html: string,
): Record<string, unknown> {
  const jsonLd = extractJsonLdJobPosting(html);
  const descriptionText = visibleTextFromHtml(String(jsonLd.description || ""));
  const rawText = descriptionText ||
    compactPostingText(
      visibleTextFromHtml(html),
      String(candidate.role_title || ""),
    );
  const title = firstNonEmpty([
    String(jsonLd.title || ""),
    String(candidate.role_title || ""),
  ]);
  const location = firstNonEmpty([
    jobLocationsFromJsonLd(jsonLd),
    String(candidate.location || ""),
  ]);
  const compensationText = firstNonEmpty([
    baseSalaryFromJsonLd(jsonLd),
    String(candidate.compensation_summary || ""),
  ]);
  const responsibilities = sectionBullets(rawText, "The Role", "You");
  const required = sectionBullets(rawText, "You", "Nice to Have");
  const preferred = sectionBullets(rawText, "Nice to Have", "Compensation");
  const teamContext =
    sentenceContaining(rawText, "largest livestream shopping platform") ||
    sentenceContaining(rawText, "future of commerce");
  const identifier =
    jsonLd.identifier && typeof jsonLd.identifier === "object" &&
      !Array.isArray(jsonLd.identifier)
      ? jsonLd.identifier as Record<string, unknown>
      : {};
  return completeJobSearchRecord({
    company,
    role_title: title,
    location,
    team: String(candidate.team || ""),
    work_style: String(candidate.work_style || ""),
    source_url: String(candidate.source_url || ""),
    official_source_url: String(candidate.source_url || ""),
    ats_source_url: String(candidate.source_url || ""),
    posting_source_name: `${company} Ashby`,
    source_type: "official",
    source_status: "ats_verified",
    active_status: "verified_active",
    link_health: "ok",
    ats_provider: "Ashby",
    job_id_external: String(
      candidate.job_id_external || identifier.value || "",
    ),
    company_job_id: String(candidate.company_job_id || identifier.value || ""),
    raw_posting_text: rawText,
    job_description_text: rawText,
    responsibilities,
    required_qualifications: required,
    preferred_qualifications: preferred,
    skills_keywords: keywordsFromText(
      [title, ...responsibilities, ...required, ...preferred].join(" "),
    ),
    parsed_job_brief: parsedBriefForPosting({
      company,
      title,
      text: rawText,
      responsibilities,
      required,
      preferred,
      teamContext,
      reporting: sentenceContaining(rawText, "leadership team")
        ? "Works directly with Whatnot's leadership team."
        : "",
      location,
      workStyle: String(candidate.work_style || ""),
      compensationText,
      companyAbout: sentenceContaining(
        rawText,
        "largest livestream shopping platform",
      ),
      businessModel:
        "Livestream commerce marketplace connecting buyers and sellers across categories.",
    }),
    company_context: companyContextRecord(
      company,
      "https://www.whatnot.com",
      "https://careers.whatnot.com",
      sentenceContaining(rawText, "largest livestream shopping platform"),
      "Livestream commerce marketplace.",
    ),
    company_source_directory: companySourceDirectoryRecord(company, {
      official_website: "https://www.whatnot.com",
      official_careers_home_url: "https://careers.whatnot.com",
      official_job_search_url: "https://jobs.whatnot.com/api/jobs",
      ats_provider: "Ashby",
      ats_job_url_pattern: "https://jobs.ashbyhq.com/whatnot/{posting_id}",
      source_adapter_type: "ats_ashby",
      capture_strategy: "Official jobs API plus Ashby JSON-LD posting capture.",
      browser_required_yes_no: "no",
      source_confidence: "high",
      source_group: "Marketplace / Commerce / Logistics",
    }),
    ...compRangeFields(compensationText),
    compensation_bucket: compensationBucket(compensationText),
    ...classifyLocation(location, String(candidate.work_style || ""), rawText),
  });
}

function buildOfficialAtsJobResult(
  company: string,
  candidate: Record<string, unknown>,
  sourceMetadata: OfficialSourceMetadata,
): Record<string, unknown> {
  const rawText = firstNonEmpty([
    candidate.full_posting_text,
    candidate.full_job_description,
    candidate.raw_posting_text,
    candidate.card_snippet,
  ]);
  const title = firstNonEmpty([candidate.role_title, candidate.title]);
  const location = String(candidate.location || "");
  const workStyle = firstNonEmpty([
    candidate.work_style,
    candidate.workplace_type,
    candidate.workplace,
  ]);
  const compensationText = firstNonEmpty([
    candidate.compensation_snippet,
    candidate.salary_snippet,
  ]);
  const responsibilities = postingSectionBullets(
    rawText,
    [
      "Responsibilities",
      "What you'll do",
      "What you will do",
      "You will",
      "In this role",
      "The role",
    ],
    [
      "Qualifications",
      "What you bring",
      "You have",
      "Requirements",
      "Minimum qualifications",
      "Preferred qualifications",
    ],
  );
  const required = postingSectionBullets(
    rawText,
    [
      "Qualifications",
      "What you bring",
      "You have",
      "Requirements",
      "Minimum qualifications",
      "Required qualifications",
    ],
    [
      "Preferred qualifications",
      "Preferred",
      "Nice to have",
      "Bonus",
      "Compensation",
      "Benefits",
    ],
  );
  const preferred = postingSectionBullets(
    rawText,
    [
      "Preferred qualifications",
      "Preferred",
      "Nice to have",
      "Bonus points",
      "Bonus",
    ],
    ["Compensation", "Salary", "Pay range", "Benefits", "Equal opportunity"],
  );
  const sourceUrl = String(candidate.source_url || candidate.job_url || "");
  const careersHome = sourceMetadata.careersHomeUrl || sourceUrl;
  const provider = String(
    candidate.ats_provider || sourceMetadata.provider || "official ATS",
  );
  const sourceGroup = String(
    candidate.source_group || sourceMetadata.sourceGroup ||
      "Executive Operations",
  );
  const teamContext = firstNonEmpty([
    String(candidate.team || ""),
    String(candidate.department || ""),
    sentenceContaining(rawText, "team"),
  ]);

  return completeJobSearchRecord({
    company,
    role_title: title,
    location,
    team: String(candidate.team || candidate.department || ""),
    department: String(candidate.department || ""),
    work_style: workStyle,
    source_url: sourceUrl,
    official_source_url: sourceUrl,
    ats_source_url: sourceUrl,
    posting_source_name: String(
      candidate.posting_source_name || `${company} ${provider}`,
    ),
    source_type: String(candidate.source_type || "official_ats"),
    source_status: "ats_verified",
    active_status: "verified_active",
    link_health: "ok",
    ats_provider: provider,
    job_id_external: String(
      candidate.job_id_external || candidate.external_id || "",
    ),
    company_job_id: String(
      candidate.external_id || candidate.job_id_external || "",
    ),
    posted_date: String(candidate.posted_date || ""),
    updated_at: String(candidate.updated_at || ""),
    posting_age_days: postingAgeDays(String(candidate.posted_date || "")),
    compensation_summary: compensationText,
    raw_posting_text: rawText,
    job_description_text: rawText,
    responsibilities,
    required_qualifications: required,
    preferred_qualifications: preferred,
    skills_keywords: keywordsFromText(
      [title, ...responsibilities, ...required, ...preferred].join(" "),
    ),
    parsed_job_brief: parsedBriefForPosting({
      company,
      title,
      text: rawText,
      responsibilities,
      required,
      preferred,
      teamContext,
      reporting: sentenceContaining(rawText, "report to") ||
        sentenceContaining(rawText, "reporting to"),
      location,
      workStyle,
      compensationText,
      companyAbout: "Needs verification",
      businessModel: "Needs verification",
    }),
    company_context: companyContextRecord(
      company,
      httpOrigin(careersHome),
      careersHome,
      "Needs verification",
      "Needs verification",
    ),
    company_source_directory: companySourceDirectoryRecord(company, {
      official_website: httpOrigin(careersHome),
      official_careers_home_url: careersHome,
      official_job_search_url: sourceMetadata.officialJobSearchUrl,
      ats_provider: provider,
      source_adapter_type: String(
        candidate.source_adapter_type || sourceMetadata.sourceAdapterType,
      ),
      capture_strategy:
        "Direct official ATS inventory and full posting payload for a screened likely or high-upside role.",
      browser_required_yes_no: "no",
      source_confidence: "high",
      source_group: sourceGroup,
    }),
    ...compRangeFields(compensationText),
    compensation_bucket: compensationBucket(compensationText),
    ...classifyLocation(location, workStyle, rawText),
  });
}

function postingSectionBullets(
  text: string,
  startLabels: string[],
  endLabels: string[],
): string[] {
  const source = String(text || "");
  const lower = source.toLowerCase();
  const starts = startLabels
    .map((label) => ({ label, index: lower.indexOf(label.toLowerCase()) }))
    .filter((match) => match.index >= 0)
    .sort((a, b) => a.index - b.index);
  if (!starts.length) return [];
  const start = starts[0];
  const ends = endLabels
    .map((label) =>
      lower.indexOf(label.toLowerCase(), start.index + start.label.length)
    )
    .filter((index) => index > start.index)
    .sort((a, b) => a - b);
  const section = source.slice(
    start.index + start.label.length,
    ends[0] || Math.min(source.length, start.index + 5000),
  );
  const lines = section.includes("\n")
    ? section.split(/\n+/)
    : section.split(/(?<=[.!?])\s+/);
  return uniqueStrings(
    lines
      .map((line) => normalizeWhitespace(line.replace(/^[-*•\d.)\s]+/, "")))
      .filter((line) => line.length >= 24 && line.length <= 700)
      .filter((line) =>
        !/^apply|equal opportunity|compensation|benefits/i.test(line)
      ),
  )
    .slice(0, 12);
}

function postingAgeDays(postedDate: string): number {
  const timestamp = Date.parse(postedDate);
  return Number.isFinite(timestamp)
    ? Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000))
    : 0;
}

function httpOrigin(value: string): string {
  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
}

function completeJobSearchRecord(
  input: Record<string, unknown>,
): Record<string, unknown> {
  const sourceUrl = String(
    input.source_url || input.official_source_url || input.ats_source_url || "",
  );
  const rawPostingText = String(
    input.raw_posting_text || input.job_description_text || "",
  );
  const parsedBrief = parsedJobBriefFromRecord(input);
  const postingHash = stableHash(rawPostingText);
  const normalizedPostingHash = stableHash(
    normalizePostingForHash(rawPostingText),
  );
  const otherDetails = otherDetailsFromRecord(input, rawPostingText);
  const fieldProvenance = fieldProvenanceFromRecord(input, sourceUrl);
  const sourceConflicts = sourceConflictsFromRecord(input, rawPostingText);
  const compensationDetails = compensationDetailsFromRecord(
    input,
    rawPostingText,
  );
  const inputWithCompensation = { ...input, ...compensationDetails };
  const questionsToVerify = questionsToVerifyFromRecord(inputWithCompensation);
  const applicationRequirements = applicationRequirementsFromRecord({
    ...inputWithCompensation,
    source_url: sourceUrl,
  });
  const contactReferral = contactReferralFromRecord(input);
  const manualOverrides = manualOverridesFromRecord(input);
  const knockoutFlags = knockoutFlagsFromRecord(input, rawPostingText);
  const enhancedParsedBrief: Record<string, unknown> = {
    ...parsedBrief,
    other_details: otherDetails,
    field_provenance: fieldProvenance,
    source_conflicts: sourceConflicts,
  };
  const comp = {
    estimated_total_comp_min: Number(
      input.estimated_total_comp_min || input.listed_base_min || 0,
    ),
    estimated_total_comp_max: Number(
      input.estimated_total_comp_max || input.listed_base_max || 0,
    ),
  };
  const location = classifyLocation(
    String(input.location || ""),
    String(input.work_style || ""),
    rawPostingText,
  );
  const capturedAt = String(input.captured_at || new Date().toISOString());
  const lastVerifiedAt = String(
    input.last_verified_at || new Date().toISOString(),
  );
  const company = String(input.company || "");
  const storedSourceDirectory = input.company_source_directory &&
      typeof input.company_source_directory === "object" &&
      !Array.isArray(input.company_source_directory)
    ? input.company_source_directory as Record<string, unknown>
    : {};
  const normalizedSourceDirectory = {
    ...storedSourceDirectory,
    ...companySourceDirectoryRecord(company, {
      ...storedSourceDirectory,
      source_group: storedSourceDirectory.company_group ||
        storedSourceDirectory.source_group,
    }),
  };
  return {
    job_result_id: String(
      input.job_result_id ||
        stableId("job-result", input.company, input.role_title, sourceUrl),
    ),
    company,
    role_title: String(input.role_title || ""),
    location: String(input.location || ""),
    source_url: sourceUrl,
    official_source_url: input.official_source_url
      ? String(input.official_source_url)
      : null,
    ats_source_url: input.ats_source_url ? String(input.ats_source_url) : null,
    linkedin_url: input.linkedin_url ? String(input.linkedin_url) : null,
    posting_source_name: String(
      input.posting_source_name || "official careers",
    ),
    job_id_external: input.job_id_external
      ? String(input.job_id_external)
      : null,
    company_job_id: input.company_job_id ? String(input.company_job_id) : null,
    captured_at: capturedAt,
    last_verified_at: lastVerifiedAt,
    source_status: String(input.source_status || "official_verified"),
    link_health: String(input.link_health || "ok"),
    posting_age_days: Number(input.posting_age_days || 0),
    source_type: normalizeJobSourceType(input.source_type || "official"),
    active_status: String(input.active_status || "verified_active"),
    date_checked: String(input.date_checked || new Date().toISOString()),
    compensation_bucket: String(
      input.compensation_bucket ||
        compensationBucket(
          String(
            input.compensation_summary || input.comp_notes ||
              compensationDetails.listed_total_comp_notes || "",
          ),
        ),
    ),
    ...comp,
    ...compensationDetails,
    relocation_required: Boolean(
      input.relocation_required ?? location.relocation_required,
    ),
    arizona_remote_ok: Boolean(
      input.arizona_remote_ok ?? location.arizona_remote_ok,
    ),
    location_category: String(
      input.location_category || location.location_category,
    ),
    region_preference_score: Number(
      input.region_preference_score ?? location.region_preference_score,
    ),
    relocation_friction_score: Number(
      input.relocation_friction_score ?? location.relocation_friction_score,
    ),
    relocation_threshold_adjustment: Number(
      input.relocation_threshold_adjustment ??
        location.relocation_threshold_adjustment,
    ),
    compensation_adjusted_for_location: String(
      input.compensation_adjusted_for_location ||
        location.compensation_adjusted_for_location || "",
    ),
    family_lifestyle_considerations: String(
      input.family_lifestyle_considerations ||
        location.family_lifestyle_considerations || "",
    ),
    city_region_notes: String(
      input.city_region_notes || location.city_region_notes || "",
    ),
    location_concerns: arrayFromUnknown(input.location_concerns).length
      ? arrayFromUnknown(input.location_concerns)
      : arrayFromUnknown(location.location_concerns),
    relocation_verdict: String(
      input.relocation_verdict || location.relocation_verdict,
    ),
    seniority_plausible: Boolean(
      input.seniority_plausible ??
        !/(agent|associate|specialist|coordinator|representative|new grad|intern|hourly)/i
          .test(String(input.role_title || "")),
    ),
    raw_posting_text: rawPostingText,
    parsing_model_version: PARSING_MODEL_VERSION,
    scoring_model_version: SCORING_MODEL_VERSION,
    career_canon_version: CAREER_CANON_VERSION,
    public_profile_version: PUBLIC_PROFILE_VERSION,
    preference_model_version: PREFERENCE_MODEL_VERSION,
    canonical_job_id: String(
      input.canonical_job_id ||
        stableId("canonical-job", input.company, input.role_title, sourceUrl),
    ),
    posting_hash: postingHash,
    normalized_posting_hash: normalizedPostingHash,
    prior_posting_hash: input.prior_posting_hash
      ? String(input.prior_posting_hash)
      : null,
    posting_changed_yes_no: Boolean(
      input.prior_posting_hash &&
        String(input.prior_posting_hash) !== postingHash,
    ),
    first_captured_at: String(input.first_captured_at || capturedAt),
    last_captured_at: String(input.last_captured_at || capturedAt),
    analysis_status: String(
      input.analysis_status || "source_verified_parsed_ready_for_scoring",
    ),
    score_status: String(input.score_status || "not_scored"),
    analysis_reused: Boolean(input.analysis_reused || false),
    rerun_reason: String(input.rerun_reason || "new_or_changed_posting"),
    analysis_cost: Number(input.analysis_cost || 0),
    packet_eligibility: String(
      input.packet_eligibility || "eligible_when_packet_requested",
    ),
    packet_blocked_reason: String(
      input.packet_blocked_reason ||
        "Packet generation remains off until Matthew explicitly requests it for this role.",
    ),
    parsed_job_brief: enhancedParsedBrief,
    other_details: otherDetails,
    field_provenance: fieldProvenance,
    source_conflicts: sourceConflicts,
    knockout_flags: knockoutFlags,
    questions_to_verify: questionsToVerify,
    application_requirements: applicationRequirements,
    contact_referral: contactReferral,
    manual_overrides: manualOverrides,
    company_context: input.company_context ||
      companyContextRecord(String(input.company || ""), "", "", "", ""),
    company_source_directory: normalizedSourceDirectory,
    job_description_text: String(
      input.job_description_text || input.raw_posting_text || "",
    ),
    responsibilities: arrayFromUnknown(input.responsibilities).length
      ? arrayFromUnknown(input.responsibilities)
      : arrayFromUnknown(enhancedParsedBrief["main_responsibilities"]),
    required_qualifications:
      arrayFromUnknown(input.required_qualifications).length
        ? arrayFromUnknown(input.required_qualifications)
        : arrayFromUnknown(enhancedParsedBrief["required_qualifications"]),
    preferred_qualifications:
      arrayFromUnknown(input.preferred_qualifications).length
        ? arrayFromUnknown(input.preferred_qualifications)
        : arrayFromUnknown(enhancedParsedBrief["preferred_qualifications"]),
    skills_keywords: arrayFromUnknown(input.skills_keywords).length
      ? arrayFromUnknown(input.skills_keywords)
      : arrayFromUnknown(enhancedParsedBrief["key_skills_and_keywords"]),
    grounding_sources: sourceRecordsFromUrls(
      uniqueStrings(
        [sourceUrl, ...arrayFromUnknown(input.grounding_sources).map(String)]
          .filter(Boolean),
      ),
      lastVerifiedAt,
    ),
    grounding_metadata_status: "unavailable_provider_response",
    grounding_source_urls: uniqueStrings(
      [sourceUrl, input.official_source_url, input.ats_source_url].filter(
        Boolean,
      ),
    ),
    grounding_queries: [],
    grounding_chunks_count: 0,
    url_context_used: false,
    google_search_used: false,
    source_verified_by: "official_url_capture",
    source_verification_notes: String(
      input.source_verification_notes ||
        "Source verified by official URL capture, posting text capture, timestamp, and link health. Provider grounding metadata was not requested for this deterministic source-first step.",
    ),
    verification_confidence: Number(input.verification_confidence || 0.9),
    rejection_reason: input.rejection_reason
      ? String(input.rejection_reason)
      : null,
  };
}

function sourceRecordsFromUrls(
  urls: string[],
  checkedAt: string,
): Array<Record<string, unknown>> {
  return uniqueStrings(urls.filter(Boolean)).map((url) => ({
    title: "Captured official source",
    url,
    source_type: "official",
    official_source: true,
    date_checked: checkedAt,
    verification_confidence: 0.95,
  }));
}

function parsedBriefForPosting(args: {
  company: string;
  title: string;
  text: string;
  responsibilities: string[];
  required: string[];
  preferred: string[];
  teamContext: string;
  reporting: string;
  location: string;
  workStyle: string;
  compensationText: string;
  companyAbout: string;
  businessModel: string;
}): Record<string, unknown> {
  const provisionalRecord = {
    company: args.company,
    role_title: args.title,
    location: args.location,
    work_style: args.workStyle,
    comp_notes: args.compensationText,
    responsibilities: args.responsibilities,
    required_qualifications: args.required,
    preferred_qualifications: args.preferred,
  };
  const otherDetails = otherDetailsFromRecord(provisionalRecord, args.text);
  const fieldProvenance = fieldProvenanceFromRecord(provisionalRecord, "");
  const sourceConflicts = sourceConflictsFromRecord(
    provisionalRecord,
    args.text,
  );
  return {
    company_about_short: args.companyAbout ||
      `${args.company} company context captured from the official posting.`,
    company_business_model: args.businessModel || "Needs verification",
    company_stage_or_context: "Needs verification",
    role_about_short: firstParagraph(args.text, args.title),
    role_mandate: args.responsibilities[0] || "Needs verification",
    why_they_are_hiring: "Needs verification",
    main_responsibilities: args.responsibilities,
    required_qualifications: args.required,
    preferred_qualifications: args.preferred,
    key_skills_and_keywords: keywordsFromText(
      [args.title, args.text].join(" "),
    ),
    team_context: args.teamContext || "Needs verification",
    reporting_relationship: args.reporting || "Needs verification",
    stakeholders: stakeholderKeywords(args.text),
    success_metrics: successMetricKeywords(args.text),
    location_requirements:
      [args.location, args.workStyle].filter(Boolean).join("; ") ||
      "Needs verification",
    remote_eligibility: args.workStyle || "Needs verification",
    travel_requirements: /travel/i.test(args.text)
      ? sentenceContaining(args.text, "travel")
      : "Needs verification",
    compensation_summary: args.compensationText || "Needs verification",
    equity_bonus_notes: /equity|stock option|bonus/i.test(args.text)
      ? "Posting references equity, stock options, or bonus eligibility where visible."
      : "Needs verification",
    why_it_may_fit_matthew:
      "Strong operations, marketplace, or real-world execution overlap with Matthew's operator background. Review scope, reporting line, and location tradeoff before packet work.",
    concerns_or_gaps:
      "Confirm exact authority, family/location fit, and total compensation before advancing.",
    verification_needed: [],
    other_details: otherDetails,
    field_provenance: fieldProvenance,
    source_conflicts: sourceConflicts,
  };
}

function companyContextRecord(
  company: string,
  website: string,
  careersUrl: string,
  about: string,
  businessModel: string,
): Record<string, unknown> {
  return {
    company_name: company,
    official_website: website || null,
    careers_url: careersUrl || null,
    company_about: about || null,
    business_model: businessModel || null,
    industry: null,
    company_stage: null,
    public_or_private: null,
    approximate_size: null,
    headquarters: null,
    why_company_may_interest_matthew: null,
    source_links: [website, careersUrl].filter(Boolean),
    last_updated_at: new Date().toISOString(),
  };
}

function companySourceDirectoryRecord(
  company: string,
  options: Record<string, unknown>,
): Record<string, unknown> {
  const group = String(
    options.source_group ||
      (company === "Waymo"
        ? "Real-World Tech / Autonomous / Robotics"
        : "Marketplace / Commerce / Logistics"),
  );
  return {
    company_id: normalizeKey(company),
    company_name: company,
    priority_tier: "P0",
    company_group: group,
    official_website: options.official_website
      ? String(options.official_website)
      : null,
    official_careers_home_url: options.official_careers_home_url
      ? String(options.official_careers_home_url)
      : null,
    official_job_search_url: options.official_job_search_url
      ? String(options.official_job_search_url)
      : null,
    ats_provider: options.ats_provider ? String(options.ats_provider) : null,
    ats_job_url_pattern: options.ats_job_url_pattern
      ? String(options.ats_job_url_pattern)
      : null,
    linkedin_company_url: null,
    linkedin_jobs_url: null,
    company_about_source_url: options.official_website
      ? String(options.official_website)
      : null,
    known_location_filters: [
      "Phoenix",
      "Tempe",
      "Scottsdale",
      "Arizona",
      "U.S. remote",
      "relocation optional",
      "relocation required",
    ],
    known_remote_filters: [
      "remote US",
      "hybrid",
      "on-site",
      "relocation optional",
      "relocation required",
    ],
    known_keyword_search_patterns: CONTROLLED_ROLE_FAMILIES,
    target_role_families: CONTROLLED_ROLE_FAMILIES,
    compensation_source_notes:
      "Use visible official posting compensation only; equity is noted but not quantified unless listed.",
    job_posting_capture_notes:
      "Source-first pipeline captures official list/card data first, then full posting text only for likely or borderline high-upside candidates.",
    navigation_notes: String(options.capture_strategy || ""),
    source_confidence: String(options.source_confidence || "medium"),
    last_verified_at: new Date().toISOString().slice(0, 10),
    source_adapter_type: String(
      options.source_adapter_type || "unknown_needs_discovery",
    ),
    known_department_filters: [
      "Operations",
      "Strategy & Operations",
      "Business Operations",
      "Commerce & Operations",
      "Support",
      "Product",
    ],
    known_keyword_patterns: CONTROLLED_ROLE_FAMILIES,
    capture_strategy: String(options.capture_strategy || ""),
    browser_required_yes_no: String(
      options.browser_required_yes_no || "unknown",
    ),
  };
}

function classifyLocation(
  location: string,
  workStyle: string,
  sourceText: string,
): Record<string, unknown> {
  const text = `${location} ${workStyle} ${sourceText}`.toLowerCase();
  if (/(travel-heavy|heavy travel|frequent travel)/i.test(sourceText)) {
    return locationRecord(
      "travel-heavy",
      -20,
      true,
      80,
      25,
      "Travel burden needs manual review.",
      "Frequent travel could create family and lifestyle friction.",
      "Travel-heavy signal found.",
      ["Travel burden may be high."],
      "high-friction, only advance if exceptional",
    );
  }
  if (/(phoenix|scottsdale|tempe)/.test(text)) {
    return locationRecord(
      "Phoenix / Scottsdale / Tempe",
      95,
      false,
      0,
      0,
      "Strong local fit.",
      "Low family disruption; local Phoenix/Scottsdale/Tempe fit.",
      "Arizona local or hub signal present.",
      [],
      "strong fit, no relocation issue",
      true,
    );
  }
  if (/arizona/.test(text)) {
    return locationRecord(
      "Arizona hybrid",
      85,
      false,
      10,
      0,
      "Strong Arizona fit.",
      "Low-to-moderate family disruption depending commute.",
      "Arizona hybrid/local signal present.",
      [],
      "strong fit, no relocation issue",
      true,
    );
  }
  if (
    /remote/.test(text) && /(united states|u\.s\.|us|usa|remote)/.test(text)
  ) {
    return locationRecord(
      "U.S. remote",
      80,
      false,
      15,
      0,
      "Remote role appears potentially compatible with Arizona.",
      "Low family disruption if Arizona remote eligibility is confirmed.",
      "Remote signal present; confirm Arizona eligibility.",
      ["Confirm Arizona eligibility."],
      "viable, review normally",
      true,
    );
  }
  if (
    /(los angeles|san francisco|mountain view|california|new york|nyc|tri-state)/
      .test(text)
  ) {
    return locationRecord(
      "relocation optional",
      -25,
      true,
      70,
      18,
      "Weak location fit unless comp, scope, control, and upside clear a higher bar.",
      "Relocation to California or tri-state would need strong family, school, housing, tax, and lifestyle justification.",
      "Major relocation market; not a hard no.",
      ["Relocation friction requires stronger opportunity quality."],
      "possible, but needs stronger comp/scope",
    );
  }
  if (
    /(london|dublin|berlin|tokyo|sydney|australia|germany|france|uk)/.test(text)
  ) {
    return locationRecord(
      "relocation required",
      -55,
      true,
      90,
      30,
      "International relocation friction is high.",
      "International move would be highly disruptive and needs exceptional upside.",
      "International location signal.",
      ["International relocation likely not aligned."],
      "high-friction, only advance if exceptional",
    );
  }
  return locationRecord(
    "unknown location flexibility",
    0,
    false,
    50,
    10,
    "Location flexibility needs review.",
    "Family and lifestyle impact cannot be assessed from visible posting.",
    "Location flexibility unclear.",
    ["Location/relocation requirement unclear."],
    "needs manual review",
  );
}

function locationRecord(
  locationCategory: string,
  regionPreferenceScore: number,
  relocationRequired: boolean,
  relocationFrictionScore: number,
  relocationThresholdAdjustment: number,
  compensationAdjustedForLocation: string,
  familyLifestyleConsiderations: string,
  cityRegionNotes: string,
  locationConcerns: string[],
  relocationVerdict: string,
  arizonaRemoteOk = false,
): Record<string, unknown> {
  return {
    location_category: locationCategory,
    region_preference_score: regionPreferenceScore,
    relocation_required: relocationRequired,
    arizona_remote_ok: arizonaRemoteOk,
    relocation_friction_score: relocationFrictionScore,
    relocation_threshold_adjustment: relocationThresholdAdjustment,
    compensation_adjusted_for_location: compensationAdjustedForLocation,
    family_lifestyle_considerations: familyLifestyleConsiderations,
    city_region_notes: cityRegionNotes,
    location_concerns: locationConcerns,
    relocation_verdict: relocationVerdict,
  };
}

function compRangeFields(text: string): Record<string, unknown> {
  const normalized = normalizeWhitespace(text).replace(/[–—]/g, "-");
  const match = normalized.match(
    /([$£€A]*\$?)\s*([\d,.]+)\s*K?\s*-\s*([$£€A]*\$?)?\s*([\d,.]+)\s*K?/i,
  );
  if (!match) {
    return { estimated_total_comp_min: 0, estimated_total_comp_max: 0 };
  }
  const currency = `${match[1] || match[3] || ""}`;
  const multiplier = /k/i.test(match[0]) ? 1000 : 1;
  const min = Number(match[2].replace(/,/g, "")) * multiplier;
  const max = Number(match[4].replace(/,/g, "")) * multiplier;
  if (currency && !currency.includes("$") && !/^A\$/.test(currency)) {
    return { estimated_total_comp_min: 0, estimated_total_comp_max: 0 };
  }
  return {
    estimated_total_comp_min: Math.round(min),
    estimated_total_comp_max: Math.round(max),
  };
}

function compensationBucket(text: string): string {
  const comp = compRangeFields(text);
  const max = Number(comp.estimated_total_comp_max || 0);
  if (max >= 400000) return "$400K+ Primary Target";
  if (max >= 250000) return "$250K-$400K Secondary Target";
  if (/equity|stock option|high upside/i.test(text)) {
    return "Unknown High Upside";
  }
  return "Below Target / Monitor Only";
}

const SENIOR_COMPENSATION_QUESTIONS = [
  "What is the expected base salary range?",
  "What is the expected total compensation range?",
  "Is there annual bonus, equity, or long-term incentive compensation?",
  "What internal level is this role mapped to?",
  "What team size, budget, or P&L does this role own?",
  "Is relocation required or flexible?",
  "Is this role newly created or replacing someone?",
];

function compensationDetailsFromRecord(
  record: Record<string, unknown>,
  sourceText = "",
): Record<string, unknown> {
  const compensationText = firstNonEmpty([
    record.compensation_summary,
    record.comp_notes,
    record.listed_total_comp_notes,
    sourceText.match(
      /\$[\d,]+(?:\s*[–—-]\s*\$?[\d,]+)?(?:\s*(?:USD|base|salary|annually|per year))?/i,
    )?.[0] || "",
  ]);
  const range = compRangeFields(compensationText);
  const baseRange = listedBaseRange({
    ...record,
    compensation_summary: compensationText,
    raw_posting_text: sourceText,
  });
  const listedMin = baseRange?.min || null;
  const listedMax = baseRange?.max || null;
  const maxComp = Number(
    record.estimated_total_comp_max || range.estimated_total_comp_max ||
      listedMax || 0,
  );
  const titleScopeText = [
    record.company,
    record.role_title,
    record.title,
    record.team,
    record.department,
    sourceText,
  ].join(" ");
  const senior = seniorRoleSignal(titleScopeText);
  const broadScope = targetOperationsSignal(titleScopeText) ||
    /(budget|p&l|executive|leadership team|team size|own)/i.test(
      titleScopeText,
    );
  const compensationListed = Boolean(
    listedMin || listedMax || /\$\s*\d/.test(compensationText),
  );
  const compensationStatus = listedMin
    ? (listedMax ? "listed" : "partially_listed")
    : (compensationListed ||
        /salary|base|bonus|equity|compensation/i.test(compensationText)
      ? "unclear"
      : "not_listed");
  let compensationVerdict = "needs_verification";
  if (maxComp >= 400000) compensationVerdict = "clearly_above_threshold";
  else if (maxComp >= 250000) compensationVerdict = "likely_above_threshold";
  else if (maxComp > 0) compensationVerdict = "likely_below_threshold";
  else if (senior || broadScope) {
    compensationVerdict = "unknown_but_senior_enough_to_review";
  }
  const estimatedBand = firstNonEmpty([
    record.estimated_comp_band,
    record.compensation_bucket,
    compensationListed ? compensationBucket(compensationText) : "",
    senior || broadScope ? "Unknown High Upside" : "Needs verification",
  ]);
  const questions = Array.isArray(record.compensation_questions_to_verify)
    ? arrayFromUnknown(record.compensation_questions_to_verify)
    : (!compensationListed && (senior || broadScope)
      ? SENIOR_COMPENSATION_QUESTIONS
      : [
        "What is the expected total compensation range including base, bonus, equity, and long-term incentives?",
      ]);
  return {
    compensation_listed_yes_no: compensationListed,
    listed_base_min: listedMin,
    listed_base_max: listedMax,
    listed_total_comp_notes: compensationText ||
      "Compensation is not listed in the captured source.",
    estimated_comp_band: estimatedBand,
    estimated_comp_confidence: compensationListed
      ? "medium"
      : (senior || broadScope ? "low" : "low"),
    compensation_source: compensationListed
      ? "official_posting"
      : "not_listed_in_source",
    compensation_status: compensationStatus,
    compensation_verdict: compensationVerdict,
    compensation_questions_to_verify: questions,
  };
}

function searchCoverageFromCapture(
  capture: Record<string, unknown>,
  body: RequestBody,
  jobCount: number,
): Record<string, unknown> {
  const companies = [String(capture.company || "")].filter(Boolean);
  const roles = requestedRoleFamilies(body);
  const searched = capture.job_list_captured && !capture.browser_required
    ? companies
    : [];
  const notSearched = searched.length ? [] : companies;
  return {
    companies_requested: companies,
    companies_searched: searched,
    companies_failed: arrayFromUnknown(capture.errors).length ? companies : [],
    companies_not_searched: notSearched,
    role_families_requested: roles,
    role_families_searched: searched.length ? roles : [],
    role_families_failed: [],
    sources_used: arrayFromUnknown(capture.source_urls_checked),
    official_sources_checked: Number(capture.official_sources_checked || 0),
    linkedin_sources_checked: 0,
    aggregator_sources_checked: 0,
    jobs_found: jobCount,
    jobs_verified: jobCount,
    jobs_rejected: 0,
    duplicates_removed: 0,
    jobs_needing_verification: 0,
    search_queries_executed: 0,
    search_complete: false,
    coverage_percent: searched.length ? 100 : 0,
    coverage_notes: `${capture.company || "Company"} source-first capture: ${
      Number((capture.candidate_cards as unknown[] | undefined)?.length || 0)
    } candidate cards, ${
      Number((capture.likely_candidates as unknown[] | undefined)?.length || 0)
    } likely or borderline candidates, ${jobCount} full postings captured.`,
  };
}

function baseSearchRunOutput(
  runId: string,
  searchRunId: string,
  body: RequestBody,
): Record<string, unknown> {
  return {
    schema_version: "job-command-center-v2",
    run_id: runId,
    job_id: null,
    model_role: "Workflow Orchestrator",
    confidence: 1,
    approval_required_before_external_action: true,
    search_run_id: searchRunId,
    webSearchQueries: [],
    groundingChunks: [],
    groundingSupports: [],
    urlContextMetadata: null,
    grounding_metadata_status: "not_requested",
    grounding_source_urls: [],
    grounding_queries: [],
    grounding_chunks_count: 0,
    url_context_used: false,
    google_search_used: false,
    source_verified_by: "official_url_capture",
    source_verification_notes:
      "Deterministic source-first official URL capture; provider grounding metadata not requested.",
    estimated_api_cost: 0,
    actual_api_cost: 0,
    coverage: initialCoverage(
      runId,
      searchRunId,
      buildSearchTasks(
        runId,
        searchRunId,
        body,
        requestedCompanies(body).length,
      ),
      body,
    ),
    results: [],
    sources: [],
  };
}

async function recordLocalSearchStep(
  auth: AuthContext,
  runId: string,
  task: Record<string, unknown>,
  stepType: string,
  stepOrder: number,
  output: Record<string, unknown>,
): Promise<void> {
  const stepId = `${runId}-${stepOrder}-${stepType}`;
  await upsertWorkflowStep(auth.supabase, auth.user.id, {
    id: stableId("workflow-step", runId, stepType, stepOrder, String(task.id)),
    run_id: runId,
    step_id: stepId,
    step_order: stepOrder,
    step_type: stepType,
    model_role: "Workflow Orchestrator",
    provider: "local",
    function_name: stepType,
    status: "completed",
    attempt_count: 1,
    max_attempts: 1,
    output_artifact_ids: [],
    completed_at: new Date().toISOString(),
    estimated_cost: 0,
    actual_cost: 0,
    cost: 0,
    idempotency_key: stableId(stepType, String(task.id)),
    record: {
      task_id: task.id,
      output,
      validation: { passed: true, repaired: false },
    },
  });
}

async function recordLocalVerificationStep(
  auth: AuthContext,
  runId: string,
  searchRunId: string,
  task: Record<string, unknown>,
  result: Record<string, unknown>,
  stepOrder: number,
): Promise<Record<string, unknown>> {
  const output = {
    schema_version: "job-command-center-v2",
    run_id: runId,
    job_id: String(result.job_result_id || ""),
    model_role: "Workflow Orchestrator",
    confidence: 0.95,
    approval_required_before_external_action: true,
    result,
    grounding_metadata: {
      webSearchQueries: [],
      groundingChunks: [],
      groundingSupports: [],
      urlContextMetadata: null,
    },
    grounding_metadata_status: "unavailable_provider_response",
    grounding_source_urls: uniqueStrings([primarySourceUrl(result)]),
    grounding_queries: [],
    grounding_chunks_count: 0,
    url_context_used: false,
    google_search_used: false,
    source_verified_by: "official_url_capture",
    source_verification_notes:
      "Verified by official URL capture with full posting text, timestamp, and link health; provider grounding metadata was not requested for this deterministic step.",
  };
  const stepId = `${runId}-${stepOrder}-verify-job-source`;
  await upsertWorkflowStep(auth.supabase, auth.user.id, {
    id: stableId(
      "workflow-step",
      runId,
      "verify-job-source",
      stepOrder,
      canonicalDedupeKey(result),
    ),
    run_id: runId,
    step_id: stepId,
    step_order: stepOrder,
    step_type: "verify-job-source",
    model_role: "Workflow Orchestrator",
    provider: "local",
    function_name: "verify-job-source",
    status: "completed",
    attempt_count: 1,
    max_attempts: 1,
    output_artifact_ids: [],
    completed_at: new Date().toISOString(),
    estimated_cost: 0,
    actual_cost: 0,
    cost: 0,
    idempotency_key: stableId(
      "verify",
      String(task.id),
      canonicalDedupeKey(result),
    ),
    record: {
      task_id: task.id,
      official_url_capture: true,
      output,
      validation: { passed: true, repaired: false },
    },
  });
  return result;
}

async function upsertCompanySourceFromCapture(
  supabase: SupabaseClient,
  userId: string,
  capture: Record<string, unknown>,
): Promise<void> {
  const directory = (capture.company_source_directory || {}) as Record<
    string,
    unknown
  >;
  const company = String(capture.company || directory.company_name || "");
  if (!company) return;
  await criticalUpsert(supabase, "jobcc_company_sources", {
    id: stableId("company-source", company.toLowerCase()),
    user_id: userId,
    company_name: company,
    priority_tier: String(directory.priority_tier || "P0"),
    company_group: String(directory.company_group || ""),
    official_website: String(directory.official_website || ""),
    official_careers_home_url: String(
      directory.official_careers_home_url || "",
    ),
    official_job_search_url: String(
      directory.official_job_search_url || capture.official_job_search_url ||
        "",
    ),
    ats_provider: String(directory.ats_provider || capture.ats_provider || ""),
    ats_job_url_pattern: String(directory.ats_job_url_pattern || ""),
    linkedin_company_url: String(directory.linkedin_company_url || ""),
    linkedin_jobs_url: String(directory.linkedin_jobs_url || ""),
    company_about_source_url: String(directory.company_about_source_url || ""),
    known_location_filters: arrayFromUnknown(directory.known_location_filters),
    known_remote_filters: arrayFromUnknown(directory.known_remote_filters),
    known_keyword_search_patterns: arrayFromUnknown(
      directory.known_keyword_search_patterns,
    ),
    target_role_families: arrayFromUnknown(directory.target_role_families),
    source_adapter_type: String(
      directory.source_adapter_type || capture.source_adapter_type || "",
    ),
    known_department_filters: arrayFromUnknown(
      directory.known_department_filters,
    ),
    known_keyword_patterns: arrayFromUnknown(directory.known_keyword_patterns),
    capture_strategy: String(directory.capture_strategy || ""),
    browser_required_yes_no: String(
      directory.browser_required_yes_no ||
        (capture.browser_required ? "yes" : "no"),
    ),
    compensation_source_notes: String(
      directory.compensation_source_notes || "",
    ),
    job_posting_capture_notes: String(
      directory.job_posting_capture_notes || "",
    ),
    navigation_notes: String(directory.navigation_notes || ""),
    source_confidence: String(directory.source_confidence || "medium"),
    last_verified_at: new Date().toISOString().slice(0, 10),
    record: {
      ...directory,
      source_refresh_completed: capture.source_refresh_completed,
      job_list_captured: capture.job_list_captured,
      candidate_cards_extracted: Array.isArray(capture.candidate_cards)
        ? capture.candidate_cards.length
        : 0,
      likely_fit_candidates: Array.isArray(capture.likely_candidates)
        ? capture.likely_candidates.length
        : 0,
      full_postings_captured: Array.isArray(capture.results)
        ? capture.results.length
        : 0,
      source_urls_checked: capture.source_urls_checked,
      errors: capture.errors,
      last_source_first_capture_at: new Date().toISOString(),
    },
  });
}

async function fetchTextWithTimeout(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    SOURCE_CAPTURE_TIMEOUT_MS,
  );
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 JobCommandCenterSourceCapture/1.0",
        Accept: "text/html,application/json;q=0.9,*/*;q=0.8",
      },
    });
    if (!response.ok) {
      throw new Error(`Source request failed: ${response.status} ${url}`);
    }
    return await response.text();
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        `Source request timed out after ${
          Math.round(SOURCE_CAPTURE_TIMEOUT_MS / 1000)
        } seconds: ${url}`,
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJsonRecordWithTimeout(
  url: string,
): Promise<Record<string, unknown>> {
  const text = await fetchTextWithTimeout(url);
  const parsed = JSON.parse(text);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? parsed as Record<string, unknown>
    : {};
}

function extractJobLinks(
  html: string,
  baseUrl: string,
): Array<{ href: string; text: string }> {
  const links: Array<{ href: string; text: string }> = [];
  const regex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html))) {
    const href = absolutizeUrl(decodeHtml(match[1]), baseUrl);
    const text = normalizeWhitespace(visibleTextFromHtml(match[2]));
    if (
      !/\/jobs\//i.test(href) || /\/jobs\/search/i.test(href) || !text ||
      /^read more$/i.test(text)
    ) continue;
    links.push({ href, text });
  }
  return links;
}

function extractJsonLdJobPosting(html: string): Record<string, unknown> {
  const scripts = [
    ...html.matchAll(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ];
  for (const script of scripts) {
    const raw = decodeHtml(script[1].trim());
    try {
      const parsed = JSON.parse(raw);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      const job = items.find((item) =>
        item && typeof item === "object" &&
        String((item as Record<string, unknown>)["@type"] || "").includes(
          "JobPosting",
        )
      );
      if (job) return job as Record<string, unknown>;
    } catch {
      continue;
    }
  }
  return {};
}

function visibleTextFromHtml(html: string): string {
  return normalizeWhitespace(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<\/(p|div|li|h1|h2|h3|br|section|ul|ol)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .split("\n")
      .map((line) => normalizeWhitespace(decodeHtml(line)))
      .filter(Boolean)
      .join("\n"),
  );
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(
      /&#x([0-9a-f]+);/gi,
      (_, code) => String.fromCharCode(parseInt(code, 16)),
    );
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\r/g, "\n").replace(/[ \t\f\v]+/g, " ").replace(
    /\n\s+/g,
    "\n",
  ).replace(/\n{3,}/g, "\n\n").trim();
}

function absolutizeUrl(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return href;
  }
}

function titleFromHtml(html: string): string {
  const title = firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  return normalizeWhitespace(decodeHtml(title)).replace(/\s+@\s+.*$/, "")
    .replace(/\s+-\s+.*$/, "");
}

function locationFromUrl(url: string): string {
  const slug = url.split("/jobs/")[1] || "";
  const cleaned = slug.replace(/-[0-9a-f]{8}.*$/i, "").replace(/-/g, " ");
  const places = [
    "tempe arizona",
    "phoenix arizona",
    "scottsdale arizona",
    "san francisco california",
    "mountain view california",
    "los angeles california",
    "new york city new york",
    "remote united states",
    "london england",
    "dublin ireland",
    "seattle washington",
  ];
  return places.filter((place) => cleaned.includes(place)).map(
    titleCaseLocation,
  ).join("; ");
}

function locationFromText(text: string): string {
  const match = text.match(
    /(Tempe|Phoenix|Scottsdale|San Francisco|Mountain View|Los Angeles|New York City|Seattle|Remote),?\s+(Arizona|California|New York|Washington|United States)/i,
  );
  return match ? `${match[1]}, ${match[2]}` : "";
}

function titleCaseLocation(value: string): string {
  return value.split(/\s+/).map((part) =>
    part.charAt(0).toUpperCase() + part.slice(1)
  ).join(" ").replace("New York City New York", "New York City, New York")
    .replace("Remote United States", "Remote, United States");
}

function lineAfter(text: string, needle: string): string {
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const index = lines.findIndex((line) =>
    line.toLowerCase().includes(needle.toLowerCase())
  );
  return index >= 0 ? (lines[index + 1] || "") : "";
}

function firstMatch(text: string, regex: RegExp): string {
  const match = text.match(regex);
  return match ? String(match[1] || match[0] || "").trim() : "";
}

function sectionBullets(
  text: string,
  startLabel: string,
  endLabel: string,
): string[] {
  const lower = text.toLowerCase();
  const start = lower.indexOf(startLabel.toLowerCase());
  if (start < 0) return [];
  const end = lower.indexOf(endLabel.toLowerCase(), start + startLabel.length);
  const section = text.slice(
    start + startLabel.length,
    end > start ? end : start + 4000,
  );
  const lines = section.split(/\n+/).map((line) =>
    normalizeWhitespace(line.replace(/^[-*•]\s*/, ""))
  ).filter(Boolean);
  return lines
    .filter((line) =>
      line.length > 20 && !/^apply now|share|ready to apply/i.test(line)
    )
    .slice(0, 10);
}

function firstParagraph(text: string, title: string): string {
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const titleIndex = lines.findIndex((line) =>
    line.toLowerCase().includes(title.toLowerCase())
  );
  return lines.slice(Math.max(0, titleIndex + 1)).find((line) =>
    line.length > 80
  ) || "";
}

function sentenceContaining(text: string, phrase: string): string {
  const normalized = normalizeWhitespace(text).replace(/\n/g, " ");
  const sentences = normalized.split(/(?<=[.!?])\s+/);
  return sentences.find((sentence) =>
    sentence.toLowerCase().includes(phrase.toLowerCase())
  ) || "";
}

function compactPostingText(text: string, title: string): string {
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const start = Math.max(
    0,
    lines.findIndex((line) => line.toLowerCase().includes(title.toLowerCase())),
  );
  const endMarkers = [
    "We appreciate your interest",
    "EOE",
    "Equal Opportunity Employer",
    "Ready to Apply",
  ];
  let end = lines.length;
  for (const marker of endMarkers) {
    const index = lines.findIndex((line, lineIndex) =>
      lineIndex > start && line.includes(marker)
    );
    if (index > start) end = Math.min(end, index + 5);
  }
  return lines.slice(start, end).join("\n").slice(0, 30000);
}

function keywordsFromText(text: string): string[] {
  const phrases = [
    "operations control",
    "network operations",
    "operational intelligence",
    "strategy and operations",
    "business operations",
    "marketplace",
    "commerce",
    "customer experience",
    "partner operations",
    "vendor operations",
    "logistics",
    "crisis communications",
    "executive escalations",
    "cross-functional",
    "data-driven",
    "AI tools",
    "global markets",
    "fleet",
    "resilience",
  ];
  const lower = text.toLowerCase();
  return uniqueStrings(
    phrases.filter((phrase) => lower.includes(phrase.toLowerCase())).concat(
      normalizeTokens(text).filter((token) => token.length > 5).slice(0, 12),
    ),
  ).slice(0, 20);
}

function stakeholderKeywords(text: string): string[] {
  const stakeholders = [
    "leadership team",
    "regional market leads",
    "Product",
    "Engineering",
    "Operations",
    "Data",
    "Marketing",
    "StratFin",
    "partners",
  ];
  return stakeholders.filter((item) =>
    text.toLowerCase().includes(item.toLowerCase())
  );
}

function successMetricKeywords(text: string): string[] {
  const metrics = [
    "growth",
    "margin",
    "recovery",
    "resilience",
    "service",
    "fleet",
    "buyer and seller funnels",
    "key metrics",
    "operational standards",
  ];
  return metrics.filter((item) =>
    text.toLowerCase().includes(item.toLowerCase())
  );
}

function jobLocationsFromJsonLd(jsonLd: Record<string, unknown>): string {
  const locations = Array.isArray(jsonLd.jobLocation) ? jsonLd.jobLocation : [];
  return uniqueStrings(locations.map((location) => {
    const address = location && typeof location === "object"
      ? (location as Record<string, unknown>).address as
        | Record<string, unknown>
        | undefined
      : undefined;
    return [
      address?.addressLocality,
      address?.addressRegion,
      address?.addressCountry,
    ].filter(Boolean).join(", ");
  })).join("; ");
}

function baseSalaryFromJsonLd(jsonLd: Record<string, unknown>): string {
  const salary = jsonLd.baseSalary && typeof jsonLd.baseSalary === "object"
    ? jsonLd.baseSalary as Record<string, unknown>
    : {};
  const value = salary.value && typeof salary.value === "object"
    ? salary.value as Record<string, unknown>
    : {};
  const min = Number(value.minValue || 0);
  const max = Number(value.maxValue || 0);
  const currency = String(salary.currency || "USD");
  return min && max
    ? `$${Math.round(min).toLocaleString()} - $${
      Math.round(max).toLocaleString()
    } ${currency}`
    : "";
}

function uniqueByKey<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const key = keyFn(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

async function getOrRunModelStep(
  auth: AuthContext,
  runId: string,
  body: RequestBody,
  action: string,
  provider: Provider,
  stepOrder: number,
  modelRole: string,
  limits: ReturnType<typeof controlledLimits>,
  options: Record<string, unknown> = {},
): Promise<ProviderResult> {
  const reusable = await completedStepResult(
    auth.supabase,
    runId,
    action,
    stepOrder,
    String(options.idempotency_key || ""),
    String(options.task_id || ""),
  );
  if (reusable) return reusable;
  return runWorkflowModelStep(
    auth,
    runId,
    body,
    action,
    provider,
    stepOrder,
    modelRole,
    limits,
    options,
  );
}

async function completedStepResult(
  supabase: SupabaseClient,
  runId: string,
  action: string,
  stepOrder: number,
  idempotencyKey = "",
  taskId = "",
): Promise<ProviderResult | null> {
  const steps = await selectMany(
    supabase,
    "jobcc_workflow_steps",
    "run_id",
    runId,
  ) as Array<Record<string, unknown>>;
  const matching = steps
    .filter((step) =>
      step.status === "completed" && step.step_type === action &&
      Number(step.step_order || 0) === stepOrder
    )
    .filter((step) => {
      if (!idempotencyKey && !taskId) return true;
      if (idempotencyKey) return step.idempotency_key === idempotencyKey;
      const record = (step.record || {}) as Record<string, unknown>;
      return Boolean(taskId) && String(record.task_id || "") === taskId;
    })
    .sort((a, b) =>
      Date.parse(String(b.completed_at || b.updated_at || "")) -
      Date.parse(String(a.completed_at || a.updated_at || ""))
    );
  const step = matching[0];
  if (!step) return null;
  return workflowStepArtifactResult(supabase, runId, action, step);
}

async function workflowStepArtifactResult(
  supabase: SupabaseClient,
  runId: string,
  action: string,
  step: Record<string, unknown>,
): Promise<ProviderResult | null> {
  const artifactIds = Array.isArray(step.output_artifact_ids)
    ? step.output_artifact_ids.map(String)
    : [];
  if (!artifactIds.length) return null;
  const artifacts = await selectMany(
    supabase,
    "jobcc_workflow_artifacts",
    "run_id",
    runId,
  ) as Array<Record<string, unknown>>;
  const artifact = artifacts.find((item) =>
    artifactIds.includes(String(item.id)) && item.status === "validated"
  );
  if (!artifact) return null;
  const record = (artifact.record || {}) as Record<string, unknown>;
  const rawOutput = (record.output || {}) as Record<string, unknown>;
  const normalizedOutput = currentWorkflowArtifactOutput(action, rawOutput);
  if (!normalizedOutput) return null;
  return {
    model: String(step.actual_model || ""),
    providerRequestId: String(step.provider_request_id || ""),
    providerRequestIds: uniqueStrings([
      ...arrayFromUnknown(record.provider_request_ids),
      ...arrayFromUnknown(
        (step.record as Record<string, unknown> | undefined)
          ?.provider_request_ids,
      ),
      String(step.provider_request_id || ""),
    ]),
    providerRequestCount: Math.max(
      1,
      Number(
        record.provider_request_count ||
          (step.record as Record<string, unknown> | undefined)
            ?.provider_request_count ||
          1,
      ),
    ),
    text: String(artifact.raw_output || JSON.stringify(normalizedOutput)),
    parsed: normalizedOutput,
    raw: record,
    grounding: (record.grounding || {}) as Record<string, unknown>,
    usage: (record.usage || step.token_usage || {}) as Record<string, unknown>,
    searchQueryCount: Number(step.search_query_count || 0),
    latencyMs: Number(step.latency_ms || 0),
    repaired: Boolean(
      (record.validation as Record<string, unknown> | undefined)?.repaired,
    ),
    validationErrors: [],
  };
}

async function workflowValidationRepairCandidate(
  supabase: SupabaseClient,
  runId: string,
  action: string,
  step: Record<string, unknown>,
): Promise<ValidationRepairCandidate | null> {
  if (String(step.status || "") !== "failed_validation") return null;
  if (
    !["openai", "gemini"].includes(
      String(step.provider || "").toLowerCase(),
    ) || providerRequestEvidenceCountForStep(step) < 1
  ) return null;
  const artifacts = await selectMany(
    supabase,
    "jobcc_workflow_artifacts",
    "run_id",
    runId,
  ) as Array<Record<string, unknown>>;
  const candidates = artifacts
    .filter((artifact) =>
      String(artifact.artifact_type || "") === "raw_model_output" &&
      String(artifact.schema_name || "") === schemaNameForAction(action) &&
      String(artifact.status || "") === "failed_validation"
    )
    .filter((artifact) => {
      const record = artifact.record && typeof artifact.record === "object" &&
          !Array.isArray(artifact.record)
        ? artifact.record as Record<string, unknown>
        : {};
      return String(record.action || "") === action;
    })
    .sort((left, right) =>
      Date.parse(String(right.updated_at || right.created_at || "")) -
      Date.parse(String(left.updated_at || left.created_at || ""))
    );
  const artifact = candidates[0];
  if (!artifact) return null;
  const record = artifact.record && typeof artifact.record === "object" &&
      !Array.isArray(artifact.record)
    ? artifact.record as Record<string, unknown>
    : {};
  const rawText = String(artifact.raw_output || "").trim();
  const validationErrors = arrayFromUnknown(record.validation_errors);
  if (!rawText || !validationErrors.length) return null;
  return {
    artifactId: String(artifact.id || ""),
    rawText,
    validationErrors,
  };
}

export function currentWorkflowArtifactOutput(
  action: string,
  rawOutput: Record<string, unknown>,
): Record<string, unknown> | null {
  const schemaName = schemaNameForAction(action);
  const normalizedOutput = schemaName === "finalized_packet"
    ? normalizeFinalizedPacketEvidence(rawOutput)
    : schemaName === "fact_match"
    ? normalizeCanonMatchOutput(rawOutput)
    : rawOutput;
  return validateAgainstSchema(normalizedOutput, schemaForAction(action)).length
    ? null
    : normalizedOutput;
}

async function providerCompletedPacketStepResult(
  auth: AuthContext,
  runId: string,
  definition: ApplicationPacketStepDefinition,
): Promise<
  { step: Record<string, unknown>; result: ProviderResult } | null
> {
  const steps = await selectMany(
    auth.supabase,
    "jobcc_workflow_steps",
    "run_id",
    runId,
  ) as Array<Record<string, unknown>>;
  const candidates = steps
    .filter((step) =>
      String(step.step_type || "") === definition.action &&
      Number(step.step_order || 0) === definition.stepOrder &&
      ["provider_completed", "failed_storage"].includes(
        String(step.status || ""),
      )
    )
    .sort((left, right) =>
      Date.parse(String(right.updated_at || right.started_at || "")) -
      Date.parse(String(left.updated_at || left.started_at || ""))
    );
  for (const step of candidates) {
    const result = await workflowStepArtifactResult(
      auth.supabase,
      runId,
      definition.action,
      step,
    );
    if (canReplayDeferredFinalQualityStep(step, Boolean(result)) && result) {
      return { step, result };
    }
  }
  return null;
}

async function completeDeferredWorkflowStep(
  auth: AuthContext,
  runId: string,
  definition: ApplicationPacketStepDefinition,
) {
  const stepId = stableId(
    "workflow-step",
    runId,
    definition.action,
    definition.stepOrder,
  );
  const current = await selectOne(
    auth.supabase,
    "jobcc_workflow_steps",
    stepId,
  ) as Record<string, unknown> | null;
  if (!current) {
    throw new Error(
      "Deferred final-quality workflow step could not be reloaded before completion.",
    );
  }
  const record = current.record && typeof current.record === "object" &&
      !Array.isArray(current.record)
    ? current.record as Record<string, unknown>
    : {};
  await upsertWorkflowStep(auth.supabase, auth.user.id, {
    ...current,
    id: stepId,
    run_id: runId,
    status: "completed",
    error: null,
    completed_at: new Date().toISOString(),
    record: {
      ...record,
      provider_completed: true,
      post_processing_completed: true,
      post_processing_completed_at: new Date().toISOString(),
    },
  });
}

async function rerunFailedModelStep(
  auth: AuthContext,
  runId: string,
  failedStep: Record<string, unknown>,
  body: RequestBody,
  limits: ReturnType<typeof controlledLimits>,
) {
  const action = String(failedStep.step_type || "");
  if (!action) throw new Error("Failed step has no step_type.");
  const provider = String(
    failedStep.provider ||
      (shouldUseGeminiGrounding(action) ? "gemini" : "openai"),
  ) as Provider;
  await runWorkflowModelStep(
    auth,
    runId,
    body,
    action,
    provider,
    Number(failedStep.step_order || 0),
    String(
      failedStep.model_role ||
        (provider === "gemini" ? "Gemini Scout" : "OpenAI Strategist"),
    ),
    limits,
    {
      step_primary_id: failedStep.id,
      step_id: failedStep.step_id,
      attempt_count: Number(failedStep.attempt_count || 0) + 1,
      max_attempts: Number(failedStep.max_attempts || 2),
      idempotency_key: failedStep.idempotency_key ||
        stableId("retry", runId, action, failedStep.step_order),
      task_id: (failedStep.record as Record<string, unknown> | undefined)
        ?.task_id,
    },
  );
}

async function getOrRunCanonMatchStep(
  auth: AuthContext,
  runId: string,
  body: RequestBody,
  stepOrder: number,
  forceRerun = false,
): Promise<ProviderResult> {
  const reusable = forceRerun ? null : await completedStepResult(
    auth.supabase,
    runId,
    "match-job-to-canon",
    stepOrder,
    "",
  );
  if (reusable) {
    return {
      ...reusable,
      parsed: normalizeCanonMatchOutput(reusable.parsed),
    };
  }
  await assertNotCancelled(auth, runId, "match-job-to-canon");
  const output = buildCanonMatchOutput(runId, body);
  const validationErrors = validateAgainstSchema(
    output,
    schemaForAction("match-job-to-canon"),
  );
  if (validationErrors.length) {
    throw new ValidationFailure(
      "Local Canon match output failed schema validation.",
      JSON.stringify(output),
      validationErrors,
    );
  }
  const artifactId = stableId(
    "artifact",
    runId,
    "match-job-to-canon",
    inputVersion(body),
  );
  const stepId = `${runId}-${stepOrder}-match-job-to-canon`;
  await upsertWorkflowStep(auth.supabase, auth.user.id, {
    id: stableId("workflow-step", runId, "match-job-to-canon", stepOrder),
    run_id: runId,
    step_id: stepId,
    step_order: stepOrder,
    step_type: "match-job-to-canon",
    model_role: "Workflow Orchestrator",
    provider: "local",
    function_name: "match-job-to-canon",
    status: "completed",
    error: null,
    attempt_count: 1,
    max_attempts: 1,
    output_artifact_ids: [artifactId],
    completed_at: new Date().toISOString(),
    estimated_cost: 0,
    actual_cost: 0,
    cost: 0,
    record: { request_body: safeWorkflowRequest(body) },
  });
  await saveWorkflowArtifact(auth.supabase, auth.user.id, {
    id: artifactId,
    run_id: runId,
    step_id: stepId,
    artifact_type: "match-job-to-canon",
    schema_name: "fact_match",
    schema_version: "job-command-center-v2",
    job_id: jobIdFromBody(body),
    status: "validated",
    record: { output, validation: { passed: true, repaired: false } },
    raw_output: JSON.stringify(output, null, 2),
  });
  await persistFactMatches(
    auth.supabase,
    auth.user.id,
    jobIdFromBody(body),
    output.matches as Array<Record<string, unknown>>,
  );
  return {
    model: "local-canon-matcher",
    providerRequestId: "",
    text: JSON.stringify(output),
    parsed: normalizeCanonMatchOutput(output),
    raw: output,
    grounding: {},
    usage: {},
    searchQueryCount: 0,
    latencyMs: 0,
    repaired: false,
    validationErrors: [],
  };
}

async function processSearchTask(
  auth: AuthContext,
  runId: string,
  searchRunId: string,
  body: RequestBody,
  task: Record<string, unknown>,
  limits: ReturnType<typeof controlledLimits>,
  workerId: string,
) {
  await assertNotCancelled(auth, runId, "search task start");
  const taskIndex = Number(
    (task.record as Record<string, unknown> | undefined)?.task_index || 0,
  );
  await updateSearchTaskStatusDetailed(auth.supabase, String(task.id), {
    status: "running",
    worker_id: workerId,
    started_at: new Date().toISOString(),
    task_heartbeat_at: new Date().toISOString(),
    lock_owner: workerId,
    lock_expires_at: new Date(Date.now() + SEARCH_TASK_CLAIM_TTL_SECONDS * 1000)
      .toISOString(),
    recovery_status: "running",
  });
  let rawResults: Array<Record<string, unknown>>;
  let searchQueryCount = 0;
  let sourceCoveragePatch: Record<string, unknown> = {};
  const officialCapture = await runOfficialSourceFirstCapture(
    auth,
    runId,
    searchRunId,
    body,
    task,
    taskIndex,
    limits,
    workerId,
  );
  sourceCoveragePatch = officialCapture.coverage;
  if (officialCapture.handled) {
    rawResults = officialCapture.results;
  } else {
    const scoutBody: RequestBody = {
      ...body,
      workflow_run_id: runId,
      search_run_id: searchRunId,
      sourceText: JSON.stringify(task, null, 2),
      notes: controlledSearchInstructions(task),
    };
    await heartbeatSearchProgress(
      auth,
      runId,
      String(task.id),
      workerId,
      "gemini-scout",
    );
    const scout = await getOrRunModelStep(
      auth,
      runId,
      scoutBody,
      "gemini-scout",
      "gemini",
      (taskIndex * 100) + 10,
      "Gemini Scout",
      limits,
      {
        task_id: task.id,
        idempotency_key: stableId("scout", String(task.id)),
        attempt_count: Number(task.attempts || 1),
        max_attempts: Number(task.max_attempts || 2),
      },
    );
    const scoutResults = Array.isArray(scout.parsed.results)
      ? scout.parsed.results as Array<Record<string, unknown>>
      : [];
    rawResults = [...officialCapture.results, ...scoutResults];
    searchQueryCount = scout.searchQueryCount;
    sourceCoveragePatch = {
      ...sourceCoveragePatch,
      scout_fallback_used: true,
      scout_results_found: scoutResults.length,
      official_results_preserved: officialCapture.results.length,
      official_candidate_cards_preserved: Number(
        sourceCoveragePatch.candidate_cards_retained || 0,
      ),
    };
  }
  const rawResultsBeforeCompensationScreen = rawResults;
  const compensationScreen = screenSearchResultsByCompensation(
    rawResultsBeforeCompensationScreen,
    limits.minimumListedBaseSalary,
  );
  rawResults = compensationScreen.kept;
  const candidateCardsSeen = Math.max(
    Number(sourceCoveragePatch.candidate_cards_extracted || 0),
    rawResultsBeforeCompensationScreen.length,
  );
  const screenedOutRoles = Number(sourceCoveragePatch.screened_out_roles || 0) +
    compensationScreen.screenedOut.length;
  await assertNotCancelled(auth, runId, "dedupe");
  await heartbeatSearchProgress(
    auth,
    runId,
    String(task.id),
    workerId,
    "dedupe-search-results",
  );
  const deduped = await runDedupeStep(
    auth,
    runId,
    searchRunId,
    task,
    rawResults,
    body,
    (taskIndex * 100) + 20,
  );
  let resultCount = 0;
  let qualifiedCount = 0;
  let scoredCount = 0;
  for (const [index, result] of deduped.uniqueResults.entries()) {
    await assertNotCancelled(auth, runId, "verification");
    await heartbeatSearchProgress(
      auth,
      runId,
      String(task.id),
      workerId,
      "verify-job-source",
    );
    const verifiedResult = officialCapture.handled
      ? await recordLocalVerificationStep(
        auth,
        runId,
        searchRunId,
        task,
        result,
        (taskIndex * 100) + 30 + index,
      )
      : await runProviderVerificationStep(
        auth,
        runId,
        searchRunId,
        body,
        task,
        result,
        limits,
        (taskIndex * 100) + 30 + index,
        index,
      );
    if (
      !["verified_active", "needs_verification"].includes(
        String(verifiedResult.active_status || ""),
      )
    ) {
      await persistVerifiedJob(
        auth.supabase,
        auth.user.id,
        runId,
        searchRunId,
        verifiedResult,
        body,
        "Rejected / stale",
      );
      resultCount += 1;
      continue;
    }
    const job = await persistVerifiedJob(
      auth.supabase,
      auth.user.id,
      runId,
      searchRunId,
      verifiedResult,
      body,
      "Needs Research",
    );
    await heartbeatSearchProgress(
      auth,
      runId,
      String(task.id),
      workerId,
      "match-job-to-canon",
    );
    const canon = await getOrRunCanonMatchStep(auth, runId, {
      ...body,
      workflow_run_id: runId,
      search_run_id: searchRunId,
      job,
    }, (taskIndex * 100) + 60 + index);
    if (blockingClaims(canon.parsed).length) {
      await saveManualReviewApproval(
        auth.supabase,
        auth.user.id,
        runId,
        "match-job-to-canon",
        String(job.id || ""),
        "Career Canon blocker during search scoring.",
        JSON.stringify(canon.parsed, null, 2),
        blockingClaims(canon.parsed),
      );
      resultCount += 1;
      continue;
    }
    if (
      qualifiesForStrategist(verifiedResult) &&
      scoredCount < limits.maxScoredJobsPerCompany
    ) {
      scoredCount += 1;
      const scoreBody: RequestBody = {
        ...body,
        workflow_run_id: runId,
        search_run_id: searchRunId,
        job,
        notes: [
          "Score this verified or needs-verification job after Scout, dedupe, verification, and Career Canon matching.",
          "Career Canon match:",
          JSON.stringify(canon.parsed, null, 2),
        ].join("\n"),
      };
      await heartbeatSearchProgress(
        auth,
        runId,
        String(task.id),
        workerId,
        "score-job",
      );
      const score = await getOrRunModelStep(
        auth,
        runId,
        scoreBody,
        "score-job",
        "openai",
        (taskIndex * 100) + 80 + index,
        "OpenAI Strategist",
        limits,
        {
          task_id: task.id,
          idempotency_key: stableId(
            "score",
            String(task.id),
            canonicalDedupeKey(verifiedResult),
            index,
          ),
          attempt_count: Number(task.attempts || 1),
          max_attempts: Number(task.max_attempts || 2),
        },
      );
      await applyScoreToJob(auth.supabase, String(job.id || ""), score.parsed);
      qualifiedCount +=
        String(score.parsed.qualification_gate || "") === "send_to_writer"
          ? 1
          : 0;
      if (
        body.include_packet_generation &&
        qualifiedCount <= limits.maxWriterPackets &&
        String(score.parsed.qualification_gate || "") === "send_to_writer"
      ) {
        await prepareApplicationPacketWorkflow(auth, {
          ...body,
          workflow_run_id: stableId(
            "workflow",
            "prepare-application-packet",
            job.id,
            runId,
          ),
          job,
        }, "prepare-application-packet");
      }
    } else if (qualifiesForStrategist(verifiedResult)) {
      await markJobScoreSkipped(
        auth.supabase,
        String(job.id || ""),
        `Per-company score cap reached (${limits.maxScoredJobsPerCompany}).`,
      );
    }
    resultCount += 1;
  }
  await updateSearchTaskStatusDetailed(auth.supabase, String(task.id), {
    status: "completed",
    completed_at: new Date().toISOString(),
    claimed_at: null,
    worker_id: null,
    lock_owner: null,
    lock_expires_at: null,
    task_heartbeat_at: new Date().toISOString(),
    recovery_status: "completed",
    error: null,
    result_count: resultCount,
    source_coverage: {
      ...sourceCoveragePatch,
      raw_results: rawResultsBeforeCompensationScreen.length,
      candidate_cards_seen: candidateCardsSeen,
      postings_evaluated: deduped.seenCount,
      identities_observed: deduped.identityObservedCount,
      screened_out_roles: screenedOutRoles,
      compensation_screened_out:
        Number(sourceCoveragePatch.compensation_screened_out || 0) +
        compensationScreen.screenedOut.length,
      compensation_screened_out_below_floor:
        Number(sourceCoveragePatch.compensation_screened_out_below_floor || 0) +
        compensationScreen.screenedOutBelowFloor,
      compensation_screened_out_missing_comp: Number(
        sourceCoveragePatch.compensation_screened_out_missing_comp || 0,
      ) + compensationScreen.screenedOutMissingComp,
      minimum_listed_base_salary: limits.minimumListedBaseSalary,
      unique_results: deduped.uniqueResults.length,
      duplicates_removed: deduped.duplicatesRemoved,
      new_roles: deduped.newCount,
      changed_roles: deduped.changedCount,
      unchanged_roles: deduped.unchangedCount,
      suppressed_roles: deduped.suppressedCount,
      imported_roles: resultCount,
      qualified_count: qualifiedCount,
      scored_count: scoredCount,
      max_scored_jobs_per_company: limits.maxScoredJobsPerCompany,
      search_query_count: searchQueryCount,
    },
  });
  await updateCoverageFromDb(auth, runId, searchRunId);
}

async function runDedupeStep(
  auth: AuthContext,
  runId: string,
  searchRunId: string,
  task: Record<string, unknown>,
  results: Array<Record<string, unknown>>,
  body: RequestBody,
  stepOrder: number,
): Promise<{
  uniqueResults: Array<Record<string, unknown>>;
  duplicatesRemoved: number;
  seenCount: number;
  newCount: number;
  changedCount: number;
  unchangedCount: number;
  suppressedCount: number;
  identityObservedCount: number;
}> {
  const reusable = await completedStepResult(
    auth.supabase,
    runId,
    "dedupe-search-results",
    stepOrder,
    stableId("dedupe", String(task.id)),
  );
  if (reusable) {
    const outputResults = Array.isArray(reusable.parsed.results)
      ? reusable.parsed.results as Array<Record<string, unknown>>
      : [];
    const coverage =
      (reusable.parsed.coverage as Record<string, unknown> | undefined) || {};
    return {
      uniqueResults: outputResults,
      duplicatesRemoved: Number(coverage.duplicates_removed || 0),
      seenCount: Number(coverage.candidate_cards_seen || results.length),
      newCount: Number(coverage.new_roles || outputResults.length),
      changedCount: Number(coverage.changed_roles || 0),
      unchangedCount: Number(coverage.unchanged_roles || 0),
      suppressedCount: Number(coverage.suppressed_roles || 0),
      identityObservedCount: Number(
        coverage.identities_observed ?? (
          Number(coverage.new_roles || 0) +
          Number(coverage.changed_roles || 0) +
          Number(coverage.unchanged_roles || 0) +
          Number(coverage.suppressed_roles || 0)
        ),
      ),
    };
  }
  const seen = new Map<string, Record<string, unknown>>();
  let duplicatesRemoved = 0;
  for (const result of results) {
    const key = canonicalDedupeKey(result);
    if (!key) continue;
    if (seen.has(key)) {
      duplicatesRemoved += 1;
      seen.set(key, mergeJobRecords(seen.get(key) || {}, result));
    } else {
      seen.set(key, result);
    }
  }
  const uniqueResults = Array.from(seen.values());
  const existing = await existingJobsByDedupeKey(auth.supabase);
  let changedCount = 0;
  let unchangedCount = 0;
  let suppressedCount = 0;
  for (let index = uniqueResults.length - 1; index >= 0; index -= 1) {
    const result = uniqueResults[index];
    const keyedExistingJob = existing.get(canonicalDedupeKey(result));
    const observation = await observeSearchResult(
      auth,
      result,
      keyedExistingJob,
      runId,
      searchRunId,
      String(task.id || ""),
      index,
    );
    const existingJob = observation.projectionJob || keyedExistingJob;
    uniqueResults[index] = {
      ...result,
      job_identity_id: observation.identityId,
    };
    if (existingJob) {
      const currentRecord = (existingJob.record || {}) as Record<
        string,
        unknown
      >;
      if (observation.classification === "suppressed") {
        suppressedCount += 1;
        await mergeExistingJobEvidence(
          auth.supabase,
          existingJob,
          uniqueResults[index],
          runId,
          searchRunId,
          "suppressed",
        );
        uniqueResults.splice(index, 1);
      } else if (
        observation.classification === "changed" ||
        jobMateriallyChanged(currentRecord, result)
      ) {
        changedCount += 1;
        uniqueResults[index] = {
          ...result,
          job_identity_id: observation.identityId,
          job_result_id: existingJob.id,
          prior_posting_hash: currentRecord.normalized_posting_hash ||
            currentRecord.posting_hash || "",
          posting_changed_yes_no: true,
          rediscovered_existing_job: true,
        };
      } else {
        unchangedCount += 1;
        await mergeExistingJobEvidence(
          auth.supabase,
          existingJob,
          uniqueResults[index],
          runId,
          searchRunId,
          "unchanged",
        );
        uniqueResults.splice(index, 1);
      }
    } else if (observation.classification === "suppressed") {
      suppressedCount += 1;
      uniqueResults.splice(index, 1);
    }
  }
  const newCount = Math.max(0, uniqueResults.length - changedCount);
  const identityObservedCount = newCount + changedCount + unchangedCount +
    suppressedCount;
  const accounting = {
    candidate_cards_seen: results.length,
    postings_evaluated: results.length,
    identities_observed: identityObservedCount,
    new_roles: newCount,
    changed_roles: changedCount,
    unchanged_roles: unchangedCount,
    suppressed_roles: suppressedCount,
  };
  const output = localSearchRunOutput(
    runId,
    searchRunId,
    uniqueResults,
    duplicatesRemoved,
    body,
    accounting,
  );
  const artifactId = stableId(
    "artifact",
    runId,
    "dedupe-search-results",
    String(task.id),
  );
  const stepId = `${runId}-${stepOrder}-dedupe-search-results`;
  await upsertWorkflowStep(auth.supabase, auth.user.id, {
    id: stableId("workflow-step", runId, "dedupe-search-results", stepOrder),
    run_id: runId,
    step_id: stepId,
    step_order: stepOrder,
    step_type: "dedupe-search-results",
    model_role: "Workflow Orchestrator",
    provider: "local",
    function_name: "dedupe-search-results",
    status: "completed",
    attempt_count: 1,
    max_attempts: 1,
    output_artifact_ids: [artifactId],
    completed_at: new Date().toISOString(),
    estimated_cost: 0,
    actual_cost: 0,
    cost: 0,
    idempotency_key: stableId("dedupe", String(task.id)),
    record: { task_id: task.id, request_body: safeWorkflowRequest(body) },
  });
  await saveWorkflowArtifact(auth.supabase, auth.user.id, {
    id: artifactId,
    run_id: runId,
    step_id: stepId,
    artifact_type: "dedupe-search-results",
    schema_name: "search_run",
    schema_version: "job-command-center-v2",
    job_id: null,
    status: "validated",
    record: { output, validation: { passed: true, repaired: false } },
    raw_output: JSON.stringify(output, null, 2),
  });
  return {
    uniqueResults,
    duplicatesRemoved,
    seenCount: results.length,
    newCount,
    changedCount,
    unchangedCount,
    suppressedCount,
    identityObservedCount,
  };
}

async function claimNextSearchTask(
  supabase: SupabaseClient,
  runId: string,
  workerId: string,
): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase.rpc("jobcc_claim_next_search_task", {
    p_run_id: runId,
    p_worker_id: workerId,
    p_claim_ttl_seconds: SEARCH_TASK_CLAIM_TTL_SECONDS,
  });
  if (error) throw new Error(`Search task claim failed: ${error.message}`);
  if (!data) return null;
  return Array.isArray(data)
    ? (data[0] || null)
    : data as Record<string, unknown>;
}

async function recoverStaleSearchTasks(
  supabase: SupabaseClient,
  runId: string,
): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.rpc(
    "jobcc_recover_stale_search_tasks",
    {
      p_run_id: runId,
      p_claim_ttl_seconds: SEARCH_TASK_CLAIM_TTL_SECONDS,
    },
  );
  if (error) {
    throw new Error(`Search task stale recovery failed: ${error.message}`);
  }
  return (data || {}) as Record<string, unknown>;
}

async function updateSearchTaskStatusDetailed(
  supabase: SupabaseClient,
  taskId: string,
  patch: Record<string, unknown>,
) {
  const { error } = await supabase.from("jobcc_search_tasks").update({
    ...patch,
    updated_at: new Date().toISOString(),
  }).eq("id", taskId);
  if (error) {
    throw new Error(`jobcc_search_tasks update failed: ${error.message}`);
  }
}

async function failSearchTask(
  supabase: SupabaseClient,
  taskId: string,
  error: unknown,
) {
  await updateSearchTaskStatusDetailed(supabase, taskId, {
    status: "failed",
    failed_at: new Date().toISOString(),
    claimed_at: null,
    worker_id: null,
    lock_owner: null,
    lock_expires_at: null,
    recovery_status: "failed",
    error: error instanceof Error ? error.message : String(error),
  });
}

async function pauseSearchTaskForWorkflowStop(
  supabase: SupabaseClient,
  taskId: string,
  stop: WorkflowStop,
  workerId: string,
) {
  await updateSearchTaskStatusDetailed(supabase, taskId, {
    status: "queued",
    claimed_at: null,
    worker_id: null,
    lock_owner: null,
    lock_expires_at: null,
    task_heartbeat_at: new Date().toISOString(),
    recovery_status: `paused_${stop.code}`,
    stale_reason: null,
    error: `Paused by ${workerId}: ${stop.code} - ${stop.message}`,
  });
}

async function heartbeatSearchProgress(
  auth: AuthContext,
  runId: string,
  taskId: string,
  workerId: string,
  currentStep: string,
  recordPatch: Record<string, unknown> = {},
) {
  const nowIso = new Date().toISOString();
  const { error: runError } = await auth.supabase.from("jobcc_workflow_runs")
    .update({
      status: "running",
      current_step: currentStep,
      last_heartbeat_at: nowIso,
      worker_id: workerId,
      updated_at: nowIso,
    }).eq("id", runId);
  if (runError) {
    throw new Error(
      `jobcc_workflow_runs heartbeat failed: ${runError.message}`,
    );
  }
  await updateSearchTaskStatusDetailed(auth.supabase, taskId, {
    status: "running",
    worker_id: workerId,
    lock_owner: workerId,
    lock_expires_at: new Date(Date.now() + SEARCH_TASK_CLAIM_TTL_SECONDS * 1000)
      .toISOString(),
    task_heartbeat_at: nowIso,
    recovery_status: "running",
    stale_reason: String(recordPatch.stale_reason || ""),
  });
}

async function recordWorkflowErrorStep(
  auth: AuthContext,
  runId: string,
  stepType: string,
  error: unknown,
  task?: Record<string, unknown>,
) {
  const taskId = String(task?.id || "run");
  const attemptCount = Number(task?.attempts || 1);
  const errorStepId = stableId(
    "workflow-step-error",
    runId,
    stepType,
    taskId,
    attemptCount,
  );
  const providerDiagnostics = providerFailureDiagnostics(error, {
    runId,
    action: stepType,
    provider: "gemini",
    modelRole: "Gemini Scout",
    schemaName: "search_run",
    body: { sourceText: JSON.stringify(task || {}) },
    prompt: "",
    useGrounding: true,
  });
  await upsertWorkflowStep(auth.supabase, auth.user.id, {
    id: errorStepId,
    run_id: runId,
    step_id: `${runId}-error-${stepType}-${taskId}-${attemptCount}`,
    step_order: -1,
    step_type: stepType,
    status: error instanceof ValidationFailure
      ? "failed_validation"
      : "failed_provider",
    attempt_count: attemptCount,
    max_attempts: Number(task?.max_attempts || 2),
    idempotency_key: errorStepId,
    error: {
      message: error instanceof Error ? error.message : String(error),
      validation_errors: error instanceof ValidationFailure
        ? error.validationErrors
        : [],
      provider_diagnostics: providerDiagnostics,
    },
    record: {
      task_id: task?.id || null,
      provider_diagnostics: providerDiagnostics,
    },
    completed_at: new Date().toISOString(),
  });
}

async function updateCoverageFromDb(
  auth: AuthContext,
  runId: string,
  searchRunId: string,
) {
  if (!searchRunId) return;
  await recoverStaleSearchTasks(auth.supabase, runId);
  const tasks = await selectMany(
    auth.supabase,
    "jobcc_search_tasks",
    "run_id",
    runId,
  ) as Array<Record<string, unknown>>;
  const { data: jobs } = await auth.supabase.from("jobcc_jobs").select("*").eq(
    "record->>search_run_id",
    searchRunId,
  );
  const completedTasks = tasks.filter((task) => task.status === "completed");
  const failedTasks = tasks.filter((task) => task.status === "failed");
  const cancelledTasks = tasks.filter((task) => task.status === "cancelled");
  const activeTasks = tasks.filter((task) =>
    SEARCH_ACTIVE_STATUSES.has(String(task.status || ""))
  );
  const searchedCompletedTasks = completedTasks.filter((task) => {
    const coverage = (task.source_coverage || {}) as Record<string, unknown>;
    if (coverage.source_first_official_capture) {
      return Boolean(
        coverage.source_refresh_completed && coverage.job_list_captured &&
          !coverage.browser_required,
      );
    }
    return true;
  });
  const notSearchedCompletedTasks = completedTasks.filter((task) =>
    !searchedCompletedTasks.includes(task)
  );
  const requestedCompanies = uniqueStrings(
    tasks.flatMap((task) => arrayFromUnknown(task.company_cluster)),
  );
  const requestedRoles = uniqueStrings(
    tasks.flatMap((task) => arrayFromUnknown(task.role_family_cluster)),
  );
  const companiesSearched = uniqueStrings(
    searchedCompletedTasks.flatMap((task) =>
      arrayFromUnknown(task.company_cluster)
    ),
  );
  const companiesFailed = uniqueStrings(
    failedTasks.flatMap((task) => arrayFromUnknown(task.company_cluster)),
  );
  const companiesNotSearched = uniqueStrings(
    tasks
      .filter((task) =>
        ["queued", "claimed", "running", "cancelled"].includes(
          String(task.status || ""),
        ) || notSearchedCompletedTasks.includes(task)
      )
      .flatMap((task) => arrayFromUnknown(task.company_cluster)),
  );
  const roleFamiliesSearched = uniqueStrings(
    searchedCompletedTasks.flatMap((task) =>
      arrayFromUnknown(task.role_family_cluster)
    ),
  );
  const roleFamiliesFailed = uniqueStrings(
    failedTasks.flatMap((task) => arrayFromUnknown(task.role_family_cluster)),
  );
  const rows = Array.isArray(jobs)
    ? jobs as Array<Record<string, unknown>>
    : [];
  const jobRecords: Array<Record<string, unknown>> = rows.map((row) => ({
    ...((row.record || {}) as Record<string, unknown>),
    id: row.id,
    company: row.company,
    role_title: row.role_title,
  }));
  const sourceCoverage = tasks.map((task) =>
    (task.source_coverage || {}) as Record<string, unknown>
  );
  const duplicatesRemoved = sourceCoverage.reduce(
    (sum, item) => sum + Number(item.duplicates_removed || 0),
    0,
  );
  const candidateCardsSeen = sourceCoverage.reduce(
    (sum, item) =>
      sum + Number(item.candidate_cards_seen ?? item.raw_results ?? 0),
    0,
  );
  const postingsEvaluated = sourceCoverage.reduce(
    (sum, item) =>
      sum + Number(item.postings_evaluated ?? item.raw_results ?? 0),
    0,
  );
  const identitiesObserved = sourceCoverage.reduce(
    (sum, item) => sum + Number(item.identities_observed || 0),
    0,
  );
  const screenedOutRoles = sourceCoverage.reduce(
    (sum, item) => sum + Number(item.screened_out_roles || 0),
    0,
  );
  const compensationScreenedOut = sourceCoverage.reduce(
    (sum, item) => sum + Number(item.compensation_screened_out || 0),
    0,
  );
  const compensationScreenedOutBelowFloor = sourceCoverage.reduce(
    (sum, item) =>
      sum + Number(item.compensation_screened_out_below_floor || 0),
    0,
  );
  const compensationScreenedOutMissingComp = sourceCoverage.reduce(
    (sum, item) =>
      sum + Number(item.compensation_screened_out_missing_comp || 0),
    0,
  );
  const deferredDueToFullPostingCap = sourceCoverage.reduce(
    (sum, item) => sum + Number(item.deferred_due_to_full_posting_cap || 0),
    0,
  );
  const sourceFailures = sourceCoverage.reduce(
    (sum, item) => sum + Number(item.failed_tasks || 0),
    0,
  );
  const scoutFallbacks = sourceCoverage.reduce(
    (sum, item) => sum + (item.scout_fallback_used ? 1 : 0),
    0,
  );
  const officialResultsPreserved = sourceCoverage.reduce(
    (sum, item) => sum + Number(item.official_results_preserved || 0),
    0,
  );
  const newRoles = sourceCoverage.reduce(
    (sum, item) => sum + Number(item.new_roles || 0),
    0,
  );
  const changedRoles = sourceCoverage.reduce(
    (sum, item) => sum + Number(item.changed_roles || 0),
    0,
  );
  const unchangedRoles = sourceCoverage.reduce(
    (sum, item) => sum + Number(item.unchanged_roles || 0),
    0,
  );
  const suppressedRoles = sourceCoverage.reduce(
    (sum, item) => sum + Number(item.suppressed_roles || 0),
    0,
  );
  const importedRoles = sourceCoverage.reduce(
    (sum, item) => sum + Number(item.imported_roles || 0),
    0,
  );
  const searchQueriesExecuted = sourceCoverage.reduce(
    (sum, item) => sum + Number(item.search_query_count || 0),
    0,
  ) +
    await searchQueriesFromSteps(auth.supabase, runId);
  const completedFailedOrNotSearchedCompanies = uniqueStrings([
    ...companiesSearched,
    ...companiesFailed,
    ...companiesNotSearched,
  ]);
  const allCompaniesAccounted = requestedCompanies.length > 0 &&
    requestedCompanies.every((company) =>
      completedFailedOrNotSearchedCompanies.includes(company)
    );
  const allRolesAccounted = requestedRoles.length > 0 &&
    requestedRoles.every((role) =>
      roleFamiliesSearched.includes(role) || roleFamiliesFailed.includes(role)
    );
  const searchComplete = activeTasks.length === 0 &&
    cancelledTasks.length === 0 && allCompaniesAccounted && allRolesAccounted;
  const coveragePercent = requestedCompanies.length
    ? Math.round((companiesSearched.length / requestedCompanies.length) * 100)
    : 0;
  const sourceQuality = searchSourceQualityCounts(jobRecords);
  const taskOfficialSourcesChecked = sourceCoverage.reduce(
    (sum, item) => sum + Number(item.official_sources_checked || 0),
    0,
  );
  const coverageRecord = {
    id: searchRunId,
    run_id: runId,
    search_run_id: searchRunId,
    companies_requested: requestedCompanies,
    companies_searched: companiesSearched,
    companies_failed: companiesFailed,
    companies_not_searched: companiesNotSearched,
    role_families_requested: requestedRoles,
    role_families_searched: roleFamiliesSearched,
    role_families_failed: roleFamiliesFailed,
    sources_used: uniqueStrings([
      ...jobRecords.map((job) =>
        String(job.source_type || job.posting_source_name || "")
      ).filter(Boolean),
      ...sourceCoverage.flatMap((item) =>
        arrayFromUnknown(item.source_urls_checked)
      ),
      ...sourceCoverage.map((item) =>
        String(item.official_job_search_url || "")
      ).filter(Boolean),
    ]),
    official_sources_checked: Math.max(
      taskOfficialSourcesChecked,
      jobRecords.filter((job) => job.source_type === "official").length,
    ),
    linkedin_sources_checked:
      jobRecords.filter((job) => job.source_type === "linkedin").length,
    aggregator_sources_checked:
      jobRecords.filter((job) => job.source_type === "aggregator").length,
    jobs_found: candidateCardsSeen || jobRecords.length,
    jobs_verified:
      jobRecords.filter((job) => job.active_status === "verified_active")
        .length,
    jobs_rejected: jobRecords.filter((job) =>
      job.rejection_reason ||
      /rejected|expired|stale/i.test(String(job.status || ""))
    ).length,
    duplicates_removed: duplicatesRemoved,
    jobs_needing_verification:
      jobRecords.filter((job) => job.active_status === "needs_verification")
        .length,
    search_queries_executed: searchQueriesExecuted,
    search_complete: searchComplete,
    coverage_percent: Math.max(0, Math.min(100, coveragePercent)),
    coverage_notes: searchComplete
      ? `Search receipt complete: ${candidateCardsSeen} cards seen; ${identitiesObserved} identities reconciled as ${newRoles} new, ${changedRoles} changed, ${unchangedRoles} unchanged, and ${suppressedRoles} suppressed. ${screenedOutRoles} were screened out, ${deferredDueToFullPostingCap} were deferred by the full-posting cap, and ${duplicatesRemoved} within-run duplicates were removed. ${scoutFallbacks} official-source gaps used Scout fallback while preserving ${officialResultsPreserved} partial official results. ${sourceQuality.jobs_with_complete_raw_postings} imported roles have complete raw postings.`
      : `${completedTasks.length} completed, ${failedTasks.length} failed, ${cancelledTasks.length} cancelled, ${activeTasks.length} queued/claimed/running. Results are still being reconciled against prior decisions.`,
    record: {
      candidate_cards_seen: candidateCardsSeen,
      postings_evaluated: postingsEvaluated,
      identities_observed: identitiesObserved,
      screened_out_roles: screenedOutRoles,
      compensation_screened_out: compensationScreenedOut,
      compensation_screened_out_below_floor: compensationScreenedOutBelowFloor,
      compensation_screened_out_missing_comp:
        compensationScreenedOutMissingComp,
      deferred_due_to_full_posting_cap: deferredDueToFullPostingCap,
      new_roles: newRoles,
      changed_roles: changedRoles,
      unchanged_roles: unchangedRoles,
      suppressed_roles: suppressedRoles,
      imported_roles: importedRoles,
      failed_tasks: failedTasks.length,
      source_failures: sourceFailures,
      scout_fallbacks: scoutFallbacks,
      official_results_preserved: officialResultsPreserved,
      task_counts: countBy(tasks, "status"),
      task_source_coverage: sourceCoverage,
      results_by_company: countBy(jobRecords, "company"),
      results_by_role_family: countBy(jobRecords, "role_family"),
      results_by_source_type: countBy(jobRecords, "source_type"),
      source_quality: sourceQuality,
    },
  };
  await upsertSearchCoverage(auth.supabase, auth.user.id, coverageRecord);
  await upsertSearchRunReceipt(
    auth.supabase,
    auth.user.id,
    runId,
    searchRunId,
    {},
    {
      status: searchComplete
        ? (failedTasks.length ? "completed_with_failures" : "completed")
        : "running",
      search_complete: searchComplete,
      candidate_cards_seen: candidateCardsSeen,
      postings_evaluated: postingsEvaluated,
      identities_observed: identitiesObserved,
      screened_out_roles: screenedOutRoles,
      compensation_screened_out: compensationScreenedOut,
      compensation_screened_out_below_floor: compensationScreenedOutBelowFloor,
      compensation_screened_out_missing_comp:
        compensationScreenedOutMissingComp,
      deferred_due_to_full_posting_cap: deferredDueToFullPostingCap,
      new_roles: newRoles,
      changed_roles: changedRoles,
      unchanged_roles: unchangedRoles,
      suppressed_roles: suppressedRoles,
      imported_roles: importedRoles,
      duplicates_removed: duplicatesRemoved,
      failed_tasks: failedTasks.length,
      source_failures: sourceFailures,
      scout_fallbacks: scoutFallbacks,
      official_results_preserved: officialResultsPreserved,
      coverage_percent: Math.max(0, Math.min(100, coveragePercent)),
    },
  );
}

async function upsertSearchRunReceipt(
  supabase: SupabaseClient,
  userId: string,
  runId: string,
  searchRunId: string,
  body: RequestBody,
  patch: Record<string, unknown>,
) {
  const existing = await selectOne(supabase, "jobcc_search_runs", searchRunId)
    .catch(() => null) as Record<string, unknown> | null;
  const priorRecord = (existing?.record || {}) as Record<string, unknown>;
  const hasRequest = Object.keys(body).length > 0;
  const complete = patch.search_complete === true ||
    ["completed", "completed_with_failures", "cancelled"].includes(
      String(patch.status || ""),
    );
  await criticalUpsert(supabase, "jobcc_search_runs", {
    id: searchRunId,
    user_id: userId,
    search_run_id: searchRunId,
    completed_at: complete
      ? String(existing?.completed_at || new Date().toISOString())
      : existing?.completed_at || null,
    search_complete: complete,
    record: {
      ...priorRecord,
      ...patch,
      search_run_id: searchRunId,
      workflow_run_id: runId,
      requested_by: priorRecord.requested_by || "controlled-search",
      ...(hasRequest
        ? {
          input: redactRequest(body),
          request_body: safeWorkflowRequest(body),
        }
        : {}),
      updated_at: new Date().toISOString(),
    },
  });
}

function searchSourceQualityCounts(
  jobRecords: Array<Record<string, unknown>>,
): Record<string, number> {
  return {
    jobs_with_complete_raw_postings:
      jobRecords.filter((job) =>
        fullPostingTextFromRecord(job).trim().length >= 500
      ).length,
    jobs_with_parsed_job_briefs:
      jobRecords.filter((job) =>
        parsedBriefComplete(parsedJobBriefFromRecord(job))
      ).length,
    jobs_missing_full_posting:
      jobRecords.filter((job) =>
        fullPostingTextFromRecord(job).trim().length < 500
      ).length,
    jobs_missing_official_source: jobRecords.filter((job) =>
      !String(
        job.official_source_url || job.ats_source_url ||
          job.company_careers_link || "",
      ).trim()
    ).length,
    jobs_verified_on_company_or_ats_page:
      jobRecords.filter((job) =>
        ["official_company_or_careers_page", "official_ats_posting"].includes(
          sourcePriorityLabel(job),
        ) || /official|ats/.test(String(job.source_status || ""))
      ).length,
    jobs_found_only_on_linkedin:
      jobRecords.filter((job) =>
        sourcePriorityLabel(job) === "linkedin_context"
      ).length,
    jobs_found_only_on_aggregator:
      jobRecords.filter((job) =>
        sourcePriorityLabel(job) === "aggregator_discovery_only"
      ).length,
    jobs_needing_manual_verification:
      jobRecords.filter((job) =>
        String(job.active_status || "") !== "verified_active" ||
        String(job.source_status || "").includes("needs")
      ).length,
  };
}

async function finalizeSearchWorkflowIfDone(
  auth: AuthContext,
  runId: string,
  searchRunId: string,
  body: RequestBody,
) {
  const run = await selectOne(auth.supabase, "jobcc_workflow_runs", runId) as
    | Record<string, unknown>
    | null;
  if (run && isCancellationRecord(run)) {
    await markCancelledIfIdle(auth, runId, searchRunId);
    return;
  }
  await recoverStaleSearchTasks(auth.supabase, runId);
  const tasks = await selectMany(
    auth.supabase,
    "jobcc_search_tasks",
    "run_id",
    runId,
  ) as Array<Record<string, unknown>>;
  if (
    tasks.some((task) => SEARCH_ACTIVE_STATUSES.has(String(task.status || "")))
  ) return;
  const taskCounts = countBy(tasks, "status");
  const failedCount = Number(taskCounts.failed || 0);
  const completedCount = Number(taskCounts.completed || 0);
  const finalStatus = failedCount
    ? (completedCount ? "completed_with_failures" : "failed_provider")
    : "completed";
  const completionCompanies = requestedCompanies(body);
  const completionLimits = controlledLimits({
    ...body,
    companies: completionCompanies,
  });
  await upsertWorkflowRun(auth.supabase, auth.user.id, {
    id: runId,
    workflow_type: String(
      body.workflow_type || run?.workflow_type || "start-controlled-search",
    ),
    status: finalStatus,
    search_run_id: searchRunId,
    current_step: finalStatus === "completed"
      ? "completed"
      : "search_tasks_failed",
    completed_at: new Date().toISOString(),
    error_code: failedCount ? finalStatus : null,
    error_message: failedCount
      ? `${failedCount} search task(s) failed; completed tasks remain persisted and coverage excludes failed tasks from searched counts.`
      : null,
    output_record: {
      task_counts: taskCounts,
      prepared_search_sweep: sweepApprovalEstimate(
        buildSearchTasks(
          runId,
          stableId("search", runId, "completion-estimate"),
          {
            ...body,
            companies: completionCompanies,
            role_families: requestedRoleFamilies(body),
          },
          100,
        ),
        completionLimits,
        estimateSearchRunCost(
          completionCompanies.length,
          completionLimits,
        ),
      ),
    },
  });
  await auth.supabase.from("jobcc_search_runs").update({
    completed_at: new Date().toISOString(),
    search_complete: true,
    updated_at: new Date().toISOString(),
  }).eq("id", searchRunId);
}

async function markCancelledIfIdle(
  auth: AuthContext,
  runId: string,
  searchRunId: string,
) {
  const active = await activeSearchTaskCount(auth.supabase, runId);
  if (active > 0) return;
  const run = await selectOne(auth.supabase, "jobcc_workflow_runs", runId) as
    | Record<string, unknown>
    | null;
  await upsertWorkflowRun(auth.supabase, auth.user.id, {
    id: runId,
    workflow_type: String(run?.workflow_type || "unknown"),
    status: "cancelled",
    current_step: "cancelled",
    cancelled_at: new Date().toISOString(),
  });
  if (searchRunId) await updateCoverageFromDb(auth, runId, searchRunId);
}

async function assertNotCancelled(
  auth: AuthContext,
  runId: string,
  stage: string,
) {
  const run = await selectOne(auth.supabase, "jobcc_workflow_runs", runId) as
    | Record<string, unknown>
    | null;
  if (run && isCancellationRecord(run)) {
    throw new WorkflowStop(
      "cancelled",
      "cancelled",
      `Workflow cancelled before ${stage}.`,
      { stage },
    );
  }
}

function isCancellationRecord(run: Record<string, unknown>): boolean {
  return run.status === "cancelled" ||
    run.current_step === "cancel_requested" ||
    Boolean(run.cancellation_requested_at) ||
    run.error_code === "cancel_requested";
}

async function activeSearchTaskCount(
  supabase: SupabaseClient,
  runId: string,
): Promise<number> {
  await recoverStaleSearchTasks(supabase, runId);
  const { count, error } = await supabase.from("jobcc_search_tasks").select(
    "id",
    { count: "exact", head: true },
  ).eq("run_id", runId).in("status", ["claimed", "running"]);
  if (error) {
    throw new Error(`jobcc_search_tasks count failed: ${error.message}`);
  }
  return count || 0;
}

async function enforceCostLimit(
  auth: AuthContext,
  runId: string,
  action: string,
  nextEstimatedCost: number,
  limits: ReturnType<typeof controlledLimits>,
) {
  if (!limits.stopOnCostLimit) return;
  const run = await selectOne(auth.supabase, "jobcc_workflow_runs", runId) as
    | Record<string, unknown>
    | null;
  const estimated = Number(run?.cost_estimate || 0);
  const actual = Number(run?.actual_cost || 0);
  const maxEstimated = Number(
    run?.max_estimated_cost || limits.maximumEstimatedCostPerRun,
  );
  const maxActual = Number(
    run?.max_actual_cost || limits.maximumActualCostPerRun,
  );
  if (estimated + nextEstimatedCost > maxEstimated || actual > maxActual) {
    const additional = Math.max(
      0,
      (estimated + nextEstimatedCost) - maxEstimated,
    );
    await upsertWorkflowRun(auth.supabase, auth.user.id, {
      id: runId,
      workflow_type: String(run?.workflow_type || ""),
      status: "waiting_for_user",
      current_step: "cost_limit",
      error_code: "cost_limit",
      error_message:
        `Stopped before ${action}; estimated run cost would exceed the configured cap.`,
      output_record: {
        estimated_cost_so_far: estimated,
        actual_cost_so_far: actual,
        next_estimated_cost: nextEstimatedCost,
        max_estimated_cost: maxEstimated,
        max_actual_cost: maxActual,
        estimated_additional_cost_to_continue: additional,
      },
    });
    throw new WorkflowStop(
      "waiting_for_user",
      "cost_limit",
      `Stopped before ${action}; estimated cost cap would be exceeded.`,
      {
        estimated_cost_so_far: estimated,
        next_estimated_cost: nextEstimatedCost,
        max_estimated_cost: maxEstimated,
        estimated_additional_cost_to_continue: additional,
      },
    );
  }
}

async function enforceCallLimit(
  auth: AuthContext,
  runId: string,
  action: string,
  limits: ReturnType<typeof controlledLimits>,
  currentClaimStepId = "",
  additionalValidationRepairCalls = 0,
): Promise<number | undefined> {
  const baseMax = maxCallsForAction(action, limits);
  if (baseMax < 0) return undefined;
  const max = baseMax + Math.max(
    0,
    Math.floor(Number(additionalValidationRepairCalls || 0)),
  );
  const steps = await selectMany(
    auth.supabase,
    "jobcc_workflow_steps",
    "run_id",
    runId,
  ) as Array<Record<string, unknown>>;
  const consumed = steps
    .filter((step) => step.step_type === action)
    .reduce(
      (count, step) =>
        count + providerRequestsRecordedForStep(step, currentClaimStepId),
      0,
    );
  if (consumed >= max) {
    throw new WorkflowStop(
      "waiting_for_user",
      "call_limit",
      `Stopped before ${action}; call limit ${max} reached.`,
      { action, max, provider_requests_consumed: consumed },
    );
  }
  return max - consumed;
}

async function enforceErrorRate(
  auth: AuthContext,
  runId: string,
  limits: ReturnType<typeof controlledLimits>,
) {
  if (!limits.stopOnErrorRate) return;
  const tasks = await selectMany(
    auth.supabase,
    "jobcc_search_tasks",
    "run_id",
    runId,
  ) as Array<Record<string, unknown>>;
  const attempted = tasks.filter((task) =>
    Number(task.attempts || 0) > 0 ||
    ["completed", "failed"].includes(String(task.status || ""))
  ).length;
  const failed = tasks.filter((task) => task.status === "failed").length;
  if (
    failed >= limits.maximumProviderFailures ||
    (attempted >= 3 &&
      failed / Math.max(1, attempted) >= limits.maximumErrorRate)
  ) {
    throw new WorkflowStop(
      "failed_error_limit",
      "error_rate_limit",
      "Stopped scheduling new work because the provider/task error-rate limit was reached.",
      {
        attempted_tasks: attempted,
        failed_tasks: failed,
        maximum_error_rate: limits.maximumErrorRate,
        maximum_provider_failures: limits.maximumProviderFailures,
      },
    );
  }
}

async function addRunUsage(
  supabase: SupabaseClient,
  runId: string,
  estimatedCost: number,
  actualCost: number,
  searchQueryCount: number,
  providerRequestCount: number,
) {
  const run = await selectOne(supabase, "jobcc_workflow_runs", runId) as
    | Record<string, unknown>
    | null;
  if (!run) return;
  const priorOutput = (run.output_record || {}) as Record<string, unknown>;
  await criticalUpsert(supabase, "jobcc_workflow_runs", {
    ...run,
    cost_estimate: Number(run.cost_estimate || 0) + estimatedCost,
    actual_cost: Number(run.actual_cost || 0) + actualCost,
    output_record: {
      ...priorOutput,
      search_query_count: Number(priorOutput.search_query_count || 0) +
        searchQueryCount,
      provider_request_count: Number(
        priorOutput.provider_request_count || 0,
      ) + providerRequestCount,
    },
    updated_at: new Date().toISOString(),
  });
}

function buildCanonMatchOutput(
  runId: string,
  body: RequestBody,
): Record<string, unknown> {
  const job = body.job || {};
  const jobText = [
    job.role_title,
    job.company,
    job.job_summary,
    job.job_description_text,
    arrayFromUnknown(job.responsibilities).join(" "),
    arrayFromUnknown(job.required_qualifications).join(" "),
    arrayFromUnknown(job.preferred_qualifications).join(" "),
  ].join(" ");
  const requiredQualifications = uniqueStrings(
    arrayFromUnknown(job.required_qualifications),
  ).slice(0, 8);
  const requirements = uniqueStrings([
    ...requiredQualifications,
    ...arrayFromUnknown(job.responsibilities).slice(0, 6),
  ]).slice(0, 12);
  const facts = Array.isArray(body.careerFacts) ? body.careerFacts : [];
  const prohibitedFacts = Array.isArray(body.prohibitedFacts)
    ? body.prohibitedFacts
    : [];
  const prohibitedFactIds = new Set(
    [...facts, ...prohibitedFacts]
      .filter((fact) => String(fact.status || "") === "prohibited")
      .map((fact) => String(fact.fact_id || ""))
      .filter(Boolean),
  );
  const usableFacts = facts.filter((fact) =>
    String(fact.status || "") !== "prohibited" &&
    !prohibitedFactIds.has(String(fact.fact_id || ""))
  );
  const matches = requirements.map((requirement) => {
    const best = bestFactMatch(requirement, usableFacts);
    const confidence = best ? Number(best.score || 0.55) : 0.25;
    const matchStatus = !best
      ? "gap"
      : confidence >= 0.6
      ? "matched"
      : "needs_review";
    return {
      job_requirement: requirement,
      matched_fact_id: best?.fact_id ? String(best.fact_id) : null,
      match_status: matchStatus,
      evidence: best
        ? String(best.canonical_claim || best.claim || "")
        : "No verified Career Canon fact matched this requirement.",
      confidence,
    };
  });
  const directMatches = matches.filter((match) =>
    match.match_status === "matched"
  );
  const transferableMatches = matches.filter((match) =>
    match.match_status === "needs_review"
  );
  const gapMatches = matches.filter((match) => match.match_status === "gap");
  const scoreMatches = (items: typeof matches): number => {
    if (!items.length) return 0;
    const earned = items.reduce(
      (sum, match) =>
        sum +
        (match.match_status === "matched"
          ? 1
          : match.match_status === "needs_review"
          ? 0.55
          : 0),
      0,
    );
    return Math.round((earned / items.length) * 100);
  };
  const requiredMatches = requiredQualifications.length
    ? matches.filter((match) =>
      requiredQualifications.includes(match.job_requirement)
    )
    : [];
  const qualificationMatchScore = scoreMatches(matches);
  const qualificationStrengthScore = matches.length
    ? Math.round((directMatches.length / matches.length) * 100)
    : 0;
  const mustHaveCoverageScore = requiredMatches.length
    ? scoreMatches(requiredMatches)
    : qualificationMatchScore;
  const qualificationGapRiskScore = matches.length
    ? Math.round(
      ((gapMatches.length + (transferableMatches.length * 0.45)) /
        matches.length) * 100,
    )
    : 100;
  const qualificationUnknowns = requirements.length ? [] : [
    "The posting does not contain enough captured requirements to assess qualification coverage.",
  ];
  const qualificationSummary = requirements.length
    ? `${directMatches.length} direct strength${
      directMatches.length === 1 ? "" : "s"
    }, ${transferableMatches.length} transferable qualification${
      transferableMatches.length === 1 ? "" : "s"
    }, and ${gapMatches.length} evidence gap${
      gapMatches.length === 1 ? "" : "s"
    } across ${requirements.length} assessed requirements.`
    : "Qualification coverage needs a complete posting and approved Career Canon evidence.";
  const prohibited = uniqueStrings(
    matches
      .map((match) => String(match.matched_fact_id || ""))
      .filter((factId) => factId && prohibitedFactIds.has(factId)),
  );
  return normalizeCanonMatchOutput({
    schema_version: "job-command-center-v2",
    run_id: runId,
    job_id: jobIdFromBody(body),
    model_role: "Workflow Orchestrator",
    confidence: matches.length
      ? average(matches.map((match) => Number(match.confidence || 0)))
      : 0.5,
    approval_required_before_external_action: true,
    matches,
    qualification_match_score: qualificationMatchScore,
    qualification_strength_score: qualificationStrengthScore,
    must_have_coverage_score: mustHaveCoverageScore,
    qualification_gap_risk_score: qualificationGapRiskScore,
    qualification_strengths: directMatches.map((match) =>
      match.job_requirement
    ),
    transferable_qualifications: transferableMatches.map((match) =>
      match.job_requirement
    ),
    qualification_gaps: gapMatches.map((match) => match.job_requirement),
    qualification_unknowns: qualificationUnknowns,
    qualification_summary: qualificationSummary,
    unsupported_claims: [],
    prohibited_fact_matches: prohibited,
    needs_review_fact_matches: [...transferableMatches, ...gapMatches].map(
      (match) => match.job_requirement,
    ),
  });
}

async function persistFactMatches(
  supabase: SupabaseClient,
  userId: string,
  jobId: string | null,
  matches: Array<Record<string, unknown>>,
) {
  if (!jobId) return;
  for (const match of matches) {
    if (!match.matched_fact_id) continue;
    await criticalUpsert(supabase, "jobcc_job_fact_matches", {
      id: stableId(
        "job-fact-match",
        jobId,
        match.matched_fact_id,
        match.job_requirement,
      ),
      user_id: userId,
      job_id: jobId,
      fact_id: String(match.matched_fact_id),
      match_score: Number(match.confidence || 0),
      record: match,
    });
  }
}

async function persistVerifiedJob(
  supabase: SupabaseClient,
  userId: string,
  runId: string,
  searchRunId: string,
  result: Record<string, unknown>,
  body: RequestBody,
  status: string,
): Promise<Record<string, unknown>> {
  const id = String(
    result.job_result_id ||
      stableId(
        "job",
        canonicalDedupeKey(result) || result.company,
        result.role_title,
        result.source_url,
      ),
  );
  const existing = await selectOne(supabase, "jobcc_jobs", id).catch(() =>
    null
  ) as Record<string, unknown> | null;
  const existingRecord = (existing?.record || {}) as Record<string, unknown>;
  const fullPostingText = fullPostingTextFromRecord(result);
  const parsedBrief = parsedJobBriefFromRecord(result);
  const sourceUrl = primarySourceUrl(result);
  const row = {
    id,
    user_id: userId,
    company: String(result.company || ""),
    role_title: String(result.role_title || ""),
    location: String(result.location || ""),
    status: String(existing?.status || status),
    user_decision: String(
      existing?.user_decision || existingRecord.user_decision || "",
    ),
    opportunity_score: result.opportunity_score ||
      existing?.opportunity_score || null,
    record: {
      ...existingRecord,
      ...result,
      id,
      job_description_text: fullPostingText,
      raw_posting_text: fullPostingText,
      parsed_job_brief: parsedBrief,
      source_priority: sourcePriorityLabel(result),
      search_run_id: searchRunId,
      workflow_run_id: runId,
      first_seen_at: existingRecord.first_seen_at || new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      last_seen_search_run_id: searchRunId,
      review_tier: existingRecord.review_tier || defaultReviewTier(result),
      user_decision: existingRecord.user_decision || existing?.user_decision ||
        "",
      starred: existingRecord.starred || false,
      rating: existingRecord.rating || null,
      notes: existingRecord.notes || "",
      source_grounded:
        String(result.grounding_metadata_status || "") === "metadata_returned",
      verified_or_needs_verification: ["verified_active", "needs_verification"]
        .includes(String(result.active_status || "")),
    },
  };
  await criticalUpsert(supabase, "jobcc_jobs", row);
  if (result.job_identity_id) {
    const { error } = await supabase
      .from("jobcc_job_identities")
      .update({ projection_job_id: id, last_seen_at: new Date().toISOString() })
      .eq("id", String(result.job_identity_id))
      .eq("user_id", userId);
    if (error) {
      throw new Error(
        `jobcc_job_identities projection update failed: ${error.message}`,
      );
    }
  }
  await criticalUpsert(supabase, "jobcc_job_descriptions", {
    id: `${id}-description`,
    user_id: userId,
    job_id: id,
    description_text: fullPostingText,
    job_summary: String(
      result.job_summary || parsedBrief.role_about_short || "",
    ),
    responsibilities: arrayFromUnknown(parsedBrief.main_responsibilities).length
      ? arrayFromUnknown(parsedBrief.main_responsibilities)
      : arrayFromUnknown(result.responsibilities),
    required_qualifications:
      arrayFromUnknown(parsedBrief.required_qualifications).length
        ? arrayFromUnknown(parsedBrief.required_qualifications)
        : arrayFromUnknown(result.required_qualifications),
    preferred_qualifications:
      arrayFromUnknown(parsedBrief.preferred_qualifications).length
        ? arrayFromUnknown(parsedBrief.preferred_qualifications)
        : arrayFromUnknown(result.preferred_qualifications),
    skills_keywords:
      arrayFromUnknown(parsedBrief.key_skills_and_keywords).length
        ? arrayFromUnknown(parsedBrief.key_skills_and_keywords)
        : arrayFromUnknown(result.skills_keywords),
    team_summary: String(result.team_summary || parsedBrief.team_context || ""),
    source_url: sourceUrl,
    record: jobDescriptionRecord(
      result,
      fullPostingText,
      parsedBrief,
      sourceUrl,
    ),
  });
  await saveCompanyContextIfPossible(supabase, userId, result).catch((error) =>
    console.warn(
      `jobcc_company_context write skipped: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
  );
  await saveCompanySourceIfPossible(supabase, userId, result).catch((error) =>
    console.warn(
      `jobcc_company_sources write skipped: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
  );
  return row.record;
}

async function ensureSelectedJobPersisted(
  supabase: SupabaseClient,
  userId: string,
  job: Record<string, unknown>,
) {
  const id = String(job.id || "");
  if (!id) return;
  const existing = await selectOne(supabase, "jobcc_jobs", id).catch(() =>
    null
  ) as Record<string, unknown> | null;
  const fullPostingText = fullPostingTextFromRecord(job);
  const parsedBrief = parsedJobBriefFromRecord(job);
  const sourceUrl = primarySourceUrl(job);
  await criticalUpsert(supabase, "jobcc_jobs", {
    id,
    user_id: userId,
    company: String(job.company || existing?.company || ""),
    role_title: String(job.role_title || existing?.role_title || ""),
    location: String(job.location || existing?.location || ""),
    status: String(job.status || existing?.status || "Needs Research"),
    user_decision: String(job.user_decision || existing?.user_decision || ""),
    opportunity_score: job.opportunity_score || existing?.opportunity_score ||
      null,
    record: {
      ...((existing?.record || {}) as Record<string, unknown>),
      ...job,
      id,
      job_description_text: fullPostingText,
      raw_posting_text: fullPostingText,
      parsed_job_brief: parsedBrief,
      source_priority: sourcePriorityLabel(job),
      selected_job_persisted_at: new Date().toISOString(),
    },
  });
  await criticalUpsert(supabase, "jobcc_job_descriptions", {
    id: `${id}-description`,
    user_id: userId,
    job_id: id,
    description_text: fullPostingText,
    job_summary: String(job.job_summary || parsedBrief.role_about_short || ""),
    responsibilities: arrayFromUnknown(parsedBrief.main_responsibilities).length
      ? arrayFromUnknown(parsedBrief.main_responsibilities)
      : arrayFromUnknown(job.responsibilities),
    required_qualifications:
      arrayFromUnknown(parsedBrief.required_qualifications).length
        ? arrayFromUnknown(parsedBrief.required_qualifications)
        : arrayFromUnknown(job.required_qualifications),
    preferred_qualifications:
      arrayFromUnknown(parsedBrief.preferred_qualifications).length
        ? arrayFromUnknown(parsedBrief.preferred_qualifications)
        : arrayFromUnknown(job.preferred_qualifications),
    skills_keywords:
      arrayFromUnknown(parsedBrief.key_skills_and_keywords).length
        ? arrayFromUnknown(parsedBrief.key_skills_and_keywords)
        : arrayFromUnknown(job.skills_keywords),
    team_summary: String(job.team_summary || parsedBrief.team_context || ""),
    source_url: sourceUrl,
    record: jobDescriptionRecord(job, fullPostingText, parsedBrief, sourceUrl),
  });
  await saveCompanyContextIfPossible(supabase, userId, job).catch((error) =>
    console.warn(
      `jobcc_company_context write skipped: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
  );
  await saveCompanySourceIfPossible(supabase, userId, job).catch((error) =>
    console.warn(
      `jobcc_company_sources write skipped: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
  );
}

function fullPostingTextFromRecord(record: Record<string, unknown>): string {
  return String(
    record.raw_posting_text ||
      record.job_description_text_full ||
      record.full_job_description ||
      record.job_description_text ||
      record.description_text ||
      record.posting_text ||
      "",
  );
}

function parsedJobBriefFromRecord(
  record: Record<string, unknown>,
): Record<string, unknown> {
  const raw =
    (record.parsed_job_brief && typeof record.parsed_job_brief === "object" &&
        !Array.isArray(record.parsed_job_brief))
      ? record.parsed_job_brief as Record<string, unknown>
      : {};
  return {
    company_about_short: raw.company_about_short ||
      record.company_about_short || "",
    company_business_model: raw.company_business_model ||
      record.company_business_model || "",
    company_stage_or_context: raw.company_stage_or_context ||
      record.company_stage_or_context || "",
    role_about_short: raw.role_about_short || record.role_about_short ||
      record.job_summary || "",
    role_mandate: raw.role_mandate || record.role_mandate || "",
    why_they_are_hiring: raw.why_they_are_hiring ||
      record.why_they_are_hiring || "",
    main_responsibilities: arrayFromUnknown(raw.main_responsibilities).length
      ? arrayFromUnknown(raw.main_responsibilities)
      : arrayFromUnknown(record.responsibilities),
    required_qualifications:
      arrayFromUnknown(raw.required_qualifications).length
        ? arrayFromUnknown(raw.required_qualifications)
        : arrayFromUnknown(record.required_qualifications),
    preferred_qualifications:
      arrayFromUnknown(raw.preferred_qualifications).length
        ? arrayFromUnknown(raw.preferred_qualifications)
        : arrayFromUnknown(record.preferred_qualifications),
    key_skills_and_keywords:
      arrayFromUnknown(raw.key_skills_and_keywords).length
        ? arrayFromUnknown(raw.key_skills_and_keywords)
        : arrayFromUnknown(record.skills_keywords),
    team_context: raw.team_context || record.team_summary || "",
    reporting_relationship: raw.reporting_relationship ||
      record.reporting_relationship || "",
    stakeholders: arrayFromUnknown(raw.stakeholders),
    success_metrics: arrayFromUnknown(raw.success_metrics),
    location_requirements: raw.location_requirements || record.location || "",
    remote_eligibility: raw.remote_eligibility || record.work_style || "",
    travel_requirements: raw.travel_requirements || record.travel_required ||
      record.travel_notes || "",
    compensation_summary: raw.compensation_summary || record.comp_notes ||
      record.compensation_bucket || "",
    equity_bonus_notes: raw.equity_bonus_notes ||
      [
        record.equity_likely ? "Equity likely" : "",
        record.bonus_likely ? "Bonus likely" : "",
      ].filter(Boolean).join("; "),
    why_it_may_fit_matthew: raw.why_it_may_fit_matthew || record.why_it_fits ||
      "",
    concerns_or_gaps: raw.concerns_or_gaps || record.concerns || "",
    verification_needed: arrayFromUnknown(raw.verification_needed).length
      ? arrayFromUnknown(raw.verification_needed)
      : (hasPostingContent(record) ? [] : [
        "Job posting is incomplete. Capture or paste the full posting before generating role-specific materials.",
      ]),
  };
}

function primarySourceUrl(record: Record<string, unknown>): string {
  return String(
    record.official_source_url ||
      record.ats_source_url ||
      record.posting_source_url ||
      record.source_url ||
      record.company_careers_link ||
      record.application_link ||
      record.linkedin_url ||
      record.linkedin_job_link ||
      "",
  );
}

function sourcePriorityLabel(record: Record<string, unknown>): string {
  if (
    record.official_source_url || record.company_careers_link ||
    String(record.source_type || "") === "official"
  ) return "official_company_or_careers_page";
  if (
    record.ats_source_url ||
    /greenhouse|lever|ashby|workday|smartrecruiters|icims/i.test(
      primarySourceUrl(record),
    )
  ) return "official_ats_posting";
  if (
    record.linkedin_url || record.linkedin_job_link ||
    String(record.source_type || "") === "linkedin"
  ) return "linkedin_context";
  if (String(record.source_type || "") === "aggregator") {
    return "aggregator_discovery_only";
  }
  return "needs_manual_verification";
}

function jobDescriptionRecord(
  record: Record<string, unknown>,
  fullPostingText: string,
  parsedBrief: Record<string, unknown>,
  sourceUrl: string,
): Record<string, unknown> {
  const postingHash = stableHash(fullPostingText);
  const normalizedPostingHash = stableHash(
    normalizePostingForHash(fullPostingText),
  );
  const otherDetails = otherDetailsFromRecord(record, fullPostingText);
  const fieldProvenance = fieldProvenanceFromRecord(record, sourceUrl);
  const sourceConflicts = sourceConflictsFromRecord(record, fullPostingText);
  const enhancedBrief: Record<string, unknown> = {
    ...parsedBrief,
    other_details: Array.isArray(parsedBrief.other_details) &&
        parsedBrief.other_details.length
      ? parsedBrief.other_details
      : otherDetails,
    field_provenance: parsedBrief.field_provenance &&
        typeof parsedBrief.field_provenance === "object"
      ? parsedBrief.field_provenance
      : fieldProvenance,
    source_conflicts: Array.isArray(parsedBrief.source_conflicts) &&
        parsedBrief.source_conflicts.length
      ? parsedBrief.source_conflicts
      : sourceConflicts,
  };
  return {
    ...record,
    raw_posting_text: fullPostingText,
    parsed_job_brief: enhancedBrief,
    parsing_model_version: PARSING_MODEL_VERSION,
    scoring_model_version: SCORING_MODEL_VERSION,
    career_canon_version: CAREER_CANON_VERSION,
    public_profile_version: PUBLIC_PROFILE_VERSION,
    preference_model_version: PREFERENCE_MODEL_VERSION,
    posting_hash: postingHash,
    normalized_posting_hash: normalizedPostingHash,
    prior_posting_hash: record.prior_posting_hash || null,
    posting_changed_yes_no: Boolean(
      record.prior_posting_hash &&
        String(record.prior_posting_hash) !== postingHash,
    ),
    first_captured_at: record.first_captured_at || record.captured_at ||
      record.job_description_captured_at || new Date().toISOString(),
    last_captured_at: record.last_captured_at || record.captured_at ||
      record.job_description_captured_at || new Date().toISOString(),
    other_details: otherDetails,
    field_provenance: fieldProvenance,
    source_conflicts: sourceConflicts,
    knockout_flags: knockoutFlagsFromRecord(record, fullPostingText),
    questions_to_verify: questionsToVerifyFromRecord(record),
    application_requirements: applicationRequirementsFromRecord({
      ...record,
      source_url: sourceUrl,
    }),
    contact_referral: contactReferralFromRecord(record),
    manual_overrides: manualOverridesFromRecord(record),
    analysis_status: record.analysis_status ||
      "source_verified_parsed_ready_for_scoring",
    score_status: record.score_status || "not_scored",
    analysis_reused: Boolean(record.analysis_reused || false),
    rerun_reason: record.rerun_reason || "new_or_changed_posting",
    analysis_cost: Number(record.analysis_cost || 0),
    packet_eligibility: record.packet_eligibility ||
      "eligible_when_packet_requested",
    packet_blocked_reason: record.packet_blocked_reason ||
      "Packet generation remains off until Matthew explicitly requests it for this role.",
    official_source_url: record.official_source_url || null,
    ats_source_url: record.ats_source_url || null,
    linkedin_url: record.linkedin_url || record.linkedin_job_link || null,
    posting_source_name: record.posting_source_name || record.source_name ||
      record.source_type || "",
    posting_source_url: sourceUrl,
    source_priority: sourcePriorityLabel(record),
    source_status: record.source_status ||
      (String(record.active_status || "") === "verified_active"
        ? "official_verified"
        : "needs_manual_verification"),
    link_health: record.link_health || "unknown",
    captured_at: record.captured_at || record.job_description_captured_at ||
      new Date().toISOString(),
    last_verified_at: record.last_verified_at ||
      record.job_description_last_verified || record.date_checked ||
      new Date().toISOString(),
    full_posting_character_count: fullPostingText.length,
    parsed_brief_complete: parsedBriefComplete(enhancedBrief),
  };
}

function parsedBriefComplete(brief: Record<string, unknown>): boolean {
  return Boolean(
    String(brief.company_about_short || "").trim() &&
      String(brief.role_about_short || brief.role_mandate || "").trim() &&
      arrayFromUnknown(brief.main_responsibilities).length &&
      arrayFromUnknown(brief.required_qualifications).length,
  );
}

async function saveCompanyContextIfPossible(
  supabase: SupabaseClient,
  userId: string,
  record: Record<string, unknown>,
) {
  const context =
    (record.company_context && typeof record.company_context === "object" &&
        !Array.isArray(record.company_context))
      ? record.company_context as Record<string, unknown>
      : {};
  const companyName = String(context.company_name || record.company || "")
    .trim();
  if (!companyName) return;
  await criticalUpsert(supabase, "jobcc_company_context", {
    id: stableId("company-context", companyName.toLowerCase()),
    user_id: userId,
    company_name: companyName,
    official_website: String(
      context.official_website || record.official_website || "",
    ),
    careers_url: String(
      context.careers_url || record.company_careers_link ||
        record.official_source_url || "",
    ),
    company_about: String(
      context.company_about || context.company_about_short ||
        record.company_about_short || "",
    ),
    business_model: String(
      context.business_model || record.company_business_model || "",
    ),
    industry: String(context.industry || record.industry || ""),
    company_stage: String(
      context.company_stage || record.company_stage_or_context || "",
    ),
    public_or_private: String(
      context.public_or_private || record.public_or_private || "",
    ),
    approximate_size: String(
      context.approximate_size || record.approximate_size || "",
    ),
    headquarters: String(context.headquarters || record.headquarters || ""),
    why_company_may_interest_matthew: String(
      context.why_company_may_interest_matthew || "",
    ),
    source_links: arrayFromUnknown(context.source_links).length
      ? arrayFromUnknown(context.source_links)
      : [primarySourceUrl(record)].filter(Boolean),
    last_updated_at: String(
      context.last_updated_at || new Date().toISOString(),
    ),
    record: context,
  });
}

async function saveCompanySourceIfPossible(
  supabase: SupabaseClient,
  userId: string,
  record: Record<string, unknown>,
) {
  const context =
    (record.company_context && typeof record.company_context === "object" &&
        !Array.isArray(record.company_context))
      ? record.company_context as Record<string, unknown>
      : {};
  const directory = (record.company_source_directory &&
      typeof record.company_source_directory === "object" &&
      !Array.isArray(record.company_source_directory))
    ? record.company_source_directory as Record<string, unknown>
    : {};
  const companyName = String(
    directory.company_name || context.company_name || record.company || "",
  ).trim();
  if (!companyName) return;
  const verifiedAt = String(
    directory.last_verified_at || record.last_verified_at ||
      record.date_checked || "",
  ).slice(0, 10);
  await criticalUpsert(supabase, "jobcc_company_sources", {
    id: stableId("company-source", companyName.toLowerCase()),
    user_id: userId,
    company_name: companyName,
    priority_tier: String(directory.priority_tier || record.priority || "P2"),
    company_group: String(
      directory.company_group || record.company_group || "",
    ),
    official_website: String(
      directory.official_website || context.official_website ||
        record.official_website || "",
    ),
    official_careers_home_url: String(
      directory.official_careers_home_url || context.careers_url ||
        record.company_careers_link || "",
    ),
    official_job_search_url: String(
      directory.official_job_search_url || context.careers_url ||
        record.official_source_url || "",
    ),
    ats_provider: String(directory.ats_provider || record.ats_provider || ""),
    ats_job_url_pattern: String(
      directory.ats_job_url_pattern || record.ats_job_url_pattern || "",
    ),
    linkedin_company_url: String(
      directory.linkedin_company_url || record.linkedin_company_url || "",
    ),
    linkedin_jobs_url: String(
      directory.linkedin_jobs_url || record.linkedin_jobs_url ||
        record.linkedin_url || "",
    ),
    company_about_source_url: String(
      directory.company_about_source_url || context.company_about_source_url ||
        "",
    ),
    known_location_filters: arrayFromUnknown(directory.known_location_filters),
    known_remote_filters: arrayFromUnknown(directory.known_remote_filters),
    known_keyword_search_patterns: arrayFromUnknown(
      directory.known_keyword_search_patterns,
    ),
    target_role_families: arrayFromUnknown(directory.target_role_families),
    compensation_source_notes: String(
      directory.compensation_source_notes || record.comp_notes || "",
    ),
    job_posting_capture_notes: String(
      directory.job_posting_capture_notes ||
        "Capture full raw posting text, official/ATS/LinkedIn URLs, source status, link health, requisition id, captured date, and last verified date.",
    ),
    navigation_notes: String(
      directory.navigation_notes ||
        "Verify official careers page and ATS/search interface before treating this source as reliable.",
    ),
    source_confidence: String(
      directory.source_confidence ||
        (["official_verified", "ats_verified"].includes(
            String(record.source_status || ""),
          )
          ? "medium"
          : "unverified"),
    ),
    last_verified_at: verifiedAt || null,
    record: {
      ...directory,
      derived_from_company_context: context,
      derived_from_job_id: record.id || record.job_result_id || "",
      source_priority: sourcePriorityLabel(record),
    },
  });
}

async function applyScoreToJob(
  supabase: SupabaseClient,
  jobId: string,
  score: Record<string, unknown>,
) {
  const existing = await selectOne(supabase, "jobcc_jobs", jobId) as
    | Record<string, unknown>
    | null;
  if (!existing) return;
  const existingRecord = (existing.record || {}) as Record<string, unknown>;
  await criticalUpsert(supabase, "jobcc_jobs", {
    ...existing,
    opportunity_score: score.opportunity_score || existing.opportunity_score ||
      null,
    record: {
      ...existingRecord,
      fit_score: score.fit_score,
      confidence_score: score.confidence_score,
      opportunity_score: score.opportunity_score,
      qualification_match_score: score.qualification_match_score,
      qualification_strength_score: score.qualification_strength_score,
      must_have_coverage_score: score.must_have_coverage_score,
      qualification_gap_risk_score: score.qualification_gap_risk_score,
      qualification_strengths: score.qualification_strengths || [],
      transferable_qualifications: score.transferable_qualifications || [],
      qualification_gaps: score.qualification_gaps || [],
      qualification_unknowns: score.qualification_unknowns || [],
      qualification_summary: score.qualification_summary || "",
      location_category: score.location_category ||
        existingRecord.location_category,
      region_preference_score: score.region_preference_score ??
        existingRecord.region_preference_score,
      relocation_required: score.relocation_required ??
        existingRecord.relocation_required,
      relocation_friction_score: score.relocation_friction_score ??
        existingRecord.relocation_friction_score,
      relocation_threshold_adjustment: score.relocation_threshold_adjustment ??
        existingRecord.relocation_threshold_adjustment,
      compensation_adjusted_for_location:
        score.compensation_adjusted_for_location ||
        existingRecord.compensation_adjusted_for_location,
      compensation_listed_yes_no: score.compensation_listed_yes_no ??
        existingRecord.compensation_listed_yes_no,
      listed_base_min: score.listed_base_min ?? existingRecord.listed_base_min,
      listed_base_max: score.listed_base_max ?? existingRecord.listed_base_max,
      listed_total_comp_notes: score.listed_total_comp_notes ||
        existingRecord.listed_total_comp_notes,
      estimated_comp_band: score.estimated_comp_band ||
        existingRecord.estimated_comp_band,
      estimated_comp_confidence: score.estimated_comp_confidence ||
        existingRecord.estimated_comp_confidence,
      compensation_source: score.compensation_source ||
        existingRecord.compensation_source,
      compensation_status: score.compensation_status ||
        existingRecord.compensation_status,
      compensation_verdict: score.compensation_verdict ||
        existingRecord.compensation_verdict,
      compensation_questions_to_verify:
        score.compensation_questions_to_verify ||
        existingRecord.compensation_questions_to_verify || [],
      family_lifestyle_considerations: score.family_lifestyle_considerations ||
        existingRecord.family_lifestyle_considerations,
      city_region_notes: score.city_region_notes ||
        existingRecord.city_region_notes,
      location_concerns: score.location_concerns ||
        existingRecord.location_concerns || [],
      relocation_verdict: score.relocation_verdict ||
        existingRecord.relocation_verdict,
      recommendation: score.recommendation,
      qualification_gate: score.qualification_gate,
      review_tier: reviewTierFromScore(score, existingRecord),
      fit_bucket: fitBucketFromScore(score, existingRecord),
      resume_lane_id: score.resume_lane_id,
      resume_lane_name: score.resume_lane_name,
      matched_fact_ids: score.matched_fact_ids,
      score_record: score,
    },
  });
}

async function markJobScoreSkipped(
  supabase: SupabaseClient,
  jobId: string,
  reason: string,
) {
  const existing = await selectOne(supabase, "jobcc_jobs", jobId) as
    | Record<string, unknown>
    | null;
  if (!existing) return;
  const existingRecord = (existing.record || {}) as Record<string, unknown>;
  await criticalUpsert(supabase, "jobcc_jobs", {
    ...existing,
    record: {
      ...existingRecord,
      score_status: "skipped_cost_cap",
      score_skipped_reason: reason,
      packet_eligibility: existingRecord.packet_eligibility ||
        "eligible_when_packet_requested",
    },
  });
}

async function existingJobsByDedupeKey(
  supabase: SupabaseClient,
): Promise<Map<string, Record<string, unknown>>> {
  const { data, error } = await supabase.from("jobcc_jobs").select("*").limit(
    2000,
  );
  if (error) throw new Error(`jobcc_jobs select failed: ${error.message}`);
  const map = new Map<string, Record<string, unknown>>();
  for (const row of data || []) {
    const record = {
      ...((row.record || {}) as Record<string, unknown>),
      id: row.id,
      company: row.company,
      role_title: row.role_title,
      location: row.location,
    };
    const key = canonicalDedupeKey(record);
    if (key) map.set(key, row as Record<string, unknown>);
  }
  return map;
}

async function observeSearchResult(
  auth: AuthContext,
  result: Record<string, unknown>,
  keyedProjection: Record<string, unknown> | undefined,
  runId: string,
  searchRunId: string,
  taskId: string,
  index: number,
): Promise<
  {
    classification: string;
    identityId: string;
    projectionJob: Record<string, unknown> | undefined;
  }
> {
  const aliases = identityAliasesForJob(result);
  const identityFingerprint = aliases[0]?.fingerprint ||
    canonicalDedupeKey(result) ||
    `fallback:${stableHash(JSON.stringify(result))}`;
  let identity: Record<string, unknown> | null = null;

  if (aliases.length) {
    const { data: aliasRows, error: aliasError } = await auth.supabase
      .from("jobcc_job_identity_aliases")
      .select("identity_id")
      .eq("user_id", auth.user.id)
      .eq("fingerprint_version", "v1")
      .in("alias_fingerprint", aliases.map((alias) => alias.fingerprint))
      .limit(1);
    if (aliasError) {
      throw new Error(
        `jobcc_job_identity_aliases lookup failed: ${aliasError.message}`,
      );
    }
    const identityId = String(aliasRows?.[0]?.identity_id || "");
    if (identityId) {
      identity = await selectOne(
        auth.supabase,
        "jobcc_job_identities",
        identityId,
      ).catch(() => null) as Record<string, unknown> | null;
    }
  }

  if (!identity) {
    const { data, error } = await auth.supabase
      .from("jobcc_job_identities")
      .select("*")
      .eq("user_id", auth.user.id)
      .eq("fingerprint_version", "v1")
      .eq("identity_fingerprint", identityFingerprint)
      .maybeSingle();
    if (error) {
      throw new Error(`jobcc_job_identities lookup failed: ${error.message}`);
    }
    identity = data as Record<string, unknown> | null;
  }

  if (!identity) {
    const projectionRecord = (keyedProjection?.record || {}) as Record<
      string,
      unknown
    >;
    const baselineHash = keyedProjection
      ? materialHashForJob(projectionRecord)
      : "";
    const { data, error } = await auth.supabase
      .from("jobcc_job_identities")
      .insert({
        user_id: auth.user.id,
        projection_job_id: keyedProjection?.id || null,
        fingerprint_version: "v1",
        identity_fingerprint: identityFingerprint,
        canonical_company: String(
          result.company || keyedProjection?.company || "",
        ),
        canonical_title: String(
          result.role_title || keyedProjection?.role_title || "",
        ),
        canonical_location: String(
          result.location || keyedProjection?.location || "",
        ),
        canonical_requisition_id: String(
          result.company_requisition_id || result.requisition_id ||
            result.ats_job_id || "",
        ),
        canonical_source_url: primarySourceUrl(result),
        current_material_hash_version: baselineHash ? "v1" : null,
        current_material_hash: baselineHash || null,
        record: {
          created_by_run_id: runId,
          created_by_search_run_id: searchRunId,
        },
      })
      .select("*")
      .single();
    if (error) {
      const { data: raced, error: raceError } = await auth.supabase
        .from("jobcc_job_identities")
        .select("*")
        .eq("user_id", auth.user.id)
        .eq("fingerprint_version", "v1")
        .eq("identity_fingerprint", identityFingerprint)
        .maybeSingle();
      if (raceError || !raced) {
        throw new Error(`jobcc_job_identities insert failed: ${error.message}`);
      }
      identity = raced as Record<string, unknown>;
    } else {
      identity = data as Record<string, unknown>;
    }
  }

  const identityId = String(identity.id || "");
  if (!identityId) {
    throw new Error("Search identity resolution returned no identity id.");
  }
  for (const alias of aliases) {
    const { error } = await auth.supabase.from("jobcc_job_identity_aliases")
      .upsert({
        user_id: auth.user.id,
        identity_id: identityId,
        fingerprint_version: "v1",
        alias_kind: alias.kind,
        alias_fingerprint: alias.fingerprint,
        alias_value: alias.value,
        last_seen_at: new Date().toISOString(),
        record: { search_run_id: searchRunId },
      }, { onConflict: "user_id,fingerprint_version,alias_fingerprint" });
    if (error) {
      throw new Error(
        `jobcc_job_identity_aliases upsert failed: ${error.message}`,
      );
    }
  }

  let projectionJob = keyedProjection;
  const projectionJobId = String(
    identity.projection_job_id || keyedProjection?.id || "",
  );
  if (!projectionJob && projectionJobId) {
    projectionJob = await selectOne(
      auth.supabase,
      "jobcc_jobs",
      projectionJobId,
    ).catch(() => null) as Record<string, unknown> | undefined;
  }
  if (projectionJob && !identity.projection_job_id) {
    const { error } = await auth.supabase.from("jobcc_job_identities").update({
      projection_job_id: projectionJob.id,
    }).eq("id", identityId).eq("user_id", auth.user.id);
    if (error) {
      throw new Error(
        `jobcc_job_identities projection link failed: ${error.message}`,
      );
    }
  }
  if (projectionJob && jobIsSuppressed(projectionJob)) {
    const { error } = await auth.supabase.rpc("jobcc_suppress_job_identity", {
      p_identity_id: identityId,
      p_reason_code: "projection_user_decision",
      p_reason_detail: String(
        projectionJob.user_decision ||
          (projectionJob.record as Record<string, unknown> | undefined)
            ?.user_decision ||
          projectionJob.status || "suppressed",
      ),
      p_record: {
        projection_job_id: projectionJob.id,
        synchronized_by_search_run_id: searchRunId,
      },
    });
    if (error) {
      throw new Error(`jobcc_suppress_job_identity failed: ${error.message}`);
    }
  }

  const materialHash = materialHashForJob(result);
  const { data: observationData, error: observationError } = await auth.supabase
    .rpc("jobcc_record_job_observation", {
      p_identity_id: identityId,
      p_idempotency_key: stableId(
        "job-observation",
        searchRunId,
        taskId,
        index,
        identityId,
        materialHash,
      ),
      p_material_hash: materialHash,
      p_material_hash_version: "v1",
      p_search_run_id: searchRunId,
      p_source_key: String(
        result.source_type || result.posting_source_name || "",
      ),
      p_source_url: primarySourceUrl(result),
      p_observed_at: new Date().toISOString(),
      p_record: {
        workflow_run_id: runId,
        task_id: taskId,
        canonical_dedupe_key: canonicalDedupeKey(result),
      },
    });
  if (observationError) {
    throw new Error(
      `jobcc_record_job_observation failed: ${observationError.message}`,
    );
  }
  const observation =
    (Array.isArray(observationData) ? observationData[0] : observationData) as
      | Record<string, unknown>
      | null;
  return {
    classification: String(observation?.classification || "new"),
    identityId,
    projectionJob,
  };
}

function identityAliasesForJob(
  result: Record<string, unknown>,
): Array<{ kind: string; fingerprint: string; value: string }> {
  const candidates = [
    ["canonical", canonicalDedupeKey(result), canonicalDedupeKey(result)],
    [
      "requisition",
      result.company_requisition_id || result.requisition_id,
      `${result.company || ""}:${
        result.company_requisition_id || result.requisition_id || ""
      }`,
    ],
    [
      "ats",
      result.ats_job_id || result.job_id_external || result.external_job_id,
      `${result.company || ""}:${
        result.ats_job_id || result.job_id_external || result.external_job_id ||
        ""
      }`,
    ],
    [
      "official_url",
      result.canonical_official_url || result.official_source_url ||
      result.official_url,
      normalizeUrl(
        String(
          result.canonical_official_url || result.official_source_url ||
            result.official_url || "",
        ),
      ),
    ],
    [
      "source_url",
      result.ats_source_url || result.posting_source_url || result.source_url ||
      result.application_link,
      normalizeUrl(
        String(
          result.ats_source_url || result.posting_source_url ||
            result.source_url || result.application_link || "",
        ),
      ),
    ],
    [
      "compound",
      `${result.company || ""}|${result.role_title || ""}|${
        result.location || ""
      }`,
      [result.company, result.role_title, result.location].map((value) =>
        normalizeKey(String(value || ""))
      ).join("|"),
    ],
  ];
  const seen = new Set<string>();
  return candidates.flatMap(([kind, raw, value]) => {
    const normalizedValue = String(value || raw || "").trim();
    if (!normalizedValue || normalizedValue === "||") return [];
    const fingerprint = `${kind}:${stableHash(normalizedValue.toLowerCase())}`;
    if (seen.has(fingerprint)) return [];
    seen.add(fingerprint);
    return [{ kind: String(kind), fingerprint, value: normalizedValue }];
  });
}

function materialHashForJob(result: Record<string, unknown>): string {
  const text = fullPostingTextFromRecord(result);
  if (text.length >= 200) return stableHash(normalizePostingForHash(text));
  return stableHash(JSON.stringify({
    company: normalizeKey(String(result.company || "")),
    role_title: normalizeKey(String(result.role_title || "")),
    location: normalizeKey(String(result.location || "")),
    remote_hybrid_onsite: normalizeKey(
      String(result.remote_hybrid_onsite || ""),
    ),
    active_status: normalizeKey(String(result.active_status || "")),
    listed_base_min: result.listed_base_min || null,
    listed_base_max: result.listed_base_max || null,
    salary_snippet: String(
      result.salary_snippet || result.compensation_summary || "",
    ),
    snippet: String(
      result.short_card_snippet || result.candidate_card_notes || "",
    ).slice(0, 1000),
  }));
}

async function mergeExistingJobEvidence(
  supabase: SupabaseClient,
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>,
  runId: string,
  searchRunId: string,
  observationStatus = "duplicate",
) {
  const currentRecord = (existing.record || {}) as Record<string, unknown>;
  const mergedRecord = mergeJobRecords(currentRecord, incoming);
  await criticalUpsert(supabase, "jobcc_jobs", {
    ...existing,
    record: {
      ...mergedRecord,
      id: existing.id,
      search_run_id: currentRecord.search_run_id || searchRunId,
      workflow_run_id: currentRecord.workflow_run_id || runId,
      user_decision: currentRecord.user_decision || existing.user_decision ||
        "",
      status: currentRecord.status || existing.status || "",
      starred: currentRecord.starred || false,
      rating: currentRecord.rating || null,
      notes: currentRecord.notes || "",
      last_seen_at: new Date().toISOString(),
      last_seen_search_run_id: searchRunId,
      latest_search_observation: observationStatus,
      duplicate_evidence_merged_at: new Date().toISOString(),
      source_links: uniqueStrings([
        ...arrayFromUnknown(currentRecord.source_links),
        String(
          currentRecord.official_source_url || currentRecord.ats_source_url ||
            currentRecord.posting_source_url || currentRecord.source_url || "",
        ),
        String(
          incoming.official_source_url || incoming.ats_source_url ||
            incoming.posting_source_url || incoming.source_url || "",
        ),
        ...arrayFromUnknown(incoming.source_links),
      ].filter(Boolean)),
    },
  });
}

function jobIsSuppressed(job: Record<string, unknown>): boolean {
  const record = (job.record || {}) as Record<string, unknown>;
  const state = [
    job.status,
    job.user_decision,
    record.status,
    record.user_decision,
    record.search_suppression_status,
  ]
    .map((value) => String(value || "").toLowerCase())
    .join(" ");
  return /\b(pass|dismissed?|removed|archived|rejected|not a fit|not interested|suppressed)\b/
    .test(state) &&
    !/\b(restored|unsuppressed)\b/.test(state);
}

function jobMateriallyChanged(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>,
): boolean {
  const existingText = fullPostingTextFromRecord(existing);
  const incomingText = fullPostingTextFromRecord(incoming);
  const existingHash = String(
    existing.normalized_posting_hash || existing.posting_hash ||
      (existingText.length >= 500
        ? stableHash(normalizePostingForHash(existingText))
        : ""),
  );
  const incomingHash = String(
    incoming.normalized_posting_hash || incoming.posting_hash ||
      (incomingText.length >= 500
        ? stableHash(normalizePostingForHash(incomingText))
        : ""),
  );
  if (existingHash && incomingHash) return existingHash !== incomingHash;
  const fields = [
    "role_title",
    "location",
    "remote_hybrid_onsite",
    "active_status",
    "listed_base_min",
    "listed_base_max",
    "compensation_summary",
  ];
  return fields.some((field) => {
    const next = String(incoming[field] ?? "").trim();
    if (!next) return false;
    return normalizeKey(next) !== normalizeKey(String(existing[field] ?? ""));
  });
}

function defaultReviewTier(result: Record<string, unknown>): string {
  const bucket = String(result.fit_bucket || result.search_result_bucket || "")
    .toLowerCase();
  if (bucket === "strong_fit") return "review_now";
  if (bucket === "high_upside_needs_verification") return "high_upside_backup";
  const score = Number(result.opportunity_score || result.fit_score || 0);
  if (score >= 75) return "review_now";
  if (
    score >= 55 ||
    /vp|head|chief|president|general manager|senior director|director/i.test(
      String(result.role_title || ""),
    )
  ) return "high_upside_backup";
  return "borderline_review_later";
}

function reviewTierFromScore(
  score: Record<string, unknown>,
  existing: Record<string, unknown>,
): string {
  if (String(existing.review_tier || "")) return String(existing.review_tier);
  if (
    String(score.qualification_gate || "") === "send_to_writer" ||
    Number(score.opportunity_score || 0) >= 75
  ) return "review_now";
  if (
    Number(score.opportunity_score || 0) >= 55 ||
    Number(score.fit_score || 0) >= 65
  ) return "high_upside_backup";
  return "borderline_review_later";
}

function fitBucketFromScore(
  score: Record<string, unknown>,
  existing: Record<string, unknown>,
): string {
  if (String(existing.fit_bucket || "")) return String(existing.fit_bucket);
  if (
    String(score.qualification_gate || "") === "send_to_writer" ||
    Number(score.opportunity_score || 0) >= 75
  ) return "strong_fit";
  if (
    Number(score.opportunity_score || 0) >= 55 ||
    Number(score.fit_score || 0) >= 65
  ) return "high_upside_needs_verification";
  return "borderline_review_later";
}

function canonicalDedupeKey(result: Record<string, unknown>): string {
  const canonicalJobId = normalizeKey(
    String(result.canonical_job_id || result.stable_job_id || ""),
  );
  if (canonicalJobId) {
    return `canonical:${
      normalizeKey(String(result.company || ""))
    }:${canonicalJobId}`;
  }
  const requisition = normalizeKey(
    String(result.company_requisition_id || result.requisition_id || ""),
  );
  if (requisition) {
    return `req:${normalizeKey(String(result.company || ""))}:${requisition}`;
  }
  const ats = normalizeKey(
    String(
      result.ats_job_id || result.job_id_external || result.external_job_id ||
        "",
    ),
  );
  if (ats) return `ats:${normalizeKey(String(result.company || ""))}:${ats}`;
  const officialUrl = normalizeUrl(
    String(
      result.canonical_official_url || result.official_source_url ||
        result.official_url || "",
    ),
  );
  if (officialUrl) return `url:${officialUrl}`;
  const sourceUrl = normalizeUrl(
    String(
      result.ats_source_url || result.posting_source_url || result.source_url ||
        result.application_link || result.linkedin_url ||
        result.linkedin_job_link || "",
    ),
  );
  if (sourceUrl) return `url:${sourceUrl}`;
  const compound = [result.company, result.role_title, result.location].map(
    (value) => normalizeKey(String(value || "")),
  ).join("|");
  if (compound.replace(/\|/g, "")) return `compound:${compound}`;
  const text = String(result.job_description_text || "");
  return text
    ? `fingerprint:${
      stableHash(text.slice(0, 4000).replace(/\s+/g, " ").toLowerCase())
    }`
    : "";
}

function localSearchRunOutput(
  runId: string,
  searchRunId: string,
  results: Array<Record<string, unknown>>,
  duplicatesRemoved: number,
  body: RequestBody,
  accounting: Record<string, number> = {},
): Record<string, unknown> {
  const companies = requestedCompanies(body);
  const roles = requestedRoleFamilies(body);
  return {
    schema_version: "job-command-center-v2",
    run_id: runId,
    job_id: null,
    model_role: "Workflow Orchestrator",
    confidence: 1,
    approval_required_before_external_action: true,
    search_run_id: searchRunId,
    status: "partial",
    results,
    coverage: {
      companies_requested: companies,
      companies_searched: [],
      companies_failed: [],
      companies_not_searched: companies,
      role_families_requested: roles,
      role_families_searched: [],
      role_families_failed: [],
      sources_used: [],
      official_sources_checked:
        results.filter((result) => result.source_type === "official").length,
      linkedin_sources_checked:
        results.filter((result) => result.source_type === "linkedin").length,
      aggregator_sources_checked:
        results.filter((result) => result.source_type === "aggregator").length,
      jobs_found: results.length,
      jobs_verified:
        results.filter((result) => result.active_status === "verified_active")
          .length,
      jobs_rejected: results.filter((result) => result.rejection_reason).length,
      duplicates_removed: duplicatesRemoved,
      candidate_cards_seen: accounting.candidate_cards_seen || results.length,
      postings_evaluated: accounting.postings_evaluated || results.length,
      identities_observed: accounting.identities_observed || 0,
      screened_out_roles: accounting.screened_out_roles || 0,
      compensation_screened_out: accounting.compensation_screened_out || 0,
      compensation_screened_out_below_floor:
        accounting.compensation_screened_out_below_floor || 0,
      compensation_screened_out_missing_comp:
        accounting.compensation_screened_out_missing_comp || 0,
      deferred_due_to_full_posting_cap:
        accounting.deferred_due_to_full_posting_cap || 0,
      new_roles: accounting.new_roles || 0,
      changed_roles: accounting.changed_roles || 0,
      unchanged_roles: accounting.unchanged_roles || 0,
      suppressed_roles: accounting.suppressed_roles || 0,
      jobs_needing_verification:
        results.filter((result) =>
          result.active_status === "needs_verification"
        ).length,
      search_queries_executed: 0,
      search_complete: false,
      coverage_percent: 0,
      coverage_notes: "Dedupe completed; verification and scoring run next.",
    },
    webSearchQueries: [],
    groundingChunks: [],
    groundingSupports: [],
    urlContextMetadata: null,
    grounding_metadata_status: "not_requested",
    grounding_source_urls: uniqueStrings(
      results.flatMap((result) =>
        arrayFromUnknown(result.grounding_source_urls).concat(
          primarySourceUrl(result),
        )
      ).filter(Boolean),
    ),
    grounding_queries: [],
    grounding_chunks_count: 0,
    url_context_used: false,
    google_search_used: false,
    source_verified_by: "not_verified",
    source_verification_notes:
      "Local search-run artifact; provider grounding metadata is recorded on Scout and verification steps when returned.",
    sources: [],
    estimated_api_cost: 0,
    actual_api_cost: 0,
  };
}

function postingVerificationGate(job: Record<string, unknown>): string[] {
  const blockers: string[] = [];
  if (String(job.active_status || "") !== "verified_active") {
    blockers.push(
      `Posting is ${String(job.active_status || "not verified active")}.`,
    );
  }
  if (!hasPacketReadyContent(job)) {
    blockers.push(
      "Job posting is incomplete. Capture or paste the full posting before generating role-specific materials.",
    );
  }
  return blockers;
}

function writerGateBlockers(
  score: Record<string, unknown>,
  job: Record<string, unknown>,
): string[] {
  const blockers: string[] = [];
  if (String(score.qualification_gate || "") !== "send_to_writer") {
    blockers.push(
      `Qualification gate is ${String(score.qualification_gate || "unset")}.`,
    );
  }
  if (!hasPacketReadyContent(job)) {
    blockers.push(
      "Job posting is incomplete. Capture or paste the full posting before generating role-specific materials.",
    );
  }
  return blockers;
}

function bestFactMatch(
  requirement: string,
  facts: Array<Record<string, unknown>>,
): Record<string, unknown> | null {
  const reqTokens = new Set(normalizeTokens(requirement));
  let best: Record<string, unknown> | null = null;
  let bestScore = 0;
  for (const fact of facts) {
    const factTokens = normalizeTokens(
      `${fact.canonical_claim || ""} ${fact.category || ""}`,
    );
    const overlap = factTokens.filter((token) => reqTokens.has(token)).length;
    const score = overlap / Math.max(1, reqTokens.size);
    if (score > bestScore) {
      bestScore = score;
      best = { ...fact, score: Math.max(0.35, Math.min(0.95, score)) };
    }
  }
  return bestScore >= 0.12 ? best : null;
}

function mergeJobRecords(
  base: Record<string, unknown>,
  incoming: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...base,
    ...Object.fromEntries(
      Object.entries(incoming).filter(([, value]) =>
        value !== undefined && value !== null && value !== ""
      ),
    ),
    grounding_sources: mergeArrays(
      base.grounding_sources,
      incoming.grounding_sources,
    ),
    source_links: uniqueStrings(
      [
        ...arrayFromUnknown(base.source_links),
        String(
          base.official_source_url || base.ats_source_url ||
            base.posting_source_url || base.source_url || "",
        ),
        String(
          incoming.official_source_url || incoming.ats_source_url ||
            incoming.posting_source_url || incoming.source_url || "",
        ),
        ...arrayFromUnknown(incoming.source_links),
      ].filter(Boolean),
    ),
    verification_history: [
      ...arrayFromUnknown(base.verification_history),
      ...arrayFromUnknown(incoming.verification_history),
      {
        checked_at: new Date().toISOString(),
        active_status: incoming.active_status || base.active_status || "",
        source_url: incoming.source_url || incoming.posting_source_url ||
          incoming.official_source_url || incoming.ats_source_url ||
          base.source_url || base.posting_source_url ||
          base.official_source_url || base.ats_source_url || "",
      },
    ],
  };
}

function maxCallsForAction(
  action: string,
  limits: ReturnType<typeof controlledLimits>,
): number {
  if (action === "gemini-scout") return limits.maxScoutTasks;
  if (action === "score-job" || action === "openai-strategist") {
    return limits.maxStrategistCalls;
  }
  if (action === "openai-writer") return limits.maxWriterPackets;
  if (
    action === "gemini-critique" ||
    action === "gemini-final-quality-check" ||
    action === "gemini-document-quality-check"
  ) return limits.maxCriticCalls;
  if (action === "openai-finalizer") return limits.maxFinalizerCalls;
  return -1;
}

function estimateModelCost(action: string): number {
  return Number(
    Deno.env.get(
      `JOBCC_ESTIMATE_${action.replace(/-/g, "_").toUpperCase()}_USD`,
    ) || MODEL_COST_ESTIMATES[action] || 0.15,
  );
}

function estimateSearchRunCost(
  taskCount: number,
  limits: ReturnType<typeof controlledLimits>,
): number {
  const scoutCost = 0;
  const verifyCost = 0;
  const strategistCost = limits.maxStrategistCalls *
    estimateModelCost("score-job");
  const packetCost = limits.maxWriterPackets *
    (estimateModelCost("openai-writer") + estimateModelCost("gemini-critique") +
      estimateModelCost("openai-finalizer") +
      estimateModelCost("gemini-final-quality-check"));
  return roundMoney(scoutCost + verifyCost + strategistCost + packetCost);
}

function actualModelCost(
  provider: Provider,
  action: string,
  usage: Record<string, unknown>,
  searchQueryCount: number,
  fallback: number,
): number {
  const inputTokens = Number(
    usage.input_tokens || usage.prompt_tokens || usage.promptTokenCount || 0,
  );
  const outputTokens = Number(
    usage.output_tokens || usage.completion_tokens ||
      usage.candidatesTokenCount || 0,
  );
  const inputRate = Number(
    Deno.env.get(`${provider.toUpperCase()}_INPUT_COST_PER_1M`) ||
      (provider === "openai" ? 1.25 : 0.35),
  );
  const outputRate = Number(
    Deno.env.get(`${provider.toUpperCase()}_OUTPUT_COST_PER_1M`) ||
      (provider === "openai" ? 10 : 1.05),
  );
  const searchRate = Number(
    Deno.env.get("GEMINI_SEARCH_COST_PER_QUERY") || 0.035,
  );
  const tokenCost = ((inputTokens / 1_000_000) * inputRate) +
    ((outputTokens / 1_000_000) * outputRate);
  const searchCost = provider === "gemini" ? searchQueryCount * searchRate : 0;
  const calculated = tokenCost + searchCost;
  return roundMoney(calculated > 0 ? calculated : fallback);
}

function sweepApprovalEstimate(
  tasks: Array<Record<string, unknown>>,
  limits: ReturnType<typeof controlledLimits>,
  estimatedCost: number,
): Record<string, unknown> {
  return {
    estimated_cost: estimatedCost,
    expected_scout_calls: Math.min(tasks.length, limits.maxScoutTasks),
    expected_strategist_calls: limits.maxStrategistCalls,
    maximum_writer_packets: limits.maxWriterPackets,
    expected_search_query_count: Math.min(tasks.length, limits.maxScoutTasks) *
      2,
    stop_limits: limits,
    status: "waiting_for_user",
  };
}

function replayBodyFromRun(
  run: Record<string, unknown>,
  body: RequestBody,
): RequestBody {
  const inputRecord = (run.input_record || {}) as Record<string, unknown>;
  const saved = (inputRecord.request_body || {}) as RequestBody;
  return mergeReplayBody(saved, body, {
    workflow_run_id: String(
      run.id || body.workflow_run_id || body.run_id || "",
    ),
    search_run_id: String(run.search_run_id || body.search_run_id || ""),
  });
}

function replayBodyFromStepOrRun(
  step: Record<string, unknown>,
  run: Record<string, unknown>,
  body: RequestBody,
): RequestBody {
  const stepRecord = (step.record || {}) as Record<string, unknown>;
  const saved = (stepRecord.request_body || {}) as RequestBody;
  return mergeReplayBody(replayBodyFromRun(run, body), saved, body);
}

export function replayBodyForRetry(
  step: Record<string, unknown>,
  run: Record<string, unknown>,
  body: RequestBody,
): RequestBody {
  if (String(step.step_type || "") === "gemini-final-quality-check") {
    return replayBodyFromRun(run, body);
  }
  return replayBodyFromStepOrRun(step, run, body);
}

function mergeReplayBody(...parts: RequestBody[]): RequestBody {
  const merged = Object.assign({}, ...parts) as RequestBody;
  merged.limits = parts.reduce<Record<string, number | boolean>>(
    (limits, part) => ({
      ...limits,
      ...((part.limits || {}) as Record<string, number | boolean>),
    }),
    {},
  );
  return merged;
}

async function latestRetryableStep(
  supabase: SupabaseClient,
  runId: string,
  requestedStepId?: string,
): Promise<Record<string, unknown> | null> {
  const steps = await selectMany(
    supabase,
    "jobcc_workflow_steps",
    "run_id",
    runId,
  ) as Array<Record<string, unknown>>;
  const failed = steps
    .filter((step) => /failed/i.test(String(step.status || "")))
    .filter((step) =>
      !requestedStepId || step.step_id === requestedStepId ||
      step.id === requestedStepId
    )
    .sort((a, b) => {
      const aTask = Boolean(
        (a.record as Record<string, unknown> | undefined)?.task_id,
      );
      const bTask = Boolean(
        (b.record as Record<string, unknown> | undefined)?.task_id,
      );
      if (aTask !== bTask) return aTask ? -1 : 1;
      return Date.parse(String(b.updated_at || b.completed_at || "")) -
        Date.parse(String(a.updated_at || a.completed_at || ""));
    });
  return failed[0] || null;
}

async function searchTaskForRetry(
  supabase: SupabaseClient,
  runId: string,
  failedStep: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  const stepTaskId = String(
    (failedStep.record as Record<string, unknown> | undefined)?.task_id || "",
  );
  const tasks = await selectMany(
    supabase,
    "jobcc_search_tasks",
    "run_id",
    runId,
  ) as Array<Record<string, unknown>>;
  if (stepTaskId) {
    return tasks.find((task) => String(task.id || "") === stepTaskId) || null;
  }
  return tasks
    .filter((task) =>
      String(task.status || "") === "failed" &&
      Number(task.attempts || 0) < Number(task.max_attempts || 1)
    )
    .sort((a, b) =>
      Date.parse(String(b.updated_at || b.failed_at || "")) -
      Date.parse(String(a.updated_at || a.failed_at || ""))
    )[0] || null;
}

async function latestBlockedReviewStep(
  supabase: SupabaseClient,
  runId: string,
  run: Record<string, unknown>,
  requestedStepId?: string,
): Promise<Record<string, unknown> | null> {
  if (
    String(run.status || "") !== "waiting_for_approval" ||
    String(run.error_code || "") !== "career_canon_blocked"
  ) return null;
  const steps = await selectMany(
    supabase,
    "jobcc_workflow_steps",
    "run_id",
    runId,
  ) as Array<Record<string, unknown>>;
  const blocked = steps
    .filter((step) =>
      String(step.step_type || "") === "match-job-to-canon" &&
      String(step.status || "") === "completed"
    )
    .filter((step) =>
      !requestedStepId || step.step_id === requestedStepId ||
      step.id === requestedStepId
    )
    .sort((a, b) =>
      Date.parse(String(b.updated_at || b.completed_at || "")) -
      Date.parse(String(a.updated_at || a.completed_at || ""))
    )[0];
  return blocked
    ? {
      ...blocked,
      status: "blocked_review_retry",
      max_attempts: Number(blocked.max_attempts || 1) + 1,
    }
    : null;
}

function safeWorkflowRequest(body: RequestBody): RequestBody {
  return {
    job: body.job,
    jobs: Array.isArray(body.jobs) ? body.jobs.slice(0, 50) : undefined,
    resumeBank: body.resumeBank,
    careerFacts: body.careerFacts,
    prohibitedFacts: body.prohibitedFacts,
    sourceDocuments: body.sourceDocuments,
    resumeLanes: body.resumeLanes,
    promptContracts: body.promptContracts,
    schemas: body.schemas,
    workflow_type: body.workflow_type,
    search_run_id: body.search_run_id,
    companies: body.companies,
    role_families: body.role_families,
    official_career_urls: body.official_career_urls,
    include_packet_generation: body.include_packet_generation,
    profile: body.profile,
    sourceText: body.sourceText,
    prompt: body.prompt,
    notes: body.notes,
    consent_gates: body.consent_gates,
    run_synchronously: body.run_synchronously,
    source_first_official_capture: body.source_first_official_capture,
    limits: body.limits,
  };
}

function requestedCompanies(body: RequestBody): string[] {
  if (Array.isArray(body.companies) && body.companies.length) {
    return uniqueStrings(body.companies.map(String));
  }
  if (Array.isArray(body.jobs) && body.jobs.length) {
    return uniqueStrings(
      body.jobs.map((job) => String(job.company || "")).filter(Boolean),
    );
  }
  return CONTROLLED_COMPANIES;
}

function requestedRoleFamilies(body: RequestBody): string[] {
  return Array.isArray(body.role_families) && body.role_families.length
    ? uniqueStrings(body.role_families.map(String))
    : CONTROLLED_ROLE_FAMILIES;
}

function normalizeTokens(value: string): string[] {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").split(/\s+/).filter(
    (token) => token.length > 2,
  );
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(
    /^_|_$/g,
    "",
  );
}

function normalizeUrl(value: string): string {
  try {
    const url = new URL(value);
    url.hash = "";
    url.searchParams.sort();
    return `${url.origin}${url.pathname.replace(/\/$/, "")}${url.search}`;
  } catch {
    return normalizeKey(value);
  }
}

function arrayFromUnknown(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "")).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function mergeArrays(a: unknown, b: unknown): unknown[] {
  const combined = [
    ...(Array.isArray(a) ? a : []),
    ...(Array.isArray(b) ? b : []),
  ];
  const seen = new Set<string>();
  return combined.filter((item) => {
    const key = JSON.stringify(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueStrings(values: Array<unknown>): string[] {
  return Array.from(
    new Set(values.map((value) => String(value || "").trim()).filter(Boolean)),
  );
}

function firstNonEmpty(values: Array<unknown>): string {
  return values.map((value) => String(value || "").trim()).find(Boolean) || "";
}

function countBy(
  rows: Array<Record<string, unknown>>,
  key: string,
): Record<string, number> {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const value = String(
      row[key] || ((row.record || {}) as Record<string, unknown>)[key] ||
        "unknown",
    );
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function average(values: number[]): number {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;
}

function roundMoney(value: number): number {
  return Math.round(Math.max(0, value) * 10000) / 10000;
}

async function searchQueriesFromSteps(
  supabase: SupabaseClient,
  runId: string,
): Promise<number> {
  const steps = await selectMany(
    supabase,
    "jobcc_workflow_steps",
    "run_id",
    runId,
  ) as Array<Record<string, unknown>>;
  return steps.reduce(
    (sum, step) => sum + Number(step.search_query_count || 0),
    0,
  );
}

function buildPrompt(
  action: string,
  body: RequestBody,
  runId: string,
  schemaName: string,
): string {
  const profile = body.profile ||
    "Matthew Grossman is a founder-operator focused on senior operations, marketplace, logistics, customer operations, and real-world technology roles. Do not infer past titles, reporting lines, or ownership beyond verified Career Canon facts.";
  const resumeBank = body.resumeBank
    ? JSON.stringify(body.resumeBank, null, 2)
    : "{}";
  const careerFacts = Array.isArray(body.careerFacts)
    ? JSON.stringify(body.careerFacts, null, 2)
    : "[]";
  const prohibitedFacts = Array.isArray(body.prohibitedFacts)
    ? JSON.stringify(body.prohibitedFacts, null, 2)
    : "[]";
  const sourceDocuments = Array.isArray(body.sourceDocuments)
    ? JSON.stringify(body.sourceDocuments.slice(0, 12), null, 2)
    : "[]";
  const resumeLanes = Array.isArray(body.resumeLanes)
    ? JSON.stringify(body.resumeLanes, null, 2)
    : "[]";
  const promptContracts = body.promptContracts
    ? JSON.stringify(body.promptContracts, null, 2)
    : "{}";
  const document = body.document ? JSON.stringify(body.document, null, 2) : "";
  const feedback = body.feedback ? JSON.stringify(body.feedback, null, 2) : "";
  const targetDocumentType = String(
    body.document?.document_type || body.document?.type || "",
  ).trim().toLowerCase();
  const targetDocumentContract = targetDocumentType
    ? documentChannelContract(targetDocumentType)
    : "";
  const documentRules = Array.isArray(body.documentRules)
    ? JSON.stringify(body.documentRules, null, 2)
    : "[]";
  const schemas = Array.isArray(body.schemas)
    ? body.schemas.join(", ")
    : allSchemaNames().join(", ");
  const job = body.job ? JSON.stringify(body.job, null, 2) : "";
  const jobs = Array.isArray(body.jobs)
    ? JSON.stringify(body.jobs.slice(0, 80), null, 2)
    : "";
  const sourceText = body.sourceText || body.prompt || "";
  const notes = body.notes || "";
  const instruction = actionInstruction(action);
  if (action === "gemini-scout") {
    return [
      "You are helping Matthew Grossman with a private executive job-search command center.",
      "Return only JSON that matches the requested schema. Do not wrap JSON in Markdown.",
      "Never submit applications, send messages, upload resumes, log in, use 2FA, change settings, or perform external actions.",
      "Search official company career pages first, official ATS postings second, LinkedIn Jobs for context, and aggregators only as discovery.",
      locationTradeoffPolicyText(),
      "For each result, include source URLs, source type, active status, raw posting text where available, parsed Job Brief fields, and grounding metadata status fields.",
      "If a posting is not accessible in full, set raw_posting_text to an empty string, mark active_status needs_verification or unknown, and use source_verification_notes to explain.",
      "",
      `Run id: ${runId}`,
      `Action: ${action}`,
      `Required schema: ${schemaName}`,
      "",
      "Instruction:",
      instruction,
      "",
      "Approval gates:",
      body.consent_gates ||
      "Stop before login, CAPTCHA, upload, submit, send, email, message, account changes, public deployment, or irreversible external action.",
      "",
      sourceText ? `Search task:\n${sourceText}` : "",
      notes ? `Notes:\n${notes}` : "",
    ].filter(Boolean).join("\n");
  }
  return [
    "You are helping Matthew Grossman with a private executive job-search command center.",
    "Return only JSON that matches the requested schema. Do not wrap JSON in Markdown.",
    "Never submit applications, send messages, upload resumes, log in, use 2FA, change settings, or perform external actions.",
    "Career Canon is a hard source of truth. Source documents may inform wording, but they cannot override verified canon facts.",
    "Job source priority is official company career page, official ATS posting, LinkedIn Jobs for context, search discovery pointing to reliable sources, then aggregators only as discovery.",
    locationTradeoffPolicyText(),
    "For discovered jobs, capture raw_posting_text, parsed_job_brief, company_context, and company_source_directory. Use null, an empty array, or Needs verification when a field is not confidently known.",
    "For discovered or verified jobs, return source URLs, source type, grounding_metadata_status, grounding_source_urls, grounding_queries, grounding_chunks_count, url_context_used, google_search_used, source_verified_by, and source_verification_notes. Valid JSON alone is not grounded source verification.",
    "If provider grounding metadata is unavailable but an official job URL was captured and checked, set grounding_metadata_status to unavailable_provider_response and source_verified_by to official_url_capture.",
    "Application materials must use parsed_job_brief and full posting content. Do not generate generic role-specific materials from title and company alone.",
    "Every hard metric, title, company, date, institution, revenue figure, team figure, contract figure, and scale claim must map to a verified Career Canon fact id.",
    "Prohibited facts block finalization. Needs-review facts route to Approval Inbox. Unsupported claims block finalization.",
    schemaName === "finalized_packet"
      ? "Return document_evidence for every generated document_type: ats_resume, executive_resume, positioning_memo, cover_letter, recruiter_outreach, hiring_manager_outreach, application_answers, interview_prep, and verification_questions. Each entry must contain claim_evidence plus only that document's matched_fact_ids, claims_used, unresolved_issues, unsupported_claims, prohibited_fact_matches, and needs_review_fact_matches. Every claim_evidence item must quote the exact factual claim text used in that document and include support_status, matched_fact_ids, and source_document_ids. A supported claim needs at least one currently verified or approved Career Canon fact ID. Use unsupported, prohibited, or needs_review to keep an unresolved factual claim explicitly blocked. Use an empty claim_evidence array only when the document makes no candidate factual claim; never copy packet-wide evidence into every document."
      : "",
    schemaName === "finalized_packet"
      ? "Each document's legacy evidence arrays must exactly equal the union derived from its own claim_evidence, and packet-level matched_fact_ids, claims_used, unresolved_issues, unsupported_claims, prohibited_fact_matches, and needs_review_fact_matches must be the union of all nine per-document entries. All nine documents must contain meaningful content. If any document lacks evidence or has an unresolved claim, keep that document blocked for manual review rather than inventing a link."
      : "",
    "If a posting is missing, do not create role-specific application material.",
    "",
    `Run id: ${runId}`,
    `Action: ${action}`,
    `Required schema: ${schemaName}`,
    `Available schemas: ${schemas}`,
    "",
    "Instruction:",
    instruction,
    roleKitDocumentContract(),
    targetDocumentContract
      ? `Target document contract:\n${targetDocumentContract}`
      : "",
    "",
    "Approval gates:",
    body.consent_gates ||
    "Stop before login, CAPTCHA, upload, submit, send, email, message, account changes, public deployment, or irreversible external action.",
    "",
    "Matthew profile:",
    String(profile),
    "",
    "Resume bank / career facts:",
    resumeBank,
    "",
    "Verified Career Canon facts:",
    careerFacts,
    "",
    "Prohibited or needs-review facts:",
    prohibitedFacts,
    "",
    "Source documents:",
    sourceDocuments,
    "",
    "Resume lanes:",
    resumeLanes,
    "",
    "Prompt contracts:",
    promptContracts,
    "",
    document ? `Current document:\n${document}` : "",
    feedback ? `Matthew feedback:\n${feedback}` : "",
    documentRules !== "[]"
      ? `Applicable approved document rules:\n${documentRules}`
      : "",
    body.target_document_id
      ? `Target document id: ${body.target_document_id}`
      : "",
    "",
    job ? `Job record:\n${job}` : "",
    jobs ? `Job records:\n${jobs}` : "",
    sourceText ? `Source text:\n${sourceText}` : "",
    notes ? `Notes:\n${notes}` : "",
  ].filter(Boolean).join("\n");
}

function actionInstruction(action: string): string {
  const instructions: Record<string, string> = {
    "rank-role":
      "Return fit, confidence, opportunity, and qualification-match scores; separate direct strengths, transferable qualifications, missing or unproven requirements, and unknowns; include Career Canon matches, plain-English rationale, risks, and the recommended next action for one role.",
    "rank-current-view":
      "Rank the supplied jobs. Return top roles, top actions today, verify-first roles, pass roles, resume tailoring needs, and next actions.",
    "resume-packet":
      "Build a tailored resume packet using actual posting responsibilities, required qualifications, keywords, team context, and Matthew proof points.",
    "outreach-packet":
      "Draft recruiter DM, hiring manager DM, warm intro note, follow-up note, why-me line, and why-this-role line.",
    "cover-letter":
      "Draft a concise role-specific cover letter in Matthew's direct voice without overclaiming.",
    "application-plan":
      "Create a verification checklist, resume lane, tailoring tasks, outreach plan, browser-agent stop points, and next actions.",
    "interview-prep":
      "Prepare likely questions, story bank, gaps, questions to ask, scope/compensation questions, and follow-up note.",
    "decision-memo":
      "Create a pros/cons decision memo covering compensation, lifestyle, travel, family impact, equity, brand, network, learning, risk, and recommendation.",
    "gemini-critique":
      "Critique the supplied role packet or search results for factual conflicts, unsupported claims, missing requirements, generic language, AI-sounding language, overclaiming, prohibited facts, and outdated facts.",
    "gemini-final-quality-check":
      "Act as a blind independent final resume and materials quality auditor after the OpenAI Finalizer. You receive only the finished documents, complete posting and Job Brief, approved Career Canon evidence, and prohibited facts. You do not receive any earlier critique, qualification score, prior quality score, approval state, Finalizer commentary, or Finalizer evidence verdicts. Audit the finalized ATS and executive resumes against those sources. Score each resume using exactly five components totaling 100 points: factual integrity 0-20, channel structure 0-15, direct role evidence 0-35, executive operating proof 0-15, and human scan/channel fit 0-15. Return exactly five rubric_evidence rows for each resume, one per component; every row must quote exact resume text, list only supporting approved fact IDs, state points awarded, and explain the award. Direct-role-evidence and executive-operating-proof rows must also quote exact verified posting text. The component points must equal the score fields. Each resume must score at least 85 and pass factual integrity to pass. Judge document quality by how effectively the resume selects, positions, and substantiates the strongest approved evidence available for this posting. Candidate qualification gaps are scored separately by the Strategist and must not be double-counted as document-quality defects, disguised, or used to inflate the resume score. Audit the seven supporting materials as a separate pass/revise/block gate. Report precise findings and required revisions; never improve a score by inventing evidence or hiding a genuine gap. Do not infer or repeat Strategist qualification scores; the server stores that separate assessment as a sibling after this audit. Set quality_gate to pass only when both resumes meet threshold, factual integrity passes, and supporting materials pass. This is an internal audit only and must never send, upload, submit, publish, or perform an external action.",
    "gemini-document-quality-check":
      "Act as an independent quality auditor for one targeted document revision created by OpenAI. Audit only the supplied revised document against the complete posting, parsed Job Brief, approved Career Canon evidence, document-local claim evidence, and Matthew's requested feedback. Score exactly five components totaling 100 points: factual integrity 0-20, role specificity 0-25, channel structure 0-20, evidence strength 0-20, and human scan/channel fit 0-15. The document must score at least 85, pass factual integrity, and have no blocking finding or required revision to pass. Never improve a score by inventing evidence, disguising a genuine qualification gap, or rewarding unsupported language. Keep candidate qualification fit separate from document quality. Return precise blockers and revisions. This is an internal audit only and must never send, upload, submit, publish, or perform an external action.",
    "gemini-search-extract":
      "Extract structured job records and search_run metadata from the source text. Return full raw posting text only when the role passes candidate-card screening; otherwise return cheap candidate-card fields. Return parsed job brief, verified source links, source type, grounding metadata status fields, freshness state, company context, company_source_directory, compensation_status, compensation_verdict, and compensation verification questions. If salary is missing on a senior role, do not mark low comp; mark not_listed plus unknown_but_senior_enough_to_review or needs_verification.",
    "gemini-scout":
      "Use live Google Search grounding and URL Context. Source priority: official company career page first; official ATS posting second; LinkedIn Jobs mainly for recency, recruiter, hiring team, applicant, reposting, and context signals; Google/Gemini discovery only when it points back to reliable sources; aggregators only as discovery unless verified against an official or LinkedIn posting. Use staged search: capture job-list/card fields first, cheap-screen by title, seniority, department, location, and keywords, then full-capture only likely fits or high-upside borderline roles. Return raw_posting_text only for full-captured roles, parsed_job_brief when enough posting text exists, company_context, company_source_directory, source URLs, source type, grounding metadata status fields, compensation status/verdict fields, and relocation/location tradeoff fields. Do not invent missing fields.",
    "openai-strategist":
      "Score fit, confidence, opportunity, and qualification coverage. Select the resume lane. Compare every captured required qualification and major responsibility against approved Career Canon evidence. Return a 0-100 qualification_match_score, direct qualification strengths, transferable qualifications that need careful positioning, genuine qualification gaps, unknowns needing verification, must-have coverage, and a separate gap-risk score. A missing or unproven qualification is not automatically a disqualifier; explain it plainly and convert unresolved items into verification or interview questions. Identify overclaiming risks, facts to emphasize, facts to reduce, compensation verification questions, relocation/location tradeoffs, and apply/verify/pass recommendation. Missing salary is not a low-comp signal for senior roles; bucket strong senior no-salary roles as high-upside needs verification.",
    "score-job":
      "Act as the OpenAI Strategist. Score fit, confidence, opportunity, and qualification coverage. Select the resume lane. Compare every captured required qualification and major responsibility against approved Career Canon evidence. Return a 0-100 qualification_match_score, direct qualification strengths, transferable qualifications that need careful positioning, genuine qualification gaps, unknowns needing verification, must-have coverage, and a separate gap-risk score. A missing or unproven qualification is not automatically a disqualifier; explain it plainly and convert unresolved items into verification or interview questions. Identify overclaiming risks, facts to emphasize, facts to reduce, compensation verification questions, relocation/location tradeoffs, and apply/verify/pass recommendation. Missing salary is not a low-comp signal for senior roles; bucket strong senior no-salary roles as high-upside needs verification. Set qualification_gate to send_to_writer when evidence is sufficient for an honest draft, even if genuine gaps remain; reserve manual review for unresolved factual or source risk.",
    "openai-writer":
      "Draft one evidence-consistent role kit from the selected lane, parsed job brief, full posting, qualification evidence map, and verified Career Canon only. Use the Strategist's direct strengths and facts-to-emphasize to select the strongest verified proof for the posting's most important responsibilities and qualifications. Never let generic leadership language, advisory work, or affiliations displace more directly relevant operating evidence. Include a positioning memo, ATS resume, executive resume, cover letter, recruiter outreach, hiring-manager outreach, application answers, interview prep, verification questions, compatibility summary/bullets, and decision memo fields required by the schema. Return a separate document_evidence entry for every generated document, using only facts and claims that appear in that document; each factual claim must quote its document-local text in claim_evidence and carry support_status, matched Career Canon fact IDs, and source document IDs. Never copy packet-wide evidence into each entry. Address transferable qualifications honestly and never hide material gaps, but put gaps, cautions, and verification needs in the internal positioning memo, interview prep, verification questions, or decision memo instead of contaminating employer-facing resumes and outreach. Do not generate generic material from title and company alone.",
    "openai-finalizer":
      "Review the Gemini critique against the parsed job brief, full posting, Career Canon, and Strategist evidence priorities. Accept or reject critique items. Produce one compact role kit for Matthew approval containing all nine required documents with meaningful content: ATS resume, executive resume, positioning memo, cover letter, recruiter outreach, hiring-manager outreach, application answers, interview prep, and verification questions. In both resumes, preserve the strongest verified evidence that directly answers the posting before generic leadership language, advisory work, or affiliations. For every document, return strict document_evidence with claim_evidence that quotes each factual claim exactly as used, labels it supported, unsupported, prohibited, or needs_review, and lists its matched Career Canon fact IDs and source document IDs. The remaining per-document arrays must be exact unions from claim_evidence. Never copy packet-wide evidence across documents. Missing evidence must remain blocked, not inferred or fabricated. Keep every section concise, role-specific, and grounded only in verified Career Canon facts. Keep internal strategy, missing qualifications, cautions, and verification needs out of employer-facing resumes and outreach; route them to the positioning memo, interview prep, verification questions, or decision memo. Retain compatibility fields by deriving final_resume_summary and final_resume_bullets from the resumes and mirroring cover_letter, recruiter_outreach, and hiring_manager_outreach into final_cover_letter, final_recruiter_dm, and final_hiring_manager_dm. Explain accepted and rejected critique items. Do not publish, send, apply, upload, submit, or perform external action.",
    "revise-document":
      "Revise only the supplied current document in response to Matthew's feedback. Preserve all verified facts, chronology, titles, attribution strength, and approved Career Canon wording. Apply active rules that match the document, company, and role family. Do not add any factual clause, metric, reporting line, title, credential, scope, or outcome that is not supported by an approved fact ID. Return the complete revised document, not commentary or a wrapper around the old draft. Return claim_evidence for every factual candidate claim in revised_content; quote each claim verbatim, label its support_status, and include matched approved Career Canon fact IDs plus linked source document IDs. Set claim_evidence_complete true and factual_claim_count to the exact claim_evidence length, including zero when the revision contains no factual candidate claims. The matched_fact_ids and blocked-claim arrays must exactly equal their claim_evidence unions. List what changed, identify any factual changes separately, and list applied rule IDs. Omit unsupported requested claims from employer-facing material. If omission fully resolves the safety issue and the final document contains no unsupported or ambiguous claim, leave unresolved_feedback empty; do not use it as a catch-all for candidate gaps, missing qualifications, or unverified employer details that are absent from the document. This is an internal draft; do not send, submit, upload, message, or perform an external action.",
    "start-controlled-search":
      "Create a controlled mini-sweep search_run for the specified company and role-family batches. Never mark partial coverage complete.",
    "run-market-sweep":
      "Run only the controlled mini-sweep unless explicit full-sweep approval is present. Do not perform external irreversible actions.",
    "prepare-application-packet":
      "Run Strategist -> Writer -> Critic -> Finalizer internally for the selected role and produce one approval-ready packet.",
    "generate-application-packet":
      "Generate an application packet only after a posting is present. Include resume tailoring plan, cover letter draft, outreach drafts, application plan, approval checklist, and quality warnings.",
    "prepare-top-targets":
      "Select and explain top targets from supplied jobs. Use Career Canon and resume lanes. Return ranked recommendations, gaps, risks, and next steps.",
    "generate-ranked-recommendations":
      "Rank supplied jobs by fit, opportunity, compensation, location, freshness, and Matthew-specific interest. Return top targets, verify-first roles, pass roles, and next actions.",
  };
  return instructions[action] ||
    "Analyze the supplied data and return a concise schema-valid result.";
}

export function roleKitDocumentContract(): string {
  return [
    "Document channel contract:",
    "ATS resume and executive resume are employer-facing resumes, not candidacy dossiers. They must contain only resume content and verified evidence.",
    "Select resume content by direct relevance to the captured posting, not by prestige or generic seniority. Use the strongest verified evidence for the posting's top responsibilities and qualifications before affiliations, advisory work, or broad founder language.",
    "Do not omit directly relevant verified operating evidence to make room for generic capability statements, repeated summaries, or low-relevance affiliations.",
    "Never imply Matthew previously held the target employer title. Exact target-function keywords may appear only as truthful capability language supported by Career Canon evidence.",
    "Every metric, title, employer, date, institution, revenue figure, team figure, contract figure, and operating-scope claim used in a resume must have a matched Career Canon fact ID in that resume's document_evidence; otherwise omit it.",
    "For each factual candidate claim that remains in any role-kit document, claim_evidence must quote the exact document text and include support_status, matched Career Canon fact IDs, and source document IDs. Supported claims require a currently verified or approved fact ID; unsupported, prohibited, and needs-review claims remain blocked.",
    "Document-level evidence must be local to that document. Never copy packet-wide claims or fact IDs into a document that does not contain the quoted claim. Packet aggregates are the union of the nine document-local evidence records.",
    "Keep missing qualifications, application strategy, gap analysis, verification questions, compensation questions, relocation questions, and internal do-not-claim guidance in the positioning memo, interview prep, verification questions, or decision memo.",
    "Do not add OPENAI POSITIONING, APPLICATION STRATEGY, RISKS, GAPS, VERIFICATION, or DO NOT CLAIM sections to either resume.",
    "Document evidence unresolved_issues is only for a document-specific unsafe, ambiguous, or unsupported claim still present in that document. It is not a list of job requirements the candidate does not meet.",
    "An unsupported claim that is safely omitted from the final document is resolved by omission and must not block that document.",
  ].join("\n");
}

export function documentChannelContract(documentType: string): string {
  const normalized = String(documentType || "").trim().toLowerCase();
  if (normalized === "ats_resume") {
    return [
      "This is an employer-facing ATS resume for an application portal.",
      "Use a parser-safe single-column structure with conventional sections: SUMMARY, CORE STRENGTHS, EXPERIENCE, EDUCATION, and optional LEADERSHIP or AFFILIATIONS only when supported.",
      "Use exact target-function keywords in SUMMARY and CORE STRENGTHS only when they truthfully describe verified capability; never present the target role as a title Matthew already held.",
      "Give directly relevant experience and measurable proof priority over affiliations, advisory work, or generic leadership language.",
      "Write concise resume fragments and achievement bullets, not a third-person biography or internal assessment.",
      "Do not include gap analysis, verification questions, cautions, application strategy, or do-not-claim language.",
    ].join("\n");
  }
  if (normalized === "executive_resume") {
    return [
      "This is an employer-facing executive resume for recruiters, hiring managers, and warm introductions.",
      "Use polished conventional resume sections: EXECUTIVE PROFILE, CORE CAPABILITIES, PROFESSIONAL EXPERIENCE, SELECTED LEADERSHIP or AFFILIATIONS when supported, and EDUCATION.",
      "Make the executive profile role-specific with truthful target-function language, then prioritize the verified operating scope and achievements that most directly answer the posting.",
      "Affiliations and advisory work are optional and must never displace more relevant professional experience or proof.",
      "Lead with operating scope and selected achievements, then preserve employer, title, location, dates, and concise bullets. Keep the result to a practical two-page maximum.",
      "Do not write a third-person biography, candidacy dossier, positioning memo, or internal evaluation.",
      "Do not include OPENAI POSITIONING, missing qualifications, verification questions, cautions, application strategy, or do-not-claim language in the resume.",
      "Omit unsupported requests. If the resulting resume contains only verified claims, omission is resolved and unresolved_feedback must be empty.",
    ].join("\n");
  }
  if (
    [
      "cover_letter",
      "recruiter_outreach",
      "hiring_manager_outreach",
      "application_answers",
    ].includes(normalized)
  ) {
    return [
      "This is employer-facing material.",
      "Return only the finished material in Matthew's direct voice.",
      "Do not include internal strategy, missing qualifications, verification notes, cautions, or do-not-claim language.",
      "Omit unsupported requests and leave unresolved_feedback empty when the final material contains only verified claims.",
    ].join("\n");
  }
  return [
    "Keep the document faithful to its named channel and intended audience.",
    "Separate employer-facing copy from internal strategy, evidence gaps, and verification work.",
    "Never present unsupported information as fact.",
  ].join("\n");
}

function locationTradeoffPolicyText(): string {
  return [
    "Location and relocation policy:",
    "Matthew is based in Phoenix / Scottsdale and strongly prefers Phoenix / Scottsdale / Tempe, Arizona hybrid, and U.S. remote roles where he can remain in Arizona.",
    "Do not hard-block relocation-required roles. Classify location as Phoenix / Scottsdale / Tempe, Arizona hybrid, U.S. remote, relocation optional, relocation required, travel-heavy, or unknown location flexibility.",
    "Use a weighted relocation model: local, Arizona hybrid, and U.S. remote get strong positive weight; major desirable U.S. cities can be neutral-to-positive; California and tri-state are negative by default but not hard no; isolated middle-America markets are strongly negative unless the role is exceptional; unclear flexibility needs review.",
    "The weaker the location fit, the higher the role must score on compensation, title, scope, reporting line, decision authority, company quality, upside, family/lifestyle fit, cost of living, tax impact, housing impact, travel burden, and airport access.",
    "Every scored or discovered job must include location_category, region_preference_score, relocation_required, relocation_friction_score, relocation_threshold_adjustment, compensation_adjusted_for_location, family_lifestyle_considerations, city_region_notes, location_concerns, and relocation_verdict.",
    "Relocation verdict must be plain English and one of the allowed enum values.",
  ].join("\n");
}

function buildRepairPrompt(
  originalPrompt: string,
  schemaName: string,
  schema: JsonSchema,
  rawText: string,
  errors: string[],
): string {
  return [
    "Repair the prior model output in place so it validates against both the JSON schema and every deterministic integrity error.",
    "Return only valid JSON. Do not add Markdown or commentary.",
    "Preserve all required documents and useful grounded content. Do not replace the packet with a summary or regenerate it from scratch.",
    "When an error says claim_evidence omits likely factual document text, either add that complete verbatim document-local unit to claim_evidence with real approved Career Canon fact IDs and their linked source document IDs, or remove/rewrite the claim. Never invent an ID.",
    "For a factual unit in an internal memo that is not a Matthew Career Canon fact, use needs_review with empty fact/source IDs only when the unit must remain for manual review. Omit unsupported employer-facing claims.",
    "After changing claim_evidence, recompute every document-local legacy evidence array and every packet-level aggregate as exact unions. Keep employer-facing outreach free of em dashes.",
    `Schema name: ${schemaName}`,
    `Schema: ${JSON.stringify(schema)}`,
    `Validation errors: ${JSON.stringify(errors)}`,
    "Original task:",
    originalPrompt,
    "Invalid output:",
    rawText,
  ].join("\n\n");
}

async function logAgentRun(
  supabase: SupabaseClient,
  userId: string,
  runId: string,
  action: string,
  modelRole: string,
  provider: Provider,
  status: string,
  requestBody: RequestBody,
  output: unknown = null,
) {
  await criticalUpsert(supabase, "jobcc_agent_runs", {
    id: runId,
    user_id: userId,
    workflow_type: action,
    model_role: modelRole,
    function_name: action,
    status,
    job_id: jobIdFromBody(requestBody),
    started_at: new Date().toISOString(),
    completed_at:
      ["complete", "completed", "error", "failed_validation", "failed_provider"]
          .includes(status)
        ? new Date().toISOString()
        : null,
    record: { request: redactRequest(requestBody), output, provider },
  });
}

async function logAgentStep(
  supabase: SupabaseClient,
  userId: string,
  runId: string,
  stepIndex: number,
  stepType: string,
  modelRole: string,
  provider: Provider,
  action: string,
  status: string,
  label: string,
  record: Record<string, unknown> = {},
) {
  await criticalUpsert(supabase, "jobcc_agent_steps", {
    id: `${runId}-step-${stepIndex}`,
    user_id: userId,
    run_id: runId,
    step_index: stepIndex,
    status,
    label,
    record: {
      label,
      status,
      step_type: stepType,
      model_role: modelRole,
      provider,
      action,
      ...record,
    },
  });
}

async function saveGeneratedOutput(
  supabase: SupabaseClient,
  userId: string,
  runId: string,
  action: string,
  provider: Provider,
  requestBody: RequestBody,
  output: Record<string, unknown>,
  schemaName: string,
  modelRole: string,
  modelName = "",
  qualityAssessment: Record<string, unknown> | null = null,
  qualificationAssessment: Record<string, unknown> | null = null,
): Promise<GeneratedOutputPersistenceResult> {
  const persistedOutput = schemaName === "finalized_packet"
    ? normalizeFinalizedPacketEvidence(output)
    : schemaName === "fact_match"
    ? normalizeCanonMatchOutput(output)
    : output;
  const jobId = jobIdFromBody(requestBody);
  const idKey = stableId(
    action,
    requestBody.search_run_id || runId,
    jobId || "no-job",
    inputVersion(requestBody),
  );
  const finalQualityRequired = schemaName === "finalized_packet" &&
    modelRole === "OpenAI Finalizer";
  const finalQualityMissing = finalQualityRequired && !qualityAssessment;
  const qualityGate = String(qualityAssessment?.quality_gate || "");
  const approvalStatus = outputNeedsManualReview(persistedOutput) ||
      finalQualityMissing ||
      (qualityAssessment && qualityGate !== "pass")
    ? "needs_manual_review"
    : "ready_for_review";
  const combinedQualityFlags = uniqueStrings([
    ...qualityFlags(persistedOutput),
    ...(qualityAssessment
      ? qualityReviewBlockers(qualityAssessment, persistedOutput)
      : []),
    ...(finalQualityMissing
      ? [
        "Independent final quality review has not run; employer-use approval remains blocked.",
      ]
      : []),
  ]);
  await criticalUpsert(supabase, "jobcc_generated_packets", {
    id: `packet-${idKey}`,
    user_id: userId,
    job_id: jobId,
    packet_type: action,
    status: approvalStatus,
    record: {
      provider,
      model_role: modelRole,
      action,
      schema_name: schemaName,
      output: persistedOutput,
      quality_assessment: qualityAssessment,
      strategist_qualification: qualificationAssessment,
    },
  });
  if (schemaName === "critique") {
    await criticalUpsert(supabase, "jobcc_model_critiques", {
      id: `critique-${idKey}`,
      user_id: userId,
      job_id: jobId,
      critique_type: action,
      status: approvalStatus,
      record: {
        provider,
        model_role: modelRole,
        action,
        output: persistedOutput,
      },
    });
  }
  if (
    schemaName === "document_revision" ||
    schemaName === "document_quality_check"
  ) {
    return {
      approvalId: "",
      approvalStatus,
      documentIds: [],
    };
  }
  const canonicalApprovalId = `approval-${idKey}`;
  const canonicalApprovalRow: Record<string, unknown> = {
    id: canonicalApprovalId,
    user_id: userId,
    item_type: action,
    job_id: jobId,
    status: approvalStatus,
    title: approvalTitle(action, requestBody.job),
    record: {
      provider,
      model_role: modelRole,
      action,
      workflow_run_id: runId,
      run_id: runId,
      job_id: jobId,
      schema_name: schemaName,
      output: persistedOutput,
      quality_assessment: qualityAssessment,
      strategist_qualification: qualificationAssessment,
      approval_required_before_external_action: true,
      canonical_supabase_record: true,
      quality_gate: qualityGate || (finalQualityMissing ? "not_run" : null),
      quality_flags: combinedQualityFlags,
    },
  };
  if (schemaName === "finalized_packet" && modelRole === "OpenAI Finalizer") {
    const stagedApprovalRow = {
      ...canonicalApprovalRow,
      record: {
        ...canonicalApprovalRow.record as Record<string, unknown>,
        actionable: false,
        activation_pending_browser_task: approvalStatus === "ready_for_review",
      },
    };
    const documentRows = await finalizedRoleKitDocumentVersionRows(
      supabase,
      userId,
      runId,
      action,
      provider,
      modelName,
      requestBody,
      persistedOutput,
      qualityAssessment,
      qualificationAssessment,
      finalQualityRequired,
    );
    const persistedApproval = await persistFinalizedRoleKitBeforeApproval(
      {
        supersedeActionableApprovals: async () => {
          if (!jobId) return;
          await supersedeStaleActionableApprovals(
            supabase,
            userId,
            runId,
            jobId,
            canonicalApprovalId,
          );
        },
        upsertDocumentRows: (rows) =>
          criticalUpsertRows(supabase, "jobcc_document_versions", rows),
        upsertCanonicalApproval: (row) =>
          criticalUpsert(supabase, "jobcc_approvals", row),
      },
      { rows: documentRows, canonicalApprovalRow: stagedApprovalRow },
    );
    return {
      approvalId: String(persistedApproval.id || canonicalApprovalId),
      approvalStatus,
      documentIds: documentRows.map((row) => String(row.id || "")),
    };
  }
  await criticalUpsert(supabase, "jobcc_approvals", canonicalApprovalRow);
  return {
    approvalId: canonicalApprovalId,
    approvalStatus,
    documentIds: [],
  };
}

async function supersedeStaleActionableApprovals(
  supabase: SupabaseClient,
  userId: string,
  runId: string,
  jobId: string,
  canonicalApprovalId: string,
) {
  const approvals = await selectMany(
    supabase,
    "jobcc_approvals",
    "job_id",
    jobId,
  ) as Array<Record<string, unknown>>;
  const staleApprovals = staleActionableRoleKitApprovals(
    approvals,
    runId,
    jobId,
    canonicalApprovalId,
  );
  for (const approval of staleApprovals) {
    const record = approval.record && typeof approval.record === "object" &&
        !Array.isArray(approval.record)
      ? approval.record as Record<string, unknown>
      : {};
    await criticalUpsert(supabase, "jobcc_approvals", {
      id: String(approval.id || ""),
      user_id: userId,
      item_type: String(approval.item_type || "manual_review"),
      job_id: jobId,
      status: "superseded",
      title: String(approval.title || "Role-kit review"),
      record: {
        ...record,
        superseded_by: canonicalApprovalId,
        resolved_by_workflow_run_id: runId,
        resolution: "replaced_by_canonical_role_kit_approval",
        actionable: false,
      },
      updated_at: new Date().toISOString(),
    });
  }
}

export function staleActionableRoleKitApprovals(
  approvals: Array<Record<string, unknown>>,
  _runId: string,
  jobId: string,
  canonicalApprovalId = "",
): Array<Record<string, unknown>> {
  return approvals.filter((approval) => {
    const record = approval.record && typeof approval.record === "object" &&
        !Array.isArray(approval.record)
      ? approval.record as Record<string, unknown>
      : {};
    const approvalJobId = String(approval.job_id || record.job_id || "");
    const approvalId = String(approval.id || "");
    return approvalJobId === jobId && approvalId !== canonicalApprovalId &&
      ACTIONABLE_APPROVAL_STATUSES.has(String(approval.status || ""));
  });
}

async function finalizedRoleKitDocumentVersionRows(
  supabase: SupabaseClient,
  userId: string,
  runId: string,
  action: string,
  provider: Provider,
  modelName: string,
  requestBody: RequestBody,
  output: Record<string, unknown>,
  qualityAssessment: Record<string, unknown> | null = null,
  qualificationAssessment: Record<string, unknown> | null = null,
  qualityRequired = false,
): Promise<Array<Record<string, unknown>>> {
  const jobId = jobIdFromBody(requestBody);
  const job = requestBody.job || {};
  const existingVersions = jobId
    ? await selectMany(
      supabase,
      "jobcc_document_versions",
      "job_id",
      jobId,
    ) as Array<Record<string, unknown>>
    : [];
  const rows = buildFinalizedRoleKitDocumentRows({
    userId,
    runId,
    action,
    provider,
    modelName,
    jobId,
    job,
    output,
    existingVersions,
    careerFacts: requestBody.careerFacts,
    sourceDocuments: requestBody.sourceDocuments,
    qualityAssessment,
    qualificationAssessment,
    qualityRequired,
  });
  return rows;
}

export async function persistFinalizedRoleKitBeforeApproval(
  store: FinalizedRoleKitPersistenceStore,
  args: {
    rows: Array<Record<string, unknown>>;
    canonicalApprovalRow: Record<string, unknown>;
  },
): Promise<Record<string, unknown>> {
  assertFinalizedRoleKitDocumentRows(args.rows);
  const documentIds = args.rows.map((row) => String(row.id || ""));
  const approvalRecord = args.canonicalApprovalRow.record &&
      typeof args.canonicalApprovalRow.record === "object" &&
      !Array.isArray(args.canonicalApprovalRow.record)
    ? args.canonicalApprovalRow.record as Record<string, unknown>
    : {};
  const canonicalApprovalRow = {
    ...args.canonicalApprovalRow,
    record: {
      ...approvalRecord,
      document_ids: documentIds,
      document_count: documentIds.length,
      actionable: String(args.canonicalApprovalRow.status || "") ===
          "ready_for_review" && approvalRecord.actionable !== false,
    },
  };

  await store.upsertDocumentRows(args.rows);
  await store.supersedeActionableApprovals();
  await store.upsertCanonicalApproval(canonicalApprovalRow);
  return canonicalApprovalRow;
}

export function buildFinalizedRoleKitDocumentRows(args: {
  userId: string;
  runId: string;
  action: string;
  provider: string;
  modelName: string;
  jobId: string | null;
  job: Record<string, unknown>;
  output: Record<string, unknown>;
  existingVersions?: Array<Record<string, unknown>>;
  careerFacts?: Array<Record<string, unknown>>;
  sourceDocuments?: Array<Record<string, unknown>>;
  qualityAssessment?: Record<string, unknown> | null;
  qualificationAssessment?: Record<string, unknown> | null;
  qualityRequired?: boolean;
}): Array<Record<string, unknown>> {
  const integrityErrors = validateFinalizedRoleKitIntegrity(args.output, {
    careerFacts: args.careerFacts,
    sourceDocuments: args.sourceDocuments,
    job: args.job,
  });
  if (integrityErrors.length) {
    throw new Error(
      `Finalized role-kit integrity failed: ${integrityErrors.join("; ")}`,
    );
  }
  const documents = finalizedRoleKitDocuments(args.output);
  if (documents.length !== FINALIZED_PACKET_DOCUMENT_TYPES.length) {
    throw new Error(
      `Finalized role kit requires exactly ${FINALIZED_PACKET_DOCUMENT_TYPES.length} documents; received ${documents.length}.`,
    );
  }
  const existingVersions = args.existingVersions || [];
  const existingById = new Map(
    existingVersions.map((row) => [String(row.id || ""), row]),
  );
  const latestVersionByType = new Map<string, number>();
  for (const row of existingVersions) {
    const documentType = String(row.document_type || "");
    if (!documentType) continue;
    latestVersionByType.set(
      documentType,
      Math.max(
        latestVersionByType.get(documentType) || 0,
        Number(row.version_number || 0),
      ),
    );
  }
  return documents.map((document) => {
    const id = stableId(
      "document-version",
      args.runId,
      args.jobId || "no-job",
      document.documentType,
    );
    const existing = existingById.get(id);
    if (existing) {
      const existingRecord = existing.record &&
          typeof existing.record === "object" &&
          !Array.isArray(existing.record)
        ? existing.record as Record<string, unknown>
        : {};
      const existingRunId = String(
        existingRecord.workflow_run_id || existingRecord.run_id || "",
      );
      const existingJobId = String(
        existing.job_id || existingRecord.job_id || "",
      );
      if (
        String(existing.document_type || "") !== document.documentType ||
        existingRunId !== args.runId ||
        existingJobId !== String(args.jobId || "")
      ) {
        throw new Error(
          `Deterministic document ID collision for ${id}; existing row identity does not match this run, job, and document type.`,
        );
      }
    }
    const versionNumber = existing
      ? Math.max(1, Number(existing.version_number || 1))
      : (latestVersionByType.get(document.documentType) || 0) + 1;
    if (!existing) {
      latestVersionByType.set(document.documentType, versionNumber);
    }
    const documentQuality = documentEvidenceQualityFlags(document.evidence);
    const finalQuality = finalQualitySummaryForDocument(
      args.qualityAssessment,
      document.documentType,
      Boolean(args.qualityRequired),
    );
    const qualityAssessmentId = args.qualityAssessment
      ? stableId(
        "final-quality-check",
        args.runId,
        args.jobId || "no-job",
      )
      : null;
    const releaseFlags = uniqueStrings([
      ...documentQuality,
      ...(finalQuality.packetQualityGate &&
          finalQuality.packetQualityGate !== "pass"
        ? [
          `Role-kit independent quality gate: ${finalQuality.packetQualityGate}.`,
        ]
        : []),
      ...(finalQuality.qualityGate && finalQuality.qualityGate !== "pass"
        ? [
          `Independent final quality gate: ${finalQuality.qualityGate}.`,
          ...finalQuality.findings,
          ...finalQuality.requiredRevisions,
        ]
        : []),
    ]);
    return {
      id,
      user_id: args.userId,
      job_id: args.jobId,
      document_type: document.documentType,
      role_family:
        String(args.job.role_family || args.job.role_family_name || "")
          .trim() ||
        null,
      company: String(args.job.company || "").trim() || null,
      version_number: versionNumber,
      content: document.content,
      provider: args.provider,
      model_name: args.modelName,
      prompt_version: FINALIZER_ROLE_KIT_VERSION,
      playbook_version: FINALIZER_ROLE_KIT_VERSION,
      rule_ids_used: [],
      feedback_ids_used: [],
      status: releaseFlags.length ? "needs_manual_review" : "ready_for_review",
      career_canon_version: CAREER_CANON_VERSION,
      public_profile_version: PUBLIC_PROFILE_VERSION,
      preference_model_version: PREFERENCE_MODEL_VERSION,
      record: {
        workflow_run_id: args.runId,
        run_id: args.runId,
        job_id: args.jobId,
        source_action: args.action,
        source_field: document.sourceField,
        schema_name: "finalized_packet",
        provider: args.provider,
        model_name: args.modelName,
        model_role: "OpenAI Finalizer",
        document_evidence: document.evidence,
        claim_evidence: document.evidence?.claim_evidence || [],
        evidence_metadata_status: "complete",
        matched_fact_ids: document.evidence?.matched_fact_ids || [],
        claims_used: document.evidence?.claims_used || [],
        unresolved_issues: document.evidence?.unresolved_issues || [],
        unsupported_claims: document.evidence?.unsupported_claims || [],
        prohibited_fact_matches: document.evidence?.prohibited_fact_matches ||
          [],
        needs_review_fact_matches:
          document.evidence?.needs_review_fact_matches || [],
        quality_flags: releaseFlags,
        final_quality_check_id: qualityAssessmentId,
        quality_assessment_id: qualityAssessmentId,
        quality_content_fingerprint: qualityAssessmentId
          ? stableHash(document.content)
          : null,
        quality_gate: finalQuality.qualityGate || null,
        packet_quality_gate: finalQuality.packetQualityGate || null,
        quality_score: finalQuality.qualityScore,
        quality_threshold: finalQuality.qualityThreshold,
        factual_integrity_gate: finalQuality.factualIntegrityGate,
        quality_rubric_evidence: finalQuality.rubricEvidence,
        quality_findings: finalQuality.findings,
        required_revisions: finalQuality.requiredRevisions,
        strategist_qualification: args.qualificationAssessment,
        qualification_match_score:
          args.qualificationAssessment?.qualification_match_score ?? null,
        qualification_strength_score:
          args.qualificationAssessment?.qualification_strength_score ?? null,
        must_have_coverage_score:
          args.qualificationAssessment?.must_have_coverage_score ?? null,
        qualification_gap_risk_score:
          args.qualificationAssessment?.qualification_gap_risk_score ?? null,
        qualification_strengths: arrayFromUnknown(
          args.qualificationAssessment?.qualification_strengths,
        ),
        transferable_qualifications: arrayFromUnknown(
          args.qualificationAssessment?.transferable_qualifications,
        ),
        qualification_gaps: arrayFromUnknown(
          args.qualificationAssessment?.qualification_gaps,
        ),
        qualification_unknowns: arrayFromUnknown(
          args.qualificationAssessment?.qualification_unknowns,
        ),
        qualification_summary: String(
          args.qualificationAssessment?.qualification_summary || "",
        ),
        internal_only: true,
        visibility: "internal_only",
        submission_status: "not_submitted",
        submitted: false,
        approval_required_before_external_action: true,
        canonical_supabase_record: true,
      },
    };
  });
}

function finalQualitySummaryForDocument(
  assessment: Record<string, unknown> | null | undefined,
  documentType: FinalizedPacketDocumentType,
  qualityRequired = false,
): {
  qualityGate: string;
  packetQualityGate: string;
  qualityScore: number | null;
  qualityThreshold: number | null;
  factualIntegrityGate: string;
  rubricEvidence: Array<Record<string, unknown>>;
  findings: string[];
  requiredRevisions: string[];
} {
  if (!assessment) {
    return {
      qualityGate: qualityRequired ? "not_run" : "",
      packetQualityGate: qualityRequired ? "not_run" : "",
      qualityScore: null,
      qualityThreshold: qualityRequired
        ? FINAL_ROLE_KIT_QUALITY_THRESHOLD
        : null,
      factualIntegrityGate: qualityRequired ? "not_run" : "",
      rubricEvidence: [],
      findings: qualityRequired
        ? ["Independent final quality review has not run."]
        : [],
      requiredRevisions: qualityRequired
        ? ["Run the independent final quality review before approval."]
        : [],
    };
  }
  if (documentType === "ats_resume" || documentType === "executive_resume") {
    const scorecard = qualityRecord(assessment[documentType]);
    return {
      qualityGate: String(scorecard.quality_verdict || "revise"),
      packetQualityGate: String(assessment.quality_gate || "revise"),
      qualityScore: Number.isFinite(Number(scorecard.total_score))
        ? Number(scorecard.total_score)
        : null,
      qualityThreshold: Number.isFinite(Number(scorecard.score_threshold))
        ? Number(scorecard.score_threshold)
        : FINAL_ROLE_KIT_QUALITY_THRESHOLD,
      factualIntegrityGate: String(
        scorecard.factual_integrity_gate || "not_run",
      ),
      rubricEvidence: Array.isArray(scorecard.rubric_evidence)
        ? scorecard.rubric_evidence.map(qualityRecord)
        : [],
      findings: arrayFromUnknown(scorecard.findings),
      requiredRevisions: arrayFromUnknown(scorecard.required_revisions),
    };
  }
  const supporting = qualityRecord(assessment.supporting_materials);
  return {
    qualityGate: String(supporting.quality_gate || "revise"),
    packetQualityGate: String(assessment.quality_gate || "revise"),
    qualityScore: null,
    qualityThreshold: null,
    factualIntegrityGate: String(
      assessment.factual_integrity_gate || "not_run",
    ),
    rubricEvidence: [],
    findings: arrayFromUnknown(supporting.findings),
    requiredRevisions: arrayFromUnknown(supporting.required_revisions),
  };
}

export function finalizedRoleKitDocuments(
  output: Record<string, unknown>,
): FinalizedRoleKitDocument[] {
  return FINALIZED_PACKET_DOCUMENT_TYPES.map((documentType) => ({
    documentType,
    sourceField: documentType,
    content: roleKitDocumentContent(output[documentType]),
    evidence: finalizedPacketDocumentEvidence(output, documentType),
  }));
}

function finalizedPacketDocumentEvidence(
  output: Record<string, unknown>,
  documentType: FinalizedPacketDocumentType,
): FinalizedPacketDocumentEvidence | null {
  const evidenceByType = output.document_evidence;
  if (
    !evidenceByType || typeof evidenceByType !== "object" ||
    Array.isArray(evidenceByType)
  ) return null;
  const evidence = (evidenceByType as Record<string, unknown>)[documentType];
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) {
    return null;
  }
  const record = evidence as Record<string, unknown>;
  const requiredArrays = [
    "claim_evidence",
    "matched_fact_ids",
    "claims_used",
    "unresolved_issues",
    "unsupported_claims",
    "prohibited_fact_matches",
    "needs_review_fact_matches",
  ];
  if (requiredArrays.some((key) => !Array.isArray(record[key]))) return null;
  return normalizeFinalizedPacketDocumentEvidenceRecord(record);
}

function documentEvidenceQualityFlags(
  evidence: FinalizedPacketDocumentEvidence | null,
): string[] {
  if (!evidence) return ["Missing per-document evidence metadata."];
  return uniqueStrings([
    ...evidence.unresolved_issues.map((item) =>
      `Unresolved evidence issue: ${item}`
    ),
    ...evidence.unsupported_claims.map((item) => `Unsupported claim: ${item}`),
    ...evidence.prohibited_fact_matches.map((item) =>
      `Prohibited fact match: ${item}`
    ),
    ...evidence.needs_review_fact_matches.map((item) =>
      `Needs-review fact match: ${item}`
    ),
    ...(evidence.claims_used.length && !evidence.matched_fact_ids.length
      ? ["Document claims are present without matched Career Canon fact IDs."]
      : []),
    ...evidence.claim_evidence
      .filter((claim) => claim.support_status !== "supported")
      .map((claim) =>
        `${claim.support_status} claim requires manual review: ${claim.claim_text}`
      ),
  ]);
}

function roleKitDocumentContent(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean).join(
      "\n\n",
    );
  }
  return "";
}

function isMeaningfulRoleKitDocumentContent(content: string): boolean {
  return content.replace(/\s+/g, " ").trim().length >=
    MIN_ROLE_KIT_DOCUMENT_CONTENT_LENGTH;
}

export function assertFinalizedRoleKitDocumentRows(
  rows: Array<Record<string, unknown>>,
): void {
  if (rows.length !== FINALIZED_PACKET_DOCUMENT_TYPES.length) {
    throw new Error(
      `Finalized role kit requires exactly ${FINALIZED_PACKET_DOCUMENT_TYPES.length} document rows; received ${rows.length}.`,
    );
  }
  const documentTypes = rows.map((row) => String(row.document_type || ""));
  const documentIds = rows.map((row) => String(row.id || ""));
  if (new Set(documentTypes).size !== FINALIZED_PACKET_DOCUMENT_TYPES.length) {
    throw new Error("Finalized role-kit document types must be unique.");
  }
  if (new Set(documentIds).size !== FINALIZED_PACKET_DOCUMENT_TYPES.length) {
    throw new Error("Finalized role-kit document IDs must be unique.");
  }
  for (const documentType of FINALIZED_PACKET_DOCUMENT_TYPES) {
    const row = rows.find((candidate) =>
      String(candidate.document_type || "") === documentType
    );
    if (!row) {
      throw new Error(`Finalized role kit is missing ${documentType}.`);
    }
    if (!String(row.id || "").trim()) {
      throw new Error(
        `${documentType} is missing a deterministic document ID.`,
      );
    }
    if (!isMeaningfulRoleKitDocumentContent(String(row.content || ""))) {
      throw new Error(`${documentType} does not contain meaningful content.`);
    }
    const record = row.record && typeof row.record === "object" &&
        !Array.isArray(row.record)
      ? row.record as Record<string, unknown>
      : {};
    const evidence = record.document_evidence;
    if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) {
      throw new Error(`${documentType} is missing document-local evidence.`);
    }
    if (!Array.isArray(record.claim_evidence)) {
      throw new Error(`${documentType} is missing claim_evidence.`);
    }
  }
}

async function saveManualReviewApproval(
  supabase: SupabaseClient,
  userId: string,
  runId: string,
  action: string,
  jobId: string | null,
  message: string,
  rawOutput: string,
  validationErrors: string[],
) {
  await criticalUpsert(supabase, "jobcc_approvals", {
    id: stableId("manual-review", action, jobId || "no-job", runId),
    user_id: userId,
    item_type: action,
    job_id: jobId,
    status: "needs_manual_review",
    title: `${action} needs manual review`,
    record: {
      workflow_run_id: runId,
      run_id: runId,
      job_id: jobId,
      action,
      error: message,
      raw_output: rawOutput.slice(0, 12000),
      validation_errors: validationErrors,
      approval_required_before_external_action: true,
      canonical_supabase_record: true,
    },
  });
}

export function actionCreatesManualReviewApproval(action: string): boolean {
  return !["revise-document", "gemini-document-quality-check"].includes(
    String(action || "").trim().toLowerCase(),
  );
}

async function saveBrowserTask(
  supabase: SupabaseClient,
  userId: string,
  runId: string,
  jobId: string,
  title: string,
) {
  const id = stableId("browser-task", runId, jobId);
  const existingTasks = await selectMany(
    supabase,
    "jobcc_browser_tasks",
    "job_id",
    jobId,
  ) as Array<Record<string, unknown>>;
  for (
    const staleTask of stalePreparedBrowserTasks(
      existingTasks,
      runId,
      jobId,
      id,
    )
  ) {
    const staleRecord = staleTask.record &&
        typeof staleTask.record === "object" &&
        !Array.isArray(staleTask.record)
      ? staleTask.record as Record<string, unknown>
      : {};
    await criticalUpsert(supabase, "jobcc_browser_tasks", {
      ...staleTask,
      id: String(staleTask.id || ""),
      user_id: userId,
      job_id: jobId,
      status: "superseded",
      record: {
        ...staleRecord,
        status: "superseded",
        actionable: false,
        superseded_by: id,
        superseded_by_workflow_run_id: runId,
      },
      updated_at: new Date().toISOString(),
    });
  }
  await criticalUpsert(supabase, "jobcc_browser_tasks", {
    id,
    user_id: userId,
    job_id: jobId,
    status: "prepared",
    title,
    stop_point:
      "Stop before login, CAPTCHA, upload, submit, send, message, email, or account changes.",
    record: {
      task_id: id,
      title,
      workflow_run_id: runId,
      run_id: runId,
      job_id: jobId,
      status: "prepared",
      approval_required: true,
      external_action_allowed: false,
      preparation_only: true,
      steps: [
        "Open the official posting source.",
        "Confirm the job is still active and location eligible.",
        "Confirm no login, upload, send, submit, or external action is required.",
        "Return to Approval Inbox with exact status.",
      ],
      stop_point:
        "Stop before login, CAPTCHA, upload, submit, send, message, email, or account changes.",
    },
  });
}

export function stalePreparedBrowserTasks(
  tasks: Array<Record<string, unknown>>,
  _runId: string,
  jobId: string,
  currentTaskId: string,
): Array<Record<string, unknown>> {
  return tasks.filter((task) => {
    const record = task.record && typeof task.record === "object" &&
        !Array.isArray(task.record)
      ? task.record as Record<string, unknown>
      : {};
    const taskJobId = String(task.job_id || record.job_id || "");
    const taskId = String(task.id || record.task_id || "");
    const status = String(task.status || record.status || "").toLowerCase();
    return taskJobId === jobId && taskId !== currentTaskId &&
      ["prepared", "queued", "ready_for_review"].includes(status);
  });
}

async function activateCanonicalRoleKitApproval(
  supabase: SupabaseClient,
  userId: string,
  approvalId: string,
  browserTaskId: string,
) {
  const approval = await selectOne(supabase, "jobcc_approvals", approvalId) as
    | Record<string, unknown>
    | null;
  if (!approval) {
    throw new Error(
      "Canonical role-kit approval could not be reloaded before activation.",
    );
  }
  if (String(approval.status || "") !== "ready_for_review") {
    throw new Error(
      "Only a quality-passed ready-for-review approval can become actionable.",
    );
  }
  const record = approval.record && typeof approval.record === "object" &&
      !Array.isArray(approval.record)
    ? approval.record as Record<string, unknown>
    : {};
  await criticalUpsert(supabase, "jobcc_approvals", {
    ...approval,
    id: approvalId,
    user_id: userId,
    status: "ready_for_review",
    record: {
      ...record,
      actionable: true,
      activation_pending_browser_task: false,
      browser_task_id: browserTaskId,
      activated_at: new Date().toISOString(),
      external_action_allowed: false,
    },
    updated_at: new Date().toISOString(),
  });
}

async function saveWorkflowArtifact(
  supabase: SupabaseClient,
  userId: string,
  artifact: Record<string, unknown>,
) {
  await criticalUpsert(supabase, "jobcc_workflow_artifacts", {
    user_id: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...artifact,
  });
}

async function upsertWorkflowRun(
  supabase: SupabaseClient,
  userId: string,
  row: Record<string, unknown>,
) {
  await criticalUpsert(supabase, "jobcc_workflow_runs", {
    user_id: userId,
    updated_at: new Date().toISOString(),
    ...row,
  });
}

async function upsertWorkflowStep(
  supabase: SupabaseClient,
  userId: string,
  row: Record<string, unknown>,
) {
  await criticalUpsert(supabase, "jobcc_workflow_steps", {
    user_id: userId,
    updated_at: new Date().toISOString(),
    ...row,
  });
}

async function upsertSearchTask(
  supabase: SupabaseClient,
  userId: string,
  task: Record<string, unknown>,
) {
  await criticalUpsert(supabase, "jobcc_search_tasks", {
    user_id: userId,
    updated_at: new Date().toISOString(),
    ...task,
  });
}

async function updateSearchTaskStatus(
  supabase: SupabaseClient,
  taskId: string,
  status: string,
  attempts: number,
  resultCount = 0,
) {
  const { error } = await supabase.from("jobcc_search_tasks").update({
    status,
    attempts,
    result_count: resultCount,
    updated_at: new Date().toISOString(),
  }).eq("id", taskId);
  if (error) {
    throw new Error(`jobcc_search_tasks update failed: ${error.message}`);
  }
}

async function upsertSearchCoverage(
  supabase: SupabaseClient,
  userId: string,
  coverage: Record<string, unknown>,
) {
  await criticalUpsert(supabase, "jobcc_search_coverage", {
    user_id: userId,
    updated_at: new Date().toISOString(),
    ...coverage,
  });
}

async function persistSearchResults(
  supabase: SupabaseClient,
  userId: string,
  runId: string,
  searchRunId: string,
  results: Array<Record<string, unknown>>,
  body: RequestBody,
) {
  for (const result of results) {
    const sourceUrl = primarySourceUrl(result);
    if (!sourceUrl || !result.company || !result.role_title) continue;
    const id = stableId("job", result.company, result.role_title, sourceUrl);
    const fullPostingText = fullPostingTextFromRecord(result);
    const parsedBrief = parsedJobBriefFromRecord(result);
    await criticalUpsert(supabase, "jobcc_jobs", {
      id,
      user_id: userId,
      company: String(result.company || ""),
      role_title: String(result.role_title || ""),
      location: String(result.location || ""),
      status: result.active_status === "verified_active"
        ? "Needs Research"
        : "Needs Research",
      user_decision: "",
      opportunity_score: null,
      record: {
        ...result,
        id,
        job_description_text: fullPostingText,
        raw_posting_text: fullPostingText,
        parsed_job_brief: parsedBrief,
        source_priority: sourcePriorityLabel(result),
        search_run_id: searchRunId,
        workflow_run_id: runId,
        source_grounded: String(result.grounding_metadata_status || "") ===
          "metadata_returned",
      },
    });
    await criticalUpsert(supabase, "jobcc_job_descriptions", {
      id: `${id}-description`,
      user_id: userId,
      job_id: id,
      description_text: fullPostingText,
      job_summary: String(
        result.job_summary || parsedBrief.role_about_short || "",
      ),
      responsibilities:
        arrayFromUnknown(parsedBrief.main_responsibilities).length
          ? arrayFromUnknown(parsedBrief.main_responsibilities)
          : arrayFromUnknown(result.responsibilities),
      required_qualifications:
        arrayFromUnknown(parsedBrief.required_qualifications).length
          ? arrayFromUnknown(parsedBrief.required_qualifications)
          : arrayFromUnknown(result.required_qualifications),
      preferred_qualifications:
        arrayFromUnknown(parsedBrief.preferred_qualifications).length
          ? arrayFromUnknown(parsedBrief.preferred_qualifications)
          : arrayFromUnknown(result.preferred_qualifications),
      skills_keywords:
        arrayFromUnknown(parsedBrief.key_skills_and_keywords).length
          ? arrayFromUnknown(parsedBrief.key_skills_and_keywords)
          : arrayFromUnknown(result.skills_keywords),
      team_summary: String(
        result.team_summary || parsedBrief.team_context || "",
      ),
      source_url: sourceUrl,
      record: jobDescriptionRecord(
        result,
        fullPostingText,
        parsedBrief,
        sourceUrl,
      ),
    });
    await saveCompanyContextIfPossible(supabase, userId, result).catch(
      (error) =>
        console.warn(
          `jobcc_company_context write skipped: ${
            error instanceof Error ? error.message : String(error)
          }`,
        ),
    );
    await saveCompanySourceIfPossible(supabase, userId, result).catch((error) =>
      console.warn(
        `jobcc_company_sources write skipped: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
    );
  }
  await criticalUpsert(supabase, "jobcc_search_runs", {
    id: searchRunId,
    user_id: userId,
    search_run_id: searchRunId,
    completed_at: null,
    search_complete: false,
    record: {
      search_run_id: searchRunId,
      workflow_run_id: runId,
      jobs_found: results.length,
      requested_by: "controlled-search",
      input: redactRequest(body),
    },
  });
}

async function logModelUsage(
  supabase: SupabaseClient,
  userId: string,
  record: Record<string, unknown>,
) {
  const { error } = await supabase.from("jobcc_model_usage_logs").upsert({
    id: stableId(
      "usage",
      record.workflow_id || record.run_id || crypto.randomUUID(),
      record.action || "",
      record.model || "",
      Date.now(),
    ),
    user_id: userId,
    provider: String(record.provider || ""),
    model: String(record.model || ""),
    workflow_type: String(record.workflow_type || ""),
    cost_estimate: String(record.estimated_cost || ""),
    record,
    updated_at: new Date().toISOString(),
  }, { onConflict: "id" });
  if (error) {
    console.warn(`jobcc_model_usage_logs write skipped: ${error.message}`);
  }
}

async function criticalUpsert(
  supabase: SupabaseClient,
  table: string,
  row: Record<string, unknown>,
) {
  const { error } = await supabase.from(table).upsert(row, {
    onConflict: "id",
  });
  if (error) throw new Error(`${table} write failed: ${error.message}`);
}

async function criticalUpsertRows(
  supabase: SupabaseClient,
  table: string,
  rows: Array<Record<string, unknown>>,
) {
  if (!rows.length) throw new Error(`${table} row upsert requires rows.`);
  const { error } = await supabase.from(table).upsert(rows, {
    onConflict: "id",
  });
  if (error) throw new Error(`${table} write failed: ${error.message}`);
}

async function criticalInsertIgnoreDuplicates(
  supabase: SupabaseClient,
  table: string,
  rows: Array<Record<string, unknown>>,
) {
  const { error } = await supabase.from(table).upsert(rows, {
    onConflict: "id",
    ignoreDuplicates: true,
  });
  if (error) throw new Error(`${table} insert failed: ${error.message}`);
}

async function selectOne(
  supabase: SupabaseClient,
  table: string,
  id: string,
): Promise<unknown> {
  const { data, error } = await supabase.from(table).select("*").eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`${table} select failed: ${error.message}`);
  return data;
}

async function selectMany(
  supabase: SupabaseClient,
  table: string,
  column: string,
  value: string,
): Promise<unknown[]> {
  const { data, error } = await supabase.from(table).select("*").eq(
    column,
    value,
  ).order("created_at", { ascending: true });
  if (error) throw new Error(`${table} select failed: ${error.message}`);
  return data || [];
}

function controlledLimits(body: RequestBody) {
  const raw = body.limits || {};
  return {
    maximumEstimatedCostPerRun: moneyLimit(
      raw.maximum_estimated_cost_per_run,
      defaultCostCap(body),
    ),
    maximumActualCostPerRun: moneyLimit(
      raw.maximum_actual_cost_per_run,
      defaultCostCap(body),
    ),
    maxScoutTasks: numberLimit(raw.maximum_scout_requests_per_run, 8, 100),
    maxConcurrentScoutTasks: numberLimit(
      raw.maximum_concurrent_scout_tasks,
      3,
      6,
    ),
    maxStrategistCalls: numberLimit(raw.maximum_strategist_calls, 10, 50),
    maxWriterPackets: numberLimit(
      raw.maximum_writer_calls,
      body.include_packet_generation ? 5 : 0,
      20,
    ),
    maxCriticCalls: numberLimit(
      raw.maximum_critic_calls,
      body.include_packet_generation ? 5 : 0,
      20,
    ),
    maxFinalizerCalls: numberLimit(
      raw.maximum_finalizer_calls,
      body.include_packet_generation ? 5 : 0,
      20,
    ),
    maxSearchQueries: numberLimit(raw.maximum_search_queries, 40, 500),
    maxCandidateCardsPerCompany: numberLimit(
      raw.max_candidate_cards_per_company ??
        raw.maximum_candidate_cards_per_company,
      SOURCE_CAPTURE_MAX_CANDIDATE_CARDS,
      500,
    ),
    maxFullPostingsPerCompany: numberLimit(
      raw.max_full_postings_per_company ??
        raw.maximum_full_postings_per_company,
      SOURCE_CAPTURE_MAX_FULL_POSTINGS_PER_COMPANY,
      50,
    ),
    maxScoredJobsPerCompany: numberLimit(
      raw.max_scored_jobs_per_company ?? raw.maximum_scored_jobs_per_company,
      SOURCE_CAPTURE_MAX_SCORED_JOBS_PER_COMPANY,
      25,
    ),
    minimumListedBaseSalary: requestedListedBaseFloor(body),
    maximumProviderFailures: numberLimit(raw.maximum_provider_failures, 3, 100),
    maximumValidationFailures: numberLimit(
      raw.maximum_validation_failures,
      2,
      50,
    ),
    maximumErrorRate: decimalLimit(raw.maximum_error_rate, 0.35, 1),
    stopOnCostLimit: raw.stop_on_cost_limit !== false,
    stopOnErrorRate: raw.stop_on_error_rate !== false,
  };
}

function requestedListedBaseFloor(body: RequestBody): number {
  const raw = body.limits || {};
  const requested = raw.minimum_listed_base_salary ??
    body.compensation_target?.listed_base_minimum;
  const mode = requestedCompensationMode(body);
  if (mode !== "strict_listed_base") return 0;
  return numberLimit(
    requested,
    0,
    1_000_000,
  );
}

function requestedCompensationMode(
  body: RequestBody,
): "opportunity_target" | "strict_listed_base" | "scope_first" {
  const mode = body.compensation_target?.mode;
  if (
    mode === "opportunity_target" || mode === "strict_listed_base" ||
    mode === "scope_first"
  ) return mode;
  const raw = body.limits || {};
  const legacyFloor = Number(
    raw.minimum_listed_base_salary ??
      body.compensation_target?.listed_base_minimum ?? 0,
  );
  return legacyFloor > 0 ? "strict_listed_base" : "opportunity_target";
}

function requestedTotalCompensationTarget(body: RequestBody): number {
  return numberLimit(
    body.compensation_target?.total_compensation_target ?? 300_000,
    300_000,
    1_000_000,
  );
}

function numberLimit(
  value: unknown,
  fallback: number,
  maximum = fallback,
): number {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0
    ? Math.min(Math.floor(number), maximum)
    : fallback;
}

function moneyLimit(value: unknown, fallback: number): number {
  const number = Number(value);
  return Number.isFinite(number) && number > 0
    ? Math.min(number, 250)
    : fallback;
}

function decimalLimit(
  value: unknown,
  fallback: number,
  maximum: number,
): number {
  const number = Number(value);
  return Number.isFinite(number) && number > 0
    ? Math.min(number, maximum)
    : fallback;
}

function defaultCostCap(body: RequestBody): number {
  if (body.test_phase === "provider-smoke") return 2;
  if (body.test_phase === "waymo-regression") return 5;
  if (body.test_phase === "micro-sweep") return 5;
  return Number(body.include_packet_generation ? 5 : 5);
}

function buildSearchTasks(
  runId: string,
  searchRunId: string,
  body: RequestBody,
  maxTasks: number,
): Array<Record<string, unknown>> {
  const companies = requestedCompanies(body).slice(0, maxTasks);
  const roleFamilies = requestedRoleFamilies(body);
  const compensationMode = requestedCompensationMode(body);
  const totalCompensationTarget = requestedTotalCompensationTarget(body);
  const minimumListedBaseSalary = requestedListedBaseFloor(body);
  const compensationConstraints = compensationMode === "strict_listed_base"
    ? `For roles with listed base pay, the lowest listed base must be at least $${
      minimumListedBaseSalary.toLocaleString("en-US")
    }. Keep senior or executive roles with no listed compensation only as high-upside needs-verification candidates; never treat missing pay as low pay.`
    : compensationMode === "scope_first"
    ? "Do not exclude a role because pay is missing or below a target. Capture senior, high-scope operating roles first, then verify base, bonus, equity, and level."
    : `Treat $${
      totalCompensationTarget.toLocaleString("en-US")
    } as a total-opportunity target, not a hard listed-base gate. Keep senior roles with no disclosed pay and roles whose bonus, equity, company stage, title, authority, or scope could plausibly clear the target.`;
  return companies.map((company, index) => ({
    id: stableId("search-task", searchRunId, index, company),
    run_id: runId,
    search_run_id: searchRunId,
    company_cluster: [company],
    role_family_cluster: roleFamilies,
    location_constraints:
      "Prefer Phoenix / Tempe / Scottsdale on-site or hybrid, Arizona hybrid, or U.S. remote available to Arizona residents. Do not exclude relocation-required roles automatically; classify and score relocation friction, and only advance weak-location roles when compensation, level, control, scope, or upside clears a higher threshold.",
    compensation_constraints: compensationConstraints,
    minimum_listed_base_salary: minimumListedBaseSalary,
    official_career_urls: officialUrlsForCompany(body, company),
    query_text: `${company} ${
      roleFamilies.join(" OR ")
    } jobs official careers remote Arizona${
      minimumListedBaseSalary ? ` base salary ${minimumListedBaseSalary}` : ""
    }`,
    status: "queued",
    attempts: 0,
    max_attempts: 2,
    source_coverage: {},
    result_count: 0,
    idempotency_key: stableId(
      "search-task-idem",
      searchRunId,
      company,
      roleFamilies.join("|"),
    ),
    record: {
      controlled_mini_sweep: true,
      task_index: index,
      compensation_mode: compensationMode,
      total_compensation_target: totalCompensationTarget,
    },
  }));
}

function officialUrlsForCompany(body: RequestBody, company: string): string[] {
  if (Array.isArray(body.official_career_urls)) {
    return body.official_career_urls.map(String).filter(Boolean);
  }
  if (
    body.official_career_urls && typeof body.official_career_urls === "object"
  ) {
    const urls =
      (body.official_career_urls as Record<string, string[]>)[company] ||
      (body.official_career_urls as Record<string, string[]>)[
        company.toLowerCase()
      ];
    if (Array.isArray(urls) && urls.length) {
      return urls.map(String).filter(Boolean);
    }
  }
  return officialUrlsForCompanyFromDirectory(company);
}

function officialUrlsForCompanyFromDirectory(company: string): string[] {
  return DEFAULT_OFFICIAL_CAREER_URLS[normalizeKey(company)] || [];
}

function initialCoverage(
  runId: string,
  searchRunId: string,
  tasks: Array<Record<string, unknown>>,
  body: RequestBody,
): Record<string, unknown> {
  const requested = requestedCompanies(body).slice(0, tasks.length);
  const roles = requestedRoleFamilies(body);
  return {
    id: searchRunId,
    run_id: runId,
    search_run_id: searchRunId,
    companies_requested: requested,
    companies_searched: [],
    companies_failed: [],
    companies_not_searched: requested,
    role_families_requested: roles,
    role_families_searched: [],
    role_families_failed: [],
    sources_used: [],
    official_sources_checked: 0,
    linkedin_sources_checked: 0,
    aggregator_sources_checked: 0,
    jobs_found: 0,
    jobs_verified: 0,
    jobs_rejected: 0,
    duplicates_removed: 0,
    jobs_needing_verification: 0,
    search_queries_executed: 0,
    search_complete: false,
    coverage_percent: 0,
    coverage_notes:
      `${tasks.length} source-first tasks queued. Cards, screened-out and deferred roles, reconciled new/changed/unchanged/suppressed identities, within-run duplicates, and failures will be accounted separately.`,
    record: {
      queued_tasks: tasks.length,
      candidate_cards_seen: 0,
      postings_evaluated: 0,
      identities_observed: 0,
      screened_out_roles: 0,
      compensation_screened_out: 0,
      compensation_screened_out_below_floor: 0,
      compensation_screened_out_missing_comp: 0,
      deferred_due_to_full_posting_cap: 0,
      new_roles: 0,
      changed_roles: 0,
      unchanged_roles: 0,
      suppressed_roles: 0,
      imported_roles: 0,
      failed_tasks: 0,
      source_failures: 0,
    },
  };
}

function controlledSearchInstructions(task: Record<string, unknown>): string {
  const company = String(arrayFromUnknown(task.company_cluster)[0] || "");
  const officialUrls = uniqueStrings([
    ...arrayFromUnknown(task.official_career_urls),
    ...officialUrlsForCompanyFromDirectory(company),
  ]);
  return [
    "Controlled mini-sweep task.",
    "Search official company career pages first. Use LinkedIn only as a source target, not by scraping login-gated pages.",
    officialUrls.length
      ? `Official source targets to inspect first: ${officialUrls.join(", ")}`
      : "No official source target is preloaded for this company; discover the official career or ATS source before using other sources.",
    "Use aggregators only when they lead to official or LinkedIn postings.",
    "Use staged search: capture official list/cards, extract cheap card fields, screen by title/department/location/seniority/keywords, then full-capture likely fits or high-upside borderline roles only.",
    String(task.compensation_constraints || ""),
    Number(task.minimum_listed_base_salary || 0) > 0
      ? "For a listed-base filter, compare the requested floor with the LOW END of the trusted base-salary range. Do not substitute total compensation, bonus, equity, job ids, or unrelated numbers."
      : "No explicit listed-base floor was requested for this task.",
    "Exclude junior, hourly, branch/store/restaurant, generic sales, pure engineering, pure finance/accounting, and below senior-manager roles unless exceptional high-comp upside.",
    "Do not reject senior or executive roles because salary is missing. Mark compensation_status not_listed or needs_verification and compensation_verdict unknown_but_senior_enough_to_review when the title, company, and scope justify review.",
    "Do not exclude relocation-required roles automatically; include them with relocation friction and mark borderline roles needs manual review.",
    "Never mark the entire search complete for a single task.",
    `Task: ${JSON.stringify(task)}`,
  ].join("\n");
}

function qualifiesForStrategist(result: Record<string, unknown>): boolean {
  if (result.seniority_plausible === false) return false;
  if (
    !["official", "linkedin"].includes(String(result.source_type || "")) &&
    Number(result.verification_confidence || 0) < 0.75
  ) return false;
  const maxComp = Number(result.estimated_total_comp_max || 0);
  const adjustment = Number(result.relocation_threshold_adjustment || 0);
  const requiredComp = 250000 + (adjustment * 10000);
  const seniorNoSalary = !maxComp && (
    String(result.compensation_verdict || "") ===
      "unknown_but_senior_enough_to_review" ||
    (seniorRoleSignal(
      [
        result.company,
        result.role_title,
        result.team,
        result.department,
        result.raw_posting_text,
      ].join(" "),
    ) &&
      targetOperationsSignal(
        [
          result.role_title,
          result.team,
          result.department,
          result.raw_posting_text,
        ].join(" "),
      ))
  );
  return maxComp >= requiredComp || seniorNoSalary ||
    /400K|250K|high upside|equity/i.test(
      String(result.compensation_bucket || result.estimated_comp_band || ""),
    );
}

function jobFromSearchResult(
  result: Record<string, unknown>,
): Record<string, unknown> {
  const sourceUrl = primarySourceUrl(result);
  const id = stableId("job", result.company, result.role_title, sourceUrl);
  return {
    id,
    company: result.company || "",
    role_title: result.role_title || "",
    location: result.location || "",
    source_url: sourceUrl,
    official_source_url: result.official_source_url || "",
    ats_source_url: result.ats_source_url || "",
    linkedin_url: result.linkedin_url || result.linkedin_job_link || "",
    job_description_text: result.job_description_text || "",
    raw_posting_text: result.raw_posting_text || result.job_description_text ||
      "",
    parsed_job_brief: parsedJobBriefFromRecord(result),
    responsibilities: result.responsibilities || [],
    required_qualifications: result.required_qualifications || [],
    preferred_qualifications: result.preferred_qualifications || [],
    skills_keywords: result.skills_keywords || [],
    relocation_required: Boolean(result.relocation_required),
    arizona_remote_ok: Boolean(result.arizona_remote_ok),
    location_category: result.location_category ||
      classifyLocationCategory(result),
    region_preference_score: result.region_preference_score ??
      regionPreferenceScore(result),
    relocation_friction_score: result.relocation_friction_score ??
      relocationFrictionScore(result),
    relocation_threshold_adjustment: result.relocation_threshold_adjustment ??
      relocationThresholdAdjustment(result),
    compensation_adjusted_for_location:
      result.compensation_adjusted_for_location || "",
    family_lifestyle_considerations: result.family_lifestyle_considerations ||
      "",
    city_region_notes: result.city_region_notes || "",
    location_concerns: Array.isArray(result.location_concerns)
      ? result.location_concerns
      : [],
    relocation_verdict: result.relocation_verdict || relocationVerdict(result),
    source_type: result.source_type || "",
    active_status: result.active_status || "",
  };
}

function classifyLocationCategory(job: Record<string, unknown>): string {
  const text = `${job.location || ""} ${job.work_style || ""} ${
    job.remote_eligibility || ""
  }`.toLowerCase();
  if (/travel[- ]?heavy|heavy travel|75% travel|50% travel/.test(text)) {
    return "travel-heavy";
  }
  if (/phoenix|scottsdale|tempe/.test(text)) {
    return "Phoenix / Scottsdale / Tempe";
  }
  if (/arizona|az/.test(text) && /hybrid|on.?site|onsite/.test(text)) {
    return "Arizona hybrid";
  }
  if (
    /remote/.test(text) &&
    /(united states|u\.s\.|\bus\W|usa|anywhere)/.test(text)
  ) return "U.S. remote";
  if (
    job.relocation_required === true ||
    /relocation required|must relocate/.test(text)
  ) return "relocation required";
  if (/relocation optional|relocation assistance|open to relocate/.test(text)) {
    return "relocation optional";
  }
  return "unknown location flexibility";
}

function regionPreferenceScore(job: Record<string, unknown>): number {
  const category = classifyLocationCategory(job);
  const text = `${job.location || ""} ${job.work_style || ""}`.toLowerCase();
  if (
    ["Phoenix / Scottsdale / Tempe", "Arizona hybrid", "U.S. remote"].includes(
      category,
    )
  ) return 90;
  if (
    /new york|new jersey|connecticut|san francisco|los angeles|san jose|california|ca\b/
      .test(text)
  ) return -35;
  if (
    /chicago|austin|seattle|denver|boston|washington|dc|miami|dallas|atlanta|nashville/
      .test(text)
  ) return 10;
  if (
    /omaha|des moines|wichita|topeka|fargo|sioux|little rock|tulsa/.test(text)
  ) return -55;
  if (category === "relocation required") return -45;
  if (category === "travel-heavy") return -35;
  return -10;
}

function relocationFrictionScore(job: Record<string, unknown>): number {
  const category = classifyLocationCategory(job);
  const preference = regionPreferenceScore(job);
  if (
    ["Phoenix / Scottsdale / Tempe", "Arizona hybrid", "U.S. remote"].includes(
      category,
    )
  ) return 5;
  if (category === "unknown location flexibility") return 45;
  if (category === "travel-heavy") return 65;
  if (category === "relocation required") {
    return Math.max(
      60,
      Math.min(95, 65 + Math.abs(Math.min(preference, 0)) / 2),
    );
  }
  return Math.max(25, Math.min(80, 45 + Math.abs(Math.min(preference, 0)) / 3));
}

function relocationThresholdAdjustment(job: Record<string, unknown>): number {
  return Math.round(Math.min(40, relocationFrictionScore(job) / 3));
}

function relocationVerdict(job: Record<string, unknown>): string {
  const friction = relocationFrictionScore(job);
  if (friction <= 10) return "strong fit, no relocation issue";
  if (friction <= 35) return "viable, review normally";
  if (friction <= 60) return "possible, but needs stronger comp/scope";
  if (friction <= 82) return "high-friction, only advance if exceptional";
  return "likely not worth relocation";
}

function shouldUseGeminiGrounding(action: string): boolean {
  return [
    "gemini-scout",
    "gemini-search-extract",
    "run-market-sweep",
    "start-controlled-search",
    "search-worker",
    "verify-job-source",
  ].includes(action);
}

function parseModelJson(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(
    /\s*```$/i,
    "",
  );
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

const RESUME_QUALITY_COMPONENT_FIELDS = [
  "factual_integrity_score",
  "channel_structure_score",
  "direct_role_evidence_score",
  "executive_operating_proof_score",
  "human_scan_channel_fit_score",
] as const;

const RESUME_QUALITY_COMPONENT_MAXIMUMS: Record<
  typeof RESUME_QUALITY_COMPONENT_FIELDS[number],
  number
> = {
  factual_integrity_score: 20,
  channel_structure_score: 15,
  direct_role_evidence_score: 35,
  executive_operating_proof_score: 15,
  human_scan_channel_fit_score: 15,
};

const EVIDENCE_BACKED_RESUME_QUALITY_COMPONENTS = new Set([
  "factual_integrity_score",
  "direct_role_evidence_score",
  "executive_operating_proof_score",
]);

const POSTING_BACKED_RESUME_QUALITY_COMPONENTS = new Set([
  "direct_role_evidence_score",
  "executive_operating_proof_score",
]);

const DOCUMENT_QUALITY_COMPONENT_FIELDS = [
  "factual_integrity_score",
  "role_specificity_score",
  "channel_structure_score",
  "evidence_strength_score",
  "human_scan_channel_fit_score",
] as const;

const QUALIFICATION_ASSESSMENT_FIELDS = [
  "qualification_match_score",
  "qualification_strength_score",
  "must_have_coverage_score",
  "qualification_gap_risk_score",
  "qualification_strengths",
  "transferable_qualifications",
  "qualification_gaps",
  "qualification_unknowns",
  "qualification_summary",
] as const;

export function strategistQualificationAssessment(
  strategist: Record<string, unknown>,
): Record<string, unknown> {
  const assessment: Record<string, unknown> = {
    qualification_source: "openai_strategist",
  };
  for (const field of QUALIFICATION_ASSESSMENT_FIELDS) {
    if (strategist[field] !== undefined) assessment[field] = strategist[field];
  }
  return assessment;
}

function qualityRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function validateDocumentQualityAssessment(
  value: Record<string, unknown>,
): string[] {
  const errors = validateAgainstSchema(
    value,
    schemaForAction("gemini-document-quality-check"),
  );
  const calculated = DOCUMENT_QUALITY_COMPONENT_FIELDS.reduce(
    (sum, field) => sum + Number(value[field] || 0),
    0,
  );
  const reported = Number(value.total_score);
  if (!Number.isFinite(reported) || Math.abs(calculated - reported) > 0.001) {
    errors.push(
      `$.total_score must equal the five document-quality rubric components (${calculated}).`,
    );
  }
  return uniqueStrings(errors);
}

export function normalizeDocumentQualityAssessment(
  value: Record<string, unknown>,
): Record<string, unknown> {
  const validationErrors = validateDocumentQualityAssessment(value);
  if (validationErrors.length) {
    throw new ValidationFailure(
      "Targeted document quality assessment failed deterministic validation.",
      JSON.stringify(value),
      validationErrors,
    );
  }
  const factualIntegrityGate =
    String(value.factual_integrity_gate || "fail") ===
        "pass"
      ? "pass"
      : "fail";
  const totalScore = Number(value.total_score || 0);
  const blockingFindings = arrayFromUnknown(value.blocking_findings);
  const requiredRevisions = arrayFromUnknown(value.required_revisions);
  const qualityGate = factualIntegrityGate === "fail" ||
      blockingFindings.length
    ? "block"
    : totalScore >= FINAL_ROLE_KIT_QUALITY_THRESHOLD &&
        !requiredRevisions.length
    ? "pass"
    : "revise";
  return {
    ...value,
    score_threshold: FINAL_ROLE_KIT_QUALITY_THRESHOLD,
    factual_integrity_gate: factualIntegrityGate,
    quality_gate: qualityGate,
    blocking_findings: blockingFindings,
    required_revisions: requiredRevisions,
    approval_status: qualityGate === "pass"
      ? "ready_for_review"
      : "needs_manual_review",
  };
}

export function validateFinalRoleKitQualityAssessment(
  value: Record<string, unknown>,
  auditContext: FinalQualityAuditContext = {},
): string[] {
  const errors = validateAgainstSchema(
    value,
    schemaForAction("gemini-final-quality-check"),
  );
  for (const documentType of ["ats_resume", "executive_resume"] as const) {
    const scorecard = qualityRecord(value[documentType]);
    const calculated = RESUME_QUALITY_COMPONENT_FIELDS.reduce(
      (sum, field) => sum + Number(scorecard[field] || 0),
      0,
    );
    const reported = Number(scorecard.total_score);
    if (!Number.isFinite(reported) || Math.abs(calculated - reported) > 0.001) {
      errors.push(
        `$.${documentType}.total_score must equal the five rubric components (${calculated}).`,
      );
    }
    errors.push(
      ...validateResumeQualityRubricEvidence(
        scorecard,
        documentType,
        auditContext,
      ),
    );
  }
  return uniqueStrings(errors);
}

function normalizeAuditText(value: unknown): string {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function validateResumeQualityRubricEvidence(
  scorecard: Record<string, unknown>,
  documentType: "ats_resume" | "executive_resume",
  auditContext: FinalQualityAuditContext,
): string[] {
  const errors: string[] = [];
  const rawRows = Array.isArray(scorecard.rubric_evidence)
    ? scorecard.rubric_evidence
    : [];
  const rows = rawRows.map(qualityRecord);
  const finalizer = auditContext.finalizer || {};
  const resumeText = normalizeAuditText(finalizer[documentType]);
  const postingText = finalQualityPostingAuditText(
    auditContext.verifiedJob || {},
  );
  const allowedFactIds = new Set(
    (auditContext.approvedCareerFacts || []).map((fact) =>
      String(fact.fact_id || fact.id || "").trim()
    ).filter(Boolean),
  );
  const validateResumeQuotes = Object.keys(finalizer).length > 0;
  const validatePostingQuotes = postingText.length > 0;
  const validateFactIds = Array.isArray(auditContext.approvedCareerFacts);

  for (const component of RESUME_QUALITY_COMPONENT_FIELDS) {
    const matches = rows.filter((row) =>
      String(row.component || "") === component
    );
    if (matches.length !== 1) {
      errors.push(
        `$.${documentType}.rubric_evidence must contain exactly one ${component} row.`,
      );
      continue;
    }
    const row = matches[0];
    const points = Number(row.points_awarded);
    const score = Number(scorecard[component]);
    const maximum = RESUME_QUALITY_COMPONENT_MAXIMUMS[component];
    if (!Number.isFinite(points) || points < 0 || points > maximum) {
      errors.push(
        `$.${documentType}.rubric_evidence[${component}].points_awarded must be between 0 and ${maximum}.`,
      );
    }
    if (!Number.isFinite(points) || Math.abs(points - score) > 0.001) {
      errors.push(
        `$.${documentType}.rubric_evidence[${component}].points_awarded must equal $.${documentType}.${component} (${score}).`,
      );
    }
    const supportingFactIds = arrayFromUnknown(row.supporting_fact_ids);
    if (
      EVIDENCE_BACKED_RESUME_QUALITY_COMPONENTS.has(component) &&
      points > 0 && !supportingFactIds.length
    ) {
      errors.push(
        `$.${documentType}.rubric_evidence[${component}] must cite at least one supporting fact id when points are awarded.`,
      );
    }
    const postingQuotes = arrayFromUnknown(row.posting_quotes);
    if (
      POSTING_BACKED_RESUME_QUALITY_COMPONENTS.has(component) && points > 0 &&
      !postingQuotes.length
    ) {
      errors.push(
        `$.${documentType}.rubric_evidence[${component}] must cite at least one exact posting quote when points are awarded.`,
      );
    }
    if (validateFactIds) {
      for (const factId of supportingFactIds) {
        if (!allowedFactIds.has(factId)) {
          errors.push(
            `$.${documentType}.rubric_evidence[${component}] cites fact id ${factId} that is not in the approved Career Canon audit set.`,
          );
        }
      }
    }
    if (validateResumeQuotes) {
      for (const quote of arrayFromUnknown(row.resume_quotes)) {
        if (!resumeText.includes(normalizeAuditText(quote))) {
          errors.push(
            `$.${documentType}.rubric_evidence[${component}] quote is not present in the final document: ${quote}`,
          );
        }
      }
    }
    if (validatePostingQuotes) {
      for (const quote of postingQuotes) {
        if (!postingText.includes(normalizeAuditText(quote))) {
          errors.push(
            `$.${documentType}.rubric_evidence[${component}] posting quote is not present in the verified posting: ${quote}`,
          );
        }
      }
    }
  }
  if (rows.length !== RESUME_QUALITY_COMPONENT_FIELDS.length) {
    errors.push(
      `$.${documentType}.rubric_evidence must contain exactly ${RESUME_QUALITY_COMPONENT_FIELDS.length} rows.`,
    );
  }
  return errors;
}

function finalQualityPostingAuditText(
  verifiedJob: Record<string, unknown>,
): string {
  const segments = [
    verifiedJob.raw_posting_text,
    verifiedJob.job_description_text_full,
    verifiedJob.full_job_description,
    verifiedJob.job_description_text,
    verifiedJob.description_text,
    verifiedJob.posting_text,
  ].map((value) => String(value || "").trim()).filter(Boolean);
  const parsedBrief = qualityRecord(verifiedJob.parsed_job_brief);
  if (Object.keys(parsedBrief).length) {
    segments.push(JSON.stringify(parsedBrief));
  }
  return normalizeAuditText(segments.join(" "));
}

function normalizedResumeQualityScorecard(
  raw: Record<string, unknown>,
  documentType: "ats_resume" | "executive_resume",
): ResumeQualityScorecard {
  const factualIntegrityGate = String(raw.factual_integrity_gate || "fail") ===
      "pass"
    ? "pass"
    : "fail";
  const totalScore = Number(raw.total_score || 0);
  const qualityVerdict = factualIntegrityGate === "fail"
    ? "block"
    : totalScore >= FINAL_ROLE_KIT_QUALITY_THRESHOLD
    ? "pass"
    : "revise";
  return {
    document_type: documentType,
    factual_integrity_score: Number(raw.factual_integrity_score || 0),
    channel_structure_score: Number(raw.channel_structure_score || 0),
    direct_role_evidence_score: Number(raw.direct_role_evidence_score || 0),
    executive_operating_proof_score: Number(
      raw.executive_operating_proof_score || 0,
    ),
    human_scan_channel_fit_score: Number(
      raw.human_scan_channel_fit_score || 0,
    ),
    total_score: totalScore,
    score_threshold: FINAL_ROLE_KIT_QUALITY_THRESHOLD,
    factual_integrity_gate: factualIntegrityGate,
    quality_verdict: qualityVerdict,
    rubric_evidence: Array.isArray(raw.rubric_evidence)
      ? raw.rubric_evidence.map((row) => {
        const record = qualityRecord(row);
        return {
          component: String(
            record.component || "",
          ) as ResumeQualityScorecard["rubric_evidence"][number]["component"],
          posting_quotes: arrayFromUnknown(record.posting_quotes),
          resume_quotes: arrayFromUnknown(record.resume_quotes),
          supporting_fact_ids: arrayFromUnknown(record.supporting_fact_ids),
          points_awarded: Number(record.points_awarded || 0),
          rationale: String(record.rationale || ""),
        };
      })
      : [],
    strengths: arrayFromUnknown(raw.strengths),
    findings: arrayFromUnknown(raw.findings),
    required_revisions: arrayFromUnknown(raw.required_revisions),
  };
}

export function normalizeFinalRoleKitQualityAssessment(
  value: Record<string, unknown>,
  auditContext: FinalQualityAuditContext = {},
): FinalRoleKitQualityAssessment {
  const validationErrors = validateFinalRoleKitQualityAssessment(
    value,
    auditContext,
  );
  if (validationErrors.length) {
    throw new ValidationFailure(
      "Final role-kit quality assessment failed deterministic validation.",
      JSON.stringify(value),
      validationErrors,
    );
  }
  const atsResume = normalizedResumeQualityScorecard(
    qualityRecord(value.ats_resume),
    "ats_resume",
  );
  const executiveResume = normalizedResumeQualityScorecard(
    qualityRecord(value.executive_resume),
    "executive_resume",
  );
  const supportingMaterials = qualityRecord(value.supporting_materials);
  const supportingGate = ["pass", "revise", "block"].includes(
      String(supportingMaterials.quality_gate || ""),
    )
    ? String(supportingMaterials.quality_gate)
    : "revise";
  const blockingFindings = arrayFromUnknown(value.blocking_findings);
  const requiredRevisions = uniqueStrings([
    ...arrayFromUnknown(value.required_revisions),
    ...atsResume.required_revisions,
    ...executiveResume.required_revisions,
    ...arrayFromUnknown(supportingMaterials.required_revisions),
  ]);
  const factualIntegrityGate = atsResume.factual_integrity_gate === "pass" &&
      executiveResume.factual_integrity_gate === "pass"
    ? "pass"
    : "fail";
  const qualityGate = factualIntegrityGate === "fail" ||
      supportingGate === "block" || blockingFindings.length
    ? "block"
    : atsResume.quality_verdict === "pass" &&
        executiveResume.quality_verdict === "pass" &&
        supportingGate === "pass" && !requiredRevisions.length
    ? "pass"
    : "revise";
  const normalized: FinalRoleKitQualityAssessment = {
    ...value,
    ats_resume: atsResume,
    executive_resume: executiveResume,
    supporting_materials: {
      ...supportingMaterials,
      quality_gate: supportingGate,
    },
    score_threshold: FINAL_ROLE_KIT_QUALITY_THRESHOLD,
    factual_integrity_gate: factualIntegrityGate,
    quality_gate: qualityGate,
    blocking_findings: blockingFindings,
    required_revisions: requiredRevisions,
    approval_status: qualityGate === "pass"
      ? "ready_for_review"
      : "needs_manual_review",
  };
  return normalized;
}

function qualityReviewBlockers(
  assessment: Record<string, unknown>,
  finalizer: Record<string, unknown>,
): string[] {
  const blockers = uniqueStrings([
    ...arrayFromUnknown(assessment.blocking_findings),
    ...arrayFromUnknown(assessment.required_revisions),
    ...qualityFlags(finalizer),
  ]);
  if (!blockers.length && String(assessment.quality_gate || "") !== "pass") {
    blockers.push(
      "Independent quality review did not pass; revise the role kit before employer-use approval.",
    );
  }
  return blockers;
}

export function finalRoleKitReleaseReady(
  assessment: Record<string, unknown> | null | undefined,
  approvalStatus: string,
): boolean {
  return String(assessment?.quality_gate || "") === "pass" &&
    approvalStatus === "ready_for_review";
}

function outputNeedsManualReview(output: Record<string, unknown>): boolean {
  return qualityFlags(output).length > 0 ||
    String(output.approval_status || "") === "needs_manual_review";
}

function blockingClaims(output: Record<string, unknown>): string[] {
  const flags = [
    ...arrayField(output, "unsupported_claims").map((item) =>
      `Unsupported claim: ${item}`
    ),
    ...arrayField(output, "prohibited_fact_matches").map((item) =>
      `Prohibited fact match: ${item}`
    ),
  ];
  return flags;
}

function qualityFlags(output: Record<string, unknown>): string[] {
  return [
    ...arrayField(output, "unresolved_issues").map((item) =>
      `Unresolved evidence issue: ${item}`
    ),
    ...arrayField(output, "unsupported_claims").map((item) =>
      `Unsupported claim: ${item}`
    ),
    ...arrayField(output, "prohibited_fact_matches").map((item) =>
      `Prohibited fact match: ${item}`
    ),
    ...arrayField(output, "needs_review_fact_matches").map((item) =>
      `Needs-review fact match: ${item}`
    ),
  ];
}

function arrayField(output: Record<string, unknown>, key: string): string[] {
  const value = output[key];
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function redactRequest(body: RequestBody): Record<string, unknown> {
  return {
    workflow_type: body.workflow_type,
    job: body.job
      ? {
        id: body.job.id,
        company: body.job.company,
        role_title: body.job.role_title,
        source_url: body.job.source_url,
      }
      : null,
    jobs_count: Array.isArray(body.jobs) ? body.jobs.length : 0,
    resumeBank: Boolean(body.resumeBank),
    careerFacts_count: Array.isArray(body.careerFacts)
      ? body.careerFacts.length
      : 0,
    sourceDocuments_count: Array.isArray(body.sourceDocuments)
      ? body.sourceDocuments.length
      : 0,
    resumeLanes_count: Array.isArray(body.resumeLanes)
      ? body.resumeLanes.length
      : 0,
    notes: body.notes || "",
  };
}

function openAiRole(action: string): string {
  if (/writer|packet|cover|outreach|interview|decision|revise/.test(action)) {
    return "OpenAI Writer";
  }
  if (/finalizer/.test(action)) return "OpenAI Finalizer";
  return "OpenAI Strategist";
}

function geminiRole(action: string): string {
  if (
    action === "gemini-final-quality-check" ||
    action === "gemini-document-quality-check"
  ) {
    return "Gemini Quality Auditor";
  }
  if (/critique/.test(action)) return "Gemini Critic";
  return "Gemini Scout";
}

function extractOpenAiText(response: Record<string, unknown>): string {
  if (typeof response.output_text === "string") return response.output_text;
  const output = Array.isArray(response.output) ? response.output : [];
  return output.flatMap((item) => {
    const content = item && typeof item === "object" && "content" in item
      ? (item as { content?: unknown }).content
      : [];
    return Array.isArray(content)
      ? content.map((part) => {
        if (part && typeof part === "object" && "text" in part) {
          return String((part as { text?: unknown }).text || "");
        }
        return "";
      })
      : [];
  }).join("\n").trim();
}

function extractGeminiText(response: Record<string, unknown>): string {
  const candidates = Array.isArray(response.candidates)
    ? response.candidates
    : [];
  return candidates.flatMap((candidate) => {
    const content =
      candidate && typeof candidate === "object" && "content" in candidate
        ? (candidate as { content?: { parts?: unknown } }).content
        : null;
    const parts = content && Array.isArray(content.parts) ? content.parts : [];
    return parts.map((part) =>
      part && typeof part === "object" && "text" in part
        ? String((part as { text?: unknown }).text || "")
        : ""
    );
  }).join("\n").trim();
}

function extractGeminiGrounding(
  response: Record<string, unknown>,
): Record<string, unknown> {
  const candidate = Array.isArray(response.candidates)
    ? response.candidates[0] as Record<string, unknown> | undefined
    : undefined;
  const grounding = candidate && typeof candidate === "object"
    ? candidate.groundingMetadata as Record<string, unknown> | undefined
    : undefined;
  const urlContext = candidate && typeof candidate === "object"
    ? candidate.urlContextMetadata as Record<string, unknown> | undefined
    : undefined;
  return {
    webSearchQueries: Array.isArray(grounding?.webSearchQueries)
      ? grounding?.webSearchQueries
      : [],
    groundingChunks: Array.isArray(grounding?.groundingChunks)
      ? grounding?.groundingChunks
      : [],
    groundingSupports: Array.isArray(grounding?.groundingSupports)
      ? grounding?.groundingSupports
      : [],
    urlContextMetadata: urlContext || null,
  };
}

function usageFromOpenAi(
  response: Record<string, unknown>,
): Record<string, unknown> {
  return typeof response.usage === "object" && response.usage
    ? response.usage as Record<string, unknown>
    : {};
}

function usageFromGemini(
  response: Record<string, unknown>,
): Record<string, unknown> {
  return typeof response.usageMetadata === "object" && response.usageMetadata
    ? response.usageMetadata as Record<string, unknown>
    : {};
}

async function safeJson(req: Request): Promise<RequestBody> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

function json(req: Request, data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

function corsHeaders(req: Request): Record<string, string> {
  const configured = (Deno.env.get("JOBCC_ALLOWED_CORS_ORIGINS") || "").split(
    ",",
  ).map((item: string) => item.trim()).filter(Boolean);
  const allowed = configured.length
    ? new Set(configured)
    : ALLOWED_CORS_ORIGINS;
  const origin = req.headers.get("Origin") || "";
  const allowOrigin = origin && allowed.has(origin)
    ? origin
    : "http://127.0.0.1:8765";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Vary": "Origin",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function safeSchemaName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 60) ||
    "job_command_center_output";
}

function jobIdFromBody(body: RequestBody): string | null {
  return typeof body.job?.id === "string" && body.job.id ? body.job.id : null;
}

function inputVersion(body: RequestBody): string {
  return stableHash(JSON.stringify({
    job_id: jobIdFromBody(body),
    search_run_id: body.search_run_id || "",
    source_text_length: String(body.sourceText || body.prompt || "").length,
    notes: body.notes || "",
  }));
}

function stableId(...parts: unknown[]): string {
  return `jobcc-${
    stableHash(parts.map((part) => String(part ?? "")).join("|"))
  }`;
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function normalizePostingForHash(text: string): string {
  return String(text || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function sourceUrlFromRecord(record: Record<string, unknown>): string {
  return String(
    record.official_source_url || record.ats_source_url ||
      record.posting_source_url || record.source_url ||
      record.application_link || record.company_careers_link ||
      record.linkedin_url || "",
  );
}

function otherDetailsFromRecord(
  record: Record<string, unknown>,
  text: string,
): Array<Record<string, unknown>> {
  const existing = Array.isArray(record.other_details)
    ? record.other_details as Array<Record<string, unknown>>
    : [];
  if (existing.length) return existing;
  const details: Array<Record<string, unknown>> = [];
  const brief =
    (record.parsed_job_brief && typeof record.parsed_job_brief === "object" &&
        !Array.isArray(record.parsed_job_brief))
      ? record.parsed_job_brief as Record<string, unknown>
      : {};
  const comp = String(
    record.comp_notes || record.compensation_summary ||
      brief.compensation_summary || "",
  );
  const travel = /travel/i.test(text) ? sentenceContaining(text, "travel") : "";
  const language = /german|french|spanish|language/i.test(text)
    ? sentenceContaining(text, "German") ||
      sentenceContaining(text, "French") ||
      "Posting references language requirements."
    : "";
  const analytics = /sql|dashboard|metric|kpi/i.test(text)
    ? sentenceContaining(text, "SQL") || sentenceContaining(text, "metric") ||
      "Posting references analytics, dashboards, metrics, or KPIs."
    : "";
  if (comp) {
    details.push(otherDetail("Compensation", comp, "Compensation", "high"));
  }
  if (travel) details.push(otherDetail("Travel", travel, "Location", "medium"));
  if (language) {
    details.push(
      otherDetail("Language requirement", language, "Requirement", "high"),
    );
  }
  if (analytics) {
    details.push(
      otherDetail("Analytics / metrics detail", analytics, "Skill", "medium"),
    );
  }
  return details;
}

function otherDetail(
  label: string,
  detail: string,
  category: string,
  importance: string,
): Record<string, unknown> {
  return {
    detail_id: `detail-${normalizeKey(label)}`,
    category,
    label,
    detail,
    importance,
    extracted_from: "official_job_posting",
    source_section: category,
    evidence_text: detail.slice(0, 420),
    confidence: 0.82,
    needs_verification: /needs verification|unknown|not listed/i.test(detail),
    possible_future_field: "",
  };
}

function fieldProvenanceFromRecord(
  record: Record<string, unknown>,
  sourceUrl: string,
): Record<string, unknown> {
  const existing = record.field_provenance;
  if (existing && typeof existing === "object" && !Array.isArray(existing)) {
    return existing as Record<string, unknown>;
  }
  const make = (field: string, value: unknown) => ({
    value: value ?? "",
    extracted_from: "official_job_posting",
    source_url: sourceUrl || null,
    source_section: field,
    evidence_text: String(value ?? "").slice(0, 420),
    confidence: sourceUrl ? 0.9 : 0.65,
    needs_verification: !sourceUrl,
    notes: sourceUrl
      ? "Captured from verified official or ATS job page."
      : "Source URL missing; review manually.",
  });
  const brief =
    (record.parsed_job_brief && typeof record.parsed_job_brief === "object" &&
        !Array.isArray(record.parsed_job_brief))
      ? record.parsed_job_brief as Record<string, unknown>
      : {};
  return {
    role_title: make("role_title", record.role_title),
    location: make("location", record.location),
    work_style: make("work_style", record.work_style),
    compensation_summary: make(
      "compensation_summary",
      record.comp_notes || brief.compensation_summary,
    ),
    role_mandate: make("role_mandate", brief.role_mandate),
    required_qualifications: make(
      "required_qualifications",
      arrayFromUnknown(record.required_qualifications).length
        ? arrayFromUnknown(record.required_qualifications)
        : arrayFromUnknown(brief.required_qualifications).join("; "),
    ),
  };
}

function sourceConflictsFromRecord(
  record: Record<string, unknown>,
  text: string,
): Array<Record<string, unknown>> {
  const existing = Array.isArray(record.source_conflicts)
    ? record.source_conflicts as Array<Record<string, unknown>>
    : [];
  if (existing.length) return existing;
  const locationText = `${record.location || ""} ${
    record.work_style || ""
  } ${text}`.toLowerCase();
  if (
    (/remote/.test(locationText) &&
      /on.?site|onsite|hybrid/.test(locationText)) ||
    (/new york|california|san francisco/.test(locationText) &&
      /tempe|phoenix|arizona/.test(locationText))
  ) {
    return [{
      conflict_id: "conflict-location-flexibility",
      field: "location_requirements",
      official_value: [record.location, record.work_style].filter(Boolean).join(
        " / ",
      ),
      secondary_value:
        "Posting contains multiple location or work-style signals.",
      conflict_summary:
        "Location flexibility needs human review before treating the role as local, remote, or relocation-required.",
      resolution: "needs manual review",
      confidence: 0.72,
    }];
  }
  return [];
}

function questionsToVerifyFromRecord(
  record: Record<string, unknown>,
): Array<Record<string, unknown>> {
  const existing = Array.isArray(record.questions_to_verify)
    ? record.questions_to_verify as Array<Record<string, unknown>>
    : [];
  if (existing.length) return existing;
  const compensationQuestions = arrayFromUnknown(
    record.compensation_questions_to_verify,
  ).map((question, index) => ({
    question_id: `verify-comp-${index + 1}`,
    question,
    why_it_matters:
      "Senior or high-upside roles without listed compensation should not be rejected, but total comp, internal level, and scope must be verified before packet work.",
    priority: "P1",
    owner: "Matthew",
    status: "open",
    source_field: "compensation_summary",
  }));
  return [
    {
      question_id: "verify-comp-total",
      question:
        "What is the realistic total compensation range including bonus, equity, and liquidity timing?",
      why_it_matters:
        "Matthew's relocation and opportunity threshold depends on total compensation, not just base salary.",
      priority: "P1",
      owner: "Matthew",
      status: "open",
      source_field: "compensation_summary",
    },
    ...compensationQuestions,
    {
      question_id: "verify-reporting-control",
      question:
        "Who does this role report to, and what decision-making control does it actually own?",
      why_it_matters:
        "The command center favors roles with real operating authority and executive leverage.",
      priority: "P1",
      owner: "Matthew",
      status: "open",
      source_field: "reporting_relationship",
    },
    {
      question_id: "verify-location-tradeoff",
      question:
        "Is Arizona remote/hybrid possible, or would this require meaningful relocation or travel?",
      why_it_matters:
        "Location is weighted, not binary; weaker location fit needs stronger opportunity quality.",
      priority: "P1",
      owner: "Matthew",
      status: "open",
      source_field: "location_requirements",
    },
  ];
}

function applicationRequirementsFromRecord(
  record: Record<string, unknown>,
): Record<string, unknown> {
  const existing = record.application_requirements;
  if (existing && typeof existing === "object" && !Array.isArray(existing)) {
    return existing as Record<string, unknown>;
  }
  return {
    apply_url: sourceUrlFromRecord(record) || null,
    resume_required: "unknown",
    cover_letter_required: "unknown",
    portfolio_required: "unknown",
    location_answer_required: "unknown",
    work_authorization_question: "unknown",
    salary_expectation_question: "unknown",
    referrals_allowed: "unknown",
    recruiter_contact_visible: record.recruiter_name ? "yes" : "unknown",
    application_deadline: null,
    required_documents: [],
    visible_screening_questions: [],
    notes:
      "Application form was not submitted or completed. Requirements are captured only when visible from the official posting or ATS page.",
  };
}

function contactReferralFromRecord(
  record: Record<string, unknown>,
): Record<string, unknown> {
  const existing = record.contact_referral;
  if (existing && typeof existing === "object" && !Array.isArray(existing)) {
    return existing as Record<string, unknown>;
  }
  return {
    recruiter_name: record.recruiter_name
      ? String(record.recruiter_name)
      : null,
    recruiter_url: record.recruiter_linkedin
      ? String(record.recruiter_linkedin)
      : null,
    hiring_manager_name: record.hiring_manager_name
      ? String(record.hiring_manager_name)
      : null,
    hiring_manager_url: record.hiring_manager_linkedin
      ? String(record.hiring_manager_linkedin)
      : null,
    referral_targets: [],
    warm_intro_paths: [],
    contact_notes:
      "No referral path captured yet. Preparation only; no messages sent.",
    outreach_status: String(record.outreach_status || "not_started"),
  };
}

function manualOverridesFromRecord(
  record: Record<string, unknown>,
): Record<string, unknown> {
  const existing = record.manual_overrides;
  if (existing && typeof existing === "object" && !Array.isArray(existing)) {
    return existing as Record<string, unknown>;
  }
  return {
    matthew_notes: null,
    scoring_override: null,
    relocation_override: null,
    packet_override: null,
    hidden_from_search: false,
    last_updated_by: null,
    last_updated_at: null,
  };
}

function knockoutFlagsFromRecord(
  record: Record<string, unknown>,
  text: string,
): Record<string, boolean> {
  const existing = record.knockout_flags;
  const current =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? existing as Record<string, boolean>
      : {};
  const normalized = `${record.location || ""} ${record.work_style || ""} ${
    record.comp_notes || ""
  } ${text}`.toLowerCase();
  return {
    compensation_too_low:
      Number(record.estimated_total_comp_max || record.listed_base_max || 0) >
        0 &&
      Number(record.estimated_total_comp_max || record.listed_base_max || 0) <
        250000,
    relocation_required: Boolean(record.relocation_required) ||
      /relocation required|must relocate/.test(normalized),
    city_high_friction:
      /new york|new jersey|connecticut|san francisco|california|los angeles/
        .test(normalized) &&
      !/phoenix|tempe|scottsdale|arizona/.test(normalized),
    security_clearance_required: /security clearance/.test(normalized),
    too_junior: /associate|coordinator|representative|agent|specialist/.test(
      normalized,
    ) &&
      !/director|head|lead|principal|senior manager|sr manager/.test(
        normalized,
      ),
    too_senior_without_control: false,
    requires_deep_engineering_background:
      /software engineer|machine learning engineer|ml engineer|deep technical engineering/
        .test(normalized),
    requires_industry_credentials:
      /license|certification required|cpa required|bar admission/.test(
        normalized,
      ),
    requires_work_authorization_issue: /sponsorship/.test(normalized),
    heavy_travel: /50% travel|75% travel|heavy travel/.test(normalized),
    unclear_scope: !record.job_summary,
    unclear_comp: !Number(
      record.estimated_total_comp_max || record.listed_base_max || 0,
    ),
    likely_sales_heavy:
      /quota|pipeline generation|cold outbound|account executive/.test(
        normalized,
      ),
    likely_customer_support_only:
      /customer support representative|support agent/.test(normalized),
    not_enough_control_or_impact: false,
    ...current,
  };
}

function stringOrNull(value: unknown): string | null {
  const text = String(value || "").trim();
  return text ? text : null;
}

function hasPostingContent(job: Record<string, unknown>): boolean {
  const text = fullPostingTextFromRecord(job);
  return text.trim().length >= 500;
}

function hasPacketReadyContent(job: Record<string, unknown>): boolean {
  return hasPostingContent(job) &&
    parsedBriefComplete(parsedJobBriefFromRecord(job));
}

function approvalTitle(action: string, job?: Record<string, unknown>): string {
  const company = String(job?.company || "").trim();
  const title = String(job?.role_title || "").trim();
  return [action, company, title].filter(Boolean).join(" - ") ||
    `${action} output`;
}
