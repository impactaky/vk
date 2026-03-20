# Workflow

This is the workflow to develop.
**IMPORTANT** You need to follow **Steps** strictly.

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
- [ ] Output the DoD check report in Japanese.
