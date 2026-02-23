/**
 * FZF utility for interactive selection
 */

import type {
  Repo,
  Workspace,
} from "../api/types.ts";

export class FzfNotInstalledError extends Error {
  constructor() {
    super(
      "fzf is not installed. Please install fzf to use interactive selection.\n" +
        "Installation: https://github.com/junegunn/fzf#installation",
    );
    this.name = "FzfNotInstalledError";
  }
}

export class FzfCancelledError extends Error {
  constructor() {
    super("Selection cancelled.");
    this.name = "FzfCancelledError";
  }
}

/**
 * Check if fzf is installed
 */
export async function isFzfInstalled(): Promise<boolean> {
  try {
    const command = new Deno.Command("fzf", {
      args: ["--version"],
      stdout: "null",
      stderr: "null",
    });
    const { code } = await command.output();
    return code === 0;
  } catch {
    return false;
  }
}

/**
 * Run fzf with given items and return selected item
 */
async function runFzf(items: string[], prompt?: string): Promise<string> {
  if (!(await isFzfInstalled())) {
    throw new FzfNotInstalledError();
  }

  if (items.length === 0) {
    throw new Error("No items to select from.");
  }

  const args = ["--height=40%", "--reverse"];
  if (prompt) {
    args.push(`--prompt=${prompt} `);
  }

  const command = new Deno.Command("fzf", {
    args,
    stdin: "piped",
    stdout: "piped",
    stderr: "inherit",
  });

  const process = command.spawn();

  // Write items to stdin
  const writer = process.stdin.getWriter();
  const input = items.join("\n");
  await writer.write(new TextEncoder().encode(input));
  await writer.close();

  const { code, stdout } = await process.output();

  if (code !== 0) {
    throw new FzfCancelledError();
  }

  const selected = new TextDecoder().decode(stdout).trim();
  return selected;
}

/**
 * Format repository for fzf display
 */
export function formatRepository(repo: Repo): string {
  return `${repo.id}\t${repo.name}\t${repo.path}`;
}

/**
 * Format workspace for fzf display
 */
export function formatWorkspace(workspace: Workspace): string {
  return `${workspace.id}\t${workspace.branch}\t${workspace.name || "-"}`;
}

/**
 * Extract ID from fzf selection (first column)
 */
function extractId(selection: string): string {
  return selection.split("\t")[0];
}

/**
 * Select a repository using fzf
 */
export async function selectRepository(repos: Repo[]): Promise<string> {
  if (repos.length === 0) {
    throw new Error("No repositories available.");
  }

  const items = repos.map(formatRepository);
  const selected = await runFzf(items, "Select repository:");
  return extractId(selected);
}

/**
 * Select a workspace using fzf
 */
export async function selectWorkspace(
  workspaces: Workspace[],
): Promise<string> {
  if (workspaces.length === 0) {
    throw new Error("No workspaces available.");
  }

  const items = workspaces.map(formatWorkspace);
  const selected = await runFzf(items, "Select workspace:");
  return extractId(selected);
}
