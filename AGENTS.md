# Agent Teams for VK

Use this team setup for this repository.
Keep work small and test-driven.

## Team Roles

1. Test Triage Agent
- Groups failing tests by root cause.
- Picks one small target to fix first.

2. API Contract Agent
- Owns `src/api/client.ts` and `src/api/types.ts`.
- Fixes API shape and status handling issues.

3. CLI Behavior Agent
- Owns `src/commands/*.ts` and `src/main.ts`.
- Fixes command behavior and output behavior.

4. Resolver Agent
- Owns `src/utils/project-resolver.ts` and `src/utils/repository-resolver.ts`.
- Fixes ID and auto-detection logic.

5. Spec and Docs Agent
- Owns `specs/cli.md` and `README.md`.
- Keeps docs aligned with actual behavior.

## Default Workflow

1. Run baseline tests with:
   `docker compose run --rm vk`
2. Group failures into buckets (API, CLI, resolver, other).
3. Pick one bucket and one smallest failing test.
4. Update or add spec text in `specs/cli.md` first.
5. Make the test fail for the expected behavior.
6. Implement the smallest code change.
7. Run `docker compose run --rm vk` again.
8. Keep docs and tests in sync before finishing.

## Done Criteria

- The targeted failing tests pass.
- No new failures are introduced by the change.
- `specs/cli.md` reflects the final behavior.
