import { ApiClient } from "./api-client.ts";
import type { Project } from "../types/api.ts";

/**
 * Get the git remote origin URL for the current directory
 * @returns The remote URL string
 * @throws Error if not in a git repository or no origin is configured
 */
export async function getGitRemoteUrl(): Promise<string> {
  const command = new Deno.Command("git", {
    args: ["remote", "get-url", "origin"],
    stdout: "piped",
    stderr: "piped",
  });

  const { code, stdout, stderr } = await command.output();

  if (code !== 0) {
    const errorOutput = new TextDecoder().decode(stderr);
    if (errorOutput.includes("not a git repository")) {
      throw new Error("Not in a git repository. Use --project-id to specify the project explicitly.");
    }
    throw new Error(`Failed to get git remote: ${errorOutput}`);
  }

  return new TextDecoder().decode(stdout).trim();
}

/**
 * Extract repository basename from a git URL
 * Handles both HTTPS and SSH formats:
 * - https://github.com/user/repo.git -> repo
 * - git@github.com:user/repo.git -> repo
 * @param url The git remote URL
 * @returns The repository basename without .git extension
 */
export function extractRepoBasename(url: string): string {
  // Remove .git suffix if present
  const withoutGit = url.endsWith(".git") ? url.slice(0, -4) : url;

  // Extract the last part of the path
  const parts = withoutGit.split("/");
  const lastPart = parts[parts.length - 1];

  // Handle SSH URLs like git@github.com:user/repo
  if (lastPart.includes(":")) {
    const sshParts = lastPart.split(":");
    const pathAfterColon = sshParts[sshParts.length - 1];
    const pathParts = pathAfterColon.split("/");
    return pathParts[pathParts.length - 1];
  }

  return lastPart;
}

/**
 * Get the default project ID by matching git remote against registered projects
 * @returns The project ID
 * @throws Error if no matching project is found or git detection fails
 */
export async function getDefaultProjectId(): Promise<string> {
  // Get git remote URL
  const remoteUrl = await getGitRemoteUrl();
  const repoBasename = extractRepoBasename(remoteUrl);

  // Fetch all projects from the API
  const client = await ApiClient.create();
  const response = await client.get<Project[]>("/projects");

  if (!response.success || !response.data) {
    throw new Error(response.error || "Failed to fetch projects");
  }

  const projects = response.data;

  if (projects.length === 0) {
    throw new Error(
      `No projects registered in vibe-kanban. Create a project first with 'vk project create'.`
    );
  }

  // Try to match against project name or git_repo_path basename
  const matchedProject = projects.find((p) => {
    // Check if project name matches
    if (p.name === repoBasename) {
      return true;
    }

    // Check if git_repo_path basename matches
    const projectPathBasename = p.git_repo_path.split("/").pop() || "";
    if (projectPathBasename === repoBasename) {
      return true;
    }

    return false;
  });

  if (!matchedProject) {
    const availableProjects = projects.map((p) => `  - ${p.name} (ID: ${p.id})`).join("\n");
    throw new Error(
      `No project found matching git repository '${repoBasename}'.\n\nAvailable projects:\n${availableProjects}\n\nUse --project-id to specify the project explicitly.`
    );
  }

  return matchedProject.id;
}
