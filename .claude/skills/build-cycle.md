---
name: build-cycle
description: |
  Build-to-launch cycle: review code, ship PRs, QA test the running app,
  polish design, deploy, and monitor. Run after /kickoff when you're
  building features.
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

# /build-cycle — Build, Ship, Polish, Launch

Run after `/kickoff` when you have code to review, ship, or test.
Detects what phase you're in and runs the right skills.

## Step 1: Assess current state

Check git status, recent commits, and whether a dev server is running.
Ask the user:

"What phase are you in?"
- A) I have code changes ready to review and ship
- B) I need to QA test the running app
- C) I want to polish the design of the live site
- D) I'm ready to deploy to production
- E) I just deployed and want to monitor

## Phase A: Review + Ship

1. Invoke `/review` — pre-landing code review on the current diff
2. If review passes, ask: "Ship it?" If yes, invoke `/ship`

## Phase B: QA Testing

1. Ask the user for the URL to test (e.g., localhost:3000 or staging URL)
2. Invoke `/qa` — systematic QA testing, finds bugs, fixes them, commits each fix

## Phase C: Design Polish

1. Ask the user for the URL to audit
2. Invoke `/design-review` — visual audit, finds spacing/hierarchy/consistency issues and fixes them

## Phase D: Deploy

1. Check if deploy is configured. If not, invoke `/setup-deploy` first.
2. Invoke `/ship` if there's an unshipped PR
3. Invoke `/land-and-deploy` — merge, wait for CI, verify production health

## Phase E: Post-Deploy Monitor

1. Invoke `/canary` — watches the live app for console errors, performance regressions
2. When canary passes, invoke `/document-release` — updates docs to match what shipped

## Completion

Summarize what was done and suggest the next step.
