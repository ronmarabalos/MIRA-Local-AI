# Specification: Universal AI-Driven Development Foundation

**Date:** 2026-09-25  
**Target Repository:** `Yzentic-setup`  
**Status:** Approved for Implementation Planning  
**Target Agent Platforms:** Google Antigravity, Anthropic Claude Code, Cursor AI, and Stably Orca

---

## 1. Executive Summary

This specification establishes a standardized, cross-platform foundation for AI-driven software development within the `Yzentic-setup` repository. 

Rather than relying on tool-specific or monolithic configurations that bloat the agent context window, this design implements a modular, hierarchical architecture. It provides:
1. Universal root rules via [`AGENTS.md`](../../../AGENTS.md) with lightweight compatibility links for platform-native discovery (`GEMINI.md`, `CLAUDE.md`, `.cursorrules`).
2. Progressive disclosure skills located in [`.agents/skills/`](../../../.agents/skills/) to load execution workflows only when explicitly triggered.
3. Structured AI-friendly documentation and engineering guidelines in [`docs/ai/`](../../ai/) and [`docs/specs/`](../../specs/).

---

## 2. Architecture & File Hierarchy

```text
Yzentic-setup/
├── AGENTS.md                  # Root universal configuration and behavioral contract
├── GEMINI.md                  # Antigravity & Gemini CLI pointer
├── CLAUDE.md                  # Claude Code pointer
├── .cursorrules               # Cursor AI pointer
├── .agents/
│   └── skills/                # Open agent skills directory
│       ├── spec-driven-dev/
│       │   └── SKILL.md       # Requirements -> Spec -> Plan -> Verification workflow
│       ├── verification-gate/
│       │   └── SKILL.md       # Evidence-before-assertions pre-commit checks
│       └── multi-agent-handoff/
│           └── SKILL.md       # Inter-agent protocol & state serialization
└── docs/
    ├── ai/
    │   ├── agent-handbook.md  # CLI environment, navigation rules, and tooling conventions
    │   ├── workflows.md       # TDD cycles, branching strategies, and task tracking
    │   └── architecture.md    # Modularity boundaries and system design principles
    ├── specs/                 # Permanent repository for feature specifications
    └── superpowers/
        └── specs/             # Superpowers framework design specifications
```

---

## 3. Core Component Specifications

### 3.1 Universal Rules Layer

* **[`AGENTS.md`](../../../AGENTS.md):**
  - **Behavioral Tenets:**
    - *Evidence Before Assertions:* Every claim of success, bug fix, or task completion must cite deterministic command output (test results, exit codes, build status).
    - *Navigable Links:* All references to file paths and code symbols must use standard `file://` markdown hyperlinks.
    - *Task Tracking:* Multi-step work requires maintaining explicit markdown checklist artifacts (`- [ ]` / `- [x]`) updated continuously.
  - **Environment Standards:**
    - Operating System detection and path normalization (handling Windows backslashes vs. URI forward slashes).
    - Terminal command safety: Non-interactive execution, UTF-8 output encoding (`$env:PYTHONIOENCODING="utf-8"`).
  - **Discovery Pointers:**
    - Explicit directions to `.agents/skills/` and `docs/ai/` guides.

* **Compatibility Pointers:**
  - **[`GEMINI.md`](../../../GEMINI.md):** Imports/directs Antigravity and Gemini CLI agents to adhere to `AGENTS.md`.
  - **[`CLAUDE.md`](../../../CLAUDE.md):** Directs Claude Code to `AGENTS.md` and provides quick-command shortcuts.
  - **[`.cursorrules`](../../../.cursorrules):** Informs Cursor agent models to follow conventions in `AGENTS.md`.

---

### 3.2 Progressive Skills Layer (`.agents/skills/`)

Each skill directory contains a `SKILL.md` formatted with standard YAML frontmatter (`name`, `description`) for progressive disclosure:

1. **`spec-driven-dev` (`.agents/skills/spec-driven-dev/SKILL.md`)**
   - **Name:** `spec-driven-dev`
   - **Description:** Multi-step workflow for turning requirements into formal specifications, implementation plans, and verified deliverables.
   - **Sections:**
     - Scope classification (Spike vs. Bounded vs. Architectural).
     - Specification schema (Summary, Goals, Non-Goals, Architecture, Testing, Security).
     - Execution gate: Requiring user approval prior to writing code.
     - Incremental test-backed delivery.

2. **`verification-gate` (`.agents/skills/verification-gate/SKILL.md`)**
   - **Name:** `verification-gate`
   - **Description:** Mandatory pre-completion checklist enforcing automated test execution, linting, and diff verification before committing.
   - **Sections:**
     - Test run inspection (parsing exit codes and output).
     - Working tree cleanup (checking for rogue temporary files, scratch scripts, or debug logs).
     - Structured verification report format.

3. **`multi-agent-handoff` (`.agents/skills/multi-agent-handoff/SKILL.md`)**
   - **Name:** `multi-agent-handoff`
   - **Description:** Protocol for serializing agent state, branch/worktree references, and remaining tasks during handoffs between subagents or orchestrators (e.g., Orca).
   - **Sections:**
     - Standardized handoff markdown artifact template.
     - Resumption instructions for the incoming agent.
     - Worktree merge and reconciliation checklist.

---

### 3.3 Documentation System (`docs/`)

1. **`docs/ai/agent-handbook.md`:**
   - Onboarding guide for new agent sessions.
   - Repository navigation rules, project directory map, and terminal command conventions.
   - Safe practices for modifying files and requesting human confirmation for destructive actions.

2. **`docs/ai/workflows.md`:**
   - Test-Driven Development (TDD) red-green-refactor cycle.
   - Git branching strategies (`feature/*`, `fix/*`), conventional commit standards (`feat:`, `fix:`, `docs:`, `chore:`), and git worktree isolation.
   - Checklist-driven task execution.

3. **`docs/ai/architecture.md`:**
   - Architectural principles: high cohesion, low coupling, single responsibility per module.
   - File length and readability thresholds (guidelines on refactoring files exceeding 300 lines).
   - Guidelines for integrating future service layers (APIs, databases, frontends).

---

## 4. Verification and Acceptance Criteria

1. **Hierarchy Integrity:** All specified files and directories exist in the expected paths.
2. **Skill Standard Compliance:** Every `SKILL.md` contains valid YAML frontmatter that parses cleanly and can be discovered by Antigravity, Claude Code, Cursor, and Orca.
3. **Cross-Platform Compatibility:** Pointers (`GEMINI.md`, `CLAUDE.md`, `.cursorrules`) accurately reference `AGENTS.md` without broken relative links.
4. **Git State:** All files are cleanly staged and committed with a conventional commit message.
