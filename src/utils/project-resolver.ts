/**
 * Project resolver utility for auto-detecting project from git repository
 */

import type { ApiClient } from "../api/client.ts";
import type { Project, Repo } from "../api/types.ts";
import {
  extractRepoBasename,
  getCurrentRepoBasename,
  getRepoBasenameFromPath,
} from "./git.ts";
import {
  FzfCancelledError,
  FzfNotInstalledError,
  selectProject,
} from "./fzf.ts";

export interface ResolvedProject {
  id: string;
  name: string;
}

export class ProjectResolverError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProjectResolverError";
  }
}

/**
 * Check if a path is within a repository path
 * @param currentPath The current working directory
 * @param repoPath The repository path
 * @returns true if currentPath is within or equal to repoPath
 */
export function isPathWithinRepo(
  currentPath: string,
  repoPath: string | undefined | null,
): boolean {
  // Handle null/undefined repoPath
  if (!repoPath) {
    return false;
  }

  // Normalize paths by removing trailing slashes
  const normalizedCurrent = currentPath.replace(/\/+$/, "");
  const normalizedRepo = repoPath.replace(/\/+$/, "");

  // Check if current path is exactly the repo path or a subdirectory
  return (
    normalizedCurrent === normalizedRepo ||
    normalizedCurrent.startsWith(normalizedRepo + "/")
  );
}

interface ResolvedRepository {
  id: string;
  name: string;
}

/**
 * Try to resolve repository without fzf fallback
 * Uses git URL-based matching (preferred) with path-based fallback
 * @param repos List of registered repositories
 * @returns The resolved repository or null if not found
 */
export async function tryResolveRepository(
  repos: Repo[],
): Promise<ResolvedRepository | null> {
  if (repos.length === 0) {
    return null;
  }

  const currentPath = Deno.cwd();

  // Strategy 1: Try git URL-based matching (cross-machine compatible)
  const currentBasename = await getCurrentRepoBasename();
  if (currentBasename) {
    // Fetch all repo basenames in parallel
    const repoBasenames = await Promise.all(
      repos.map(async (repo) => {
        // Try to get basename from git remote at repo.path
        let basename: string | null = null;
        if (repo.path) {
          basename = await getRepoBasenameFromPath(repo.path);
        }

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
      // Otherwise, use first match
      return { id: gitMatches[0].id, name: gitMatches[0].name };
    }
  }

  // Strategy 2: Fall back to path-based matching
  const pathMatches = repos.filter((r) =>
    isPathWithinRepo(currentPath, r.path)
  );

  if (pathMatches.length > 0) {
    // Prefer most specific (longest path)
    pathMatches.sort((a, b) => (b.path?.length ?? 0) - (a.path?.length ?? 0));
    return { id: pathMatches[0].id, name: pathMatches[0].name };
  }

  return null;
}

/**
 * Try to select a project using fzf, with proper error handling
 */
async function selectProjectWithFzf(
  projects: Project[],
  fzfErrorMessage: string,
): Promise<ResolvedProject> {
  try {
    const selectedId = await selectProject(projects);
    const selected = projects.find((p) => p.id === selectedId);
    if (!selected) {
      throw new ProjectResolverError("Selected project not found.");
    }
    return { id: selected.id, name: selected.name };
  } catch (error) {
    if (error instanceof FzfNotInstalledError) {
      throw new ProjectResolverError(fzfErrorMessage + " " + error.message);
    }
    if (error instanceof FzfCancelledError) {
      throw new ProjectResolverError("Selection cancelled.");
    }
    throw error;
  }
}

/**
 * Find projects that match a repository by comparing git basenames
 * @param projects List of all projects
 * @param repoBasename The repository's git basename
 * @returns Projects whose git_repo_path basename matches
 */
function findProjectsByRepoBasename(
  projects: Project[],
  repoBasename: string,
): Project[] {
  return projects.filter((p) => {
    const projectBasename = extractRepoBasename(p.git_repo_path);
    return projectBasename === repoBasename;
  });
}

/**
 * Resolve project ID from current git repository
 * Uses a 3-tier strategy:
 * 1. Repository-based matching (cross-machine compatible)
 * 2. Direct git basename matching (fallback)
 * 3. fzf selection (last resort)
 * @param client API client instance
 * @returns The resolved project or throws ProjectResolverError
 */
export async function resolveProjectFromGit(
  client: ApiClient,
): Promise<ResolvedProject> {
  const projects = await client.listProjects();

  if (projects.length === 0) {
    throw new ProjectResolverError("No projects found.");
  }

  // Strategy 1: Try to resolve via repository first (cross-machine compatible)
  const repos = await client.listRepos();
  if (repos.length > 0) {
    const resolvedRepo = await tryResolveRepository(repos);
    if (resolvedRepo) {
      const repoBasename = resolvedRepo.name;
      const matches = findProjectsByRepoBasename(projects, repoBasename);

      if (matches.length === 1) {
        return { id: matches[0].id, name: matches[0].name };
      }

      if (matches.length > 1) {
        console.error(
          `Warning: Multiple projects match repository "${repoBasename}". Using first match: ${matches[0].name}`,
        );
        return { id: matches[0].id, name: matches[0].name };
      }
    }
  }

  // Strategy 2: Fall back to direct git basename matching (existing behavior)
  const currentBasename = await getCurrentRepoBasename();
  if (currentBasename) {
    const matches = findProjectsByRepoBasename(projects, currentBasename);

    if (matches.length === 1) {
      return { id: matches[0].id, name: matches[0].name };
    }

    if (matches.length > 1) {
      console.error(
        `Warning: Multiple projects match "${currentBasename}". Using first match: ${matches[0].name}`,
      );
      return { id: matches[0].id, name: matches[0].name };
    }
  }

  // Strategy 3: Fall back to fzf selection
  const fzfMessage = currentBasename
    ? `No project found matching repository "${currentBasename}".`
    : "Not in a git repository or no remote origin configured.";

  return selectProjectWithFzf(projects, fzfMessage);
}

/**
 * Get project ID, either from explicit option or auto-resolved from git
 * @param explicitProjectId The explicitly provided project ID (if any)
 * @param client API client instance
 * @returns The project ID to use
 */
export async function getProjectId(
  explicitProjectId: string | undefined,
  client: ApiClient,
): Promise<string> {
  if (explicitProjectId) {
    return explicitProjectId;
  }

  const resolved = await resolveProjectFromGit(client);
  return resolved.id;
}
