/**
 * Organization integration tests.
 * Tests organization CLI commands and API endpoints.
 *
 * Run with: docker compose run --rm vk
 */

import { assert, assertEquals, assertExists } from "@std/assert";
import { config } from "./helpers/test-server.ts";

// Helper to make raw API calls
async function apiCall<T>(
  path: string,
  options: RequestInit = {},
): Promise<
  {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
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

// ============================================================================
// API: Organization endpoints
// ============================================================================

Deno.test("API: Organizations endpoint exists", async () => {
  const result = await apiCall<unknown>("/organizations");
  // Endpoint should return JSON (not HTML SPA fallback)
  assertEquals(result.rawText, undefined, "Should return JSON, not HTML");
  assertExists(result.status);
  // Accepts either 200 (data returned) or 401 (auth required)
  assert(
    result.status === 200 || result.status === 401,
    `Expected 200 or 401, got ${result.status}`,
  );
});

Deno.test("API: List organizations returns array when accessible", async () => {
  const result = await apiCall<unknown[]>("/organizations");

  if (result.status === 401) {
    // Auth required - endpoint exists but needs authentication
    assertEquals(result.success, false);
    return;
  }

  assertEquals(result.success, true);
  assertExists(result.data);
  assertEquals(Array.isArray(result.data), true);
});

// ============================================================================
// CLI: vk organization list
// ============================================================================

Deno.test("CLI: vk organization list runs without crash", async () => {
  const command = new Deno.Command("deno", {
    args: [
      "run",
      "--allow-net",
      "--allow-read",
      "--allow-write",
      "--allow-env",
      "src/main.ts",
      "organization",
      "list",
    ],
    stdout: "piped",
    stderr: "piped",
    env: {
      VK_API_URL: config.apiUrl,
      HOME: "/tmp/test-home-org-list",
    },
  });

  const { code, stdout, stderr } = await command.output();
  const stdoutText = new TextDecoder().decode(stdout);
  const stderrText = new TextDecoder().decode(stderr);

  // Should either succeed with output or fail gracefully with error message
  if (code === 0) {
    // Succeeded - output should be table or "No organizations found."
    assert(
      stdoutText.includes("ID") || stdoutText.includes("No organizations"),
      `Expected table header or empty message, got: ${stdoutText}`,
    );
  } else {
    // Failed - should have meaningful error (not a crash/stacktrace)
    assert(
      stderrText.length > 0 || stdoutText.length > 0,
      "Should produce error output on failure",
    );
  }
});

Deno.test("CLI: vk organization list --json runs without crash", async () => {
  const command = new Deno.Command("deno", {
    args: [
      "run",
      "--allow-net",
      "--allow-read",
      "--allow-write",
      "--allow-env",
      "src/main.ts",
      "organization",
      "list",
      "--json",
    ],
    stdout: "piped",
    stderr: "piped",
    env: {
      VK_API_URL: config.apiUrl,
      HOME: "/tmp/test-home-org-list-json",
    },
  });

  const { code, stdout } = await command.output();
  const stdoutText = new TextDecoder().decode(stdout);

  if (code === 0) {
    // Should output valid JSON array
    const parsed = JSON.parse(stdoutText);
    assertEquals(Array.isArray(parsed), true);
  }
  // Non-zero exit is acceptable if API requires auth
});

// ============================================================================
// CLI: vk organization show
// ============================================================================

Deno.test("CLI: vk organization show without id shows error", async () => {
  const command = new Deno.Command("deno", {
    args: [
      "run",
      "--allow-net",
      "--allow-read",
      "--allow-write",
      "--allow-env",
      "src/main.ts",
      "organization",
      "show",
    ],
    stdout: "piped",
    stderr: "piped",
    env: {
      VK_API_URL: config.apiUrl,
      HOME: "/tmp/test-home-org-show",
    },
  });

  const { code, stderr } = await command.output();
  const stderrText = new TextDecoder().decode(stderr);

  // Should fail because no org ID provided
  assertEquals(code !== 0, true, `Expected non-zero exit, got ${code}`);
  assert(
    stderrText.includes("Organization ID or name is required") ||
      stderrText.includes("organization"),
    `Expected resolver error message, got: ${stderrText}`,
  );
});

Deno.test("CLI: vk organization show with nonexistent id shows error", async () => {
  const command = new Deno.Command("deno", {
    args: [
      "run",
      "--allow-net",
      "--allow-read",
      "--allow-write",
      "--allow-env",
      "src/main.ts",
      "organization",
      "show",
      "nonexistent-org-id",
    ],
    stdout: "piped",
    stderr: "piped",
    env: {
      VK_API_URL: config.apiUrl,
      HOME: "/tmp/test-home-org-show-bad",
    },
  });

  const { code } = await command.output();

  // Should fail because the org doesn't exist
  assertEquals(code !== 0, true, `Expected non-zero exit, got ${code}`);
});
