# Phase 7: Attempt Spin-Off — Context

## Summary

Create a child task that inherits context from the current workspace. The
command spawns a new task linked to the current workspace's task as its parent,
and sends an initial message to the new agent.

---

## Decisions

### Title Input Flow

- **Title and message are separate** — title is not automatically derived from
  message
- **`--title` flag** — optional, explicitly sets the task title
- **`--message` flag** — provides the message to send to the new agent
- **File input supported** — same pattern as `create` command for message input
- **Default title** — if `--title` not provided, use first line of message
- **No validation** — no character limits or special handling for empty/long
  titles
- **No stdin support** — keep it simple, no `--title -` pattern
- **No parent context shown** during input prompts

### Output Format

- **Simple output** — display new task ID + title only
- **No suggested commands** — don't show `vk attempt cd <id>` or similar
- **No parent relationship display** — keep output minimal

### Parent Context Display

- **No special implementation** — don't add parent info to task display
- **No child tracking** — parent task doesn't show spin-off count
- **Keep it simple** — minimal changes to existing display logic

---

## Out of Scope

- Interactive editor for message input
- Stdin support for scripting
- Parent/child relationship visualization
- Spin-off count tracking on parent tasks
