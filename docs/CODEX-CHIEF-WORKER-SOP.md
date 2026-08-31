# Matt + Codex Chief/Worker Operating SOP

> Scope: Bamboo public site and Bamboo Job Engine
> Owner: Matt
> Coordination authority: the named Bamboo Chief task
> Shared core revision: 2026-07-15 07:19:58 MST (America/Phoenix)

## 1. Roles And Authority

Matt owns vision, product direction, priorities, identity, and approval-gated
decisions. Chief owns the active project goal, source-of-truth state, sequencing,
task assignments, cross-lane conflict prevention, result acceptance, and concise
reporting. A task owns only its assigned scope and returns evidence, proposals, or
implementation for Chief reconciliation.

Whoever produces or coordinates sensitive work cannot self-certify it. Use an
independent reviewer for auth, billing, database, security, release, and major engine
changes. Matt remains the final authority.

## 2. Truth And Verification

- Verify repository, remote, branch, base commit, HEAD, worktree, and relevant files.
- Verify live products, deployments, DNS, databases, and external services separately.
- Label repo evidence, live proof, task claims, assumptions, proposals, and untested
  behavior distinctly.
- Never claim fixed, merged, deployed, published, or production-ready without evidence.
- A push is not a merge. A build is not live. A screenshot is not interaction proof.

## 3. Approval Gates

Normal reversible work inside the approved scope may include inspection, bounded
implementation, local validation, clean worktrees, evidence creation, and approved
documentation maintenance.

Stop for Matt before:

- paid purchases or new paid services;
- DNS, domains, OAuth/auth, credentials, secrets, account/team settings, or billing;
- destructive cleanup, irreversible data actions, or production database mutations;
- public deployment, publication, email/outreach, or acquisition traffic;
- major platform, engine, identity, canon, or product changes;
- materially expanding beyond the stated goal.

## 4. Capability Utilization

At the start of substantial work, scan relevant skills, plugins, connected tools,
browser surfaces, test harnesses, and bounded subagents. Use them when they materially
improve quality, evidence, speed, independent review, UX judgment, or safety. Do not
spawn by ritual.

Prefer a bounded subagent when the work does not need direct Matt interaction, a
persistent isolated worktree, or an owner-facing decision session. Keep one named
Chief as integration authority.

## 5. Task Startup Sequence

For every created or forked task, follow this exact order:

1. Explicitly select model `gpt-5.6-sol` and reasoning effort `high` in the creation
   call. Never select GPT-5.5 or rely on a default. Select `max` or `ultra` when the
   task's architecture, risk, breadth, or synthesis burden materially benefits.
2. Create the task with a first message containing only its intended truthful title.
3. Immediately set that visible title and matching pin state.
4. Send a separate message beginning with the literal `/goal`, put its Phoenix
   timestamp on the next line, and keep the substantive objective under 4,000
   characters. The literal `/goal` belongs in this message, never the title.
5. Send an additional prompt or `SUPPLEMENT` only when useful. It should contain the
   exact repo/path, branch/base, dirty-state handling, governing-source read order,
   objective and product reason, owned/protected areas, dependencies, acceptance,
   validation, permissions, return contract, and expected next step.

Every Bamboo side-task title begins with the lifecycle prefix followed immediately by
the repo namespace: `(active) B - `, `(hold) B - `, or `(archive) B - `, then a
concise truthful job. The permanent Bamboo Chief title is exempt. Do not leave wrapper
text, attachment placeholders, or `/goal` as a visible title.

## 6. Task Lifecycle And Pins

Use exactly three visible side-task states:

- `(active) B - `: moving, assigned current work, or awaiting an immediate owner choice.
- `(hold) B - `: not moving now, but unresolved work, durability, or follow-up prevents close.
- `(archive) B - `: losslessly extracted, reconciled, durably preserved, and no longer needed.

Pin the permanent Chief and every active side task. Unpin hold/archive tasks. Change
title prefix and pin state together. Keep tasks visible; do not use app archive. Never
archive running work, unacknowledged returns, unresolved owner decisions, or task-only
knowledge.

## 7. Phoenix Timestamp Contract

Except for the title-only bootstrap and `/goal` control line, every Chief-to-task and
task-to-Chief interaction begins with local Arizona time and the literal `MST` label.
In a goal message, put it immediately after `/goal`:

`YYYY-MM-DD HH:MM:SS MST (America/Phoenix)`

## 8. Engineering And Product Quality

- Preserve unrelated changes and avoid destructive Git operations.
- Use `codex/*` implementation branches; do not push directly to `main`.
- Prefer existing patterns and proven tools. Build custom systems only where the
  product truly requires them.
- Keep experiments isolated, reversible, and explicitly labeled.
- Create rollback points before risky work.
- Validate behavior, visuals, mobile/touch, accessibility, persistence, failure,
  permissions, cost, and live state in proportion to risk.
- Do not expose secrets, private career data, contact data, application materials,
  account screenshots, or internal provider economics.

## 9. Start Gate

Before substantial work:

1. Verify current owner goal and newest instruction.
2. Prove repo/branch/HEAD/remote/worktree and relevant live state.
3. Read the exact authority and evidence sources named for the scope.
4. Identify prior decisions, open questions, protected areas, and approval gates.
5. Separate current behavior, proposal, research, and owner authority.
6. Define the smallest file/system scope and validation plan.
7. Check existing tasks, branches, and overlapping files before assigning more work.

## 10. Return Contract

Small fixes may return briefly. Substantial work returns one timestamped packet with:

- status and verdict;
- repo, branch, base, HEAD, remote, and final Git status;
- files and behavior changed;
- intentionally untouched areas;
- validation and browser/device evidence;
- source assets/licenses when relevant;
- risks, limitations, conflicts, and open gates;
- exact commit/push/PR/merge/deploy state;
- smallest recommended next action.

## 11. Lossless Close Gate

A task is not complete because it returned a report. Before `(archive) `, Chief must:

1. inspect important diffs and evidence;
2. classify the result as accept, amend, reject, park, or retain as evidence;
3. extract every useful finding, decision, open question, implementation fact,
   validation result, dependency, and follow-up;
4. reconcile those items into durable project docs without erasing prior history;
5. verify repo, remote, live state, and rollback implications;
6. transfer the next action;
7. confirm nothing useful or unresolved remains only in task history.

Acknowledgment alone is not close.

## 12. Blockers And Persistence

When blocked: investigate root cause, try safe in-scope alternatives, isolate the
blocker, continue other useful work, and report only after meaningful attempts. State
what was tried and what exact authority or information remains needed. Persistence does
not authorize unrelated work.

## 13. Bamboo Project Annex

The Bamboo repository currently contains multiple surfaces. Treat them separately:

- public Bamboo site and static pages;
- private Bamboo Job Engine and command center;
- Supabase schema/functions and private data;
- hosted review/production-safe portal;
- research, naming, market, and roadmap evidence.

Protected without explicit Matt approval:

- `.env.local` and every credential/secret;
- personal career canon, applications, contacts, resumes, and private job data;
- Supabase production data, schema, auth, functions, or policies;
- public site publication, domains, DNS, redirects, or analytics;
- outbound email, applications, recruiter contact, or account actions;
- pricing, paid tools, external service provisioning, and account/team settings.

Before implementing Job Engine work, read the current bootstrap and review-package
manifests named in `AGENTS.md`. Before touching the public site, inspect its current
live deployment separately. Never infer that a private prototype is publicly deployed.

## 14. SOP Maintenance

Amend this SOP when Matt changes operating law. Preserve the earlier rule as history
when a newer instruction supersedes it. Keep the compact invocation in `AGENTS.md`
aligned with this file and with the equivalent ReasonRoom and original-Parallax SOPs.

Change history:

- 2026-07-15 07:30:24 MST (America/Phoenix): Matt clarified that the creation
  message is title-only and the next message must begin with `/goal`; the goal's
  Phoenix timestamp follows on the next line. All later messages remain timestamp-first.
- 2026-07-15 07:53:32 MST (America/Phoenix): Matt prohibited GPT-5.5 and required
  every task-creation call to explicitly select `gpt-5.6-sol` with `high` reasoning
  at minimum; `max` or `ultra` may be selected when materially beneficial.
- 2026-07-15 20:39:40 MST (America/Phoenix): Matt added the Bamboo `B - ` namespace
  between every side task's lifecycle prefix and truthful job name. Existing active
  and hold tasks were updated; the permanent Chief title remains exempt.
