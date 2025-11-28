/**
 * Git utility functions for extracting repository information
 */

/**
 * Get the remote origin URL of the current git repository
 * @returns The remote URL or null if not in a git repo or no origin
 */
export async function getGitRemoteUrl(): Promise<string | null> {
  try {
    const command = new Deno.Command("git", {
      args: ["remote", "get-url", "origin"],
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stdout } = await command.output();

    if (code !== 0) {
      return null;
    }

    const url = new TextDecoder().decode(stdout).trim();
    return url || null;
  } catch {
    return null;
  }
}

/**
 * Extract the repository basename from a git URL
 * Handles various formats:
 * - https://github.com/user/repo.git -> repo
 * - https://github.com/user/repo -> repo
 * - git@github.com:user/repo.git -> repo
 * - git@github.com:user/repo -> repo
 * - /path/to/repo -> repo
 * - /path/to/repo.git -> repo
 *
 * @param url The git URL or path
 * @returns The repository basename
 */
export function extractRepoBasename(url: string): string {
  // Remove trailing slashes
  let cleaned = url.replace(/\/+$/, "");

  // Remove .git suffix if present
  if (cleaned.endsWith(".git")) {
    cleaned = cleaned.slice(0, -4);
  }

  // Handle SSH URLs (git@host:user/repo)
  if (cleaned.includes(":") && !cleaned.includes("://")) {
    const parts = cleaned.split(":");
    cleaned = parts[parts.length - 1];
  }

  // Extract basename from path
  const parts = cleaned.split("/");
  return parts[parts.length - 1];
}

/**
 * Get the basename of the current git repository
 * @returns The repo basename or null if not in a git repo
 */
export async function getCurrentRepoBasename(): Promise<string | null> {
  const url = await getGitRemoteUrl();
  if (!url) {
    return null;
  }
  return extractRepoBasename(url);
}

/**
 * Get the current git branch name
 * @returns The current branch name or null if not in a git repo
 */
export async function getCurrentBranchName(): Promise<string | null> {
  try {
    const command = new Deno.Command("git", {
      args: ["branch", "--show-current"],
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stdout } = await command.output();

    if (code !== 0) {
      return null;
    }

    const branch = new TextDecoder().decode(stdout).trim();
    return branch || null;
  } catch {
    return null;
  }
}

/**
 * Extract task ID from a branch name following the pattern <prefix>/<task-id>-<description>
 * Examples:
 * - "impactaky/99d7-try-to-set-task" -> "99d7"
 * - "user/abc123-feature" -> "abc123"
 * - "main" -> null
 * - "feature-branch" -> null
 *
 * @param branchName The branch name to parse
 * @returns The task ID or null if no valid pattern found
 */
export function extractTaskIdFromBranch(branchName: string): string | null {
  // Pattern: <prefix>/<task-id>-<description> or <prefix>/<task-id>_<description>
  // Task ID is the part between / and the first - or _
  const match = branchName.match(/^[^/]+\/([^-_]+)[-_]/);

  if (match && match[1]) {
    return match[1];
  }

  return null;
}

/**
 * Get the task ID from the current git branch
 * Combines getCurrentBranchName() and extractTaskIdFromBranch()
 * @returns The task ID or null if not in a git repo or branch doesn't follow naming convention
 */
export async function getCurrentTaskId(): Promise<string | null> {
  const branchName = await getCurrentBranchName();
  if (!branchName) {
    return null;
  }
  return extractTaskIdFromBranch(branchName);
}
