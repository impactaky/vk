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
