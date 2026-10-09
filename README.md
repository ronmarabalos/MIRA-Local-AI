# Dual-Agent Hackathon Setup (Claude Pro + Antigravity)

**Autonomous Pair-Programming Environment Optimized for 24-Hour Hackathons & Claude Pro Token Preservation**

This repository provides a coordinated dual-agent development architecture where **Claude Code** acts as **The Builder** (Planning & Implementation) and **Google Antigravity** acts as **The Gatekeeper** (Test Authoring, Headless Verification & Error Distillation).

---

## 🌱 Starting a New Project / Fresh Clone Setup

Immediately after cloning this repository for a new project or hackathon, run the project tailoring wizard:

```bash
npm run init:project
```

The wizard prompts for:
1. **Project Name & 1-Line Pitch** (updates [`package.json`](package.json) and [`docs/PLAN.md`](docs/PLAN.md)).
2. **Project Archetype:**
   - `[1] fullstack-web`: Next.js / Vite + Backend + Database (keeps 11 core web skills).
   - `[2] ai-agent-app`: FastAPI / Node + Prompt engineering & agentic eval (keeps AI pipeline skills).
   - `[3] frontend-dashboard`: Vite + React + Tailwind + Charts & Presentations.
   - `[4] minimal-hackathon`: Ultra-lean core suite (7 essential skills).
3. **Developer Handles:** Assigns `Dev 1` and `Dev 2` responsibilities in [`docs/PLAN.md`](docs/PLAN.md).

> **Context Optimization:** Unselected skills are **soft-deleted** into [`.agents/skills-archive/`](.agents/skills-archive/) so agents only scan active skills, saving hundreds of context tokens. You can restore any skill instantly:
> ```bash
> npm run skill:enable <skill-name>    # e.g., npm run skill:enable slides
> npm run skill:disable <skill-name>   # move back to archive
> npm run skill:list                  # view active vs archived
> ```

---

## 🚀 The Dual-Terminal Workflow

```text
┌──────────────────────────────────────┐    ┌──────────────────────────────────────┐
│  TERMINAL 1: CLAUDE CODE (Builder)   │    │  TERMINAL 2: ANTIGRAVITY (QA Gate)   │
│  - Plans features & UI architecture  │    │  - Runs test suites & Playwright E2E │
│  - Implements source code in src/    │    │  - Absorbs verbose terminal/DOM logs │
│  - Runs: npm run verify:agent        │    │  - Distills failures to <= 25 lines  │
│  - Uses: /caveman & /ponytail        │    │  - Uses: webapp-testing, archify     │
└──────────────────┬───────────────────┘    └──────────────────┬───────────────────┘
                   │                                           │
                   └──────────────► .agents/sync/ ◄────────────┘
                              (handoff.json & handoff.md)
```

1. **Open Split Terminals:**
   - Left Pane: run `claude`
   - Right Pane: run `agy`
2. **Build Code:** Claude implements feature code in `src/`.
3. **Verify via Baton:** Claude executes:
   ```bash
   npm run verify:agent
   ```
4. **Iterate Cleanly:** If tests fail, Claude receives a concise 5-10 line failure diagnostic. If tests pass, the baton stamps `verified` in [`.agents/sync/handoff.json`](.agents/sync/handoff.json).

---

## ⚡ 3-Tier Execution Lanes

`scripts/baton.mjs` automatically inspects touched files to prevent wasting time and tokens on full test suite runs:

- **Tier 1 (Express / Fast-Track):** Micro-edits (CSS/Tailwind, copy, markdown, static assets). Full test suites are **bypassed**; passes in < 1 second.
- **Tier 2 (Scoped Lane):** Single component or route change. Runs only the matching scoped test file.
- **Tier 3 (Architectural Lane):** DB schemas, migrations, auth, or core multi-file features. Runs full regression suite.

**Manual Overrides:**
```bash
npm run verify:agent -- --tier 1
npm run verify:agent -- --tier 2 --scope tests/auth.test.ts
npm run verify:agent -- --tier 3
```

---

## 🗺️ Team Sync: The Universal Living Plan

In a 2-developer team, [`docs/PLAN.md`](docs/PLAN.md) is the single source of truth:
- **`P0` (Must-Have for Demo):** Core loop needed for judges.
- **`P1` (High Impact Polish):** Enhancements that elevate the demo.
- **`P2` (Post-Hackathon Stretch):** Ideas to park until after judging.
- **Ownership:** No fixed owners. Both developers are full stack and either can take any task; tick an item off as soon as it is done.

---

## 🧰 Hackathon Skill Arsenal

| Skill | Trigger / Command | Hackathon Impact |
| :--- | :--- | :--- |
| **[`caveman`](.agents/skills/caveman/SKILL.md)** | `/caveman` | Strips conversational fluff; **saves ~70% output tokens on Claude Pro** |
| **[`ponytail`](.agents/skills/ponytail/SKILL.md)** | `/ponytail` | "Lazy senior dev" mode: smallest code change, **zero bloated libraries** |
| **[`ui-ux-pro-max`](.agents/skills/ui-ux-pro-max/SKILL.md)** | `/ui-ux-pro-max` | Design system intelligence across React, Tailwind, and Shadcn |
| **[`impeccable`](.agents/skills/impeccable/SKILL.md)** | `/impeccable polish`, `bolder` | High-polish UI finishing pass by Paul Bakaus |
| **[`archify`](.agents/skills/archify/SKILL.md)** | `/archify` | Generates interactive architecture and sequence diagrams for pitch slides |
| **[`pitch-architect`](.agents/skills/pitch-architect/SKILL.md)** | `/pitch-architect` | 3-minute hackathon pitch deck, live demo script, and judge Q&A prep |
| **[`demo-seed-data`](.agents/skills/demo-seed-data/SKILL.md)** | `/demo-seed-data` | Populates UI with avatars, realistic trends, and dynamic chart data |

---

## 🛠️ CLI Commands

```bash
# Initialize a new project from clone
npm run init:project

# Skills management & soft-delete archival
npm run skill:list
npm run skill:enable <skill-name>
npm run skill:disable <skill-name>
npm run skill:sync [archetype]

# Verify current changes with auto-detected tier
npm run verify:agent

# Check active synchronization status
npm run sync:status

# Reset handoff state to idle
npm run sync:reset

# Run full project test suite
python3 -m unittest discover tests
```
