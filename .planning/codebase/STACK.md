# Technology Stack

**Analysis Date:** 2026-02-08

## Languages

**Primary:**

- TypeScript - Full source code
- JavaScript - Emitted runtime code from TypeScript

## Runtime

**Environment:**

- Deno v2.x
  - Key permissions used: `--allow-net`, `--allow-read`, `--allow-write`,
    `--allow-env`, `--allow-run=git,fzf`

**Package Manager:**

- Deno JSR (JavaScript Registry) for dependencies
- Lockfile: `deno.lock` (present)

## Frameworks

**CLI:**

- `@cliffy/command` v1.0.0-rc.7 - Command-line argument parsing and structure
- `@cliffy/prompt` v1.0.0-rc.7 - Interactive prompts for user input
- `@cliffy/table` v1.0.0-rc.7 - Formatted table output
- `@cliffy/ansi` v1.0.0-rc.7 - ANSI color/styling (via Cliffy)

**Testing:**

- Deno's built-in test runner (`deno test`)
- `@std/assert` v1.0.9 - Assertion library

**Build/Dev:**

- Deno's built-in tools:
  - `deno fmt` - Code formatting
  - `deno lint` - Linting
  - `deno check` - Type checking
  - `deno doc` - API documentation generation (text and HTML)
  - `deno compile` - Binary compilation

**External Tools:**

- `fzf` v1+ - Interactive fuzzy finder (optional, for selection UX)
- `git` - Version control operations

## Key Dependencies

**Critical:**

- `@cliffy/*` - All CLI framework components (command building, user input,
  output formatting)
- `@std/path` v1.0.8 - Cross-platform path utilities
- `@std/assert` v1.0.9 - Test assertions
- `@opensrc/deno-open` v1.0.0 - Open URLs/files in default application

**Infrastructure:**

- `@types/node` v24.2.0 - TypeScript definitions (for IDE/tooling compatibility)
- `undici-types` v7.10.0 - Fetch/HTTP types (transitive)

## Configuration

**Environment:**

- `VK_API_URL` - Vibe-Kanban API endpoint (defaults to `http://localhost:3000`)
  - Set in `src/api/config.ts` via `Deno.env.get("VK_API_URL")`
  - Can override local config file at `~/.config/vibe-kanban/vk-config.json`

**Build:**

- `deno.json` - Main config file with:
  - Package metadata (`name`, `version`, `exports`)
  - Task definitions (`dev`, `fmt`, `lint`, `check`, `test`, `test:integration`)
  - Import map for dependency resolution
  - Compiler options (`strict: true`)
  - Format/lint scopes

## Platform Requirements

**Development:**

- Deno v2.x runtime
- Unix-like shell for git operations
- `fzf` (optional, for interactive selection)

**Production:**

- Deno v2.x runtime (or cross-platform compiled binary)
- HTTP network access to vibe-kanban API
- Local git installation for repository operations
- `fzf` (optional, for interactive selection)

## Compilation Targets

Binary compilation via `deno compile` supports:

- `x86_64-unknown-linux-gnu` → `vk-linux-x64`
- `aarch64-unknown-linux-gnu` → `vk-linux-arm64`
- `x86_64-pc-windows-msvc` → `vk-windows-x64.exe`
- `x86_64-apple-darwin` → `vk-macos-x64`
- `aarch64-apple-darwin` → `vk-macos-arm64`

---

_Stack analysis: 2026-01-30_
