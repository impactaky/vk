import { assertEquals } from "@std/assert";
import { formatRepository, formatWorkspace } from "./fzf.ts";
import type { Repo, Workspace } from "../api/types.ts";

Deno.test("formatRepository formats repository correctly", () => {
  const repo: Repo = {
    id: "repo-123",
    path: "/tmp/repo",
    name: "demo-repo",
    display_name: "Demo Repo",
    setup_script: null,
    cleanup_script: null,
    copy_files: null,
    parallel_setup_script: false,
    dev_server_script: null,
    default_target_branch: null,
    default_working_dir: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  const result = formatRepository(repo);
  assertEquals(result, "repo-123\tdemo-repo\t/tmp/repo");
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
