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

## Validation rule

- For Deno-based validation in this repository, do not run `deno test` on the host.
- Use `docker compose run --rm vk ...` so validation targets the compose containerized environment.

## Steps

- [ ] `.codex/prompts/opsx-new.md <input>`
- [ ] `.codex/prompts/opsx-ff.md`
- [ ] Loop these steps until verify and review pass. Up to 5 times.
  - [ ] `.codex/prompts/opsx-apply.md` in `programmer` agent
  - [ ] `.codex/prompts/opsx-verify.md` and `/review` in `reviewer` agent
- [ ] `.codex/prompts/opsx-sync.md`
- [ ] Reflect on the completed run. If it revealed reusable guidance worth codifying, keep project-specific reporting rules in `openspec/specs/dod-points/spec.md` and reserve this workflow file for shared procedure steps.
- [ ] Output the DoD check report in Japanese.
