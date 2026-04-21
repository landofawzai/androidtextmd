---
name: polish
description: |
  Polish phase: design review, design exploration, and code health check
  in sequence. Run after building features to tighten visuals, catch
  inconsistencies, and measure code quality.
user-invocable: true
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Agent
  - AskUserQuestion
  - Skill
---

# /polish — Visual + Code Quality Polish

Run after features are built and working. Tightens the product before launch.

## Step 1: Assess what needs polishing

Check current state:
```bash
git log --oneline -10
git diff --stat HEAD~5 2>/dev/null || git diff --stat HEAD 2>/dev/null
```

Ask the user via AskUserQuestion:

> What do you want to polish?

Options:
- A) Everything — run the full polish pipeline (recommended)
- B) Visual polish only — design review + design exploration
- C) Code quality only — health check, linting, dead code
- D) Design exploration — try multiple visual directions for key pages

## Phase 1: Design Review

**Runs for options A, B.**

Ask the user for the URL to audit (localhost or staging).

Invoke `/design-review`. This does a visual audit of the live site: spacing,
hierarchy, consistency, AI slop patterns, slow interactions. It finds issues
and fixes them, committing each fix atomically and re-verifying with
before/after screenshots.

Wait for completion. Summarize fixes made.
Ask: "Design review done. Continue to next phase?"

## Phase 2: Design Exploration

**Runs for options A, B, D.**

Invoke `/design-shotgun`. This generates multiple design variants for key
pages, opens a comparison board, collects structured feedback, and iterates.

Wait for completion. Summarize the chosen direction.
Ask: "Design exploration done. Continue to next phase?"

## Phase 3: Code Health

**Runs for options A, C.**

Invoke `/health`. This runs the type checker, linter, test runner, dead code
detector, and shell linter. Computes a weighted 0-10 composite score and
tracks trends over time.

Wait for completion. Report the score and any critical findings.

## Completion

Summarize what was polished:
- Design issues found and fixed (from design review)
- Visual direction chosen (from design exploration)
- Code health score and trend (from health check)
- Remaining issues that need manual attention

Say: "Polish complete. Ready to ship or keep iterating."
