import type { Workspace } from "../api/types.ts";
import {
  createWorkspaceStatusNotification,
  type WorkspaceStatusNotification,
} from "./nats-notify.ts";

type WorkspaceActivityStatus = "active" | "archived" | "deleted";

function getWorkspaceActivityStatus(
  workspace: Workspace,
): WorkspaceActivityStatus {
  if (workspace.worktree_deleted === true) {
    return "deleted";
  }

  if (workspace.archived) {
    return "archived";
  }

  return "active";
}

export function detectWorkspaceStatusChanges(
  workspaces: Workspace[],
  previousStatuses: ReadonlyMap<string, string>,
): WorkspaceStatusNotification[] {
  const changes: WorkspaceStatusNotification[] = [];

  for (const workspace of workspaces) {
    const currentStatus = getWorkspaceActivityStatus(workspace);
    const previousStatus = previousStatuses.get(workspace.id);
    if (
      previousStatus === "active" &&
      (currentStatus === "archived" || currentStatus === "deleted")
    ) {
      changes.push(createWorkspaceStatusNotification(workspace));
    }
  }

  return changes;
}

export function snapshotWorkspaceStatuses(
  workspaces: Workspace[],
): Map<string, string> {
  return new Map(
    workspaces.map((
      workspace,
    ) => [workspace.id, getWorkspaceActivityStatus(workspace)]),
  );
}
