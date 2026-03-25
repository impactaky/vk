import type { Workspace, WorkspaceStatus } from "../api/types.ts";
import { loadConfig } from "../api/config.ts";

export const DEFAULT_NATS_HOST = "localhost";
export const DEFAULT_NATS_PORT = 4222;
export const DEFAULT_NATS_SUBJECT = "vk.notify";

export type WorkspaceWatchStatus =
  | WorkspaceStatus
  | "archived"
  | "deleted";

export type BranchNotification = {
  type: "branch";
  branch: string;
};

export type WorkspaceStatusNotification = {
  type: "workspace-status";
  workspaceId: string;
  branch: string;
  status: WorkspaceWatchStatus;
  finished: boolean;
};

export type VkNotification = BranchNotification | WorkspaceStatusNotification;

export type NatsConnectionOptions = {
  host: string;
  port: number;
  subject: string;
};

export async function resolveNatsConnectionOptions(options: {
  host?: string;
  port?: number;
  subject?: string;
}): Promise<NatsConnectionOptions> {
  const config = await loadConfig();
  return {
    host: options.host || config.natsHost || DEFAULT_NATS_HOST,
    port: options.port || config.natsPort || DEFAULT_NATS_PORT,
    subject: options.subject || config.natsSubject || DEFAULT_NATS_SUBJECT,
  };
}

export function isWorkspaceFinishedStatus(
  status: WorkspaceWatchStatus,
): boolean {
  return status === "SetupComplete" || status === "SetupFailed" ||
    status === "ExecutorComplete" || status === "ExecutorFailed";
}

export function getWorkspaceWatchStatus(
  workspace: Workspace,
): WorkspaceWatchStatus {
  if (workspace.worktree_deleted === true) {
    return "deleted";
  }

  if (workspace.archived) {
    return "archived";
  }

  if (workspace.status) {
    return workspace.status;
  }

  if (workspace.setup_completed_at) {
    return "SetupComplete";
  }

  return "SetupRunning";
}

export function createWorkspaceStatusNotification(
  workspace: Workspace,
): WorkspaceStatusNotification {
  const status = getWorkspaceWatchStatus(workspace);
  return {
    type: "workspace-status",
    workspaceId: workspace.id,
    branch: workspace.branch,
    status,
    finished: isWorkspaceFinishedStatus(status),
  };
}

export function encodeNotification(notification: VkNotification): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(notification));
}

export function decodeNotification(data: Uint8Array): VkNotification {
  const text = new TextDecoder().decode(data).trim();
  if (text.length === 0) {
    throw new Error("Received empty NATS notification.");
  }

  try {
    const parsed = JSON.parse(text);
    if (
      typeof parsed === "object" && parsed !== null && "type" in parsed &&
      parsed.type === "branch" && typeof parsed.branch === "string"
    ) {
      return { type: "branch", branch: parsed.branch };
    }

    if (
      typeof parsed === "object" && parsed !== null && "type" in parsed &&
      parsed.type === "workspace-status" &&
      typeof parsed.workspaceId === "string" &&
      typeof parsed.branch === "string" &&
      typeof parsed.status === "string" &&
      typeof parsed.finished === "boolean"
    ) {
      return {
        type: "workspace-status",
        workspaceId: parsed.workspaceId,
        branch: parsed.branch,
        status: parsed.status as WorkspaceWatchStatus,
        finished: parsed.finished,
      };
    }
  } catch {
    // Backward compatibility with the original plain branch payload format.
  }

  return { type: "branch", branch: text };
}

export async function* notificationStream(
  messages: AsyncIterable<{ data: Uint8Array }>,
): AsyncGenerator<VkNotification> {
  for await (const message of messages) {
    yield decodeNotification(message.data);
  }
}

export async function waitForBranchNotification(
  notifications: AsyncIterable<VkNotification>,
  targetBranch: string,
): Promise<void> {
  for await (const notification of notifications) {
    if (
      notification.type === "branch" && notification.branch === targetBranch
    ) {
      return;
    }
  }

  throw new Error(
    `Subscription ended before receiving branch "${targetBranch}" notification.`,
  );
}

export async function waitForWorkspaceNotification(
  notifications: AsyncIterable<VkNotification>,
  workspaceId: string,
): Promise<WorkspaceStatusNotification> {
  for await (const notification of notifications) {
    if (
      notification.type === "workspace-status" &&
      notification.workspaceId === workspaceId &&
      notification.finished
    ) {
      return notification;
    }
  }

  throw new Error(
    `Subscription ended before receiving completion notification for workspace "${workspaceId}".`,
  );
}
