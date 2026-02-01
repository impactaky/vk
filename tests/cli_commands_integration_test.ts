/**
 * CLI commands integration tests.
 * Tests CLI commands end-to-end via subprocess execution.
 *
 * Run with: docker compose run --rm vk
 */

import { assert, assertEquals, assertExists } from "@std/assert";
import { join } from "@std/path";
import { config } from "./helpers/test-server.ts";

// Helper to make raw API calls for verification
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

// Shared test directory path (available in both containers via shared volume)
const SHARED_TEST_DIR = "/shared";

// Helper to create a test repository directory with .git folder
async function createTestRepoDir(suffix: string): Promise<string> {
  const testPath = `${SHARED_TEST_DIR}/test-repo-cli-${Date.now()}-${suffix}`;
  await Deno.mkdir(`${testPath}/.git`, { recursive: true });
  return testPath;
}

// ============================================================================
// CLI: vk attempt spin-off
// ============================================================================

Deno.test("CLI: vk attempt spin-off creates task with parent_workspace_id", async () => {
  const testRepoPath = await createTestRepoDir("spin-off");

  // Create project with repository
  const projectResult = await apiCall<{ id: string }>("/projects", {
    method: "POST",
    body: JSON.stringify({
      name: `test-project-spin-off-${Date.now()}`,
      repositories: [],
    }),
  });
  assertEquals(projectResult.success, true);
  const projectId = projectResult.data!.id;

  try {
    // Add repository to project
    const addRepoResult = await apiCall<{ id: string }>(
      `/projects/${projectId}/repositories`,
      {
        method: "POST",
        body: JSON.stringify({
          display_name: "Test Spin-off Repository",
          git_repo_path: testRepoPath,
        }),
      },
    );
    assertEquals(addRepoResult.success, true);
    const repoId = addRepoResult.data!.id;

    // Create task
    const taskResult = await apiCall<{ id: string }>("/tasks", {
      method: "POST",
      body: JSON.stringify({
        project_id: projectId,
        title: `test-task-spin-off-${Date.now()}`,
        description: "Parent task for spin-off test",
      }),
    });
    assertEquals(taskResult.success, true);
    const taskId = taskResult.data!.id;

    // Create workspace (attempt)
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

    // Execute CLI spin-off command
    const command = new Deno.Command("deno", {
      args: [
        "run",
        "--allow-net",
        "--allow-read",
        "--allow-write",
        "--allow-env",
        "src/main.ts",
        "attempt",
        "spin-off",
        workspaceId,
        "--title",
        "Child task from spin-off",
        "--message",
        "Test message for spin-off command",
      ],
      stdout: "piped",
      stderr: "piped",
      env: {
        VK_API_URL: config.apiUrl,
        HOME: "/tmp/test-home-spin-off",
      },
    });

    const { code, stdout, stderr } = await command.output();
    const stdoutText = new TextDecoder().decode(stdout);
    const stderrText = new TextDecoder().decode(stderr);

    assertEquals(
      code,
      0,
      `Spin-off command failed with code ${code}: ${stderrText}`,
    );

    // Parse task ID from output (format: "{id} {title}")
    const outputLine = stdoutText.trim();
    const spaceIndex = outputLine.indexOf(" ");
    assertExists(
      spaceIndex > 0,
      `Expected output format "{id} {title}", got: ${outputLine}`,
    );
    const newTaskId = outputLine.substring(0, spaceIndex);

    // Verify task was created with correct parent_workspace_id via API
    const taskCheckResult = await apiCall<
      { id: string; parent_workspace_id?: string }
    >(
      `/tasks/${newTaskId}`,
    );
    assertEquals(taskCheckResult.success, true);
    assertEquals(
      taskCheckResult.data?.parent_workspace_id,
      workspaceId,
      "Task should have parent_workspace_id set to workspace ID",
    );

    // Cleanup: delete created task
    await apiCall(`/tasks/${newTaskId}`, { method: "DELETE" });

    // Cleanup: delete workspace and parent task
    await apiCall(`/task-attempts/${workspaceId}`, { method: "DELETE" });
    await apiCall(`/tasks/${taskId}`, { method: "DELETE" });
  } finally {
    // Cleanup: delete project and test directory
    await apiCall(`/projects/${projectId}`, { method: "DELETE" });
    try {
      await Deno.remove(testRepoPath, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  }
});

// ============================================================================
// CLI: vk config set/get shell
// ============================================================================

Deno.test("CLI: vk config set/get shell persists value", async () => {
  // Use isolated HOME directory to avoid polluting user config
  const testHome = `/tmp/test-home-${Date.now()}`;
  const configPath = join(
    testHome,
    ".config",
    "vibe-kanban",
    "vk-config.json",
  );

  try {
    // Execute CLI config set command
    const setCommand = new Deno.Command("deno", {
      args: [
        "run",
        "--allow-net",
        "--allow-read",
        "--allow-write",
        "--allow-env",
        "src/main.ts",
        "config",
        "set",
        "shell",
        "zsh",
      ],
      stdout: "piped",
      stderr: "piped",
      env: {
        VK_API_URL: config.apiUrl,
        HOME: testHome,
      },
    });

    const setResult = await setCommand.output();
    const setStderr = new TextDecoder().decode(setResult.stderr);

    assertEquals(
      setResult.code,
      0,
      `Config set failed with code ${setResult.code}: ${setStderr}`,
    );

    // Verify config file was created and contains correct value
    const configContent = await Deno.readTextFile(configPath);
    const configData = JSON.parse(configContent);
    assertEquals(
      configData.shell,
      "zsh",
      "Config file should contain shell='zsh'",
    );

    // Execute CLI config show command to verify get retrieves value
    const showCommand = new Deno.Command("deno", {
      args: [
        "run",
        "--allow-net",
        "--allow-read",
        "--allow-write",
        "--allow-env",
        "src/main.ts",
        "config",
        "show",
      ],
      stdout: "piped",
      stderr: "piped",
      env: {
        VK_API_URL: config.apiUrl,
        HOME: testHome,
      },
    });

    const showResult = await showCommand.output();
    const showStdout = new TextDecoder().decode(showResult.stdout);
    const showStderr = new TextDecoder().decode(showResult.stderr);

    assertEquals(
      showResult.code,
      0,
      `Config show failed with code ${showResult.code}: ${showStderr}`,
    );

    // Verify output contains the shell value
    assert(
      showStdout.includes("zsh"),
      `Expected output to contain "zsh", got: ${showStdout}`,
    );
  } finally {
    // Cleanup: remove test HOME directory
    try {
      await Deno.remove(testHome, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  }
});
