import type { ExecutorProfileID } from "../api/types.ts";

/**
 * Parse executor string in format "<name>:<variant>" into ExecutorProfileID
 * @param executorString - String in format "NAME:VARIANT" (e.g., "CLAUDE_CODE:DEFAULT")
 * @returns ExecutorProfileID object with executor and variant fields
 * @throws Error if format is invalid
 */
export function parseExecutorString(executorString: string): ExecutorProfileID {
  const parts = executorString.split(":");
  if (parts.length !== 2) {
    throw new Error(
      `Invalid executor format: "${executorString}". Expected format: <name>:<variant> (e.g., CLAUDE_CODE:DEFAULT)`,
    );
  }

  const [executor, variant] = parts;
  if (!executor || !variant) {
    throw new Error(
      `Invalid executor format: "${executorString}". Both name and variant must be non-empty.`,
    );
  }

  return { executor, variant };
}
