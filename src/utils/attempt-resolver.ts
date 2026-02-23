/**
 * Workspace resolver utility for auto-detecting workspace IDs from branch names
 */

import type { ApiClient } from "../api/client.ts";
import type { Workspace } from "../api/types.ts";
import { selectWorkspace } from "./fzf.ts";
import { getCurrentBranch } from "./git.ts";

/**
 * Resolve workspace from current branch name.
 * Uses searchWorkspacesByBranch to find the workspace whose branch matches the current git branch.
 *
 * @returns The matching workspace or null if not found
 */
export async function resolveWorkspaceFromBranch(
  client: ApiClient,
  deps: Partial<BranchResolverDeps> = {},
): Promise<Workspace | null> {
  const resolverDeps = { ...defaultBranchResolverDeps, ...deps };

  try {
    const branchName = await resolverDeps.getCurrentBranch();
    if (!branchName) {
      return null;
    }

    const workspaces = await resolverDeps.searchWorkspacesByBranch(
      client,
      branchName,
    );
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
  deps: Partial<AttemptResolverDeps> = {},
): Promise<string> {
  if (providedId) {
    return providedId;
  }

  const resolverDeps = { ...defaultAttemptResolverDeps, ...deps };

  const workspace = await resolverDeps.resolveWorkspaceFromBranch(client);
  if (workspace) {
    return workspace.id;
  }

  const workspaces = await resolverDeps.listWorkspaces(client);
  if (workspaces.length > 0) {
    return await resolverDeps.selectWorkspace(workspaces);
  }

  throw new Error("Not in a workspace branch. Provide workspace ID.");
}

export interface AttemptResolverDeps {
  resolveWorkspaceFromBranch: (
    client: ApiClient,
  ) => Promise<Workspace | null>;
  listWorkspaces: (client: ApiClient) => Promise<Workspace[]>;
  selectWorkspace: (workspaces: Workspace[]) => Promise<string>;
}

const defaultAttemptResolverDeps: AttemptResolverDeps = {
  resolveWorkspaceFromBranch,
  listWorkspaces: (client) => client.listWorkspaces(),
  selectWorkspace,
};

export interface BranchResolverDeps {
  getCurrentBranch: () => Promise<string | null>;
  searchWorkspacesByBranch: (
    client: ApiClient,
    branchName: string,
  ) => Promise<Workspace[]>;
}

const defaultBranchResolverDeps: BranchResolverDeps = {
  getCurrentBranch,
  searchWorkspacesByBranch: (client, branchName) =>
    client.searchWorkspacesByBranch(branchName),
};
