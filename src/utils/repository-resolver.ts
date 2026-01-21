/**
 * Repository resolver utility for auto-detecting repository from current path
 */

import type { ApiClient } from "../api/client.ts";
import type { Repo } from "../api/types.ts";
import {
  FzfCancelledError,
  FzfNotInstalledError,
  selectRepository,
} from "./fzf.ts";

export interface ResolvedRepository {
  id: string;
  name: string;
}

export class RepositoryResolverError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RepositoryResolverError";
  }
}

/**
 * Try to select a repository using fzf, with proper error handling
 */
async function selectRepositoryWithFzf(
  repos: Repo[],
  fzfErrorMessage: string,
): Promise<ResolvedRepository> {
  try {
    const selectedId = await selectRepository(repos);
    const selected = repos.find((r) => r.id === selectedId);
    if (!selected) {
      throw new RepositoryResolverError("Selected repository not found.");
    }
    return { id: selected.id, name: selected.name };
  } catch (error) {
    if (error instanceof FzfNotInstalledError) {
      throw new RepositoryResolverError(fzfErrorMessage + " " + error.message);
    }
    if (error instanceof FzfCancelledError) {
      throw new RepositoryResolverError("Selection cancelled.");
    }
    throw error;
  }
}

/**
 * Check if a path is within a repository path
 * @param currentPath The current working directory
 * @param repoPath The repository path
 * @returns true if currentPath is within or equal to repoPath
 */
function isPathWithinRepo(currentPath: string, repoPath: string): boolean {
  // Normalize paths by removing trailing slashes
  const normalizedCurrent = currentPath.replace(/\/+$/, "");
  const normalizedRepo = repoPath.replace(/\/+$/, "");

  // Check if current path is exactly the repo path or a subdirectory
  return (
    normalizedCurrent === normalizedRepo ||
    normalizedCurrent.startsWith(normalizedRepo + "/")
  );
}

/**
 * Resolve repository ID from current working directory
 * @param client API client instance
 * @returns The resolved repository or throws RepositoryResolverError
 */
export async function resolveRepositoryFromPath(
  client: ApiClient,
): Promise<ResolvedRepository> {
  const currentPath = Deno.cwd();
  const repos = await client.listRepos();

  if (repos.length === 0) {
    throw new RepositoryResolverError("No repositories registered.");
  }

  // Find repositories that match the current path
  const matches = repos.filter((r) => isPathWithinRepo(currentPath, r.path));

  if (matches.length === 0) {
    return selectRepositoryWithFzf(
      repos,
      `Current directory "${currentPath}" is not within any registered repository.`,
    );
  }

  // If multiple matches, prefer the most specific (longest path)
  if (matches.length > 1) {
    matches.sort((a, b) => b.path.length - a.path.length);
  }

  return {
    id: matches[0].id,
    name: matches[0].name,
  };
}

/**
 * Get repository ID, either from explicit option or auto-resolved from path
 * @param explicitRepoId The explicitly provided repository ID (if any)
 * @param client API client instance
 * @returns The repository ID to use
 */
export async function getRepositoryId(
  explicitRepoId: string | undefined,
  client: ApiClient,
): Promise<string> {
  if (explicitRepoId) {
    return explicitRepoId;
  }

  const resolved = await resolveRepositoryFromPath(client);
  return resolved.id;
}
