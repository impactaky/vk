## Overview

Refactor integration tests to use helper seed lookups from the real API and
invoke CLI commands against `config.apiUrl`, removing local mock API servers.

## Design Decisions

- Add a `getRepoSeed()` helper from `GET /api/repos`.
- Reuse existing `getAttemptSeed()` for spin-off and repo-id create coverage.
- For repo auto-detect test, run CLI from live repo path when available.
- Keep graceful early returns when API is unavailable/unauthorized/missing seed
  data (consistent with existing integration test style).

## Testing Strategy

- Update create success tests (`--file`, `--repo by name`, `--repo by id`,
  auto-detect repo) to use real API seeds.
- Update spin-off success tests (`--description`, `--file`) to use real
  attempt seed.
- Remove obsolete mock server helpers/types.
