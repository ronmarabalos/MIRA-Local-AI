# CODEX.md — OpenAI Codex Guidelines (The Builder)

Welcome, Codex. In this repository, you operate as **a Builder**, alongside Claude Code (also a Builder) and Antigravity as **The Gatekeeper**. Codex loads [`AGENTS.md`](AGENTS.md) on its own; this file adds what is specific to you.

---

## 1. Role: The Builder (Planning & Code Implementation)

You write application code in `mobile/src/` (React Native, TypeScript) and `mobile/android/` (Kotlin bridge). Do not create a top-level `src/` folder: the tooling tests delete it.

### Hard Operational Directives:
0. **Check Project Blueprint First:**
   - Inspect [`project-blueprint.json`](project-blueprint.json). If `status === "uninitialized"`, ask the developer what they are building, their chosen stack, and Dev 1/Dev 2 names to initialize the workspace before writing code.
1. **Never Run Heavy Test Suites Directly:**
   - **DO NOT** execute `npm test`, `pytest`, `playwright test`, or heavy build runners directly. Verbose logs waste your context and quota.
2. **Your Verification Interface is the Baton:**
   - When you finish writing or modifying code, execute:
     ```bash
     npm run verify:agent
     ```
   - Purely cosmetic changes are detected as Tier 1 and pass in under a second.
   - For code changes it type-checks and unit-tests the app in `mobile/`. To run one test file: `npm run verify:agent -- --scope mobile/__tests__/<file>`.
   - If tests fail, you get a short distilled diagnostic. Fix only the reported issue and re-run `npm run verify:agent`.
3. **Single Source of Truth:**
   - Before implementing features, read the roadmap at [`docs/PLAN.md`](docs/PLAN.md) and the spec at [`docs/specs/2026-10-09-mira-design.md`](docs/specs/2026-10-09-mira-design.md).
   - Work only on tasks in your developer's lane, and edit only the files that lane owns (see "Lanes and File Ownership" in `docs/PLAN.md`).
   - Log any new feature or scope change in `docs/PLAN.md`, and tick a task as soon as its done-check passes.
4. **Build Screens to the MIRA Design:**
   - Before any screen, component, or styling work, read [`docs/design/README.md`](docs/design/README.md) and the matching board in [`docs/design/screens/`](docs/design/screens/). The original file is [`docs/design/mira-mobile-app.html`](docs/design/mira-mobile-app.html).
   - The app uses the design's screen set. Spec section 7 says which spec function each screen carries. Screens show stored data only; leave out board features the spec does not have.
5. **No AI Attribution in Commits:**
   - Never add a `Co-Authored-By` trailer or a "Generated with" line naming Codex, OpenAI, or any other AI tool to a commit message or pull request description.
6. **Android First:**
   - Android is the demo target. `mobile/ios/` exists so the shared TypeScript can run on iPhone later; iOS cannot read other apps' notifications (spec section 2.1). Do not add iOS-only native code or features during the hackathon, and never let iOS work block an Android task.
7. **Commit Only Your Own Files:**
   - Other agents and developers work in this folder at the same time. Before committing, check what is staged (`git diff --cached --name-only`) and commit by path (`git commit -- <paths>`), so another session's staged work is never swept into your commit.

---

## 2. Windows Notes

- Run `npm install` in `mobile/` from **PowerShell**, not Git Bash. `llama.rn` unpacks its native files with `tar`, and Git Bash's `tar` reads `C:\...` as a network host. The install then fails and npm rolls back, emptying `node_modules`.
- Build for a phone from `mobile/android` with `.\gradlew.bat app:installDebug`, and forward Metro with `adb reverse tcp:8081 tcp:8081`.

---

## 3. Token Defense & Velocity Tools

Codex has no slash commands for this repo's skills. Read the skill file and follow it:
- **Caveman voice:** [`.agents/skills/caveman/`](.agents/skills/caveman/) strips conversational filler while keeping code exact.
- **Ponytail philosophy:** [`.agents/skills/ponytail/`](.agents/skills/ponytail/), the "lazy senior developer" mindset. Avoid new NPM libraries or boilerplate when a platform feature or one line of code works. Library changes belong to Lane A.
- **Frontend polish:** [`.agents/skills/impeccable/`](.agents/skills/impeccable/), within the MIRA design in [`docs/design/`](docs/design/README.md). Do not take palettes or fonts from the skill.

---

## 4. Universal Repository Rules

All universal tenets (zero secret exposure, clickable `file://` links, evidence before assertions) are defined in [`AGENTS.md`](AGENTS.md).
