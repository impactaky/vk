/**
 * Project resolver utility for finding projects by git URL basename
 */

import { ApiClient } from "../api/client.ts";
import type { Project } from "../api/types.ts";
import { extractGitUrlBasename, getGitRepoBasename } from "./git.ts";

/**
 * Find a project by matching the git URL basename.
 * Returns the project if found, null otherwise.
 */
export async function findProjectByGitBasename(
  client: ApiClient,
  basename: string,
): Promise<Project | null> {
  const projects = await client.listProjects();

  for (const project of projects) {
    const projectBasename = extractGitUrlBasename(project.git_repo_path);
    if (projectBasename === basename) {
      return project;
    }
  }

  return null;
}

/**
 * Resolve the default project ID from the current git repository.
 * Returns the project ID if found, null otherwise.
 */
export async function resolveDefaultProjectId(
  client: ApiClient,
  cwd?: string,
): Promise<string | null> {
  const basename = await getGitRepoBasename(cwd);
  if (!basename) {
    return null;
  }

  const project = await findProjectByGitBasename(client, basename);
  return project?.id ?? null;
}
