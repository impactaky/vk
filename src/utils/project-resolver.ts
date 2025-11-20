/**
 * Project resolver utility for auto-detecting project from git repository
 */

import type { ApiClient } from "../api/client.ts";
import { extractRepoBasename, getCurrentRepoBasename } from "./git.ts";

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
 * Resolve project ID from current git repository
 * @param client API client instance
 * @returns The resolved project or throws ProjectResolverError
 */
export async function resolveProjectFromGit(
  client: ApiClient,
): Promise<ResolvedProject> {
  const currentBasename = await getCurrentRepoBasename();

  if (!currentBasename) {
    throw new ProjectResolverError(
      "Not in a git repository or no remote origin configured. Please specify --project.",
    );
  }

  const projects = await client.listProjects();

  const matches = projects.filter((p) => {
    const projectBasename = extractRepoBasename(p.git_repo_path);
    return projectBasename === currentBasename;
  });

  if (matches.length === 0) {
    throw new ProjectResolverError(
      `No project found matching repository "${currentBasename}". Please specify --project.`,
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
