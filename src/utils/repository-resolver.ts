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
import { getCurrentRepoBasename, getRepoBasenameFromPath } from "./git.ts";

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
 * Uses git URL-based matching (preferred) with path-based fallback
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

  // Strategy 1: Try git URL-based matching (cross-machine compatible)
  const currentBasename = await getCurrentRepoBasename();
  if (currentBasename) {
    // Fetch all repo basenames in parallel
    const repoBasenames = await Promise.all(
      repos.map(async (repo) => {
        // Try to get basename from git remote at repo.path
        let basename = await getRepoBasenameFromPath(repo.path);

        // Fallback: if path is not accessible, use repo.name as basename
        // (repo.name is typically set to the git basename when registered)
        if (!basename && repo.name) {
          basename = repo.name;
        }

        return { repo, basename };
      }),
    );

    const gitMatches = repoBasenames
      .filter(({ basename }) => basename === currentBasename)
      .map(({ repo }) => repo);

    if (gitMatches.length === 1) {
      return { id: gitMatches[0].id, name: gitMatches[0].name };
    }

    if (gitMatches.length > 1) {
      // Multiple matches: prefer the one that also matches by path
      const pathMatch = gitMatches.find((r) =>
        isPathWithinRepo(currentPath, r.path)
      );
      if (pathMatch) {
        return { id: pathMatch.id, name: pathMatch.name };
      }
      // Otherwise, warn and use first match.
      console.error(
        `Warning: Multiple repositories match "${currentBasename}". Using first match: ${
          gitMatches[0].name
        }`,
      );
      return { id: gitMatches[0].id, name: gitMatches[0].name };
    }
  }

  // Strategy 2: Fall back to path-based matching (existing behavior)
  const pathMatches = repos.filter((r) =>
    isPathWithinRepo(currentPath, r.path)
  );

  if (pathMatches.length > 0) {
    // Prefer most specific (longest path)
    pathMatches.sort((a, b) => b.path.length - a.path.length);
    return { id: pathMatches[0].id, name: pathMatches[0].name };
  }

  // Strategy 3: Fall back to fzf selection
  return selectRepositoryWithFzf(
    repos,
    `Current directory "${currentPath}" is not within any registered repository.`,
  );
}

/**
 * Resolve repository by ID or name from all registered repositories
 * @param idOrName The repository ID or name to resolve
 * @param client API client instance
 * @returns The resolved repository ID
 */
async function resolveRepositoryByIdOrName(
  idOrName: string,
  client: ApiClient,
): Promise<string> {
  const repos = await client.listRepos();

  // Strategy 1: Exact ID match
  const idMatch = repos.find((r) => r.id === idOrName);
  if (idMatch) {
    return idMatch.id;
  }

  // Strategy 2: Name match
  const nameMatches = repos.filter((r) => r.name === idOrName);
  if (nameMatches.length === 1) {
    return nameMatches[0].id;
  }
  if (nameMatches.length > 1) {
    throw new RepositoryResolverError(
      `Multiple repositories found with name "${idOrName}". Use repository ID instead:\n` +
        nameMatches.map((r) => `  - ${r.id} (${r.path})`).join("\n"),
    );
  }

  // No match found
  throw new RepositoryResolverError(
    `Repository not found: "${idOrName}". Use 'vk repository list' to see available repositories.`,
  );
}

/**
 * Get repository ID, either from explicit option or auto-resolved from path
 * @param explicitRepoIdOrName The explicitly provided repository ID or name (if any)
 * @param client API client instance
 * @returns The repository ID to use
 */
export async function getRepositoryId(
  explicitRepoIdOrName: string | undefined,
  client: ApiClient,
): Promise<string> {
  if (explicitRepoIdOrName) {
    return await resolveRepositoryByIdOrName(explicitRepoIdOrName, client);
  }

  const resolved = await resolveRepositoryFromPath(client);
  return resolved.id;
}
