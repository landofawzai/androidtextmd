## Project lifecycle skills

This project has four custom pipeline skills that chain gstack workflows in order.
Use these for multi-step work instead of running individual skills manually.

| Skill | When to use | What it runs |
|-------|-------------|--------------|
| `/kickoff` | Starting the project or a major feature | office-hours → CEO review → eng review → design consultation |
| `/build-cycle` | Writing code, shipping PRs, testing | review → ship → QA (picks the right phase automatically) |
| `/polish` | Tightening visuals and code quality | design-review → design-shotgun → health check |
| `/launch` | Going to production | setup-deploy → ship → land-and-deploy → canary → document-release |

Routing rules for pipeline skills:
- "Let's get started", "kick this off", new feature from scratch → invoke kickoff
- "Ship this", "review and push", "test this" → invoke build-cycle
- "Polish", "tighten up", "make it look good", "code quality" → invoke polish
- "Deploy", "go live", "launch", "push to production" → invoke launch

## Skill routing

For individual tasks that don't need a full pipeline, route to single gstack skills.
When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health
