/**
 * Task-attempts integration tests.
 * Verifies the task-attempts CLI command maps to task-attempts API endpoints.
 *
 * Run with: docker compose run --rm vk
 */

import { assertEquals, assertExists } from "@std/assert";
import { config } from "./helpers/test-server.ts";

type ApiResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status?: number;
  rawText?: string;
};

async function apiCall<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResult<T>> {
  const response = await fetch(`${config.apiUrl}/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const text = await response.text();
  try {
    return { ...JSON.parse(text), status: response.status };
  } catch {
    return {
      success: false,
      error: text,
      status: response.status,
      rawText: text,
    };
  }
}

async function isGitInstalled(): Promise<boolean> {
  try {
    const output = await new Deno.Command("git", {
      args: ["--version"],
      stdout: "null",
      stderr: "null",
    }).output();
    return output.code === 0;
  } catch {
    return false;
  }
}

Deno.test("API: task-attempts endpoint returns array when accessible", async () => {
  const result = await apiCall<unknown[]>("/task-attempts");

  if (result.status === 401) {
    assertEquals(result.success, false);
    return;
  }

  assertEquals(result.success, true);
  assertEquals(result.rawText, undefined, "Should return JSON, not HTML");
  assertExists(result.data);
  assertEquals(Array.isArray(result.data), true);
});

Deno.test("CLI: vk task-attempts list --json", async () => {
  const endpointCheck = await apiCall<unknown[]>("/task-attempts");
  if (endpointCheck.status === 401) {
    return;
  }

  const command = new Deno.Command("deno", {
    args: [
      "run",
      "--allow-net",
      "--allow-read",
      "--allow-write",
      "--allow-env",
      "src/main.ts",
      "task-attempts",
      "list",
      "--json",
    ],
    stdout: "piped",
    stderr: "piped",
    env: {
      VK_API_URL: config.apiUrl,
      HOME: "/tmp/test-home-task-attempts-list",
    },
  });

  const { code, stdout, stderr } = await command.output();
  const stderrText = new TextDecoder().decode(stderr);

  assertEquals(
    code,
    0,
    `Expected exit code 0 for task-attempts list. stderr: ${stderrText}`,
  );

  const parsed = JSON.parse(new TextDecoder().decode(stdout));
  assertEquals(Array.isArray(parsed), true);
});

Deno.test("CLI: vk task-attempts show <id> --json", async () => {
  const listResult = await apiCall<Array<{ id: string }>>("/task-attempts");
  if (
    listResult.status === 401 || !listResult.success || !listResult.data ||
    listResult.data.length === 0
  ) {
    return;
  }

  const firstId = listResult.data[0].id;
  const command = new Deno.Command("deno", {
    args: [
      "run",
      "--allow-net",
      "--allow-read",
      "--allow-write",
      "--allow-env",
      "src/main.ts",
      "task-attempts",
      "show",
      firstId,
      "--json",
    ],
    stdout: "piped",
    stderr: "piped",
    env: {
      VK_API_URL: config.apiUrl,
      HOME: "/tmp/test-home-task-attempts-show",
    },
  });

  const { code, stdout, stderr } = await command.output();
  const stderrText = new TextDecoder().decode(stderr);

  assertEquals(
    code,
    0,
    `Expected exit code 0 for task-attempts show. stderr: ${stderrText}`,
  );

  const parsed = JSON.parse(new TextDecoder().decode(stdout));
  assertEquals(parsed.id, firstId);
});

Deno.test("CLI: vk task-attempts show --json auto-detects ID from branch", async () => {
  if (!(await isGitInstalled())) {
    return;
  }

  const listResult = await apiCall<Array<{ id: string; branch: string }>>(
    "/task-attempts",
  );
  if (
    listResult.status === 401 || !listResult.success || !listResult.data ||
    listResult.data.length === 0
  ) {
    return;
  }

  const branchWorkspace = listResult.data.find((item) => Boolean(item.branch));
  if (!branchWorkspace) {
    return;
  }

  const tempDir = await Deno.makeTempDir({
    prefix: "vk-task-attempts-branch-autodetect-",
  });

  try {
    const initCommand = new Deno.Command("git", {
      args: ["init"],
      cwd: tempDir,
      stdout: "null",
      stderr: "null",
    });
    const initResult = await initCommand.output();
    assertEquals(initResult.code, 0);

    const checkoutCommand = new Deno.Command("git", {
      args: ["checkout", "-b", branchWorkspace.branch],
      cwd: tempDir,
      stdout: "null",
      stderr: "null",
    });
    const checkoutResult = await checkoutCommand.output();
    assertEquals(checkoutResult.code, 0);

    const output = await new Deno.Command("deno", {
      args: [
        "run",
        "--allow-net",
        "--allow-read",
        "--allow-write",
        "--allow-env",
        "--allow-run",
        `${Deno.cwd()}/src/main.ts`,
        "task-attempts",
        "show",
        "--json",
      ],
      cwd: tempDir,
      stdout: "piped",
      stderr: "piped",
      env: {
        VK_API_URL: config.apiUrl,
        HOME: "/tmp/test-home-task-attempts-show-autodetect",
      },
    }).output();

    const stderrText = new TextDecoder().decode(output.stderr);
    assertEquals(
      output.code,
      0,
      `Expected exit code 0 for auto-detected task-attempt show. stderr: ${stderrText}`,
    );

    const parsed = JSON.parse(new TextDecoder().decode(output.stdout));
    assertEquals(parsed.id, branchWorkspace.id);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("CLI: vk task-attempts update <id> --name --archived --pinned --json", async () => {
  const listResult = await apiCall<
    Array<{ id: string; name: string | null; archived: boolean; pinned: boolean }>
  >("/task-attempts");
  if (
    listResult.status === 401 || !listResult.success || !listResult.data ||
    listResult.data.length === 0
  ) {
    return;
  }

  const target = listResult.data.find((item) => item.name !== null);
  if (!target || !target.name) {
    return;
  }

  const args = [
    "run",
    "--allow-net",
    "--allow-read",
    "--allow-write",
    "--allow-env",
    "src/main.ts",
    "task-attempts",
    "update",
    target.id,
    "--name",
    target.name,
    target.archived ? "--archived" : "--no-archived",
    target.pinned ? "--pinned" : "--no-pinned",
    "--json",
  ];

  const command = new Deno.Command("deno", {
    args,
    stdout: "piped",
    stderr: "piped",
    env: {
      VK_API_URL: config.apiUrl,
      HOME: "/tmp/test-home-task-attempts-update",
    },
  });

  const { code, stdout, stderr } = await command.output();
  const stderrText = new TextDecoder().decode(stderr);

  assertEquals(
    code,
    0,
    `Expected exit code 0 for task-attempts update. stderr: ${stderrText}`,
  );

  const parsed = JSON.parse(new TextDecoder().decode(stdout));
  assertEquals(parsed.id, target.id);
});

Deno.test("CLI: vk task-attempts update without id reports resolver error path", async () => {
  const endpointCheck = await apiCall<unknown[]>("/task-attempts");
  if (endpointCheck.status === 401) {
    return;
  }

  const tempDir = await Deno.makeTempDir({
    prefix: "vk-task-attempts-update-no-id-",
  });

  try {
    const command = new Deno.Command(Deno.execPath(), {
      args: [
        "run",
        "--allow-net",
        "--allow-read",
        "--allow-write",
        "--allow-env",
        "--allow-run",
        `${Deno.cwd()}/src/main.ts`,
        "task-attempts",
        "update",
        "--name",
        "noop",
      ],
      cwd: tempDir,
      stdout: "piped",
      stderr: "piped",
      env: {
        VK_API_URL: config.apiUrl,
        HOME: "/tmp/test-home-task-attempts-update-no-id",
        PATH: "/tmp/vk-no-bin",
      },
    });

    const output = await command.output();
    const stderrText = new TextDecoder().decode(output.stderr);
    assertEquals(output.code, 1);
    assertEquals(stderrText.includes("Error:"), true);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("CLI: vk task-attempts delete <id> shows API error when id does not exist", async () => {
  const endpointCheck = await apiCall<unknown[]>("/task-attempts");
  if (endpointCheck.status === 401) {
    return;
  }

  const command = new Deno.Command("deno", {
    args: [
      "run",
      "--allow-net",
      "--allow-read",
      "--allow-write",
      "--allow-env",
      "src/main.ts",
      "task-attempts",
      "delete",
      "00000000-0000-0000-0000-000000000000",
    ],
    stdout: "piped",
    stderr: "piped",
    env: {
      VK_API_URL: config.apiUrl,
      HOME: "/tmp/test-home-task-attempts-delete-missing",
    },
  });

  const { code, stderr } = await command.output();
  const stderrText = new TextDecoder().decode(stderr);
  assertEquals(code, 1);
  assertEquals(stderrText.includes("Error:"), true);
});

Deno.test("CLI: vk task-attempts delete without id reports resolver error path", async () => {
  const endpointCheck = await apiCall<unknown[]>("/task-attempts");
  if (endpointCheck.status === 401) {
    return;
  }

  const tempDir = await Deno.makeTempDir({
    prefix: "vk-task-attempts-delete-no-id-",
  });

  try {
    const command = new Deno.Command(Deno.execPath(), {
      args: [
        "run",
        "--allow-net",
        "--allow-read",
        "--allow-write",
        "--allow-env",
        "--allow-run",
        `${Deno.cwd()}/src/main.ts`,
        "task-attempts",
        "delete",
      ],
      cwd: tempDir,
      stdout: "piped",
      stderr: "piped",
      env: {
        VK_API_URL: config.apiUrl,
        HOME: "/tmp/test-home-task-attempts-delete-no-id",
        PATH: "/tmp/vk-no-bin",
      },
    });

    const { code, stderr } = await command.output();
    const stderrText = new TextDecoder().decode(stderr);
    assertEquals(code, 1);
    assertEquals(stderrText.includes("Error:"), true);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("CLI: vk task-attempts repos <id> --json", async () => {
  const listResult = await apiCall<Array<{ id: string }>>("/task-attempts");
  if (
    listResult.status === 401 || !listResult.success || !listResult.data ||
    listResult.data.length === 0
  ) {
    return;
  }

  const firstId = listResult.data[0].id;
  const endpointResult = await apiCall<unknown[]>(`/task-attempts/${firstId}/repos`);
  if (!endpointResult.success) {
    return;
  }

  const command = new Deno.Command("deno", {
    args: [
      "run",
      "--allow-net",
      "--allow-read",
      "--allow-write",
      "--allow-env",
      "src/main.ts",
      "task-attempts",
      "repos",
      firstId,
      "--json",
    ],
    stdout: "piped",
    stderr: "piped",
    env: {
      VK_API_URL: config.apiUrl,
      HOME: "/tmp/test-home-task-attempts-repos-json",
    },
  });

  const { code, stdout, stderr } = await command.output();
  const stderrText = new TextDecoder().decode(stderr);
  assertEquals(
    code,
    0,
    `Expected exit code 0 for task-attempts repos --json. stderr: ${stderrText}`,
  );

  const parsed = JSON.parse(new TextDecoder().decode(stdout));
  assertEquals(Array.isArray(parsed), true);
});

Deno.test("CLI: vk task-attempts repos <id> default output", async () => {
  const listResult = await apiCall<Array<{ id: string }>>("/task-attempts");
  if (
    listResult.status === 401 || !listResult.success || !listResult.data ||
    listResult.data.length === 0
  ) {
    return;
  }

  const firstId = listResult.data[0].id;
  const endpointResult = await apiCall<unknown[]>(`/task-attempts/${firstId}/repos`);
  if (!endpointResult.success) {
    return;
  }

  const command = new Deno.Command("deno", {
    args: [
      "run",
      "--allow-net",
      "--allow-read",
      "--allow-write",
      "--allow-env",
      "src/main.ts",
      "task-attempts",
      "repos",
      firstId,
    ],
    stdout: "piped",
    stderr: "piped",
    env: {
      VK_API_URL: config.apiUrl,
      HOME: "/tmp/test-home-task-attempts-repos-default",
    },
  });

  const { code, stdout, stderr } = await command.output();
  const stderrText = new TextDecoder().decode(stderr);
  assertEquals(
    code,
    0,
    `Expected exit code 0 for task-attempts repos default. stderr: ${stderrText}`,
  );

  const stdoutText = new TextDecoder().decode(stdout);
  assertEquals(
    stdoutText.includes("Repo ID") ||
      stdoutText.includes("No repositories found for task attempt."),
    true,
  );
});

Deno.test("CLI: vk task-attempts repos without id reports resolver error path", async () => {
  const endpointCheck = await apiCall<unknown[]>("/task-attempts");
  if (endpointCheck.status === 401) {
    return;
  }

  const tempDir = await Deno.makeTempDir({
    prefix: "vk-task-attempts-repos-no-id-",
  });

  try {
    const command = new Deno.Command(Deno.execPath(), {
      args: [
        "run",
        "--allow-net",
        "--allow-read",
        "--allow-write",
        "--allow-env",
        "--allow-run",
        `${Deno.cwd()}/src/main.ts`,
        "task-attempts",
        "repos",
      ],
      cwd: tempDir,
      stdout: "piped",
      stderr: "piped",
      env: {
        VK_API_URL: config.apiUrl,
        HOME: "/tmp/test-home-task-attempts-repos-no-id",
        PATH: "/tmp/vk-no-bin",
      },
    });

    const { code, stderr } = await command.output();
    const stderrText = new TextDecoder().decode(stderr);
    assertEquals(code, 1);
    assertEquals(stderrText.includes("Error:"), true);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("CLI: vk task-attempts branch-status <id> --json", async () => {
  const listResult = await apiCall<Array<{ id: string }>>("/task-attempts");
  if (
    listResult.status === 401 || !listResult.success || !listResult.data ||
    listResult.data.length === 0
  ) {
    return;
  }

  const firstId = listResult.data[0].id;
  const endpointResult = await apiCall<unknown[]>(
    `/task-attempts/${firstId}/branch-status`,
  );
  if (!endpointResult.success) {
    return;
  }

  const command = new Deno.Command("deno", {
    args: [
      "run",
      "--allow-net",
      "--allow-read",
      "--allow-write",
      "--allow-env",
      "src/main.ts",
      "task-attempts",
      "branch-status",
      firstId,
      "--json",
    ],
    stdout: "piped",
    stderr: "piped",
    env: {
      VK_API_URL: config.apiUrl,
      HOME: "/tmp/test-home-task-attempts-branch-status-json",
    },
  });

  const { code, stdout, stderr } = await command.output();
  const stderrText = new TextDecoder().decode(stderr);
  assertEquals(
    code,
    0,
    `Expected exit code 0 for task-attempts branch-status --json. stderr: ${stderrText}`,
  );

  const parsed = JSON.parse(new TextDecoder().decode(stdout));
  assertEquals(Array.isArray(parsed), true);
});

Deno.test("CLI: vk task-attempts branch-status <id> default output", async () => {
  const listResult = await apiCall<Array<{ id: string }>>("/task-attempts");
  if (
    listResult.status === 401 || !listResult.success || !listResult.data ||
    listResult.data.length === 0
  ) {
    return;
  }

  const firstId = listResult.data[0].id;
  const endpointResult = await apiCall<unknown[]>(
    `/task-attempts/${firstId}/branch-status`,
  );
  if (!endpointResult.success) {
    return;
  }

  const command = new Deno.Command("deno", {
    args: [
      "run",
      "--allow-net",
      "--allow-read",
      "--allow-write",
      "--allow-env",
      "src/main.ts",
      "task-attempts",
      "branch-status",
      firstId,
    ],
    stdout: "piped",
    stderr: "piped",
    env: {
      VK_API_URL: config.apiUrl,
      HOME: "/tmp/test-home-task-attempts-branch-status-default",
    },
  });

  const { code, stdout, stderr } = await command.output();
  const stderrText = new TextDecoder().decode(stderr);
  assertEquals(
    code,
    0,
    `Expected exit code 0 for task-attempts branch-status default. stderr: ${stderrText}`,
  );

  const stdoutText = new TextDecoder().decode(stdout);
  assertEquals(
    stdoutText.includes("Repository") ||
      stdoutText.includes("No branch status found."),
    true,
  );
});

Deno.test("CLI: vk task-attempts branch-status without id reports resolver error path", async () => {
  const endpointCheck = await apiCall<unknown[]>("/task-attempts");
  if (endpointCheck.status === 401) {
    return;
  }

  const tempDir = await Deno.makeTempDir({
    prefix: "vk-task-attempts-branch-status-no-id-",
  });

  try {
    const command = new Deno.Command(Deno.execPath(), {
      args: [
        "run",
        "--allow-net",
        "--allow-read",
        "--allow-write",
        "--allow-env",
        "--allow-run",
        `${Deno.cwd()}/src/main.ts`,
        "task-attempts",
        "branch-status",
      ],
      cwd: tempDir,
      stdout: "piped",
      stderr: "piped",
      env: {
        VK_API_URL: config.apiUrl,
        HOME: "/tmp/test-home-task-attempts-branch-status-no-id",
        PATH: "/tmp/vk-no-bin",
      },
    });

    const { code, stderr } = await command.output();
    const stderrText = new TextDecoder().decode(stderr);
    assertEquals(code, 1);
    assertEquals(stderrText.includes("Error:"), true);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});
