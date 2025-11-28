import { assertEquals } from "@std/assert";
import { applyFilters } from "../src/utils/filter.ts";

Deno.test("Integration - Project filtering by name", () => {
  const projects = [
    {
      id: "1",
      name: "Frontend",
      git_repo_path: "/repos/frontend",
      is_archived: false,
    },
    {
      id: "2",
      name: "Backend",
      git_repo_path: "/repos/backend",
      is_archived: false,
    },
  ];

  const result = applyFilters(projects, { name: "Frontend" });
  assertEquals(result.length, 1);
  assertEquals(result[0].name, "Frontend");
});

Deno.test("Integration - Project filtering by archived status", () => {
  const projects = [
    {
      id: "1",
      name: "Active",
      git_repo_path: "/repos/active",
      is_archived: false,
    },
    {
      id: "2",
      name: "Archived",
      git_repo_path: "/repos/archived",
      is_archived: true,
    },
  ];

  const result = applyFilters(projects, { is_archived: false });
  assertEquals(result.length, 1);
  assertEquals(result[0].name, "Active");
});

Deno.test("Integration - Project filtering with multiple conditions", () => {
  const projects = [
    {
      id: "1",
      name: "Frontend",
      git_repo_path: "/repos/frontend",
      is_archived: false,
      hex_color: "#3498db",
    },
    {
      id: "2",
      name: "Frontend",
      git_repo_path: "/repos/frontend2",
      is_archived: true,
      hex_color: "#3498db",
    },
    {
      id: "3",
      name: "Backend",
      git_repo_path: "/repos/backend",
      is_archived: false,
      hex_color: "#e74c3c",
    },
  ];

  const result = applyFilters(projects, {
    name: "Frontend",
    is_archived: false,
  });
  assertEquals(result.length, 1);
  assertEquals(result[0].id, "1");
});

Deno.test("Integration - Task filtering by status", () => {
  const tasks = [
    { id: "1", title: "Task 1", status: "completed", project_id: "p1" },
    { id: "2", title: "Task 2", status: "in_progress", project_id: "p1" },
    { id: "3", title: "Task 3", status: "completed", project_id: "p1" },
  ];

  const result = applyFilters(tasks, { status: "completed" });
  assertEquals(result.length, 2);
  assertEquals(result[0].status, "completed");
  assertEquals(result[1].status, "completed");
});

Deno.test("Integration - Task filtering by priority", () => {
  const tasks = [
    {
      id: "1",
      title: "Task 1",
      status: "pending",
      project_id: "p1",
      priority: 5,
    },
    {
      id: "2",
      title: "Task 2",
      status: "pending",
      project_id: "p1",
      priority: 3,
    },
    {
      id: "3",
      title: "Task 3",
      status: "pending",
      project_id: "p1",
      priority: 5,
    },
  ];

  const result = applyFilters(tasks, { priority: 5 });
  assertEquals(result.length, 2);
  assertEquals(result[0].priority, 5);
  assertEquals(result[1].priority, 5);
});

Deno.test("Integration - Task filtering by label (array matching)", () => {
  const tasks = [
    {
      id: "1",
      title: "Task 1",
      status: "pending",
      project_id: "p1",
      labels: ["bug", "urgent"],
    },
    {
      id: "2",
      title: "Task 2",
      status: "pending",
      project_id: "p1",
      labels: ["feature"],
    },
    {
      id: "3",
      title: "Task 3",
      status: "pending",
      project_id: "p1",
      labels: ["bug", "low-priority"],
    },
  ];

  const result = applyFilters(tasks, { labels: "bug" });
  assertEquals(result.length, 2);
  assertEquals(result[0].id, "1");
  assertEquals(result[1].id, "3");
});

Deno.test("Integration - Task filtering with multiple conditions", () => {
  const tasks = [
    {
      id: "1",
      title: "Task 1",
      status: "completed",
      project_id: "p1",
      priority: 5,
      executor: "CLAUDE_CODE:DEFAULT",
    },
    {
      id: "2",
      title: "Task 2",
      status: "in_progress",
      project_id: "p1",
      priority: 5,
      executor: "CLAUDE_CODE:DEFAULT",
    },
    {
      id: "3",
      title: "Task 3",
      status: "completed",
      project_id: "p1",
      priority: 3,
      executor: "CLAUDE_CODE:DEFAULT",
    },
  ];

  const result = applyFilters(tasks, {
    status: "completed",
    priority: 5,
    executor: "CLAUDE_CODE:DEFAULT",
  });
  assertEquals(result.length, 1);
  assertEquals(result[0].id, "1");
});

Deno.test("Integration - Task filtering by favorite status", () => {
  const tasks = [
    {
      id: "1",
      title: "Task 1",
      status: "pending",
      project_id: "p1",
      is_favorite: true,
    },
    {
      id: "2",
      title: "Task 2",
      status: "pending",
      project_id: "p1",
      is_favorite: false,
    },
  ];

  const result = applyFilters(tasks, { is_favorite: true });
  assertEquals(result.length, 1);
  assertEquals(result[0].id, "1");
});

Deno.test("Integration - Attempt filtering by executor", () => {
  const attempts = [
    {
      id: "1",
      task_id: "t1",
      branch: "branch-1",
      executor: "CLAUDE_CODE:DEFAULT",
      target_branch: "main",
    },
    {
      id: "2",
      task_id: "t1",
      branch: "branch-2",
      executor: "HUMAN:DEFAULT",
      target_branch: "main",
    },
    {
      id: "3",
      task_id: "t1",
      branch: "branch-3",
      executor: "CLAUDE_CODE:DEFAULT",
      target_branch: "develop",
    },
  ];

  const result = applyFilters(attempts, { executor: "CLAUDE_CODE:DEFAULT" });
  assertEquals(result.length, 2);
  assertEquals(result[0].executor, "CLAUDE_CODE:DEFAULT");
  assertEquals(result[1].executor, "CLAUDE_CODE:DEFAULT");
});

Deno.test("Integration - Attempt filtering by branch", () => {
  const attempts = [
    {
      id: "1",
      task_id: "t1",
      branch: "feature-branch",
      executor: "CLAUDE_CODE:DEFAULT",
      target_branch: "main",
    },
    {
      id: "2",
      task_id: "t1",
      branch: "bugfix-branch",
      executor: "CLAUDE_CODE:DEFAULT",
      target_branch: "main",
    },
  ];

  const result = applyFilters(attempts, { branch: "feature-branch" });
  assertEquals(result.length, 1);
  assertEquals(result[0].branch, "feature-branch");
});

Deno.test("Integration - Attempt filtering by target branch", () => {
  const attempts = [
    {
      id: "1",
      task_id: "t1",
      branch: "branch-1",
      executor: "CLAUDE_CODE:DEFAULT",
      target_branch: "main",
    },
    {
      id: "2",
      task_id: "t1",
      branch: "branch-2",
      executor: "CLAUDE_CODE:DEFAULT",
      target_branch: "develop",
    },
    {
      id: "3",
      task_id: "t1",
      branch: "branch-3",
      executor: "CLAUDE_CODE:DEFAULT",
      target_branch: "main",
    },
  ];

  const result = applyFilters(attempts, { target_branch: "main" });
  assertEquals(result.length, 2);
  assertEquals(result[0].target_branch, "main");
  assertEquals(result[1].target_branch, "main");
});

Deno.test("Integration - Attempt filtering with multiple conditions", () => {
  const attempts = [
    {
      id: "1",
      task_id: "t1",
      branch: "branch-1",
      executor: "CLAUDE_CODE:DEFAULT",
      target_branch: "main",
    },
    {
      id: "2",
      task_id: "t1",
      branch: "branch-2",
      executor: "CLAUDE_CODE:DEFAULT",
      target_branch: "develop",
    },
    {
      id: "3",
      task_id: "t1",
      branch: "branch-3",
      executor: "HUMAN:DEFAULT",
      target_branch: "main",
    },
  ];

  const result = applyFilters(attempts, {
    executor: "CLAUDE_CODE:DEFAULT",
    target_branch: "main",
  });
  assertEquals(result.length, 1);
  assertEquals(result[0].id, "1");
});

Deno.test("Integration - Empty results after filtering", () => {
  const tasks = [
    { id: "1", title: "Task 1", status: "completed", project_id: "p1" },
    { id: "2", title: "Task 2", status: "in_progress", project_id: "p1" },
  ];

  const result = applyFilters(tasks, { status: "cancelled" });
  assertEquals(result.length, 0);
});

Deno.test("Integration - Filters with JSON output simulation", () => {
  const tasks = [
    {
      id: "1",
      title: "Task 1",
      status: "completed",
      project_id: "p1",
      priority: 5,
    },
    {
      id: "2",
      title: "Task 2",
      status: "in_progress",
      project_id: "p1",
      priority: 3,
    },
  ];

  const result = applyFilters(tasks, { status: "completed" });
  const jsonOutput = JSON.stringify(result, null, 2);

  // Verify JSON is valid and contains expected data
  const parsed = JSON.parse(jsonOutput);
  assertEquals(parsed.length, 1);
  assertEquals(parsed[0].status, "completed");
});
