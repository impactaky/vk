import { assertEquals, assertThrows } from "@std/assert";
import {
  applyWorkspaceListFilters,
  parseWorkspaceListFilters,
} from "./workspace-list-filters.ts";
import type { Workspace } from "../api/types.ts";

function createWorkspace(overrides: Partial<Workspace> = {}): Workspace {
  return {
    id: "ws-1",
    task_id: "task-1",
    container_ref: null,
    branch: "feature/test",
    agent_working_dir: null,
    setup_completed_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    archived: false,
    pinned: false,
    name: "Workspace 1",
    ...overrides,
  };
}

Deno.test("parseWorkspaceListFilters parses booleans and repeated filters", () => {
  const filters = parseWorkspaceListFilters([
    "archived=true",
    "status=ready",
    "status=pinned",
  ]);

  assertEquals(filters, {
    archived: true,
    status: ["ready", "pinned"],
  });
});

Deno.test("parseWorkspaceListFilters rejects unsupported keys", () => {
  assertThrows(
    () => parseWorkspaceListFilters(["unknown=value"]),
    Error,
    'Unsupported filter "unknown"',
  );
});

Deno.test("parseWorkspaceListFilters rejects invalid boolean values", () => {
  assertThrows(
    () => parseWorkspaceListFilters(["archived=yes"]),
    Error,
    'Invalid value for filter "archived"',
  );
});

Deno.test("applyWorkspaceListFilters supports generic and derived status filters", () => {
  const workspaces = [
    createWorkspace({
      id: "ws-ready",
      setup_completed_at: "2026-01-02T00:00:00Z",
    }),
    createWorkspace({
      id: "ws-pending",
      setup_completed_at: null,
    }),
    createWorkspace({
      id: "ws-archived",
      archived: true,
      setup_completed_at: "2026-01-02T00:00:00Z",
    }),
  ];

  const filters = parseWorkspaceListFilters([
    "status=ready",
    "status=archived",
  ]);

  const result = applyWorkspaceListFilters(workspaces, filters);

  assertEquals(result.map((workspace) => workspace.id), [
    "ws-ready",
    "ws-archived",
  ]);
});
