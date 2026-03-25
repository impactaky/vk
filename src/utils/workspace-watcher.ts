import type { Workspace } from "../api/types.ts";
import {
  createWorkspaceStatusNotification,
  type WorkspaceStatusNotification,
} from "./nats-notify.ts";

export function detectWorkspaceStatusChanges(
  workspaces: Workspace[],
  previousStatuses: ReadonlyMap<string, string>,
): WorkspaceStatusNotification[] {
  const changes: WorkspaceStatusNotification[] = [];

  for (const workspace of workspaces) {
    const notification = createWorkspaceStatusNotification(workspace);
    const previousStatus = previousStatuses.get(workspace.id);
    if (previousStatus !== notification.status) {
      changes.push(notification);
    }
  }

  return changes;
}

export function snapshotWorkspaceStatuses(
  workspaces: Workspace[],
): Map<string, string> {
  return new Map(
    workspaces.map((workspace) => {
      const notification = createWorkspaceStatusNotification(workspace);
      return [workspace.id, notification.status];
    }),
  );
}
