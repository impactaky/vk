/**
 * Integration tests for repository resolver functionality.
 * These tests require a running vibe-kanban server.
 *
 * Run with: deno task test:integration
 */

import { assertEquals, assertRejects } from "@std/assert";
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
    archive_script: null,
    copy_files: null,
    parallel_setup_script: false,
    dev_server_script: null,
    default_target_branch: null,
    default_working_dir: null,
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
    archive_script: null,
    copy_files: null,
    parallel_setup_script: false,
    dev_server_script: null,
    default_target_branch: null,
    default_working_dir: null,
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

// Shared test directory path (available in both containers via shared volume)
const SHARED_TEST_DIR = "/shared";

// Helper to create a test repository with a real git directory
async function createTestRepo(
  suffix: string,
): Promise<{ repo: Repo; cleanup: () => Promise<void> }> {
  const testPath = `${SHARED_TEST_DIR}/test-repo-${Date.now()}-${suffix}`;

  // Create the directory and .git folder (server checks for .git to validate git repo)
  await Deno.mkdir(`${testPath}/.git`, { recursive: true });

  // Register the repository
  const client = new ApiClient(config.apiUrl);
  const repo = await client.registerRepo({
    path: testPath,
    display_name: `Test Repo ${suffix}`,
  });

  const cleanup = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/api/repos/${repo.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      // Ignore response - DELETE may return empty body
      await response.text();
    } catch {
      // Ignore delete errors
    }
    try {
      await Deno.remove(testPath, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  };

  return { repo, cleanup };
}

// Tests for getRepositoryId function
Deno.test("getRepositoryId: returns explicit ID when provided", async () => {
  const { repo, cleanup } = await createTestRepo("explicit-id");

  try {
    const client = new ApiClient(config.apiUrl);
    const result = await getRepositoryId(repo.id, client);
    assertEquals(result, repo.id);
  } finally {
    await cleanup();
  }
});

Deno.test("getRepositoryId: throws when no repos and no explicit ID", async () => {
  const client = new ApiClient(config.apiUrl);

  // Get and temporarily remove all existing repos
  const reposResult = await apiCall<Repo[]>("/repos");
  const existingRepos = reposResult.data || [];

  // Delete all repos temporarily (use fetch directly as DELETE returns empty body)
  for (const repo of existingRepos) {
    const response = await fetch(`${config.apiUrl}/api/repos/${repo.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    await response.text(); // Consume body
  }

  try {
    // With no repos and no explicit ID, should throw RepositoryResolverError
    await assertRejects(
      async () => {
        await getRepositoryId(undefined, client);
      },
      RepositoryResolverError,
    );
  } finally {
    // Restore repos (note: paths may not exist anymore, so we skip validation errors)
    for (const repo of existingRepos) {
      try {
        await client.registerRepo({
          path: repo.path,
          display_name: repo.display_name || null,
        });
      } catch {
        // Ignore errors restoring repos with invalid paths
      }
    }
  }
});

// Integration test for repository auto-detection with actual server
Deno.test("Repository auto-detection: resolves from matching path", async () => {
  const { repo, cleanup } = await createTestRepo("auto-detect");
  const originalCwd = Deno.cwd();

  try {
    // Change to the repo directory
    Deno.chdir(repo.path);

    // Test that getRepositoryId resolves to the matching repo
    const client = new ApiClient(config.apiUrl);
    const resolvedId = await getRepositoryId(undefined, client);
    assertEquals(resolvedId, repo.id);
  } finally {
    // Restore original working directory
    Deno.chdir(originalCwd);
    await cleanup();
  }
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
  const { repo, cleanup } = await createTestRepo("name-resolution");

  try {
    const client = new ApiClient(config.apiUrl);
    // Test resolving by name
    const result = await getRepositoryId(repo.name, client);
    assertEquals(result, repo.id);
  } finally {
    await cleanup();
  }
});

Deno.test("getRepositoryId: ID match takes priority over name match", async () => {
  const { repo, cleanup } = await createTestRepo("id-priority");

  try {
    const client = new ApiClient(config.apiUrl);
    // When we pass an exact ID, it should return that ID
    const result = await getRepositoryId(repo.id, client);
    assertEquals(result, repo.id);
  } finally {
    await cleanup();
  }
});

Deno.test("getRepositoryId: throws error when no repository matches ID or name", async () => {
  // Create a repo to ensure at least one exists (so we get "not found" instead of "no repos")
  const { cleanup } = await createTestRepo("ensure-exists");

  try {
    const client = new ApiClient(config.apiUrl);
    const nonExistentIdOrName = "nonexistent-repo-" + Date.now();

    await assertRejects(
      async () => {
        await getRepositoryId(nonExistentIdOrName, client);
      },
      RepositoryResolverError,
      `Repository not found: "${nonExistentIdOrName}"`,
    );
  } finally {
    await cleanup();
  }
});
