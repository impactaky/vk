import { assertEquals } from "@std/assert";
import { formatProject } from "./fzf.ts";
import type { Project } from "../api/types.ts";

Deno.test("formatProject formats project correctly", () => {
  const project: Project = {
    id: "proj-123",
    name: "Test Project",
    default_agent_working_dir: "/path/to/dir",
    remote_project_id: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  const result = formatProject(project);
  assertEquals(result, "proj-123\tTest Project\t/path/to/dir");
});

Deno.test("formatProject formats project with null working dir", () => {
  const project: Project = {
    id: "proj-123",
    name: "Test Project",
    default_agent_working_dir: null,
    remote_project_id: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  const result = formatProject(project);
  assertEquals(result, "proj-123\tTest Project\t-");
});
