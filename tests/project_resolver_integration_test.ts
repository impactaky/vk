/**
 * Integration tests for project resolver functionality.
 * These tests require a running vibe-kanban server.
 *
 * Run with: deno task test:integration
 */

import { assertEquals, assertRejects } from "@std/assert";
import { config } from "./helpers/test-server.ts";
import { ApiClient } from "../src/api/client.ts";
import {
  getProjectId,
  ProjectResolverError,
} from "../src/utils/project-resolver.ts";
import type { Project } from "../src/api/types.ts";

// Helper to create a test project
async function createTestProject(
  suffix: string,
): Promise<{ project: Project; cleanup: () => Promise<void> }> {
  const client = new ApiClient(config.apiUrl);
  const name = `test-project-${Date.now()}-${suffix}`;

  const project = await client.createProject({
    name,
    repositories: [],
  });

  const cleanup = async () => {
    try {
      await client.deleteProject(project.id);
    } catch {
      // Ignore delete errors
    }
  };

  return { project, cleanup };
}

// Tests for getProjectId function with name resolution
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

Deno.test("getProjectId: throws error when no project matches ID or name", async () => {
  // Create a project to ensure at least one exists (so we get "not found" instead of edge case)
  const { cleanup } = await createTestProject("ensure-exists");

  try {
    const client = new ApiClient(config.apiUrl);
    const nonExistentIdOrName = "nonexistent-project-" + Date.now();

    await assertRejects(
      async () => {
        await getProjectId(nonExistentIdOrName, client);
      },
      ProjectResolverError,
      `Project not found: "${nonExistentIdOrName}"`,
    );
  } finally {
    await cleanup();
  }
});

Deno.test("getProjectId: throws error when multiple projects share the same name", async () => {
  const client = new ApiClient(config.apiUrl);
  const sharedName = `duplicate-name-${Date.now()}`;

  // Create two projects with the same name
  const project1 = await client.createProject({
    name: sharedName,
    repositories: [],
  });
  const project2 = await client.createProject({
    name: sharedName,
    repositories: [],
  });

  const cleanup = async () => {
    try {
      await client.deleteProject(project1.id);
    } catch {
      // Ignore
    }
    try {
      await client.deleteProject(project2.id);
    } catch {
      // Ignore
    }
  };

  try {
    await assertRejects(
      async () => {
        await getProjectId(sharedName, client);
      },
      ProjectResolverError,
      `Multiple projects found with name "${sharedName}"`,
    );
  } finally {
    await cleanup();
  }
});
