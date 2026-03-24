import type { Workspace } from "../api/types.ts";
import { applyFilters } from "./filter.ts";

const WORKSPACE_FILTER_KEYS = new Set([
  "id",
  "task_id",
  "branch",
  "container_ref",
  "agent_working_dir",
  "setup_completed_at",
  "created_at",
  "updated_at",
  "archived",
  "pinned",
  "name",
  "worktree_deleted",
  "status",
]);

const BOOLEAN_FILTER_KEYS = new Set([
  "archived",
  "pinned",
  "worktree_deleted",
]);

const WORKSPACE_STATUS_VALUES = new Set([
  "active",
  "archived",
  "pinned",
  "ready",
  "pending",
  "deleted",
]);

export type WorkspaceListFilters = Record<string, unknown>;

function parseBooleanFilterValue(key: string, rawValue: string): boolean {
  if (rawValue === "true") {
    return true;
  }

  if (rawValue === "false") {
    return false;
  }

  throw new Error(
    `Invalid value for filter "${key}": "${rawValue}". Expected true or false.`,
  );
}

function parseWorkspaceFilterValue(key: string, rawValue: string): unknown {
  if (BOOLEAN_FILTER_KEYS.has(key)) {
    return parseBooleanFilterValue(key, rawValue);
  }

  if (key === "status") {
    const normalized = rawValue.toLowerCase();
    if (!WORKSPACE_STATUS_VALUES.has(normalized)) {
      throw new Error(
        `Invalid value for filter "status": "${rawValue}". Expected one of: ${
          Array.from(WORKSPACE_STATUS_VALUES).join(", ")
        }.`,
      );
    }
    return normalized;
  }

  return rawValue;
}

function appendFilterValue(
  filters: WorkspaceListFilters,
  key: string,
  value: unknown,
): void {
  const existing = filters[key];

  if (existing === undefined) {
    filters[key] = value;
    return;
  }

  if (Array.isArray(existing)) {
    existing.push(value);
    return;
  }

  filters[key] = [existing, value];
}

export function parseWorkspaceListFilters(
  expressions: string[] = [],
): WorkspaceListFilters {
  const filters: WorkspaceListFilters = {};

  for (const expression of expressions) {
    const separatorIndex = expression.indexOf("=");
    if (separatorIndex <= 0 || separatorIndex === expression.length - 1) {
      throw new Error(
        `Invalid filter "${expression}". Expected format key=value.`,
      );
    }

    const key = expression.slice(0, separatorIndex).trim();
    const rawValue = expression.slice(separatorIndex + 1).trim();

    if (!WORKSPACE_FILTER_KEYS.has(key)) {
      throw new Error(
        `Unsupported filter "${key}". Supported filters: ${
          Array.from(WORKSPACE_FILTER_KEYS).join(", ")
        }.`,
      );
    }

    appendFilterValue(filters, key, parseWorkspaceFilterValue(key, rawValue));
  }

  return filters;
}

function matchesWorkspaceStatus(
  workspace: Workspace,
  status: string,
): boolean {
  switch (status) {
    case "active":
      return !workspace.archived && workspace.worktree_deleted !== true;
    case "archived":
      return workspace.archived;
    case "pinned":
      return workspace.pinned;
    case "ready":
      return workspace.setup_completed_at !== null;
    case "pending":
      return workspace.setup_completed_at === null;
    case "deleted":
      return workspace.worktree_deleted === true;
    default:
      return false;
  }
}

export function applyWorkspaceListFilters(
  workspaces: Workspace[],
  filters: WorkspaceListFilters,
): Workspace[] {
  const { status, ...genericFilters } = filters;
  let filtered = applyFilters(workspaces, genericFilters);

  if (status === undefined) {
    return filtered;
  }

  const statuses = Array.isArray(status) ? status : [status];
  filtered = filtered.filter((workspace) =>
    statuses.some((value) => matchesWorkspaceStatus(workspace, String(value)))
  );

  return filtered;
}
