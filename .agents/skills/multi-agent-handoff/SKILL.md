---
name: multi-agent-handoff
description: Use when delegating tasks between subagents, orchestrating parallel workers in Orca, or transferring session state
---

# Multi-Agent Handoff Protocol

Standardize communication and context transfer between coordinator agents, subagents, and distinct runtime sessions.

---

## Handoff Artifact Schema

When handing off a task or delegating to a worker agent, produce a structured markdown artifact containing:

```markdown
# Agent Handoff: [Task Name]

- **Timestamp:** YYYY-MM-DDTHH:MM:SS
- **Branch / Worktree:** [branch-name or worktree path]
- **Goal:** [Concise 1-2 sentence statement of objective]

## Completed Work
- [x] Step A (Commit `<hash>`)
- [x] Step B (Commit `<hash>`)

## Current State & Remaining Work
- [ ] Next Step C: [Description of exact next step]
- [ ] Next Step D: [Description]

## Context & Boundaries
- Key files touched: `path/to/file`
- Tests to run for verification: `command to verify`
- Blockers or decisions made: [Notes]
```

---

## Receiving Agent Checklist
1. Review the handoff artifact above.
2. Confirm the current git branch/worktree match the handoff state.
3. Run the verification command to confirm baseline health.
4. Execute the next remaining task using Test-Driven Development.
