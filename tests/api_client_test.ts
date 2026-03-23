import { assertEquals, assertExists } from "@std/assert";
import { ApiClient } from "../src/api/client.ts";
import type { CreateAndStartWorkspaceRequest } from "../src/api/types.ts";

Deno.test("ApiClient - constructor strips trailing slash", () => {
  const client = new ApiClient("http://localhost:3000/");
  // @ts-ignore private field access for test coverage
  assertEquals(client.baseUrl, "http://localhost:3000");
});

Deno.test("ApiClient - constructor preserves URL without trailing slash", () => {
  const client = new ApiClient("http://localhost:3000");
  // @ts-ignore private field access for test coverage
  assertEquals(client.baseUrl, "http://localhost:3000");
});

Deno.test("ApiClient - listWorkspaces uses latest /api/workspaces endpoint", async () => {
  let requestedPath = "";

  const server = Deno.serve({ hostname: "127.0.0.1", port: 0 }, (request) => {
    requestedPath = new URL(request.url).pathname;
    if (requestedPath === "/api/workspaces") {
      return Response.json({
        success: true,
        data: [{ id: "ws-1", branch: "feature/test", name: "Workspace 1" }],
      });
    }

    return new Response("Not found", { status: 404 });
  });

  try {
    const address = server.addr as Deno.NetAddr;
    const client = new ApiClient(`http://127.0.0.1:${address.port}`);

    const workspaces = await client.listWorkspaces();

    assertEquals(requestedPath, "/api/workspaces");
    assertEquals(workspaces.length, 1);
    assertEquals(workspaces[0].id, "ws-1");
  } finally {
    await server.shutdown();
  }
});

Deno.test("ApiClient - createWorkspace uses latest /api/workspaces/start endpoint", async () => {
  const requestBody: CreateAndStartWorkspaceRequest = {
    prompt: "test prompt",
    executor_config: { executor: "CLAUDE_CODE", variant: "DEFAULT" },
    repos: [{ repo_id: "repo-1", target_branch: "main" }],
  };

  let requestMethod = "";
  let requestPath = "";
  let requestPayload = "";

  const server = Deno.serve(
    { hostname: "127.0.0.1", port: 0 },
    async (request) => {
      requestMethod = request.method;
      requestPath = new URL(request.url).pathname;
      requestPayload = await request.text();

      if (requestPath === "/api/workspaces/start") {
        return Response.json({
          success: true,
          data: {
            workspace: {
              id: "ws-1",
              branch: "feature/test",
              name: "Workspace 1",
            },
            execution_process: { id: "proc-1" },
          },
        });
      }

      return new Response("Not found", { status: 404 });
    },
  );

  try {
    const address = server.addr as Deno.NetAddr;
    const client = new ApiClient(`http://127.0.0.1:${address.port}`);

    const result = await client.createWorkspace(requestBody);

    assertEquals(requestMethod, "POST");
    assertEquals(requestPath, "/api/workspaces/start");
    assertEquals(requestPayload, JSON.stringify(requestBody));
    assertEquals(result.workspace.id, "ws-1");
    assertExists(result.execution_process);
    assertEquals(result.execution_process.id, "proc-1");
  } finally {
    await server.shutdown();
  }
});

Deno.test("ApiClient - organization endpoints use /v1 namespace and latest wrappers", async () => {
  const requests: string[] = [];

  const server = Deno.serve({ hostname: "127.0.0.1", port: 0 }, (request) => {
    const pathname = new URL(request.url).pathname;
    requests.push(pathname);

    if (pathname === "/v1/organizations") {
      return Response.json({
        success: true,
        data: {
          organizations: [{
            id: "org-1",
            name: "Acme",
            slug: "acme",
            user_role: "owner",
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-02T00:00:00Z",
          }],
        },
      });
    }

    if (pathname === "/v1/organizations/org-1") {
      return Response.json({
        success: true,
        data: {
          organization: {
            id: "org-1",
            name: "Acme",
            slug: "acme",
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-02T00:00:00Z",
          },
          user_role: "owner",
        },
      });
    }

    return new Response("Not found", { status: 404 });
  });

  try {
    const address = server.addr as Deno.NetAddr;
    const client = new ApiClient(`http://127.0.0.1:${address.port}`);

    const organizations = await client.listOrganizations();
    const organization = await client.getOrganization("org-1");

    assertEquals(requests, ["/v1/organizations", "/v1/organizations/org-1"]);
    assertEquals(organizations[0].id, "org-1");
    assertEquals(organizations[0].slug, "acme");
    assertEquals(organization.id, "org-1");
    assertEquals(organization.slug, "acme");
  } finally {
    await server.shutdown();
  }
});

Deno.test("ApiClient - workspace git and pull-request operations use latest nested routes", async () => {
  const requests: Array<{ method: string; path: string }> = [];

  const server = Deno.serve(
    { hostname: "127.0.0.1", port: 0 },
    async (request) => {
      const url = new URL(request.url);
      requests.push({ method: request.method, path: `${url.pathname}${url.search}` });

      switch (url.pathname) {
        case "/api/workspaces/ws-1/git/branch":
          return Response.json({
            success: true,
            data: { branch: "feature/renamed" },
          });
        case "/api/workspaces/ws-1/git/status":
          return Response.json({ success: true, data: [] });
        case "/api/workspaces/ws-1/git/merge":
        case "/api/workspaces/ws-1/git/push":
        case "/api/workspaces/ws-1/git/rebase":
        case "/api/workspaces/ws-1/execution/stop":
          return Response.json({ success: true, data: null });
        case "/api/workspaces/ws-1/pull-requests":
          return Response.json({
            success: true,
            data: "https://github.com/acme/repo/pull/1",
          });
        case "/api/workspaces/ws-1/pull-requests/attach":
          return Response.json({
            success: true,
            data: {
              pr_attached: true,
              pr_url: "https://github.com/acme/repo/pull/1",
              pr_number: 1,
              pr_status: "open",
            },
          });
        case "/api/workspaces/ws-1/pull-requests/comments":
          return Response.json({
            success: true,
            data: { comments: [] },
          });
        default:
          return new Response("Not found", { status: 404 });
      }
    },
  );

  try {
    const address = server.addr as Deno.NetAddr;
    const client = new ApiClient(`http://127.0.0.1:${address.port}`);

    const renameResult = await client.renameBranch("ws-1", {
      new_branch_name: "feature/renamed",
    });
    await client.getBranchStatus("ws-1");
    await client.mergeWorkspace("ws-1", { repo_id: "repo-1" });
    await client.pushWorkspace("ws-1", { repo_id: "repo-1" });
    await client.rebaseWorkspace("ws-1", { repo_id: "repo-1" });
    await client.stopWorkspace("ws-1");
    const prUrl = await client.createPR("ws-1", {
      repo_id: "repo-1",
      title: "Test PR",
    });
    const attachResult = await client.attachPR("ws-1", {
      repo_id: "repo-1",
      pr_number: 1,
    });
    const comments = await client.getPRComments("ws-1", "repo-1");

    assertEquals(renameResult.branch, "feature/renamed");
    assertEquals(prUrl, "https://github.com/acme/repo/pull/1");
    assertEquals(attachResult.pr_number, 1);
    assertEquals(comments.comments.length, 0);
    assertEquals(requests, [
      { method: "PUT", path: "/api/workspaces/ws-1/git/branch" },
      { method: "GET", path: "/api/workspaces/ws-1/git/status" },
      { method: "POST", path: "/api/workspaces/ws-1/git/merge" },
      { method: "POST", path: "/api/workspaces/ws-1/git/push" },
      { method: "POST", path: "/api/workspaces/ws-1/git/rebase" },
      { method: "POST", path: "/api/workspaces/ws-1/execution/stop" },
      { method: "POST", path: "/api/workspaces/ws-1/pull-requests" },
      { method: "POST", path: "/api/workspaces/ws-1/pull-requests/attach" },
      {
        method: "GET",
        path: "/api/workspaces/ws-1/pull-requests/comments?repo_id=repo-1",
      },
    ]);
  } finally {
    await server.shutdown();
  }
});
