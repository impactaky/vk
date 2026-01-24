import { assertEquals } from "@std/assert";
import { formatProject, formatTask, formatWorkspace } from "./fzf.ts";
import type {
  Project,
  TaskWithWorkspaceStatus,
  Workspace,
} from "../api/types.ts";

Deno.test("formatProject formats project correctly", () => {
  const project: Project = {
    id: "proj-123",
    name: "Test Project",
    default_agent_working_dir: "/path/to/dir",
    remote_project_id: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  const result = formatProject(project);
  assertEquals(result, "proj-123\tTest Project\t/path/to/dir");
});

Deno.test("formatProject formats project with null working dir", () => {
  const project: Project = {
    id: "proj-123",
    name: "Test Project",
    default_agent_working_dir: null,
    remote_project_id: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  const result = formatProject(project);
  assertEquals(result, "proj-123\tTest Project\t-");
});

Deno.test("formatTask formats task correctly", () => {
  const task: TaskWithWorkspaceStatus = {
    id: "task-456",
    project_id: "proj-123",
    title: "Fix bug",
    description: null,
    status: "inprogress",
    parent_workspace_id: null,
    shared_task_id: null,
    has_in_progress_workspace: true,
    has_merged_workspace: false,
    last_workspace_failed: false,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  const result = formatTask(task);
  assertEquals(result, "task-456\tFix bug\t[inprogress]");
});

Deno.test("formatWorkspace formats workspace correctly", () => {
  const workspace: Workspace = {
    id: "workspace-789",
    task_id: "task-456",
    branch: "feature/fix-bug",
    container_ref: null,
    agent_working_dir: "/workdir",
    setup_completed_at: null,
    archived: false,
    pinned: false,
    name: "My Workspace",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  const result = formatWorkspace(workspace);
  assertEquals(result, "workspace-789\tfeature/fix-bug\tMy Workspace");
});

Deno.test("formatWorkspace formats workspace with null name", () => {
  const workspace: Workspace = {
    id: "workspace-789",
    task_id: "task-456",
    branch: "feature/fix-bug",
    container_ref: null,
    agent_working_dir: null,
    setup_completed_at: null,
    archived: false,
    pinned: false,
    name: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  const result = formatWorkspace(workspace);
  assertEquals(result, "workspace-789\tfeature/fix-bug\t-");
});
