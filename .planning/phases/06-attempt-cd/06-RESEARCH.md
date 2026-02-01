# Phase 6: Attempt CD - Research

**Researched:** 2026-02-01
**Domain:** Process spawning, shell execution, SSH client operations
**Confidence:** HIGH

## Summary

This phase requires implementing workspace navigation through two distinct mechanisms: spawning interactive subshells for local workspaces and establishing SSH sessions for remote workspaces. The primary technical challenges involve process lifecycle management in Deno, URL hostname parsing to distinguish local from remote APIs, and SSH command construction for interactive terminal sessions.

The standard approach uses Deno's native `Deno.Command` API with inherited stdio for local shell spawning, and direct SSH command execution with the `-t` flag for remote sessions. The implementation must handle shell preference configuration, workspace path resolution, and proper exit notifications.

**Primary recommendation:** Use `Deno.Command.spawn()` with inherited stdio for local shells and `ssh -t <host> "cd <path> && $SHELL"` for remote sessions, with hostname detection via URL parsing against localhost patterns (localhost, 127.0.0.1, ::1).

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Deno.Command | Native | Process spawning and subprocess management | Built into Deno runtime, handles stdio inheritance, no external dependencies |
| URL (WHATWG) | Native | URL parsing and hostname extraction | Standard web API, reliable hostname detection |
| ssh | System | Remote shell access | Universal Unix tool, handles authentication and terminal allocation |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @std/path | 1.0.8 | Path manipulation (already in project) | Validating and normalizing workspace directory paths |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Deno.Command | node:child_process spawn | Node compat mode adds complexity, Deno.Command is more idiomatic |
| Direct ssh exec | SSH client library | No mature Deno SSH libraries; system ssh is ubiquitous and handles auth |
| Manual hostname parsing | local-hostname npm package | 171B utility vs builtin URL API; URL API is sufficient for basic localhost detection |

**Installation:**
```bash
# No additional dependencies required - uses Deno standard library
```

## Architecture Patterns

### Recommended Command Structure
```
src/commands/attempt.ts
  └── cd subcommand
      ├── Workspace resolution (ID > branch > error)
      ├── Localhost detection (URL hostname parsing)
      ├── Local path: spawn subshell with inherited stdio
      └── Remote path: execute ssh -t command
```

### Pattern 1: Local Shell Spawning with Inherited Stdio
**What:** Spawn an interactive shell process that inherits parent's stdin/stdout/stderr
**When to use:** When API URL hostname indicates localhost (127.0.0.1, localhost, ::1)
**Example:**
```typescript
// Source: https://docs.deno.com/examples/subprocess_tutorial/
// By default, Deno.Command inherits stdin, stdout, stderr from parent

const shell = Deno.env.get("SHELL") || "bash"; // User's preferred shell
const command = new Deno.Command(shell, {
  args: [], // Empty args for interactive shell
  cwd: workspaceDir, // Working directory for shell
  // stdio defaults to "inherit" for spawn() - interactive by default
});

const process = command.spawn();
const status = await process.status;

if (!status.success) {
  console.error(`Shell exited with code ${status.code}`);
}
```

### Pattern 2: SSH Interactive Session
**What:** Execute ssh with pseudo-terminal allocation and shell startup in workspace directory
**When to use:** When API URL hostname is not localhost (remote API server)
**Example:**
```typescript
// Source: https://ostechnix.com/how-to-ssh-into-a-particular-directory-on-linux/
// ssh -t forces pseudo-terminal allocation for interactive commands

const shell = Deno.env.get("SHELL") || "bash";
const command = new Deno.Command("ssh", {
  args: [
    "-t",  // Force pseudo-terminal allocation
    workspace.host,  // SSH host from workspace config
    `cd ${workspace.agent_working_dir} && exec ${shell}`
  ],
  // stdio defaults to "inherit" for spawn() - user interacts directly
});

const process = command.spawn();
const status = await process.status;
```

### Pattern 3: Localhost Detection via URL Parsing
**What:** Parse API URL hostname and check against localhost patterns
**When to use:** Determining whether to spawn local shell or SSH session
**Example:**
```typescript
// Source: https://github.com/lukeed/local-hostname (pattern reference)
// Localhost patterns: localhost, 127.0.0.0/8, ::1

function isLocalhost(apiUrl: string): boolean {
  const url = new URL(apiUrl);
  const hostname = url.hostname;

  // Exact matches
  if (hostname === 'localhost' || hostname === '::1') {
    return true;
  }

  // IPv4 loopback range 127.0.0.0/8
  if (hostname.startsWith('127.')) {
    return true;
  }

  // Could also check 0.0.0.0 if binding to all interfaces
  if (hostname === '0.0.0.0') {
    return true;
  }

  return false;
}
```

### Pattern 4: Shell Preference Configuration
**What:** Store and retrieve user's preferred shell via config system
**When to use:** Setting default shell for local subshell spawning
**Example:**
```typescript
// Extend existing config.ts patterns (src/api/config.ts)

export interface Config {
  apiUrl: string;
  shell?: string;  // Add shell preference
}

// In config command (src/commands/config.ts)
case "shell":
  config.shell = value;
  break;

// In shell spawning code
const shell = config.shell || Deno.env.get("SHELL") || "bash";
```

### Anti-Patterns to Avoid
- **Don't change parent process directory**: Using `Deno.chdir()` in the CLI process won't affect the user's shell - spawn a subshell instead
- **Don't use piped stdio for interactive shells**: Piped stdin/stdout breaks user interaction - use inherited stdio
- **Don't skip `-t` flag for SSH**: Without pseudo-terminal allocation, interactive shells won't work properly over SSH
- **Don't hardcode shell**: Respect user's `$SHELL` environment variable or config preference
- **Don't forget to await process.status**: Process becomes zombie if not properly reaped

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL hostname parsing | Custom regex for localhost detection | Built-in URL API + simple checks | WHATWG URL API handles edge cases (ports, IPv6, etc) |
| Process spawning | Manual stdin/stdout piping | Deno.Command with inherited stdio | Default inheritance handles terminal control properly |
| SSH session management | Custom SSH protocol implementation | System `ssh` command | SSH handles authentication, host keys, terminal modes, signal handling |
| Shell configuration | Custom config file format | Extend existing Config interface | Reuses established config patterns, single source of truth |

**Key insight:** Process and terminal management has subtle edge cases around signal handling, TTY allocation, and stdio buffering. Using built-in APIs and system tools (ssh) avoids reimplementing decades of battle-tested code.

## Common Pitfalls

### Pitfall 1: Forgetting `-t` Flag for SSH
**What goes wrong:** SSH session starts but shell doesn't spawn or exits immediately
**Why it happens:** Without `-t`, SSH doesn't allocate a pseudo-terminal, and interactive shells require a TTY
**How to avoid:** Always use `ssh -t` for interactive commands
**Warning signs:** SSH connects successfully but no prompt appears, or immediate disconnect
**Source:** [Baeldung - Pseudo-terminal allocation](https://www.baeldung.com/linux/ssh-pseudo-terminal-allocation)

### Pitfall 2: Using Piped Stdio for Interactive Shells
**What goes wrong:** Shell spawns but user input doesn't work, or subprocess hangs
**Why it happens:** Piped stdio breaks terminal control - user's keystrokes go nowhere
**How to avoid:** Use default stdio (inherited) for `spawn()`, don't set `stdin: "piped"`
**Warning signs:** Shell starts but doesn't respond to input, or `process.stdin` access throws TypeError
**Source:** [Deno Command API](https://docs.deno.com/api/deno/~/Deno.Command)

### Pitfall 3: Not Awaiting process.status
**What goes wrong:** Process becomes zombie, parent exits before child cleanup
**Why it happens:** Spawned process isn't reaped by parent
**How to avoid:** Always `await process.status` before function returns
**Warning signs:** Zombie processes in `ps aux`, resource leaks
**Source:** [Deno subprocess tutorial](https://docs.deno.com/examples/subprocess_tutorial/)

### Pitfall 4: Incomplete Localhost Detection
**What goes wrong:** Local API detected as remote (or vice versa), spawns SSH when should spawn shell
**Why it happens:** Only checking "localhost" string, missing 127.0.0.1, ::1, or subdomain variants
**How to avoid:** Check all localhost patterns - "localhost", 127.0.0.0/8 range, ::1 (IPv6)
**Warning signs:** Error "host not found" when API URL is http://127.0.0.1:3000
**Source:** [Wikipedia - Localhost](https://en.wikipedia.org/wiki/Localhost), [local-hostname GitHub](https://github.com/lukeed/local-hostname)

### Pitfall 5: Hardcoding Shell to "bash"
**What goes wrong:** Spawns bash when user's shell is zsh/fish/other, wrong config files loaded
**Why it happens:** Assuming bash is universal
**How to avoid:** Check `$SHELL` environment variable first, fall back to config, then "bash" as last resort
**Warning signs:** User complaints about "wrong shell", missing aliases/config
**Source:** [DigitalOcean - Shell environment variables](https://www.digitalocean.com/community/tutorials/how-to-read-and-set-environmental-and-shell-variables-on-linux)

### Pitfall 6: Missing `exec` in SSH Command
**What goes wrong:** Extra bash process remains after user exits shell, or exit doesn't work cleanly
**Why it happens:** `cd <path> && bash` spawns bash as child; user exit only exits inner bash
**How to avoid:** Use `exec $SHELL` instead of just `$SHELL` - replaces SSH process with shell
**Warning signs:** Double-exit needed to close session, extra process in `ps`
**Source:** [OSTechNix - SSH into directory](https://ostechnix.com/how-to-ssh-into-a-particular-directory-on-linux/)

## Code Examples

Verified patterns from official sources:

### Spawning Interactive Subshell (Local)
```typescript
// Source: https://docs.deno.com/examples/subprocess_tutorial/
async function spawnLocalShell(workspaceDir: string, shellPreference?: string) {
  // Get shell from config, $SHELL env var, or default to bash
  const shell = shellPreference || Deno.env.get("SHELL") || "bash";

  console.log(`Entering workspace: ${workspaceBranch}`);

  const command = new Deno.Command(shell, {
    cwd: workspaceDir,
    // stdio defaults to "inherit" for spawn() - interactive terminal
  });

  const process = command.spawn();
  const status = await process.status;

  console.log("Exited workspace shell");

  if (!status.success) {
    throw new Error(`Shell exited with code ${status.code}`);
  }
}
```

### SSH Interactive Session (Remote)
```typescript
// Source: https://ostechnix.com/how-to-ssh-into-a-particular-directory-on-linux/
async function spawnRemoteShell(
  host: string,
  remotePath: string,
  shellPreference?: string,
  workspaceBranch: string
) {
  const shell = shellPreference || Deno.env.get("SHELL") || "bash";

  console.log(`Entering workspace: ${workspaceBranch}`);

  // Use exec to replace ssh process with shell (clean exit)
  const command = new Deno.Command("ssh", {
    args: [
      "-t",  // Force pseudo-terminal allocation
      host,
      `cd ${remotePath} && exec ${shell}`
    ],
    // stdio inherited by default for spawn()
  });

  const process = command.spawn();
  const status = await process.status;

  console.log("Exited workspace shell");

  if (!status.success) {
    throw new Error(`SSH session exited with code ${status.code}`);
  }
}
```

### Localhost Detection
```typescript
// Source: https://github.com/lukeed/local-hostname (pattern reference)
function isLocalhost(apiUrl: string): boolean {
  const url = new URL(apiUrl);
  const hostname = url.hostname.toLowerCase();

  // Exact string matches
  if (hostname === 'localhost' || hostname === '::1') {
    return true;
  }

  // IPv4 loopback range 127.0.0.0/8
  if (hostname.startsWith('127.')) {
    return true;
  }

  // Catch-all for local binding (if API bound to 0.0.0.0)
  if (hostname === '0.0.0.0') {
    return true;
  }

  return false;
}
```

### Shell Configuration Extension
```typescript
// Extend existing config.ts patterns
export interface Config {
  apiUrl: string;
  shell?: string;  // User's preferred shell
}

// In config command
case "shell":
  config.shell = value;
  break;

case "remote-shell":  // Deprecated, just use "shell"
  config.shell = value;
  console.warn("Warning: remote-shell is deprecated. Use 'shell' instead.");
  break;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Deno.run() | Deno.Command() | Deno 1.28 (2022) | Deno.run deprecated, Command is the stable API |
| Manual cd in parent | Spawn subshell with cwd | N/A - shell limitation | Can't change parent shell directory from subprocess |
| ssh without -t | ssh -t for interactive | N/A - long-standing practice | -t required for pseudo-terminal allocation |

**Deprecated/outdated:**
- `Deno.run()`: Replaced by `Deno.Command` - more ergonomic API, better TypeScript support
- Separate "remote-shell" config: User intent clarification from CONTEXT.md - single "shell" preference for both local and remote

## Open Questions

1. **Path quoting for SSH command**
   - What we know: SSH command passes through shell expansion
   - What's unclear: Whether workspace paths need quoting if they contain spaces
   - Recommendation: Quote path in SSH command string to handle edge cases: `"cd \"${remotePath}\" && exec ${shell}"`

2. **SSH host format validation**
   - What we know: Host stored in workspace config, passed directly to ssh
   - What's unclear: Whether host includes username (user@host) or just hostname
   - Recommendation: Document expected format, let ssh handle errors (will fail with clear message)

3. **Shell exit notification timing**
   - What we know: User decision is to notify on exit
   - What's unclear: Whether to show before waiting for status or after status returns
   - Recommendation: Print after status returns - cleaner output, confirms exit completed

## Sources

### Primary (HIGH confidence)
- [Deno.Command API](https://docs.deno.com/api/deno/~/Deno.Command) - Official Deno documentation for subprocess spawning
- [Deno subprocess tutorial](https://docs.deno.com/examples/subprocess_tutorial/) - Official guide on creating subprocesses with inherited stdio
- [local-hostname GitHub](https://github.com/lukeed/local-hostname) - Reference implementation for localhost detection patterns
- [Wikipedia - Localhost](https://en.wikipedia.org/wiki/Localhost) - Authoritative definition of loopback addresses (127.0.0.0/8, ::1)
- [Deno.chdir documentation](https://docs.deno.com/api/deno/~/Deno.chdir) - Working directory operations in Deno

### Secondary (MEDIUM confidence)
- [Baeldung - Pseudo-terminal allocation](https://www.baeldung.com/linux/ssh-pseudo-terminal-allocation) - SSH -t option best practices
- [OSTechNix - SSH into directory](https://ostechnix.com/how-to-ssh-into-a-particular-directory-on-linux/) - SSH cd && shell patterns
- [DigitalOcean - Shell environment variables](https://www.digitalocean.com/community/tutorials/how-to-read-and-set-environmental-and-shell-variables-on-linux) - $SHELL usage and behavior

### Tertiary (LOW confidence)
- WebSearch results on Deno spawn errors - General troubleshooting patterns, not Deno-specific

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Deno.Command is official API, ssh is universal Unix tool
- Architecture: HIGH - Patterns verified against official Deno docs and existing codebase
- Pitfalls: HIGH - Based on official documentation and common SSH/process issues

**Research date:** 2026-02-01
**Valid until:** 2026-03-01 (30 days - stable domain, unlikely to change)
