import { assertEquals, assertRejects } from "@std/assert";
import type { ApiClient } from "../api/client.ts";
import type { Workspace } from "../api/types.ts";
import {
  getAttemptIdWithAutoDetect,
  resolveWorkspaceFromBranch,
} from "./attempt-resolver.ts";

function createWorkspace(id: string, branch: string): Workspace {
  return {
    id,
    task_id: "task-1",
    container_ref: null,
    branch,
    agent_working_dir: null,
    setup_completed_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    archived: false,
    pinned: false,
    name: null,
  };
}

Deno.test("resolveWorkspaceFromBranch: returns first workspace for current branch", async () => {
  let searchedBranch = "";
  const client = {} as ApiClient;

  const workspace = await resolveWorkspaceFromBranch(client, {
    getCurrentBranch: async () => "feature/branch-match",
    searchWorkspacesByBranch: async (_client, branchName) => {
      searchedBranch = branchName;
      return [createWorkspace("ws-1", branchName)];
    },
  });

  assertEquals(searchedBranch, "feature/branch-match");
  assertEquals(workspace?.id, "ws-1");
});

Deno.test("resolveWorkspaceFromBranch: returns null when no workspace matches branch", async () => {
  const workspace = await resolveWorkspaceFromBranch({} as ApiClient, {
    getCurrentBranch: async () => "feature/no-match",
    searchWorkspacesByBranch: async () => [],
  });

  assertEquals(workspace, null);
});

Deno.test("getAttemptIdWithAutoDetect: prefers explicit ID", async () => {
  const id = await getAttemptIdWithAutoDetect(
    {} as ApiClient,
    "explicit-id",
    {
      resolveWorkspaceFromBranch: async () => createWorkspace("ws-branch", "b"),
      listWorkspaces: async () => [createWorkspace("ws-list", "b")],
      selectWorkspace: async () => "ws-list",
    },
  );

  assertEquals(id, "explicit-id");
});

Deno.test("getAttemptIdWithAutoDetect: uses branch match when ID omitted", async () => {
  const id = await getAttemptIdWithAutoDetect(
    {} as ApiClient,
    undefined,
    {
      resolveWorkspaceFromBranch: async () =>
        createWorkspace("ws-branch-match", "feature/x"),
      listWorkspaces: async () => [createWorkspace("ws-list", "feature/y")],
      selectWorkspace: async () => "ws-list",
    },
  );

  assertEquals(id, "ws-branch-match");
});

Deno.test("getAttemptIdWithAutoDetect: falls back to interactive workspace selection", async () => {
  let selectCalled = false;
  const id = await getAttemptIdWithAutoDetect(
    {} as ApiClient,
    undefined,
    {
      resolveWorkspaceFromBranch: async () => null,
      listWorkspaces: async () => [
        createWorkspace("ws-1", "feature/a"),
        createWorkspace("ws-2", "feature/b"),
      ],
      selectWorkspace: async (workspaces: Workspace[]) => {
        selectCalled = true;
        return workspaces[1].id;
      },
    },
  );

  assertEquals(selectCalled, true);
  assertEquals(id, "ws-2");
});

Deno.test("getAttemptIdWithAutoDetect: throws clear error when unresolved", async () => {
  await assertRejects(
    () =>
      getAttemptIdWithAutoDetect(
        {} as ApiClient,
        undefined,
        {
          resolveWorkspaceFromBranch: async () => null,
          listWorkspaces: async () => [],
          selectWorkspace: async () => {
            throw new Error("should not be called");
          },
        },
      ),
    Error,
    "Not in a workspace branch. Provide workspace ID.",
  );
});
