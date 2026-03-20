# Workflow

Please complete user request.
**IMPORTANT** You need to follow **Steps** strictly.

## Input

User request.
It might contain DoD.

## Output

DoD check report.
Explain how each DoD is satisfied by the implementation.
DoD report should be output in Japanese.

## Steps

- [ ] `/prompts:opsx-new <input>`
- [ ] `/prompts:opsx-ff`
- [ ] Loop these steps until verify and review pass. Up to 5 times.
  - [ ] `/prompts:opsx-apply` in `programmer` agent
  - [ ] `/prompts:opsx-verify` and `/review` in `reviewer` agent
- [ ] `/prompts:opsx-sync`
- [ ] Output the DoD check report in Japanese.

## From User
