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

- [ ] Call `/prompts:opsx-new` skill with <input>
- [ ] Call `/prompts:opsx-ff` skill
- [ ] Loop these steps until verify and review pass. Up to 5 times.
  - [ ] Call `/prompts:opsx-apply` skill in `programmer` agent
  - [ ] Call `/prompts:opsx-verify` skill and `/review` in `reviewer` agent
- [ ] Call `/prompts:opsx-sync` skill
- [ ] Output the DoD check report in Japanese.
