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
 * Resolve project ID from current git repository
 * @param client API client instance
 * @returns The resolved project or throws ProjectResolverError
 */
export async function resolveProjectFromGit(
  client: ApiClient,
): Promise<ResolvedProject> {
  const currentBasename = await getCurrentRepoBasename();
  const projects = await client.listProjects();

  if (!currentBasename) {
    return selectProjectWithFzf(
      projects,
      "Not in a git repository or no remote origin configured.",
    );
  }

  const matches = projects.filter((p) => {
    return p.repositories.some((repo) => {
      const repoBasename = extractRepoBasename(repo.path);
      return repoBasename === currentBasename;
    });
  });

  if (matches.length === 0) {
    return selectProjectWithFzf(
      projects,
      `No project found matching repository "${currentBasename}".`,
    );
  }

  if (matches.length > 1) {
    console.error(
      `Warning: Multiple projects match "${currentBasename}". Using first match: ${
        matches[0].name
      }`,
    );
  }

  return {
    id: matches[0].id,
    name: matches[0].name,
  };
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
