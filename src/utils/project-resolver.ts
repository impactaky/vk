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
 * Projects are now multi-repository, so we need to check each project's repositories.
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

  // For each project, check its associated repositories
  const matches: Project[] = [];

  for (const project of projects) {
    try {
      const projectRepos = await client.listProjectRepos(project.id);
      for (const pr of projectRepos) {
        const repo = await client.getRepo(pr.repo_id);
        const repoBasename = extractRepoBasename(repo.path);
        if (repoBasename === currentBasename) {
          matches.push(project);
          break; // Found a match for this project, no need to check more repos
        }
      }
    } catch {
      // Skip projects where we can't fetch repositories
      continue;
    }
  }

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
 * Resolve project by ID or name from all projects
 * @param idOrName The project ID or name to resolve
 * @param client API client instance
 * @returns The resolved project ID
 */
async function resolveProjectByIdOrName(
  idOrName: string,
  client: ApiClient,
): Promise<string> {
  const projects = await client.listProjects();

  // Strategy 1: Exact ID match
  const idMatch = projects.find((p) => p.id === idOrName);
  if (idMatch) {
    return idMatch.id;
  }

  // Strategy 2: Name match
  const nameMatches = projects.filter((p) => p.name === idOrName);
  if (nameMatches.length === 1) {
    return nameMatches[0].id;
  }
  if (nameMatches.length > 1) {
    throw new ProjectResolverError(
      `Multiple projects found with name "${idOrName}". Use project ID instead:\n` +
        nameMatches.map((p) => `  - ${p.id}`).join("\n"),
    );
  }

  // No match found
  throw new ProjectResolverError(
    `Project not found: "${idOrName}". Use 'vk project list' to see available projects.`,
  );
}

/**
 * Get project ID, either from explicit option or auto-resolved from git
 * @param explicitProjectIdOrName The explicitly provided project ID or name (if any)
 * @param client API client instance
 * @returns The project ID to use
 */
export async function getProjectId(
  explicitProjectIdOrName: string | undefined,
  client: ApiClient,
): Promise<string> {
  if (explicitProjectIdOrName) {
    return await resolveProjectByIdOrName(explicitProjectIdOrName, client);
  }

  const resolved = await resolveProjectFromGit(client);
  return resolved.id;
}
