---
name: launch
description: |
  Launch phase: configure deploy target, ship the PR, deploy to production,
  monitor with canary checks, and update docs. One command from code to live.
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

# /launch — Deploy, Monitor, Document

Run when features are built, reviewed, and polished. Takes you from merged code
to verified production with updated docs.

## Step 1: Pre-flight check

```bash
git status
git log --oneline -5
```

Check if deploy config exists:
```bash
grep -l "deploy" CLAUDE.md 2>/dev/null || echo "NO_DEPLOY_CONFIG"
```

Ask the user via AskUserQuestion:

> Where are you in the launch process?

Options:
- A) Full launch — deploy config, ship, deploy, monitor, docs (recommended)
- B) Ship only — create/merge the PR
- C) Deploy only — already shipped, just deploy and monitor
- D) Post-deploy — already live, monitor and update docs

## Phase 1: Deploy Configuration

**Runs for option A, or if NO_DEPLOY_CONFIG detected.**

Invoke `/setup-deploy`. This detects your deploy platform (Fly.io, Render,
Vercel, Netlify, Heroku, GitHub Actions, custom), production URL, health
check endpoints, and deploy status commands. Writes config to CLAUDE.md.

Wait for completion. Confirm the detected platform and URL.

## Phase 2: Ship

**Runs for options A, B.**

Invoke `/ship`. This detects and merges the base branch, runs tests, reviews
the diff, bumps VERSION, updates CHANGELOG, commits, pushes, and creates a PR.

Wait for completion. Report the PR URL.
Ask: "PR created. Ready to deploy?"

## Phase 3: Deploy + Monitor

**Runs for options A, C.**

Invoke `/land-and-deploy`. This merges the PR, waits for CI and deploy, and
verifies production health via canary checks.

Wait for completion. Report deploy status.

If deploy fails, stop and report the error. Do not proceed to docs.

## Phase 4: Canary Monitoring

**Runs for options A, C, D.**

Invoke `/canary`. This watches the live app for console errors, performance
regressions, and page failures. Takes periodic screenshots and compares
against pre-deploy baselines.

Wait for completion. Report canary results.
Ask: "Production looks healthy. Update docs?"

## Phase 5: Documentation

**Runs for options A, D, or after successful canary.**

Invoke `/document-release`. This reads all project docs, cross-references
the diff, updates README/ARCHITECTURE/CONTRIBUTING/CLAUDE.md to match what
shipped, polishes CHANGELOG, and optionally bumps VERSION.

Wait for completion.

## Completion

Summarize the launch:
- PR URL (from ship)
- Deploy status and production URL (from deploy)
- Canary health (from monitoring)
- Docs updated (from document-release)

Say: "Launch complete. You're live."
