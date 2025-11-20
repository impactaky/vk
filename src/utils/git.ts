/**
 * Git utility functions for extracting repository information
 */

/**
 * Extract the basename from a git remote URL.
 * Handles various URL formats:
 * - https://github.com/user/repo-name.git -> repo-name
 * - git@github.com:user/repo-name.git -> repo-name
 * - https://github.com/user/repo-name -> repo-name
 */
export function extractGitUrlBasename(url: string): string {
  // Remove trailing .git if present
  let cleanUrl = url.replace(/\.git$/, "");

  // Extract the last path segment
  // Handle both HTTPS (/) and SSH (:) separators
  const parts = cleanUrl.split(/[/:]/);
  const basename = parts[parts.length - 1];

  return basename;
}

/**
 * Get the git remote URL for the origin remote in the current directory.
 * Returns null if not in a git repository or no origin remote exists.
 */
export async function getGitRemoteUrl(
  cwd?: string,
): Promise<string | null> {
  try {
    const command = new Deno.Command("git", {
      args: ["remote", "get-url", "origin"],
      cwd: cwd,
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
 * Get the git repository basename from the current directory.
 * Returns null if not in a git repository or no origin remote exists.
 */
export async function getGitRepoBasename(
  cwd?: string,
): Promise<string | null> {
  const url = await getGitRemoteUrl(cwd);
  if (!url) {
    return null;
  }
  return extractGitUrlBasename(url);
}
