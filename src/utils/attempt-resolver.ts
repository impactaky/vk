/**
 * Workspace resolver utility for auto-detecting workspace IDs from branch names
 */

import type { ApiClient } from "../api/client.ts";
import type { Workspace } from "../api/types.ts";
import { getCurrentBranch } from "./git.ts";
import { selectTask, selectWorkspace } from "./fzf.ts";
import { getProjectId } from "./project-resolver.ts";

/**
 * Resolve workspace from current branch name
 * @returns The matching workspace or null if not found
 */
export async function resolveWorkspaceFromBranch(
  client: ApiClient,
): Promise<Workspace | null> {
  try {
    const branchName = await getCurrentBranch();
    if (!branchName) {
      return null;
    }

    const workspaces = await client.searchWorkspacesByBranch(branchName);
    return workspaces[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Select a task interactively using fzf
 */
async function selectTaskInteractively(
  client: ApiClient,
  projectId: string | undefined,
): Promise<string> {
  const resolvedProjectId = await getProjectId(projectId, client);
  const tasks = await client.listTasks(resolvedProjectId);
  if (tasks.length === 0) {
    throw new Error("No tasks found in the project.");
  }
  return selectTask(tasks);
}

/**
 * Get workspace ID with auto-detection support
 * @param client API client
 * @param providedId Explicitly provided workspace ID
 * @param projectId Optional project ID for fallback selection
 * @returns The workspace ID
 */
export async function getAttemptIdWithAutoDetect(
  client: ApiClient,
  providedId: string | undefined,
  projectId?: string,
): Promise<string> {
  if (providedId) {
    return providedId;
  }

  const workspace = await resolveWorkspaceFromBranch(client);
  if (workspace) {
    return workspace.id;
  }

  const taskId = await selectTaskInteractively(client, projectId);
  const workspaces = await client.listWorkspaces(taskId);
  if (workspaces.length === 0) {
    throw new Error("No workspaces found for the selected task.");
  }

  return selectWorkspace(workspaces);
}

/**
 * Get task ID with auto-detection from current workspace's parent task
 * @param client API client
 * @param providedId Explicitly provided task ID
 * @param projectId Optional project ID for fallback selection
 * @returns The task ID
 */
export async function getTaskIdWithAutoDetect(
  client: ApiClient,
  providedId: string | undefined,
  projectId?: string,
): Promise<string> {
  if (providedId) {
    return providedId;
  }

  const workspace = await resolveWorkspaceFromBranch(client);
  if (workspace) {
    return workspace.task_id;
  }

  return selectTaskInteractively(client, projectId);
}
