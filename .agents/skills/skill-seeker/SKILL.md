---
name: skill-seeker
description: Ingest documentation websites, GitHub repositories, and technical PDFs to automatically generate structured domain skills with AST parsing, code examples, and conflict detection. Use when encountering unfamiliar frameworks, private internal SDKs, bleeding-edge library updates, or when asked to create/seek a skill from documentation.
version: 1.0.0
---

# Skill Seeker (Knowledge Ingestion & Skill Generation)

The **Skill Seeker** skill provides autonomous agents with an automated pipeline to ingest external documentation websites, GitHub repositories, and technical PDFs into structured, high-density domain skills.

It operates via an ephemeral [`uvx`](file:///home/yzenn/.local/bin/uvx) runner with a safe staging gate in [`.agents/skills/_staging/`](file:///mnt/LubaDub/Projects/Web/Yzentic-setup/Yzentic-setup/.agents/skills/_staging/), ensuring newly scraped knowledge is validated and compliant before entering the active catalog.

---

## 1. When to Use Skill Seeker

Activate Skill Seeker when:
- **Unfamiliar or Bleeding-Edge Libraries:** The user or task requires using a library or framework where official documentation is newer than model weights (e.g. Next.js canary, new state managers, v5 releases).
- **Private / Internal Company SDKs:** An internal library or utility exists in a GitHub repository, and agents need idiomatic TypeScript/Python interfaces and usage patterns.
- **Complex Architecture / API PDFs:** A specification, RFC, or security compliance mandate is provided as a PDF document.
- **Automated Fallback from [`find-skills`](file:///C:/Users/Admin/Yzen/Yzentic-setup/.agents/skills/find-skills/SKILL.md):** No pre-packaged community skill was found on `skills.sh`, but an official documentation URL is available.

---

## 2. Ingestion Commands & Workflow

All operations are executed non-interactively using the orchestrator script [`scripts/seek.py`](file:///C:/Users/Admin/Yzen/Yzentic-setup/.agents/skills/skill-seeker/scripts/seek.py):

### A. Ingest from Documentation Website
Scrapes web pages, extracts code snippets, and synthesizes `SKILL.md` + `references/`:
```bash
python .agents/skills/skill-seeker/scripts/seek.py --url https://docs.example.com/api --name example-api
```

### B. Ingest from GitHub Repository
Performs AST-level code analysis and extracts exported functions, interfaces, and README examples:
```bash
python .agents/skills/skill-seeker/scripts/seek.py --repo owner/repository-name --name repo-skill
```

### C. Ingest from Technical PDF
Extracts tables, checklists, and procedural mandates into structured reference files:
```bash
python .agents/skills/skill-seeker/scripts/seek.py --pdf docs/specs/architecture-mandate.pdf --name compliance-rules
```

---

## 3. Staging Gate & Catalog Promotion

Newly generated skills are placed into [`.agents/skills/_staging/<name>/`](file:///C:/Users/Admin/Yzen/Yzentic-setup/.agents/skills/_staging/) to isolate unverified scrape artifacts.

### 1. List Staged Skills
Inspect all draft skills currently waiting in staging:
```bash
python .agents/skills/skill-seeker/scripts/seek.py --list-staged
```

### 2. Validate Staged Skill
Verify YAML frontmatter, non-empty name/description, and markdown link formatting:
```bash
python .agents/skills/skill-seeker/scripts/seek.py --validate .agents/skills/_staging/<name>
```

### 3. Promote to Active Catalog
Move the validated skill from `_staging/` to [`.agents/skills/<name>/`](file:///C:/Users/Admin/Yzen/Yzentic-setup/.agents/skills/):
```bash
python .agents/skills/skill-seeker/scripts/seek.py --promote <name>
```

---

## 4. Operational Guardrails

1. **Zero Root Dependency Bloat:**
   - Always run `skill-seekers` via [`scripts/seek.py`](file:///C:/Users/Admin/Yzen/Yzentic-setup/.agents/skills/skill-seeker/scripts/seek.py) and `uvx`. Never install scraping packages directly into root project dependencies.
2. **Clickable Links:**
   - Ensure all references and file links use the clickable `file://` scheme with forward slashes (`/`).
3. **Secret Zero-Exposure:**
   - If using `GITHUB_TOKEN` to access private repos, read it strictly from the environment; never echo, log, or store credentials in files.
4. **Post-Promotion Integration:**
   - After promoting a skill to `.agents/skills/<name>/`, update [`docs/ai/agent-handbook.md`](file:///C:/Users/Admin/Yzen/Yzentic-setup/docs/ai/agent-handbook.md) and verify tests pass with `python3 -m unittest discover tests`.
