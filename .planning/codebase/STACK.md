# Technology Stack

**Analysis Date:** 2026-03-17

## Languages

**Primary:**
- TypeScript - CLI source and tests live in `src/` and `tests/`, with the public export surface in `src/mod.ts` and the CLI entrypoint in `src/main.ts`.

**Secondary:**
- YAML - CI, release, and integration orchestration live in `.github/workflows/ci.yml`, `.github/workflows/release.yml`, and `docker-compose.yml`.
- Dockerfile syntax - the CI test image is defined in `Dockerfile.vibe-kanban-ci`.

## Runtime

**Environment:**
- Deno v2.x - required by `README.md`, configured in `deno.json`, and installed in CI by `.github/workflows/ci.yml` and `.github/workflows/release.yml`.
- Node.js 20 - the integration-test server image in `Dockerfile.vibe-kanban-ci` is based on `node:20-slim`.

**Package Manager:**
- Deno module management via `deno.json` imports from JSR and npm.
- Lockfile: present as `deno.lock`.

## Frameworks

**Core:**
- Cliffy command framework - `@cliffy/command`, `@cliffy/prompt`, and `@cliffy/table` are configured in `deno.json` and used by `src/main.ts`, `src/commands/repository.ts`, `src/commands/config.ts`, `src/commands/organization.ts`, and `src/commands/task-attempts.ts`.

**Testing:**
- Deno test runner - configured by `deno.json` tasks and used across `src/**/*_test.ts` and `tests/*_test.ts`.
- `@std/assert` - assertions are imported in files such as `src/utils/git_test.ts`, `tests/api_client_test.ts`, and `tests/task_attempts_integration_test.ts`.

**Build/Dev:**
- Deno task runner - `deno.json` defines `dev`, `fmt`, `lint`, `check`, `test`, and `test:integration`.
- `deno compile` - release binaries are built in `.github/workflows/release.yml`.
- Docker Compose - integration tests are orchestrated with `docker-compose.yml` and invoked from `.github/workflows/ci.yml`.

## Key Dependencies

**Critical:**
- `jsr:@cliffy/command@1.0.0-rc.7` - command parsing and CLI composition in `src/main.ts`.
- `jsr:@cliffy/prompt@1.0.0-rc.7` - interactive input for commands like `repository register` and `repository init` in `src/commands/repository.ts`.
- `jsr:@cliffy/table@1.0.0-rc.7` - human-readable tabular output in `src/commands/organization.ts`, `src/commands/repository.ts`, and `src/commands/task-attempts.ts`.
- `npm:nats` exposed as `nats.deno` - NATS pub/sub transport used by `src/commands/notify.ts` and `src/commands/wait.ts`.

**Infrastructure:**
- `jsr:@std/path@1.0.8` - config path handling in `src/api/config.ts`.
- `jsr:@std/assert@1.0.9` - unit and integration assertions in `src/**/*_test.ts` and `tests/**/*`.
- `jsr:@opensrc/deno-open@^1.0.0` - declared in `deno.json`; not detected in `src/` or `tests/`.

## Configuration

**Environment:**
- Runtime configuration is loaded from `~/.config/vibe-kanban/vk-config.json` by `src/api/config.ts`.
- Environment variable overrides are read in `src/api/config.ts`: `VK_API_URL`, `VK_DEFAULT_EXECUTOR`, `VK_NATS_PORT`, `VK_NATS_HOST`, and `VK_NATS_SUBJECT`.
- CLI config mutators live in `src/commands/config.ts`.

**Build:**
- `deno.json` is the primary project configuration for imports, compiler strictness, formatting, linting, and task commands.
- `.github/workflows/ci.yml` runs format, lint, type-check, unit tests, and Docker-based integration tests.
- `.github/workflows/release.yml` builds cross-platform binaries from `src/main.ts`.
- `docker-compose.yml` provisions the local integration-test environment.

## Platform Requirements

**Development:**
- Deno 2.x is required by `README.md` and `.github/workflows/ci.yml`.
- Network, filesystem, environment, and subprocess permissions are required by the CLI task definitions in `deno.json`.
- `git` is required by `src/utils/git.ts` and repository/workspace resolution flows such as `src/utils/repository-resolver.ts`.
- `fzf` is optional but required for interactive repository/workspace selection in `src/utils/fzf.ts`.
- Docker and Docker Compose are required for the integration workflow in `docker-compose.yml` and `.github/workflows/ci.yml`.

**Production:**
- The distributable artifact is a standalone CLI binary compiled from `src/main.ts` in `.github/workflows/release.yml`.
- The CLI expects a reachable vibe-kanban HTTP API, configured through `src/api/config.ts` and exercised by `src/api/client.ts`.

---

*Stack analysis: 2026-03-17*
