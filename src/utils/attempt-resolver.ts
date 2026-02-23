/**
 * Workspace resolver utility for auto-detecting workspace IDs from branch names
 */

import type { ApiClient } from "../api/client.ts";
import type { Workspace } from "../api/types.ts";
import { getCurrentBranch } from "./git.ts";

/**
 * Resolve workspace from current branch name.
 * Uses searchWorkspacesByBranch to find the workspace whose branch matches the current git branch.
 *
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
 * Get workspace ID with auto-detection support.
 * Resolution order: explicit ID > current branch.
 *
 * @param client API client
 * @param providedId Explicitly provided workspace ID
 * @returns The workspace ID
 */
export async function getAttemptIdWithAutoDetect(
  client: ApiClient,
  providedId: string | undefined,
): Promise<string> {
  if (providedId) {
    return providedId;
  }

  const workspace = await resolveWorkspaceFromBranch(client);
  if (workspace) {
    return workspace.id;
  }

  throw new Error("Not in a workspace branch. Provide workspace ID.");
}
