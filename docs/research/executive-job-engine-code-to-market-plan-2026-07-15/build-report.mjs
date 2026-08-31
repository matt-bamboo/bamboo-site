import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const outDir = path.dirname(fileURLToPath(import.meta.url));
const title = "Executive Job Engine: Code-to-Market Review and Go Plan (July 2026)";
const generatedAt = "2026-07-15T03:20:00-04:00";

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }

  const [headers, ...body] = rows;
  return body.map((values, index) => {
    if (values.length !== headers.length) {
      throw new Error(`CSV row ${index + 2}: expected ${headers.length} fields, got ${values.length}`);
    }
    return Object.fromEntries(headers.map((header, column) => [header, values[column]]));
  });
}

function readCsv(filename) {
  return parseCsv(fs.readFileSync(path.join(outDir, filename), "utf8"));
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function writeCsv(filename, rows, fields) {
  const text = [
    fields.join(","),
    ...rows.map((row) => fields.map((fieldName) => csvEscape(row[fieldName])).join(","))
  ].join("\n") + "\n";
  fs.writeFileSync(path.join(outDir, filename), text);
}

function tableColumns(fields, labels = {}, numeric = new Set()) {
  return fields.map((field) => ({
    field,
    label: labels[field] ?? field.replaceAll("_", " "),
    type: numeric.has(field) ? "number" : "text"
  }));
}

const backlog = readCsv("prioritized-backlog.csv");
const hours = readCsv("24-hour-plan.csv");
const capabilities = readCsv("capability-assessment.csv");
const roadmap = readCsv("roadmap.csv");

const priorities = ["P0", "P1", "P2"];
const priorityRank = new Map(priorities.map((priority, index) => [priority, index]));
const workstreams = [...new Set(backlog.map((row) => row.workstream))].sort();
const workstreamPriorityCounts = workstreams.flatMap((workstream) => priorities.map((priority) => ({
  workstream,
  priority,
  recommendation_count: backlog.filter((row) => row.workstream === workstream && row.priority === priority).length
}))).filter((row) => row.recommendation_count > 0);

const topP0 = backlog
  .filter((row) => row.priority === "P0")
  .sort((a, b) => a.workstream.localeCompare(b.workstream) || a.id.localeCompare(b.id));

const priorityTotals = Object.fromEntries(priorities.map((priority) => [
  priority,
  backlog.filter((row) => row.priority === priority).length
]));

const headlineMetrics = [{
  live_roles: 604,
  full_postings: 405,
  acceptance_passed: 35,
  acceptance_partial: 15,
  acceptance_failed: 4,
  backlog_actions: backlog.length,
  p0_actions: priorityTotals.P0
}];

writeCsv("workstream-priority-counts.csv", workstreamPriorityCounts, ["workstream", "priority", "recommendation_count"]);
writeCsv("headline-metrics.csv", headlineMetrics, Object.keys(headlineMetrics[0]));

const sources = [
  {
    id: "live_snapshot",
    label: "Authenticated live product inspection",
    path: "screenshots/09-live-roles-full-desktop.png; screenshots/12-live-find-roles-desktop.png; screenshots/17-live-system-desktop.png",
    query: {
      description: "Read-only authenticated journey inspection on 2026-07-15. No search, model generation, approval, application, or employer action was triggered.",
      sql: "SELECT 604 AS live_roles, 405 AS full_postings;",
      engine: "DuckDB",
      language: "sql",
      tables_used: ["authenticated live product snapshot, 2026-07-15"],
      filters: ["Live product as observed 2026-07-15", "Counts are a point-in-time snapshot"],
      metric_definitions: [
        "Live roles = roles shown in the All roles count during the inspected session.",
        "Full postings = roles shown as having full postings in the inspected session."
      ]
    }
  },
  {
    id: "acceptance_evidence",
    label: "July 14 resume-system acceptance matrix",
    path: "/Users/matthewgrossman/Documents/GitHub/bamboo-private-apps/docs/audits/2026-07-14-resume-system/ACCEPTANCE_MATRIX.md",
    query: {
      description: "Latest inspected acceptance audit: 35 passed, 15 partial, and 4 failed requirements.",
      sql: "SELECT 35 AS acceptance_passed, 15 AS acceptance_partial, 4 AS acceptance_failed;",
      engine: "DuckDB",
      language: "sql",
      tables_used: ["docs/audits/2026-07-14-resume-system/ACCEPTANCE_MATRIX.md"],
      filters: ["Repository evidence inspected read-only on 2026-07-15"],
      metric_definitions: ["Acceptance states are audit classifications, not independently rerun hosted production tests in this review."]
    }
  },
  {
    id: "backlog_source",
    label: "Analyst-coded prioritized product backlog",
    path: "prioritized-backlog.csv",
    query: {
      description: "Recommendations derived from live behavior, current code, acceptance evidence, and competitive synthesis.",
      sql: "SELECT * FROM read_csv_auto('prioritized-backlog.csv', header = true);",
      engine: "DuckDB",
      language: "sql",
      tables_used: ["prioritized-backlog.csv"],
      metric_definitions: [
        "Recommendation count is plan inventory, not completed work or measured performance.",
        "P0, P1, and P2 are analyst urgency classifications tied to the stated commercial boundary."
      ]
    }
  },
  {
    id: "plan_metrics_source",
    label: "Prioritized backlog headline counts",
    path: "prioritized-backlog.csv",
    query: {
      description: "Total and P0 recommendation counts from the analyst-coded backlog.",
      sql: "SELECT COUNT(*) AS backlog_actions, SUM(CASE WHEN priority = 'P0' THEN 1 ELSE 0 END) AS p0_actions FROM read_csv_auto('prioritized-backlog.csv', header = true);",
      engine: "DuckDB",
      language: "sql",
      tables_used: ["prioritized-backlog.csv"],
      metric_definitions: ["Recommendation count is plan inventory, not completed work or measured performance."]
    }
  },
  {
    id: "workstream_counts_source",
    label: "Backlog recommendations by workstream and priority",
    path: "workstream-priority-counts.csv",
    query: {
      description: "Counts of analyst-coded backlog rows by workstream and priority.",
      sql: "SELECT workstream, priority, recommendation_count FROM read_csv_auto('workstream-priority-counts.csv', header = true);",
      engine: "DuckDB",
      language: "sql",
      tables_used: ["workstream-priority-counts.csv"],
      metric_definitions: ["Counts describe the proposed plan inventory; they are not a defect-rate or effort estimate."]
    }
  },
  {
    id: "hour_plan_source",
    label: "Twenty-four-hour go/no-go evidence plan",
    path: "24-hour-plan.csv",
    query: {
      description: "Proposed evidence sequence and stop conditions for the first 24 hours.",
      sql: "SELECT * FROM read_csv_auto('24-hour-plan.csv', header = true);",
      engine: "DuckDB",
      language: "sql",
      tables_used: ["24-hour-plan.csv"],
      metric_definitions: ["Time windows are planning allocations, not completion forecasts or historical actuals."]
    }
  },
  {
    id: "capability_source",
    label: "Code-to-market capability assessment",
    path: "capability-assessment.csv",
    query: {
      description: "Current-state assessment against the reviewed competitive landscape.",
      sql: "SELECT * FROM read_csv_auto('capability-assessment.csv', header = true);",
      engine: "DuckDB",
      language: "sql",
      tables_used: ["capability-assessment.csv"],
      metric_definitions: ["Verdicts and priorities are analyst judgments, not vendor claims or statistically validated outcomes."]
    }
  },
  {
    id: "roadmap_source",
    label: "Twelve-month roadmap hypotheses",
    path: "roadmap.csv",
    query: {
      description: "Proposed delivery and validation sequence with explicit commercial gates.",
      sql: "SELECT * FROM read_csv_auto('roadmap.csv', header = true);",
      engine: "DuckDB",
      language: "sql",
      tables_used: ["roadmap.csv"],
      metric_definitions: ["All thresholds and commercial actions are hypotheses until paid cohorts validate them."]
    }
  },
  {
    id: "competitive_review",
    label: "July 2026 review of 77 competitors and adjacencies",
    path: "../executive-job-engine-competitive-landscape-2026-07-14/report.md",
    query: {
      description: "Primary-source public landscape used to distinguish commodity features from the proposed evidence-grounded wedge.",
      filters: ["77 meaningful products and services", "Public sources accessed 2026-07-14"],
      metric_definitions: ["The reviewed sample is broad but not a census; no-public-evidence is not proof a capability is absent."]
    }
  }
];

const manifest = {
  version: 1,
  surface: "report",
  title,
  description: "A read-only product, UX, architecture, sourcing, resume, trust, and commercial review with a 24-hour go/no-go plan and 12-month roadmap.",
  generatedAt,
  sources,
  cards: [
    {
      id: "live_inventory_card",
      dataset: "headline_metrics",
      sourceId: "live_snapshot",
      description: "Point-in-time inventory observed in the authenticated product.",
      metrics: [
        { label: "Live roles", field: "live_roles", format: "number" },
        { label: "Full postings", field: "full_postings", format: "number" }
      ]
    },
    {
      id: "acceptance_card",
      dataset: "headline_metrics",
      sourceId: "acceptance_evidence",
      description: "States reported by the July 14 acceptance audit.",
      metrics: [
        { label: "Passed", field: "acceptance_passed", format: "number" },
        { label: "Partial", field: "acceptance_partial", format: "number" },
        { label: "Failed", field: "acceptance_failed", format: "number" }
      ]
    },
    {
      id: "plan_inventory_card",
      dataset: "headline_metrics",
      sourceId: "plan_metrics_source",
      description: "Analyst-coded plan inventory, not completed work.",
      metrics: [
        { label: "Recommendations", field: "backlog_actions", format: "number" },
        { label: "P0 actions", field: "p0_actions", format: "number" }
      ]
    }
  ],
  charts: [
    {
      id: "backlog_workstream_chart",
      title: "Proposed backlog actions by workstream and priority",
      subtitle: "The concentration in trust, workflow, sourcing, materials, and UX reflects the current commercial blockers; counts are plan inventory, not measured effort.",
      type: "bar",
      dataset: "workstream_priority_counts",
      sourceId: "workstream_counts_source",
      valueFormat: "number",
      options: { orientation: "horizontal", grouping: "grouped" },
      encodings: {
        x: { field: "workstream", type: "nominal", label: "Workstream" },
        y: { field: "recommendation_count", type: "quantitative", label: "Recommendations", format: "number" },
        color: { field: "priority", type: "nominal", label: "Priority" },
        tooltip: [
          { field: "priority", type: "nominal", label: "Priority" },
          { field: "recommendation_count", type: "quantitative", label: "Recommendations", format: "number" }
        ]
      }
    }
  ],
  tables: [
    {
      id: "p0_table",
      title: "P0 launch gates",
      subtitle: "Every row needs environment-bound proof before external candidate data or logins.",
      dataset: "top_p0",
      sourceId: "backlog_source",
      density: "dense",
      defaultSort: { field: "id", direction: "asc" },
      columns: tableColumns(["id", "workstream", "horizon", "recommendation", "acceptance_gate"], {
        id: "ID", workstream: "Workstream", horizon: "Horizon", recommendation: "Action", acceptance_gate: "Acceptance gate"
      })
    },
    {
      id: "hour_plan_table",
      title: "Twenty-four-hour go/no-go plan",
      subtitle: "The outcome is a defensible decision, not a promise of broad launch readiness.",
      dataset: "hour_plan",
      sourceId: "hour_plan_source",
      defaultSort: { field: "time_window", direction: "asc" },
      columns: tableColumns(["time_window", "objective", "actions", "required_proof", "decision"], {
        time_window: "Window", objective: "Objective", actions: "Actions", required_proof: "Required proof", decision: "Decision rule"
      })
    },
    {
      id: "capability_table",
      title: "Current capability versus market",
      subtitle: "A strong integrated concept with several P0 truth and reliability defects.",
      dataset: "capability_assessment",
      sourceId: "capability_source",
      density: "dense",
      defaultSort: { field: "priority", direction: "asc" },
      columns: tableColumns(["capability", "current_state", "competitive_context", "verdict", "priority", "next_move"], {
        capability: "Capability", current_state: "Current state", competitive_context: "Competitive context", verdict: "Verdict", priority: "Priority", next_move: "Next move"
      })
    },
    {
      id: "roadmap_table",
      title: "Twelve-month roadmap",
      subtitle: "Trust first, then paid value, then repeatability and distribution.",
      dataset: "roadmap",
      sourceId: "roadmap_source",
      defaultSort: { field: "phase", direction: "asc" },
      columns: tableColumns(["phase", "objective", "deliverables", "exit_gates", "commercial_action"], {
        phase: "Phase", objective: "Objective", deliverables: "Deliverables", exit_gates: "Exit gates", commercial_action: "Commercial action"
      })
    }
  ],
  blocks: [
    { id: "title", type: "markdown", body: `# ${title}` },
    {
      id: "verdict",
      type: "markdown",
      body: "## Verdict\n\n**No-go for a broad commercial launch. Go for a 24-hour evidence-and-correction sprint, continued Matthew-only use, and sanitized buyer interviews.** A paid three-user concierge beta is conditional on every P0 trust and isolation gate passing. The viable wedge is not generic career AI; it is candidate-controlled source truth, evidence truth, executive pursuit judgment, and immutable approvals."
    },
    { id: "headline", type: "metric-strip", cardIds: ["live_inventory_card", "acceptance_card", "plan_inventory_card"] },
    {
      id: "critical_truths",
      type: "markdown",
      body: "## Five critical truths\n\n1. The product is materially beyond a prototype, but implementation, deployment, and acceptance evidence currently disagree.\n2. Source capture, compensation/relocation reasoning, and the Career Canon are the most promising foundations.\n3. Hidden rank weights, client-generated qualification precision, incomplete application retrieval, and ambiguous run receipts directly undermine the trust claim.\n4. The current resume system can produce fact-safe work and still correctly conclude that a cold application is a no-go; pursuit channel must therefore precede document generation.\n5. Tenant isolation, candidate ownership, export, deletion, and atomic paid workflows are commercial gates, not later enterprise polish."
    },
    { id: "workstream_chart", type: "chart", chartId: "backlog_workstream_chart", layout: "full" },
    { id: "p0_intro", type: "markdown", body: "## P0 launch gates\n\nThe highest-priority work is truth and safety work. A code path, button, or passing deterministic contract test does not close a hosted production acceptance failure." },
    { id: "p0", type: "table", tableId: "p0_table", layout: "full" },
    { id: "hours_intro", type: "markdown", body: "## First 24 hours\n\nFreeze the environment, reconcile acceptance, prove the three core role journeys, attack concurrency and source accounting, repair misleading states, then issue separate decisions for private use, demos, design partners, paid beta, and broad launch." },
    { id: "hours", type: "table", tableId: "hour_plan_table", layout: "full" },
    { id: "capability_intro", type: "markdown", body: "## Product and market assessment\n\nThe visible feature bundle is mostly commoditized. The integrated evidence-grounded workflow may still be distinctive if it becomes easier than a resume-plus-ChatGPT workflow and more trustworthy than automation-first competitors." },
    { id: "capabilities", type: "table", tableId: "capability_table", layout: "full" },
    { id: "roadmap_intro", type: "markdown", body: "## Twelve-month path\n\nProve trust before onboarding, paid executive value before distribution, and repeatability before scale. If the human work remains high, price and operate it honestly as a tech-enabled service." },
    { id: "roadmap", type: "table", tableId: "roadmap_table", layout: "full" },
    {
      id: "limitations",
      type: "markdown",
      body: "## Evidence and limitations\n\nLive behavior was inspected read-only on 2026-07-15. Current deterministic repository checks passed, but this review did not mutate Supabase, run paid generation, send anything, apply to a role, test destructive deletion, or independently close hosted concurrency and multi-tenant acceptance. The competitive landscape is a source-cited 77-product sample, not a census. Accessibility observations are risks requiring testing, not a compliance determination. Commercial thresholds are hypotheses, not forecasts."
    }
  ]
};

const snapshot = {
  version: 1,
  generatedAt,
  status: "ready",
  datasets: {
    headline_metrics: headlineMetrics,
    workstream_priority_counts: workstreamPriorityCounts,
    top_p0: topP0,
    hour_plan: hours,
    capability_assessment: capabilities,
    roadmap
  }
};

const artifact = { surface: "report", manifest, snapshot, sources };
fs.writeFileSync(path.join(outDir, "artifact.json"), JSON.stringify(artifact, null, 2) + "\n");

console.log(JSON.stringify({
  artifact: path.join(outDir, "artifact.json"),
  backlog_rows: backlog.length,
  p0_rows: priorityTotals.P0,
  p1_rows: priorityTotals.P1,
  p2_rows: priorityTotals.P2,
  workstream_rows: workstreamPriorityCounts.length,
  capabilities: capabilities.length,
  roadmap_phases: roadmap.length
}, null, 2));
