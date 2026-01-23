/**
 * Project resolver utility for auto-detecting project from git repository
 */

import type { ApiClient } from "../api/client.ts";
import type { Project } from "../api/types.ts";
import { extractRepoBasename, getCurrentRepoBasename } from "./git.ts";
import {
  FzfCancelledError,
  FzfNotInstalledError,
  selectProject,
} from "./fzf.ts";
import {
  resolveRepositoryFromPath,
  RepositoryResolverError,
} from "./repository-resolver.ts";

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
 * 1. Repository-based matching (using repository resolver, cross-machine compatible)
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

  // Strategy 1: Try to resolve via repository first (using repository resolver)
  try {
    const resolvedRepo = await resolveRepositoryFromPath(client);
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
  } catch (error) {
    // If repository resolution fails (no repos, fzf cancelled, etc.), fall through
    if (!(error instanceof RepositoryResolverError)) {
      throw error;
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
