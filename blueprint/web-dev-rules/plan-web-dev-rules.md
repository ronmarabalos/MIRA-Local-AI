# Implementation Plan: Web Development Rules Directory (`docs/rules/`)

## Overview
- Establishes a streamlined, zero-redundancy `docs/rules/` directory providing production-grade development standards for modern full-stack web applications.
- Targets a modern TypeScript ecosystem: Next.js (React 19), Tailwind CSS, Node/Bun/Express, Prisma/Drizzle, and Zod.
- Maximizes token efficiency and avoids context bloat by consolidating web rules into 3 cohesive domain files (`requirements.md`, `frontend.md`, `backend.md`) plus a lean routing index (`README.md`).
- Eliminates redundancies with existing repository assets:
  - Consolidates web-specific testing tiers (Vitest, React Testing Library, Playwright) and PR templates into [`docs/ai/workflows.md`](file:///C:/Users/Admin/Yzen/Yzentic-setup/docs/ai/workflows.md) instead of creating duplicate standalone workflow files.
  - Consolidates web security (HttpOnly cookies, CSRF, CSP) into [`docs/rules/backend.md`](file:///C:/Users/Admin/Yzen/Yzentic-setup/docs/rules/backend.md) to complement existing [`owasp-security`](file:///C:/Users/Admin/Yzen/Yzentic-setup/.agents/skills/owasp-security/SKILL.md) and [`varlock`](file:///C:/Users/Admin/Yzen/Yzentic-setup/.agents/skills/varlock/SKILL.md) domain skills without overlap.
  - Consolidates Core Web Vitals directly with component lifecycle into [`docs/rules/frontend.md`](file:///C:/Users/Admin/Yzen/Yzentic-setup/docs/rules/frontend.md) to keep UI rules self-contained.
- Codifies guidelines as high-level architectural principles, dos/don'ts tables, and checklists without heavy inline code snippets to maximize glanceability and minimize token overhead.
- Implements an automated test suite in [`tests/test_rules_integrity.py`](file:///C:/Users/Admin/Yzen/Yzentic-setup/tests/test_rules_integrity.py) to guarantee all rule files exist, follow required section structures, contain zero broken links, and remain indexed across agent contracts.

## Expected Behavior
- AI agents and developers will have an explicit, non-overlapping single source of truth for modern web development practices in [`docs/rules/`](file:///C:/Users/Admin/Yzen/Yzentic-setup/docs/rules/).
- When an agent works on a user interface, it reads only [`docs/rules/frontend.md`](file:///C:/Users/Admin/Yzen/Yzentic-setup/docs/rules/frontend.md) to enforce server-first RSC, state boundaries, WCAG 2.1 AA accessibility, and Core Web Vitals.
- When an agent implements API endpoints or database mutations, it reads only [`docs/rules/backend.md`](file:///C:/Users/Admin/Yzen/Yzentic-setup/docs/rules/backend.md) for Zod validation, RFC error envelopes, Prisma/Drizzle transactions, and web security (HttpOnly cookies, CSRF, CSP).
- When receiving feature requests or drafting specs, agents consult [`docs/rules/requirements.md`](file:///C:/Users/Admin/Yzen/Yzentic-setup/docs/rules/requirements.md) to require structured user stories, Given/When/Then acceptance criteria, and explicit definitions for all 4 UI states (Loading, Empty, Error, Success) before coding.
- Running `py -m unittest discover tests -v` validates that all rule files exist, conform to required markdown sections, and maintain 100% valid cross-links.

## Implementation Plan
- **Create [`docs/rules/README.md`](file:///C:/Users/Admin/Yzen/Yzentic-setup/docs/rules/README.md):**
  - Acts as the directory entry point and quick index (~40 lines).
  - Contains an executive summary of web engineering principles.
  - Provides a task-based "When to Read What" routing table mapping specific developer tasks to the corresponding rule files.
- **Create [`docs/rules/requirements.md`](file:///C:/Users/Admin/Yzen/Yzentic-setup/docs/rules/requirements.md):**
  - Defines the standard PRD / User Story structure (problem statement, personas, scope boundaries).
  - Enforces Given/When/Then acceptance criteria and explicit handling for all 4 UI states (Loading, Empty, Error, Success).
  - Specifies Definition of Done (DoD) criteria and non-functional requirements (accessibility, performance, security).
  - Includes a Dos and Don'ts table for requirement scoping and feature boundaries.
- **Create [`docs/rules/frontend.md`](file:///C:/Users/Admin/Yzen/Yzentic-setup/docs/rules/frontend.md):**
  - Mandates a server-first React 19 architecture (default to RSC, restrict `"use client"` to interactive leaves).
  - Establishes clean state separation: server cache (Next cache/SWR) vs. local UI state (Zustand/hooks) with zero prop drilling.
  - Mandates mobile-first Tailwind CSS conventions and WCAG 2.1 AA accessibility (keyboard navigation, ARIA, focus traps).
  - Enforces Core Web Vitals thresholds (LCP < 2.5s, INP < 200ms, CLS < 0.1), Next.js Image component optimization, and bundle budgeting (max 150KB initial JS).
  - Includes a Dos and Don'ts table for component architecture, styling, and rendering performance.
- **Create [`docs/rules/backend.md`](file:///C:/Users/Admin/Yzen/Yzentic-setup/docs/rules/backend.md):**
  - Enforces mandatory Zod schema validation on all inputs (body, query, route parameters).
  - Standardizes RFC 7807 problem details and uniform JSON error envelopes (`{ error: { code, message, details } }`).
  - Defines conventions for Prisma/Drizzle transaction handling, cursor-based pagination, and idempotency keys on mutations.
  - Enforces web security guardrails: HttpOnly/SameSite/Secure cookies, CSRF protection on mutations, and Content Security Policy (CSP) headers.
  - Includes a Dos and Don'ts table for API endpoints, data access, and web security.
- **Update [`docs/ai/workflows.md`](file:///C:/Users/Admin/Yzen/Yzentic-setup/docs/ai/workflows.md):**
  - Enhance Section 2 ("Test-Driven Development") with the web testing pyramid: Vitest (unit/hooks), React Testing Library (component interactions), and Playwright (critical E2E user journeys).
  - Enhance Section 4 ("Git Hygiene & Branching Strategy") with a standardized PR template checklist including automated test evidence and review criteria.
- **Create [`tests/test_rules_integrity.py`](file:///C:/Users/Admin/Yzen/Yzentic-setup/tests/test_rules_integrity.py):**
  - Asserts that all 4 files (`README.md`, `requirements.md`, `frontend.md`, `backend.md`) exist in `docs/rules/` and have non-empty content.
  - Asserts that each rule file contains required standard sections (`Overview`, `Core Standards`, `Dos and Don'ts`).
  - Asserts that all markdown links within `docs/rules/*.md` resolve to valid disk paths without broken links.
  - Asserts that `AGENTS.md` and `docs/ai/agent-handbook.md` maintain active references to `docs/rules/`.
- **Modify [`AGENTS.md`](file:///C:/Users/Admin/Yzen/Yzentic-setup/AGENTS.md):**
  - Add `docs/rules/` to Section 4 ("Skills & Documentation Routing") as the source of truth for full-stack web standards.
- **Modify [`docs/ai/agent-handbook.md`](file:///C:/Users/Admin/Yzen/Yzentic-setup/docs/ai/agent-handbook.md):**
  - Update Section 1 ("Initial Session Orientation") to include checking relevant domain rules in `docs/rules/`.
  - Add a dedicated "Web Development Domain Rules" routing section cross-linking to each rule document.
- **Modify [`tests/test_docs_integrity.py`](file:///C:/Users/Admin/Yzen/Yzentic-setup/tests/test_docs_integrity.py):**
  - Add `docs/rules/README.md` to `files_to_check` for automated link integrity validation.

## Implementation Phases
- **Phase 1: Test Scaffold & Directory Foundation**
  - Create directory `docs/rules/`.
  - Implement test assertions in `tests/test_rules_integrity.py`.
  - Author `docs/rules/README.md` (index & "When to Read What" table) and `docs/rules/requirements.md` (PRD, UI states, Given/When/Then).
  - Run test suite to verify initial phase passing.
- **Phase 2: Domain Rule Implementation**
  - Author `docs/rules/frontend.md` (React 19, RSC, state boundaries, Tailwind, WCAG A11y, Core Web Vitals, Dos/Don'ts).
  - Author `docs/rules/backend.md` (Zod schemas, RFC error envelopes, Prisma/Drizzle transactions, pagination, HttpOnly cookies, CSRF, CSP, Dos/Don'ts).
  - Run test suite to verify rule file integrity passes.
- **Phase 3: Workflow & Testing Enhancements**
  - Update `docs/ai/workflows.md` to include the three-tier web testing pyramid (Vitest, RTL, Playwright) and the standardized PR checklist template.
  - Run `tests/test_docs_integrity.py` to confirm zero link breakage.
- **Phase 4: Harness Integration & Complete Verification**
  - Update `AGENTS.md` Section 4 to include `docs/rules/`.
  - Update `docs/ai/agent-handbook.md` with session orientation checks and the Web Development Domain Rules routing table.
  - Update `tests/test_docs_integrity.py` to include `docs/rules/README.md`.
  - Run complete test suite (`py -m unittest discover tests -v`) to confirm 100% green output across all tests.

## Testing Strategy
- **Automated Rule Suite (`tests/test_rules_integrity.py`):**
  - `test_all_rule_files_exist`: Asserts all 4 markdown files exist under `docs/rules/`.
  - `test_rule_files_structure`: Asserts every rule file contains required `# Overview`, `## Core Standards`, and `## Dos and Don'ts` headers.
  - `test_rules_markdown_links_are_valid`: Parses every markdown link in `docs/rules/*.md` and verifies local and `file://` targets exist on disk.
  - `test_harness_integration_links`: Verifies that `AGENTS.md` and `docs/ai/agent-handbook.md` contain valid links referencing `docs/rules/`.
- **Regression Suite (`tests/test_docs_integrity.py`, `tests/test_root_rules.py`, `tests/test_skills_structure.py`):**
  - Run entire test discovery suite to ensure zero regressions across existing tenets and skills.
- **Edge Cases:**
  - Case-sensitivity and Windows backslash vs. forward-slash URL normalization.
  - Relative link traversal between `docs/rules/` and `docs/ai/` or `AGENTS.md`.
  - Token consumption audit to verify that rule index files remain glanceable and concise.

## Open Questions
- None. All structural, architectural, testing, and routing specifications have been aligned through the blueprint Q&A.
