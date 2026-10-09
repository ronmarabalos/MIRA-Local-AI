# Universal Living Roadmap & Feature Plan: mira

> **For Steve, Ronmar, and AI Agents:** This document is the single source of truth for the project. No feature is implemented without an entry here. Keep it updated after every completed task.

- **Project:** mira
- **Objective:** MIRA: a private on-device assistant that reads notifications from the apps you choose, reports what matters, and handles what you have approved. No internet access of its own.
- **Archetype:** mobile-local-ai
- **Last Synchronized:** 2026-10-09
- **Sync Protocol:** [`scripts/baton.mjs`](../scripts/baton.mjs) via `npm run verify:agent`

---

## Mission & Hackathon Objective

MIRA: a private on-device assistant that reads notifications from the apps you choose, reports what matters, and handles what you have approved. No internet access of its own.

---

## Rules for Adding Features

1. **No Rogue Work:** When either developer (or their AI agent) wants to add an idea, log it below with Priority and initial status `[ ] Backlog`.
2. **Prioritization Tiers:**
   - **`P0` (Must-Have for Demo):** The core loop required for judges to understand and experience the product.
   - **`P1` (High Impact Polish):** Visual enhancers, seed data, and animations that elevate demo day.
   - **`P2` (Post-Hackathon Stretch):** Features that can wait until after judging.
3. **No Fixed Owners:** Both developers are full stack and either can take any task. Tick a task off as soon as it is done.
4. **Git Sync Cadence:** Pull before starting a task; commit and push immediately upon completing a task (`git commit -m "feat: [feature name]"`).

---

## Current Sprint Focus

Active milestone: **Toolchain, design spec, and first-hour device checks**

Product summary: [`docs/mira-summary.md`](mira-summary.md). Design prompts: [`docs/mira-design-prompt.md`](mira-design-prompt.md), [`docs/mira-companion-prompt.md`](mira-companion-prompt.md). App code lives in [`mobile/`](../mobile/).

---

## P0: Must-Have for Demo

- [x] **Task 0.1: Workspace and React Native project initialised**
  - **Priority:** P0
  - **Status:** Done
  - **Description:** Blueprint set to `mobile-local-ai`; React Native 0.87.1 (TypeScript) scaffolded in `mobile/`, package `com.mira.app`.

- [ ] **Task 0.2: Android toolchain on the build machine**
  - **Priority:** P0
  - **Status:** In Progress
  - **Description:** Installed on Steve's machine: Android SDK in `~/Android/Sdk` (platform 37.0, build-tools 37.0.0, NDK 27.1.12297006, CMake 3.22.1, platform-tools) and JDK 17 in `~/.jdks`; Gradle configures the project. Remaining: first full build and install on the Infinix GT 20 Pro with `npx react-native run-android`. Ronmar's machine needs the same setup.

- [ ] **Task 0.3: Design spec and implementation plan**
  - **Priority:** P0
  - **Status:** In Progress
  - **Description:** Spec drafted at `docs/specs/2026-10-09-mira-design.md`, awaiting review. After approval, write the implementation plan. No feature code before this.

- [x] **Task 0.3a: MIRA design file added to the agent workflow**
  - **Priority:** P0
  - **Status:** Done
  - **Description:** Design file and its 27 unpacked boards are in [`docs/design/`](design/README.md), with tokens and a spec-screen-to-board map. `CLAUDE.md`, `GEMINI.md`, the agent handbook, and `docs/rules/` point to it. It decides visuals only; screens, navigation, and wording stay with the spec. Remaining: rewrite the visual sections of `docs/rules/frontend.md` and spec section 7 to match (they currently defer to the design by a precedence note), and add `mobile/src/theme/` tokens with the first screen.

- [ ] **Task 0.4: First-hour device checks**
  - **Priority:** P0
  - **Status:** Backlog
  - **Description:** On the Infinix: how much text and which chat name Messenger and Gmail notifications expose; whether notification reply works for Messenger; local model speed and accuracy on real messages.

- [ ] **Task 1.1: Notification listener and channel selection**
  - **Priority:** P0
  - **Status:** Backlog
  - **Description:** Kotlin notification listener exposed to React Native; per-app switches and permission levels; switched-off apps discarded unread.

- [ ] **Task 1.2: Local model and message records**
  - **Priority:** P0
  - **Status:** Backlog
  - **Description:** On-device model via llama.rn with constrained output; quick filter; one stored record per message; duplicate merging; SQLite storage.

- [ ] **Task 1.3: Today report, item detail, and Ask**
  - **Priority:** P0
  - **Status:** Backlog
  - **Description:** Daily report with each line tied to its source message; item detail; ask-your-messages with source shown.

- [ ] **Task 1.4: Rules, drafts, and approvals**
  - **Priority:** P0
  - **Status:** Backlog
  - **Description:** Rules stated in words, preview against past messages, rule engine in code, reply drafts for approval, reminders and calendar clash warnings, action log.

- [ ] **Task 1.5: No-internet build and privacy proof**
  - **Priority:** P0
  - **Status:** Backlog
  - **Description:** Release build without the INTERNET permission; privacy proof screen.

---

## P1: High Impact Polish

- [ ] **Task 2.1: Rules proposed from corrections**
  - **Priority:** P1
  - **Status:** Backlog
  - **Description:** After repeated edits or re-filing, propose a rule in plain words for approval.

- [ ] **Task 2.2: Companion, visual polish, and contrast pass**
  - **Priority:** P1
  - **Status:** Backlog
  - **Description:** Companion states (idle, listening, thinking, responding, offline); polish with ui-ux-pro-max and impeccable, to the MIRA design in [`docs/design/`](design/README.md).

- [ ] **Task 2.3: Share an image in, outage catch-up, and memory screen**
  - **Priority:** P1
  - **Status:** Backlog
  - **Description:** On-device text recognition for shared images; catch-up brief after reconnecting; "What MIRA knows" screen.

- [ ] **Task 2.4: Demo seed messages and rehearsal script**
  - **Priority:** P1
  - **Status:** Backlog
  - **Description:** Scripted message set for the student scenario, including the hostile message; backup recording.

---

## P2: Post-Hackathon Stretch

- [ ] **Task 3.1: Automatic replies, shared rule sets, spoken brief, PDF export**
  - **Priority:** P2
  - **Status:** Backlog
  - **Description:** One automatic reply type under approved rules; rule sets shared as a file; spoken morning brief; scheduled reports and PDF export.
