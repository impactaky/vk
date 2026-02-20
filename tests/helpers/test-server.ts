/**
 * Test server helper for integration tests.
 * Provides utilities to wait for the vibe-kanban server to be ready.
 */

import { loadConfig } from "../../src/api/config.ts";

const DEFAULT_TIMEOUT_MS = 30000;
const POLL_INTERVAL_MS = 500;

/**
 * Test configuration loaded from vk config.
 */
export const config = await loadConfig();

/**
 * Wait for the vibe-kanban server to be ready by polling the repos endpoint.
 * Throws an error if the server is not ready within the timeout period.
 */
export async function waitForServer(
  apiUrl: string = config.apiUrl,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<void> {
  const startTime = Date.now();
  const healthUrl = `${apiUrl}/api/repos`;

  while (Date.now() - startTime < timeoutMs) {
    try {
      const response = await fetch(healthUrl);
      // Consume the response body to avoid resource leaks
      await response.body?.cancel();
      if (response.ok) {
        return;
      }
    } catch {
      // Server not ready yet, continue polling
    }
    await delay(POLL_INTERVAL_MS);
  }

  throw new Error(
    `Server at ${apiUrl} did not become ready within ${timeoutMs}ms`,
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
