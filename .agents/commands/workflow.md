# Workflow

This is the workflow to develop.
**IMPORTANT** You need to follow **Steps** strictly.
Proceed through the steps autonomously unless blocked, destructive approval is required, or user input is necessary to resolve ambiguity.

## Input

User request.
It might contain DoD.

## Output

DoD check report.
Explain how each DoD is satisfied by the implementation.
DoD report should be output in Japanese.

## Steps

- [ ] `.codex/prompts/opsx-new.md <input>`
- [ ] `.codex/prompts/opsx-ff.md`
- [ ] Loop these steps until verify and review pass. Up to 5 times.
  - [ ] `.codex/prompts/opsx-apply.md` in `programmer` agent
  - [ ] `.codex/prompts/opsx-verify.md` and `/review` in `reviewer` agent
- [ ] `.codex/prompts/opsx-sync.md`
- [ ] Reflect on the completed run. If it revealed reusable guidance worth codifying, keep project-specific reporting rules in `.agents/reporting/dod-points.md` and reserve this workflow file for shared procedure steps.
- [ ] Output the DoD check report in Japanese.
