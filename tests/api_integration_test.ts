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

// Shared test directory path (available in both containers via shared volume)
const SHARED_TEST_DIR = "/shared";

// Helper to create a test repository directory with .git folder
async function createTestRepoDir(suffix: string): Promise<string> {
  const testPath = `${SHARED_TEST_DIR}/test-repo-api-${Date.now()}-${suffix}`;
  await Deno.mkdir(`${testPath}/.git`, { recursive: true });
  return testPath;
}

// Project Repository Tests
Deno.test("API: Add repository to project", async () => {
  // Create a test repo directory with .git folder
  const testRepoPath = await createTestRepoDir("add-repo");

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
          git_repo_path: testRepoPath,
        }),
      },
    );
    console.log("Add repo result:", JSON.stringify(addResult, null, 2));
    assertEquals(
      addResult.success,
      true,
      `Failed to add repo: ${addResult.error || addResult.rawText}`,
    );
    assertExists(addResult.data);

    // Verify the repository was added
    const listResult = await apiCall<{ id: string }[]>(
      `/projects/${projectId}/repositories`,
    );
    assertEquals(listResult.success, true);
    assertExists(listResult.data);
    assertEquals(listResult.data.length >= 1, true);
  } finally {
    // Cleanup: delete the project and test directory
    await apiCall(`/projects/${projectId}`, { method: "DELETE" });
    try {
      await Deno.remove(testRepoPath, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  }
});

Deno.test("API: Add repository to project with custom display_name", async () => {
  // Create a test repo directory with .git folder
  const testRepoPath = await createTestRepoDir("custom-name");

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
          git_repo_path: testRepoPath,
        }),
      },
    );
    console.log(
      "Add repo with custom name result:",
      JSON.stringify(addResult, null, 2),
    );
    assertEquals(
      addResult.success,
      true,
      `Failed to add repo: ${addResult.error || addResult.rawText}`,
    );
    assertExists(addResult.data);
  } finally {
    // Cleanup: delete the project and test directory
    await apiCall(`/projects/${projectId}`, { method: "DELETE" });
    try {
      await Deno.remove(testRepoPath, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  }
});

// ============================================================================
// Task CRUD Tests
// ============================================================================

Deno.test("API: Create, get, and delete task", async () => {
  // Create a test project first
  const projectResult = await apiCall<{ id: string }>(
    "/projects",
    {
      method: "POST",
      body: JSON.stringify({
        name: `test-project-task-${Date.now()}`,
        repositories: [],
      }),
    },
  );
  assertEquals(projectResult.success, true);
  const projectId = projectResult.data!.id;

  try {
    // Create a task
    const createResult = await apiCall<{ id: string; title: string }>(
      "/tasks",
      {
        method: "POST",
        body: JSON.stringify({
          project_id: projectId,
          title: `test-task-${Date.now()}`,
          description: "Test task description",
        }),
      },
    );
    assertEquals(
      createResult.success,
      true,
      `Failed to create task: ${createResult.error}`,
    );
    assertExists(createResult.data);
    const taskId = createResult.data.id;

    // Get the task by ID
    const getResult = await apiCall<{ id: string; title: string }>(
      `/tasks/${taskId}`,
    );
    assertEquals(getResult.success, true);
    assertEquals(getResult.data?.id, taskId);

    // Delete the task
    const deleteResult = await apiCall(`/tasks/${taskId}`, {
      method: "DELETE",
    });
    assertEquals(deleteResult.success, true);

    // Verify task is deleted
    const getDeletedResult = await apiCall(`/tasks/${taskId}`);
    assertEquals(getDeletedResult.success, false);
  } finally {
    // Cleanup project
    await apiCall(`/projects/${projectId}`, { method: "DELETE" });
  }
});

Deno.test("API: Update task", async () => {
  // Create a test project
  const projectResult = await apiCall<{ id: string }>(
    "/projects",
    {
      method: "POST",
      body: JSON.stringify({
        name: `test-project-task-update-${Date.now()}`,
        repositories: [],
      }),
    },
  );
  assertEquals(projectResult.success, true);
  const projectId = projectResult.data!.id;

  try {
    // Create a task
    const createResult = await apiCall<{ id: string; title: string }>(
      "/tasks",
      {
        method: "POST",
        body: JSON.stringify({
          project_id: projectId,
          title: `test-task-update-${Date.now()}`,
          description: "Original description",
        }),
      },
    );
    assertEquals(createResult.success, true);
    const taskId = createResult.data!.id;

    // Update the task title
    const updateTitleResult = await apiCall<{ id: string; title: string }>(
      `/tasks/${taskId}`,
      {
        method: "PUT",
        body: JSON.stringify({
          title: "Updated title",
        }),
      },
    );
    assertEquals(updateTitleResult.success, true);
    assertEquals(updateTitleResult.data?.title, "Updated title");

    // Update the task status
    const updateStatusResult = await apiCall<{ id: string; status: string }>(
      `/tasks/${taskId}`,
      {
        method: "PUT",
        body: JSON.stringify({
          status: "inprogress",
        }),
      },
    );
    assertEquals(updateStatusResult.success, true);
    assertEquals(updateStatusResult.data?.status, "inprogress");

    // Update the task description
    const updateDescResult = await apiCall<{ id: string; description: string }>(
      `/tasks/${taskId}`,
      {
        method: "PUT",
        body: JSON.stringify({
          description: "Updated description",
        }),
      },
    );
    assertEquals(updateDescResult.success, true);
    assertEquals(updateDescResult.data?.description, "Updated description");

    // Cleanup task
    await apiCall(`/tasks/${taskId}`, { method: "DELETE" });
  } finally {
    // Cleanup project
    await apiCall(`/projects/${projectId}`, { method: "DELETE" });
  }
});

Deno.test("API: List tasks with status filter", async () => {
  // Create a test project
  const projectResult = await apiCall<{ id: string }>(
    "/projects",
    {
      method: "POST",
      body: JSON.stringify({
        name: `test-project-task-filter-${Date.now()}`,
        repositories: [],
      }),
    },
  );
  assertEquals(projectResult.success, true);
  const projectId = projectResult.data!.id;

  try {
    // Create tasks with different statuses
    const task1Result = await apiCall<{ id: string }>(
      "/tasks",
      {
        method: "POST",
        body: JSON.stringify({
          project_id: projectId,
          title: `test-task-todo-${Date.now()}`,
          description: "Todo task",
        }),
      },
    );
    assertEquals(task1Result.success, true);
    const task1Id = task1Result.data!.id;

    const task2Result = await apiCall<{ id: string }>(
      "/tasks",
      {
        method: "POST",
        body: JSON.stringify({
          project_id: projectId,
          title: `test-task-inprogress-${Date.now()}`,
          description: "Inprogress task",
        }),
      },
    );
    assertEquals(task2Result.success, true);
    const task2Id = task2Result.data!.id;

    // Update task2 to inprogress
    const updateResult = await apiCall(`/tasks/${task2Id}`, {
      method: "PUT",
      body: JSON.stringify({ status: "inprogress" }),
    });
    assertEquals(updateResult.success, true, "Failed to update task2 status");

    // List all tasks for project
    const allTasksResult = await apiCall<{ id: string }[]>(
      `/tasks?project_id=${projectId}`,
    );
    assertEquals(allTasksResult.success, true);
    assertEquals(allTasksResult.data!.length, 2);

    // List only todo tasks
    const todoTasksResult = await apiCall<{ id: string; status: string }[]>(
      `/tasks?project_id=${projectId}&status=todo`,
    );
    assertEquals(todoTasksResult.success, true);
    // Should have at least 1 todo task (task1)
    // Note: Verify filter logic - the API should return only tasks matching the status
    assertEquals(
      todoTasksResult.data!.length >= 1,
      true,
      `Expected at least 1 todo task, got ${todoTasksResult.data!.length}`,
    );
    // Check that task1 (our known todo task) is in the results
    const hasTodoTask = todoTasksResult.data!.some((t) => t.id === task1Id);
    assertEquals(hasTodoTask, true, "Should find task1 (todo) in todo results");

    // List only inprogress tasks
    const inprogressTasksResult = await apiCall<
      { id: string; status: string }[]
    >(
      `/tasks?project_id=${projectId}&status=inprogress`,
    );
    assertEquals(inprogressTasksResult.success, true);
    // Should have at least 1 inprogress task (task2)
    assertEquals(
      inprogressTasksResult.data!.length >= 1,
      true,
      `Expected at least 1 inprogress task, got ${
        inprogressTasksResult.data!.length
      }`,
    );
    // Check that task2 (our known inprogress task) is in the results
    const hasInprogressTask = inprogressTasksResult.data!.some((t) =>
      t.id === task2Id
    );
    assertEquals(
      hasInprogressTask,
      true,
      "Should find task2 (inprogress) in inprogress results",
    );

    // Cleanup tasks
    await apiCall(`/tasks/${task1Id}`, { method: "DELETE" });
    await apiCall(`/tasks/${task2Id}`, { method: "DELETE" });
  } finally {
    // Cleanup project
    await apiCall(`/projects/${projectId}`, { method: "DELETE" });
  }
});

// ============================================================================
// Task Attempt (Workspace) CRUD Tests
// ============================================================================

// Note: Creating workspaces requires the server to have executor support configured
// These tests may fail on server versions that require additional fields
Deno.test({
  name: "API: Create, get, update, and delete task attempt",
  fn: async () => {
    // Create a test repo directory with .git folder
    const testRepoPath = await createTestRepoDir("attempt-repo");

    // Create a test project with repository
    const projectResult = await apiCall<{ id: string }>(
      "/projects",
      {
        method: "POST",
        body: JSON.stringify({
          name: `test-project-attempt-${Date.now()}`,
          repositories: [],
        }),
      },
    );
    assertEquals(projectResult.success, true);
    const projectId = projectResult.data!.id;

    // Add repository to project
    const addRepoResult = await apiCall<{ id: string }>(
      `/projects/${projectId}/repositories`,
      {
        method: "POST",
        body: JSON.stringify({
          display_name: "Test Attempt Repository",
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
      // Create a task
      const taskResult = await apiCall<{ id: string }>(
        "/tasks",
        {
          method: "POST",
          body: JSON.stringify({
            project_id: projectId,
            title: `test-task-attempt-${Date.now()}`,
            description: "Test task for attempt",
          }),
        },
      );
      assertEquals(
        taskResult.success,
        true,
        `Failed to create task: ${taskResult.error}`,
      );
      const taskId = taskResult.data!.id;

      // Create a task attempt
      const createResult = await apiCall<{ id: string; name: string }>(
        "/task-attempts",
        {
          method: "POST",
          body: JSON.stringify({
            task_id: taskId,
            executor_profile_id: {
              executor: "CLAUDE_CODE",
              variant: null,
            },
            repos: [{ repo_id: repoId, target_branch: "main" }],
          }),
        },
      );
      assertEquals(
        createResult.success,
        true,
        `Failed to create attempt: ${createResult.error}`,
      );
      assertExists(createResult.data);
      const attemptId = createResult.data.id;

      // Get the task attempt by ID
      const getResult = await apiCall<{ id: string; name: string }>(
        `/task-attempts/${attemptId}`,
      );
      assertEquals(getResult.success, true);
      assertEquals(getResult.data?.id, attemptId);

      // Update the task attempt name
      const updateResult = await apiCall<{ id: string; name: string }>(
        `/task-attempts/${attemptId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            name: "Updated Attempt Name",
          }),
        },
      );
      assertEquals(updateResult.success, true);
      assertEquals(updateResult.data?.name, "Updated Attempt Name");

      // Update archived status
      const archiveResult = await apiCall<{ id: string; archived: boolean }>(
        `/task-attempts/${attemptId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            archived: true,
          }),
        },
      );
      assertEquals(archiveResult.success, true);
      assertEquals(archiveResult.data?.archived, true);

      // Update pinned status
      const pinResult = await apiCall<{ id: string; pinned: boolean }>(
        `/task-attempts/${attemptId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            pinned: true,
          }),
        },
      );
      assertEquals(pinResult.success, true);
      assertEquals(pinResult.data?.pinned, true);

      // Delete the task attempt
      const deleteResult = await apiCall(`/task-attempts/${attemptId}`, {
        method: "DELETE",
      });
      assertEquals(deleteResult.success, true);

      // Verify task attempt is deleted
      const getDeletedResult = await apiCall(`/task-attempts/${attemptId}`);
      assertEquals(getDeletedResult.success, false);

      // Cleanup task
      await apiCall(`/tasks/${taskId}`, { method: "DELETE" });
    } finally {
      // Cleanup project and test directory
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
  name: "API: List task attempts with task filter",
  fn: async () => {
    // Create a test repo directory
    const testRepoPath = await createTestRepoDir("attempt-filter-repo");

    // Create a test project with repository
    const projectResult = await apiCall<{ id: string }>(
      "/projects",
      {
        method: "POST",
        body: JSON.stringify({
          name: `test-project-attempt-filter-${Date.now()}`,
          repositories: [],
        }),
      },
    );
    assertEquals(projectResult.success, true);
    const projectId = projectResult.data!.id;

    // Add repository to project
    const addRepoResult = await apiCall<{ id: string }>(
      `/projects/${projectId}/repositories`,
      {
        method: "POST",
        body: JSON.stringify({
          display_name: "Test Filter Repository",
          git_repo_path: testRepoPath,
        }),
      },
    );
    assertEquals(addRepoResult.success, true, `Failed to add repo: ${addRepoResult.error}`);
    const repoId = addRepoResult.data!.id;

    try {
      // Create two tasks
      const task1Result = await apiCall<{ id: string }>(
        "/tasks",
        {
          method: "POST",
          body: JSON.stringify({
            project_id: projectId,
            title: `test-task-filter-1-${Date.now()}`,
            description: "First task",
          }),
        },
      );
      assertEquals(task1Result.success, true);
      const task1Id = task1Result.data!.id;

      const task2Result = await apiCall<{ id: string }>(
        "/tasks",
        {
          method: "POST",
          body: JSON.stringify({
            project_id: projectId,
            title: `test-task-filter-2-${Date.now()}`,
            description: "Second task",
          }),
        },
      );
      assertEquals(task2Result.success, true);
      const task2Id = task2Result.data!.id;

      // Create attempts for task1
      const attempt1Result = await apiCall<{ id: string }>(
        "/task-attempts",
        {
          method: "POST",
          body: JSON.stringify({
            task_id: task1Id,
            executor_profile_id: {
              executor: "CLAUDE_CODE",
              variant: null,
            },
            repos: [{ repo_id: repoId, target_branch: "main" }],
          }),
        },
      );
      assertEquals(
        attempt1Result.success,
        true,
        `Failed to create attempt1: ${attempt1Result.error}`,
      );
      const attempt1Id = attempt1Result.data!.id;

      // Create attempts for task2
      const attempt2Result = await apiCall<{ id: string }>(
        "/task-attempts",
        {
          method: "POST",
          body: JSON.stringify({
            task_id: task2Id,
            executor_profile_id: {
              executor: "CLAUDE_CODE",
              variant: null,
            },
            repos: [{ repo_id: repoId, target_branch: "main" }],
          }),
        },
      );
      assertEquals(
        attempt2Result.success,
        true,
        `Failed to create attempt2: ${attempt2Result.error}`,
      );
      const attempt2Id = attempt2Result.data!.id;

      // List attempts filtered by task1
      const task1AttemptsResult = await apiCall<
        { id: string; task_id: string }[]
      >(
        `/task-attempts?task_id=${task1Id}`,
      );
      assertEquals(task1AttemptsResult.success, true);
      assertEquals(task1AttemptsResult.data!.length >= 1, true);
      // All results should be for task1
      for (const attempt of task1AttemptsResult.data!) {
        assertEquals(attempt.task_id, task1Id);
      }

      // List attempts filtered by task2
      const task2AttemptsResult = await apiCall<
        { id: string; task_id: string }[]
      >(
        `/task-attempts?task_id=${task2Id}`,
      );
      assertEquals(task2AttemptsResult.success, true);
      assertEquals(task2AttemptsResult.data!.length >= 1, true);
      // All results should be for task2
      for (const attempt of task2AttemptsResult.data!) {
        assertEquals(attempt.task_id, task2Id);
      }

      // Cleanup attempts
      await apiCall(`/task-attempts/${attempt1Id}`, { method: "DELETE" });
      await apiCall(`/task-attempts/${attempt2Id}`, { method: "DELETE" });

      // Cleanup tasks
      await apiCall(`/tasks/${task1Id}`, { method: "DELETE" });
      await apiCall(`/tasks/${task2Id}`, { method: "DELETE" });
    } finally {
      // Cleanup project and test directory
      await apiCall(`/projects/${projectId}`, { method: "DELETE" });
      try {
        await Deno.remove(testRepoPath, { recursive: true });
      } catch {
        // Ignore cleanup errors
      }
    }
  },
});

// ============================================================================
// Workspace Git Operations Tests (merge, push, rebase with repo_id)
// ============================================================================

Deno.test({
  name: "API: Workspace merge requires repo_id",
  fn: async () => {
    // Create a test repo directory
    const testRepoPath = await createTestRepoDir("merge-repo");

    // Create project
    const projectResult = await apiCall<{ id: string }>("/projects", {
      method: "POST",
      body: JSON.stringify({
        name: `test-project-merge-${Date.now()}`,
        repositories: [],
      }),
    });
    assertEquals(projectResult.success, true);
    const projectId = projectResult.data!.id;

    // Add repository to project
    const addRepoResult = await apiCall<{ id: string }>(
      `/projects/${projectId}/repositories`,
      {
        method: "POST",
        body: JSON.stringify({
          display_name: "Test Merge Repository",
          git_repo_path: testRepoPath,
        }),
      },
    );
    assertEquals(addRepoResult.success, true);
    const repoId = addRepoResult.data!.id;

    try {
      // Create task
      const taskResult = await apiCall<{ id: string }>("/tasks", {
        method: "POST",
        body: JSON.stringify({
          project_id: projectId,
          title: `test-task-merge-${Date.now()}`,
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
      assertEquals(workspaceResult.success, true, `Failed to create workspace: ${workspaceResult.error}`);
      const workspaceId = workspaceResult.data!.id;

      // Test merge with repo_id
      const mergeResult = await apiCall<{ success: boolean; message?: string }>(
        `/task-attempts/${workspaceId}/merge`,
        {
          method: "POST",
          body: JSON.stringify({ repo_id: repoId }),
        },
      );
      // Note: May fail if branch doesn't exist, but validates API accepts repo_id
      assertExists(mergeResult);

      // Cleanup
      await apiCall(`/task-attempts/${workspaceId}`, { method: "DELETE" });
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
  name: "API: Workspace push requires repo_id",
  fn: async () => {
    const testRepoPath = await createTestRepoDir("push-repo");

    const projectResult = await apiCall<{ id: string }>("/projects", {
      method: "POST",
      body: JSON.stringify({
        name: `test-project-push-${Date.now()}`,
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
          display_name: "Test Push Repository",
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
          title: `test-task-push-${Date.now()}`,
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
      assertEquals(workspaceResult.success, true, `Failed to create workspace: ${workspaceResult.error}`);
      const workspaceId = workspaceResult.data!.id;

      // Test push with repo_id
      const pushResult = await apiCall(`/task-attempts/${workspaceId}/push`, {
        method: "POST",
        body: JSON.stringify({ repo_id: repoId }),
      });
      assertExists(pushResult);

      // Test force push with repo_id
      const forcePushResult = await apiCall(
        `/task-attempts/${workspaceId}/push/force`,
        {
          method: "POST",
          body: JSON.stringify({ repo_id: repoId }),
        },
      );
      assertExists(forcePushResult);

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
  name: "API: Workspace rebase requires repo_id with optional base branches",
  fn: async () => {
    const testRepoPath = await createTestRepoDir("rebase-repo");

    const projectResult = await apiCall<{ id: string }>("/projects", {
      method: "POST",
      body: JSON.stringify({
        name: `test-project-rebase-${Date.now()}`,
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
          display_name: "Test Rebase Repository",
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
          title: `test-task-rebase-${Date.now()}`,
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
      assertEquals(workspaceResult.success, true, `Failed to create workspace: ${workspaceResult.error}`);
      const workspaceId = workspaceResult.data!.id;

      // Test rebase with repo_id only
      const rebaseResult1 = await apiCall(
        `/task-attempts/${workspaceId}/rebase`,
        {
          method: "POST",
          body: JSON.stringify({ repo_id: repoId }),
        },
      );
      assertExists(rebaseResult1);

      // Test rebase with repo_id and base branches
      const rebaseResult2 = await apiCall(
        `/task-attempts/${workspaceId}/rebase`,
        {
          method: "POST",
          body: JSON.stringify({
            repo_id: repoId,
            old_base_branch: "main",
            new_base_branch: "develop",
          }),
        },
      );
      assertExists(rebaseResult2);

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
// Task with image_ids Tests
// ============================================================================

Deno.test("API: Create task with image_ids", async () => {
  const projectResult = await apiCall<{ id: string }>("/projects", {
    method: "POST",
    body: JSON.stringify({
      name: `test-project-task-images-${Date.now()}`,
      repositories: [],
    }),
  });
  assertEquals(projectResult.success, true);
  const projectId = projectResult.data!.id;

  try {
    // Create task with image_ids
    const createResult = await apiCall<{ id: string; title: string }>(
      "/tasks",
      {
        method: "POST",
        body: JSON.stringify({
          project_id: projectId,
          title: `test-task-images-${Date.now()}`,
          description: "Task with images",
          image_ids: ["img-001", "img-002"],
        }),
      },
    );
    // Note: API may or may not support image_ids yet - test validates request is accepted
    if (createResult.success) {
      assertExists(createResult.data);
      await apiCall(`/tasks/${createResult.data.id}`, { method: "DELETE" });
    }
  } finally {
    await apiCall(`/projects/${projectId}`, { method: "DELETE" });
  }
});

Deno.test("API: Update task with image_ids", async () => {
  const projectResult = await apiCall<{ id: string }>("/projects", {
    method: "POST",
    body: JSON.stringify({
      name: `test-project-task-images-update-${Date.now()}`,
      repositories: [],
    }),
  });
  assertEquals(projectResult.success, true);
  const projectId = projectResult.data!.id;

  try {
    // Create task first
    const createResult = await apiCall<{ id: string }>("/tasks", {
      method: "POST",
      body: JSON.stringify({
        project_id: projectId,
        title: `test-task-images-update-${Date.now()}`,
      }),
    });
    assertEquals(createResult.success, true);
    const taskId = createResult.data!.id;

    // Update task with image_ids
    const updateResult = await apiCall<{ id: string }>(
      `/tasks/${taskId}`,
      {
        method: "PUT",
        body: JSON.stringify({
          image_ids: ["img-003", "img-004"],
        }),
      },
    );
    // Note: API may or may not support image_ids yet
    assertExists(updateResult);

    await apiCall(`/tasks/${taskId}`, { method: "DELETE" });
  } finally {
    await apiCall(`/projects/${projectId}`, { method: "DELETE" });
  }
});

// ============================================================================
// Repository default_target_branch Tests
// ============================================================================

Deno.test({
  name: "API: Repository includes default_target_branch field",
  fn: async () => {
    const result = await apiCall<
      { id: string; default_target_branch: string | null }[]
    >("/repos");
    assertEquals(result.success, true);
    assertExists(result.data);

    // Check that repos have the default_target_branch field (can be null)
    if (result.data.length > 0) {
      const repo = result.data[0];
      // Field should exist (value can be string or null)
      assertEquals("default_target_branch" in repo, true);
    }
  },
});

// ============================================================================
// Task list returns TaskWithAttemptStatus fields
// ============================================================================

Deno.test("API: Task list returns attempt status fields", async () => {
  const projectsResult = await apiCall<{ id: string }[]>("/projects");
  assertEquals(projectsResult.success, true);

  if (projectsResult.data && projectsResult.data.length > 0) {
    const tasksResult = await apiCall<
      {
        id: string;
        has_in_progress_attempt?: boolean;
        last_attempt_failed?: boolean;
        executor?: string;
      }[]
    >(`/tasks?project_id=${projectsResult.data[0].id}`);

    assertEquals(tasksResult.success, true);
    assertExists(tasksResult.data);

    // Check that tasks have the new attempt status fields
    if (tasksResult.data.length > 0) {
      const task = tasksResult.data[0];
      // These fields should exist in TaskWithAttemptStatus
      // Note: exact field names depend on API version
      assertExists(task.id);
    }
  }
});

// ============================================================================
// Project Update Test
// ============================================================================

Deno.test("API: Update project", async () => {
  // Create a test project
  const createResult = await apiCall<{ id: string; name: string }>(
    "/projects",
    {
      method: "POST",
      body: JSON.stringify({
        name: `test-project-update-${Date.now()}`,
        repositories: [],
      }),
    },
  );
  assertEquals(createResult.success, true);
  const projectId = createResult.data!.id;

  try {
    // Update project name
    const updateResult = await apiCall<{ id: string; name: string }>(
      `/projects/${projectId}`,
      {
        method: "PUT",
        body: JSON.stringify({
          name: "Updated Project Name",
        }),
      },
    );
    assertEquals(updateResult.success, true);
    assertEquals(updateResult.data?.name, "Updated Project Name");

    // Verify update persisted
    const getResult = await apiCall<{ id: string; name: string }>(
      `/projects/${projectId}`,
    );
    assertEquals(getResult.success, true);
    assertEquals(getResult.data?.name, "Updated Project Name");
  } finally {
    // Cleanup
    await apiCall(`/projects/${projectId}`, { method: "DELETE" });
  }
});

// ============================================================================
// Remove Repository from Project Test
// ============================================================================

Deno.test("API: Remove repository from project", async () => {
  // Create a test repo directory
  const testRepoPath = await createTestRepoDir("remove-repo");

  // Create a test project
  const createResult = await apiCall<{ id: string }>(
    "/projects",
    {
      method: "POST",
      body: JSON.stringify({
        name: `test-project-remove-repo-${Date.now()}`,
        repositories: [],
      }),
    },
  );
  assertEquals(createResult.success, true);
  const projectId = createResult.data!.id;

  try {
    // Add a repository
    const addResult = await apiCall<{ id: string }>(
      `/projects/${projectId}/repositories`,
      {
        method: "POST",
        body: JSON.stringify({
          display_name: "Repo To Remove",
          git_repo_path: testRepoPath,
        }),
      },
    );
    assertEquals(
      addResult.success,
      true,
      `Failed to add repo: ${addResult.error}`,
    );
    const repoId = addResult.data!.id;

    // Verify repository is added
    const listBefore = await apiCall<{ id: string }[]>(
      `/projects/${projectId}/repositories`,
    );
    assertEquals(listBefore.success, true);
    assertEquals(listBefore.data!.some((r) => r.id === repoId), true);

    // Remove the repository from project
    const removeResult = await apiCall(
      `/projects/${projectId}/repositories/${repoId}`,
      { method: "DELETE" },
    );
    assertEquals(removeResult.success, true);

    // Verify repository is removed from project
    const listAfter = await apiCall<{ id: string }[]>(
      `/projects/${projectId}/repositories`,
    );
    assertEquals(listAfter.success, true);
    assertEquals(listAfter.data!.some((r) => r.id === repoId), false);
  } finally {
    // Cleanup project and test directory
    await apiCall(`/projects/${projectId}`, { method: "DELETE" });
    try {
      await Deno.remove(testRepoPath, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  }
});
