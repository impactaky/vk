import type { BaseCodingAgent, ExecutorProfileID } from "../api/types.ts";
import { VALID_EXECUTORS } from "../api/types.ts";

/**
 * Check if a string is a valid BaseCodingAgent
 */
function isValidExecutor(name: string): name is BaseCodingAgent {
  return VALID_EXECUTORS.includes(name as BaseCodingAgent);
}

/**
 * Parse executor string in format "<name>:<variant>" into ExecutorProfileID
 * @param executorString - String in format "NAME:VARIANT" (e.g., "CLAUDE_CODE:DEFAULT")
 * @returns ExecutorProfileID object with executor and variant fields
 * @throws Error if format is invalid or executor name is not supported
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

  // Validate executor name against supported agents
  if (!isValidExecutor(executor)) {
    throw new Error(
      `Invalid executor name: "${executor}". Valid executors are: ${VALID_EXECUTORS.join(", ")}`,
    );
  }

  return { executor, variant };
}
