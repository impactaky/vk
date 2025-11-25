import { assertEquals } from "@std/assert";
import { formatAttempt, formatProject, formatTask } from "./fzf.ts";
import type {
  Project,
  TaskAttempt,
  TaskWithAttemptStatus,
} from "../api/types.ts";

Deno.test("formatProject formats project correctly", () => {
  const project: Project = {
    id: "proj-123",
    name: "Test Project",
    git_repo_path: "/path/to/repo",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  const result = formatProject(project);
  assertEquals(result, "proj-123\tTest Project\t/path/to/repo");
});

Deno.test("formatTask formats task correctly", () => {
  const task: TaskWithAttemptStatus = {
    id: "task-456",
    project_id: "proj-123",
    title: "Fix bug",
    status: "in_progress",
    has_in_progress_attempt: true,
    has_merged_attempt: false,
    last_attempt_failed: false,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  const result = formatTask(task);
  assertEquals(result, "task-456\tFix bug\t[in_progress]");
});

Deno.test("formatAttempt formats attempt correctly", () => {
  const attempt: TaskAttempt = {
    id: "attempt-789",
    task_id: "task-456",
    branch: "feature/fix-bug",
    target_branch: "main",
    executor: "CLAUDE_CODE",
    worktree_deleted: false,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  const result = formatAttempt(attempt);
  assertEquals(result, "attempt-789\tfeature/fix-bug\tCLAUDE_CODE");
});
