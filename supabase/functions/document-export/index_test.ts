import {
  buildExport,
  contentDisposition,
  type DocumentRow,
  exportSnapshotError,
  type ExportTokenRow,
  parseDocumentBlocks,
  pdfDocumentDefinition,
  resolveExportTemplate,
  safeFileName,
  templateIdFromExportRecord,
  wrapText,
} from "./index.ts";

const FIXED_NOW = new Date("2026-07-14T12:00:00.000Z");

function documentRow(overrides: Partial<DocumentRow> = {}): DocumentRow {
  const content = "# Matthew Grossman\n\n## Experience\n\n- Built reliable systems.";
  return {
    id: "document-1",
    user_id: "user-1",
    job_id: "job-1",
    document_type: "ats_resume",
    role_family: "Operations",
    company: "Internal Company Label",
    version_number: 3,
    content,
    status: "approved",
    provider: "openai",
    model_name: "evidence-writer",
    updated_at: "2026-07-14T11:59:00.000Z",
    record: {
      matched_fact_ids: ["cf-1"],
      unresolved_feedback: [],
      unsupported_claims: [],
      prohibited_fact_matches: [],
      needs_review_fact_matches: [],
      quality_gate: "pass",
      packet_quality_gate: "pass",
      quality_score: 90,
      quality_threshold: 85,
      factual_integrity_gate: "pass",
      quality_assessment_id: "quality-assessment-1",
      quality_content_fingerprint: stableContentFingerprint(content),
      required_revisions: [],
    },
    ...overrides,
  };
}

async function exportTokenRow(
  row: DocumentRow,
  recordOverrides: Record<string, unknown> = {},
): Promise<ExportTokenRow> {
  return {
    id: "token-1",
    user_id: row.user_id,
    document_id: row.id,
    export_format: "pdf",
    file_name: "Matthew-Grossman-Resume.pdf",
    expires_at: "2026-07-15T12:00:00.000Z",
    used_at: null,
    record: {
      immutable_snapshot: true,
      template_id: "ats_clean",
      version_number: row.version_number,
      content_sha256: await sha256Hex(row.content),
      document_updated_at: row.updated_at,
      approved_status: "approved",
      ...recordOverrides,
    },
  };
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function stableContentFingerprint(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function assert(
  condition: unknown,
  message = "Assertion failed",
): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEquals<T>(
  actual: T,
  expected: T,
  message = "Values are not equal",
): void {
  if (!Object.is(actual, expected)) {
    throw new Error(
      `${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`,
    );
  }
}

function bodyBytes(body: BodyInit): Uint8Array {
  if (body instanceof ArrayBuffer) return new Uint8Array(body);
  if (ArrayBuffer.isView(body)) {
    return new Uint8Array(body.buffer, body.byteOffset, body.byteLength);
  }
  if (typeof body === "string") return new TextEncoder().encode(body);
  throw new Error(`Unexpected export body type: ${typeof body}`);
}

function bodyText(body: BodyInit): string {
  if (typeof body === "string") return body;
  return new TextDecoder().decode(bodyBytes(body));
}

Deno.test("routes explicit request template_id values", () => {
  assertEquals(
    templateIdFromExportRecord({
      request: { template_id: "Executive Clean" },
      template_id: "ats_clean",
    }),
    "Executive Clean",
  );
  assertEquals(
    resolveExportTemplate("ATS Clean", "executive_resume"),
    "ats_clean",
  );
  assertEquals(
    resolveExportTemplate("executive-clean", "ats_resume"),
    "executive_clean",
  );
  assertEquals(resolveExportTemplate("", "ats_resume"), "ats_clean");
});

Deno.test("employer-use export tokens remain bound to one clean approved snapshot", async () => {
  const row = documentRow();
  const token = await exportTokenRow(row);
  assertEquals(await exportSnapshotError(token, row), "");

  assertEquals(
    await exportSnapshotError(
      await exportTokenRow(row, { immutable_snapshot: false }),
      row,
    ),
    "Export token is not bound to an immutable approved snapshot.",
  );
  assertEquals(
    await exportSnapshotError(token, { ...row, status: "draft" }),
    "Document is no longer approved for employer-use export.",
  );
  assertEquals(
    await exportSnapshotError(token, { ...row, version_number: 4 }),
    "Document version changed after review. Approve the current version and create a new export.",
  );
  assertEquals(
    await exportSnapshotError(token, {
      ...row,
      content: `${row.content}\nChanged`,
    }),
    "Document content changed after review. Approve the current content and create a new export.",
  );
  assertEquals(
    await exportSnapshotError(token, {
      ...row,
      updated_at: "2026-07-14T12:01:00.000Z",
    }),
    "Document changed after approval. Approve the current version and create a new export.",
  );
  assertEquals(
    await exportSnapshotError(token, {
      ...row,
      updated_at: "2026-07-14T11:59:00+00:00",
    }),
    "",
  );
  assertEquals(
    await exportSnapshotError(
      await exportTokenRow(row, { approved_status: "draft" }),
      row,
    ),
    "Export token was not created from an approved document.",
  );
  assertEquals(
    await exportSnapshotError(
      await exportTokenRow(row, { template_id: "" }),
      row,
    ),
    "Export token is missing its approved document template.",
  );
});

Deno.test("integrity issues, manual scaffolds, and ungrounded documents cannot export", async () => {
  const row = documentRow();
  const token = await exportTokenRow(row);
  assertEquals(
    await exportSnapshotError(token, {
      ...row,
      record: { ...(row.record || {}), unresolved_feedback: ["Verify title"] },
    }),
    "Document still has unresolved integrity review items.",
  );
  assertEquals(
    await exportSnapshotError(token, {
      ...row,
      provider: "portal_template",
      record: { ...(row.record || {}), generated_without_model: true },
    }),
    "Manual scaffolds cannot be exported as approved employer documents.",
  );
  assertEquals(
    await exportSnapshotError(token, {
      ...row,
      record: { ...(row.record || {}), matched_fact_ids: [] },
    }),
    "Document has no linked Career Canon evidence.",
  );
});

Deno.test("quality-gated employer exports fail closed against stale or insufficient assessments", async () => {
  const row = documentRow();
  const token = await exportTokenRow(row);
  const record = row.record || {};
  assertEquals(
    await exportSnapshotError(token, {
      ...row,
      record: { ...record, quality_gate: "not_run" },
    }),
    "Independent document quality review has not run.",
  );
  assertEquals(
    await exportSnapshotError(token, {
      ...row,
      record: { ...record, packet_quality_gate: "revise" },
    }),
    "Role-kit quality gate is revise.",
  );
  assertEquals(
    await exportSnapshotError(token, {
      ...row,
      record: { ...record, quality_assessment_id: null },
    }),
    "Independent quality assessment ID is missing.",
  );
  assertEquals(
    await exportSnapshotError(token, {
      ...row,
      record: { ...record, quality_content_fingerprint: "stale" },
    }),
    "Document content changed after its independent quality assessment.",
  );
  assertEquals(
    await exportSnapshotError(token, {
      ...row,
      record: { ...record, required_revisions: ["Strengthen evidence."] },
    }),
    "Document still has required quality revisions.",
  );
  assertEquals(
    await exportSnapshotError(token, {
      ...row,
      record: { ...record, factual_integrity_gate: "fail" },
    }),
    "Independent factual integrity review has not passed.",
  );
  assertEquals(
    await exportSnapshotError(token, {
      ...row,
      record: { ...record, quality_score: 84 },
    }),
    "Independent resume quality score is 84/100; 85/100 is required.",
  );
});

Deno.test("approved HTML and TXT exports are employer-ready and preserve Unicode hierarchy", async () => {
  const content = [
    "# Matthew Résumé",
    "",
    "## Experience",
    "",
    "Led café operations in São Paulo — 42% growth.",
    "",
    "- Built durable systems",
    "- Mentored cross-functional teams",
  ].join("\n");
  const row = documentRow({ content, status: "approved" });

  const htmlExport = await buildExport(row, "html", {
    template_id: "ats_clean",
    file_name: "Matthew Résumé.html",
    now: FIXED_NOW,
  });
  const html = bodyText(htmlExport.body);
  assertEquals(htmlExport.contentType, "text/html; charset=utf-8");
  assertEquals(htmlExport.fileName, "Matthew-Résumé.html");
  assert(html.includes('class="template-ats-clean"'));
  assert(html.includes("<h1>Matthew Résumé</h1>"));
  assert(html.includes("<h2>Experience</h2>"));
  assert(html.includes("<ul><li>Built durable systems</li>"));
  assert(html.includes("Led café operations in São Paulo — 42% growth."));
  assert(html.includes("break-after: avoid-page"));
  assert(html.includes("orphans: 3; widows: 3"));
  assert(!html.includes("Internal Company Label - ats_resume - v3"));
  assert(!html.includes("Bamboo"));
  assert(!html.includes("DRAFT"));

  const textExport = await buildExport(row, "txt", {
    template_id: "ats_clean",
    file_name: "Matthew Résumé.txt",
    now: FIXED_NOW,
  });
  const text = bodyText(textExport.body);
  assert(text.startsWith("Matthew Résumé\n\nExperience"));
  assert(text.includes("São Paulo — 42% growth"));
  assert(!text.includes("Internal Company Label"));
  assert(!text.includes("Bamboo"));
  assert(!text.includes("DRAFT"));
});

Deno.test("non-approved exports have explicit filename and in-document draft status", async () => {
  const row = documentRow({
    status: "ready_for_review",
    content: "Draft résumé content.",
  });
  const exported = await buildExport(row, "txt", {
    file_name: "Résumé.txt",
    now: FIXED_NOW,
  });
  const text = bodyText(exported.body);

  assertEquals(exported.fileName, "DRAFT-ready-for-review-Résumé.txt");
  assert(
    text.startsWith(
      "DRAFT - STATUS: READY FOR REVIEW - NOT EMPLOYER READY\n\n",
    ),
  );
  assert(text.endsWith("Draft résumé content."));
});

Deno.test("DOCX keeps all content and includes named pagination-aware styles", async () => {
  const paragraphs: string[] = ["# Zoë García", "## Experience"];
  for (let index = 0; index < 360; index += 1) {
    paragraphs.push(`Paragraph ${index} — résumé evidence from Montréal.`);
  }
  paragraphs.push("TAIL SENTINEL — no content was truncated.");
  const row = documentRow({
    document_type: "executive_resume",
    content: paragraphs.join("\n\n"),
    status: "approved",
  });
  const exported = await buildExport(row, "docx", {
    template_id: "executive_clean",
    file_name: "Zoë García.docx",
    now: FIXED_NOW,
  });
  const packageText = bodyText(exported.body);

  assert(packageText.includes("Paragraph 0 — résumé evidence from Montréal."));
  assert(
    packageText.includes("Paragraph 359 — résumé evidence from Montréal."),
  );
  assert(packageText.includes("TAIL SENTINEL — no content was truncated."));
  assert(packageText.includes('<w:name w:val="Heading 1"/>'));
  assert(packageText.includes('<w:name w:val="Body Text"/>'));
  assert(packageText.includes('<w:name w:val="List Bullet"/>'));
  assert(packageText.includes("<w:keepNext/>"));
  assert(packageText.includes("<w:keepLines/>"));
  assert(packageText.includes("<w:widowControl/>"));
  assert(!packageText.includes("Private Bamboo export"));
  assert(!packageText.includes("Bamboo Executive Job Engine"));
});

Deno.test("ATS DOCX and PDF use compact one-page resume geometry", async () => {
  const row = documentRow({
    document_type: "ats_resume",
    status: "approved",
    content:
      "# Matthew Grossman\n\n## SUMMARY\n\nEvidence-grounded operator summary.",
  });
  const docx = bodyText(
    (await buildExport(row, "docx", {
      template_id: "ats_clean",
      now: FIXED_NOW,
    })).body,
  );
  assert(docx.includes('<w:sz w:val="20"/>'));
  assert(
    docx.includes(
      '<w:pgMar w:top="720" w:right="864" w:bottom="720" w:left="864"',
    ),
  );

  const context = {
    title: "Example - ats_resume - v1",
    content: row.content,
    blocks: parseDocumentBlocks(row.content),
    status: "approved",
    approved: true,
    template: "ats_clean" as const,
  };
  const definition = pdfDocumentDefinition(context, FIXED_NOW) as {
    pageMargins: number[];
    defaultStyle: { fontSize: number; lineHeight: number };
  };
  assertEquals(
    JSON.stringify(definition.pageMargins),
    JSON.stringify([42, 34, 42, 34]),
  );
  assertEquals(definition.defaultStyle.fontSize, 9.5);
  assertEquals(definition.defaultStyle.lineHeight, 1.12);
});

Deno.test("reasonable employment blocks stay together in HTML, DOCX, and PDF", async () => {
  const content = [
    "# Matthew Grossman",
    "",
    "## EXPERIENCE",
    "",
    "Example Company — Chief Operating Officer",
    "Phoenix, Arizona",
    "2020-Present",
    "",
    "- Built a reliable operating system.",
    "- Led a distributed service team.",
  ].join("\n");
  const row = documentRow({ content, status: "approved" });

  const html = bodyText(
    (await buildExport(row, "html", {
      template_id: "ats_clean",
      now: FIXED_NOW,
    })).body,
  );
  assert(
    html.includes(
      '<section class="employment-block employment-block-compact">',
    ),
  );
  assert(html.includes("page-break-inside: avoid"));

  const docx = bodyText(
    (await buildExport(row, "docx", {
      template_id: "ats_clean",
      now: FIXED_NOW,
    })).body,
  );
  const keepNextCount = Array.from(docx.matchAll(/<w:keepNext\/>/g)).length;
  assert(
    keepNextCount >= 4,
    `Expected employment keep-next chain, found ${keepNextCount}.`,
  );

  const context = {
    title: "Example Company - ats_resume - v3",
    content,
    blocks: parseDocumentBlocks(content),
    status: "approved",
    approved: true,
    template: "ats_clean" as const,
  };
  const definition = pdfDocumentDefinition(context, FIXED_NOW) as {
    content: Array<Record<string, unknown>>;
  };
  assert(definition.content.some((node) => node.unbreakable === true));
});

Deno.test("long employment blocks use a balanced continuation page", async () => {
  const bullets = Array.from(
    { length: 10 },
    (_, index) => `Delivered verified operating result ${index + 1}.`,
  );
  const content = [
    "# Matthew Grossman",
    "",
    "## EXPERIENCE",
    "",
    "Example Company — Chief Operating Officer",
    "Phoenix, Arizona",
    "2020-Present",
    "",
    ...bullets.map((bullet) => `- ${bullet}`),
  ].join("\n");
  const row = documentRow({ content, status: "approved" });

  const html = bodyText(
    (await buildExport(row, "html", {
      template_id: "ats_clean",
      now: FIXED_NOW,
    })).body,
  );
  assert(html.includes("employment-block-flow"));
  assert(!html.includes("employment-block employment-block-compact"));
  assert(
    html.includes("Example Company — Chief Operating Officer (continued)"),
  );
  assert(html.includes("page-break-before: always"));

  const docx = bodyText(
    (await buildExport(row, "docx", {
      template_id: "ats_clean",
      now: FIXED_NOW,
    })).body,
  );
  assert(
    docx.includes("Example Company — Chief Operating Officer (continued)"),
  );
  assert(docx.includes("<w:pageBreakBefore/>"));

  const context = {
    title: "Example Company - ats_resume - v3",
    content,
    blocks: parseDocumentBlocks(content),
    status: "approved",
    approved: true,
    template: "ats_clean" as const,
  };
  const definition = pdfDocumentDefinition(context, FIXED_NOW) as {
    content: Array<Record<string, unknown>>;
  };
  const flowingLists = definition.content.filter((node) =>
    Array.isArray(node.ul)
  ) as Array<{ ul: Array<Record<string, unknown>> }>;
  assert(flowingLists.length >= 2);
  assert(
    flowingLists.every((list) =>
      list.ul.every((item) => item.unbreakable === true)
    ),
  );
  assert(
    definition.content.some((node) =>
      node.unbreakable === true && Array.isArray(node.stack)
    ),
  );
  assert(
    definition.content.some((node) =>
      node.text === "Example Company — Chief Operating Officer (continued)" &&
      node.pageBreak === "before"
    ),
  );
});

Deno.test("PDF definition retains the full hierarchy and generated PDF paginates", async () => {
  const paragraphs: string[] = ["# Renée O’Connor", "## Leadership Experience"];
  for (let index = 0; index < 180; index += 1) {
    paragraphs.push(
      `Evidence ${index}: expanded café operations — safely and repeatably.`,
    );
  }
  paragraphs.push("PDF TAIL SENTINEL — résumé complete.");
  const content = paragraphs.join("\n\n");
  const row = documentRow({
    content,
    status: "approved",
    document_type: "executive_resume",
  });
  const context = {
    title: "Internal Company Label - executive_resume - v3",
    content,
    blocks: parseDocumentBlocks(content),
    status: "approved",
    approved: true,
    template: "executive_clean" as const,
  };
  const definitionText = JSON.stringify(
    pdfDocumentDefinition(context, FIXED_NOW),
  );
  assert(definitionText.includes("Renée O’Connor"));
  assert(
    definitionText.includes(
      "Evidence 179: expanded café operations — safely and repeatably.",
    ),
  );
  assert(definitionText.includes("PDF TAIL SENTINEL — résumé complete."));

  const exported = await buildExport(row, "pdf", {
    template_id: "executive_clean",
    file_name: "Renée O’Connor.pdf",
    now: FIXED_NOW,
  });
  const bytes = bodyBytes(exported.body);
  const pdfText = new TextDecoder().decode(bytes);
  const pageCount = Array.from(pdfText.matchAll(/\/Type \/Page\b/g)).length;
  assert(new TextDecoder().decode(bytes.subarray(0, 8)).startsWith("%PDF-"));
  assert(pageCount > 1, `Expected a multi-page PDF, found ${pageCount} page.`);
  assert(
    pdfText.includes("/ToUnicode"),
    "Expected an embedded font Unicode map.",
  );
  assert(!pdfText.includes("Private Bamboo export"));
});

Deno.test("Executive Clean keeps a concise executive resume on one page", async () => {
  const content = [
    "# Jordan Ellis",
    "",
    "Metro Area | jordan@example.com | linkedin.com/in/jordan",
    "",
    "Distributed Service Operations | Partner Networks | Capacity Planning",
    "",
    "## SUMMARY",
    "",
    "Founder-operator focused on scaling distributed service operations, customer operations, partner networks, capacity planning, and technology-enabled operating systems across a nationwide platform.",
    "",
    "## CORE STRENGTHS",
    "",
    "Customer Operations | Partner Governance | Capacity Planning | Workforce Coordination | High-Volume Service Delivery | Technology-Enabled Workflows | Crisis Response",
    "",
    "## EXPERIENCE",
    "",
    "Example Advisory — Founder & Operating Advisor\nMetro Area\n2023 - Present",
    "",
    "- Advise founders on operating systems, customer experience, automation, and execution discipline.",
    "- Build software products that make complex workflows easier to understand and operate.",
    "",
    "Example Services — Co-Founder / Founder-Operator\n2007 - 2023",
    "",
    "- Scaled a nationwide, asset-light service platform across hundreds of institutional relationships.",
    "- Served more than 100,000 customers through complex, time-sensitive services.",
    "- Built and managed a distributed network of more than 200 operating partners.",
    "- Led year-round and seasonal teams through concentrated demand windows.",
    "- Operated a highly seasonal model requiring forecasting, capacity planning, partner coordination, customer support, and execution control.",
    "- Built technology-enabled workflows for dispatch, inventory, vendor coordination, and customer communication while leading a rapid crisis-response service redesign.",
    "",
    "Example Support Company — Client Services Manager\nTwo Global Offices\n2008 - 2010",
    "",
    "- Helped build and operate a 250-seat customer service center supporting a major enterprise client across voice, email, and live chat.",
    "",
    "## EDUCATION",
    "",
    "Bachelor's Degree\nExample University, 2007",
  ].join("\n");
  const row = documentRow({
    content,
    status: "approved",
    document_type: "executive_resume",
  });
  const exported = await buildExport(row, "pdf", {
    template_id: "executive_clean",
    now: FIXED_NOW,
  });
  const pdfText = new TextDecoder().decode(bodyBytes(exported.body));
  const pageCount = Array.from(pdfText.matchAll(/\/Type \/Page\b/g)).length;
  assertEquals(pageCount, 1);
});

Deno.test("wrapText flushes each line once and never drops long or Unicode words", () => {
  assertEquals(
    JSON.stringify(wrapText("alpha beta gamma", 10)),
    JSON.stringify(["alpha beta", "gamma"]),
  );
  assertEquals(
    JSON.stringify(wrapText("résumé supercalifragilistic", 8)),
    JSON.stringify(["résumé", "supercalifragilistic"]),
  );
  assertEquals(
    JSON.stringify(wrapText("same same\n\nlast", 20)),
    JSON.stringify(["same same", "", "last"]),
  );
});

Deno.test("filenames preserve Unicode and RFC 5987 headers without a legacy length cap", () => {
  const longName = `${"Résumé-".repeat(30)}final.pdf`;
  const safe = safeFileName(longName);
  assert(safe.includes("Résumé"));
  assert(safe.length > 120);

  const disposition = contentDisposition("Zoë García Résumé.pdf");
  assert(disposition.includes('filename="Zoe-Garcia-Resume.pdf"'));
  assert(
    disposition.includes(
      "filename*=UTF-8''Zo%C3%AB-Garc%C3%ADa-R%C3%A9sum%C3%A9.pdf",
    ),
  );
  assert(!disposition.includes("\r"));
  assert(!disposition.includes("\n"));
});
