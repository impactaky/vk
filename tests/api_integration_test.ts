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
): Promise<{ success: boolean; data?: T; error?: string; status?: number; rawText?: string }> {
  const response = await fetch(`${config.apiUrl}/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const text = await response.text();
  try {
    return await JSON.parse(text);
  } catch {
    return { success: false, error: text, status: response.status, rawText: text };
  }
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

// Project Repository Tests
Deno.test("API: Add repository to project", async () => {
  // First, get list of existing repositories to find a valid path
  const reposResult = await apiCall<{ id: string; name: string; path: string }[]>("/repos");
  assertEquals(reposResult.success, true);
  assertExists(reposResult.data, "No repositories available - register at least one repository before running tests");
  assertEquals(reposResult.data.length > 0, true, "No repositories available - register at least one repository before running tests");

  const existingRepoPath = reposResult.data[0].path;

  // Create a test project
  const createResult = await apiCall<{ id: string; name: string }>(
    "/projects",
    {
      method: "POST",
      body: JSON.stringify({
        name: `test-project-add-repo-${Date.now()}`,
        repositories: [],
      }),
    },
  );
  assertEquals(createResult.success, true);
  const projectId = createResult.data!.id;

  try {
    // Test adding repository with display_name and git_repo_path
    const addResult = await apiCall<{ id: string }>(
      `/projects/${projectId}/repositories`,
      {
        method: "POST",
        body: JSON.stringify({
          display_name: "Test Repository",
          git_repo_path: existingRepoPath,
        }),
      },
    );
    console.log("Add repo result:", JSON.stringify(addResult, null, 2));
    assertEquals(addResult.success, true, `Failed to add repo: ${addResult.error || addResult.rawText}`);
    assertExists(addResult.data);

    // Verify the repository was added
    const listResult = await apiCall<{ id: string }[]>(
      `/projects/${projectId}/repositories`,
    );
    assertEquals(listResult.success, true);
    assertExists(listResult.data);
    assertEquals(listResult.data.length >= 1, true);
  } finally {
    // Cleanup: delete the project
    await apiCall(`/projects/${projectId}`, { method: "DELETE" });
  }
});

Deno.test("API: Add repository to project with custom display_name", async () => {
  // First, get list of existing repositories to find a valid path
  const reposResult = await apiCall<{ id: string; name: string; path: string }[]>("/repos");
  assertEquals(reposResult.success, true);
  assertExists(reposResult.data, "No repositories available - register at least one repository before running tests");
  assertEquals(reposResult.data.length > 0, true, "No repositories available - register at least one repository before running tests");

  const existingRepoPath = reposResult.data[0].path;

  // Create a test project
  const createResult = await apiCall<{ id: string; name: string }>(
    "/projects",
    {
      method: "POST",
      body: JSON.stringify({
        name: `test-project-add-repo-custom-${Date.now()}`,
        repositories: [],
      }),
    },
  );
  assertEquals(createResult.success, true);
  const projectId = createResult.data!.id;

  try {
    // Test adding repository with custom display_name
    const addResult = await apiCall<{ id: string; display_name: string }>(
      `/projects/${projectId}/repositories`,
      {
        method: "POST",
        body: JSON.stringify({
          display_name: "My Custom Display Name",
          git_repo_path: existingRepoPath,
        }),
      },
    );
    console.log("Add repo with custom name result:", JSON.stringify(addResult, null, 2));
    assertEquals(addResult.success, true, `Failed to add repo: ${addResult.error || addResult.rawText}`);
    assertExists(addResult.data);
  } finally {
    // Cleanup: delete the project
    await apiCall(`/projects/${projectId}`, { method: "DELETE" });
  }
});
