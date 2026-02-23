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
