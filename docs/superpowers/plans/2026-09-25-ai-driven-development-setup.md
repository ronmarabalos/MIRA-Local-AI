# AI-Driven Development Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a modular, cross-agent foundation in `Yzentic-setup` featuring root configuration (`AGENTS.md`), multi-platform compatibility pointers, progressive skills (`.agents/skills/`), and structured documentation (`docs/ai/`).

**Architecture:** Hierarchical multi-agent structure where `AGENTS.md` serves as the universal single source of truth, `.agents/skills/` houses modular procedural skills triggered on demand, and `docs/ai/` provides persistent engineering guidelines. Automated tests validate YAML frontmatter, link integrity, and required tenets.

**Tech Stack:** Markdown, YAML frontmatter, Python 3 (`unittest` standard library for verification).

**Spec:** [`docs/superpowers/specs/2026-09-25-ai-driven-development-design.md`](../specs/2026-09-25-ai-driven-development-design.md)

## Global Constraints

- Universal root configuration must reside in `AGENTS.md`.
- Compatibility pointers (`GEMINI.md`, `CLAUDE.md`, `.cursorrules`) must reference `AGENTS.md` without duplicating rule definitions.
- Skills must reside in `.agents/skills/<name>/SKILL.md` with standard YAML frontmatter containing `name` and `description`.
- Documentation must reside in `docs/ai/` and feature design specs in `docs/specs/`.
- All file and symbol references within guidelines must use `file://` hyperlink formatting.
- Windows and POSIX path separators must be handled cleanly.

## Review Focus

1. Windows backslash vs URI forward slash mismatch: `file:///` URLs must always use forward slashes even on Windows.
2. YAML frontmatter parsing errors: Every `SKILL.md` must start and end frontmatter with valid `---` fences.
3. Broken internal links: Relative and file URI links between `AGENTS.md`, `docs/`, and skills must resolve to real files.
4. Non-interactive CLI safety: Instructions in handbook and rules must explicitly enforce non-interactive flags.
5. Missing behavioral tenets: `AGENTS.md` must explicitly define "Evidence before assertions" and "Task tracking checklists".

---

### Task 1: Root Universal Rules & Agent Discovery Links

**Files:**
- Create: `AGENTS.md`
- Create: `GEMINI.md`
- Create: `CLAUDE.md`
- Create: `.cursorrules`
- Test: `tests/test_root_rules.py`

**Interfaces:**
- Produces: Universal configuration layer read by all downstream agents and tests.
- Consumes: None.

- [ ] **Step 1: Write the failing test for root rules and pointers**

Create `tests/test_root_rules.py`:
```python
import unittest
from pathlib import Path

class TestRootRules(unittest.TestCase):
    def setUp(self):
        self.root = Path(__file__).resolve().parent.parent

    def test_agents_md_exists_and_contains_tenets(self):
        agents_file = self.root / "AGENTS.md"
        self.assertTrue(agents_file.exists(), "AGENTS.md must exist at repo root")
        content = agents_file.read_text(encoding="utf-8")
        self.assertIn("Evidence before assertions", content)
        self.assertIn("file://", content)
        self.assertIn(".agents/skills", content)

    def test_compatibility_pointers_reference_agents(self):
        for pointer_name in ["GEMINI.md", "CLAUDE.md", ".cursorrules"]:
            pointer = self.root / pointer_name
            self.assertTrue(pointer.exists(), f"{pointer_name} must exist at repo root")
            content = pointer.read_text(encoding="utf-8")
            self.assertIn("AGENTS.md", content, f"{pointer_name} must reference AGENTS.md")

if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `py -m unittest tests/test_root_rules.py -v`
Expected: FAIL with `AssertionError: AGENTS.md must exist at repo root`

- [ ] **Step 3: Write AGENTS.md and compatibility pointers**

1. Create `AGENTS.md` with core behavioral tenets, path conventions, CLI guidelines, and skills/docs index.
2. Create `GEMINI.md` pointing Antigravity and Gemini CLI agents to `AGENTS.md`.
3. Create `CLAUDE.md` pointing Claude Code to `AGENTS.md` with CLI shortcuts.
4. Create `.cursorrules` pointing Cursor AI to `AGENTS.md`.

- [ ] **Step 4: Run test to verify it passes**

Run: `py -m unittest tests/test_root_rules.py -v`
Expected: PASS (2 tests, 0 failures)

- [ ] **Step 5: Commit**

```bash
git add AGENTS.md GEMINI.md CLAUDE.md .cursorrules tests/test_root_rules.py
git commit -m "feat: add universal AGENTS.md rules and cross-platform compatibility pointers"
```

---

### Task 2: Progressive Skills Architecture

**Files:**
- Create: `.agents/skills/spec-driven-dev/SKILL.md`
- Create: `.agents/skills/verification-gate/SKILL.md`
- Create: `.agents/skills/multi-agent-handoff/SKILL.md`
- Test: `tests/test_skills_structure.py`

**Interfaces:**
- Produces: Executable agent skills in `.agents/skills/` indexed dynamically by Antigravity, Claude Code, Cursor, and Orca.
- Consumes: `AGENTS.md` skill discovery rules.

- [ ] **Step 1: Write the failing test for skill YAML frontmatter and schemas**

Create `tests/test_skills_structure.py`:
```python
import unittest
import re
from pathlib import Path

class TestSkillsStructure(unittest.TestCase):
    def setUp(self):
        self.root = Path(__file__).resolve().parent.parent
        self.skills_dir = self.root / ".agents" / "skills"

    def test_required_skills_exist(self):
        required_skills = ["spec-driven-dev", "verification-gate", "multi-agent-handoff"]
        for skill_name in required_skills:
            skill_file = self.skills_dir / skill_name / "SKILL.md"
            self.assertTrue(skill_file.exists(), f"Skill file {skill_file} must exist")
            content = skill_file.read_text(encoding="utf-8")
            
            # Verify YAML frontmatter
            match = re.match(r"^---\s*\n(.*?)\n---\s*\n", content, re.DOTALL)
            self.assertIsNotNone(match, f"{skill_name}/SKILL.md must have valid YAML frontmatter")
            fm = match.group(1)
            self.assertIn("name:", fm)
            self.assertIn("description:", fm)

if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `py -m unittest tests/test_skills_structure.py -v`
Expected: FAIL with `AssertionError: Skill file ... must exist`

- [ ] **Step 3: Implement the three core skills**

1. Create `.agents/skills/spec-driven-dev/SKILL.md` covering scope classification, specification authoring, gate checks, and test-first execution.
2. Create `.agents/skills/verification-gate/SKILL.md` covering command execution, output proof inspection, working copy hygiene, and reporting.
3. Create `.agents/skills/multi-agent-handoff/SKILL.md` covering serialization of task goals, state artifacts, worktree branching, and resume protocols.

- [ ] **Step 4: Run test to verify it passes**

Run: `py -m unittest tests/test_skills_structure.py -v`
Expected: PASS (1 test, 0 failures)

- [ ] **Step 5: Commit**

```bash
git add .agents/skills tests/test_skills_structure.py
git commit -m "feat: add core progressive skills for spec-driven-dev, verification, and handoffs"
```

---

### Task 3: Documentation System & Engineering Guidelines

**Files:**
- Create: `docs/ai/agent-handbook.md`
- Create: `docs/ai/workflows.md`
- Create: `docs/ai/architecture.md`
- Create: `docs/specs/.gitkeep`
- Test: `tests/test_docs_integrity.py`

**Interfaces:**
- Produces: Standardized engineering guidelines and specs directory.
- Consumes: `AGENTS.md` and `.agents/skills/`.

- [ ] **Step 1: Write the failing test for documentation integrity and links**

Create `tests/test_docs_integrity.py`:
```python
import unittest
from pathlib import Path

class TestDocsIntegrity(unittest.TestCase):
    def setUp(self):
        self.root = Path(__file__).resolve().parent.parent
        self.docs_ai = self.root / "docs" / "ai"

    def test_required_docs_exist(self):
        for doc_name in ["agent-handbook.md", "workflows.md", "architecture.md"]:
            doc_file = self.docs_ai / doc_name
            self.assertTrue(doc_file.exists(), f"Doc {doc_file} must exist")
            content = doc_file.read_text(encoding="utf-8")
            self.assertGreater(len(content.strip()), 100, f"Doc {doc_name} must not be empty")

    def test_specs_directory_exists(self):
        specs_dir = self.root / "docs" / "specs"
        self.assertTrue(specs_dir.exists(), "docs/specs/ directory must exist")

if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `py -m unittest tests/test_docs_integrity.py -v`
Expected: FAIL with `AssertionError: Doc ... must exist`

- [ ] **Step 3: Implement documentation files and specs placeholder**

1. Create `docs/ai/agent-handbook.md` detailing agent orientation, CLI standards, shell safety, and link conventions.
2. Create `docs/ai/workflows.md` detailing TDD cycles, branching strategies, commit conventions, and checklist tracking.
3. Create `docs/ai/architecture.md` detailing modular boundaries, interface decoupling, and spec lifecycles.
4. Create `docs/specs/.gitkeep` to preserve the specs directory.

- [ ] **Step 4: Run test to verify it passes**

Run: `py -m unittest tests/test_docs_integrity.py -v`
Expected: PASS (2 tests, 0 failures)

- [ ] **Step 5: Commit**

```bash
git add docs/ tests/test_docs_integrity.py
git commit -m "docs: add AI agent handbook, workflows, architecture guidelines, and specs directory"
```

---

### Task 4: Complete System Verification & Integration Suite

**Files:**
- Create: `tests/__init__.py`
- Test: All tests in `tests/`

- [ ] **Step 1: Run the full test suite**

Run: `py -m unittest discover tests -v`
Expected: PASS with 5+ tests passing across all suites.

- [ ] **Step 2: Verify git status and clean working tree**

Run: `git status`
Expected: Working tree clean, all files tracked and committed.

- [ ] **Step 3: Final verification commit / tagging if needed**

Ensure all plan documentation and test suites are committed cleanly.
