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
    // Get current branch
    const branchName = await getCurrentBranch();
    if (!branchName) {
      return null;
    }

    // Search for attempts with matching branch name
    const attempts = await client.searchAttemptsByBranch(branchName);

    // Return the first match (there should typically be only one)
    return attempts.length > 0 ? attempts[0] : null;
  } catch {
    return null;
  }
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
  // If ID is explicitly provided, use it
  if (providedId) {
    return providedId;
  }

  // Try auto-detection from branch
  const attempt = await resolveAttemptFromBranch(client);
  if (attempt) {
    return attempt.id;
  }

  // Fall back to interactive selection
  // Need to select task first, then attempt
  const resolvedProjectId = await getProjectId(projectId, client);
  const tasks = await client.listTasks(resolvedProjectId);
  if (tasks.length === 0) {
    throw new Error("No tasks found in the project.");
  }

  const taskId = await selectTask(tasks);
  const attempts = await client.listAttempts(taskId);
  if (attempts.length === 0) {
    throw new Error("No attempts found for the selected task.");
  }

  return await selectAttempt(attempts);
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
  // If ID is explicitly provided, use it
  if (providedId) {
    return providedId;
  }

  // Try auto-detection from current attempt's parent task
  const attempt = await resolveAttemptFromBranch(client);
  if (attempt) {
    return attempt.task_id;
  }

  // Fall back to interactive selection
  const resolvedProjectId = await getProjectId(projectId, client);
  const tasks = await client.listTasks(resolvedProjectId);
  if (tasks.length === 0) {
    throw new Error("No tasks found in the project.");
  }

  return await selectTask(tasks);
}
