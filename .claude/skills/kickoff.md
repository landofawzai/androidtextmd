---
name: kickoff
description: |
  Full project kickoff: upgrades gstack, then runs office-hours, CEO review,
  eng review, and design consultation in sequence. One command to go from
  spec to ready-to-build.
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

# /kickoff — Full Project Kickoff Pipeline

Run all foundational gstack skills in order. Each phase completes before the next begins.
Between phases, briefly summarize what happened and confirm with the user before continuing.

## Phase 0: Upgrade gstack

```bash
~/.claude/skills/gstack/bin/gstack-update-check 2>/dev/null || true
```

If `UPGRADE_AVAILABLE` appears in the output, invoke the `/gstack-upgrade` skill and
wait for it to complete before continuing. If already up to date, say so and move on.

## Phase 1: Office Hours

Invoke the `/office-hours` skill. This pressure-tests the product idea: demand, wedge,
competition, and founder-market fit.

Wait for office hours to complete fully. Summarize the key takeaways in 3-5 bullets.
Ask the user: "Ready to move to CEO review?" Wait for confirmation.

## Phase 2: CEO Review

Enter plan mode with the project spec. Then invoke `/plan-ceo-review`.

This challenges scope, finds the 10-star experience, and decides what to cut or expand
for v1. Wait for completion. Summarize decisions. Ask: "Ready for eng review?"

## Phase 3: Eng Review

Invoke `/plan-eng-review` on the same plan.

This locks architecture, data model, edge cases, and test strategy.
Wait for completion. Summarize the architecture decisions.
Ask: "Ready for design consultation?"

## Phase 4: Design Consultation

Invoke `/design-consultation`.

This produces a complete design system (colors, typography, spacing, components).
Creates DESIGN.md in the project root.

## Completion

After all 4 phases, summarize:
- Key product decisions from office hours + CEO review
- Architecture from eng review
- Design system from design consultation
- Recommended next step (usually: start building)

Say: "Kickoff complete. You're ready to build."
