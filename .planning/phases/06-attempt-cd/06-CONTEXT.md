# Phase 6: Attempt CD — Context

## Local Navigation Behavior

**Decision:** Spawn subshell in workspace directory

- Spawn a subshell using configured shell (default: bash)
- Shell preference configurable via `vk config` command
- Do not modify PS1 or shell environment
- No nested shell detection needed
- On shell exit: notify user (e.g., "Exited workspace shell")

## SSH Session Behavior

**Decision:** Use SSH with interactive shell

- Command format: `ssh <host> -t "cd <path> && $SHELL"`
- Use host string exactly as stored in workspace config
- Let SSH handle errors natively (auth, network, etc.)
- If workspace has host but no remote path: error

## Output and Feedback

**Decision:** Simple success message before shell spawn

- Format: `Entering workspace: <branch>`
- Show before spawning shell (local or remote)
- Display workspace/branch name (not full path)
- Same message format for local and remote

## Edge Cases

**Decision:** All failures are errors

- No workdir configured: error
- Branch not found: error
- Path doesn't exist: error
- No remote path for SSH host: error

## Configuration

**Decision:** Shell preference in global vk config

- Add shell setting to `vk config` command
- Default: bash
- Used for local subshell spawn

## Deferred Ideas

(None captured)
