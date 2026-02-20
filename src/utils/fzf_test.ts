import { assertEquals } from "@std/assert";
import { formatWorkspace } from "./fzf.ts";
import type { Workspace } from "../api/types.ts";

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
    task_id: null,
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
