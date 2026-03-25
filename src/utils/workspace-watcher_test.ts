import { assertEquals } from "@std/assert";
import {
  detectWorkspaceStatusChanges,
  snapshotWorkspaceStatuses,
} from "./workspace-watcher.ts";
import type { Workspace } from "../api/types.ts";

function makeWorkspace(
  id: string,
  status?: Workspace["status"],
  setupCompletedAt: string | null = null,
): Workspace {
  return {
    id,
    task_id: null,
    container_ref: null,
    status,
    branch: `feature/${id}`,
    agent_working_dir: null,
    setup_completed_at: setupCompletedAt,
    created_at: "2026-03-25T00:00:00Z",
    updated_at: "2026-03-25T00:00:00Z",
    archived: false,
    pinned: false,
    name: id,
  };
}

Deno.test("detectWorkspaceStatusChanges emits initial statuses", () => {
  const changes = detectWorkspaceStatusChanges(
    [makeWorkspace("ws-1")],
    new Map(),
  );
  assertEquals(changes.length, 1);
  assertEquals(changes[0].status, "SetupRunning");
});

Deno.test("detectWorkspaceStatusChanges skips unchanged statuses", () => {
  const workspaces = [makeWorkspace("ws-1", "SetupRunning")];
  const previous = snapshotWorkspaceStatuses(workspaces);
  const changes = detectWorkspaceStatusChanges(workspaces, previous);
  assertEquals(changes.length, 0);
});

Deno.test("detectWorkspaceStatusChanges reports transitions only once", () => {
  const previous = snapshotWorkspaceStatuses([
    makeWorkspace("ws-1", "SetupRunning"),
  ]);
  const changes = detectWorkspaceStatusChanges(
    [makeWorkspace("ws-1", "ExecutorComplete")],
    previous,
  );

  assertEquals(changes.length, 1);
  assertEquals(changes[0].workspaceId, "ws-1");
  assertEquals(changes[0].status, "ExecutorComplete");
  assertEquals(changes[0].finished, true);
});

Deno.test("detectWorkspaceStatusChanges reports archived transitions", () => {
  const previous = snapshotWorkspaceStatuses([
    makeWorkspace("ws-1", "SetupRunning"),
  ]);
  const archivedWorkspace = {
    ...makeWorkspace("ws-1", "SetupRunning"),
    archived: true,
  };
  const changes = detectWorkspaceStatusChanges([archivedWorkspace], previous);

  assertEquals(changes.length, 1);
  assertEquals(changes[0].status, "archived");
  assertEquals(changes[0].finished, false);
});

Deno.test("detectWorkspaceStatusChanges reports deleted transitions", () => {
  const previous = snapshotWorkspaceStatuses([
    makeWorkspace("ws-1", "SetupRunning"),
  ]);
  const deletedWorkspace = {
    ...makeWorkspace("ws-1", "SetupRunning"),
    worktree_deleted: true,
  };
  const changes = detectWorkspaceStatusChanges([deletedWorkspace], previous);

  assertEquals(changes.length, 1);
  assertEquals(changes[0].status, "deleted");
  assertEquals(changes[0].finished, false);
});
