import { assertEquals } from "@std/assert";
import { applyFilters } from "../src/utils/filter.ts";

Deno.test("Integration - Project filtering by name", () => {
  const projects = [
    {
      id: "1",
      name: "Frontend",
      default_agent_working_dir: "/workdir",
      remote_project_id: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "2",
      name: "Backend",
      default_agent_working_dir: null,
      remote_project_id: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  ];

  const result = applyFilters(projects, { name: "Frontend" });
  assertEquals(result.length, 1);
  assertEquals(result[0].name, "Frontend");
});

Deno.test("Integration - Project filtering by working dir", () => {
  const projects = [
    {
      id: "1",
      name: "Project1",
      default_agent_working_dir: "/workdir1",
      remote_project_id: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "2",
      name: "Project2",
      default_agent_working_dir: "/workdir2",
      remote_project_id: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  ];

  const result = applyFilters(projects, {
    default_agent_working_dir: "/workdir1",
  });
  assertEquals(result.length, 1);
  assertEquals(result[0].name, "Project1");
});

Deno.test("Integration - Project filtering with multiple conditions", () => {
  const projects = [
    {
      id: "1",
      name: "Frontend",
      default_agent_working_dir: "/workdir",
      remote_project_id: "remote-1",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "2",
      name: "Frontend",
      default_agent_working_dir: "/workdir2",
      remote_project_id: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "3",
      name: "Backend",
      default_agent_working_dir: "/workdir",
      remote_project_id: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  ];

  const result = applyFilters(projects, {
    name: "Frontend",
    default_agent_working_dir: "/workdir",
  });
  assertEquals(result.length, 1);
  assertEquals(result[0].id, "1");
});

Deno.test("Integration - Task filtering by status", () => {
  const tasks = [
    {
      id: "1",
      title: "Task 1",
      status: "done",
      project_id: "p1",
      description: null,
      parent_workspace_id: null,
      shared_task_id: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "2",
      title: "Task 2",
      status: "inprogress",
      project_id: "p1",
      description: null,
      parent_workspace_id: null,
      shared_task_id: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "3",
      title: "Task 3",
      status: "done",
      project_id: "p1",
      description: null,
      parent_workspace_id: null,
      shared_task_id: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  ];

  const result = applyFilters(tasks, { status: "done" });
  assertEquals(result.length, 2);
  assertEquals(result[0].status, "done");
  assertEquals(result[1].status, "done");
});

Deno.test("Integration - Task filtering by project_id", () => {
  const tasks = [
    {
      id: "1",
      title: "Task 1",
      status: "todo",
      project_id: "p1",
      description: null,
      parent_workspace_id: null,
      shared_task_id: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "2",
      title: "Task 2",
      status: "todo",
      project_id: "p2",
      description: null,
      parent_workspace_id: null,
      shared_task_id: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "3",
      title: "Task 3",
      status: "todo",
      project_id: "p1",
      description: null,
      parent_workspace_id: null,
      shared_task_id: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  ];

  const result = applyFilters(tasks, { project_id: "p1" });
  assertEquals(result.length, 2);
  assertEquals(result[0].project_id, "p1");
  assertEquals(result[1].project_id, "p1");
});

Deno.test("Integration - Task filtering with multiple conditions", () => {
  const tasks = [
    {
      id: "1",
      title: "Task 1",
      status: "done",
      project_id: "p1",
      description: null,
      parent_workspace_id: null,
      shared_task_id: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "2",
      title: "Task 2",
      status: "inprogress",
      project_id: "p1",
      description: null,
      parent_workspace_id: null,
      shared_task_id: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "3",
      title: "Task 3",
      status: "done",
      project_id: "p2",
      description: null,
      parent_workspace_id: null,
      shared_task_id: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  ];

  const result = applyFilters(tasks, {
    status: "done",
    project_id: "p1",
  });
  assertEquals(result.length, 1);
  assertEquals(result[0].id, "1");
});

Deno.test("Integration - Task filtering by parent workspace", () => {
  const tasks = [
    {
      id: "1",
      title: "Task 1",
      status: "todo",
      project_id: "p1",
      description: null,
      parent_workspace_id: "ws-1",
      shared_task_id: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "2",
      title: "Task 2",
      status: "todo",
      project_id: "p1",
      description: null,
      parent_workspace_id: null,
      shared_task_id: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  ];

  const result = applyFilters(tasks, { parent_workspace_id: "ws-1" });
  assertEquals(result.length, 1);
  assertEquals(result[0].id, "1");
});

Deno.test("Integration - Workspace filtering by branch", () => {
  const workspaces = [
    {
      id: "1",
      task_id: "t1",
      branch: "feature-branch",
      container_ref: null,
      agent_working_dir: null,
      setup_completed_at: null,
      archived: false,
      pinned: false,
      name: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "2",
      task_id: "t1",
      branch: "bugfix-branch",
      container_ref: null,
      agent_working_dir: null,
      setup_completed_at: null,
      archived: false,
      pinned: false,
      name: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  ];

  const result = applyFilters(workspaces, { branch: "feature-branch" });
  assertEquals(result.length, 1);
  assertEquals(result[0].branch, "feature-branch");
});

Deno.test("Integration - Workspace filtering by archived status", () => {
  const workspaces = [
    {
      id: "1",
      task_id: "t1",
      branch: "branch-1",
      container_ref: null,
      agent_working_dir: null,
      setup_completed_at: null,
      archived: false,
      pinned: false,
      name: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "2",
      task_id: "t1",
      branch: "branch-2",
      container_ref: null,
      agent_working_dir: null,
      setup_completed_at: null,
      archived: true,
      pinned: false,
      name: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "3",
      task_id: "t1",
      branch: "branch-3",
      container_ref: null,
      agent_working_dir: null,
      setup_completed_at: null,
      archived: false,
      pinned: true,
      name: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  ];

  const result = applyFilters(workspaces, { archived: false });
  assertEquals(result.length, 2);
  assertEquals(result[0].archived, false);
  assertEquals(result[1].archived, false);
});

Deno.test("Integration - Workspace filtering by pinned status", () => {
  const workspaces = [
    {
      id: "1",
      task_id: "t1",
      branch: "branch-1",
      container_ref: null,
      agent_working_dir: null,
      setup_completed_at: null,
      archived: false,
      pinned: true,
      name: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "2",
      task_id: "t1",
      branch: "branch-2",
      container_ref: null,
      agent_working_dir: null,
      setup_completed_at: null,
      archived: false,
      pinned: false,
      name: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  ];

  const result = applyFilters(workspaces, { pinned: true });
  assertEquals(result.length, 1);
  assertEquals(result[0].id, "1");
});

Deno.test("Integration - Workspace filtering with multiple conditions", () => {
  const workspaces = [
    {
      id: "1",
      task_id: "t1",
      branch: "branch-1",
      container_ref: null,
      agent_working_dir: null,
      setup_completed_at: null,
      archived: false,
      pinned: true,
      name: "Main workspace",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "2",
      task_id: "t1",
      branch: "branch-2",
      container_ref: null,
      agent_working_dir: null,
      setup_completed_at: null,
      archived: true,
      pinned: false,
      name: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "3",
      task_id: "t1",
      branch: "branch-3",
      container_ref: null,
      agent_working_dir: null,
      setup_completed_at: null,
      archived: false,
      pinned: false,
      name: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  ];

  const result = applyFilters(workspaces, {
    archived: false,
    pinned: true,
  });
  assertEquals(result.length, 1);
  assertEquals(result[0].id, "1");
});

Deno.test("Integration - Empty results after filtering", () => {
  const tasks = [
    {
      id: "1",
      title: "Task 1",
      status: "done",
      project_id: "p1",
      description: null,
      parent_workspace_id: null,
      shared_task_id: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "2",
      title: "Task 2",
      status: "inprogress",
      project_id: "p1",
      description: null,
      parent_workspace_id: null,
      shared_task_id: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  ];

  const result = applyFilters(tasks, { status: "cancelled" });
  assertEquals(result.length, 0);
});

Deno.test("Integration - Filters with JSON output simulation", () => {
  const tasks = [
    {
      id: "1",
      title: "Task 1",
      status: "done",
      project_id: "p1",
      description: null,
      parent_workspace_id: null,
      shared_task_id: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "2",
      title: "Task 2",
      status: "inprogress",
      project_id: "p1",
      description: null,
      parent_workspace_id: null,
      shared_task_id: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  ];

  const result = applyFilters(tasks, { status: "done" });
  const jsonOutput = JSON.stringify(result, null, 2);

  // Verify JSON is valid and contains expected data
  const parsed = JSON.parse(jsonOutput);
  assertEquals(parsed.length, 1);
  assertEquals(parsed[0].status, "done");
});
