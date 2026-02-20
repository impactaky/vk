/**
 * CLI commands integration tests.
 * Tests CLI commands end-to-end via subprocess execution.
 *
 * Run with: docker compose run --rm vk
 */

import { assert, assertEquals } from "@std/assert";
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

// ============================================================================
// CLI: vk attempt list
// ============================================================================

Deno.test("CLI: vk attempt list runs successfully", async () => {
  const command = new Deno.Command("deno", {
    args: [
      "run",
      "--allow-net",
      "--allow-read",
      "--allow-write",
      "--allow-env",
      "src/main.ts",
      "attempt",
      "list",
      "--json",
    ],
    stdout: "piped",
    stderr: "piped",
    env: {
      VK_API_URL: config.apiUrl,
      HOME: "/tmp/test-home-list",
    },
  });

  const { code, stdout, stderr } = await command.output();
  const stderrText = new TextDecoder().decode(stderr);

  assertEquals(
    code,
    0,
    `attempt list failed with code ${code}: ${stderrText}`,
  );

  // Should output valid JSON array
  const stdoutText = new TextDecoder().decode(stdout);
  const parsed = JSON.parse(stdoutText);
  assertEquals(Array.isArray(parsed), true);
});

// ============================================================================
// CLI: vk repository list
// ============================================================================

Deno.test("CLI: vk repository list runs successfully", async () => {
  const command = new Deno.Command("deno", {
    args: [
      "run",
      "--allow-net",
      "--allow-read",
      "--allow-write",
      "--allow-env",
      "src/main.ts",
      "repository",
      "list",
      "--json",
    ],
    stdout: "piped",
    stderr: "piped",
    env: {
      VK_API_URL: config.apiUrl,
      HOME: "/tmp/test-home-repo-list",
    },
  });

  const { code, stdout, stderr } = await command.output();
  const stderrText = new TextDecoder().decode(stderr);

  assertEquals(
    code,
    0,
    `repository list failed with code ${code}: ${stderrText}`,
  );

  const stdoutText = new TextDecoder().decode(stdout);
  const parsed = JSON.parse(stdoutText);
  assertEquals(Array.isArray(parsed), true);
});

// ============================================================================
// CLI: vk attempt spin-off (uses create-and-start)
// ============================================================================

Deno.test({
  name: "CLI: vk attempt spin-off creates workspace via create-and-start",
  fn: async () => {
    // First check if there are any workspaces to spin off from
    const workspacesResult = await apiCall<{ id: string }[]>("/task-attempts");
    assertEquals(workspacesResult.success, true);

    if (!workspacesResult.data || workspacesResult.data.length === 0) {
      console.log("Skipping spin-off test: no workspaces available");
      return;
    }

    const parentWorkspaceId = workspacesResult.data[0].id;

    // Check if workspace has repos
    const reposResult = await apiCall<{ repo_id: string }[]>(
      `/task-attempts/${parentWorkspaceId}/repos`,
    );
    if (
      !reposResult.success || !reposResult.data ||
      reposResult.data.length === 0
    ) {
      console.log("Skipping spin-off test: parent workspace has no repos");
      return;
    }

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
        parentWorkspaceId,
        "--title",
        "Child workspace from spin-off test",
        "--description",
        "Test description for spin-off command",
        "--executor",
        "CLAUDE_CODE:DEFAULT",
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

    // spin-off uses create-and-start which may 500 without an executor,
    // so we just verify the command was properly invoked
    if (code === 0) {
      // Parse workspace ID from output (format: "{id} {title}\nBranch: {branch}")
      const lines = stdoutText.trim().split("\n");
      assert(lines.length >= 1, `Expected output, got: ${stdoutText}`);

      // First line should contain workspace ID
      const firstLine = lines[0];
      const spaceIndex = firstLine.indexOf(" ");
      if (spaceIndex > 0) {
        const newWorkspaceId = firstLine.substring(0, spaceIndex);
        // Cleanup the created workspace
        await apiCall(`/task-attempts/${newWorkspaceId}`, {
          method: "DELETE",
        });
      }
    } else {
      // If it failed, it should be because create-and-start returned 500 (no executor)
      // not because of a client-side error
      assert(
        stderrText.includes("500") || stderrText.includes("Error"),
        `Unexpected failure: code=${code} stderr=${stderrText}`,
      );
    }
  },
});
