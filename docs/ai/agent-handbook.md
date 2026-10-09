# AI Agent Handbook

This handbook serves as the operational onboarding manual and skills selection guide for all AI coding agents working within `dual-yzentic-setup`.

---

## 1. Initial Session Orientation

Whenever starting a new session or receiving a task in this repository:
0. **Inspect Project Blueprint:** Check [`project-blueprint.json`](../../project-blueprint.json). If `status === "uninitialized"`, ask the developer to define project name, stack, and team handles (or run `npm run init:project`) before editing code.
1. **Inspect Git Status:** Run `git status` to verify current branch and uncommitted modifications.
2. **Review Recent Changes:** Check `git log -n 5 --oneline` to understand recent commits.
3. **Check the Universal Living Roadmap:** Consult [`docs/PLAN.md`](../PLAN.md) to understand current sprint priorities (`P0`, `P1`, `P2`) and assignees.
4. **Inspect Sync Bus:** Check [`.agents/sync/handoff.json`](../../.agents/sync/handoff.json) using `npm run sync:status`.
5. **Locate Skills:** Review available procedural skills in [`.agents/skills/`](../../.agents/skills/).
6. **Check Domain Rules:** Before building screens, storage, model, or native code, check [`docs/rules/README.md`](../rules/README.md).
7. **Check the Visual Design:** Before building or reviewing any screen or component, read [`docs/design/README.md`](../design/README.md) and the matching board in [`docs/design/screens/`](../design/screens/).

---

## 2. CLI Execution & Platform Conventions

### Execution Guidelines
- Run non-interactively (`PAGER=cat`, non-blocking flags).
- All file paths and code symbols MUST be formatted as clickable markdown links using the `file://` scheme.
- Verification is performed via the Baton Coordinator:
  ```bash
  npm run verify:agent
  ```

---

## 3. Communication & Safety Guardrails
- **Destructive Actions:** Stop and request explicit user confirmation before deleting files, dropping tables, or force-pushing.
- **Zero Secret Exposure:** Never display, print, or leak contents of `.env` files or API credentials into logs or chat. Use [`varlock`](../../.agents/skills/varlock/SKILL.md).
- **Conciseness:** Keep responses concise, evidence-driven, and focused on working deliverables.

---

## 4. Skills Quick-Selection Guide ("When to Use What")

### Core Process Skills (Superpowers Framework)

| Scenario / Task | Process Skill | Purpose |
| :--- | :--- | :--- |
| **Starting any turn / prompt** | `superpowers:using-superpowers` | Check and invoke applicable skills BEFORE any response or action |
| **New feature, idea, or creative work** | `superpowers:brainstorming` | Mandatory discovery of intent, requirements, and design before implementation |
| **Multi-step implementation planning** | `superpowers:writing-plans` | Mandatory implementation plan generation for multi-step tasks |
| **Executing implementation plans** | `superpowers:executing-plans` | Deterministic inline task execution with strict per-task verification |
| **Writing or modifying any code** | `superpowers:test-driven-development` | Mandatory Red-Green-Refactor test cycle (Tier 2/3 tasks) |
| **Bug fixing or troubleshooting** | `superpowers:systematic-debugging` | Root-cause investigation before proposing fixes (no guessing) |
| **Pre-completion claim** | `superpowers:verification-before-completion` | Pre-completion evidence gate (verify tests before claiming complete) |

---

### Hackathon & Domain Skills ([`.agents/skills/`](../../.agents/skills/))

| Scenario / Task | Recommended Skill | Purpose |
| :--- | :--- | :--- |
| **Token defense on Claude Pro** | [`caveman`](../../.agents/skills/caveman/SKILL.md) | Strips conversational filler, saves ~70% output tokens |
| **Minimalist coding & anti-over-engineering** | [`ponytail`](../../.agents/skills/ponytail/SKILL.md) | "Lazy senior developer" mode: smallest workable diff, no bloated libraries |
| **Design intelligence (React, Tailwind, Shadcn)** | [`ui-ux-pro-max`](../../.agents/skills/ui-ux-pro-max/SKILL.md) | Searchable design tokens, color palettes, typography, and UX patterns |
| **Award-winning UI polish & accessibility** | [`impeccable`](../../.agents/skills/impeccable/SKILL.md) | Precision commands: `/impeccable polish`, `bolder`, `quieter`, `audit` |
| **System architecture & sequence diagrams** | [`archify`](../../.agents/skills/archify/SKILL.md) | Generates interactive, visual architecture diagrams for judge slide decks |
| **3-minute hackathon pitch & demo flow** | [`pitch-architect`](../../.agents/skills/pitch-architect/SKILL.md) | Structured pitch formulas, live demo script, and judge Q&A preparation |
| **Realistic mock & seed data for demos** | [`demo-seed-data`](../../.agents/skills/demo-seed-data/SKILL.md) | Populates dashboards with avatars, realistic names, dynamic metrics |
| **Micro-tasks, cosmetic CSS & quick fixes** | [`fast-track`](../../.agents/skills/fast-track/SKILL.md) | Express-lane protocol for token-efficient edits without test ceremony |
| **Web application browser testing** | [`webapp-testing`](../../.agents/skills/webapp-testing/SKILL.md) | Headless Playwright automation and DOM verification |
| **Managing API keys & secrets safely** | [`varlock`](../../.agents/skills/varlock/SKILL.md) | Zero-leak secret management |
| **Security audit, auth, crypto** | [`owasp-security`](../../.agents/skills/owasp-security/SKILL.md) | Audit against OWASP Top 10 |

---

## 5. MIRA Domain Rules ([`docs/rules/`](../rules/README.md))

| Task / Scope | Rule File | Focus & Standards |
| :--- | :--- | :--- |
| **Feature Scoping & Acceptance Criteria** | [`requirements.md`](../rules/requirements.md) | Given/When/Then criteria, five screen states including offline, source and correction requirements, Definition of Done |
| **App Screens & Components (React Native)** | [`frontend.md`](../rules/frontend.md) | Structure, SQLite as source of truth, Material 3 components, theme tokens, the source rule, accessibility, performance |
| **On-Device Data, Model, Native & Security** | [`backend.md`](../rules/backend.md) | Boundary validation, result codes, SQLite transactions, model input and output, rule-engine hard limits, Kotlin bridge, no-internet release |
