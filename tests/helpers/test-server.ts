/**
 * Test server helper for integration tests.
 * Provides utilities to wait for the vibe-kanban server to be ready.
 */

const DEFAULT_API_URL = "http://localhost:3000";
const DEFAULT_TIMEOUT_MS = 30000;
const POLL_INTERVAL_MS = 500;

/**
 * Get the API URL from environment or use default.
 */
export function getTestApiUrl(): string {
  return Deno.env.get("VK_API_URL") || DEFAULT_API_URL;
}

/**
 * Wait for the vibe-kanban server to be ready by polling the projects endpoint.
 * Throws an error if the server is not ready within the timeout period.
 */
export async function waitForServer(
  apiUrl: string = getTestApiUrl(),
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<void> {
  const startTime = Date.now();
  const healthUrl = `${apiUrl}/api/projects`;

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

/**
 * Check if the server is currently available.
 */
export async function isServerAvailable(
  apiUrl: string = getTestApiUrl(),
): Promise<boolean> {
  try {
    const response = await fetch(`${apiUrl}/api/projects`);
    // Consume the response body to avoid resource leaks
    await response.body?.cancel();
    return response.ok;
  } catch {
    return false;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
