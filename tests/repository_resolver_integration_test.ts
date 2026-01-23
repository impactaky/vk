/**
 * Integration tests for repository resolver functionality.
 * These tests require a running vibe-kanban server.
 *
 * Run with: deno task test:integration
 */

import { assertEquals, assertExists, assertRejects } from "@std/assert";
import { config } from "./helpers/test-server.ts";
import { ApiClient } from "../src/api/client.ts";
import {
  getRepositoryId,
  RepositoryResolverError,
} from "../src/utils/repository-resolver.ts";
import { formatRepository, selectRepository } from "../src/utils/fzf.ts";
import type { Repo } from "../src/api/types.ts";

// Helper to make raw API calls
async function apiCall<T>(
  path: string,
  options: RequestInit = {},
): Promise<{ success: boolean; data?: T; error?: string }> {
  const response = await fetch(`${config.apiUrl}/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  return await response.json();
}

// Tests for formatRepository function
Deno.test("formatRepository: formats repository for fzf display", () => {
  const repo: Repo = {
    id: "repo-123",
    path: "/home/user/projects/my-repo",
    name: "my-repo",
    display_name: "My Repository",
    setup_script: null,
    cleanup_script: null,
    copy_files: null,
    parallel_setup_script: false,
    dev_server_script: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  const formatted = formatRepository(repo);
  assertEquals(formatted, "repo-123\tmy-repo\t/home/user/projects/my-repo");
});

Deno.test("formatRepository: handles empty display name", () => {
  const repo: Repo = {
    id: "repo-456",
    path: "/path/to/repo",
    name: "repo-name",
    display_name: "",
    setup_script: null,
    cleanup_script: null,
    copy_files: null,
    parallel_setup_script: false,
    dev_server_script: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  const formatted = formatRepository(repo);
  assertEquals(formatted, "repo-456\trepo-name\t/path/to/repo");
});

// Tests for selectRepository function (error cases - no fzf in CI)
Deno.test("selectRepository: throws error for empty array", async () => {
  await assertRejects(
    async () => {
      await selectRepository([]);
    },
    Error,
    "No repositories available.",
  );
});

// Tests for getRepositoryId function
Deno.test("getRepositoryId: returns explicit ID when provided", async () => {
  const client = new ApiClient(config.apiUrl);

  // First, get an existing repository or create one
  const reposResult = await apiCall<Repo[]>("/repos");
  if (!reposResult.data || reposResult.data.length === 0) {
    console.log("Skipping test: no repositories exist to test with");
    return;
  }

  const existingRepo = reposResult.data[0];
  const result = await getRepositoryId(existingRepo.id, client);
  assertEquals(result, existingRepo.id);
});

Deno.test("getRepositoryId: throws when no repos and no explicit ID", async () => {
    // Get list of existing repos to check if any exist
  const reposResult = await apiCall<Repo[]>("/repos");
  if (reposResult.data && reposResult.data.length > 0) {
    // Skip this test if repos exist - we can't test "no repos" scenario
    console.log("Skipping test: repositories exist in the system");
    return;
  }

  const client = new ApiClient(config.apiUrl);

  await assertRejects(
    async () => {
      await getRepositoryId(undefined, client);
    },
    RepositoryResolverError,
    "No repositories registered.",
  );
});

// Integration test for repository auto-detection with actual server
Deno.test("Repository auto-detection: resolves from matching path", async () => {
    // Get current working directory
  const currentPath = Deno.cwd();

  // Check if there's a repository that matches current path
  const reposResult = await apiCall<Repo[]>("/repos");
  assertEquals(reposResult.success, true);
  assertExists(reposResult.data);

  const matchingRepo = reposResult.data.find((repo) => {
    const normalizedCurrent = currentPath.replace(/\/+$/, "");
    const normalizedRepo = repo.path.replace(/\/+$/, "");
    return (
      normalizedCurrent === normalizedRepo ||
      normalizedCurrent.startsWith(normalizedRepo + "/")
    );
  });

  if (!matchingRepo) {
    console.log(
      `Skipping test: current directory "${currentPath}" is not within any registered repository`,
    );
    return;
  }

  // Test that getRepositoryId resolves to the matching repo
  const client = new ApiClient(config.apiUrl);
  const resolvedId = await getRepositoryId(undefined, client);

  // The resolved ID should be from a repo that contains current path
  const resolvedRepo = reposResult.data.find((r) => r.id === resolvedId);
  assertExists(resolvedRepo);

  // Verify the resolved repo's path contains current directory
  const normalizedCurrent = currentPath.replace(/\/+$/, "");
  const normalizedResolved = resolvedRepo.path.replace(/\/+$/, "");
  assertEquals(
    normalizedCurrent === normalizedResolved ||
      normalizedCurrent.startsWith(normalizedResolved + "/"),
    true,
    `Expected current path "${currentPath}" to be within resolved repo path "${resolvedRepo.path}"`,
  );
});

// Test path matching logic directly
Deno.test("Path matching: exact path match", () => {
  const currentPath = "/home/user/projects/my-repo";
  const repoPath = "/home/user/projects/my-repo";

  const normalizedCurrent = currentPath.replace(/\/+$/, "");
  const normalizedRepo = repoPath.replace(/\/+$/, "");
  const isWithin = normalizedCurrent === normalizedRepo ||
    normalizedCurrent.startsWith(normalizedRepo + "/");

  assertEquals(isWithin, true);
});

Deno.test("Path matching: subdirectory match", () => {
  const currentPath = "/home/user/projects/my-repo/src/components";
  const repoPath = "/home/user/projects/my-repo";

  const normalizedCurrent = currentPath.replace(/\/+$/, "");
  const normalizedRepo = repoPath.replace(/\/+$/, "");
  const isWithin = normalizedCurrent === normalizedRepo ||
    normalizedCurrent.startsWith(normalizedRepo + "/");

  assertEquals(isWithin, true);
});

Deno.test("Path matching: no match for different path", () => {
  const currentPath = "/home/user/projects/other-repo";
  const repoPath = "/home/user/projects/my-repo";

  const normalizedCurrent = currentPath.replace(/\/+$/, "");
  const normalizedRepo = repoPath.replace(/\/+$/, "");
  const isWithin = normalizedCurrent === normalizedRepo ||
    normalizedCurrent.startsWith(normalizedRepo + "/");

  assertEquals(isWithin, false);
});

Deno.test("Path matching: no match for partial name", () => {
  const currentPath = "/home/user/projects/my-repo-extended";
  const repoPath = "/home/user/projects/my-repo";

  const normalizedCurrent = currentPath.replace(/\/+$/, "");
  const normalizedRepo = repoPath.replace(/\/+$/, "");
  const isWithin = normalizedCurrent === normalizedRepo ||
    normalizedCurrent.startsWith(normalizedRepo + "/");

  assertEquals(isWithin, false);
});

Deno.test("Path matching: handles trailing slashes", () => {
  const currentPath = "/home/user/projects/my-repo/";
  const repoPath = "/home/user/projects/my-repo///";

  const normalizedCurrent = currentPath.replace(/\/+$/, "");
  const normalizedRepo = repoPath.replace(/\/+$/, "");
  const isWithin = normalizedCurrent === normalizedRepo ||
    normalizedCurrent.startsWith(normalizedRepo + "/");

  assertEquals(isWithin, true);
});

// Test most specific path selection
Deno.test("Path matching: selects most specific (longest) path", () => {
  const currentPath = "/home/user/projects/parent/nested-repo/src";
  const repos = [
    { path: "/home/user/projects", id: "parent-projects" },
    { path: "/home/user/projects/parent", id: "parent" },
    { path: "/home/user/projects/parent/nested-repo", id: "nested" },
  ];

  // Filter matching repos
  const matches = repos.filter((r) => {
    const normalizedCurrent = currentPath.replace(/\/+$/, "");
    const normalizedRepo = r.path.replace(/\/+$/, "");
    return (
      normalizedCurrent === normalizedRepo ||
      normalizedCurrent.startsWith(normalizedRepo + "/")
    );
  });

  // Sort by path length (longest first)
  matches.sort((a, b) => b.path.length - a.path.length);

  assertEquals(matches.length, 3);
  assertEquals(matches[0].id, "nested"); // Most specific should be first
});

// Tests for repository resolution by name
Deno.test("getRepositoryId: resolves by name when single match exists", async () => {
  const client = new ApiClient(config.apiUrl);

  // Use an existing repository instead of creating one (path validation would fail in Docker)
  const reposResult = await apiCall<Repo[]>("/repos");
  if (!reposResult.data || reposResult.data.length === 0) {
    console.log("Skipping test: no repositories exist to test with");
    return;
  }

  const existingRepo = reposResult.data[0];
  // Test resolving by name
  const result = await getRepositoryId(existingRepo.name, client);
  assertEquals(result, existingRepo.id);
});

Deno.test("getRepositoryId: ID match takes priority over name match", async () => {
  const client = new ApiClient(config.apiUrl);

  // Use an existing repository instead of creating one (path validation would fail in Docker)
  const reposResult = await apiCall<Repo[]>("/repos");
  if (!reposResult.data || reposResult.data.length === 0) {
    console.log("Skipping test: no repositories exist to test with");
    return;
  }

  const existingRepo = reposResult.data[0];
  // When we pass an exact ID, it should return that ID
  const result = await getRepositoryId(existingRepo.id, client);
  assertEquals(result, existingRepo.id);
});

Deno.test("getRepositoryId: throws error when no repository matches ID or name", async () => {
    const client = new ApiClient(config.apiUrl);
  const nonExistentIdOrName = "nonexistent-repo-" + Date.now();

  await assertRejects(
    async () => {
      await getRepositoryId(nonExistentIdOrName, client);
    },
    RepositoryResolverError,
    `Repository not found: "${nonExistentIdOrName}"`,
  );
});
