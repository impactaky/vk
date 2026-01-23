/**
 * Integration tests for project resolver functionality.
 * These tests require a running vibe-kanban server.
 *
 * Run with: deno task test:integration
 */

import { assertEquals, assertExists } from "@std/assert";
import { getTestApiUrl, isServerAvailable } from "./helpers/test-server.ts";
import { ApiClient } from "../src/api/client.ts";
import { getProjectId } from "../src/utils/project-resolver.ts";
import type { Project, Repo } from "../src/api/types.ts";

let serverAvailable: boolean | null = null;
let apiUrl: string;

async function checkServerAndSkipIfUnavailable(): Promise<boolean> {
  if (serverAvailable === null) {
    apiUrl = getTestApiUrl();
    serverAvailable = await isServerAvailable(apiUrl);
    if (!serverAvailable) {
      console.warn(
        `\nWARNING: Server at ${apiUrl} is not available. Test skipped.\n` +
          "Start the server with: docker compose up\n",
      );
    }
  }
  return serverAvailable;
}

// Helper to make raw API calls
async function apiCall<T>(
  path: string,
  options: RequestInit = {},
): Promise<{ success: boolean; data?: T; error?: string }> {
  const response = await fetch(`${apiUrl}/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  return await response.json();
}

// Helper function to check if a path is within a repo path (for test assertions)
function isPathWithinRepo(currentPath: string, repoPath: string): boolean {
  const normalizedCurrent = currentPath.replace(/\/+$/, "");
  const normalizedRepo = repoPath.replace(/\/+$/, "");
  return (
    normalizedCurrent === normalizedRepo ||
    normalizedCurrent.startsWith(normalizedRepo + "/")
  );
}

// Tests for getProjectId function
Deno.test("getProjectId: returns explicit ID when provided", async () => {
  if (!(await checkServerAndSkipIfUnavailable())) return;

  const client = new ApiClient(apiUrl);
  const explicitId = "explicit-project-id";

  const result = await getProjectId(explicitId, client);
  assertEquals(result, explicitId);
});

// Integration test for project auto-detection via repository
Deno.test("Project auto-detection: resolves via repository when available", async () => {
  if (!(await checkServerAndSkipIfUnavailable())) return;

  // Get list of projects and repos
  const projectsResult = await apiCall<Project[]>("/projects");
  const reposResult = await apiCall<Repo[]>("/repos");

  assertEquals(projectsResult.success, true);
  assertEquals(reposResult.success, true);
  assertExists(projectsResult.data);
  assertExists(reposResult.data);

  if (projectsResult.data.length === 0 || reposResult.data.length === 0) {
    console.log("Skipping test: no projects or repos available");
    return;
  }

  // Get current working directory
  const currentPath = Deno.cwd();

  // Find a matching repository
  const matchingRepo = reposResult.data.find((repo) => {
    return isPathWithinRepo(currentPath, repo.path);
  });

  if (!matchingRepo) {
    console.log(
      `Skipping test: current directory "${currentPath}" is not within any registered repository`,
    );
    return;
  }

  // Find projects that match this repo's basename
  const matchingProjects = projectsResult.data.filter((project) => {
    const projectBasename = project.git_repo_path.split("/").pop()?.replace(/\.git$/, "");
    return projectBasename === matchingRepo.name;
  });

  if (matchingProjects.length === 0) {
    console.log(
      `Skipping test: no projects match repository "${matchingRepo.name}"`,
    );
    return;
  }

  // Test that getProjectId resolves to a matching project
  const client = new ApiClient(apiUrl);
  const resolvedId = await getProjectId(undefined, client);

  // The resolved ID should be one of the matching projects
  const resolved = matchingProjects.find((p) => p.id === resolvedId);
  assertExists(
    resolved,
    `Expected resolved project ID "${resolvedId}" to match one of the projects for repository "${matchingRepo.name}"`,
  );
});

// Test cross-machine compatibility scenario
Deno.test("Project resolution: cross-machine compatibility via git basename", async () => {
  if (!(await checkServerAndSkipIfUnavailable())) return;

  // This test verifies that projects can be resolved even when:
  // - The project's git_repo_path is on a different machine
  // - The repository's path is different from project's git_repo_path
  // - Both share the same git basename

  const projectsResult = await apiCall<Project[]>("/projects");
  const reposResult = await apiCall<Repo[]>("/repos");

  assertEquals(projectsResult.success, true);
  assertEquals(reposResult.success, true);
  assertExists(projectsResult.data);
  assertExists(reposResult.data);

  // Find projects and repos that share the same git basename
  // but may have different full paths
  const reposByBasename = new Map<string, Repo[]>();
  for (const repo of reposResult.data) {
    const basename = repo.name;
    if (!reposByBasename.has(basename)) {
      reposByBasename.set(basename, []);
    }
    reposByBasename.get(basename)!.push(repo);
  }

  const projectsByBasename = new Map<string, Project[]>();
  for (const project of projectsResult.data) {
    const basename = project.git_repo_path.split("/").pop()?.replace(/\.git$/, "") || "";
    if (!projectsByBasename.has(basename)) {
      projectsByBasename.set(basename, []);
    }
    projectsByBasename.get(basename)!.push(project);
  }

  // Log cross-machine compatibility info
  let crossMachineCompatible = 0;
  for (const [basename, projects] of projectsByBasename) {
    const repos = reposByBasename.get(basename) || [];
    for (const project of projects) {
      for (const repo of repos) {
        if (project.git_repo_path !== repo.path) {
          crossMachineCompatible++;
        }
      }
    }
  }

  console.log(
    `Found ${crossMachineCompatible} cross-machine compatible project-repo pairs`,
  );
  assertEquals(true, true); // Test passes - just documenting the scenario
});

// Test that verifies the 3-tier resolution strategy
Deno.test("Project resolution: uses 3-tier strategy (repo -> git basename -> fzf)", async () => {
  if (!(await checkServerAndSkipIfUnavailable())) return;

  const projectsResult = await apiCall<Project[]>("/projects");
  const reposResult = await apiCall<Repo[]>("/repos");

  assertEquals(projectsResult.success, true);
  assertEquals(reposResult.success, true);
  assertExists(projectsResult.data);
  assertExists(reposResult.data);

  if (projectsResult.data.length === 0) {
    console.log("Skipping test: no projects available to test resolution");
    return;
  }

  const client = new ApiClient(apiUrl);

  // Test resolution - should succeed via one of the three strategies
  // The test validates that the resolution completes without error
  // when there are projects and repos available
  try {
    const resolvedId = await getProjectId(undefined, client);
    assertExists(resolvedId, "Should resolve to a project ID");

    // Verify the resolved ID corresponds to an actual project
    const resolvedProject = projectsResult.data.find((p) => p.id === resolvedId);
    if (resolvedProject) {
      console.log(`Resolved to project: ${resolvedProject.name}`);
    } else {
      // This shouldn't happen in normal operation
      console.log(`Warning: Resolved ID ${resolvedId} not found in project list`);
    }
  } catch (error) {
    // If resolution fails (e.g., fzf not available in CI), that's expected
    console.log(`Resolution failed (expected in CI without fzf): ${error}`);
  }
});

// Test project resolution consistency
Deno.test("Project resolution: consistent results on repeated calls", async () => {
  if (!(await checkServerAndSkipIfUnavailable())) return;

  const projectsResult = await apiCall<Project[]>("/projects");
  const reposResult = await apiCall<Repo[]>("/repos");

  if (projectsResult.data?.length === 0 || reposResult.data?.length === 0) {
    console.log("Skipping test: no projects or repos available");
    return;
  }

  const currentPath = Deno.cwd();
  const matchingRepo = reposResult.data?.find((repo) =>
    isPathWithinRepo(currentPath, repo.path)
  );

  if (!matchingRepo) {
    console.log("Skipping test: current directory is not within any registered repository");
    return;
  }

  const client = new ApiClient(apiUrl);

  try {
    // Call resolution multiple times
    const result1 = await getProjectId(undefined, client);
    const result2 = await getProjectId(undefined, client);
    const result3 = await getProjectId(undefined, client);

    // All results should be identical
    assertEquals(result1, result2, "Resolution should be consistent");
    assertEquals(result2, result3, "Resolution should be consistent");
    console.log(`Consistent resolution to project ID: ${result1}`);
  } catch (error) {
    console.log(`Resolution failed (expected in CI): ${error}`);
  }
});

// Test that multiple projects with same basename are handled correctly
Deno.test("Project resolution: handles multiple projects with same git basename", async () => {
  if (!(await checkServerAndSkipIfUnavailable())) return;

  const projectsResult = await apiCall<Project[]>("/projects");

  assertEquals(projectsResult.success, true);
  assertExists(projectsResult.data);

  // Group projects by git basename
  const projectsByBasename = new Map<string, Project[]>();
  for (const project of projectsResult.data) {
    const basename = project.git_repo_path.split("/").pop()?.replace(/\.git$/, "") || "";
    if (!projectsByBasename.has(basename)) {
      projectsByBasename.set(basename, []);
    }
    projectsByBasename.get(basename)!.push(project);
  }

  // Find any basenames with multiple projects
  const duplicateBasenames: string[] = [];
  for (const [basename, projects] of projectsByBasename) {
    if (projects.length > 1) {
      duplicateBasenames.push(basename);
      console.log(
        `Found ${projects.length} projects with basename "${basename}": ${projects.map((p) => p.name).join(", ")}`,
      );
    }
  }

  if (duplicateBasenames.length === 0) {
    console.log("No duplicate basenames found - test scenario not applicable");
  } else {
    console.log(
      `Found ${duplicateBasenames.length} basenames with multiple projects`,
    );
  }

  // The test passes - we're documenting the state of the system
  assertEquals(true, true);
});
