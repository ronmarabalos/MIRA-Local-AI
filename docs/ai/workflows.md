# Engineering Workflows & The Superpowers Lifecycle

This document defines the core development lifecycle for `Yzentic-setup`. It unites the **Superpowers** process engineering system with repository-specific domain skills.

---

## 1. Tiered Execution Lifecycle

To balance engineering rigor with token efficiency and speed, tasks follow one of three lifecycle paths based on scope:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ TIER 1: EXPRESS LANE (Micro-Tasks & Styling)                           │
│ Trigger: /fast-track, CSS tweaks, copy updates, icon swaps             │
│ Flow: Locate & Edit -> Scoped Check (diff/single test) -> Fast Commit  │
│ Exemption: Bypasses Red-Green TDD, full test suites, & npm run build   │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ TIER 2: BOUNDED LANE (Component Features & Bugfixes)                   │
│ Trigger: Single component logic, localized API route, targeted bug     │
│ Flow: Short in-chat design -> Scoped TDD on touched test -> Commit     │
│ Rule: Red-Green-Refactor on the specific feature test only             │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ TIER 3: ARCHITECTURAL DEEP LANE (Major Features & Refactors)           │
│ Trigger: Schema changes, auth, multi-file features, breaking changes   │
│ Flow: Full 5-phase Superpowers Lifecycle (see below)                   │
└────────────────────────────────────────────────────────────────────────┘
```

### The End-to-End Superpowers Lifecycle (Tier 3)

Major architectural and multi-step tasks progress through this complete pipeline:

```text
1. BRAINSTORMING (superpowers:brainstorming)
   ├── Requirements discovery & edge-case mapping
   ├── Formulate technical design specification (docs/specs/)
   └── Human approval gate before implementation

2. PLANNING (superpowers:writing-plans / spec-driven-dev)
   ├── Generate structured implementation plan (docs/specs/)
   └── Define bite-sized, independently testable tasks

3. EXECUTION (executing-plans / subagent-driven-development)
   ├── Isolated git worktree per feature (superpowers:using-git-worktrees)
   ├── Strict Red-Green-Refactor TDD cycle (superpowers:test-driven-development)
   └── Continuous test execution and micro-commits

4. VERIFICATION & QUALITY GATE (verification-gate / verification-before-completion)
   ├── Run full test suite; verify exit code 0
   ├── Next.js production build: npm run build exit code 0
   └── Headless browser UI checks via Playwright (webapp-testing)

5. REVIEW & BRANCH FINISH (superpowers:finishing-a-development-branch)
   ├── Independent multi-perspective code review (requesting-code-review)
   └── Clean integration / PR preparation
```

---

## 2. Test-Driven Development (TDD) Rules

Enforced via `superpowers:test-driven-development`:
- **The Iron Law:** `NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST`.
- **RED:** Write a minimal failing test expressing the desired behavior.
- **VERIFY RED:** Run the test to confirm it fails for the expected reason.
- **GREEN:** Write the minimal implementation code to pass the test.
- **VERIFY GREEN:** Run tests to confirm clean passing output.
- **REFACTOR:** Clean up code while keeping tests green.

### Web Testing Pyramid
Web applications in this repository adhere to a three-tier testing pyramid:
- **Unit & Custom Hook Tests (Vitest):** Millisecond-fast execution of pure business logic, calculations, and custom React hooks.
- **Component & Interaction Tests (React Testing Library):** User-centric verification of UI rendering, form events, and accessibility attributes without mocking internal state.
- **End-to-End User Journeys (Playwright via [`webapp-testing`](../../.agents/skills/webapp-testing/SKILL.md)):** Headless browser automation verifying critical user paths (auth, multi-step checkout, forms, and all 4 UI states).

---

## 3. Systematic Debugging Rules

Enforced via `superpowers:systematic-debugging`:
- **Never guess or patch symptoms.**
- Investigate root causes using minimal reproduction scripts, inspection logs, and stack trace analysis.
- Formulate a testable hypothesis before writing any fix.

---

## 4. Git Hygiene & Branching Strategy

- **Feature Branches:** Create dedicated topic branches from `main`:
  ```bash
  git checkout -b feature/<descriptive-name>
  ```
- **Isolated Worktrees:** For parallel agent work or large refactors, use `superpowers:using-git-worktrees` or [`orca-cli`](../../.agents/skills/orca-cli/SKILL.md).
- **Conventional Commits:** Format commit messages with clear semantic types (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).

### Pull Request & Pre-Merge Checklist
Before completing a task, opening a PR, or merging into `main`:
- [ ] **Automated Tests Green:** Full test suite executes cleanly with exit code 0 (`py -m unittest discover tests -v` / `npm test`).
- [ ] **Acceptance Criteria Met:** Feature satisfies Given/When/Then scenarios defined in [`docs/rules/requirements.md`](../rules/requirements.md).
- [ ] **The 4 UI States Handled:** Loading (skeletons), Empty, Error, and Success states verified.
- [ ] **Accessibility & Web Vitals:** Keyboard operable (WCAG 2.1 AA) with zero layout shift regressions (CLS < 0.1).
- [ ] **Zero Secret Leaks:** Zero credentials, tokens, or `.env` traces in commits or logs.

