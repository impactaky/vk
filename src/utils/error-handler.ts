/**
 * Common error handling utilities for CLI commands
 */

import { FzfCancelledError, FzfNotInstalledError } from "./fzf.ts";

/**
 * Handle common CLI errors and exit appropriately
 * Returns true if error was handled, false otherwise
 */
export function handleCliError(error: unknown): boolean {
  if (
    error instanceof FzfNotInstalledError ||
    error instanceof FzfCancelledError
  ) {
    console.error(`Error: ${error.message}`);
    Deno.exit(1);
  }

  if (error instanceof Error) {
    console.error(`Error: ${error.message}`);
    Deno.exit(1);
  }

  return false;
}

/**
 * Wrap an async action with common error handling
 */
export async function withErrorHandling<T>(
  action: () => Promise<T>,
): Promise<T> {
  try {
    return await action();
  } catch (error) {
    if (!handleCliError(error)) {
      throw error;
    }
    throw error; // TypeScript needs this for type inference
  }
}
