import { assertEquals } from "@std/assert";
import { formatTask, formatWorkspace } from "./fzf.ts";
import type { TaskWithAttemptStatus, Workspace } from "../api/types.ts";

Deno.test("formatTask formats task correctly", () => {
  const task: TaskWithAttemptStatus = {
    id: "task-123",
    project_id: "proj-1",
    title: "Test Task",
    description: null,
    status: "todo",
    parent_workspace_id: null,
    has_in_progress_attempt: false,
    last_attempt_failed: false,
    executor: "CLAUDE_CODE",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  const result = formatTask(task);
  assertEquals(result, "task-123\tTest Task\ttodo");
});

Deno.test("formatWorkspace formats workspace with null name", () => {
  const workspace: Workspace = {
    id: "ws-123",
    task_id: "task-1",
    container_ref: null,
    branch: "feature/test",
    agent_working_dir: null,
    setup_completed_at: null,
    archived: false,
    pinned: false,
    name: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  const result = formatWorkspace(workspace);
  assertEquals(result, "ws-123\tfeature/test\t-");
});
