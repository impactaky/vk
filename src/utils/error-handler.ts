/**
 * Common error handling utilities for CLI commands
 */

import { FzfCancelledError, FzfNotInstalledError } from "./fzf.ts";

type CliErrorOptions = {
  details?: string[];
  exitCode?: number;
  prefixWithError?: boolean;
};

export class CliError extends Error {
  readonly details: string[];
  readonly exitCode: number;
  readonly prefixWithError: boolean;

  constructor(message: string, options: CliErrorOptions = {}) {
    super(message);
    this.name = "CliError";
    this.details = options.details ?? [];
    this.exitCode = options.exitCode ?? 1;
    this.prefixWithError = options.prefixWithError ?? false;
  }
}

/**
 * Handle common CLI errors and report them.
 * Returns the exit code if handled, otherwise undefined.
 */
export function reportCliError(error: unknown): number | undefined {
  if (error instanceof CliError) {
    const prefix = error.prefixWithError ? "Error: " : "";
    console.error(`${prefix}${error.message}`);
    for (const detail of error.details) {
      console.log(detail);
    }
    return error.exitCode;
  }

  if (
    error instanceof FzfNotInstalledError ||
    error instanceof FzfCancelledError
  ) {
    console.error(`Error: ${error.message}`);
    return 1;
  }

  if (error instanceof Error) {
    console.error(`Error: ${error.message}`);
    return 1;
  }

  return undefined;
}
