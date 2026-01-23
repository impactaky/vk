import { assertEquals } from "@std/assert";
import { formatAttempt, formatProject, formatTask } from "./fzf.ts";
import type {
  Project,
  TaskAttempt,
  TaskWithAttemptStatus,
} from "../api/types.ts";

Deno.test("formatProject formats project with repositories correctly", () => {
  const project: Project = {
    id: "proj-123",
    name: "Test Project",
    repositories: [
      {
        id: "repo-1",
        path: "/path/to/repo",
        name: "repo",
        display_name: "Test Repo",
        setup_script: null,
        cleanup_script: null,
        copy_files: null,
        parallel_setup_script: false,
        dev_server_script: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
    ],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  const result = formatProject(project);
  assertEquals(result, "proj-123\tTest Project\t/path/to/repo");
});

Deno.test("formatProject formats project without repositories correctly", () => {
  const project: Project = {
    id: "proj-123",
    name: "Test Project",
    repositories: [],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  const result = formatProject(project);
  assertEquals(result, "proj-123\tTest Project\t(no repositories)");
});

Deno.test("formatTask formats task correctly", () => {
  const task: TaskWithAttemptStatus = {
    id: "task-456",
    project_id: "proj-123",
    title: "Fix bug",
    status: "inprogress",
    has_in_progress_attempt: true,
    has_merged_attempt: false,
    last_attempt_failed: false,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  const result = formatTask(task);
  assertEquals(result, "task-456\tFix bug\t[inprogress]");
});

Deno.test("formatAttempt formats attempt correctly", () => {
  const attempt: TaskAttempt = {
    id: "attempt-789",
    task_id: "task-456",
    branch: "feature/fix-bug",
    target_branch: "main",
    executor: "CLAUDE_CODE:DEFAULT",
    worktree_deleted: false,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  const result = formatAttempt(attempt);
  assertEquals(result, "attempt-789\tfeature/fix-bug\tCLAUDE_CODE:DEFAULT");
});
