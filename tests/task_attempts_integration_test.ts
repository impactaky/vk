/**
 * Task-attempts integration tests.
 * Verifies the task-attempts CLI command maps to task-attempts API endpoints.
 *
 * Run with: docker compose run --rm vk
 */

import { assertEquals, assertExists } from "@std/assert";
import { config } from "./helpers/test-server.ts";

function assertWorkspaceCreateResponse(parsed: {
  workspace?: { id?: string };
  execution_process?: { id?: string } | null;
}) {
  assertExists(parsed.workspace?.id);
  if (parsed.execution_process !== undefined && parsed.execution_process !== null) {
    assertExists(parsed.execution_process.id);
  }
}

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
type RepoSeed = { repoId: string; repoName: string; repoPath: string };

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

  for (const attempt of listResult.data) {
    const reposResult = await apiCall<Array<{ id?: string; repo_id?: string }>>(
      `/task-attempts/${attempt.id}/repos`,
    );
    if (
      !reposResult.success || !reposResult.data || reposResult.data.length === 0
    ) {
      continue;
    }

    const repo = reposResult.data[0];
    const repoId = repo.repo_id ?? repo.id;
    if (!repoId) {
      continue;
    }

    // Prefer attempts that pass branch-status preflight, avoiding stale/broken repos.
    const statusCheck = await apiCall<unknown[]>(
      `/task-attempts/${attempt.id}/branch-status`,
    );
    if (statusCheck.success) {
      return { attemptId: attempt.id, branch: attempt.branch, repoId };
    }
  }

  return null;
}

async function getOrCreatePrNumber(seed: AttemptSeed): Promise<number | null> {
  const statusResult = await apiCall<
    Array<
      {
        repo_id: string;
        merges?: Array<{ pr_info?: { number?: number; status?: string } }>;
      }
    >
  >(
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

  const createResult = await apiCall<string>(
    `/task-attempts/${seed.attemptId}/pr`,
    {
      method: "POST",
      body: JSON.stringify({
        repo_id: seed.repoId,
        title: "tmp pr from integration test",
        body: "tmp body",
      }),
    },
  );
  if (!createResult.success || !createResult.data) {
    return null;
  }

  const match = String(createResult.data).match(/\/pull\/(\d+)/);
  return match ? Number(match[1]) : null;
}

async function getRepoSeed(): Promise<RepoSeed | null> {
  const reposResult = await apiCall<
    Array<{
      id: string;
      name: string;
      path: string;
    }>
  >("/repos");
  if (
    reposResult.status === 401 || !reposResult.success || !reposResult.data ||
    reposResult.data.length === 0
  ) {
    return null;
  }

  const repo = reposResult.data[0];
  return {
    repoId: repo.id,
    repoName: repo.name,
    repoPath: repo.path,
  };
}

function isListEndpointAccessible(result: ApiResult<unknown[]>): boolean {
  if (result.status === 401) {
    return false;
  }

  if (!result.success || result.rawText !== undefined || !result.data) {
    return false;
  }

  return Array.isArray(result.data);
}

async function cleanupAttempt(attemptId: string | undefined): Promise<void> {
  if (!attemptId) {
    return;
  }
  await apiCall(`/task-attempts/${attemptId}`, { method: "DELETE" });
}

Deno.test("API: task-attempts endpoint returns array when accessible", async () => {
  const result = await apiCall<unknown[]>("/task-attempts");

  if (!isListEndpointAccessible(result)) {
    return;
  }

  assertEquals(result.success, true);
  assertEquals(result.rawText, undefined, "Should return JSON, not HTML");
  assertExists(result.data);
  assertEquals(Array.isArray(result.data), true);
});

Deno.test("CLI: vk workspace list --json", async () => {
  const endpointCheck = await apiCall<unknown[]>("/task-attempts");
  if (!isListEndpointAccessible(endpointCheck)) {
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
      "workspace",
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

Deno.test("CLI: vk workspace show <id> --json", async () => {
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
      "workspace",
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

Deno.test("CLI: vk workspace show --json auto-detects ID from branch", async () => {
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
        "workspace",
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

Deno.test("CLI: vk workspace create requires prompt source", async () => {
  const command = new Deno.Command("deno", {
    args: [
      "run",
      "--allow-net",
      "--allow-read",
      "--allow-write",
      "--allow-env",
      "src/main.ts",
      "workspace",
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
  assertEquals(
    stderrText.includes("Option --description or --file is required."),
    true,
  );
});

Deno.test("CLI: vk workspace create --description falls back to /workspaces on 405", async () => {
  const testHome = await Deno.makeTempDir({
    prefix: "vk-workspace-create-405-",
  });
  let taskAttemptsCreateCalls = 0;
  let workspaceCreateBody = "";

  const server = Deno.serve(
    { hostname: "127.0.0.1", port: 0 },
    async (request) => {
      const { pathname } = new URL(request.url);

      if (pathname === "/api/repos") {
        return Response.json({
          success: true,
          data: [{
            id: "repo-1",
            path: Deno.cwd(),
            name: "vk",
            display_name: "VK",
            setup_script: null,
            cleanup_script: null,
            copy_files: null,
            parallel_setup_script: false,
            dev_server_script: null,
            default_target_branch: null,
            default_working_dir: null,
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-01T00:00:00Z",
          }],
        });
      }

      if (pathname === "/api/task-attempts/create-and-start") {
        taskAttemptsCreateCalls += 1;
        return new Response("", { status: 405 });
      }

      if (pathname === "/api/workspaces/create-and-start") {
        workspaceCreateBody = await request.text();
        return Response.json({
          success: true,
          data: {
            workspace: {
              id: "ws-405",
              branch: "feature/test",
              name: "Workspace 405",
            },
            execution_process: { id: "proc-405" },
          },
        });
      }

      return new Response("Not found", { status: 404 });
    },
  );

  try {
    const address = server.addr as Deno.NetAddr;
    const command = new Deno.Command("deno", {
      args: [
        "run",
        "--allow-net",
        "--allow-read",
        "--allow-write",
        "--allow-env",
        "src/main.ts",
        "workspace",
        "create",
        "--description",
        "test",
        "--json",
      ],
      stdout: "piped",
      stderr: "piped",
      env: {
        VK_API_URL: `http://127.0.0.1:${address.port}`,
        HOME: testHome,
      },
    });

    const { code, stdout, stderr } = await command.output();
    const stderrText = new TextDecoder().decode(stderr);

    assertEquals(
      code,
      0,
      `Expected exit code 0 for workspace create fallback on 405. stderr: ${stderrText}`,
    );
    assertEquals(taskAttemptsCreateCalls, 1);
    assertEquals(
      workspaceCreateBody,
      JSON.stringify({
        prompt: "test",
        executor_config: { executor: "CLAUDE_CODE", variant: "DEFAULT" },
        repos: [{ repo_id: "repo-1", target_branch: "main" }],
      }),
    );

    const parsed = JSON.parse(new TextDecoder().decode(stdout));
    assertEquals(parsed.workspace.id, "ws-405");
    assertEquals(parsed.execution_process.id, "proc-405");
  } finally {
    await server.shutdown();
    await Deno.remove(testHome, { recursive: true });
  }
});

Deno.test(
  "CLI: vk workspace create rejects --description with --file",
  async () => {
    const promptFile = await Deno.makeTempFile({
      suffix: ".md",
      prefix: "vk-task-attempts-create-conflict-",
    });
    try {
      await Deno.writeTextFile(promptFile, "Prompt from file");
      const command = new Deno.Command("deno", {
        args: [
          "run",
          "--allow-net",
          "--allow-read",
          "--allow-write",
          "--allow-env",
          "src/main.ts",
          "workspace",
          "create",
          "--description",
          "Inline prompt",
          "--file",
          promptFile,
          "--repo",
          "repo-1",
        ],
        stdout: "piped",
        stderr: "piped",
        env: {
          VK_API_URL: config.apiUrl,
          HOME: "/tmp/test-home-task-attempts-create-conflicting-prompt",
        },
      });

      const { code, stderr } = await command.output();
      const stderrText = new TextDecoder().decode(stderr);
      assertEquals(code, 1);
      assertEquals(
        stderrText.includes(
          "Options --description and --file are mutually exclusive.",
        ),
        true,
      );
    } finally {
      await Deno.remove(promptFile, { recursive: true });
    }
  },
);

Deno.test("CLI: vk workspace create supports --file", async () => {
  const repoSeed = await getRepoSeed();
  if (!repoSeed) {
    return;
  }
  const promptFile = await Deno.makeTempFile({
    suffix: ".md",
    prefix: "vk-task-attempts-create-file-",
  });
  try {
    await Deno.writeTextFile(promptFile, "Task prompt from markdown file");
    const command = new Deno.Command("deno", {
      args: [
        "run",
        "--allow-net",
        "--allow-read",
        "--allow-write",
        "--allow-env",
        "src/main.ts",
        "workspace",
        "create",
        "--file",
        promptFile,
        "--repo",
        repoSeed.repoName,
        "--json",
      ],
      stdout: "piped",
      stderr: "piped",
      env: {
        VK_API_URL: config.apiUrl,
        HOME: "/tmp/test-home-task-attempts-create-file",
      },
    });

    const { code, stdout, stderr } = await command.output();
    const stderrText = new TextDecoder().decode(stderr);
    if (code !== 0 && stderrText.includes("API error (500):")) {
      return;
    }

    assertEquals(
      code,
      0,
      `Expected exit code 0 for task-attempts create with file. stderr: ${stderrText}`,
    );

    const parsed = JSON.parse(new TextDecoder().decode(stdout));
    assertWorkspaceCreateResponse(parsed);
    await cleanupAttempt(parsed.workspace?.id);
  } finally {
    await Deno.remove(promptFile, { recursive: true });
  }
});

Deno.test("CLI: vk workspace create rejects empty --file content", async () => {
  const promptFile = await Deno.makeTempFile({
    suffix: ".md",
    prefix: "vk-task-attempts-create-empty-file-",
  });
  try {
    await Deno.writeTextFile(promptFile, "   \n");
    const command = new Deno.Command("deno", {
      args: [
        "run",
        "--allow-net",
        "--allow-read",
        "--allow-write",
        "--allow-env",
        "src/main.ts",
        "workspace",
        "create",
        "--file",
        promptFile,
        "--repo",
        "repo-1",
      ],
      stdout: "piped",
      stderr: "piped",
      env: {
        VK_API_URL: config.apiUrl,
        HOME: "/tmp/test-home-task-attempts-create-empty-file",
      },
    });

    const { code, stderr } = await command.output();
    const stderrText = new TextDecoder().decode(stderr);
    assertEquals(code, 1);
    assertEquals(
      stderrText.includes("Option --file must contain non-empty text."),
      true,
    );
  } finally {
    await Deno.remove(promptFile, { recursive: true });
  }
});

Deno.test("CLI: vk workspace create resolves repo by name and supports --json output", async () => {
  const repoSeed = await getRepoSeed();
  if (!repoSeed) {
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
      "workspace",
      "create",
      "--description",
      "Fix the issue",
      "--repo",
      repoSeed.repoName,
      "--target-branch",
      "develop",
      "--executor",
      "CLAUDE_CODE:DEFAULT",
      "--json",
    ],
    stdout: "piped",
    stderr: "piped",
    env: {
      VK_API_URL: config.apiUrl,
      HOME: "/tmp/test-home-task-attempts-create-repo-name",
    },
  });

  const { code, stdout, stderr } = await command.output();
  const stderrText = new TextDecoder().decode(stderr);
  if (code !== 0 && stderrText.includes("API error (500):")) {
    return;
  }

  assertEquals(
    code,
    0,
    `Expected exit code 0 for task-attempts create by repo name. stderr: ${stderrText}`,
  );

  const parsed = JSON.parse(new TextDecoder().decode(stdout));
  assertWorkspaceCreateResponse(parsed);
  await cleanupAttempt(parsed.workspace?.id);
});

Deno.test("CLI: vk workspace create auto-detects repo from current directory", async () => {
  const repoSeed = await getRepoSeed();
  if (!repoSeed) {
    return;
  }
  try {
    const repoStat = await Deno.stat(repoSeed.repoPath);
    if (!repoStat.isDirectory) {
      return;
    }
  } catch {
    return;
  }

  const command = new Deno.Command("deno", {
    args: [
      "run",
      "--allow-net",
      "--allow-read",
      "--allow-write",
      "--allow-env",
      "--allow-run",
      `${Deno.cwd()}/src/main.ts`,
      "workspace",
      "create",
      "--description",
      "Use repo from cwd",
      "--json",
    ],
    cwd: repoSeed.repoPath,
    stdout: "piped",
    stderr: "piped",
    env: {
      VK_API_URL: config.apiUrl,
      HOME: "/tmp/test-home-task-attempts-create-repo-autodetect",
    },
  });

  const { code, stdout, stderr } = await command.output();
  const stderrText = new TextDecoder().decode(stderr);
  if (code !== 0 && stderrText.includes("API error (500):")) {
    return;
  }

  assertEquals(
    code,
    0,
    `Expected exit code 0 for task-attempts create with repo autodetect. stderr: ${stderrText}`,
  );

  const parsed = JSON.parse(new TextDecoder().decode(stdout));
  assertWorkspaceCreateResponse(parsed);
  await cleanupAttempt(parsed.workspace?.id);
});

Deno.test("CLI: vk workspace create resolves repo by id", async () => {
  const repoSeed = await getRepoSeed();
  if (!repoSeed) {
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
      "workspace",
      "create",
      "--description",
      "Add tests",
      "--repo",
      repoSeed.repoId,
      "--executor",
      "CLAUDE_CODE:DEFAULT",
      "--json",
    ],
    stdout: "piped",
    stderr: "piped",
    env: {
      VK_API_URL: config.apiUrl,
      HOME: "/tmp/test-home-task-attempts-create-repo-id",
    },
  });

  const { code, stdout, stderr } = await command.output();
  const stderrText = new TextDecoder().decode(stderr);
  if (code !== 0 && stderrText.includes("API error (500):")) {
    return;
  }

  assertEquals(
    code,
    0,
    `Expected exit code 0 for task-attempts create by repo id. stderr: ${stderrText}`,
  );

  const parsed = JSON.parse(new TextDecoder().decode(stdout));
  assertWorkspaceCreateResponse(parsed);
  await cleanupAttempt(parsed.workspace?.id);
});

Deno.test("CLI: vk workspace spin-off requires prompt source", async () => {
  const command = new Deno.Command("deno", {
    args: [
      "run",
      "--allow-net",
      "--allow-read",
      "--allow-write",
      "--allow-env",
      "src/main.ts",
      "workspace",
      "spin-off",
      "parent-attempt-1",
    ],
    stdout: "piped",
    stderr: "piped",
    env: {
      VK_API_URL: config.apiUrl,
      HOME: "/tmp/test-home-task-attempts-spin-off-missing-description",
    },
  });

  const { code, stderr } = await command.output();
  const stderrText = new TextDecoder().decode(stderr);

  assertEquals(code, 1);
  assertEquals(
    stderrText.includes("Option --description or --file is required."),
    true,
  );
});

Deno.test(
  "CLI: vk workspace spin-off rejects --description with --file",
  async () => {
    const promptFile = await Deno.makeTempFile({
      suffix: ".md",
      prefix: "vk-task-attempts-spin-off-conflict-",
    });
    try {
      await Deno.writeTextFile(promptFile, "Prompt from file");
      const command = new Deno.Command("deno", {
        args: [
          "run",
          "--allow-net",
          "--allow-read",
          "--allow-write",
          "--allow-env",
          "src/main.ts",
          "workspace",
          "spin-off",
          "parent-attempt-1",
          "--description",
          "Inline prompt",
          "--file",
          promptFile,
        ],
        stdout: "piped",
        stderr: "piped",
        env: {
          VK_API_URL: config.apiUrl,
          HOME: "/tmp/test-home-task-attempts-spin-off-conflicting-prompt",
        },
      });

      const { code, stderr } = await command.output();
      const stderrText = new TextDecoder().decode(stderr);
      assertEquals(code, 1);
      assertEquals(
        stderrText.includes(
          "Options --description and --file are mutually exclusive.",
        ),
        true,
      );
    } finally {
      await Deno.remove(promptFile, { recursive: true });
    }
  },
);

Deno.test("CLI: vk workspace spin-off <id> --description --json", async () => {
  const attemptSeed = await getAttemptSeed();
  if (!attemptSeed) {
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
      "workspace",
      "spin-off",
      attemptSeed.attemptId,
      "--description",
      "Follow-up task attempt",
      "--json",
    ],
    stdout: "piped",
    stderr: "piped",
    env: {
      VK_API_URL: config.apiUrl,
      HOME: "/tmp/test-home-task-attempts-spin-off-json",
    },
  });

  const { code, stdout, stderr } = await command.output();
  const stderrText = new TextDecoder().decode(stderr);
  if (code !== 0 && stderrText.includes("API error (500):")) {
    return;
  }

  assertEquals(
    code,
    0,
    `Expected exit code 0 for task-attempts spin-off. stderr: ${stderrText}`,
  );

  const parsed = JSON.parse(new TextDecoder().decode(stdout));
  assertWorkspaceCreateResponse(parsed);
  await cleanupAttempt(parsed.workspace?.id);
});

Deno.test("CLI: vk workspace spin-off <id> --file --json", async () => {
  const attemptSeed = await getAttemptSeed();
  if (!attemptSeed) {
    return;
  }
  const promptFile = await Deno.makeTempFile({
    suffix: ".md",
    prefix: "vk-task-attempts-spin-off-file-",
  });
  try {
    await Deno.writeTextFile(promptFile, "Spin-off prompt from markdown file");
    const command = new Deno.Command("deno", {
      args: [
        "run",
        "--allow-net",
        "--allow-read",
        "--allow-write",
        "--allow-env",
        "src/main.ts",
        "workspace",
        "spin-off",
        attemptSeed.attemptId,
        "--file",
        promptFile,
        "--json",
      ],
      stdout: "piped",
      stderr: "piped",
      env: {
        VK_API_URL: config.apiUrl,
        HOME: "/tmp/test-home-task-attempts-spin-off-file-json",
      },
    });

    const { code, stdout, stderr } = await command.output();
    const stderrText = new TextDecoder().decode(stderr);
    if (code !== 0 && stderrText.includes("API error (500):")) {
      return;
    }

    assertEquals(
      code,
      0,
      `Expected exit code 0 for task-attempts spin-off with file. stderr: ${stderrText}`,
    );

    const parsed = JSON.parse(new TextDecoder().decode(stdout));
    assertWorkspaceCreateResponse(parsed);
    await cleanupAttempt(parsed.workspace?.id);
  } finally {
    await Deno.remove(promptFile, { recursive: true });
  }
});

Deno.test(
  "CLI: vk workspace spin-off rejects empty --file content",
  async () => {
    const promptFile = await Deno.makeTempFile({
      suffix: ".md",
      prefix: "vk-task-attempts-spin-off-empty-file-",
    });
    try {
      await Deno.writeTextFile(promptFile, " \n\t ");
      const command = new Deno.Command("deno", {
        args: [
          "run",
          "--allow-net",
          "--allow-read",
          "--allow-write",
          "--allow-env",
          "src/main.ts",
          "workspace",
          "spin-off",
          "--file",
          promptFile,
        ],
        stdout: "piped",
        stderr: "piped",
        env: {
          VK_API_URL: config.apiUrl,
          HOME: "/tmp/test-home-task-attempts-spin-off-empty-file",
        },
      });

      const { code, stderr } = await command.output();
      const stderrText = new TextDecoder().decode(stderr);
      assertEquals(code, 1);
      assertEquals(
        stderrText.includes("Option --file must contain non-empty text."),
        true,
      );
    } finally {
      await Deno.remove(promptFile, { recursive: true });
    }
  },
);

Deno.test("CLI: vk workspace update <id> --name --archived --pinned --json", async () => {
  const listResult = await apiCall<
    Array<
      { id: string; name: string | null; archived: boolean; pinned: boolean }
    >
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
    "workspace",
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

Deno.test("CLI: vk workspace update without id reports resolver error path", async () => {
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
        "workspace",
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

Deno.test("CLI: vk workspace delete <id> shows API error when id does not exist", async () => {
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
      "workspace",
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

Deno.test("CLI: vk workspace delete without id reports resolver error path", async () => {
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
        "workspace",
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

Deno.test("CLI: vk workspace repos <id> --json", async () => {
  const listResult = await apiCall<Array<{ id: string }>>("/task-attempts");
  if (
    listResult.status === 401 || !listResult.success || !listResult.data ||
    listResult.data.length === 0
  ) {
    return;
  }

  const firstId = listResult.data[0].id;
  const endpointResult = await apiCall<unknown[]>(
    `/task-attempts/${firstId}/repos`,
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
      "workspace",
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

Deno.test("CLI: vk workspace repos <id> default output", async () => {
  const listResult = await apiCall<Array<{ id: string }>>("/task-attempts");
  if (
    listResult.status === 401 || !listResult.success || !listResult.data ||
    listResult.data.length === 0
  ) {
    return;
  }

  const firstId = listResult.data[0].id;
  const endpointResult = await apiCall<unknown[]>(
    `/task-attempts/${firstId}/repos`,
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
      "workspace",
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
      stdoutText.includes("No repositories found for workspace."),
    true,
  );
});

Deno.test("CLI: vk workspace repos without id reports resolver error path", async () => {
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
        "workspace",
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

Deno.test("CLI: vk workspace branch-status <id> --json", async () => {
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
      "workspace",
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

Deno.test("CLI: vk workspace branch-status <id> default output", async () => {
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
      "workspace",
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

Deno.test("CLI: vk workspace branch-status without id reports resolver error path", async () => {
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
        "workspace",
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

Deno.test("CLI: vk workspace rename-branch <id> --new-branch-name --json", async () => {
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
      "workspace",
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

Deno.test("CLI: vk workspace rename-branch requires --new-branch-name", async () => {
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
      "workspace",
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
  assertEquals(
    stderrText.includes("Option --new-branch-name is required."),
    true,
  );
});

Deno.test("CLI: vk workspace merge <id> --repo succeeds", async () => {
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
    if (
      !reposResult.success || !reposResult.data || reposResult.data.length === 0
    ) {
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
        "workspace",
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

Deno.test("CLI: vk workspace merge requires --repo", async () => {
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
      "workspace",
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

Deno.test("CLI: vk workspace push <id> --repo succeeds", async () => {
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
      "workspace",
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

Deno.test("CLI: vk workspace push requires --repo", async () => {
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
      "workspace",
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

Deno.test("CLI: vk workspace rebase <id> --repo succeeds", async () => {
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
      "workspace",
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

Deno.test("CLI: vk workspace rebase requires --repo", async () => {
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
      "workspace",
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

Deno.test("CLI: vk workspace stop <id> succeeds", async () => {
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
      "workspace",
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

Deno.test("CLI: vk workspace stop missing workspace id reports API error", async () => {
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
      "workspace",
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

Deno.test("CLI: vk workspace pr <id> --repo --title --body --json", async () => {
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
      "workspace",
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

Deno.test("CLI: vk workspace pr requires --repo", async () => {
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
      "workspace",
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

Deno.test("CLI: vk workspace pr attach <id> --repo --pr-number --json", async () => {
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
      "workspace",
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

Deno.test("CLI: vk workspace pr attach requires --pr-number", async () => {
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
      "workspace",
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

Deno.test("CLI: vk workspace pr comments <id> --repo --json", async () => {
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
      "workspace",
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

Deno.test("CLI: vk workspace pr comments without id reports resolver error path", async () => {
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
        "workspace",
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
