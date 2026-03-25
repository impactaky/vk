import { assertEquals, assertRejects } from "@std/assert";
import {
  createWorkspaceStatusNotification,
  decodeNotification,
  waitForBranchNotification,
  waitForWorkspaceNotification,
} from "./nats-notify.ts";
import type { Workspace } from "../api/types.ts";

Deno.test("decodeNotification preserves legacy raw branch payloads", () => {
  const notification = decodeNotification(
    new TextEncoder().encode("feature/x"),
  );
  assertEquals(notification, { type: "branch", branch: "feature/x" });
});

Deno.test("createWorkspaceStatusNotification falls back to completion from setup timestamp", () => {
  const workspace: Workspace = {
    id: "ws-1",
    task_id: null,
    container_ref: null,
    branch: "feature/x",
    agent_working_dir: null,
    setup_completed_at: "2026-03-25T00:00:00Z",
    created_at: "2026-03-25T00:00:00Z",
    updated_at: "2026-03-25T00:00:00Z",
    archived: false,
    pinned: false,
    name: "Workspace",
  };

  assertEquals(createWorkspaceStatusNotification(workspace), {
    type: "workspace-status",
    workspaceId: "ws-1",
    branch: "feature/x",
    status: "SetupComplete",
    finished: false,
  });
});

Deno.test("waitForBranchNotification ignores workspace notifications", async () => {
  const notifications = (async function* () {
    yield {
      type: "workspace-status" as const,
      workspaceId: "ws-1",
      branch: "feature/x",
      status: "SetupRunning" as const,
      finished: false,
    };
    yield { type: "branch" as const, branch: "feature/target" };
  })();

  await waitForBranchNotification(notifications, "feature/target");
});

Deno.test("waitForWorkspaceNotification resolves on terminal workspace notification", async () => {
  const notifications = (async function* () {
    yield {
      type: "workspace-status" as const,
      workspaceId: "ws-1",
      branch: "feature/x",
      status: "SetupRunning" as const,
      finished: false,
    };
    yield {
      type: "workspace-status" as const,
      workspaceId: "ws-1",
      branch: "feature/x",
      status: "archived" as const,
      finished: true,
    };
  })();

  const notification = await waitForWorkspaceNotification(
    notifications,
    "ws-1",
  );
  assertEquals(notification.status, "archived");
});

Deno.test("waitForWorkspaceNotification rejects if the stream ends too early", async () => {
  const notifications = (async function* () {
    yield {
      type: "workspace-status" as const,
      workspaceId: "ws-1",
      branch: "feature/x",
      status: "SetupRunning" as const,
      finished: false,
    };
  })();

  await assertRejects(
    async () => {
      await waitForWorkspaceNotification(notifications, "ws-1");
    },
    Error,
    'Subscription ended before receiving completion notification for workspace "ws-1".',
  );
});
