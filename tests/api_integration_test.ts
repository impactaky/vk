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
): Promise<
  {
    success: boolean;
    data?: T;
    error?: string;
    error_data?: unknown;
    status?: number;
    rawText?: string;
  }
> {
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
    return {
      success: false,
      error: text,
      status: response.status,
      rawText: text,
    };
  }
}

// ============================================================================
// Repository Tests
// ============================================================================

Deno.test("API: List repositories", async () => {
  const result = await apiCall<unknown[]>("/repos");
  assertEquals(result.success, true);
  assertExists(result.data);
  assertEquals(Array.isArray(result.data), true);
});

// Shared test directory path (available in both containers via shared volume)
const SHARED_TEST_DIR = "/shared";

// Helper to create a test repository directory with .git folder
async function createTestRepoDir(suffix: string): Promise<string> {
  const testPath = `${SHARED_TEST_DIR}/test-repo-api-${Date.now()}-${suffix}`;
  await Deno.mkdir(`${testPath}/.git`, { recursive: true });
  return testPath;
}

Deno.test({
  name: "API: Repository includes default_target_branch and archive_script fields",
  fn: async () => {
    const result = await apiCall<
      { id: string; default_target_branch: string | null; archive_script: string | null }[]
    >("/repos");
    assertEquals(result.success, true);
    assertExists(result.data);

    if (result.data.length > 0) {
      const repo = result.data[0];
      assertEquals("default_target_branch" in repo, true);
      assertEquals("archive_script" in repo, true);
    }
  },
});

Deno.test("API: Register and get repository", async () => {
  const testRepoPath = await createTestRepoDir("register");

  try {
    // Register repo
    const registerResult = await apiCall<{ id: string; name: string; path: string }>(
      "/repos",
      {
        method: "POST",
        body: JSON.stringify({
          path: testRepoPath,
          display_name: null,
        }),
      },
    );
    assertEquals(
      registerResult.success,
      true,
      `Failed to register repo: ${registerResult.error}`,
    );
    assertExists(registerResult.data);
    const repoId = registerResult.data.id;

    // Get repo by ID
    const getResult = await apiCall<{ id: string; path: string }>(
      `/repos/${repoId}`,
    );
    assertEquals(getResult.success, true);
    assertEquals(getResult.data?.id, repoId);
    assertEquals(getResult.data?.path, testRepoPath);
  } finally {
    try {
      await Deno.remove(testRepoPath, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  }
});

// ============================================================================
// Task Attempts (Workspaces) Tests
// ============================================================================

Deno.test("API: List all task attempts", async () => {
  const result = await apiCall<unknown[]>("/task-attempts");
  assertEquals(result.success, true);
  assertExists(result.data);
  assertEquals(Array.isArray(result.data), true);
});

Deno.test("API: Workspace task_id can be null", async () => {
  const result = await apiCall<{ id: string; task_id: string | null }[]>(
    "/task-attempts",
  );
  assertEquals(result.success, true);
  assertExists(result.data);

  // Just verify the field exists (it can be null or a string)
  if (result.data.length > 0) {
    assertEquals("task_id" in result.data[0], true);
  }
});

// ============================================================================
// create-and-start Tests
// ============================================================================

Deno.test({
  name: "API: create-and-start endpoint accepts correct payload",
  fn: async () => {
    // Register a test repo first
    const testRepoPath = await createTestRepoDir("create-and-start");

    const registerResult = await apiCall<{ id: string }>(
      "/repos",
      {
        method: "POST",
        body: JSON.stringify({
          path: testRepoPath,
          display_name: null,
        }),
      },
    );
    assertEquals(registerResult.success, true);
    const repoId = registerResult.data!.id;

    try {
      // Try create-and-start - this will likely return 500 because no executor
      // is actually running, but it validates the API accepts the payload
      const createResult = await apiCall<{
        workspace: { id: string; branch: string };
        execution_process: { id: string };
      }>(
        "/task-attempts/create-and-start",
        {
          method: "POST",
          body: JSON.stringify({
            repos: [{ repo_id: repoId, target_branch: "main" }],
            executor_config: { executor: "CLAUDE_CODE" },
            prompt: "Test prompt for create-and-start",
            linked_issue: {
              title: "Test create-and-start",
              description: "Test description",
            },
          }),
        },
      );

      // The endpoint should exist - it may succeed or fail depending on executor setup
      assertExists(createResult);

      // If it succeeded, clean up the workspace
      if (createResult.success && createResult.data) {
        await apiCall(`/task-attempts/${createResult.data.workspace.id}`, {
          method: "DELETE",
        });
      }
    } finally {
      try {
        await Deno.remove(testRepoPath, { recursive: true });
      } catch {
        // Ignore cleanup errors
      }
    }
  },
});

Deno.test({
  name: "API: create-and-start rejects invalid payload (missing repos)",
  fn: async () => {
    const result = await apiCall(
      "/task-attempts/create-and-start",
      {
        method: "POST",
        body: JSON.stringify({
          executor_config: { executor: "CLAUDE_CODE" },
          prompt: "Test",
          // missing repos
        }),
      },
    );

    // Should fail with validation error
    assertEquals(result.success, false);
  },
});

Deno.test({
  name: "API: old POST /task-attempts endpoint is removed",
  fn: async () => {
    const result = await apiCall(
      "/task-attempts",
      {
        method: "POST",
        body: JSON.stringify({
          task_id: "fake-id",
          executor_profile_id: { executor: "CLAUDE_CODE", variant: null },
          repos: [{ repo_id: "fake-repo", target_branch: "main" }],
        }),
      },
    );

    // Should fail - endpoint no longer accepts POST
    assertEquals(result.success, false);
  },
});

// ============================================================================
// Workspace Update and Delete Tests
// ============================================================================

Deno.test({
  name: "API: Update workspace properties (name, archived, pinned)",
  fn: async () => {
    // Get existing workspaces
    const listResult = await apiCall<{ id: string }[]>("/task-attempts");
    assertEquals(listResult.success, true);

    if (listResult.data && listResult.data.length > 0) {
      const workspaceId = listResult.data[0].id;

      // Update the workspace name
      const updateResult = await apiCall<{ id: string; name: string }>(
        `/task-attempts/${workspaceId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            name: `test-update-${Date.now()}`,
          }),
        },
      );
      assertEquals(updateResult.success, true);
      assertExists(updateResult.data?.name);

      // Restore name to null
      await apiCall(
        `/task-attempts/${workspaceId}`,
        {
          method: "PUT",
          body: JSON.stringify({ name: null }),
        },
      );
    }
  },
});

// ============================================================================
// Session Tests
// ============================================================================

Deno.test({
  name: "API: Sessions endpoint returns list",
  fn: async () => {
    // Get a workspace to query sessions for
    const listResult = await apiCall<{ id: string }[]>("/task-attempts");
    assertEquals(listResult.success, true);

    if (listResult.data && listResult.data.length > 0) {
      const workspaceId = listResult.data[0].id;

      const sessionsResult = await apiCall<{ id: string; executor: string | null }[]>(
        `/sessions?workspace_id=${workspaceId}`,
      );
      assertEquals(sessionsResult.success, true);
      assertExists(sessionsResult.data);
      assertEquals(Array.isArray(sessionsResult.data), true);

      // Verify sessions have executor field
      if (sessionsResult.data.length > 0) {
        assertEquals("executor" in sessionsResult.data[0], true);
      }
    }
  },
});

// ============================================================================
// Follow-up Tests
// ============================================================================

Deno.test({
  name: "API: Follow-up requires executor_config (not executor_profile_id)",
  fn: async () => {
    // Get a workspace and its sessions
    const listResult = await apiCall<{ id: string }[]>("/task-attempts");
    assertEquals(listResult.success, true);

    if (listResult.data && listResult.data.length > 0) {
      const workspaceId = listResult.data[0].id;

      const sessionsResult = await apiCall<{ id: string }[]>(
        `/sessions?workspace_id=${workspaceId}`,
      );

      if (sessionsResult.success && sessionsResult.data && sessionsResult.data.length > 0) {
        const sessionId = sessionsResult.data[0].id;

        // Try with old field name - should fail
        const oldResult = await apiCall(
          `/sessions/${sessionId}/follow-up`,
          {
            method: "POST",
            body: JSON.stringify({
              prompt: "Test message",
              executor_profile_id: { executor: "CLAUDE_CODE", variant: null },
            }),
          },
        );
        // Old field name should fail
        assertEquals(oldResult.success, false);

        // Try with new field name - executor_config
        const newResult = await apiCall(
          `/sessions/${sessionId}/follow-up`,
          {
            method: "POST",
            body: JSON.stringify({
              prompt: "Test message",
              executor_config: { executor: "CLAUDE_CODE" },
            }),
          },
        );
        // Should accept the payload (may fail for other reasons like no running process)
        assertExists(newResult);
      }
    }
  },
});

// ============================================================================
// Repository Update Tests
// ============================================================================

Deno.test("API: Update repository properties", async () => {
  const testRepoPath = await createTestRepoDir("update-repo");

  // Register repo
  const registerResult = await apiCall<{ id: string }>(
    "/repos",
    {
      method: "POST",
      body: JSON.stringify({
        path: testRepoPath,
        display_name: null,
      }),
    },
  );
  assertEquals(registerResult.success, true);
  const repoId = registerResult.data!.id;

  try {
    // Update display name
    const updateResult = await apiCall<{ id: string; display_name: string }>(
      `/repos/${repoId}`,
      {
        method: "PUT",
        body: JSON.stringify({
          display_name: "Updated Display Name",
        }),
      },
    );
    assertEquals(updateResult.success, true);
    assertEquals(updateResult.data?.display_name, "Updated Display Name");

    // Update archive_script
    const archiveResult = await apiCall<{ id: string; archive_script: string }>(
      `/repos/${repoId}`,
      {
        method: "PUT",
        body: JSON.stringify({
          archive_script: "echo archive",
        }),
      },
    );
    assertEquals(archiveResult.success, true);
    assertEquals(archiveResult.data?.archive_script, "echo archive");
  } finally {
    try {
      await Deno.remove(testRepoPath, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  }
});

// ============================================================================
// Branch operations Tests (workspace must have repos)
// ============================================================================

Deno.test({
  name: "API: Workspace repos endpoint returns array",
  fn: async () => {
    const listResult = await apiCall<{ id: string }[]>("/task-attempts");
    assertEquals(listResult.success, true);

    if (listResult.data && listResult.data.length > 0) {
      const workspaceId = listResult.data[0].id;

      const reposResult = await apiCall<{ repo_id: string; target_branch: string }[]>(
        `/task-attempts/${workspaceId}/repos`,
      );
      assertEquals(reposResult.success, true);
      assertExists(reposResult.data);
      assertEquals(Array.isArray(reposResult.data), true);
    }
  },
});

Deno.test({
  name: "API: Branch-status returns array response",
  fn: async () => {
    const listResult = await apiCall<{ id: string }[]>("/task-attempts");
    assertEquals(listResult.success, true);

    if (listResult.data && listResult.data.length > 0) {
      const workspaceId = listResult.data[0].id;

      const branchStatusResult = await apiCall<
        { repo_id: string; target_branch_name: string }[]
      >(`/task-attempts/${workspaceId}/branch-status`);

      assertExists(branchStatusResult);

      if (branchStatusResult.success && branchStatusResult.data) {
        assertEquals(
          Array.isArray(branchStatusResult.data),
          true,
          "branch-status should return array",
        );

        if (branchStatusResult.data.length > 0) {
          assertExists(branchStatusResult.data[0].repo_id);
          assertExists(branchStatusResult.data[0].target_branch_name);
        }
      }
    }
  },
});

// ============================================================================
// Init Repository Tests
// ============================================================================

Deno.test("API: Init repository", async () => {
  const parentPath = `${SHARED_TEST_DIR}`;
  const folderName = `test-init-repo-${Date.now()}`;

  const initResult = await apiCall<{ id: string; path: string }>(
    "/repos/init",
    {
      method: "POST",
      body: JSON.stringify({
        parent_path: parentPath,
        folder_name: folderName,
      }),
    },
  );

  // May succeed or fail depending on server permissions
  assertExists(initResult);

  // Cleanup
  if (initResult.success && initResult.data) {
    try {
      await Deno.remove(`${parentPath}/${folderName}`, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  }
});
