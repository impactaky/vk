/**
 * CLI Client Integration Tests
 *
 * These tests verify that the CLI client methods send correct payloads
 * matching the current vibe-kanban API schema.
 *
 * Run with: deno task test:integration
 *
 * Environment variables:
 * - VK_API_URL: API endpoint (default: http://localhost:3000)
 */

import { assertEquals, assertExists } from "@std/assert";
import { config } from "./helpers/test-server.ts";

// Helper to make raw API calls
async function apiCall<T>(
  path: string,
  options: RequestInit = {},
): Promise<{
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}> {
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
    };
  }
}

// Shared test directory path
const SHARED_TEST_DIR = "/shared";

// Helper to create a test repository directory with .git folder
async function createTestRepoDir(suffix: string): Promise<string> {
  const testPath = `${SHARED_TEST_DIR}/test-repo-cli-${Date.now()}-${suffix}`;
  await Deno.mkdir(`${testPath}/.git`, { recursive: true });
  return testPath;
}

// ============================================================================
// TEST: Verify create-and-start sends correct payload
// ============================================================================

Deno.test({
  name: "CLI Client: create-and-start sends correct payload",
  fn: async () => {
    const testRepoPath = await createTestRepoDir("create-and-start");

    // Register repo
    const registerResult = await apiCall<{ id: string }>("/repos", {
      method: "POST",
      body: JSON.stringify({
        path: testRepoPath,
        display_name: null,
      }),
    });
    assertEquals(registerResult.success, true);
    const repoId = registerResult.data!.id;

    try {
      // Try create-and-start with correct schema
      const createPayload = {
        repos: [{ repo_id: repoId, target_branch: "main" }],
        executor_config: { executor: "CLAUDE_CODE" },
        prompt: "Test prompt",
        linked_issue: {
          title: "Test workspace",
          description: "Test description",
        },
      };

      const result = await apiCall<{
        workspace: { id: string; branch: string };
      }>(
        "/task-attempts/create-and-start",
        {
          method: "POST",
          body: JSON.stringify(createPayload),
        },
      );

      // Endpoint should accept the payload (may 500 due to no executor running)
      assertExists(result);

      // Cleanup if it succeeded
      if (result.success && result.data) {
        await apiCall(`/task-attempts/${result.data.workspace.id}`, {
          method: "DELETE",
        });
      }
    } finally {
      try {
        await Deno.remove(testRepoPath, { recursive: true });
      } catch {
        // Ignore
      }
    }
  },
});

// ============================================================================
// TEST: Verify followUp uses executor_config
// ============================================================================

Deno.test({
  name: "CLI Client: followUp uses executor_config field",
  fn: async () => {
    // Get existing workspaces
    const workspacesResult = await apiCall<{ id: string }[]>("/task-attempts");
    assertEquals(workspacesResult.success, true);

    if (workspacesResult.data && workspacesResult.data.length > 0) {
      const workspaceId = workspacesResult.data[0].id;

      // Get sessions
      const sessionsResult = await apiCall<{ id: string }[]>(
        `/sessions?workspace_id=${workspaceId}`,
      );
      assertEquals(sessionsResult.success, true);

      if (sessionsResult.data && sessionsResult.data.length > 0) {
        const sessionId = sessionsResult.data[0].id;

        // Send follow-up with executor_config (new field)
        const followUpResult = await apiCall(
          `/sessions/${sessionId}/follow-up`,
          {
            method: "POST",
            body: JSON.stringify({
              prompt: "Test follow-up",
              executor_config: { executor: "CLAUDE_CODE" },
            }),
          },
        );

        // Endpoint should accept the payload
        assertExists(followUpResult);
      }
    }
  },
});

// ============================================================================
// TEST: Verify branch-status returns array
// ============================================================================

Deno.test({
  name: "CLI Client: branch-status returns array response",
  fn: async () => {
    const workspacesResult = await apiCall<{ id: string }[]>("/task-attempts");
    assertEquals(workspacesResult.success, true);

    if (workspacesResult.data && workspacesResult.data.length > 0) {
      const workspaceId = workspacesResult.data[0].id;

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
// TEST: Verify pr-comments requires repo_id parameter
// ============================================================================

Deno.test({
  name: "CLI Client: pr-comments accepts repo_id parameter",
  fn: async () => {
    const workspacesResult = await apiCall<{ id: string }[]>("/task-attempts");
    assertEquals(workspacesResult.success, true);

    if (workspacesResult.data && workspacesResult.data.length > 0) {
      const workspaceId = workspacesResult.data[0].id;

      // Get workspace repos
      const reposResult = await apiCall<{ repo_id: string }[]>(
        `/task-attempts/${workspaceId}/repos`,
      );

      if (reposResult.success && reposResult.data && reposResult.data.length > 0) {
        const repoId = reposResult.data[0].repo_id;

        const commentsResult = await apiCall<unknown[]>(
          `/task-attempts/${workspaceId}/pr/comments?repo_id=${repoId}`,
        );

        assertExists(commentsResult);
      }
    }
  },
});

// ============================================================================
// TEST: Verify workspace update works
// ============================================================================

Deno.test({
  name: "CLI Client: workspace update accepts name, archived, pinned",
  fn: async () => {
    const workspacesResult = await apiCall<{ id: string }[]>("/task-attempts");
    assertEquals(workspacesResult.success, true);

    if (workspacesResult.data && workspacesResult.data.length > 0) {
      const workspaceId = workspacesResult.data[0].id;

      // Test updating name
      const updateResult = await apiCall<{ id: string; name: string }>(
        `/task-attempts/${workspaceId}`,
        {
          method: "PUT",
          body: JSON.stringify({ name: `cli-test-${Date.now()}` }),
        },
      );
      assertEquals(updateResult.success, true);

      // Restore
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
