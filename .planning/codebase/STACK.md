# Technology Stack

**Analysis Date:** 2026-01-30

## Languages

**Primary:**
- TypeScript - Latest (JSR packages, strict mode enabled)
- Used throughout: `src/main.ts`, `src/api/client.ts`, `src/commands/`, `src/utils/`

**Secondary:**
- Bash - Used in shell completions and optional git commands
- JSON - Configuration and lock files

## Runtime

**Environment:**
- Deno v2.x (required, specified in README)
- Single-threaded event-driven runtime
- No Node.js required for execution

**Package Manager:**
- Deno native package management (JSR registry)
- Lockfile: `deno.lock` present and committed

## Frameworks

**Core:**
- @cliffy/command 1.0.0-rc.7 (JSR) - CLI command builder with subcommands, options, arguments
- @cliffy/prompt 1.0.0-rc.7 (JSR) - Interactive prompting (used in commands)
- @cliffy/table 1.0.0-rc.7 (JSR) - Table formatting for output

**CLI Framework:**
- Location: `src/main.ts` - Entry point creates Command instance
- Usage: All commands inherit from `@cliffy/command/Command` base class
- Examples: `src/commands/project.ts`, `src/commands/task.ts`, `src/commands/attempt.ts`

**Testing:**
- Deno native test runner (`deno test`)
- @std/assert 1.0.9 (JSR) - Assertion library
- Config: `deno.json` specifies test directories

**Build/Dev:**
- Deno built-in tools:
  - `deno fmt` - Code formatting
  - `deno lint` - Linting
  - `deno check` - Type checking
  - `deno task` - Task runner

## Key Dependencies

**Critical:**
- @cliffy/command 1.0.0-rc.7 - Command-line interface foundation
  - Enables subcommand structure, argument parsing, option handling
  - Required for: `vk project`, `vk task`, `vk attempt`, `vk repository`, `vk config` commands
  - Manages completions generation

- @cliffy/prompt 1.0.0-rc.7 - Interactive prompting
  - Used for interactive selection in commands
  - Integrated with fzf for enhanced selection when available

- @std/path 1.0.8 - Path manipulation
  - Used in `src/api/config.ts` for config file path resolution
  - Critical for cross-platform path handling (HOME, USERPROFILE)

**Infrastructure:**
- @opensrc/deno-open 1.0.0 - Opens URLs/files in default application
  - Used in attempt.ts for opening PRs in browser
  - Location: Not directly imported but available for future use

- @std/assert 1.0.9 - Test assertions
  - Used throughout test files: `tests/api_client_test.ts`, `tests/api_integration_test.ts`

**Optional (System):**
- fzf (external command-line tool) - Interactive fuzzy selection
  - Optional, not required
  - Enhances UX for task/project/attempt selection when available
  - Specified in README as optional installation
  - Deno allows running via `--allow-run=fzf` permission

- git (external command-line tool) - Git operations
  - Required for git commands: clone, branch, merge, push, etc.
  - Specified in Deno CLI installation with `--allow-run=git` permission
  - Used in `src/utils/git.ts` for git operations

## Configuration

**Environment:**
- `VK_API_URL` - Overrides default API endpoint
  - Default: `http://localhost:3000`
  - Loaded in `src/api/config.ts` via `Deno.env.get()`
  - Takes precedence over config file

**Build:**
- `deno.json` - Main configuration file
  - Tasks: dev, fmt, lint, check, test, test:integration
  - Compiler options: `strict: true`
  - Import aliases defined in "imports" section (JSR registry)
  - Fmt/lint include: `src/`, `tests/`
  - Exports: `src/main.ts`

**Config File:**
- Location: `~/.config/vibe-kanban/vk-config.json`
- Format: JSON with single property: `apiUrl`
- Managed by: `src/api/config.ts` loadConfig/saveConfig functions
- Fallback: `http://localhost:3000` if file not found

## Platform Requirements

**Development:**
- Deno v2.x (or higher)
- Optional: fzf for interactive selection
- Optional: Git for operations support
- Cross-platform: macOS, Linux, Windows (Deno handles path differences)

**Production:**
- Deployment target: Single executable via `deno install -g`
- Binary name: `vk`
- Requires runtime access to:
  - Network (HTTP to vibe-kanban API endpoint)
  - File system (read/write for config)
  - Environment variables (VK_API_URL)
  - Git executable (if git operations used)
  - fzf executable (if interactive selection used)

**Installation:**
- Global installation: `deno install -g --allow-net --allow-read --allow-write --allow-env --allow-run=git,fzf -n vk --config deno.json src/main.ts`
- Permission flags required:
  - `--allow-net` - HTTP requests to vibe-kanban API
  - `--allow-read` - Read config files
  - `--allow-write` - Write config files
  - `--allow-env` - Read environment variables
  - `--allow-run=git,fzf` - Run external commands

## Local Development Execution

**Dev Task:**
- `deno task dev` - Runs CLI with development permissions
- Command: `deno run --allow-net --allow-read --allow-write --allow-env --allow-run src/main.ts`

**Test Execution:**
- Unit tests: `deno task test` - Runs all test files
  - Permissions: `--allow-net --allow-read --allow-write --allow-env`
- Integration tests: `deno task test:integration` - Runs `*_integration_test.ts` files
  - Requires running vibe-kanban server
  - Same permissions as unit tests

---

*Stack analysis: 2026-01-30*
