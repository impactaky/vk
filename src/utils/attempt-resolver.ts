/**
 * Attempt resolver utility for auto-detecting attempt IDs from branch names
 */

import type { ApiClient } from "../api/client.ts";
import type { TaskAttempt } from "../api/types.ts";
import { getCurrentBranch } from "./git.ts";
import { selectAttempt, selectTask } from "./fzf.ts";
import { getProjectId } from "./project-resolver.ts";

/**
 * Resolve attempt from current branch name
 * @returns The matching attempt or null if not found
 */
export async function resolveAttemptFromBranch(
  client: ApiClient,
): Promise<TaskAttempt | null> {
  try {
    const branchName = await getCurrentBranch();
    if (!branchName) {
      return null;
    }

    const attempts = await client.searchAttemptsByBranch(branchName);
    return attempts[0] ?? null;
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
 * Get attempt ID with auto-detection support
 * @param client API client
 * @param providedId Explicitly provided attempt ID
 * @param projectId Optional project ID for fallback selection
 * @returns The attempt ID
 */
export async function getAttemptIdWithAutoDetect(
  client: ApiClient,
  providedId: string | undefined,
  projectId?: string,
): Promise<string> {
  if (providedId) {
    return providedId;
  }

  const attempt = await resolveAttemptFromBranch(client);
  if (attempt) {
    return attempt.id;
  }

  const taskId = await selectTaskInteractively(client, projectId);
  const attempts = await client.listAttempts(taskId);
  if (attempts.length === 0) {
    throw new Error("No attempts found for the selected task.");
  }

  return selectAttempt(attempts);
}

/**
 * Get task ID with auto-detection from current attempt's parent task
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

  const attempt = await resolveAttemptFromBranch(client);
  if (attempt) {
    return attempt.task_id;
  }

  return selectTaskInteractively(client, projectId);
}
