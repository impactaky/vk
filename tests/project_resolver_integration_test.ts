/**
 * Integration tests for project resolver functionality.
 * These tests require a running vibe-kanban server.
 *
 * Run with: deno task test:integration
 */

import { assertEquals } from "@std/assert";
import { config } from "./helpers/test-server.ts";
import { ApiClient } from "../src/api/client.ts";
import { getProjectId } from "../src/utils/project-resolver.ts";
import type { Project } from "../src/api/types.ts";

// Shared test directory path (available in both containers via shared volume)
const SHARED_TEST_DIR = "/shared";

// Helper to create a test project with an associated repository
async function createTestProject(
  suffix: string,
): Promise<{ project: Project; cleanup: () => Promise<void> }> {
  const testPath =
    `${SHARED_TEST_DIR}/test-project-repo-${Date.now()}-${suffix}`;

  // Create the directory and .git folder (server checks for .git to validate git repo)
  await Deno.mkdir(`${testPath}/.git`, { recursive: true });

  const client = new ApiClient(config.apiUrl);

  // Register a repository first
  const repo = await client.registerRepo({
    path: testPath,
    display_name: `Test Repo for Project ${suffix}`,
  });

  // Create a project with unique name
  const project = await client.createProject({
    name: `test-project-${Date.now()}-${suffix}`,
    repositories: [{ repo_id: repo.id, is_main: true }],
  });

  const cleanup = async () => {
    try {
      await fetch(`${config.apiUrl}/api/projects/${project.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      // Ignore delete errors
    }
    try {
      await fetch(`${config.apiUrl}/api/repos/${repo.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      // Ignore delete errors
    }
    try {
      await Deno.remove(testPath, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  };

  return { project, cleanup };
}

// Tests for getProjectId function
Deno.test("getProjectId: returns explicit ID when provided", async () => {
  const { project, cleanup } = await createTestProject("explicit-id");

  try {
    const client = new ApiClient(config.apiUrl);
    const result = await getProjectId(project.id, client);
    assertEquals(result, project.id);
  } finally {
    await cleanup();
  }
});

Deno.test("getProjectId: resolves by name when single match exists", async () => {
  const { project, cleanup } = await createTestProject("name-resolution");

  try {
    const client = new ApiClient(config.apiUrl);
    // Test resolving by name
    const result = await getProjectId(project.name, client);
    assertEquals(result, project.id);
  } finally {
    await cleanup();
  }
});

Deno.test("getProjectId: ID match takes priority over name match", async () => {
  const { project, cleanup } = await createTestProject("id-priority");

  try {
    const client = new ApiClient(config.apiUrl);
    // When we pass an exact ID, it should return that ID
    const result = await getProjectId(project.id, client);
    assertEquals(result, project.id);
  } finally {
    await cleanup();
  }
});
