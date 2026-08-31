export type OfficialCaptureDisposition = {
  handled: boolean;
  officialCaptureFailed: boolean;
  supplementalScoutRequired: boolean;
  fallbackReason: string;
};

export function officialCaptureDisposition(args: {
  company: string;
  jobListCaptured: boolean;
  candidateCardCount: number;
  errorCount: number;
}): OfficialCaptureDisposition {
  const officialCaptureFailed = !args.jobListCaptured &&
    (args.candidateCardCount === 0 || args.errorCount > 0);
  const supplementalScoutRequired = /^uber$/i.test(args.company.trim());
  const fallbackReason = officialCaptureFailed
    ? "official_job_list_capture_failed_or_empty"
    : supplementalScoutRequired
    ? "official_adapter_covers_only_uber_freight"
    : "";
  return {
    handled: !officialCaptureFailed && !supplementalScoutRequired,
    officialCaptureFailed,
    supplementalScoutRequired,
    fallbackReason,
  };
}

export function mergeSourceQueries(
  configuredQueries: string[] | undefined,
  taskQueries: string[],
): string[] {
  const seen = new Set<string>();
  return [...(configuredQueries ?? []), ...taskQueries]
    .map((value) => String(value || "").trim())
    .filter((value) => {
      if (!value) return false;
      const key = value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
