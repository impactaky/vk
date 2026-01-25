/**
 * CLI runner helper for integration tests.
 * Provides utilities to invoke CLI commands via Deno.Command.
 */

import { config } from "./test-server.ts";

/**
 * Result from running a CLI command.
 */
export interface CliResult {
  stdout: string;
  stderr: string;
  code: number;
  success: boolean;
}

/**
 * Options for running CLI commands.
 */
export interface CliOptions {
  env?: Record<string, string>;
  cwd?: string;
}

/**
 * Run a CLI command and return the result.
 */
export async function runCli(
  args: string[],
  options: CliOptions = {},
): Promise<CliResult> {
  const command = new Deno.Command("deno", {
    args: [
      "run",
      "--allow-net",
      "--allow-read",
      "--allow-write",
      "--allow-env",
      "--allow-run=git,fzf",
      "src/main.ts",
      ...args,
    ],
    cwd: options.cwd || Deno.cwd(),
    env: {
      ...Deno.env.toObject(),
      VK_API_URL: config.apiUrl,
      ...options.env,
    },
    stdout: "piped",
    stderr: "piped",
  });

  const { code, stdout, stderr } = await command.output();

  return {
    stdout: new TextDecoder().decode(stdout),
    stderr: new TextDecoder().decode(stderr),
    code,
    success: code === 0,
  };
}

/**
 * Run a CLI command with --json flag and parse the output.
 */
export async function runCliJson<T>(
  args: string[],
  options: CliOptions = {},
): Promise<{ result: CliResult; data: T | null }> {
  const result = await runCli([...args, "--json"], options);
  let data: T | null = null;
  if (result.success && result.stdout) {
    try {
      data = JSON.parse(result.stdout);
    } catch {
      // Not valid JSON
    }
  }
  return { result, data };
}
