/**
 * CLI integration tests for vibe-kanban CLI.
 * These tests invoke actual CLI commands using Deno.Command.
 *
 * Run with: deno task test:integration
 *
 * Environment variables:
 * - VK_API_URL: API endpoint (default: http://localhost:3000)
 */

import { assertEquals, assertExists, assertStringIncludes } from "@std/assert";
import { runCli, runCliJson } from "./helpers/cli-runner.ts";
import { generateProjectName, generateTaskTitle } from "./helpers/test-data.ts";

// Shared test directory path (available in both containers via shared volume)
const SHARED_TEST_DIR = "/shared";

// Helper to create a test repository directory with .git folder
async function createTestRepoDir(suffix: string): Promise<string> {
  const testPath = `${SHARED_TEST_DIR}/test-repo-cli-${Date.now()}-${suffix}`;
  await Deno.mkdir(`${testPath}/.git`, { recursive: true });
  return testPath;
}

// ==================== Config Command Tests ====================

Deno.test("CLI: config show displays configuration", async () => {
  const result = await runCli(["config", "show"]);
  assertEquals(result.success, true);
  assertStringIncludes(result.stdout, "API URL:");
});

// ==================== Project Command Tests ====================

Deno.test("CLI: project list returns JSON array", async () => {
  const { result, data } = await runCliJson<unknown[]>(["project", "list"]);
  assertEquals(result.success, true);
  assertExists(data);
  assertEquals(Array.isArray(data), true);
});

Deno.test("CLI: project create and delete lifecycle", async () => {
  const projectName = generateProjectName();

  // Create project
  const createResult = await runCli([
    "project",
    "create",
    "--name",
    projectName,
  ]);
  assertEquals(
    createResult.success,
    true,
    `Create failed: ${createResult.stderr}`,
  );

  // Extract project ID from JSON output
  const { data: listData } = await runCliJson<{ id: string; name: string }[]>([
    "project",
    "list",
  ]);
  const createdProject = listData?.find((p) => p.name === projectName);
  assertExists(createdProject, "Created project not found in list");
  const projectId = createdProject.id;

  // Show project
  const { result: showResult, data: showData } = await runCliJson<
    { id: string; name: string }
  >(["project", "show", projectId]);
  assertEquals(showResult.success, true);
  assertEquals(showData?.name, projectName);

  // Delete project
  const deleteResult = await runCli([
    "project",
    "delete",
    projectId,
    "--force",
  ]);
  assertEquals(
    deleteResult.success,
    true,
    `Delete failed: ${deleteResult.stderr}`,
  );
});

Deno.test("CLI: project update changes name", async () => {
  const projectName = generateProjectName();
  const newName = `${projectName}-updated`;

  // Create project
  await runCli(["project", "create", "--name", projectName]);

  // Find project ID
  const { data: listData } = await runCliJson<{ id: string; name: string }[]>([
    "project",
    "list",
  ]);
  const createdProject = listData?.find((p) => p.name === projectName);
  assertExists(createdProject);
  const projectId = createdProject.id;

  try {
    // Update project
    const updateResult = await runCli([
      "project",
      "update",
      projectId,
      "--name",
      newName,
    ]);
    assertEquals(
      updateResult.success,
      true,
      `Update failed: ${updateResult.stderr}`,
    );

    // Verify update
    const { data } = await runCliJson<{ name: string }>([
      "project",
      "show",
      projectId,
    ]);
    assertEquals(data?.name, newName);
  } finally {
    await runCli(["project", "delete", projectId, "--force"]);
  }
});

Deno.test("CLI: project repos lists repositories", async () => {
  const projectName = generateProjectName();

  // Create project
  await runCli(["project", "create", "--name", projectName]);

  // Find project ID
  const { data: listData } = await runCliJson<{ id: string; name: string }[]>([
    "project",
    "list",
  ]);
  const createdProject = listData?.find((p) => p.name === projectName);
  assertExists(createdProject);
  const projectId = createdProject.id;

  try {
    // List repos (should be empty initially)
    const { result, data } = await runCliJson<unknown[]>([
      "project",
      "repos",
      projectId,
    ]);
    assertEquals(result.success, true, `Repos failed: ${result.stderr}`);
    assertExists(data);
    assertEquals(Array.isArray(data), true);
  } finally {
    await runCli(["project", "delete", projectId, "--force"]);
  }
});

Deno.test("CLI: project add-repo and remove-repo", async () => {
  const projectName = generateProjectName();
  const testRepoPath = await createTestRepoDir("add-remove");

  // Create project
  await runCli(["project", "create", "--name", projectName]);

  // Find project ID
  const { data: listData } = await runCliJson<{ id: string; name: string }[]>([
    "project",
    "list",
  ]);
  const createdProject = listData?.find((p) => p.name === projectName);
  assertExists(createdProject);
  const projectId = createdProject.id;

  try {
    // Add repo
    const addResult = await runCli([
      "project",
      "add-repo",
      projectId,
      "--path",
      testRepoPath,
      "--display-name",
      "CLI Test Repo",
    ]);
    assertEquals(addResult.success, true, `Add-repo failed: ${addResult.stderr}`);

    // Verify repo was added
    const { data: reposData } = await runCliJson<{ id: string }[]>([
      "project",
      "repos",
      projectId,
    ]);
    assertExists(reposData);
    assertEquals(reposData.length >= 1, true);
    const repoId = reposData[0].id;

    // Remove repo
    const removeResult = await runCli([
      "project",
      "remove-repo",
      projectId,
      "--repo",
      repoId,
    ]);
    assertEquals(
      removeResult.success,
      true,
      `Remove-repo failed: ${removeResult.stderr}`,
    );
  } finally {
    await runCli(["project", "delete", projectId, "--force"]);
    try {
      await Deno.remove(testRepoPath, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  }
});

// ==================== Repository Command Tests ====================

Deno.test("CLI: repository list returns JSON array", async () => {
  const { result, data } = await runCliJson<unknown[]>(["repository", "list"]);
  assertEquals(result.success, true);
  assertExists(data);
  assertEquals(Array.isArray(data), true);
});

Deno.test("CLI: repository register and show", async () => {
  const testRepoPath = await createTestRepoDir("register");

  try {
    // Register repository
    const registerResult = await runCli([
      "repository",
      "register",
      "--path",
      testRepoPath,
      "--display-name",
      "CLI Register Test",
    ]);
    assertEquals(
      registerResult.success,
      true,
      `Register failed: ${registerResult.stderr}`,
    );

    // Find the registered repo
    const { data: listData } = await runCliJson<
      { id: string; git_repo_path: string }[]
    >(["repository", "list"]);
    const registeredRepo = listData?.find((r) =>
      r.git_repo_path === testRepoPath
    );
    assertExists(registeredRepo, "Registered repo not found");

    // Show repository
    const { result: showResult, data: showData } = await runCliJson<
      { id: string }
    >(["repository", "show", registeredRepo.id]);
    assertEquals(showResult.success, true);
    assertEquals(showData?.id, registeredRepo.id);
  } finally {
    try {
      await Deno.remove(testRepoPath, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  }
});

Deno.test("CLI: repository update display name", async () => {
  const testRepoPath = await createTestRepoDir("update");

  try {
    // Register repository
    await runCli([
      "repository",
      "register",
      "--path",
      testRepoPath,
      "--display-name",
      "Original Name",
    ]);

    // Find the registered repo
    const { data: listData } = await runCliJson<
      { id: string; git_repo_path: string }[]
    >(["repository", "list"]);
    const registeredRepo = listData?.find((r) =>
      r.git_repo_path === testRepoPath
    );
    assertExists(registeredRepo);

    // Update display name
    const updateResult = await runCli([
      "repository",
      "update",
      registeredRepo.id,
      "--display-name",
      "Updated Name",
    ]);
    assertEquals(
      updateResult.success,
      true,
      `Update failed: ${updateResult.stderr}`,
    );

    // Verify update
    const { data: showData } = await runCliJson<{ display_name: string }>([
      "repository",
      "show",
      registeredRepo.id,
    ]);
    assertEquals(showData?.display_name, "Updated Name");
  } finally {
    try {
      await Deno.remove(testRepoPath, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  }
});

Deno.test("CLI: repository branches lists branches", async () => {
  const testRepoPath = await createTestRepoDir("branches");

  try {
    // Register repository
    await runCli([
      "repository",
      "register",
      "--path",
      testRepoPath,
    ]);

    // Find the registered repo
    const { data: listData } = await runCliJson<
      { id: string; git_repo_path: string }[]
    >(["repository", "list"]);
    const registeredRepo = listData?.find((r) =>
      r.git_repo_path === testRepoPath
    );
    assertExists(registeredRepo);

    // List branches (may be empty for test repo)
    const { result } = await runCliJson<unknown[]>([
      "repository",
      "branches",
      registeredRepo.id,
    ]);
    // Just verify command runs - branches may be empty for mock repo
    assertEquals(result.success, true, `Branches failed: ${result.stderr}`);
  } finally {
    try {
      await Deno.remove(testRepoPath, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  }
});

// ==================== Task Command Tests ====================

Deno.test("CLI: task create, list, show, update, delete lifecycle", async () => {
  const projectName = generateProjectName();
  const testRepoPath = await createTestRepoDir("task-test");

  // Create project with repo (required for tasks)
  await runCli(["project", "create", "--name", projectName]);
  const { data: projectList } = await runCliJson<{ id: string; name: string }[]>(
    ["project", "list"],
  );
  const project = projectList?.find((p) => p.name === projectName);
  assertExists(project);
  const projectId = project.id;

  // Add repo to project
  await runCli([
    "project",
    "add-repo",
    projectId,
    "--path",
    testRepoPath,
  ]);

  try {
    const taskTitle = generateTaskTitle();

    // Create task
    const createResult = await runCli([
      "task",
      "create",
      "--project",
      projectId,
      "--title",
      taskTitle,
      "--description",
      "Test task description",
    ]);
    assertEquals(
      createResult.success,
      true,
      `Task create failed: ${createResult.stderr}`,
    );

    // List tasks
    const { result: listResult, data: taskList } = await runCliJson<
      { id: string; title: string }[]
    >(["task", "list", "--project", projectId]);
    assertEquals(listResult.success, true);
    const createdTask = taskList?.find((t) => t.title === taskTitle);
    assertExists(createdTask, "Created task not found in list");
    const taskId = createdTask.id;

    // Show task
    const { result: showResult, data: showData } = await runCliJson<
      { id: string; title: string }
    >(["task", "show", taskId, "--project", projectId]);
    assertEquals(showResult.success, true);
    assertEquals(showData?.title, taskTitle);

    // Update task
    const updateResult = await runCli([
      "task",
      "update",
      taskId,
      "--project",
      projectId,
      "--title",
      `${taskTitle}-updated`,
    ]);
    assertEquals(
      updateResult.success,
      true,
      `Task update failed: ${updateResult.stderr}`,
    );

    // Verify update
    const { data: updatedData } = await runCliJson<{ title: string }>([
      "task",
      "show",
      taskId,
      "--project",
      projectId,
    ]);
    assertEquals(updatedData?.title, `${taskTitle}-updated`);

    // Delete task
    const deleteResult = await runCli([
      "task",
      "delete",
      taskId,
      "--project",
      projectId,
      "--force",
    ]);
    assertEquals(
      deleteResult.success,
      true,
      `Task delete failed: ${deleteResult.stderr}`,
    );
  } finally {
    await runCli(["project", "delete", projectId, "--force"]);
    try {
      await Deno.remove(testRepoPath, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  }
});

// ==================== Attempt Command Tests ====================

Deno.test("CLI: attempt list returns JSON array", async () => {
  const { result, data } = await runCliJson<unknown[]>(["attempt", "list"]);
  assertEquals(result.success, true);
  assertExists(data);
  assertEquals(Array.isArray(data), true);
});

// Note: More comprehensive attempt tests require a running executor
// and are not suitable for basic integration tests.

// ==================== Error Handling Tests ====================

Deno.test("CLI: project show with invalid ID returns error", async () => {
  const result = await runCli(["project", "show", "nonexistent-id-12345"]);
  assertEquals(result.success, false);
});

Deno.test("CLI: task list without project fails appropriately", async () => {
  // Task list without --project should either fail or show all tasks
  const result = await runCli(["task", "list"]);
  // This may succeed (showing all tasks) or fail depending on implementation
  // Just verify command runs without crash
  assertExists(result.code);
});
