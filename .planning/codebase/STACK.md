# Technology Stack

**Analysis Date:** 2026-03-19

## Languages

**Primary:**
- TypeScript - CLI implementation under `src/` and tests under `tests/`.

**Secondary:**
- YAML - CI and release automation in `.github/workflows/ci.yml` and `.github/workflows/release.yml`.
- Dockerfile syntax - integration test server image in `Dockerfile.vibe-kanban-ci` and compose orchestration in `docker-compose.yml`.

## Runtime

**Environment:**
- Deno 2.x - required by `README.md` and configured by `deno.json`.
- Node.js 20 slim - used only for the integration-test backend image in `Dockerfile.vibe-kanban-ci`.

**Package Manager:**
- Deno module resolution via `deno.json` imports and tasks.
- Lockfile: Not detected.

## Frameworks

**Core:**
- Deno standard runtime - execution, filesystem, environment access, and subprocesses across `src/main.ts`, `src/api/config.ts`, and `src/utils/*.ts`.
- Cliffy command framework (`jsr:@cliffy/command@1.0.0-rc.7`) - CLI command tree and shell completions in `src/main.ts` and `src/commands/*.ts`.
- Cliffy prompt/table (`jsr:@cliffy/prompt@1.0.0-rc.7`, `jsr:@cliffy/table@1.0.0-rc.7`) - interactive prompts and tabular output in `src/commands/repository.ts`, `src/commands/task-attempts.ts`, and `src/commands/organization.ts`.

**Testing:**
- Deno test runner - unit and integration commands in `deno.json`.
- `@std/assert` (`jsr:@std/assert@1.0.9`) - assertions in test files under `src/` and `tests/`.

**Build/Dev:**
- `deno fmt`, `deno lint`, and `deno check` - wired in `deno.json` tasks and CI workflows.
- `deno compile` - release binary packaging in `.github/workflows/release.yml`.
- Docker Compose - integration environment in `docker-compose.yml`.

## Key Dependencies

**Critical:**
- `jsr:@cliffy/command@1.0.0-rc.7` - backbone of the `vk` CLI in `src/main.ts`.
- `npm:nats` via `nats.deno` - branch notification publish/subscribe transport in `src/commands/notify.ts` and `src/commands/wait.ts`.
- `jsr:@std/path@1.0.8` - config file path resolution in `src/api/config.ts`.

**Infrastructure:**
- `jsr:@opensrc/deno-open@^1.0.0` - declared in `deno.json`; not detected in current `src/` imports.
- Native `fetch` - HTTP client for the vibe-kanban backend in `src/api/client.ts`.
- `git` subprocess access - repository detection and branch inspection in `src/utils/git.ts`.
- `fzf` subprocess access - interactive repo/workspace selection in `src/utils/fzf.ts`.

## Configuration

**Environment:**
- CLI config is persisted to `~/.config/vibe-kanban/vk-config.json` by `src/api/config.ts`.
- Environment overrides are read in `src/api/config.ts`: `VK_API_URL`, `VK_DEFAULT_EXECUTOR`, `VK_NATS_HOST`, `VK_NATS_PORT`, `VK_NATS_SUBJECT`, and `VK_USE_DEV_API_DEFAULT`.
- `HOME` or `USERPROFILE` determines the config path in `src/api/config.ts`.
- `.env` files were not detected at repo root depth 2 during this scan.

**Build:**
- `deno.json` is the source of tasks, imports, formatting, linting, and strict TypeScript settings.
- `.github/workflows/ci.yml` runs formatting, lint, type-checking, unit tests, and Docker-based integration tests.
- `.github/workflows/release.yml` compiles cross-platform binaries from `src/main.ts`.
- `docker-compose.yml` and `Dockerfile.vibe-kanban-ci` define the local/CI integration stack.

## Platform Requirements

**Development:**
- Deno 2.x installed locally, per `README.md`.
- Network access to a vibe-kanban server reachable at the configured API URL, used by `src/api/client.ts`.
- `git` available for repo and branch helpers in `src/utils/git.ts`.
- `fzf` is optional for interactive selection in `src/utils/fzf.ts`.

**Production:**
- Distribution target is a standalone CLI binary produced by `deno compile` in `.github/workflows/release.yml`.
- Runtime permissions required by the compiled CLI mirror the install command in `README.md`: network, file read/write, environment access, and subprocess execution for `git` and `fzf`.

---

*Stack analysis: 2026-03-19*
