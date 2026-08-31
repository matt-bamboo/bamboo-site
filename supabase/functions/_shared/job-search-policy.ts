export type CompensationScreenStatus =
  | "no_floor"
  | "meets_floor"
  | "below_floor"
  | "senior_missing_comp"
  | "missing_comp";

export type CompensationScreenDecision = {
  keep: boolean;
  status: CompensationScreenStatus;
  listedBaseMin: number | null;
  listedBaseMax: number | null;
  compensationStatus:
    | "listed"
    | "partially_listed"
    | "not_listed"
    | "unclear"
    | "needs_verification";
  compensationVerdict:
    | "clearly_above_threshold"
    | "likely_above_threshold"
    | "possibly_above_threshold"
    | "unknown_but_senior_enough_to_review"
    | "likely_below_threshold"
    | "clearly_below_threshold"
    | "needs_verification";
  reason: string;
};

export type CompensationScreenSummary = {
  kept: Array<Record<string, unknown>>;
  screenedOut: Array<Record<string, unknown>>;
  screenedOutBelowFloor: number;
  screenedOutMissingComp: number;
};

const SENIOR_TITLE_PATTERN =
  /(vp|vice president|head of|chief operating officer|\bcoo\b|president|general manager|\bgm\b|senior director|sr\.?\s*director|director|regional operations leader|site operations leader|chief of staff)/i;
const TARGET_SCOPE_PATTERN =
  /(operations control|network operations|operational intelligence|strategy\s*&?\s*operations|business operations|marketplace|commerce operations|customer experience|post-purchase|partner operations|vendor operations|support operations|trust\s*&?\s*safety|logistics|fulfillment|process improvement|operational excellence|field operations|multi-site|launch operations|high-volume operations|service operations|transformation|automation|p&l|team leadership)/i;
const TRUSTED_BASE_CONTEXT_PATTERN =
  /\b(base pay|base salary|base compensation|base cash|fixed salary|fixed compensation|salary band|salary range|annualized salary|annual salary|annual base|pay range|budgeted salary|job post range|wage range|salary)\b/i;
const NON_BASE_CONTEXT_PATTERN =
  /\b(total compensation|total comp|target total cash|target cash compensation|all-in compensation|on-target earnings|\bote\b|total rewards range|equity value|stock value)\b/i;

export function screenSearchResultsByCompensation(
  results: Array<Record<string, unknown>>,
  minimumListedBaseSalary: number,
): CompensationScreenSummary {
  const kept: Array<Record<string, unknown>> = [];
  const screenedOut: Array<Record<string, unknown>> = [];
  let screenedOutBelowFloor = 0;
  let screenedOutMissingComp = 0;

  for (const result of results) {
    const decision = compensationScreenDecision(
      result,
      minimumListedBaseSalary,
    );
    const annotated = annotateCompensationDecision(
      result,
      decision,
      minimumListedBaseSalary,
    );
    if (decision.keep) {
      kept.push(annotated);
    } else {
      screenedOut.push(annotated);
      if (decision.status === "below_floor") screenedOutBelowFloor += 1;
      if (decision.status === "missing_comp") screenedOutMissingComp += 1;
    }
  }

  return { kept, screenedOut, screenedOutBelowFloor, screenedOutMissingComp };
}

export function compensationScreenDecision(
  result: Record<string, unknown>,
  minimumListedBaseSalary: number,
): CompensationScreenDecision {
  const floor = boundedAnnualAmount(minimumListedBaseSalary) || 0;
  const detectedRange = listedBaseRange(result);
  const listedBaseMin = detectedRange?.min ?? null;
  const listedBaseMax = detectedRange?.max ?? null;
  const seniorHighUpside = seniorHighUpsideSignal(result);

  if (!floor) {
    return {
      keep: true,
      status: "no_floor",
      listedBaseMin,
      listedBaseMax,
      compensationStatus: listedBaseMin
        ? (listedBaseMax ? "listed" : "partially_listed")
        : "not_listed",
      compensationVerdict: listedBaseMin
        ? "needs_verification"
        : (seniorHighUpside
          ? "unknown_but_senior_enough_to_review"
          : "needs_verification"),
      reason: "No listed-base floor was requested.",
    };
  }

  if (listedBaseMin !== null) {
    const keep = listedBaseMin >= floor;
    return {
      keep,
      status: keep ? "meets_floor" : "below_floor",
      listedBaseMin,
      listedBaseMax,
      compensationStatus: listedBaseMax ? "listed" : "partially_listed",
      compensationVerdict: keep
        ? "clearly_above_threshold"
        : "clearly_below_threshold",
      reason: keep
        ? `The lowest trusted listed base is $${
          listedBaseMin.toLocaleString("en-US")
        }, which meets the requested floor.`
        : `The lowest trusted listed base is $${
          listedBaseMin.toLocaleString("en-US")
        }, below the requested floor.`,
    };
  }

  if (seniorHighUpside) {
    return {
      keep: true,
      status: "senior_missing_comp",
      listedBaseMin: null,
      listedBaseMax: null,
      compensationStatus: "not_listed",
      compensationVerdict: "unknown_but_senior_enough_to_review",
      reason:
        "Compensation is not listed, but the senior title or operating scope is strong enough to keep for verification.",
    };
  }

  return {
    keep: false,
    status: "missing_comp",
    listedBaseMin: null,
    listedBaseMax: null,
    compensationStatus: "needs_verification",
    compensationVerdict: "needs_verification",
    reason:
      "Compensation is not listed and the visible card does not show enough senior scope to justify a wage-targeted deep capture.",
  };
}

export function listedBaseRange(
  result: Record<string, unknown>,
): { min: number; max: number | null } | null {
  const text = compensationSourceText(result);
  const textRanges = trustedListedBaseRanges(text);
  if (textRanges.length) {
    return {
      min: Math.min(...textRanges.map((range) => range.min)),
      max: Math.max(...textRanges.map((range) => range.max)),
    };
  }

  const explicitMin = boundedAnnualAmount(result.listed_base_min);
  const explicitMax = boundedAnnualAmount(result.listed_base_max);
  if (explicitMin) return { min: explicitMin, max: explicitMax || explicitMin };
  return null;
}

function annotateCompensationDecision(
  result: Record<string, unknown>,
  decision: CompensationScreenDecision,
  minimumListedBaseSalary: number,
): Record<string, unknown> {
  return {
    ...result,
    listed_base_min: decision.listedBaseMin,
    listed_base_max: decision.listedBaseMax,
    compensation_listed_yes_no: decision.listedBaseMin !== null,
    compensation_status: decision.compensationStatus,
    compensation_verdict: decision.compensationVerdict,
    compensation_floor_status: decision.status,
    compensation_floor_requested: Math.max(
      0,
      Number(minimumListedBaseSalary || 0),
    ),
    compensation_floor_reason: decision.reason,
  };
}

function trustedListedBaseRanges(
  text: string,
): Array<{ min: number; max: number }> {
  if (!text) return [];
  const ranges: Array<{ min: number; max: number }> = [];
  const amount = String.raw`(?:US(?:D)?\.?\s*)?(?:\$\s*)?(\d{2,3}(?:,\d{3})+|\d{5,7}|\d{2,4}(?:\.\d+)?)\s*([kKmM])?`;
  const patterns = [
    new RegExp(`(?<!\\d)${amount}\\s*(?:-|to|through|up to|–|—)\\s*${amount}(?!\\d)`, "g"),
    new RegExp(`\\b(?:between|from)\\s+${amount}\\s+(?:and|to)\\s+${amount}(?!\\d)`, "gi"),
  ];
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const local = text.slice(
        Math.max(0, match.index - 140),
        Math.min(text.length, match.index + match[0].length + 180),
      );
      if (!TRUSTED_BASE_CONTEXT_PATTERN.test(local)) continue;
      if (
        NON_BASE_CONTEXT_PATTERN.test(local) &&
        !/\b(base pay|base salary|base compensation|base cash|annual base|fixed salary|fixed compensation)\b/i.test(local)
      ) continue;
      const first = boundedAnnualAmount(`${match[1]}${match[2] || ""}`);
      const second = boundedAnnualAmount(`${match[3]}${match[4] || ""}`);
      if (!first || !second) continue;
      ranges.push({ min: Math.min(first, second), max: Math.max(first, second) });
    }
  }
  return ranges;
}

function compensationSourceText(result: Record<string, unknown>): string {
  const values = [
    result.listed_total_comp_notes,
    result.compensation_summary,
    result.salary_snippet,
    result.compensation_snippet,
    result.comp_notes,
    result.raw_posting_text,
    result.job_description_text,
  ];
  return values.map((value) => String(value || "")).filter(Boolean).join("\n");
}

function seniorHighUpsideSignal(result: Record<string, unknown>): boolean {
  const text = [
    result.company,
    result.role_title,
    result.title,
    result.team,
    result.department,
    result.short_card_snippet,
    result.raw_posting_text,
  ].map((value) => String(value || "")).join(" ");
  return SENIOR_TITLE_PATTERN.test(text) &&
    (TARGET_SCOPE_PATTERN.test(text) ||
      /\b(vp|vice president|head of|chief operating officer|\bcoo\b|president|general manager)\b/i
        .test(text));
}

function boundedAnnualAmount(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const text = String(value).replace(/[$,\s]/g, "").trim();
  const match = text.match(/^(\d+(?:\.\d+)?)([kKmM])?$/);
  if (!match) return null;
  let amount = Number(match[1]);
  if (!Number.isFinite(amount)) return null;
  const suffix = String(match[2] || "").toLowerCase();
  if (suffix === "m") amount *= 1_000_000;
  else if (suffix === "k") amount *= 1_000;
  else if (amount < 10_000) return null;
  if (amount < 50_000 || amount > 2_000_000) return null;
  return Math.round(amount);
}
