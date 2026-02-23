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
let legacyProjectTaskApiSupported: boolean | null = null;

/**
 * Wait for the vibe-kanban server to be ready by polling the projects endpoint.
 * Throws an error if the server is not ready within the timeout period.
 */
export async function waitForServer(
  apiUrl: string = config.apiUrl,
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
 * Detect whether legacy project/task CRUD endpoints are available.
 * Some server builds expose only workspace-oriented APIs and route
 * /api/projects and /api/tasks to the web app shell instead.
 */
export async function supportsLegacyProjectTaskApi(
  apiUrl: string = config.apiUrl,
): Promise<boolean> {
  if (legacyProjectTaskApiSupported !== null) {
    return legacyProjectTaskApiSupported;
  }

  try {
    const getProjects = await fetch(`${apiUrl}/api/projects`);
    const getProjectsText = await getProjects.text();
    const getTasks = await fetch(`${apiUrl}/api/tasks`);
    const getTasksText = await getTasks.text();

    let projectsJson: { success?: unknown };
    let tasksJson: { success?: unknown };
    try {
      projectsJson = JSON.parse(getProjectsText);
      tasksJson = JSON.parse(getTasksText);
    } catch {
      legacyProjectTaskApiSupported = false;
      return legacyProjectTaskApiSupported;
    }

    if (
      typeof projectsJson.success !== "boolean" ||
      typeof tasksJson.success !== "boolean"
    ) {
      legacyProjectTaskApiSupported = false;
      return legacyProjectTaskApiSupported;
    }

    // Probe POST support without creating resources.
    const createProjectProbe = await fetch(`${apiUrl}/api/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const createTaskProbe = await fetch(`${apiUrl}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    legacyProjectTaskApiSupported = !(
      createProjectProbe.status === 405 || createTaskProbe.status === 405
    );
    return legacyProjectTaskApiSupported;
  } catch {
    legacyProjectTaskApiSupported = false;
    return legacyProjectTaskApiSupported;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
