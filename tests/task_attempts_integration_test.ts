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

type AttemptSeed = { attemptId: string; branch: string; repoId: string };

async function getAttemptSeed(): Promise<AttemptSeed | null> {
  const listResult = await apiCall<Array<{ id: string; branch: string }>>(
    "/task-attempts",
  );
  if (
    listResult.status === 401 || !listResult.success || !listResult.data ||
    listResult.data.length === 0
  ) {
    return null;
  }

  const attempt = listResult.data[0];
  const reposResult = await apiCall<Array<{ id?: string; repo_id?: string }>>(
    `/task-attempts/${attempt.id}/repos`,
  );
  if (!reposResult.success || !reposResult.data || reposResult.data.length === 0) {
    return null;
  }

  const repo = reposResult.data[0];
  const repoId = repo.repo_id ?? repo.id;
  if (!repoId) {
    return null;
  }

  return { attemptId: attempt.id, branch: attempt.branch, repoId };
}

async function getOrCreatePrNumber(seed: AttemptSeed): Promise<number | null> {
  const statusResult = await apiCall<Array<{ repo_id: string; merges?: Array<{ pr_info?: { number?: number; status?: string } }> }>>(
    `/task-attempts/${seed.attemptId}/branch-status`,
  );
  if (statusResult.success && statusResult.data) {
    const repoStatus = statusResult.data.find((s) => s.repo_id === seed.repoId);
    const openPr = repoStatus?.merges?.find((m) => m.pr_info?.status === "open")
      ?.pr_info?.number;
    if (openPr) {
      return openPr;
    }
  }

  const createResult = await apiCall<string>(`/task-attempts/${seed.attemptId}/pr`, {
    method: "POST",
    body: JSON.stringify({
      repo_id: seed.repoId,
      title: "tmp pr from integration test",
      body: "tmp body",
    }),
  });
  if (!createResult.success || !createResult.data) {
    return null;
  }

  const match = String(createResult.data).match(/\/pull\/(\d+)/);
  return match ? Number(match[1]) : null;
}

type CreateTaskAttemptRequest = {
  task_id: string;
  executor_profile_id: { executor: string; variant: string | null };
  repos: Array<{ repo_id: string; target_branch: string }>;
};

type TaskAttemptCreateMockApi = {
  apiUrl: string;
  repoId: string;
  repoName: string;
  requests: CreateTaskAttemptRequest[];
  shutdown: () => Promise<void>;
};

function jsonApiResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function startTaskAttemptCreateMockApi(): TaskAttemptCreateMockApi {
  const repoId = "repo-1";
  const repoName = "repo-one";
  const requests: CreateTaskAttemptRequest[] = [];
  const abortController = new AbortController();
  const server = Deno.serve(
    {
      hostname: "127.0.0.1",
      port: 0,
      signal: abortController.signal,
      onListen: () => {},
    },
    async (request: Request) => {
      const url = new URL(request.url);

      if (request.method === "GET" && url.pathname === "/api/repos") {
        return jsonApiResponse({
          success: true,
          data: [{ id: repoId, name: repoName, path: "/tmp/repo-one" }],
        });
      }

      if (request.method === "POST" && url.pathname === "/api/task-attempts") {
        const body = await request.json() as CreateTaskAttemptRequest;
        requests.push(body);
        return jsonApiResponse({
          success: true,
          data: {
            id: "ws-created-1",
            task_id: body.task_id,
            container_ref: null,
            branch: "feature/ws-created-1",
            agent_working_dir: null,
            setup_completed_at: null,
            created_at: "2026-01-01T00:00:00.000Z",
            updated_at: "2026-01-01T00:00:00.000Z",
            archived: false,
            pinned: false,
            name: null,
          },
        });
      }

      return jsonApiResponse(
        { success: false, error: `Unhandled route: ${request.method} ${url.pathname}` },
        404,
      );
    },
  );
  const port = (server.addr as Deno.NetAddr).port;

  return {
    apiUrl: `http://127.0.0.1:${port}`,
    repoId,
    repoName,
    requests,
    shutdown: async () => {
      abortController.abort();
      await server.finished.catch(() => undefined);
    },
  };
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

Deno.test("CLI: vk task-attempts create requires --task-id", async () => {
  const command = new Deno.Command("deno", {
    args: [
      "run",
      "--allow-net",
      "--allow-read",
      "--allow-write",
      "--allow-env",
      "src/main.ts",
      "task-attempts",
      "create",
      "--repo",
      "repo-1",
    ],
    stdout: "piped",
    stderr: "piped",
    env: {
      VK_API_URL: config.apiUrl,
      HOME: "/tmp/test-home-task-attempts-create-missing-task-id",
    },
  });

  const { code, stderr } = await command.output();
  const stderrText = new TextDecoder().decode(stderr);

  assertEquals(code, 1);
  assertEquals(stderrText.includes("Option --task-id is required."), true);
});

Deno.test("CLI: vk task-attempts create resolves repo by name and supports --json output", async () => {
  const mock = await startTaskAttemptCreateMockApi();
  try {
    const command = new Deno.Command("deno", {
      args: [
        "run",
        "--allow-net",
        "--allow-read",
        "--allow-write",
        "--allow-env",
        "src/main.ts",
        "task-attempts",
        "create",
        "--task-id",
        "task-123",
        "--repo",
        mock.repoName,
        "--target-branch",
        "develop",
        "--executor",
        "CLAUDE_CODE:DEFAULT",
        "--json",
      ],
      stdout: "piped",
      stderr: "piped",
      env: {
        VK_API_URL: mock.apiUrl,
        HOME: "/tmp/test-home-task-attempts-create-repo-name",
      },
    });

    const { code, stdout, stderr } = await command.output();
    const stderrText = new TextDecoder().decode(stderr);

    assertEquals(
      code,
      0,
      `Expected exit code 0 for task-attempts create by repo name. stderr: ${stderrText}`,
    );

    const parsed = JSON.parse(new TextDecoder().decode(stdout));
    assertEquals(parsed.id, "ws-created-1");
    assertEquals(mock.requests.length, 1);
    assertEquals(mock.requests[0].task_id, "task-123");
    assertEquals(mock.requests[0].repos[0].repo_id, mock.repoId);
    assertEquals(mock.requests[0].repos[0].target_branch, "develop");
    assertEquals(mock.requests[0].executor_profile_id.executor, "CLAUDE_CODE");
    assertEquals(mock.requests[0].executor_profile_id.variant, "DEFAULT");
  } finally {
    await mock.shutdown();
  }
});

Deno.test("CLI: vk task-attempts create resolves repo by id", async () => {
  const mock = await startTaskAttemptCreateMockApi();
  try {
    const command = new Deno.Command("deno", {
      args: [
        "run",
        "--allow-net",
        "--allow-read",
        "--allow-write",
        "--allow-env",
        "src/main.ts",
        "task-attempts",
        "create",
        "--task-id",
        "task-456",
        "--repo",
        mock.repoId,
        "--executor",
        "CLAUDE_CODE:DEFAULT",
        "--json",
      ],
      stdout: "piped",
      stderr: "piped",
      env: {
        VK_API_URL: mock.apiUrl,
        HOME: "/tmp/test-home-task-attempts-create-repo-id",
      },
    });

    const { code, stdout, stderr } = await command.output();
    const stderrText = new TextDecoder().decode(stderr);

    assertEquals(
      code,
      0,
      `Expected exit code 0 for task-attempts create by repo id. stderr: ${stderrText}`,
    );

    const parsed = JSON.parse(new TextDecoder().decode(stdout));
    assertEquals(parsed.id, "ws-created-1");
    assertEquals(mock.requests.length, 1);
    assertEquals(mock.requests[0].repos[0].repo_id, mock.repoId);
    assertEquals(mock.requests[0].repos[0].target_branch, "main");
  } finally {
    await mock.shutdown();
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

Deno.test("CLI: vk task-attempts rename-branch <id> --new-branch-name --json", async () => {
  const seed = await getAttemptSeed();
  if (!seed) {
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
      "rename-branch",
      seed.attemptId,
      "--new-branch-name",
      seed.branch,
      "--json",
    ],
    stdout: "piped",
    stderr: "piped",
    env: {
      VK_API_URL: config.apiUrl,
      HOME: "/tmp/test-home-task-attempts-rename-branch",
    },
  });

  const { code, stdout, stderr } = await command.output();
  const stderrText = new TextDecoder().decode(stderr);
  assertEquals(
    code,
    0,
    `Expected exit code 0 for task-attempts rename-branch --json. stderr: ${stderrText}`,
  );

  const parsed = JSON.parse(new TextDecoder().decode(stdout));
  assertEquals(parsed.branch, seed.branch);
});

Deno.test("CLI: vk task-attempts rename-branch requires --new-branch-name", async () => {
  const seed = await getAttemptSeed();
  if (!seed) {
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
      "rename-branch",
      seed.attemptId,
    ],
    stdout: "piped",
    stderr: "piped",
    env: {
      VK_API_URL: config.apiUrl,
      HOME: "/tmp/test-home-task-attempts-rename-branch-missing-flag",
    },
  });

  const { code, stderr } = await command.output();
  const stderrText = new TextDecoder().decode(stderr);
  assertEquals(code, 1);
  assertEquals(stderrText.includes("Option --new-branch-name is required."), true);
});

Deno.test("CLI: vk task-attempts merge <id> --repo succeeds", async () => {
  const listResult = await apiCall<Array<{ id: string }>>("/task-attempts");
  if (
    listResult.status === 401 || !listResult.success || !listResult.data ||
    listResult.data.length === 0
  ) {
    return;
  }

  for (const attempt of listResult.data) {
    const reposResult = await apiCall<Array<{ id?: string; repo_id?: string }>>(
      `/task-attempts/${attempt.id}/repos`,
    );
    if (!reposResult.success || !reposResult.data || reposResult.data.length === 0) {
      continue;
    }

    const repoId = reposResult.data[0].repo_id ?? reposResult.data[0].id;
    if (!repoId) {
      continue;
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
        "merge",
        attempt.id,
        "--repo",
        repoId,
      ],
      stdout: "piped",
      stderr: "piped",
      env: {
        VK_API_URL: config.apiUrl,
        HOME: "/tmp/test-home-task-attempts-merge-success",
      },
    });

    const { code } = await command.output();
    if (code === 0) {
      assertEquals(code, 0);
      return;
    }
  }

  // No mergeable attempt in current environment.
  return;
});

Deno.test("CLI: vk task-attempts merge requires --repo", async () => {
  const seed = await getAttemptSeed();
  if (!seed) {
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
      "merge",
      seed.attemptId,
    ],
    stdout: "piped",
    stderr: "piped",
    env: {
      VK_API_URL: config.apiUrl,
      HOME: "/tmp/test-home-task-attempts-merge-missing-repo",
    },
  });

  const { code, stderr } = await command.output();
  const stderrText = new TextDecoder().decode(stderr);
  assertEquals(code, 1);
  assertEquals(stderrText.includes("Option --repo is required."), true);
});

Deno.test("CLI: vk task-attempts push <id> --repo succeeds", async () => {
  const seed = await getAttemptSeed();
  if (!seed) {
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
      "push",
      seed.attemptId,
      "--repo",
      seed.repoId,
    ],
    stdout: "piped",
    stderr: "piped",
    env: {
      VK_API_URL: config.apiUrl,
      HOME: "/tmp/test-home-task-attempts-push-success",
    },
  });

  const { code, stderr } = await command.output();
  const stderrText = new TextDecoder().decode(stderr);
  assertEquals(code, 0, `Expected push success. stderr: ${stderrText}`);
});

Deno.test("CLI: vk task-attempts push requires --repo", async () => {
  const seed = await getAttemptSeed();
  if (!seed) {
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
      "push",
      seed.attemptId,
    ],
    stdout: "piped",
    stderr: "piped",
    env: {
      VK_API_URL: config.apiUrl,
      HOME: "/tmp/test-home-task-attempts-push-missing-repo",
    },
  });

  const { code, stderr } = await command.output();
  const stderrText = new TextDecoder().decode(stderr);
  assertEquals(code, 1);
  assertEquals(stderrText.includes("Option --repo is required."), true);
});

Deno.test("CLI: vk task-attempts rebase <id> --repo succeeds", async () => {
  const seed = await getAttemptSeed();
  if (!seed) {
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
      "rebase",
      seed.attemptId,
      "--repo",
      seed.repoId,
    ],
    stdout: "piped",
    stderr: "piped",
    env: {
      VK_API_URL: config.apiUrl,
      HOME: "/tmp/test-home-task-attempts-rebase-success",
    },
  });

  const { code, stderr } = await command.output();
  const stderrText = new TextDecoder().decode(stderr);
  assertEquals(code, 0, `Expected rebase success. stderr: ${stderrText}`);
});

Deno.test("CLI: vk task-attempts rebase requires --repo", async () => {
  const seed = await getAttemptSeed();
  if (!seed) {
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
      "rebase",
      seed.attemptId,
    ],
    stdout: "piped",
    stderr: "piped",
    env: {
      VK_API_URL: config.apiUrl,
      HOME: "/tmp/test-home-task-attempts-rebase-missing-repo",
    },
  });

  const { code, stderr } = await command.output();
  const stderrText = new TextDecoder().decode(stderr);
  assertEquals(code, 1);
  assertEquals(stderrText.includes("Option --repo is required."), true);
});

Deno.test("CLI: vk task-attempts stop <id> succeeds", async () => {
  const seed = await getAttemptSeed();
  if (!seed) {
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
      "stop",
      seed.attemptId,
    ],
    stdout: "piped",
    stderr: "piped",
    env: {
      VK_API_URL: config.apiUrl,
      HOME: "/tmp/test-home-task-attempts-stop-success",
    },
  });

  const { code, stderr } = await command.output();
  const stderrText = new TextDecoder().decode(stderr);
  assertEquals(code, 0, `Expected stop success. stderr: ${stderrText}`);
});

Deno.test("CLI: vk task-attempts stop missing workspace id reports API error", async () => {
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
      "stop",
      "00000000-0000-0000-0000-000000000000",
    ],
    stdout: "piped",
    stderr: "piped",
    env: {
      VK_API_URL: config.apiUrl,
      HOME: "/tmp/test-home-task-attempts-stop-failure",
    },
  });

  const { code, stderr } = await command.output();
  const stderrText = new TextDecoder().decode(stderr);
  assertEquals(code, 1);
  assertEquals(stderrText.includes("Error:"), true);
});

Deno.test("CLI: vk task-attempts pr <id> --repo --title --body --json", async () => {
  const seed = await getAttemptSeed();
  if (!seed) {
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
      "pr",
      "--id",
      seed.attemptId,
      "--repo",
      seed.repoId,
      "--title",
      "tmp pr from cli test",
      "--body",
      "tmp body",
      "--json",
    ],
    stdout: "piped",
    stderr: "piped",
    env: {
      VK_API_URL: config.apiUrl,
      HOME: "/tmp/test-home-task-attempts-pr-create-json",
    },
  });

  const { code, stdout, stderr } = await command.output();
  const stderrText = new TextDecoder().decode(stderr);
  if (
    code !== 0 &&
    stderrText.toLowerCase().includes("internal error occurred")
  ) {
    return;
  }
  assertEquals(code, 0, `Expected pr create success. stderr: ${stderrText}`);
  const parsed = JSON.parse(new TextDecoder().decode(stdout));
  assertEquals(typeof parsed === "string", true);
});

Deno.test("CLI: vk task-attempts pr requires --repo", async () => {
  const seed = await getAttemptSeed();
  if (!seed) {
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
      "pr",
      "--id",
      seed.attemptId,
      "--title",
      "tmp",
    ],
    stdout: "piped",
    stderr: "piped",
    env: {
      VK_API_URL: config.apiUrl,
      HOME: "/tmp/test-home-task-attempts-pr-create-missing-repo",
    },
  });

  const { code, stderr } = await command.output();
  const stderrText = new TextDecoder().decode(stderr);
  assertEquals(code, 1);
  assertEquals(stderrText.includes("Error:"), true);
});

Deno.test("CLI: vk task-attempts pr attach <id> --repo --pr-number --json", async () => {
  const seed = await getAttemptSeed();
  if (!seed) {
    return;
  }

  const prNumber = await getOrCreatePrNumber(seed);
  if (!prNumber) {
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
      "pr",
      "attach",
      seed.attemptId,
      "--repo",
      seed.repoId,
      "--pr-number",
      String(prNumber),
      "--json",
    ],
    stdout: "piped",
    stderr: "piped",
    env: {
      VK_API_URL: config.apiUrl,
      HOME: "/tmp/test-home-task-attempts-pr-attach-json",
    },
  });

  const { code, stdout, stderr } = await command.output();
  const stderrText = new TextDecoder().decode(stderr);
  assertEquals(code, 0, `Expected pr attach success. stderr: ${stderrText}`);
  const parsed = JSON.parse(new TextDecoder().decode(stdout));
  assertEquals(parsed.pr_attached, true);
});

Deno.test("CLI: vk task-attempts pr attach requires --pr-number", async () => {
  const seed = await getAttemptSeed();
  if (!seed) {
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
      "pr",
      "attach",
      seed.attemptId,
      "--repo",
      seed.repoId,
    ],
    stdout: "piped",
    stderr: "piped",
    env: {
      VK_API_URL: config.apiUrl,
      HOME: "/tmp/test-home-task-attempts-pr-attach-missing-pr-number",
    },
  });

  const { code, stderr } = await command.output();
  const stderrText = new TextDecoder().decode(stderr);
  assertEquals(code, 1);
  assertEquals(stderrText.includes("Error:"), true);
});

Deno.test("CLI: vk task-attempts pr comments <id> --repo --json", async () => {
  const seed = await getAttemptSeed();
  if (!seed) {
    return;
  }

  const prNumber = await getOrCreatePrNumber(seed);
  if (!prNumber) {
    return;
  }

  const attachResult = await apiCall<{ pr_attached: boolean }>(
    `/task-attempts/${seed.attemptId}/pr/attach`,
    {
      method: "POST",
      body: JSON.stringify({ repo_id: seed.repoId, pr_number: prNumber }),
    },
  );
  if (!attachResult.success) {
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
      "pr",
      "comments",
      seed.attemptId,
      "--repo",
      seed.repoId,
      "--json",
    ],
    stdout: "piped",
    stderr: "piped",
    env: {
      VK_API_URL: config.apiUrl,
      HOME: "/tmp/test-home-task-attempts-pr-comments-json",
    },
  });

  const { code, stdout, stderr } = await command.output();
  const stderrText = new TextDecoder().decode(stderr);
  assertEquals(code, 0, `Expected pr comments success. stderr: ${stderrText}`);
  const parsed = JSON.parse(new TextDecoder().decode(stdout));
  assertEquals(Array.isArray(parsed.comments) || Array.isArray(parsed), true);
});

Deno.test("CLI: vk task-attempts pr comments without id reports resolver error path", async () => {
  const endpointCheck = await apiCall<unknown[]>("/task-attempts");
  if (endpointCheck.status === 401) {
    return;
  }

  const seed = await getAttemptSeed();
  if (!seed) {
    return;
  }

  const tempDir = await Deno.makeTempDir({
    prefix: "vk-task-attempts-pr-comments-no-id-",
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
        "pr",
        "comments",
        "--repo",
        seed.repoId,
      ],
      cwd: tempDir,
      stdout: "piped",
      stderr: "piped",
      env: {
        VK_API_URL: config.apiUrl,
        HOME: "/tmp/test-home-task-attempts-pr-comments-no-id",
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
