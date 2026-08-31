# Executive Job Engine: Code-to-Market Product Review and Go Plan

**Date:** 2026-07-15  
**Scope:** Read-only review of the authenticated live product, current private frontend source, current product and acceptance documents, source-import architecture, production-neutral backend files, and the July 2026 competitive landscape.  
**Product systems changed:** None. No product code, repository state, Supabase data, DNS, employer system, application, message, upload, or paid action was changed.  
**Recommended launch decision:** **No-go for a broad commercial launch. Go for a 24-hour evidence-and-correction sprint, continued Matthew-only use, and sanitized buyer interviews. A paid three-user concierge beta is conditional on every P0 trust and isolation gate passing.**

## Executive summary

The Engine is more real—and more differentiated—than a generic AI job-search prototype. The authenticated product already shows a source-first role inventory, direct links to official postings, separate opportunity and qualification views, compensation and relocation reasoning, full-posting and Job Brief gates, Career Canon facts, role-scoped materials, versioning, approval controls, cost visibility, and repeated warnings that nothing is sent or submitted automatically. Those are the right foundations.

The July 2026 review of 77 competitors still supports a narrow commercial wedge: **candidate-controlled executive evidence and decision infrastructure**, not “all-in-one AI job search.” Indeed, LinkedIn, Teal, Jobscan, JobCopilot, Jobright, Simplify, Careerflow, executive networks, outplacement firms, and general AI products already match or exceed large slices of discovery, tracking, ATS optimization, outreach, interviews, or automation. The Engine should not compete on job volume, application speed, number of AI models, or number of document types. See the full [competitive review](../executive-job-engine-competitive-landscape-2026-07-14/report.md), [Indeed Apply For Me](https://www.indeed.com/news/releases/indeed-tests-apply-for-me-job-search), [Jobscan Auto Apply](https://www.jobscan.co/auto-apply), [JobCopilot](https://jobcopilot.com/), [Teal](https://www.tealhq.com/), and [Jobright](https://jobright.ai/).

The product can win if it becomes exceptional at five things:

1. **Source truth:** every serious role has an official or honestly classified source, immutable snapshot, freshness state, and readable change history.
2. **Evidence truth:** every material requirement and every employer-facing factual clause resolves to approved candidate evidence—or is visibly unknown, transferable, or blocked.
3. **Executive judgment:** compensation, relocation, role scope, pursuit cost, network leverage, and channel strategy produce a transparent decision, not one opaque score.
4. **Controlled production:** model steps are atomic, costs are deduplicated, versions are immutable, approvals sign exact artifacts, and no external action happens implicitly.
5. **Outcome discipline:** the system measures decision quality, time saved, first-pass claim safety, channel-specific progression, and human delivery cost without pretending sparse outcomes prove causality.

The current blockers sit exactly on those promises. The newest acceptance audit still reports **35 passed, 15 partial, and 4 failed** requirements, including duplicate paid Writer calls, eight of nine packet outputs without per-document evidence, an unaccepted end-to-end role-kit run, and a fact-safe resume that still scored 73/100 and was a cold-application no-go for the exact OpenAI role. Current source now contains a Restore action and a detailed search receipt, but that means implementation moved ahead of proof—not that the failures are automatically closed. [Acceptance matrix](/Users/matthewgrossman/Documents/GitHub/bamboo-private-apps/docs/audits/2026-07-14-resume-system/ACCEPTANCE_MATRIX.md:7) [Resume audit](/Users/matthewgrossman/Documents/GitHub/bamboo-private-apps/docs/audits/2026-07-14-resume-system/OPENAI_RESUME_EVIDENCE_AUDIT.md:5)

The blunt commercial verdict is therefore:

- **Matthew-only private use:** go with informed caution.
- **Sanitized demos, discovery calls, and advisor review:** go now.
- **External design-partner login or data ingestion:** no-go until tenant isolation, candidate ownership, export, and deletion are proven.
- **Maximum three-user paid concierge beta:** conditional go only after every P0 trust gate passes.
- **Broad self-serve or enterprise launch:** no-go.

## What was reviewed

### Product truth stack

There are three materially different frontend layers plus a large backend layer:

| Layer | Current purpose | Evidence | Assessment |
|---|---|---|---|
| `bamboo-private-apps` | Current live source for `https://app.bamboo.holdings/` | [README](/Users/matthewgrossman/Documents/GitHub/bamboo-private-apps/README.md:27); live authenticated inspection | Canonical frontend for this review. Current working tree was already dirty and was not edited. |
| `.private/job-command-center` | Older local proof application | [README](/Users/matthewgrossman/Documents/GitHub/bamboo-site/.private/job-command-center/README.md:1) | Valuable historical product research, but not current live truth. Its `app.js` is 9,410 lines and `styles.css` is 11,213 lines. |
| `.private/job-command-center/production-safe-portal` | Stale local copy of an earlier production shell | [Current State](/Users/matthewgrossman/Documents/GitHub/bamboo-site/.private/job-command-center/docs/CURRENT_STATE.md:17) | Not reliable for current UX decisions; it is much smaller and older than the live source. |
| `bamboo-site/supabase/functions/_shared` | Production-neutral local backend and source-workflow files | Local source inspection | Large workflow/source layer; `_shared/job-command-center-ai.ts` is 13,812 lines. It should be treated as a backend monolith, not rewritten wholesale. |

The private app README explicitly says the full MVP is not accepted and points to `System -> MVP Acceptance` and `docs/MVP_ACCEPTANCE_MATRIX.md` as truth. That June matrix is less strict than the newer July 14 resume-system acceptance audit, while current code contains functionality that the newer audit still marks unaccepted. The first product move is therefore **truth-stack reconciliation**, not another feature. [README](/Users/matthewgrossman/Documents/GitHub/bamboo-private-apps/README.md:62) [June matrix](/Users/matthewgrossman/Documents/GitHub/bamboo-private-apps/docs/MVP_ACCEPTANCE_MATRIX.md:21) [July matrix](/Users/matthewgrossman/Documents/GitHub/bamboo-private-apps/docs/audits/2026-07-14-resume-system/ACCEPTANCE_MATRIX.md:7)

### Validation run

`npm run check` passed on the current dirty working tree:

- JavaScript parse check
- production privacy scan
- unauthorized access-gate test
- visible action wiring audit
- materials workflow contract test
- workflow preview test
- compensation parser and language tests
- source-importer compensation integration
- suppression-safe apply test

This is useful evidence of wiring and deterministic contracts. It is **not** proof of server-side concurrency safety, multi-tenant isolation, hosted source-receipt correctness, end-to-end claim coverage, or commercial readiness. The repository’s own July acceptance evidence proves that distinction. [package.json](/Users/matthewgrossman/Documents/GitHub/bamboo-private-apps/package.json:6) [Acceptance matrix](/Users/matthewgrossman/Documents/GitHub/bamboo-private-apps/docs/audits/2026-07-14-resume-system/ACCEPTANCE_MATRIX.md:23)

## Blunt product verdict

### What is already unusually good

- **The role-first reset is correct.** Roles, Next actions, Find roles, Applications, Materials, and System are a much better daily model than exposing internal tables and workflows. The documented product questions—what is worth attention, is this role worth pursuing, what is next, what material is needed, and what does the system know—are the right sequence. [Reset plan](/Users/matthewgrossman/Documents/GitHub/bamboo-private-apps/docs/JOB_ENGINE_PRODUCT_RESET_PLAN_20260713.md:86)
- **Opportunity and qualification are separated.** The written model correctly defines opportunity as attractiveness after economics, location, scope, company, and upside, while qualification asks what approved evidence supports. It explicitly says neither score predicts ATS or hiring outcomes. [Qualification model](/Users/matthewgrossman/Documents/GitHub/bamboo-private-apps/docs/QUALIFICATION_EVIDENCE_MODEL_20260713.md:5)
- **Missing evidence is not silently invented.** The OpenAI audit is the strongest proof of judgment: the resume passed factual integrity but the product still recognized that direct support-operations evidence was insufficient for a cold application. [Resume audit](/Users/matthewgrossman/Documents/GitHub/bamboo-private-apps/docs/audits/2026-07-14-resume-system/OPENAI_RESUME_EVIDENCE_AUDIT.md:65)
- **Compensation reasoning is materially better than a salary filter.** The system distinguishes base, package or OTE, equity and incentive language, missing pay, geography, and strict-base versus opportunity-target searches. It correctly treats missing compensation as unknown and title/scope as a reason to investigate—not proof of a $300K package. [Compensation model](/Users/matthewgrossman/Documents/GitHub/bamboo-private-apps/docs/COMPENSATION_SEARCH_MODEL.md:5)
- **Source capture and suppression have strong technical intent.** Safe-apply artifacts, identity aliases, posting hashes, suppression, and change preservation are better than a generic bookmark tracker. The system also prevents packet generation during search. [Search UI](/Users/matthewgrossman/Documents/GitHub/bamboo-private-apps/portal.js:5049) [Controlled search body](/Users/matthewgrossman/Documents/GitHub/bamboo-private-apps/portal.js:8483)
- **Materials contain real safety gates.** Full posting, parsed Job Brief, approved Canon facts, role-specific documents, revisions, approvals, exports, and no-send warnings exist in the live product. [Role-kit builder](/Users/matthewgrossman/Documents/GitHub/bamboo-private-apps/portal.js:2927) [Release readiness](/Users/matthewgrossman/Documents/GitHub/bamboo-private-apps/portal.js:6037)
- **The system is honest about internal-only work.** It repeatedly states that nothing is uploaded, messaged, emailed, or submitted. That boundary should remain part of the brand, not be treated as a missing feature.

### What prevents the current product from being commercially ready

1. **Implemented is being confused with accepted.** Current code contains Restore and receipt UI, the June matrix presents a comparatively optimistic state, the July matrix still marks four failures, and live System displays stale runs and zero-value coverage. A customer cannot be asked to resolve those contradictions.
2. **The decision labels are not fully trustworthy.** `#1 best`, Opportunity 95, Qualifications pending, and Strong Fit can coexist because a hidden curated tier adds up to 200,000 points before the visible score. [Ranking code](/Users/matthewgrossman/Documents/GitHub/bamboo-private-apps/portal.js:2724)
3. **Qualification can show false precision.** When a persisted score is absent, the browser derives a score using matched = 1 and needs review = 0.55, then may reuse the overall score as direct strength and must-have coverage. [Qualification fallback](/Users/matthewgrossman/Documents/GitHub/bamboo-private-apps/portal.js:5473)
4. **Application state is incomplete.** Only eight rows load; the screen’s second column only includes statuses matching `applied`; and unknown stored values can visually fall back to the first dropdown option. [Query limits](/Users/matthewgrossman/Documents/GitHub/bamboo-private-apps/portal.js:558) [Applications view](/Users/matthewgrossman/Documents/GitHub/bamboo-private-apps/portal.js:4469)
5. **The evidence gate proves some linkage, not total factual coverage.** `matched_fact_ids.length > 0` is treated as evidence linked. That does not prove every factual clause is admissible. [Release readiness](/Users/matthewgrossman/Documents/GitHub/bamboo-private-apps/portal.js:6037)
6. **Source and search accounting still disagree.** Live Find roles showed 604 loaded, 603 source verified, and 405 full postings while recent runs showed zeros and stale in-progress states. Missing receipt fields are coerced to zero. [Receipt renderer](/Users/matthewgrossman/Documents/GitHub/bamboo-private-apps/portal.js:5171)
7. **The Career Canon’s interface undersells the moat.** The schema loads variants, evidence notes, usable channels, source IDs, and sensitivity, but the UI renders a long flat claim/status list. Direct Canon reload also displayed zero Resume Lanes although System reported three, because the Canon view does not request `resumeLanes`. [View data map](/Users/matthewgrossman/Documents/GitHub/bamboo-private-apps/portal.js:576) [Canon renderer](/Users/matthewgrossman/Documents/GitHub/bamboo-private-apps/portal.js:5286)
8. **The product is Matthew-specific, not tenant-ready.** Fields such as `matthew_rating`, `approved_by_matthew`, personal defaults, one allowed account, and candidate-specific copy are appropriate for the private tool but not proof of candidate ownership, tenant isolation, or coach permissions. [Data specs](/Users/matthewgrossman/Documents/GitHub/bamboo-private-apps/portal.js:550)
9. **The frontend and backend are hard to change safely.** The live frontend is a 9,087-line IIFE plus 7,754 lines of CSS; the local AI/workflow backend is 13,812 lines; the source importer is 4,681 lines. The right response is incremental domain extraction behind tests, not a framework rewrite.

## Live journey audit

The health labels below are product-judgment labels, not accessibility or regulatory compliance findings.

### 1. Review the role portfolio — Needs attention

![Live role review](screenshots/09-live-roles-full-desktop.png)

**What works**

- Desktop keeps list and role detail together.
- Four lenses—Best roles, Worth a look, Kept, All roles—are understandable.
- Compensation, location, official posting, qualification, decision controls, and one next action are visible.
- Source-incomplete roles correctly block material building.

**What breaks trust**

- XPRIZE appears `#1 best / Opportunity 95 / Qualifications pending`; Waymo appears `#2 best / Opportunity 97 / Qualifications 0 / Strong Fit`. The rank is not a score order, but the UI implies it is.
- “Source-backed roles” treats link-only, verified, full-posting, parsed, stale, and changed states as one umbrella.
- Fifteen “best” roles is still too many for a daily executive review.
- Filters are comprehensive but the company selector is an unwieldy long list.

**Recommendation**

Rename the default lens **Review today**, limit it to 3–5 roles, and label the order **Curated priority**. Each role should show a compact six-part decision stack: source state, opportunity, qualification confidence, compensation confidence, relocation friction, and pursuit recommendation. Add `Why here` with the three dominant ranking factors and let the user switch sort order.

### 2. Open a role and decide — Good foundation, needs explainability

![Live scored role](screenshots/11-live-scored-role-desktop.png)

**What works**

- Opportunity and Qualifications are visually separate.
- Direct strength, must-have coverage, gap risk, transferable evidence, and missing or unproven requirements are explicit.
- The exact official posting is reachable.
- The next action is plain language.
- Source-incomplete roles remain blocked.

**What must improve**

- Show whether each score is persisted or derived, its version, source revision, Canon revision, method, and confidence.
- Do not infer direct strength or gap risk from one overall score.
- Replace Strong Fit with **Opportunity shape** unless qualification evidence supports the stronger claim.
- Keep a persistent decision rail while scrolling through evidence and materials.
- Make `unknown` visually different from `gap`; absence of evidence is not evidence of absence.

### 3. Find fresh roles — At risk

![Live source-first search](screenshots/12-live-find-roles-desktop.png)

**What works**

- One saved priority search shows 85 companies, four role families, a $300K opportunity target, and a $5 cap.
- Official and ATS sources are explicitly prioritized.
- Search is correctly separated from packet generation and external actions.
- The receipt design anticipates new, changed, unchanged, suppressed, screened out, deferred, duplicates, and failures.

**What must improve**

- Recent zero-value runs and stale `in progress` states do not explain whether work was queued, failed, partial, canceled, or genuinely produced no results.
- The UI reads flat `record.new_roles` fields, while safe-apply output can persist classifications elsewhere; the schema must be one versioned contract.
- Missing receipt fields become zero, which manufactures certainty.
- “Full posting captured” currently has multiple definitions: any nonempty description in scoring, 200+ characters in safe apply, and 500+ characters plus parsed sections for materials.
- Provider order can be truncated before scoring, so a scan should say `inventory truncated` rather than `exhaustive` when that happens.
- LinkedIn guest endpoints may be useful discovery evidence but should not receive the same official-source badge as employer or ATS verification. This also warrants terms review.

**Recommendation**

Create one pipeline and one receipt:

`source request -> cards observed -> cards screened -> identity reconciled -> official source verified -> full posting state -> Job Brief state -> role decision state`

At identity reconciliation, each observation must end in exactly one of `new`, `changed`, `unchanged`, `suppressed`, `duplicate`, or `failed`. Treat screening, source failures, and deferred detail capture as upstream counters. Preserve canonical employer ID, ATS, job ID, URL, timestamp, snapshot hash, and semantic diff.

### 4. Build materials — Strong safety, wrong default unit of work

![Live materials role picker](screenshots/14-live-materials-loaded-desktop.png)

**What works**

- Materials starts from a role, not a blank document.
- Source and Job Brief readiness gate work.
- Role facts, documents, versions, approvals, and exports are connected.
- Current source improvements remove unsupported employer-facing claims and keep internal gap analysis out of finished documents.

**What must improve**

- The default workflow still imagines one evidence spine producing ATS resume, executive resume, positioning, outreach, interview preparation, and verification questions before the system has chosen how to pursue the role.
- A packet can be described as ready for review while most individual documents remain evidence-blocked.
- `matched_fact_ids > 0` is insufficient for release.
- The browser can send only a subset of loaded source documents; generation should fetch exact immutable dependencies server-side.
- Version numbering and multi-record persistence are client-calculated and non-transactional.

**Recommendation**

Make **pursuit strategy** the gate before writing. Valid states:

1. Pass or archive
2. Evidence interview first
3. Recruiter exploration
4. Warm introduction
5. ATS cold application
6. Executive-network outreach
7. Search-firm profile
8. Interview stage

Generate the minimum artifact set for that state. Treat a decision not to cold apply as a successful result.

### 5. Track applications and interviews — P0 incomplete

![Live Applications](screenshots/15-live-applications-desktop.png)

**What works**

- The live Whatnot record honestly preserves an unknown submitted date and exact submitted resume reference.
- Notes autosave and no external action is implied.

**What must improve**

- The query silently loads only eight applications.
- Clean `Interviewing`, `Follow-up due`, `On hold`, or `Closed` statuses can appear in neither current column.
- The editor has a hard-coded six-value list; a different stored value may visibly default to Applied.
- The product has no complete executive pursuit timeline showing channel, contacts, follow-up, rounds, submitted version, decision owner, outcome, and lessons.

**Recommendation**

Use one explicit stage model:

`researching -> preparing -> ready -> applied -> follow-up due -> recruiter conversation -> interviewing -> offer -> closed won/lost/withdrawn/on hold`

Keep `needs attention` as a separate flag. Every loaded record must render exactly once, active counts must come from the server, and archived history must remain searchable.

### 6. Work the daily queue — Useful but ambiguous

![Live Next actions](screenshots/18-live-next-actions-desktop.png)

The queue correctly leads with one action and bounds the rest. Live data showed repeated OpenAI review cards that were indistinguishable even if they represented different approvals or documents. Group by role and workflow, name the exact gate or artifact, and avoid duplicated-looking actions. The ideal daily surface is three classes only: **review a role, resolve evidence, advance a pursuit**.

### 7. Maintain the Career Canon — Major opportunity

![Live System summary showing Career Canon and Resume Lane counts](screenshots/17-live-system-desktop.png)

**What works**

- Verified, needs-review, and prohibited claims exist.
- The system preserves wording constraints and private-contact sensitivity.
- The Canon is already used in role qualification and material generation.

**What must improve**

- The flat list mixes private contact details, verified metrics, warnings, and prohibited claims.
- There is no visible source document, excerpt, authority, approved variant, prohibited variant, usage history, conflict, or role requirement.
- Direct reload shows zero Resume Lanes because required data is not loaded for the route.
- Canon inclusion is denylist-based in current packet code; unfamiliar or empty states can become usable. It must be an explicit approval allowlist.

**Recommendation**

Build a genuine evidence workspace. Each fact card should show:

- canonical claim
- explicit admissibility state
- ownership and attribution strength
- metric/date scope
- source document and excerpt
- authority and recency
- approved and prohibited wording
- sensitivity and permitted channels
- roles, documents, and claims using the fact
- conflicts and superseded facts
- one-click answer to a role evidence gap

Default to approved usable facts. Put private contact, needs-review, and prohibited data behind explicit tabs.

### 8. Operate the system — Valuable, too operator-heavy

![Live System](screenshots/17-live-system-desktop.png)

System correctly keeps health, sources, model runs, usage, and acceptance out of daily navigation. It still mixes knowledge, workflow operations, privacy, launch readiness, and debugging in one long hub. Split it into:

- **Knowledge:** Canon, lanes, playbooks, scoring and relocation preferences
- **Workflow operations:** searches, approvals, runs, costs, source health
- **Technical and trust:** auth, privacy, providers, retention, acceptance, deployment, debug

Most importantly, generate acceptance from evidence instead of hard-coded copy.

## UI and UX improvement plan

### Recommended information architecture

Keep the current six-item navigation, but make the role the organizing object across every daily screen:

| Surface | Primary question | Default content | Depth on demand |
|---|---|---|---|
| Roles | What deserves attention? | 3–5 Review today roles, saved, later, all | Filters, inventory diagnostics, source history |
| Next actions | What must happen now? | Review a role, resolve evidence, advance a pursuit | Role/workflow queue, due dates, waiting states |
| Find roles | What is new or changed? | Saved search, truthful current run, concise receipt | Sources, caps, failures, full accounting |
| Applications | Where are active pursuits? | Stage timeline and due actions | Contacts, submitted artifacts, interviews, outcome |
| Materials | What does this pursuit channel need? | Selected role, channel, one current artifact | Evidence, versions, comparisons, approvals, exports |
| System | What does the system know and can it be trusted? | Knowledge, Operations, Technical/Trust groups | Raw logs, source directory, costs, debug |

Within a role, use four tabs or anchored subviews:

1. **Decide:** source freshness, opportunity, qualification confidence, compensation, relocation, pursuit recommendation, decision, next action.
2. **Evidence:** requirement map, direct/transferable/gap/unknown, Job Brief, source snapshot and diff, Canon facts, evidence questions.
3. **Materials:** pursuit channel, required artifact set, current approved versions, blockers, semantic comparison.
4. **Track:** contacts, outreach, application, interview, waiting state, outcome, lessons.

This preserves the successful role-first reset while making the long detail workspace easier to reason about.

### Decision rail

Every serious role should have one persistent summary:

| Element | Required display |
|---|---|
| Source | Official/ATS/discovery/user-provided class, current/stale/changed, captured date |
| Review order | Curated priority plus top three reasons; never an unexplained “best” |
| Opportunity | Score or band, version, confidence, top upside and downside |
| Qualification | Direct/must-have/gap/unknown coverage, method, Canon revision |
| Economics | Base, package/OTE, upside evidence, confidence, verification question |
| Location | Work style, Arizona eligibility, relocation requirement, friction and package unknowns |
| Pursuit | Cold, warm, recruiter, search firm, evidence-first, pass |
| Next | One action with owner and due state |

### Role list

- Default to 3–5 `Review today` roles rather than 15 `Best roles`.
- Keep company, title, location, compensation, source state, opportunity band, qualification confidence, pursuit recommendation, and changed/new badge.
- Replace `Strong Fit` with `Opportunity shape: strong` until qualification evidence is complete.
- Add user-controlled sorts: curated priority, opportunity, qualification, compensation, recency, location friction, pursuit cost.
- Make rank rationale visible without opening a drawer.
- Distinguish `new`, `materially changed`, and `reviewed unchanged`.
- Preserve list scroll, selected filters, and selected role on back navigation.

### Filters and search setup

- Keep only text search, saved view, location, compensation, and source completeness above the fold.
- Use a searchable multi-select for companies with saved cohorts such as Priority 25, Arizona, PE portfolio, marketplaces, and excluded companies.
- Convert freeform company and role-family textareas into named, cloud-synced search profiles after multi-user architecture exists.
- Keep the excellent compensation presets, but show the applied rule in plain language and one example.
- Add `Only changed since last review` and `Full posting ready` shortcuts.
- Do not rerender the entire app on every keystroke. Current `render()` replaces the full root DOM, which creates focus and editing risk. [Root render](/Users/matthewgrossman/Documents/GitHub/bamboo-private-apps/portal.js:1736)

### Materials workspace

- Lead with pursuit channel, exact usable/blocked document count, and one recommended action.
- Show `Artifact safe` separately from `Pursuit recommended`.
- Generate one document at a time unless the chosen channel explicitly needs a small packet.
- Present the employer-facing document first; keep prompts, model logs, raw evidence, and system history collapsed.
- Replace full side-by-side comparison with a semantic diff: claims, fact links, keywords, narrative, structure, length, page count, unresolved feedback.
- Let the user compare a current artifact with a baseline or independent human version.
- Show the signed approval snapshot and what invalidates it.

### Applications and interviews

- Use a timeline instead of a cleanup dashboard.
- Separate stage from needs-attention state.
- Show channel, recruiter/contact, last touch, next due action, submitted artifact version, posting freshness, interviews, outcome, and reason.
- Add structured interview preparation linked to specific requirement evidence and role stakeholders.
- Store interview notes as private candidate evidence; proposed new facts must enter Canon through review, not become facts automatically.
- Record outcome by channel and stage without attributing causality to a resume edit.

### Accessibility and responsive risks

These are risks requiring verification, not a compliance finding:

- No explicit `:focus-visible` or reduced-motion rule was found in the current CSS.
- Many tiny controls and metadata labels appear below comfortable executive-product target sizes.
- Selected navigation, decisions, filters, and lenses rely heavily on CSS classes rather than `aria-current` or `aria-pressed`.
- Full-root rerenders can produce excessive screen-reader announcements and lose focus.
- Long role and Canon pages create a substantial mobile scroll burden.

Required acceptance pass:

1. full keyboard journey
2. visible focus review
3. VoiceOver journey
4. automated accessibility scan
5. contrast measurement
6. 200% zoom
7. 320px reflow
8. 44px target-size review
9. reduced-motion preference
10. no horizontal overflow on all core states

## Job sourcing and opportunity-intelligence plan

### Principle

The sourcing goal is not maximum inventory. Indeed, LinkedIn, Jobright, Simplify, JobCopilot, and large job boards will win breadth and speed. The Engine should optimize for **3–5 decision-worthy executive opportunities per user per week**, each with enough source and evidence quality to support a real pursuit decision.

### Source hierarchy

| Tier | Source class | Product treatment |
|---|---|---|
| 1 | Employer careers and official ATS | Strongest provenance; eligible for full capture and material workflow |
| 2 | Retained-search or explicitly authorized mandate | High value; may be confidential and require a different evidence model than a public posting |
| 3 | Company-authorized marketplace or partner feed | Useful, but label the source relationship and verify employer identity |
| 4 | Search engine, LinkedIn, aggregator, newsletter | Discovery lead only; resolve to Tier 1–3 before deep scoring where possible |
| 5 | User-provided recruiter message, PDF, or manual note | Candidate-controlled private lead; preserve provenance and confidentiality |

Only Tier 1 should receive an unqualified official-source badge by default. LinkedIn guest endpoints or aggregator copies should never be silently upgraded to employer verification.

### Capture state model

Replace ambiguous booleans with explicit states:

1. `card_only`
2. `detail_partial`
3. `official_listing_verified_active`
4. `posting_complete`
5. `posting_complete_parsed`
6. `posting_changed`
7. `posting_stale_or_closed`
8. `capture_failed`

Completeness should depend on source, responsibilities, required qualifications, preferred qualifications where available, location/work style, compensation evidence, and captured timestamp—not character count alone.

### Incremental ledger

Use a shared schema across importer, Edge Functions, database, UI, tests, and acceptance. For each source run:

- requested sources
- exhausted sources
- truncated sources
- successful sources
- failed sources
- cards seen
- cards screened out
- identities observed
- new identities
- materially changed identities
- unchanged identities
- suppressed identities
- duplicates
- detail attempts
- complete captures
- partial captures
- capture failures
- deferred by cap
- scored roles
- cost

At the identity stage, `new + changed + unchanged + suppressed + duplicate + failed = identities observed` under one documented grain. Do not mix card-screening counts into that equation.

### Change detection and downstream invalidation

When a material posting change occurs:

1. preserve the prior immutable snapshot;
2. compute a human-readable semantic diff;
3. create a new source revision;
4. recalculate opportunity in either direction—never only keep the greater score;
5. stale the Job Brief, qualification map, pursuit recommendation, and all materials based on the earlier revision;
6. block employer-use export until revalidated or regenerated;
7. notify only when the change affects the decision.

### Coverage and refresh cadence

- Daily: active pursuits, Priority 25 companies, expiring/stale roles.
- Two or three times weekly: broader target-company cohort.
- Weekly: long-tail ATS and executive-role families.
- Event-driven: new CEO, funding, acquisition, operating crisis, expansion, new site, portfolio-company hiring, leadership exit.
- Manual/private: recruiter mandates, PE/VC portfolio roles, board/advisor referrals, executive communities.

Track `inventory exhausted` versus `inventory truncated`; never describe a provider-ordered first 220 cards as exhaustive.

### Hidden-market opportunity lane

The Engine will not own executive supply by adding public adapters alone. It needs a distinct private-opportunity object with:

- sponsor or recruiter source
- confidentiality state
- mandate summary
- company disclosure level
- relationship path
- evidence attachments
- compensation and location state
- next relationship action
- candidate consent and sharing rules

Do not force a confidential recruiter lead into the same schema as a public posting. Do not automatically message anyone.

### Adapter architecture

Incrementally split the importer into:

- generic Greenhouse, Lever, Ashby, Workday, SmartRecruiters, Phenom, Oracle, iCIMS/Jibe and first-party API adapters;
- a company/source configuration registry;
- normalized card and detail schemas;
- bounded-concurrency source jobs;
- resumable per-source checkpoints;
- source health SLOs;
- deterministic reconciliation as a separate stage;
- legal/terms notes and robots constraints per source.

This should happen after the receipt and provenance contract is stable. More adapters before trustworthy accounting will only create more ambiguous data.

## Scoring and executive decision support

### Stop using one idea of fit

The system should persist separate versioned objects:

- `opportunity_assessment`
- `qualification_assessment`
- `source_confidence`
- `compensation_assessment`
- `relocation_assessment`
- `curated_review_priority`
- `pursuit_strategy`
- `decision_record`

Each object should contain inputs, missing data, component reasoning, version, timestamp, source revision, Canon revision where relevant, method, and confidence.

### Opportunity assessment

Use an explainable weighted model, but expose the components:

- mandate scope and decision authority
- title/level and reporting line
- company quality and strategic context
- compensation evidence and upside
- location/relocation friction
- role-family relevance
- network leverage
- pursuit cost and timing
- downside/regret if ignored

The result may be a 0–100 score internally, but the interface should emphasize a band, confidence, and the top positive/negative drivers.

### Qualification assessment

Every material posting requirement should be:

- required, preferred, or contextual;
- direct, transferable, gap, or unknown;
- linked to specific approved Canon facts when direct or transferable;
- weighted by requirement importance;
- accompanied by evidence confidence and freshness.

Do not infer transferable from `needs_review`. Do not replace missing direct-strength or gap-risk components with the overall score. If the requirement map is incomplete, display **Qualification incomplete**.

### Pursuit strategy

Pursuit strategy is a recommendation, not another score. It should consider:

- qualification evidence
- role attractiveness
- source completeness
- relationship path
- competition and channel
- location and compensation uncertainty
- time cost
- whether a credible adjacent-fit story exists

The OpenAI case should be the canonical acceptance fixture:

- cold ATS application: no-go
- warm introduction: conditional go
- recruiter exploration: go
- better-aligned role search: recommended parallel action

### Calibration

Do not set aggressive score-performance targets until at least roughly 100 consistently labeled human role reviews exist across multiple role families. Before then:

- track reviewer agreement;
- track abstention and unknown rates;
- audit top-10 precision;
- sample filtered-out roles for missed winners;
- compare predicted pursuit recommendation with advisor judgment;
- record outcomes by channel;
- never claim a resume version caused an interview or rejection.

## Career Canon and evidence architecture

### Canon admissibility contract

Fail closed. A fact is usable only if all required fields pass:

- status explicitly `verified` or `approved`
- immutable candidate owner
- canonical claim
- source document ID and authority
- source excerpt or evidence note
- attribution/ownership strength
- relevant date or time scope
- sensitivity
- permitted document and channel use
- approved variants
- no unresolved conflict or supersession

Unknown, empty, draft, inferred, needs-review, prohibited, or superseded states must not become employer-facing evidence.

### Assisted evidence interview

The Canon must feel easier than maintaining a resume:

1. import user-provided resumes, LinkedIn export, bios, performance artifacts, deal sheets, board materials, and notes;
2. propose candidate facts with sources;
3. group duplicate or conflicting claims;
4. ask only high-value verification questions;
5. let the user approve, edit, prohibit, or defer;
6. link unresolved role requirements directly to an evidence question;
7. preserve candidate-controlled export and deletion.

For an executive, high-value questions are often about ownership, scale, team, economic impact, operating cadence, crisis action, systems created, stakeholder level, and exact dates—not keywords.

### Claim ledger

The generation and release unit should be:

`document -> sentence or factual clause -> fact IDs -> source documents -> attribution strength -> admissibility decision`

Every factual clause must resolve. Model-provided `unsupported_claims` is a useful signal, not the deterministic gate. One linked fact cannot make an entire document evidence-grounded.

### Evidence lifecycle

- Append-only fact and approval events
- Supersession rather than silent overwrite
- Expiry/review dates where facts can drift
- Conflict detection across sources
- Usage history by role and document
- Candidate-controlled sharing and revocation
- Full portable export
- Verified deletion and retention policy

## Resume and material-building operating model

### The core rule

**Start with decision and evidence, not prose.** A better writer cannot solve a missing-evidence problem.

### Recommended pipeline

1. Lock the official source snapshot and posting revision.
2. Parse mandate, responsibilities, required, preferred, context, location, and compensation.
3. Human-confirm the material requirements.
4. Map each requirement to direct, transferable, gap, or unknown evidence.
5. Ask targeted Canon questions for high-value unknowns.
6. Decide pursuit strategy and channel.
7. Create a deterministic content plan listing claims, fact IDs, narrative themes, keywords, and exclusions.
8. Generate one channel-appropriate artifact.
9. Run independent factual-integrity review.
10. Run role-coverage review.
11. Run executive-editorial review.
12. Run ATS/parser or channel-specific quality review.
13. Resolve feedback and create an immutable new version.
14. Approve a signed snapshot.
15. Export for manual handoff only.

### Distinct artifacts, not cosmetic variants

| Artifact | Purpose | Content system |
|---|---|---|
| ATS resume | Cold application through structured application systems | Standard headings, direct requirement proof, plain parsing, role keywords, no invented coverage |
| Executive resume | Executive reader and networking | Leadership thesis, mandates, scale, systems, governance, selective outcomes, two-page flexibility |
| Recruiter bio | Fast fit calibration | Lane, scope, signature evidence, compensation/location, constraints, target mandates |
| Warm-intro memo | Adjacent-fit argument | Why this role, strongest proof, honest bridge, precise ask, material gap acknowledged |
| Search-firm profile | Executive search relationship | Mandate families, scale, mobility, compensation, board/investor context, confidential preferences |
| Outreach | One recipient and one ask | Relationship context, relevant proof, why now, no generic cover-letter prose |
| Interview evidence pack | Interview preparation | Requirement-linked stories, source-backed metrics, stakeholder hypotheses, verification questions |
| Decision memo | Pursuit judgment | Upside, gaps, comp, relocation, relationship path, time cost, regret, recommendation |

### Resume content selection

For each role, choose three or four proof themes rather than trying to fit the whole Canon. A content-selection layer should optimize within a page/attention budget:

- evidence strength
- requirement relevance
- executive distinctiveness
- recency
- attribution safety
- narrative coherence
- keyword coverage
- redundancy cost

It should never upgrade transferable experience to direct experience merely because a keyword is valuable.

### Review gates

Factual integrity is binary and mandatory. Other dimensions can be scored:

1. **Factual integrity:** every claim admissible and mapped; prohibited claims zero.
2. **Direct role evidence:** required requirements with direct proof.
3. **Transferable bridge quality:** adjacent evidence is explicit and honest.
4. **Executive operating proof:** scale, ownership, systems, economics, leadership.
5. **ATS/parser quality:** only for ATS artifacts.
6. **Human scan and channel fit:** hierarchy, length, voice, intended reader.

A fact-safe 73/100 document may be exportable as an internal or recruiter artifact while remaining a cold-application no-go. The interface must say that plainly.

### Versions, feedback, and learning

- Allocate version numbers server-side in a transaction with a unique candidate/job/document-type/version constraint.
- Link immutable parent version, feedback records, source revision, brief revision, Canon snapshot, prompt/playbook/rules, provider/model, and hash.
- Compare semantic changes rather than only full documents.
- Promote rules only with explicit scope and provenance.
- Record recurrence count, conflicts, confidence, approver, last review, and examples.
- Let the user undo or expire a rule.
- Record outcomes as observations, not causal proof.

### Approval

Approval should create an append-only signed event containing:

- approver
- timestamp
- content SHA-256
- source/posting revision and hash
- Job Brief revision
- Canon snapshot and hash
- requirement-map revision
- pursuit channel and intended use
- provider/model/prompt/rule versions
- unresolved-risk count

Any content, source, Canon, or controlling-rule change invalidates the approval.

## Outreach, networking, interview, and decision support

### Outreach

Outreach should be recipient- and relationship-specific, not a generic generated email:

- recipient role and relationship path
- why this role/company now
- one or two relevant proof points
- honest adjacent-fit bridge
- precise low-friction ask
- approved contact channel
- candidate review and manual send

Create distinct playbooks for recruiter, retained search consultant, warm introducer, hiring executive, former colleague, investor/board contact, and peer operator. Do not message automatically.

### Relationship intelligence

Add relationship signals only after candidate consent and source governance:

- first-degree relationships
- alumni and prior-company overlap
- investor/board/advisor paths
- recruiter/search-firm history
- relevant communities
- prior conversations and promised follow-ups

The product’s advantage is not scraping more people. It is helping the candidate choose the right human path and prepare a credible ask.

### Interview preparation

Interview prep should come from the same requirement/evidence graph:

- top mandate hypotheses
- requirement-linked evidence stories
- direct versus transferable framing
- quantified facts with sources
- gaps to disclose or clarify
- stakeholder-specific questions
- compensation, level, location, and relocation questions
- role risks and decision criteria

Interview notes can propose new Canon facts, but those facts must be separately sourced and approved. No covert live-interview assistance should be built.

### Decision support

Every active pursuit should end in an explicit decision record:

- pursue, hold, pass, or withdraw
- chosen channel
- key evidence
- unresolved gaps
- compensation and relocation state
- relationship path
- time/cost estimate
- next action and due date
- decision rationale
- what would change the decision

That record is more valuable than a single fit score and creates the raw material for later calibration.

## Privacy, trust, legal, and automatic-action boundaries

### Current safe boundary

Keep the current rule: preparation inside the Engine, manual action outside it. Search, analysis, ranking, drafting, comparison, and approval are allowed; employer submission, email, LinkedIn messages, uploads, form submission, and live interview assistance remain outside the product unless a distinct future scope is deliberately approved.

This is commercially useful. Auto-apply is already crowded and creates platform-terms, factual, reputational, and irreversible-action risk. The competitive landscape confirms that automation is not a defensible moat.

### Before any external candidate data

The current one-user allowlist and RLS tests are not enough for a commercial beta. Prove:

1. tenant and candidate ownership model
2. row-level isolation across every table and RPC
3. Edge Function authorization under real second-account sessions
4. candidate-controlled export
5. verifiable deletion
6. retention schedule
7. model/provider registry
8. training and data-use posture
9. least-privilege support access
10. access and mutation audit logs
11. coach/advisor sharing permissions and revocation
12. backup/deletion behavior

No third-party executive PII should enter the current production environment until these pass.

### Plain-language trust center

For each data class, disclose:

- what is stored
- why it is needed
- who controls it
- who can see it
- provider and processing region
- model-training posture
- retention
- export
- deletion
- whether it can be shared with a coach or sponsor
- whether it can ever be sent to an employer

Outplacement and coach products require a particularly strict boundary: sponsor-safe aggregate reporting must never reveal candidate-private Canon facts, search activity, compensation preferences, drafts, interview notes, or messages without candidate consent.

### Source terms and capture lawfulness

- Prefer employer/ATS feeds and authorized APIs.
- Record terms/robots notes per adapter.
- Treat LinkedIn and aggregators as discovery leads unless a sanctioned interface or user-authorized capture supports more.
- Avoid credential sharing, unauthorized automation, or bypassing access controls.
- Preserve the source URL and attribution without republishing an entire posting outside legitimate candidate use.
- Obtain specialist privacy/employment/platform counsel before multi-user launch; this report is product analysis, not legal advice.

## Technical architecture and reliability

### Do not start with a rewrite

The product already has valuable behavior and a passing deterministic test suite. A framework migration would consume time while leaving the business and trust questions unresolved. Extract domains incrementally behind current tests.

### Frontend extraction order

1. `domain/application-state`
2. `domain/ranking`
3. `domain/source-readiness`
4. `domain/qualification`
5. `domain/document-release`
6. `domain/pursuit-strategy`
7. typed view models for Roles, Search, Materials, Applications, Canon
8. view-specific update/render modules
9. normalized status schemas
10. shared design tokens and component states

Remove full-root rerenders from input, autosave, and workflow polling. Add a query/data layer with total counts, pagination, loading, partial, stale, and error states.

### Backend extraction order

1. workflow state machine and atomic claims
2. source adapters
3. identity reconciliation
4. source snapshot and diff
5. opportunity and qualification assessments
6. Canon admissibility and claim ledger
7. document generation and critique
8. revision/approval/export transactions
9. usage and cost accounting

### Reliability contracts

- idempotency key per billable model step
- atomic lease/claim in the database
- exactly-once output persistence
- unique canonical approval per workflow/job/artifact
- server-allocated document versions
- append-only approval and export events
- immutable source, brief, Canon, and document hashes
- stale-state invalidation
- bounded retries with visible reasons
- cost ceiling enforced before the call
- no silent partial dataset counts

### Test gaps to close

- concurrent workflow advances
- every application record renders exactly once
- legacy and unknown status truth
- rank explanation and score order alternatives
- no client qualification fallback
- source receipt reconciliation
- changed posting can lower score and invalidates downstream artifacts
- restore survives reload and source refresh
- every factual clause maps to approved evidence
- approval invalidates on source/Canon/content change
- server-side transactional versioning
- keyboard/focus preservation while filtering and polling
- direct-route hydration does not flash false empty/zero states
- real cross-user isolation and deletion/export

## Commercial strategy

### Positioning

Do not position this as:

- AI resume builder
- job tracker
- auto-apply agent
- job board
- all-in-one career copilot
- multi-model job-search assistant

Recommended category language:

- **Executive Opportunity OS**
- **Evidence-Grounded Executive Search OS**
- **Private Executive Career Operating System**

Recommended core statement:

> A private executive opportunity system that verifies the role, verifies your evidence, recommends the right pursuit path, and builds only claim-safe materials you approve.

One-liner options:

1. **Know which executive roles are worth pursuing—and why—before you spend your reputation on them.**
2. **From official posting to evidence-backed decision and approved executive materials.**
3. **A private, source-first operating system for high-stakes executive career moves.**
4. **Your career evidence, opportunity decisions, and executive materials—grounded, versioned, and under your control.**

### Initial ideal customer

Highest-priority ICP:

- executive, founder-operator, or high-income professional in an active transition;
- compensation target high enough that a missed or mispositioned role is expensive;
- broad/transferrable operating experience that generic ATS tools undersell;
- willingness to invest in a 12-week search process;
- cares about discretion, evidence accuracy, and channel strategy;
- has enough source material and time for a guided Canon build.

Strong buying triggers:

- recent exit or role loss
- confidential search
- pivot from founder/operator to executive role
- relocation decision
- multiple plausible executive lanes
- high compensation or equity complexity
- repeated “interesting but not obvious fit” roles
- dissatisfaction with generic resume writers or mass-market AI

### Business model sequence

Start with one offer, not many simultaneous price tests:

**Hypothesis: 12-week Concierge Executive Search Pass**

- founder-led onboarding and Canon verification
- source-backed weekly opportunity briefs
- pursuit-channel decision support
- evidence-grounded materials
- weekly review session
- no employer actions
- candidate owns all evidence and outputs

Test a range around the prior report’s $2,500–$5,000 concierge hypothesis only after the trust gates pass. Track every staff minute, source/model cost, correction, support request, and approved artifact. If delivery remains above eight staff hours per client, embrace tech-enabled-service economics rather than pretending it is self-serve SaaS. See [pricing hypotheses](../executive-job-engine-competitive-landscape-2026-07-14/pricing-hypotheses.csv).

After the first five users:

- test a software-led 12-week pass around the prior $995 hypothesis;
- offer passive continuity only after a successful active search;
- defer coach/outplacement workspaces until individual value is proven;
- keep retained-search candidate-care use in discovery only during year one.

### Buyer-channel implications

| Buyer | Value | Trigger | Product requirement | Risk |
|---|---|---|---|---|
| Executive | Faster, safer pursuit decisions and stronger materials | Active high-stakes search | Near-zero setup friction, discretion, judgment | Canon becomes homework |
| Executive coach | More clients, less evidence and revision rework | Capacity ceiling | Candidate-controlled sharing, reusable playbooks | Coach prefers own workflow |
| Boutique outplacement | Premium executive tier and auditability | Need differentiation | Tenant isolation, sponsor-safe aggregate reporting | Candidate/sponsor confidentiality conflict |
| Search firm | Better candidate preparation and handoff | Candidate-care need | Never rank candidates for employer selection | Conflict with candidate-side trust positioning |

### Why this can fail

1. **The market hears “resume AI.”** The differentiated evidence system disappears behind commodity language.
2. **The Canon feels like homework.** Users return to a resume, ChatGPT, and spreadsheet.
3. **The inventory is broad but not valuable.** Hundreds of roles produce no better decisions than five good recruiter conversations.
4. **The score is not trusted.** Contradictory labels and unexplained precision undermine the whole system.
5. **The writing is safe but not competitive.** Missing evidence cannot be repaired with generation.
6. **The system is too bespoke.** Candidate-specific fields and one-user assumptions make every new customer a custom build.
7. **The product becomes a service without service pricing.** Human review destroys margin.
8. **The workflow double-charges or loses lineage.** One reliability failure can erase the trust wedge.
9. **Privacy claims are weaker than executive expectations.** One cross-user or retention issue is existential.
10. **The product builds features instead of distribution.** Coaches, recruiters, and executive networks own trusted channels.
11. **It learns the wrong lesson from sparse outcomes.** Rejections are noisy and channel dependent.
12. **It chases auto-apply.** The product abandons its safest differentiation and enters a crowded, risky category.

### What must be exceptional

- time to first useful source-backed role brief
- claim-level evidence integrity
- quality of pursuit recommendation
- executive narrative and channel fit
- clarity of rank, score, confidence, and unknowns
- source freshness and semantic change detection
- ease of Canon ingestion and maintenance
- immutable version and approval lineage
- privacy and candidate control
- ability to surface relationship-driven and hidden-market opportunities
- measured time and rework saved versus a credible human baseline

## The 24-hour go/no-go plan

The correct 24-hour outcome is a defensible decision, not a broad launch.

| Time | Work | Required proof | Stop condition |
|---|---|---|---|
| 0–2 | Freeze truth | HEAD, dirty diff, deployed asset hash, Edge versions, migrations, live counts, screenshots, canonical acceptance source | Any environment cannot be identified |
| 2–5 | Reconcile acceptance | Every failed/partial item labeled implemented, local proof, deployed, production accepted, or open | Code presence is being used as proof |
| 5–9 | Three critical journeys | Source-complete/high fit, source-complete/moderate fit, source-incomplete | Invalid gate advances or state is ambiguous |
| 9–11 | Concurrency | 20 concurrent/retried advances | More than one billable step, output, approval, or cost record |
| 11–13 | Search integrity | Reconciled ledger plus restore/reload/source-change proof | Unknown displayed as zero or counts do not reconcile |
| 13–15 | Trust semantics | Explained review order, no fallback qualification, distinct source/opportunity/qualification/pursuit states | User cannot explain the decision from UI |
| 15–17 | Application integrity | Complete retrieval/pagination, canonical status, every row renders once | Any record disappears or misstates status |
| 17–20 | Material strategy | Channel selected first; every factual clause mapped; exact usable/blocked counts | Any unsupported claim can be approved |
| 20–22 | Privacy | Real second-account denial, isolation, export, deletion, provider/retention registry | Any third-party data boundary remains unproven |
| 22–24 | Decision review | Written state-specific go/no-go, evidence links, rollback, owner, next date | Default to no external login |

### Required decisions at hour 24

- Matthew-only use: go/no-go
- sanitized demos: go/no-go
- external design-partner login: go/no-go
- three-user paid concierge beta: go/no-go
- broad launch: no-go unless every P0 unexpectedly passes and multi-tenant product work is complete

## 30/60/90/365 roadmap

### Days 0–30: prove the trust wedge

Deliver:

- reconciled generated acceptance ledger
- atomic workflow steps
- exact search accounting and restore proof
- source-state ladder and change invalidation
- explained review order and score provenance
- complete application stages and counts
- pursuit-channel gate
- per-clause evidence release gate
- usable/blocked document counts
- Canon allowlist and evidence workspace first slice
- tenant/candidate ownership design and real isolation tests

Exit gates:

- zero open P0s
- zero duplicate billable steps
- zero unsupported claims in 10 independently audited finals
- real cross-user isolation
- median concierge time to first useful Job Brief under 60 minutes
- no false empty/zero state in critical journeys

### Days 31–60: prove paid executive value

Deliver:

- maximum 5–10 founder-led paid users
- guided Canon import and evidence interview
- weekly source-backed role briefs
- channel-specific artifact generation
- blinded independent advisor review
- full human-time and cost accounting
- baseline-versus-Engine decision-time and rework study

Exit gates:

- at least 70% of qualified briefs produce a pursue/hold/pass decision without outside reconciliation
- at least 80% of materials pass first independent audit
- zero factual-integrity escape
- support and human time recorded completely
- users can explain why a role is ranked and why a channel is recommended

### Days 61–90: choose SaaS, service, or stop

Deliver:

- 60 qualified demos
- standardized onboarding
- source/model/human unit economics
- outcome and channel instrumentation
- score calibration baseline
- missed-winner audits

Exit gates:

- at least 15 paid customers from 60 qualified demos
- 60% weekly active use during active search
- 70%+ gross margin including human time
- zero high-severity privacy defect
- clear evidence that the Engine beats current ChatGPT/tracker/coach workflow

If those gates fail, narrow, reprice as a service, or stop.

### Months 4–6: prove repeatability

- automate the most expensive Canon/reconciliation work
- modularize high-risk domains
- calibrate opportunity and pursuit models
- add relationship and private-mandate capture
- publish provider, retention, and trust controls
- reduce material rework by 50% from baseline

### Months 7–9: test advisor distribution

- three paid coach or boutique outplacement pilots
- candidate-controlled sharing and revocation
- sponsor-safe aggregate boundaries
- reusable but governed playbooks
- require 30% more client capacity or 40% less review time

### Months 10–12: earn scale

- security hardening and role-based administration
- retention/deletion automation
- source-adapter SLOs
- continuity offer between active searches
- commercial operating playbook
- 70%+ gross margin
- 30%+ completion-to-renewal or qualified referral
- no unresolved high-severity authorization/privacy issue

## KPI framework

### Primary outcomes

1. **Decision-quality role rate**  
   Qualified roles reaching a clear pursue/hold/pass decision within ten review minutes, without external reconciliation, divided by qualified roles reviewed.

2. **First-pass claim-safe material rate**  
   Employer-ready documents passing independent factual and evidence-lineage audit on the first approval submission, divided by documents submitted for approval.

3. **Paid activation rate**  
   Paid users producing one source-backed decision and one approved, channel-appropriate artifact within seven days, divided by paid users started.

### Product drivers

| Metric | Definition | Initial gate |
|---|---|---|
| Decision-worthy yield | Human-pursued roles with complete source/brief per review hour | Baseline, then 2x current workflow |
| Full official evidence rate | Pursued roles with official/ATS URL, timestamp, snapshot, hash | 100% before materials, except explicitly labeled confidential mandates |
| Search ledger reconciliation | Identity observations in one terminal class | 100% |
| Change invalidation | Material changes that stale all dependent analysis/artifacts | 100% |
| Claim evidence coverage | Factual clauses with approved fact and source IDs | 100% |
| Time to channel-correct packet | Source capture to approved appropriate artifact after Canon baseline | Median under 30 minutes |
| First-pass advisor quality | Blind win/tie against current or credible human baseline | Hypothesis: 70%+ |
| Strategy agreement | User/advisor agreement with cold/warm/recruiter/no-go | Hypothesis: 80%+ |
| Rework | Major revisions and human edit minutes to approval | 50% below baseline |
| Human service cost | Staff hours per active client | Below business-model ceiling; otherwise price as service |

### Non-negotiable guardrails

- known unsupported claims in approved finals: **0**
- duplicate paid workflow steps: **0**
- unauthorized cross-user reads or writes: **0**
- unapproved employer-facing actions: **0**
- false merge of role identities: **0** in audited sample
- unexplained source/score/readiness state: **0** in audited critical journeys
- partial dataset presented as complete: **0**

## Prioritized action list

The full 61-item backlog is in [prioritized-backlog.csv](prioritized-backlog.csv). The top twelve are:

1. Reconcile one commit/deploy-bound acceptance ledger.
2. Prove atomic, idempotent billable workflow steps.
3. Require per-factual-clause Canon mapping before employer use.
4. Separate artifact integrity from pursuit recommendation.
5. Choose pursuit channel before generating materials.
6. Replace Best with explained Curated review order.
7. Remove client-generated qualification precision.
8. Fix application stages, status truth, pagination, and counts.
9. Unify the search receipt schema and prove restore.
10. Replace source-backed with a truthful source-state ladder.
11. Fix Canon route hydration and build the first real evidence card.
12. Prove tenant isolation, candidate export, and deletion before external data.

## Kill or pivot criteria

After two focused cohorts, stop or materially pivot if:

- fewer than 15 paid customers emerge from 60 qualified demos;
- advisors consistently prefer credible human alternatives after two revisions;
- Canon/source upkeep consumes more time than the Engine saves;
- support effort prevents 70% gross margin at tested pricing;
- users cannot explain rank, evidence state, pursuit channel, or privacy boundary;
- source breadth does not produce 3–5 decision-worthy opportunities per week;
- factual-integrity escapes occur in approved finals;
- candidate isolation, deletion, or model-data governance cannot be made credible;
- demand is primarily for hidden auto-apply or covert interview assistance.

## Evidence and caveats

- Live behavior was inspected through the authenticated in-app Browser on 2026-07-15. No search, model build, application, employer action, mutation, or approval was triggered.
- The current private frontend working tree contained pre-existing modifications and untracked files; none were changed.
- The current deterministic frontend/importer checks passed, but no live Supabase migration, Edge concurrency, paid model run, or destructive deletion test was performed.
- Code presence is not production acceptance.
- The competitive review is a public-source sample of 77 meaningful products and services, not a census and not proof that no private product matches the stack.
- Market pricing and commercial gates are hypotheses, not forecasts.
- Accessibility items are risks requiring testing, not a compliance determination.
- Legal and privacy items are product requirements, not legal advice.

## Source appendix

### Product and code sources

- [Current private app README](/Users/matthewgrossman/Documents/GitHub/bamboo-private-apps/README.md)
- [Job Engine product reset](/Users/matthewgrossman/Documents/GitHub/bamboo-private-apps/docs/JOB_ENGINE_PRODUCT_RESET_PLAN_20260713.md)
- [Qualification evidence model](/Users/matthewgrossman/Documents/GitHub/bamboo-private-apps/docs/QUALIFICATION_EVIDENCE_MODEL_20260713.md)
- [Compensation search model](/Users/matthewgrossman/Documents/GitHub/bamboo-private-apps/docs/COMPENSATION_SEARCH_MODEL.md)
- [MVP acceptance matrix](/Users/matthewgrossman/Documents/GitHub/bamboo-private-apps/docs/MVP_ACCEPTANCE_MATRIX.md)
- [July 14 resume-system acceptance matrix](/Users/matthewgrossman/Documents/GitHub/bamboo-private-apps/docs/audits/2026-07-14-resume-system/ACCEPTANCE_MATRIX.md)
- [OpenAI resume evidence audit](/Users/matthewgrossman/Documents/GitHub/bamboo-private-apps/docs/audits/2026-07-14-resume-system/OPENAI_RESUME_EVIDENCE_AUDIT.md)
- [Current frontend source](/Users/matthewgrossman/Documents/GitHub/bamboo-private-apps/portal.js)
- [Current styles](/Users/matthewgrossman/Documents/GitHub/bamboo-private-apps/portal.css)
- [Source-first importer](/Users/matthewgrossman/Documents/GitHub/bamboo-private-apps/scripts/source-first-role-importer.mjs)
- [Production URL](https://app.bamboo.holdings/)

### Market sources

- [Full 77-product competitive report](../executive-job-engine-competitive-landscape-2026-07-14/report.md)
- [Competitor inventory](../executive-job-engine-competitive-landscape-2026-07-14/competitors.csv)
- [Closest-threat feature matrix](../executive-job-engine-competitive-landscape-2026-07-14/feature-matrix.csv)
- [Primary URL appendix](../executive-job-engine-competitive-landscape-2026-07-14/sources.csv)
- [Indeed Apply For Me](https://www.indeed.com/news/releases/indeed-tests-apply-for-me-job-search)
- [LinkedIn Premium Career](https://premium.linkedin.com/careers/career)
- [Teal](https://www.tealhq.com/)
- [Jobscan Auto Apply](https://www.jobscan.co/auto-apply)
- [JobCopilot](https://jobcopilot.com/)
- [Jobright](https://jobright.ai/)
- [ExecuNet](https://www.execunet.com/)
- [Korn Ferry Advance](https://www.kornferry.com/capabilities/leadership-professional-development/korn-ferry-advance)

**Access date for live product and local code:** 2026-07-15.  
**Access date for public market sources:** 2026-07-14 unless the linked competitive appendix states otherwise.
