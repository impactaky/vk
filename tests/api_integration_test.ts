/**
 * Integration tests for the API client.
 * These tests require a running vibe-kanban server.
 *
 * Run with: deno task test:integration
 *
 * Environment variables:
 * - VK_API_URL: API endpoint (default: http://localhost:3000)
 */

import { assertEquals, assertExists } from "@std/assert";
import { config } from "./helpers/test-server.ts";

// Helper to make raw API calls (bypassing ApiClient to test actual API)
async function apiCall<T>(
  path: string,
  options: RequestInit = {},
): Promise<{ success: boolean; data?: T; error?: string }> {
  const response = await fetch(`${config.apiUrl}/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  return await response.json();
}

// Project Tests using raw API calls
Deno.test("API: List projects", async () => {
  const result = await apiCall<unknown[]>("/projects");
  assertEquals(result.success, true);
  assertExists(result.data);
  assertEquals(Array.isArray(result.data), true);
});

Deno.test("API: Create and delete project", async () => {
  // Create project with minimal required fields
  const createResult = await apiCall<{ id: string; name: string }>(
    "/projects",
    {
      method: "POST",
      body: JSON.stringify({
        name: `test-project-${Date.now()}`,
        repositories: [],
      }),
    },
  );

  assertEquals(createResult.success, true);
  assertExists(createResult.data);
  assertExists(createResult.data.id);

  // Delete the project
  const deleteResult = await apiCall(`/projects/${createResult.data.id}`, {
    method: "DELETE",
  });
  assertEquals(deleteResult.success, true);
});

Deno.test("API: Get project by ID", async () => {
  // Create a project first
  const createResult = await apiCall<{ id: string; name: string }>(
    "/projects",
    {
      method: "POST",
      body: JSON.stringify({
        name: `test-project-${Date.now()}`,
        repositories: [],
      }),
    },
  );
  assertEquals(createResult.success, true);
  const projectId = createResult.data!.id;

  // Get the project
  const getResult = await apiCall<{ id: string }>(`/projects/${projectId}`);
  assertEquals(getResult.success, true);
  assertEquals(getResult.data?.id, projectId);

  // Cleanup
  await apiCall(`/projects/${projectId}`, { method: "DELETE" });
});

// Repository Tests
Deno.test("API: List repositories", async () => {
  const result = await apiCall<unknown[]>("/repos");
  assertEquals(result.success, true);
  assertExists(result.data);
  assertEquals(Array.isArray(result.data), true);
});

// Task Tests (requires a project with a repository)
Deno.test("API: List tasks for project", async () => {
  // Get list of existing projects
  const projectsResult = await apiCall<{ id: string }[]>("/projects");
  assertEquals(projectsResult.success, true);

  if (projectsResult.data && projectsResult.data.length > 0) {
    // List tasks for the first project
    const tasksResult = await apiCall<unknown[]>(
      `/tasks?project_id=${projectsResult.data[0].id}`,
    );
    assertEquals(tasksResult.success, true);
    assertExists(tasksResult.data);
    assertEquals(Array.isArray(tasksResult.data), true);
  }
});

// Task Attempts Tests
Deno.test("API: List all task attempts", async () => {
  const result = await apiCall<unknown[]>("/task-attempts");
  assertEquals(result.success, true);
  assertExists(result.data);
  assertEquals(Array.isArray(result.data), true);
});
