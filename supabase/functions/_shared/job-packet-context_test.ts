import { assertEquals, assertLess } from "jsr:@std/assert@1";
import {
  compactJobForPacket,
  normalizeStrategistScore,
  selectPacketCareerFacts,
  selectPacketSourceDocuments,
} from "./job-packet-context.ts";

Deno.test("packet context removes nested job history while preserving evidence", () => {
  const compact = compactJobForPacket({
    id: "job-1",
    company: "OpenAI",
    role_title: "Support Operations Manager",
    record: {
      raw_posting_text: "Full official posting",
      parsed_job_brief: { role_mandate: "Scale support operations" },
      score_record: { very: "large" },
      private_notes: "do not copy",
    },
  });

  assertEquals(compact.raw_posting_text, "Full official posting");
  assertEquals(compact.parsed_job_brief, {
    role_mandate: "Scale support operations",
  });
  assertEquals("record" in compact, false);
  assertEquals("score_record" in compact, false);
});

Deno.test("packet context selects matched facts and resume identity only", () => {
  const selected = selectPacketCareerFacts([
    {
      fact_id: "cf-email",
      category: "identity",
      canonical_claim: "Email",
      status: "verified",
      usable_for: ["resume"],
    },
    {
      fact_id: "cf-match",
      category: "scale_metric",
      canonical_claim: "Matched",
      status: "verified",
      usable_for: ["resume"],
    },
    {
      fact_id: "cf-other",
      category: "scale_metric",
      canonical_claim: "Other",
      status: "verified",
      usable_for: ["resume"],
    },
  ], ["cf-match"]);

  assertEquals(selected.map((fact) => fact.fact_id), [
    "cf-email",
    "cf-match",
  ]);
});

Deno.test("packet context excludes placeholders and bounds source material", () => {
  const selected = selectPacketSourceDocuments([
    {
      id: "placeholder",
      authority_level: "reference_only",
      content: "Placeholder source document. Paste a resume here.",
    },
    {
      id: "canon",
      authority_level: "canon_source",
      content: "A".repeat(20_000),
    },
  ], []);

  assertEquals(selected.length, 1);
  assertEquals(selected[0].id, "canon");
  assertLess(String(selected[0].content).length, 12_001);
});

Deno.test("packet context reads source content from canonical record JSON", () => {
  const selected = selectPacketSourceDocuments([
    {
      id: "linkedin-about-current",
      type: "linkedin_about",
      authority_level: "canon_source",
      record: {
        content: "Approved source narrative.",
      },
    },
  ], ["linkedin-about-current"]);

  assertEquals(selected, [{
    id: "linkedin-about-current",
    type: "linkedin_about",
    authority_level: "canon_source",
    content: "Approved source narrative.",
  }]);
});

Deno.test("strategist score calibration resolves contradictory zero fit", () => {
  const normalized = normalizeStrategistScore({
    fit_score: 0,
    opportunity_score: 89,
    qualification_match_score: 68,
    qualification_strength_score: 70,
    must_have_coverage_score: 66,
    qualification_gate: "send_to_writer",
    recommendation: "prepare_packet",
  });

  assertEquals(normalized.fit_score, 70);
});
