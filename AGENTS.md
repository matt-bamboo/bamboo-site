# AGENTS.md - Bamboo Job Engine Operating Law

This repository contains the Bamboo public site and the private Bamboo Job Engine.
Treat the private career system, public site, Supabase functions, hosted portal, and
release surfaces as distinct scopes. Do not let work in one silently change another.

## Read Order

1. `docs/CODEX-CHIEF-WORKER-SOP.md` - shared Chief/task operating contract.
2. The current goal and its named source packet.
3. `.private/project-bootstrap/executive-job-engine-project-bootstrap/00_READ_ME_FIRST.md`
   when the Job Engine is in scope.
4. `.private/job-command-center/review-package/REVIEW_ME_FIRST.md` and its manifest
   when reviewing the current private portal.
5. Relevant `docs/research/` packets for naming, market, architecture, or roadmap work.
6. Current code, tests, deployment config, and live evidence for the exact surface.

Historical reports and prototypes are evidence, not automatic implementation orders.
The newest direct Matt instruction controls when it conflicts with older plans.

## Chief And Task Startup

Use this exact sequence for every created or forked task:

1. Explicitly select model `gpt-5.6-sol` and reasoning effort `high` in the creation
   call. Never select GPT-5.5 or rely on a default. Select `max` or `ultra` when the
   task's architecture, risk, breadth, or synthesis burden materially benefits.
2. Create it with a first message containing only the intended truthful title, then
   immediately set that visible title and matching pin state. The title-only bootstrap
   is the narrow timestamp exception.
3. Send a separate message beginning with `/goal`, put its Phoenix timestamp on the
   next line, and keep the substantive objective under 4,000 characters. `/goal`
   belongs in the goal message, never the title.
4. Send an additional prompt or `SUPPLEMENT` only when useful for scope boundaries,
   exact sources, authority, dependencies, acceptance, validation, and return terms.

Every Bamboo side-task title carries the repo namespace immediately after its
lifecycle prefix: `(active) B - `, `(hold) B - `, or `(archive) B - `, followed by a
concise truthful job. The permanent Chief title is exempt. Pin active tasks. Unpin
hold tasks. Use archive only after Chief has losslessly extracted and durably captured
everything useful, then unpin it. Do not use app archive. Never stack prefixes or
leave wrapper, attachment, or `/goal` text as a visible title.

Except for the title-only bootstrap and `/goal` control line, every Chief-to-task and
task-to-Chief interaction begins with an America/Phoenix timestamp containing the
literal `MST`. In a goal message, put it immediately after `/goal`, for example:
`2026-07-15 07:19:58 MST (America/Phoenix)`.

## Authority And Safety

Matt owns product direction, priorities, public identity, publication, and every
irreversible gate. Chief owns coordination, source-of-truth reconciliation, scope,
sequencing, and acceptance. Tasks return evidence or implementation for Chief review;
they do not self-promote decisions.

Explicit approval is required before purchases, DNS, domains, auth/OAuth, credentials,
secrets, account/team settings, billing, destructive data operations, production
database changes, public deploys, email/outreach, or major product/identity changes.

Never expose `.env.local`, secret values, private career materials, contact data,
application content, account screenshots, or internal provider economics in code,
logs, screenshots, reports, commits, or task messages.

## Engineering And Verification

- Prove repo, branch, HEAD, remote, dirty state, and relevant live state before work.
- Preserve unrelated user or concurrent changes. Avoid destructive Git operations.
- Work on `codex/*` branches for implementation; do not push directly to `main`.
- Prefer existing patterns and proven libraries. Keep experiments isolated and reversible.
- Validate in proportion to risk, including browser, mobile, touch, accessibility,
  refresh/resume, failure, permissions, and rollback when relevant.
- A local build is not a live deploy. A screenshot is not interaction proof. A push is
  not a merge. State these distinctions plainly.

## Close Gate

Before marking work complete or changing a task to `(archive) `:

1. Inspect important diffs and evidence.
2. Reconcile every useful finding, decision, open question, implementation fact,
   validation result, dependency, and follow-up into durable project docs.
3. Preserve contradictions and supersessions instead of rewriting history away.
4. Verify repo/remote/live state and what was not touched.
5. Transfer the next action and confirm no useful context remains only in task history.

End substantial returns with what changed, what was verified, what was not touched,
remaining gates, and the smallest recommended next step.
