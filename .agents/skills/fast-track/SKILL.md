---
name: fast-track
description: Rapid, token-efficient execution for micro-tasks, small visual/styling tweaks, copy edits, and minor non-structural fixes without heavy testing/build ceremony. Use when handling requests like "remove the border", "change the button color", "fix this typo", "adjust padding/margin", or when the user invokes /fast-track.
version: 1.0.0
---

# Fast-Track Skill (Express Lane for Micro-Tasks)

The **Fast-Track** skill provides a streamlined, token-efficient operational protocol for autonomous agents executing micro-tasks, cosmetic styling adjustments, and minor non-breaking fixes in the repository.

---

## 1. When to Use Fast-Track

Activate Fast-Track when the task falls into **Tier 1 (Express Lane)**:
- **Cosmetic / Styling Tweaks:** Changing Tailwind CSS classes, colors, padding, margins, borders, shadows, or alignments.
- **Copy & Content Edits:** Correcting typos, updating static copy, updating headings, or editing documentation.
- **Minor Component Prop/Icon Swaps:** Changing an icon name, toggling a boolean prop on an existing component, or adjusting an asset path.
- **User Explicit Request:** The user triggers `/fast-track`, asks for a "quick change", or asks for a "small tweak".

---

## 2. When NOT to Use Fast-Track (Escalate to Tier 2 or Tier 3)

You MUST escalate to **Tier 2 (Standard Bounded Lane)** or **Tier 3 (Architectural Deep Lane)** when:
- ❌ Modifying database schemas, Prisma migrations, or seed data.
- ❌ Changing server actions, API routes, or backend data mutations.
- ❌ Modifying authentication, authorization, or security-sensitive logic.
- ❌ Adding a brand-new feature or restructuring multi-file components.

---

## 3. The 3-Step Fast-Track Protocol

Follow this lean 3-step loop to minimize token usage and latency:

```text
1. LOCATE & DIRECT EDIT
   ├── View target file with view_file
   └── Apply minimal change with replace_file_content (No spec, no plan doc, no Red-Green TDD cycle)

2. SCOPED SANITY CHECK
   ├── Pure visual/CSS: Review git diff (verify syntax and cleanliness)
   └── Logic/Prop change: Run ONLY the single affected test file (e.g. npx vitest run path/to/file.test.tsx)
   └── DO NOT run full regression suites or npm run build

3. FAST COMMIT & CONCISE REPORT
   ├── Stage & commit with semantic message (style:, fix:, docs:)
   └── Reply to user in 1 concise turn with clickable file:// links
```

---

## 4. Key Rules & Operational Guardrails

- **Exemption from Heavy Ceremony:**
  - Tier 1 tasks are explicitly exempt from the Iron Law of TDD (no need to write a failing test first for a CSS class tweak).
  - Exempt from running the entire test suite and production build.
- **Clickable Links:**
  - Always format all file paths and symbols as clickable Markdown links using the `file://` scheme with forward slashes (`/`).
- **No Secret Leaks:**
  - Never expose credentials or `.env` variables.
