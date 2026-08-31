import { createClient } from "npm:@supabase/supabase-js@2";
import pdfMake from "npm:pdfmake@0.2.20/build/pdfmake.js";
import pdfFonts from "npm:pdfmake@0.2.20/build/vfs_fonts.js";

pdfMake.addVirtualFileSystem(pdfFonts);

const ALLOWED_CORS_ORIGINS = new Set([
  "https://app.bamboo.holdings",
  "http://127.0.0.1:8765",
  "http://localhost:8765",
]);

const SECTION_HEADINGS = new Set([
  "achievements",
  "additional experience",
  "certifications",
  "core competencies",
  "education",
  "executive profile",
  "executive summary",
  "experience",
  "key achievements",
  "leadership experience",
  "professional experience",
  "profile",
  "selected achievements",
  "skills",
  "summary",
  "technical skills",
]);

export type ExportFormat = "txt" | "docx" | "html" | "pdf";
export type ExportTemplateId = "ats_clean" | "executive_clean";

export type ExportTokenRow = {
  id: string;
  user_id: string;
  document_id: string;
  export_format: ExportFormat;
  file_name: string;
  expires_at: string;
  used_at: string | null;
  record: Record<string, unknown> | null;
};

export type DocumentRow = {
  id: string;
  user_id: string;
  job_id: string | null;
  document_type: string;
  role_family: string | null;
  company: string | null;
  version_number: number | null;
  content: string;
  status: string;
  provider?: string | null;
  model_name?: string | null;
  updated_at?: string | null;
  record: Record<string, unknown> | null;
};

export type DocumentBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullet_list"; items: string[] }
  | { type: "numbered_list"; items: string[] }
  | { type: "divider" };

export type ExportContext = {
  title: string;
  content: string;
  blocks: DocumentBlock[];
  status: string;
  approved: boolean;
  template: ExportTemplateId;
};

export type BuildExportRequest = {
  template_id?: string | null;
  file_name?: string | null;
  now?: Date;
};

export type BuiltExport = {
  body: BodyInit;
  contentType: string;
  fileName: string;
  templateId: ExportTemplateId;
  approved: boolean;
};

export async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    return textResponse(req, "Method not allowed", 405);
  }

  try {
    const url = new URL(req.url);
    const token = (url.searchParams.get("token") || "").trim();
    if (!token || token.length < 32) {
      return textResponse(req, "Missing or invalid export token.", 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!supabaseUrl || !serviceRoleKey) {
      return textResponse(req, "Document export is not configured.", 500);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const tokenHash = await sha256Hex(token);
    const { data: tokenRow, error: tokenError } = await admin
      .from("jobcc_export_tokens")
      .select(
        "id,user_id,document_id,export_format,file_name,expires_at,used_at,record",
      )
      .eq("token_hash", tokenHash)
      .maybeSingle<ExportTokenRow>();

    if (tokenError) throw tokenError;
    if (!tokenRow) return textResponse(req, "Export token was not found.", 404);
    if (new Date(tokenRow.expires_at).getTime() < Date.now()) {
      return textResponse(req, "Export token expired.", 410);
    }

    const { data: docRow, error: docError } = await admin
      .from("jobcc_document_versions")
      .select(
        "id,user_id,job_id,document_type,role_family,company,version_number,content,status,provider,model_name,updated_at,record",
      )
      .eq("id", tokenRow.document_id)
      .eq("user_id", tokenRow.user_id)
      .maybeSingle<DocumentRow>();

    if (docError) throw docError;
    if (!docRow) return textResponse(req, "Document was not found.", 404);

    const snapshotError = await exportSnapshotError(tokenRow, docRow);
    if (snapshotError) return textResponse(req, snapshotError, 409);

    const templateId = templateIdFromExportRecord(tokenRow.record).trim();
    const redeemedAt = new Date();
    const exported = await buildExport(docRow, tokenRow.export_format, {
      template_id: templateId,
      file_name: tokenRow.file_name,
      now: redeemedAt,
    });

    await admin
      .from("jobcc_export_tokens")
      .update({
        used_at: redeemedAt.toISOString(),
        record: {
          ...(tokenRow.record || {}),
          last_redeemed_at: redeemedAt.toISOString(),
          last_redeemed_format: tokenRow.export_format,
          last_redeemed_template_id: exported.templateId,
        },
      })
      .eq("id", tokenRow.id);

    const headers = {
      ...corsHeaders(req),
      "Content-Type": exported.contentType,
      "Content-Disposition": contentDisposition(exported.fileName),
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
    };
    if (req.method === "HEAD") return new Response(null, { headers });
    return new Response(exported.body, { headers });
  } catch (error) {
    console.error("document-export failed", error);
    return textResponse(req, "Document export failed.", 500);
  }
}

export async function exportSnapshotError(
  tokenRow: ExportTokenRow,
  docRow: DocumentRow,
): Promise<string> {
  const tokenRecord = tokenRow.record || {};
  const docRecord = docRow.record || {};
  if (tokenRecord.immutable_snapshot !== true) {
    return "Export token is not bound to an immutable approved snapshot.";
  }
  if (!isEmployerReadyStatus(documentStatus(docRow))) {
    return "Document is no longer approved for employer-use export.";
  }

  const expectedVersion = Number(tokenRecord.version_number || 0);
  const currentVersion = Number(
    docRow.version_number || docRecord.version_number || 0,
  );
  if (!expectedVersion || expectedVersion !== currentVersion) {
    return "Document version changed after review. Approve the current version and create a new export.";
  }

  const expectedHash = String(tokenRecord.content_sha256 || "").trim();
  const currentHash = await sha256Hex(documentContent(docRow));
  if (!expectedHash || expectedHash !== currentHash) {
    return "Document content changed after review. Approve the current content and create a new export.";
  }

  const expectedUpdatedAt = String(tokenRecord.document_updated_at || "")
    .trim();
  const currentUpdatedAt = String(docRow.updated_at || "").trim();
  if (
    expectedUpdatedAt &&
    !timestampsMatch(expectedUpdatedAt, currentUpdatedAt)
  ) {
    return "Document changed after approval. Approve the current version and create a new export.";
  }

  const expectedStatus = String(tokenRecord.approved_status || "").trim()
    .toLowerCase();
  if (expectedStatus !== "approved") {
    return "Export token was not created from an approved document.";
  }
  const templateId = String(tokenRecord.template_id || "").trim();
  if (!templateId) {
    return "Export token is missing its approved document template.";
  }

  const issueFields = [
    "unresolved_feedback",
    "unsupported_claims",
    "prohibited_fact_matches",
    "needs_review_fact_matches",
  ];
  if (issueFields.some((field) => nonEmptyArray(docRecord[field]).length > 0)) {
    return "Document still has unresolved integrity review items.";
  }

  const provider = String(docRow.provider || docRecord.provider || "")
    .trim().toLowerCase();
  if (
    docRecord.generated_without_model === true ||
    ["", "none", "portal_template", "portal_preview"].includes(provider)
  ) {
    return "Manual scaffolds cannot be exported as approved employer documents.";
  }

  const matchedFacts = nonEmptyArray(
    docRecord.matched_fact_ids,
  );
  if (!matchedFacts.length) {
    return "Document has no linked Career Canon evidence.";
  }

  const qualityGate = normalizedGate(docRecord.quality_gate);
  if (qualityGate !== "pass") {
    return qualityGate === "not_run"
      ? "Independent document quality review has not run."
      : `Independent document quality gate is ${qualityGate}.`;
  }
  const packetQualityGate = normalizedGate(docRecord.packet_quality_gate, "");
  if (packetQualityGate && packetQualityGate !== "pass") {
    return `Role-kit quality gate is ${packetQualityGate}.`;
  }
  const qualityAssessmentId = String(
    docRecord.quality_assessment_id ||
      docRecord.quality_audit_run_id ||
      docRecord.final_quality_check_id ||
      "",
  ).trim();
  if (!qualityAssessmentId) {
    return "Independent quality assessment ID is missing.";
  }
  const expectedQualityFingerprint = String(
    docRecord.quality_content_fingerprint || "",
  ).trim();
  if (!expectedQualityFingerprint) {
    return "Independent quality assessment is not bound to this document content.";
  }
  if (expectedQualityFingerprint !== stableContentFingerprint(documentContent(docRow))) {
    return "Document content changed after its independent quality assessment.";
  }
  if (nonEmptyArray(docRecord.required_revisions).length) {
    return "Document still has required quality revisions.";
  }
  if (/resume/i.test(String(docRow.document_type || ""))) {
    if (normalizedFactualGate(docRecord.factual_integrity_gate) !== "pass") {
      return "Independent factual integrity review has not passed.";
    }
    const qualityScore = Number(docRecord.quality_score);
    const qualityThreshold = Math.max(85, Number(docRecord.quality_threshold) || 85);
    if (!Number.isFinite(qualityScore) || qualityScore < qualityThreshold) {
      return Number.isFinite(qualityScore)
        ? `Independent resume quality score is ${qualityScore}/100; ${qualityThreshold}/100 is required.`
        : "Independent resume quality score is missing.";
    }
  }
  return "";
}

function normalizedGate(value: unknown, fallback = "not_run"): string {
  const gate = String(value || "").trim().toLowerCase().replace(/[ -]+/g, "_");
  return ["pass", "revise", "block", "not_run"].includes(gate)
    ? gate
    : fallback;
}

function normalizedFactualGate(value: unknown): string {
  const gate = String(value || "").trim().toLowerCase().replace(/[ -]+/g, "_");
  return ["pass", "fail", "not_run"].includes(gate) ? gate : "not_run";
}

function stableContentFingerprint(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function timestampsMatch(expected: string, current: string): boolean {
  if (expected === current) return true;
  const expectedMs = Date.parse(expected);
  const currentMs = Date.parse(current);
  return Number.isFinite(expectedMs) && Number.isFinite(currentMs) &&
    expectedMs === currentMs;
}

function nonEmptyArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value.filter((item) => String(item || "").trim());
  }
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

export async function buildExport(
  docRow: DocumentRow,
  format: ExportFormat,
  request: BuildExportRequest = {},
): Promise<BuiltExport> {
  const title = documentTitle(docRow);
  const content = documentContent(docRow);
  const status = documentStatus(docRow);
  const approved = isEmployerReadyStatus(status);
  const template = resolveExportTemplate(
    request.template_id,
    docRow.document_type,
  );
  const context: ExportContext = {
    title,
    content,
    blocks: parseDocumentBlocks(content),
    status,
    approved,
    template,
  };
  const fileName = exportFileName(
    title,
    status,
    approved,
    format,
    request.file_name,
  );
  const now = request.now || new Date();

  if (format === "txt") {
    return {
      body: renderPlainText(context),
      contentType: "text/plain; charset=utf-8",
      fileName,
      templateId: template,
      approved,
    };
  }
  if (format === "html") {
    return {
      body: documentExportHtml(context),
      contentType: "text/html; charset=utf-8",
      fileName,
      templateId: template,
      approved,
    };
  }
  if (format === "pdf") {
    return {
      body: toArrayBuffer(await pdfBytes(context, now)),
      contentType: "application/pdf",
      fileName,
      templateId: template,
      approved,
    };
  }
  return {
    body: toArrayBuffer(createDocxBytes(context, now)),
    contentType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    fileName,
    templateId: template,
    approved,
  };
}

function documentContent(docRow: DocumentRow): string {
  if (docRow.content) return String(docRow.content);
  return typeof docRow.record?.content === "string"
    ? docRow.record.content
    : "";
}

function documentStatus(docRow: DocumentRow): string {
  const status = String(docRow.status || docRow.record?.status || "draft")
    .trim().toLowerCase();
  return status || "draft";
}

function isEmployerReadyStatus(status: string): boolean {
  return status.replace(/[\s-]+/g, "_") === "approved";
}

export function resolveExportTemplate(
  templateId: unknown,
  documentType = "",
): ExportTemplateId {
  const requested = String(templateId || "").trim().toLowerCase().replace(
    /[^a-z0-9]+/g,
    "",
  );
  if (requested === "ats" || requested === "atsclean") return "ats_clean";
  if (requested === "executive" || requested === "executiveclean") {
    return "executive_clean";
  }

  const type = String(documentType || "").trim().toLowerCase();
  if (type.includes("ats")) return "ats_clean";
  if (type.includes("executive")) return "executive_clean";
  return "ats_clean";
}

export function templateIdFromExportRecord(
  record: Record<string, unknown> | null | undefined,
): string {
  if (!record) return "";
  const nestedSources = [record.request, record.export_request, record.options];
  for (const source of nestedSources) {
    if (!isRecord(source)) continue;
    const nested = String(source.template_id || source.templateId || "").trim();
    if (nested) return nested;
  }
  return String(record.template_id || record.templateId || "").trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function documentTitle(docRow: DocumentRow): string {
  return [
    docRow.company || String(docRow.record?.company || "Document"),
    docRow.document_type || String(docRow.record?.document_type || "document"),
    `v${docRow.version_number || 1}`,
  ].filter(Boolean).join(" - ");
}

function exportFileName(
  title: string,
  status: string,
  approved: boolean,
  format: ExportFormat,
  requestedName?: string | null,
): string {
  const requested = safeFileName(requestedName || "");
  const defaultBase = safeFileName(title);
  const baseWithExtension = requested && requested !== "document-export"
    ? requested.replace(/\.(txt|docx|html|pdf)$/i, "")
    : defaultBase;
  const formatted = `${baseWithExtension}.${format}`;
  if (approved || /^draft(?:[-_. ]|$)/i.test(formatted)) return formatted;

  const normalizedStatus = safeFileName(
    status.replace(/_/g, "-").toLowerCase(),
  );
  const statusPart = normalizedStatus && normalizedStatus !== "draft" &&
      normalizedStatus !== "document-export"
    ? `-${normalizedStatus}`
    : "";
  return `DRAFT${statusPart}-${formatted}`;
}

function draftStatusLabel(context: ExportContext): string {
  const status =
    context.status.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim()
      .toUpperCase() || "DRAFT";
  return `DRAFT - STATUS: ${status} - NOT EMPLOYER READY`;
}

export function parseDocumentBlocks(value: string): DocumentBlock[] {
  const lines = String(value || "").replace(/\r\n?/g, "\n").split("\n");
  const blocks: DocumentBlock[] = [];
  let paragraphLines: string[] = [];
  let listType: "bullet_list" | "numbered_list" | null = null;
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (!paragraphLines.length) return;
    blocks.push({ type: "paragraph", text: paragraphLines.join("\n") });
    paragraphLines = [];
  };
  const flushList = () => {
    if (!listType || !listItems.length) return;
    blocks.push({ type: listType, items: listItems });
    listType = null;
    listItems = [];
  };
  const flushPending = () => {
    flushParagraph();
    flushList();
  };
  const pushListItem = (
    type: "bullet_list" | "numbered_list",
    text: string,
  ) => {
    flushParagraph();
    if (listType && listType !== type) flushList();
    listType = type;
    listItems.push(text);
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].replace(/[ \t]+$/g, "");
    const trimmed = line.trim();
    if (!trimmed) {
      flushPending();
      continue;
    }

    const markdownHeading = trimmed.match(/^(#{1,6})\s+(.+?)\s*#*$/);
    if (markdownHeading) {
      flushPending();
      blocks.push({
        type: "heading",
        level: headingLevel(markdownHeading[1].length),
        text: stripWrappingEmphasis(markdownHeading[2]),
      });
      continue;
    }

    if (/^([-*_])\1{2,}$/.test(trimmed)) {
      flushPending();
      blocks.push({ type: "divider" });
      continue;
    }

    const bullet = trimmed.match(/^(?:[-*+]|[\u2022\u25e6\u25aa])\s+(.+)$/u);
    if (bullet) {
      pushListItem("bullet_list", bullet[1].trim());
      continue;
    }

    const numbered = trimmed.match(/^\d+[.)]\s+(.+)$/);
    if (numbered) {
      pushListItem("numbered_list", numbered[1].trim());
      continue;
    }

    const emphasizedHeading = trimmed.match(/^\*\*(.+)\*\*$/);
    if (emphasizedHeading || looksLikeSectionHeading(trimmed)) {
      flushPending();
      blocks.push({
        type: "heading",
        level: blocks.length ? 2 : 1,
        text: stripWrappingEmphasis(emphasizedHeading?.[1] || trimmed),
      });
      continue;
    }

    const firstContentLine = blocks.length === 0 &&
      paragraphLines.length === 0 && !listType;
    if (
      firstContentLine &&
      looksLikeDocumentTitle(trimmed, findNextNonEmptyLine(lines, index + 1))
    ) {
      blocks.push({
        type: "heading",
        level: 1,
        text: stripWrappingEmphasis(trimmed),
      });
      continue;
    }

    flushList();
    paragraphLines.push(trimmed);
  }

  flushPending();
  return blocks;
}

function headingLevel(length: number): 1 | 2 | 3 {
  if (length <= 1) return 1;
  if (length === 2) return 2;
  return 3;
}

function stripWrappingEmphasis(value: string): string {
  return String(value || "").replace(/^(?:\*\*|__)(.*)(?:\*\*|__)$/, "$1")
    .trim();
}

function findNextNonEmptyLine(lines: string[], start: number): string {
  for (let index = start; index < lines.length; index += 1) {
    const value = lines[index].trim();
    if (value) return value;
  }
  return "";
}

function looksLikeDocumentTitle(line: string, nextLine: string): boolean {
  if (!nextLine || line.length > 100 || line.split(/\s+/u).length > 12) {
    return false;
  }
  if (/^(dear|to|re|subject)\b/i.test(line)) return false;
  if (/[.!?;:]$/.test(line)) return false;
  return !/^(?:https?:\/\/|\S+@\S+)/i.test(line);
}

function looksLikeSectionHeading(line: string): boolean {
  const plain = stripWrappingEmphasis(line).replace(/:$/, "").trim();
  if (SECTION_HEADINGS.has(plain.toLowerCase())) return true;
  if (plain.length > 90 || plain.split(/\s+/u).length > 10) return false;

  const letters = Array.from(plain).filter((character) =>
    /\p{L}/u.test(character)
  );
  if (letters.length < 3) return false;
  const uppercase =
    letters.filter((character) => character === character.toUpperCase()).length;
  return uppercase / letters.length >= 0.9;
}

function renderPlainText(context: ExportContext): string {
  const lines: string[] = [];
  if (!context.approved) {
    lines.push(draftStatusLabel(context), "");
  }
  for (const block of context.blocks) {
    if (block.type === "heading" || block.type === "paragraph") {
      lines.push(block.text, "");
      continue;
    }
    if (block.type === "bullet_list") {
      for (const item of block.items) lines.push(`- ${item}`);
      lines.push("");
      continue;
    }
    if (block.type === "numbered_list") {
      for (let index = 0; index < block.items.length; index += 1) {
        lines.push(`${index + 1}. ${block.items[index]}`);
      }
      lines.push("");
      continue;
    }
    lines.push("---", "");
  }
  while (lines.length && lines[lines.length - 1] === "") lines.pop();
  return lines.join("\n");
}

export function documentExportHtml(context: ExportContext): string {
  const templateClass = context.template.replace(/_/g, "-");
  const body = documentBlockGroups(context.blocks).map((group) => {
    if (group.splitIndex) {
      const header = group.blocks[0] as Extract<
        DocumentBlock,
        { type: "paragraph" }
      >;
      const list = group.blocks[1] as Extract<
        DocumentBlock,
        { type: "bullet_list" | "numbered_list" }
      >;
      const firstList = {
        ...list,
        items: list.items.slice(0, group.splitIndex),
      };
      const secondList = { ...list, items: list.items.slice(group.splitIndex) };
      return `<section class="employment-block employment-block-flow">\n${
        htmlBlock(header)
      }\n${
        htmlBlock(firstList)
      }\n</section>\n<section class="employment-continuation">\n<p class="employment-continuation-label">${
        htmlText(employmentContinuationLabel(header.text))
      }</p>\n${htmlBlock(secondList)}\n</section>`;
    }
    const groupHtml = group.blocks.map(htmlBlock).join("\n");
    return group.keepTogether
      ? `<section class="employment-block employment-block-compact">\n${groupHtml}\n</section>`
      : group.employment
      ? `<section class="employment-block employment-block-flow">\n${groupHtml}\n</section>`
      : groupHtml;
  }).join("\n");
  const status = context.approved
    ? ""
    : `<p class="draft-status" role="status">${
      esc(draftStatusLabel(context))
    }</p>`;
  const htmlTitle = firstHeading(context.blocks) ||
    (context.approved ? "Document" : `DRAFT - ${context.title}`);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="robots" content="noindex,nofollow">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(htmlTitle)}</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    html { background: #ffffff; }
    body { margin: 0; color: #171a19; background: #ffffff; font-family: Arial, Helvetica, sans-serif; line-height: 1.42; }
    main { width: min(100% - 48px, 760px); margin: 40px auto 64px; }
    h1, h2, h3 { color: #111413; break-after: avoid-page; page-break-after: avoid; }
    h1 { margin: 0 0 10px; font-size: 24px; line-height: 1.12; }
    h2 { margin: 24px 0 8px; font-size: 15px; line-height: 1.2; }
    h3 { margin: 18px 0 6px; font-size: 12px; line-height: 1.25; }
    p { margin: 0 0 10px; orphans: 3; widows: 3; }
    ul, ol { margin: 5px 0 12px; padding-left: 22px; break-before: avoid-page; page-break-before: avoid; }
    li { margin: 0 0 4px; orphans: 2; widows: 2; break-inside: avoid-page; page-break-inside: avoid; }
    .employment-block-compact { break-inside: avoid-page; page-break-inside: avoid; }
    .employment-block-flow > p:first-child { break-after: avoid-page; page-break-after: avoid; }
    .employment-continuation { break-before: page; page-break-before: always; }
    .employment-continuation-label { margin: 0 0 6px; font-weight: 700; break-after: avoid-page; page-break-after: avoid; }
    hr { height: 0; margin: 18px 0; border: 0; border-top: 1px solid #aeb7b3; break-after: avoid-page; page-break-after: avoid; }
    .draft-status { margin: 0 0 20px; padding: 8px 10px; border: 2px solid #9f2424; color: #7c1717; font-size: 11px; font-weight: 700; letter-spacing: 0; break-after: avoid-page; page-break-after: avoid; }
    .template-ats-clean { font-size: 10.5pt; }
    .template-ats-clean h2 { border-bottom: 1px solid #333333; padding-bottom: 3px; text-transform: uppercase; }
    .template-ats-clean h3 { font-weight: 700; }
    .template-executive-clean { font-size: 11pt; line-height: 1.5; }
    .template-executive-clean h1 { color: #173f38; font-size: 26px; }
    .template-executive-clean h2 { color: #173f38; border-bottom: 2px solid #7e9991; padding-bottom: 4px; }
    .template-executive-clean h3 { color: #293d38; }
    @page { size: Letter; margin: 0.65in 0.7in; }
    @media print {
      body { font-size: 10.5pt; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      main { width: auto; margin: 0; }
      h1, h2, h3, .draft-status { break-after: avoid-page; page-break-after: avoid; }
      p { orphans: 3; widows: 3; }
      ul, ol { break-before: avoid-page; page-break-before: avoid; }
      li { break-inside: avoid-page; page-break-inside: avoid; }
      .employment-block-compact { break-inside: avoid-page; page-break-inside: avoid; }
      .employment-block-flow > p:first-child { break-after: avoid-page; page-break-after: avoid; }
      .employment-continuation { break-before: page; page-break-before: always; }
      .employment-continuation-label { break-after: avoid-page; page-break-after: avoid; }
    }
  </style>
</head>
<body class="template-${templateClass}">
  <main>
    ${status}
    ${body}
  </main>
</body>
</html>`;
}

function htmlBlock(block: DocumentBlock): string {
  if (block.type === "heading") {
    return `<h${block.level}>${htmlText(block.text)}</h${block.level}>`;
  }
  if (block.type === "paragraph") return `<p>${htmlText(block.text)}</p>`;
  if (block.type === "bullet_list") {
    return `<ul>${
      block.items.map((item) => `<li>${htmlText(item)}</li>`).join("")
    }</ul>`;
  }
  if (block.type === "numbered_list") {
    return `<ol>${
      block.items.map((item) => `<li>${htmlText(item)}</li>`).join("")
    }</ol>`;
  }
  return `<hr aria-hidden="true">`;
}

function htmlText(value: string): string {
  return String(value || "").split("\n").map(esc).join("<br>\n");
}

type DocumentBlockGroup = {
  blocks: DocumentBlock[];
  employment: boolean;
  keepTogether: boolean;
  splitIndex?: number;
};

function documentBlockGroups(blocks: DocumentBlock[]): DocumentBlockGroup[] {
  const groups: DocumentBlockGroup[] = [];
  for (let index = 0; index < blocks.length; index += 1) {
    const current = blocks[index];
    const next = blocks[index + 1];
    const isEmploymentBlock = current.type === "paragraph" &&
      current.text.includes("\n") &&
      (next?.type === "bullet_list" || next?.type === "numbered_list");
    if (isEmploymentBlock) {
      const list = next as Extract<
        DocumentBlock,
        { type: "bullet_list" | "numbered_list" }
      >;
      const characterCount = current.text.length +
        list.items.reduce((total, item) => total + item.length, 0);
      groups.push({
        blocks: [current, list],
        employment: true,
        keepTogether: list.items.length <= 5 && characterCount <= 1200,
        splitIndex: list.items.length >= 8
          ? Math.ceil(list.items.length / 2)
          : undefined,
      });
      index += 1;
      continue;
    }
    groups.push({ blocks: [current], employment: false, keepTogether: false });
  }
  return groups;
}

function employmentContinuationLabel(header: string): string {
  const firstLine = String(header || "").split("\n")[0]?.trim() ||
    "Experience";
  return `${firstLine} (continued)`;
}

function firstHeading(blocks: DocumentBlock[]): string {
  for (const block of blocks) {
    if (block.type === "heading" && block.text) return block.text;
  }
  return "";
}

export function createDocxBytes(
  context: ExportContext,
  createdAt = new Date(),
): Uint8Array {
  const now = createdAt.toISOString();
  const coreTitle = firstHeading(context.blocks) ||
    (context.approved ? "Document" : `DRAFT - ${context.title}`);
  const files: Array<[string, string]> = [
    [
      "[Content_Types].xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`,
    ],
    [
      "_rels/.rels",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`,
    ],
    [
      "word/_rels/document.xml.rels",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    ],
    [
      "docProps/core.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${xmlEsc(coreTitle)}</dc:title>
  <dc:creator>Document Export</dc:creator>
  <cp:lastModifiedBy>Document Export</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>
</cp:coreProperties>`,
    ],
    [
      "docProps/app.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
  <Application>Document Export</Application>
</Properties>`,
    ],
    ["word/styles.xml", docxStylesXml(context.template)],
    ["word/document.xml", docxDocumentXml(context)],
  ];
  return zipStored(files);
}

function docxStylesXml(template: ExportTemplateId): string {
  const executive = template === "executive_clean";
  const bodyFont = "Arial";
  const headingFont = executive ? "Aptos Display" : "Arial";
  const headingColor = executive ? "173F38" : "111111";
  const accentColor = executive ? "7E9991" : "333333";
  const bodySize = executive ? 19 : 20;
  const bodyAfter = executive ? 48 : 48;
  const bodyLine = executive ? 232 : 240;
  const sectionBefore = executive ? 160 : 176;
  const sectionAfter = executive ? 56 : 56;
  const roleBefore = executive ? 100 : 96;
  const roleAfter = executive ? 28 : 28;
  const listAfter = executive ? 24 : 24;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault><w:rPr><w:rFonts w:ascii="${bodyFont}" w:hAnsi="${bodyFont}" w:eastAsia="${bodyFont}" w:cs="${bodyFont}"/><w:sz w:val="${bodySize}"/><w:szCs w:val="${bodySize}"/><w:lang w:val="en-US"/></w:rPr></w:rPrDefault>
    <w:pPrDefault><w:pPr><w:widowControl/><w:spacing w:after="${bodyAfter}" w:line="${bodyLine}" w:lineRule="auto"/></w:pPr></w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:widowControl/><w:keepLines/><w:spacing w:after="${bodyAfter}" w:line="${bodyLine}" w:lineRule="auto"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="${bodyFont}" w:hAnsi="${bodyFont}" w:eastAsia="${bodyFont}" w:cs="${bodyFont}"/><w:sz w:val="${bodySize}"/><w:szCs w:val="${bodySize}"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:next w:val="BodyText"/><w:qFormat/>
    <w:pPr><w:keepNext/><w:keepLines/><w:widowControl/><w:spacing w:before="0" w:after="${
    executive ? 96 : 96
  }"/><w:outlineLvl w:val="0"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="${headingFont}" w:hAnsi="${headingFont}"/><w:b/><w:color w:val="${headingColor}"/><w:sz w:val="${
    executive ? 32 : 32
  }"/><w:szCs w:val="${executive ? 32 : 32}"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="Heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="BodyText"/><w:qFormat/>
    <w:pPr><w:keepNext/><w:keepLines/><w:widowControl/><w:spacing w:before="${sectionBefore}" w:after="${sectionAfter}"/><w:outlineLvl w:val="1"/><w:pBdr><w:bottom w:val="single" w:sz="8" w:space="4" w:color="${accentColor}"/></w:pBdr></w:pPr>
    <w:rPr><w:rFonts w:ascii="${headingFont}" w:hAnsi="${headingFont}"/><w:b/><w:color w:val="${headingColor}"/><w:sz w:val="${
    executive ? 22 : 22
  }"/><w:szCs w:val="${executive ? 22 : 22}"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="Heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="BodyText"/><w:qFormat/>
    <w:pPr><w:keepNext/><w:keepLines/><w:widowControl/><w:spacing w:before="${roleBefore}" w:after="${roleAfter}"/><w:outlineLvl w:val="2"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="${headingFont}" w:hAnsi="${headingFont}"/><w:b/><w:color w:val="${headingColor}"/><w:sz w:val="${
    executive ? 20 : 20
  }"/><w:szCs w:val="${executive ? 20 : 20}"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="Heading 3"/><w:basedOn w:val="Normal"/><w:next w:val="BodyText"/><w:qFormat/>
    <w:pPr><w:keepNext/><w:keepLines/><w:widowControl/><w:spacing w:before="${
    executive ? 96 : 96
  }" w:after="${executive ? 28 : 28}"/><w:outlineLvl w:val="3"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="${headingFont}" w:hAnsi="${headingFont}"/><w:b/><w:color w:val="${headingColor}"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="BodyText">
    <w:name w:val="Body Text"/><w:basedOn w:val="Normal"/><w:qFormat/>
    <w:pPr><w:keepLines/><w:widowControl/><w:spacing w:after="${bodyAfter}" w:line="${bodyLine}" w:lineRule="auto"/></w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="ListBullet">
    <w:name w:val="List Bullet"/><w:basedOn w:val="BodyText"/><w:qFormat/>
    <w:pPr><w:keepLines/><w:widowControl/><w:ind w:left="${
    executive ? 300 : 300
  }" w:hanging="${
    executive ? 200 : 200
  }"/><w:spacing w:after="${listAfter}" w:line="${bodyLine}" w:lineRule="auto"/></w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="ListNumber">
    <w:name w:val="List Number"/><w:basedOn w:val="BodyText"/><w:qFormat/>
    <w:pPr><w:keepLines/><w:widowControl/><w:ind w:left="${
    executive ? 360 : 360
  }" w:hanging="${
    executive ? 240 : 240
  }"/><w:spacing w:after="${listAfter}" w:line="${bodyLine}" w:lineRule="auto"/></w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Divider">
    <w:name w:val="Divider"/><w:basedOn w:val="Normal"/>
    <w:pPr><w:keepNext/><w:keepLines/><w:widowControl/><w:spacing w:before="120" w:after="120"/><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="2" w:color="${accentColor}"/></w:pBdr></w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="DraftStatus">
    <w:name w:val="Draft Status"/><w:basedOn w:val="Normal"/><w:next w:val="Title"/>
    <w:pPr><w:keepNext/><w:keepLines/><w:widowControl/><w:spacing w:after="180"/><w:pBdr><w:top w:val="single" w:sz="12" w:color="9F2424"/><w:bottom w:val="single" w:sz="12" w:color="9F2424"/><w:left w:val="single" w:sz="12" w:color="9F2424"/><w:right w:val="single" w:sz="12" w:color="9F2424"/></w:pBdr></w:pPr>
    <w:rPr><w:b/><w:color w:val="7C1717"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr>
  </w:style>
</w:styles>`;
}

function docxDocumentXml(context: ExportContext): string {
  const paragraphs: string[] = [];
  if (!context.approved) {
    paragraphs.push(
      docxParagraph("DraftStatus", draftStatusLabel(context), true),
    );
  }
  for (const group of documentBlockGroups(context.blocks)) {
    if (group.splitIndex) {
      const header = group.blocks[0] as Extract<
        DocumentBlock,
        { type: "paragraph" }
      >;
      const list = group.blocks[1] as Extract<
        DocumentBlock,
        { type: "bullet_list" | "numbered_list" }
      >;
      paragraphs.push(docxParagraph("BodyText", header.text, true));
      appendDocxListParagraphs(
        paragraphs,
        list,
        context.template,
        0,
        group.splitIndex,
      );
      paragraphs.push(
        docxParagraph(
          "Heading2",
          employmentContinuationLabel(header.text),
          true,
          true,
        ),
      );
      appendDocxListParagraphs(
        paragraphs,
        list,
        context.template,
        group.splitIndex,
        list.items.length,
      );
      continue;
    }
    for (
      let blockIndex = 0;
      blockIndex < group.blocks.length;
      blockIndex += 1
    ) {
      const block = group.blocks[blockIndex];
      const hasFollowingBlock = blockIndex < group.blocks.length - 1;
      if (block.type === "heading") {
        const style = block.level === 1
          ? "Title"
          : block.level === 2
          ? "Heading1"
          : "Heading2";
        paragraphs.push(docxParagraph(style, block.text, true));
        continue;
      }
      if (block.type === "paragraph") {
        paragraphs.push(
          docxParagraph(
            "BodyText",
            block.text,
            group.employment && hasFollowingBlock,
          ),
        );
        continue;
      }
      if (block.type === "bullet_list") {
        const marker = context.template === "ats_clean" ? "-" : "\u2022";
        for (
          let itemIndex = 0;
          itemIndex < block.items.length;
          itemIndex += 1
        ) {
          paragraphs.push(
            docxParagraph(
              "ListBullet",
              `${marker}\t${block.items[itemIndex]}`,
              group.keepTogether && itemIndex < block.items.length - 1,
            ),
          );
        }
        continue;
      }
      if (block.type === "numbered_list") {
        for (
          let itemIndex = 0;
          itemIndex < block.items.length;
          itemIndex += 1
        ) {
          paragraphs.push(
            docxParagraph(
              "ListNumber",
              `${itemIndex + 1}.\t${block.items[itemIndex]}`,
              group.keepTogether && itemIndex < block.items.length - 1,
            ),
          );
        }
        continue;
      }
      paragraphs.push(docxParagraph("Divider", "", true));
    }
  }
  if (!paragraphs.length) paragraphs.push(docxParagraph("BodyText", ""));

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphs.join("\n    ")}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="${
    context.template === "ats_clean" ? 720 : 720
  }" w:right="${context.template === "ats_clean" ? 864 : 864}" w:bottom="${
    context.template === "ats_clean" ? 720 : 720
  }" w:left="${
    context.template === "ats_clean" ? 864 : 864
  }" w:header="360" w:footer="360" w:gutter="0"/>
      <w:cols w:space="720"/>
      <w:docGrid w:linePitch="360"/>
    </w:sectPr>
  </w:body>
  </w:document>`;
}

function appendDocxListParagraphs(
  paragraphs: string[],
  list: Extract<DocumentBlock, { type: "bullet_list" | "numbered_list" }>,
  template: ExportTemplateId,
  start: number,
  end: number,
): void {
  for (let itemIndex = start; itemIndex < end; itemIndex += 1) {
    if (list.type === "bullet_list") {
      const marker = template === "ats_clean" ? "-" : "\u2022";
      paragraphs.push(
        docxParagraph(
          "ListBullet",
          `${marker}\t${list.items[itemIndex]}`,
        ),
      );
      continue;
    }
    paragraphs.push(
      docxParagraph(
        "ListNumber",
        `${itemIndex + 1}.\t${list.items[itemIndex]}`,
      ),
    );
  }
}

function docxParagraph(
  style: string,
  text: string,
  keepNext = false,
  pageBreakBefore = false,
): string {
  return `<w:p>
      <w:pPr><w:pStyle w:val="${style}"/>${keepNext ? "<w:keepNext/>" : ""}${
    pageBreakBefore ? "<w:pageBreakBefore/>" : ""
  }<w:keepLines/><w:widowControl/></w:pPr>
      <w:r>${docxTextRuns(text)}</w:r>
    </w:p>`;
}

function docxTextRuns(value: string): string {
  const tokens = String(value || "").split(/(\n|\t)/);
  return tokens.map((token) => {
    if (token === "\n") return "</w:r><w:r><w:br/>";
    if (token === "\t") return "</w:r><w:r><w:tab/>";
    return `<w:t xml:space="preserve">${xmlEsc(token)}</w:t>`;
  }).join("");
}

export function pdfDocumentDefinition(
  context: ExportContext,
  createdAt = new Date(),
): Record<string, unknown> {
  const executive = context.template === "executive_clean";
  const headingColor = executive ? "#173f38" : "#111111";
  const content: Array<Record<string, unknown>> = [];
  if (!context.approved) {
    content.push({
      text: draftStatusLabel(context),
      style: "draftStatus",
      headlineLevel: 1,
    });
  }
  for (const group of documentBlockGroups(context.blocks)) {
    if (group.splitIndex) {
      const header = group.blocks[0];
      const list = group.blocks[1] as Extract<
        DocumentBlock,
        { type: "bullet_list" | "numbered_list" }
      >;
      const firstItem = { ...list, items: list.items.slice(0, 1) };
      content.push({
        stack: [
          pdfBlockNode(header, executive),
          pdfBlockNode(firstItem, executive),
        ],
        unbreakable: true,
      });
      if (group.splitIndex > 1) {
        content.push(
          pdfBlockNode(
            { ...list, items: list.items.slice(1, group.splitIndex) },
            executive,
          ),
        );
      }
      content.push({
        text: employmentContinuationLabel(
          (header as Extract<DocumentBlock, { type: "paragraph" }>).text,
        ),
        style: "heading2",
        headlineLevel: 3,
        pageBreak: "before",
      });
      content.push(
        pdfBlockNode(
          { ...list, items: list.items.slice(group.splitIndex) },
          executive,
        ),
      );
      continue;
    }
    const nodes = group.blocks.map((block) => pdfBlockNode(block, executive));
    if (group.keepTogether) {
      content.push({ stack: nodes, unbreakable: true });
    } else if (group.employment) {
      const header = group.blocks[0];
      const list = group.blocks[1] as Extract<
        DocumentBlock,
        { type: "bullet_list" | "numbered_list" }
      >;
      const firstItem = { ...list, items: list.items.slice(0, 1) };
      content.push({
        stack: [
          pdfBlockNode(header, executive),
          pdfBlockNode(firstItem, executive),
        ],
        unbreakable: true,
      });
      if (list.items.length > 1) {
        content.push(
          pdfBlockNode({ ...list, items: list.items.slice(1) }, executive),
        );
      }
    } else {
      content.push(...nodes);
    }
  }
  if (!content.length) content.push({ text: "", style: "body" });

  return {
    pageSize: "LETTER",
    pageMargins: executive ? [44, 32, 44, 32] : [42, 34, 42, 34],
    content,
    defaultStyle: {
      font: "Roboto",
      fontSize: executive ? 9.5 : 9.5,
      lineHeight: executive ? 1.12 : 1.12,
      color: "#171a19",
    },
    styles: {
      title: {
        fontSize: executive ? 17 : 16,
        bold: true,
        color: headingColor,
        lineHeight: 1.05,
        margin: [0, 0, 0, executive ? 5 : 5],
      },
      heading1: {
        fontSize: executive ? 10.75 : 10.5,
        bold: true,
        color: headingColor,
        lineHeight: 1.1,
        margin: [0, executive ? 7 : 7, 0, executive ? 3 : 3],
      },
      heading2: {
        fontSize: executive ? 9.75 : 9.75,
        bold: true,
        color: headingColor,
        lineHeight: 1.12,
        margin: [0, executive ? 5 : 5, 0, executive ? 2 : 2],
      },
      body: { margin: [0, 0, 0, executive ? 3 : 3] },
      list: { margin: [0, 1, 0, executive ? 3 : 3] },
      listItem: { margin: [0, 0, 0, executive ? 1.5 : 1.5] },
      draftStatus: {
        fontSize: 9,
        bold: true,
        color: "#7c1717",
        background: "#fff4f4",
        margin: [0, 0, 0, 14],
      },
    },
    pageBreakBefore: (
      currentNode: Record<string, unknown>,
      followingNodesOnPage: Array<Record<string, unknown>>,
    ) =>
      Boolean(currentNode.headlineLevel) && followingNodesOnPage.length === 0,
    info: {
      title: firstHeading(context.blocks) ||
        (context.approved ? "Document" : `DRAFT - ${context.title}`),
      author: "",
      subject: context.approved
        ? "Employer-ready document"
        : draftStatusLabel(context),
      creator: "Document Export",
      creationDate: createdAt,
      modDate: createdAt,
    },
  };
}

function pdfBlockNode(
  block: DocumentBlock,
  executive: boolean,
): Record<string, unknown> {
  if (block.type === "heading") {
    const style = block.level === 1
      ? "title"
      : block.level === 2
      ? "heading1"
      : "heading2";
    return { text: block.text, style, headlineLevel: block.level };
  }
  if (block.type === "paragraph") {
    return { text: block.text, style: "body" };
  }
  if (block.type === "bullet_list") {
    return {
      ul: block.items.map((item) => ({
        stack: [{ text: item, style: "listItem" }],
        unbreakable: true,
      })),
      style: "list",
    };
  }
  if (block.type === "numbered_list") {
    return {
      ol: block.items.map((item) => ({
        stack: [{ text: item, style: "listItem" }],
        unbreakable: true,
      })),
      style: "list",
    };
  }
  return {
    canvas: [{
      type: "line",
      x1: 0,
      y1: 0,
      x2: executive ? 496 : 512,
      y2: 0,
      lineWidth: 0.7,
      lineColor: executive ? "#7e9991" : "#777777",
    }],
    margin: [0, 7, 0, 9],
  };
}

export async function pdfBytes(
  context: ExportContext,
  createdAt = new Date(),
): Promise<Uint8Array> {
  const definition = pdfDocumentDefinition(context, createdAt);
  return await new Promise<Uint8Array>((resolve, reject) => {
    try {
      pdfMake.createPdf(definition).getBuffer((buffer: Uint8Array) => {
        const bytes = new Uint8Array(buffer.byteLength);
        bytes.set(buffer);
        resolve(bytes);
      });
    } catch (error) {
      reject(error);
    }
  });
}

export function wrapText(value: string, width: number): string[] {
  if (!Number.isFinite(width) || width < 1) {
    throw new RangeError("wrapText width must be at least 1.");
  }
  const output: string[] = [];
  for (
    const paragraph of String(value || "").replace(/\r\n?/g, "\n").split("\n")
  ) {
    const words = paragraph.trim().split(/\s+/u).filter(Boolean);
    if (!words.length) {
      output.push("");
      continue;
    }

    let current = "";
    const flush = () => {
      if (!current) return;
      output.push(current);
      current = "";
    };
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (current && Array.from(candidate).length > width) flush();
      current = current ? `${current} ${word}` : word;
    }
    flush();
  }
  return output;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

function zipStored(files: Array<[string, string]>): Uint8Array {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;
  files.forEach(([name, content]) => {
    const nameBytes = encoder.encode(name);
    const data = encoder.encode(content);
    const crc = crc32(data);
    const local = concatBytes(
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(nameBytes.length),
      u16(0),
      nameBytes,
      data,
    );
    const central = concatBytes(
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(nameBytes.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      nameBytes,
    );
    localParts.push(local);
    centralParts.push(central);
    offset += local.length;
  });
  const centralDirectory = concatBytes(...centralParts);
  const end = concatBytes(
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(centralDirectory.length),
    u32(offset),
    u16(0),
  );
  return concatBytes(...localParts, centralDirectory, end);
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let index = 0; index < 8; index += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  parts.forEach((part) => {
    output.set(part, offset);
    offset += part.length;
  });
  return output;
}

function u16(value: number): Uint8Array {
  return new Uint8Array([value & 255, (value >>> 8) & 255]);
}

function u32(value: number): Uint8Array {
  return new Uint8Array([
    value & 255,
    (value >>> 8) & 255,
    (value >>> 16) & 255,
    (value >>> 24) & 255,
  ]);
}

function corsHeaders(req: Request): Record<string, string> {
  const configured = (Deno.env.get("JOBCC_ALLOWED_CORS_ORIGINS") || "").split(
    ",",
  ).map((item) => item.trim()).filter(Boolean);
  const allowed = configured.length
    ? new Set(configured)
    : ALLOWED_CORS_ORIGINS;
  const origin = req.headers.get("Origin") || "";
  const allowOrigin = origin && allowed.has(origin)
    ? origin
    : "https://app.bamboo.holdings";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Vary": "Origin",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  };
}

function textResponse(req: Request, message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: {
      ...corsHeaders(req),
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

export function safeFileName(value: string): string {
  const clean = String(value || "document-export")
    .normalize("NFC")
    .replace(/[\p{Cc}<>:"/\\|?*]+/gu, "-")
    .replace(/\s+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^[.\s-]+|[.\s-]+$/gu, "");
  return clean || "document-export";
}

export function contentDisposition(fileName: string): string {
  const safe = safeFileName(fileName);
  const fallback = safeFileName(
    safe.normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\x20-\x7e]/g, "-"),
  ).replace(/["\\]/g, "-");
  const encoded = encodeURIComponent(safe).replace(
    /[!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}

function esc(value: string): string {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function xmlEsc(value: string): string {
  const xmlSafe = Array.from(String(value || "")).filter((character) => {
    const codePoint = character.codePointAt(0) || 0;
    return codePoint === 0x09 || codePoint === 0x0a || codePoint === 0x0d ||
      (codePoint >= 0x20 && codePoint <= 0xd7ff) ||
      (codePoint >= 0xe000 && codePoint <= 0xfffd) ||
      (codePoint >= 0x10000 && codePoint <= 0x10ffff);
  }).join("");
  return xmlSafe
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

if (import.meta.main) Deno.serve(handler);
