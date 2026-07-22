# Bamboo site and Job Engine source adapter

This repository contains the Bamboo public site and source/evidence used by the
private Executive Job Engine. Keep public-site, private-portal, Supabase,
research, and release surfaces distinct. Work here does not silently authorize
or mutate `bamboo-private-apps`.

## Operating contract

Codex coordination is governed by the installed global `chief-control-room`
skill. External reviews use the installed `independent-review-panel` skill only
when the Chief router justifies them. Account transitions use the installed
`codex-account-hot-swap` skill. This file adds only Bamboo-specific routing and
safety; it does not duplicate those skills.

Task projection profile:

- `project_id`: `bamboo-job-engine`
- `creator_marker`: `🟢`
- `canonical_chief_title`: `🟢 ⚓ Bamboo Chief`

At a managed-task Start Gate, re-entry, and Return, bind only the applicable
installed skill identities. Full `chief-control-room` applies to the Chief and
delegated coordinator/integration lanes, not ordinary workers. The receiver
independently verifies the expectations and reads each applicable `SKILL.md`
plus topic-matched references. Routine messages in an unchanged task reuse the
accepted binding.

## Project truth

Read only the sources relevant to the current surface:

1. The current human-approved goal and its exact source/parent revision.
2. If present, `.private/project-bootstrap/executive-job-engine-project-bootstrap/00_READ_ME_FIRST.md` when Job Engine scope is involved.
3. If present, `.private/job-command-center/review-package/REVIEW_ME_FIRST.md`
   and its manifest when Job Engine scope or private-portal review is involved.
4. Relevant `docs/research/`, current code, tests, deployment configuration, and direct live evidence for the exact surface.
5. The `bamboo-private-apps` authority entrypoint and acceptance documents before proposing any change to that separate repo or its production surface.

Historical reports and prototypes are evidence, not automatic instructions.
The global skill governs coordination; these project sources govern Bamboo
truth. Neither may silently redefine the other.

If either `.private` authority/proof route is absent on the execution host,
treat that as an explicit continuity gap, not permission to reconstruct private
authority from research or transcript history. Remain read-only for any action
that depends on it until the project Chief restores or supersedes the route
through the project's own authority process.

## Repository controls

- Prove repo, branch, HEAD, remote, dirty state, worktrees, and active writer before writes.
- Preserve unrelated or concurrent work. Use one writer per checkout and isolate concurrent writers.
- Work on reviewed `codex/*` branches; do not push directly to `main`.
- Never expose or commit `.env.local`, secrets, private career data, resumes, application content, contact data, credentials, account screenshots, or internal provider economics.
- Validate browser, mobile/touch, accessibility, refresh/resume, failure, permissions, persistence, and rollback in proportion to the surface.
- Treat a build, screenshot, push, preview, deployment, and live acceptance as different facts.
- Before touching the public site, inspect its current live deployment separately; never infer that a private prototype is publicly deployed.

## Protected gates

Require the exact current human approval before payment or pricing changes, credentials,
account/team or identity changes, provider or external-service provisioning or spend
outside an accepted budget, auth/OAuth, database or Supabase data, schema, function, or
policy mutation, domains, DNS, redirects, analytics, deployment/publication, acquisition
traffic, outreach, applications, uploads, destructive action, major platform, engine,
canon, or product changes, or changes to private career data.

End substantive work with changed, verified, untouched, conflicts/unknowns,
durable receivers for every residual and substantive idea, remaining protected
gates, and the smallest next checkpoint.
