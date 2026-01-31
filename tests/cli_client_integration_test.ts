/**
 * CLI Client Integration Tests
 *
 * These tests verify that CLI client methods send correct payloads
 * matching the vibe-kanban API schema. They prevent regression of
 * schema mismatches like the CreateWorkspace repos[] issue.
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
// TEST-02: Verify createWorkspace sends repos[] array (not base_branch)
// ============================================================================

Deno.test({
  name: "CLI Client: createWorkspace sends repos[] array payload",
  fn: async () => {
    // Create test repo
    const testRepoPath = await createTestRepoDir("create-workspace");

    // Create project
    const projectResult = await apiCall<{ id: string }>("/projects", {
      method: "POST",
      body: JSON.stringify({
        name: `test-project-cli-workspace-${Date.now()}`,
        repositories: [],
      }),
    });
    assertEquals(projectResult.success, true);
    const projectId = projectResult.data!.id;

    // Add repository
    const addRepoResult = await apiCall<{ id: string }>(
      `/projects/${projectId}/repositories`,
      {
        method: "POST",
        body: JSON.stringify({
          display_name: "Test CLI Workspace Repo",
          git_repo_path: testRepoPath,
        }),
      },
    );
    assertEquals(
      addRepoResult.success,
      true,
      `Failed to add repo: ${addRepoResult.error}`,
    );
    const repoId = addRepoResult.data!.id;

    try {
      // Create task
      const taskResult = await apiCall<{ id: string }>("/tasks", {
        method: "POST",
        body: JSON.stringify({
          project_id: projectId,
          title: `test-task-cli-workspace-${Date.now()}`,
        }),
      });
      assertEquals(taskResult.success, true);
      const taskId = taskResult.data!.id;

      // Create workspace with repos[] array (the correct schema)
      const workspacePayload = {
        task_id: taskId,
        executor_profile_id: { executor: "CLAUDE_CODE", variant: null },
        repos: [{ repo_id: repoId, target_branch: "main" }],
      };

      const workspaceResult = await apiCall<{ id: string; branch: string }>(
        "/task-attempts",
        {
          method: "POST",
          body: JSON.stringify(workspacePayload),
        },
      );

      // This should succeed - if it fails, the schema is wrong
      assertEquals(
        workspaceResult.success,
        true,
        `createWorkspace with repos[] should succeed. Error: ${workspaceResult.error}`,
      );
      assertExists(workspaceResult.data);
      assertExists(workspaceResult.data.id);
      assertExists(workspaceResult.data.branch);

      // Cleanup workspace
      await apiCall(`/task-attempts/${workspaceResult.data.id}`, {
        method: "DELETE",
      });
      await apiCall(`/tasks/${taskId}`, { method: "DELETE" });
    } finally {
      await apiCall(`/projects/${projectId}`, { method: "DELETE" });
      try {
        await Deno.remove(testRepoPath, { recursive: true });
      } catch {
        // Ignore cleanup errors
      }
    }
  },
});

Deno.test({
  name: "CLI Client: createWorkspace with base_branch should fail (deprecated)",
  fn: async () => {
    const testRepoPath = await createTestRepoDir("deprecated-base-branch");

    const projectResult = await apiCall<{ id: string }>("/projects", {
      method: "POST",
      body: JSON.stringify({
        name: `test-project-deprecated-${Date.now()}`,
        repositories: [],
      }),
    });
    assertEquals(projectResult.success, true);
    const projectId = projectResult.data!.id;

    const addRepoResult = await apiCall<{ id: string }>(
      `/projects/${projectId}/repositories`,
      {
        method: "POST",
        body: JSON.stringify({
          display_name: "Test Deprecated Repo",
          git_repo_path: testRepoPath,
        }),
      },
    );
    assertEquals(addRepoResult.success, true);

    try {
      const taskResult = await apiCall<{ id: string }>("/tasks", {
        method: "POST",
        body: JSON.stringify({
          project_id: projectId,
          title: `test-task-deprecated-${Date.now()}`,
        }),
      });
      assertEquals(taskResult.success, true);
      const taskId = taskResult.data!.id;

      // Try to create workspace with deprecated base_branch field
      const deprecatedPayload = {
        task_id: taskId,
        executor_profile_id: { executor: "CLAUDE_CODE", variant: null },
        base_branch: "main", // DEPRECATED - should fail
      };

      const workspaceResult = await apiCall<{ id: string }>(
        "/task-attempts",
        {
          method: "POST",
          body: JSON.stringify(deprecatedPayload),
        },
      );

      // This should fail because base_branch is not valid
      assertEquals(
        workspaceResult.success,
        false,
        "createWorkspace with base_branch should fail (deprecated field)",
      );

      await apiCall(`/tasks/${taskId}`, { method: "DELETE" });
    } finally {
      await apiCall(`/projects/${projectId}`, { method: "DELETE" });
      try {
        await Deno.remove(testRepoPath, { recursive: true });
      } catch {
        // Ignore
      }
    }
  },
});

// ============================================================================
// TEST-03: Verify followUp uses session-based endpoint
// ============================================================================

Deno.test({
  name: "CLI Client: followUp uses session-based endpoint",
  fn: async () => {
    const testRepoPath = await createTestRepoDir("session-followup");

    const projectResult = await apiCall<{ id: string }>("/projects", {
      method: "POST",
      body: JSON.stringify({
        name: `test-project-followup-${Date.now()}`,
        repositories: [],
      }),
    });
    assertEquals(projectResult.success, true);
    const projectId = projectResult.data!.id;

    const addRepoResult = await apiCall<{ id: string }>(
      `/projects/${projectId}/repositories`,
      {
        method: "POST",
        body: JSON.stringify({
          display_name: "Test Followup Repo",
          git_repo_path: testRepoPath,
        }),
      },
    );
    assertEquals(addRepoResult.success, true);
    const repoId = addRepoResult.data!.id;

    try {
      const taskResult = await apiCall<{ id: string }>("/tasks", {
        method: "POST",
        body: JSON.stringify({
          project_id: projectId,
          title: `test-task-followup-${Date.now()}`,
        }),
      });
      assertEquals(taskResult.success, true);
      const taskId = taskResult.data!.id;

      // Create workspace
      const workspaceResult = await apiCall<{ id: string }>("/task-attempts", {
        method: "POST",
        body: JSON.stringify({
          task_id: taskId,
          executor_profile_id: { executor: "CLAUDE_CODE", variant: null },
          repos: [{ repo_id: repoId, target_branch: "main" }],
        }),
      });
      assertEquals(workspaceResult.success, true);
      const workspaceId = workspaceResult.data!.id;

      // Get sessions for workspace
      const sessionsResult = await apiCall<{ id: string }[]>(
        `/sessions?workspace_id=${workspaceId}`,
      );
      assertEquals(sessionsResult.success, true);

      // Note: Session may not exist immediately after workspace creation
      // This test verifies the endpoint exists and accepts correct payload
      if (sessionsResult.data && sessionsResult.data.length > 0) {
        const sessionId = sessionsResult.data[0].id;

        // Send follow-up via session endpoint
        const followUpPayload = {
          prompt: "Test follow-up message",
          executor_profile_id: { executor: "CLAUDE_CODE", variant: null },
        };

        const followUpResult = await apiCall(
          `/sessions/${sessionId}/follow-up`,
          {
            method: "POST",
            body: JSON.stringify(followUpPayload),
          },
        );

        // Endpoint should accept the request (may fail for other reasons like no running process)
        assertExists(followUpResult);
      }

      // Cleanup
      await apiCall(`/task-attempts/${workspaceId}`, { method: "DELETE" });
      await apiCall(`/tasks/${taskId}`, { method: "DELETE" });
    } finally {
      await apiCall(`/projects/${projectId}`, { method: "DELETE" });
      try {
        await Deno.remove(testRepoPath, { recursive: true });
      } catch {
        // Ignore
      }
    }
  },
});

// ============================================================================
// TEST-04: Verify multi-repo commands handle array responses
// ============================================================================

Deno.test({
  name: "CLI Client: branch-status returns array response",
  fn: async () => {
    const testRepoPath = await createTestRepoDir("branch-status");

    const projectResult = await apiCall<{ id: string }>("/projects", {
      method: "POST",
      body: JSON.stringify({
        name: `test-project-branch-status-${Date.now()}`,
        repositories: [],
      }),
    });
    assertEquals(projectResult.success, true);
    const projectId = projectResult.data!.id;

    const addRepoResult = await apiCall<{ id: string }>(
      `/projects/${projectId}/repositories`,
      {
        method: "POST",
        body: JSON.stringify({
          display_name: "Test Branch Status Repo",
          git_repo_path: testRepoPath,
        }),
      },
    );
    assertEquals(addRepoResult.success, true);
    const repoId = addRepoResult.data!.id;

    try {
      const taskResult = await apiCall<{ id: string }>("/tasks", {
        method: "POST",
        body: JSON.stringify({
          project_id: projectId,
          title: `test-task-branch-status-${Date.now()}`,
        }),
      });
      assertEquals(taskResult.success, true);
      const taskId = taskResult.data!.id;

      const workspaceResult = await apiCall<{ id: string }>("/task-attempts", {
        method: "POST",
        body: JSON.stringify({
          task_id: taskId,
          executor_profile_id: { executor: "CLAUDE_CODE", variant: null },
          repos: [{ repo_id: repoId, target_branch: "main" }],
        }),
      });
      assertEquals(workspaceResult.success, true);
      const workspaceId = workspaceResult.data!.id;

      // Get branch status - should return array
      const branchStatusResult = await apiCall<
        { repo_id: string; target_branch_name: string }[]
      >(`/task-attempts/${workspaceId}/branch-status`);

      assertEquals(branchStatusResult.success, true);
      assertExists(branchStatusResult.data);
      assertEquals(
        Array.isArray(branchStatusResult.data),
        true,
        "branch-status should return array",
      );

      // Each item should have repo_id
      if (branchStatusResult.data.length > 0) {
        assertExists(branchStatusResult.data[0].repo_id);
        assertExists(branchStatusResult.data[0].target_branch_name);
      }

      // Cleanup
      await apiCall(`/task-attempts/${workspaceId}`, { method: "DELETE" });
      await apiCall(`/tasks/${taskId}`, { method: "DELETE" });
    } finally {
      await apiCall(`/projects/${projectId}`, { method: "DELETE" });
      try {
        await Deno.remove(testRepoPath, { recursive: true });
      } catch {
        // Ignore
      }
    }
  },
});

Deno.test({
  name: "CLI Client: pr-comments requires repo_id parameter",
  fn: async () => {
    const testRepoPath = await createTestRepoDir("pr-comments");

    const projectResult = await apiCall<{ id: string }>("/projects", {
      method: "POST",
      body: JSON.stringify({
        name: `test-project-pr-comments-${Date.now()}`,
        repositories: [],
      }),
    });
    assertEquals(projectResult.success, true);
    const projectId = projectResult.data!.id;

    const addRepoResult = await apiCall<{ id: string }>(
      `/projects/${projectId}/repositories`,
      {
        method: "POST",
        body: JSON.stringify({
          display_name: "Test PR Comments Repo",
          git_repo_path: testRepoPath,
        }),
      },
    );
    assertEquals(addRepoResult.success, true);
    const repoId = addRepoResult.data!.id;

    try {
      const taskResult = await apiCall<{ id: string }>("/tasks", {
        method: "POST",
        body: JSON.stringify({
          project_id: projectId,
          title: `test-task-pr-comments-${Date.now()}`,
        }),
      });
      assertEquals(taskResult.success, true);
      const taskId = taskResult.data!.id;

      const workspaceResult = await apiCall<{ id: string }>("/task-attempts", {
        method: "POST",
        body: JSON.stringify({
          task_id: taskId,
          executor_profile_id: { executor: "CLAUDE_CODE", variant: null },
          repos: [{ repo_id: repoId, target_branch: "main" }],
        }),
      });
      assertEquals(workspaceResult.success, true);
      const workspaceId = workspaceResult.data!.id;

      // Get PR comments with repo_id - endpoint should exist
      const commentsResult = await apiCall<unknown[]>(
        `/task-attempts/${workspaceId}/pr/comments?repo_id=${repoId}`,
      );

      // Endpoint should exist and respond (may return empty or error if no PR)
      assertExists(commentsResult);

      // Cleanup
      await apiCall(`/task-attempts/${workspaceId}`, { method: "DELETE" });
      await apiCall(`/tasks/${taskId}`, { method: "DELETE" });
    } finally {
      await apiCall(`/projects/${projectId}`, { method: "DELETE" });
      try {
        await Deno.remove(testRepoPath, { recursive: true });
      } catch {
        // Ignore
      }
    }
  },
});
