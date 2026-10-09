# AGENTS.md — Universal Agent Instructions

Welcome to the `dual-yzentic-setup` repository. This repository implements an AI-driven dual-agent pair-programming standard where autonomous agents (Claude Code as Builder, Google Antigravity as Gatekeeper) collaborate seamlessly with human developers.

<CRITICAL-DIRECTIVES>
These rules are MANDATORY and NON-NEGOTIABLE. Violating the letter of the rules is violating the spirit of the rules. You CANNOT rationalize bypassing these gates.
</CRITICAL-DIRECTIVES>

---

## 1. Task Tiering & Execution Lanes

To prevent token waste and latency, all tasks are classified into three operational tiers supported natively by the Baton Coordinator (`npm run verify:agent`):

| Tier | Scope | Required Process & Verification |
| :--- | :--- | :--- |
| **Tier 1: Express Lane** *(Micro / Cosmetic)* | Pure CSS/Tailwind tweaks, copy/text edits, icon swaps, single-file non-structural adjustments. | Use [`fast-track`](.agents/skills/fast-track/SKILL.md). Auto-detected by `npm run verify:agent` or explicitly via `--tier 1`. **Exempt from Red-Green TDD, full regression runs, and production build.** |
| **Tier 2: Standard Bounded Lane** *(Component / Fix)* | Localized component logic, single API route, or isolated bug fix. | Scoped TDD on the affected test file. Verified via `npm run verify:agent --tier 2 --scope <path>`. |
| **Tier 3: Architectural Deep Lane** *(Full Features)* | Multi-file features, database schema/migrations, authentication, breaking architectural changes. | Full Superpowers lifecycle: Spec (`superpowers:brainstorming`) → Plan (`superpowers:writing-plans`) → Full TDD → Full regression suite via `npm run verify:agent --tier 3` → Production build. |

---

## 2. Hard Operational Gates

0. **Gate 0: Fresh Clone & Project Blueprint Intake**
   - On the very first session turn, inspect [`project-blueprint.json`](project-blueprint.json).
   - If `status === "uninitialized"`, DO NOT write code yet. Ask the user what they are building, their stack, and Dev 1 / Dev 2 names, or guide them to run `npm run init:project`.
1. **Gate 1: Mandatory Skills Discovery & Invocation**
   - Read [`docs/ai/agent-handbook.md`](docs/ai/agent-handbook.md) to discover and invoke required domain skills before beginning any non-trivial user task.
   - For Tier 1 micro-tasks, invoke [`fast-track`](.agents/skills/fast-track/SKILL.md).
2. **Gate 2: Spec & Plan First (Tier 2 & Tier 3)**
   - For any multi-step task, complete requirements discovery (`superpowers:brainstorming`) and write an implementation plan (`superpowers:writing-plans`) in [`docs/specs/`](docs/specs/) before editing code.
   - Synchronize all planned work in [`docs/PLAN.md`](docs/PLAN.md).
3. **Gate 3: The Iron Law of TDD (Tier 2 & Tier 3)**
   - NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST for logic, mutations, or endpoints (`superpowers:test-driven-development`).
4. **Gate 4: Systematic Root-Cause Debugging**
   - Never guess or blindly patch bugs. Investigate root causes with evidence before touching implementation (`superpowers:systematic-debugging`).
5. **Gate 5: Evidence Before Assertions**
   - Never claim code works without running verification output (`superpowers:verification-before-completion`).
   - Run `npm run verify:agent` to generate evidence in [`.agents/sync/handoff.md`](.agents/sync/handoff.md).

---

## 3. Core Behavioral Tenets

1. **Evidence before assertions:**
   - Always verify exit codes and output before declaring completion.
2. **Navigable file and symbol references:**
   - In repository documents, link files with relative paths (e.g. [`README.md`](README.md)) so links work on every machine; do not write absolute `file://` links into documents. In chat, format file paths and code symbols as clickable links to this checkout.
3. **Continuous task tracking:**
   - Maintain a markdown checklist (`- [ ]` / `- [x]`) tracking every phase of execution and keep [`docs/PLAN.md`](docs/PLAN.md) updated.
4. **Non-destructive & non-interactive execution:**
   - Always run commands non-interactively.
5. **Zero secret exposure:**
   - Never print raw `.env` contents, API keys, credentials, or tokens. Use [`varlock`](.agents/skills/varlock/SKILL.md) and review against [`owasp-security`](.agents/skills/owasp-security/SKILL.md).

---

## 4. Skills & Documentation Routing

- [`docs/PLAN.md`](docs/PLAN.md): **Universal Living Roadmap**. The single source of truth for features, priorities, and team sync.
- [`.agents/sync/`](.agents/sync/): **Dual-Agent Sync Bus**. Houses `handoff.json` and `handoff.md` managed by `scripts/baton.mjs`.
- [`docs/ai/agent-handbook.md`](docs/ai/agent-handbook.md): Skills catalog and routing index.
- [`.agents/skills/`](.agents/skills/): On-demand domain skills.
- [`docs/rules/`](docs/rules/README.md): MIRA development standards: requirements, app interface, and on-device data, model, native and security rules.
