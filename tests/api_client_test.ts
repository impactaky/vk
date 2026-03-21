import { assertEquals, assertExists } from "@std/assert";
import { ApiClient } from "../src/api/client.ts";
import type { CreateAndStartWorkspaceRequest } from "../src/api/types.ts";

Deno.test("ApiClient - constructor strips trailing slash", () => {
  const client = new ApiClient("http://localhost:3000/");
  // @ts-ignore - accessing private field for testing
  assertEquals(client.baseUrl, "http://localhost:3000");
});

Deno.test("ApiClient - constructor preserves URL without trailing slash", () => {
  const client = new ApiClient("http://localhost:3000");
  // @ts-ignore - accessing private field for testing
  assertEquals(client.baseUrl, "http://localhost:3000");
});

Deno.test("ApiClient - listWorkspaces falls back to /workspaces when task-attempts is unavailable", async () => {
  const server = Deno.serve({ hostname: "127.0.0.1", port: 0 }, (request) => {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/task-attempts") {
      return new Response("<!DOCTYPE html><html></html>", {
        status: 200,
        headers: { "content-type": "text/html" },
      });
    }

    if (pathname === "/api/workspaces") {
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

    assertEquals(workspaces.length, 1);
    assertEquals(workspaces[0].id, "ws-1");
  } finally {
    await server.shutdown();
  }
});

Deno.test("ApiClient - createWorkspace falls back to /workspaces when task-attempts is unavailable", async () => {
  const requestBody: CreateAndStartWorkspaceRequest = {
    prompt: "test prompt",
    executor_config: { executor: "CLAUDE_CODE", variant: "DEFAULT" },
    repos: [{ repo_id: "repo-1", target_branch: "main" }],
  };

  let workspaceEndpointMethod = "";
  let workspaceEndpointBody = "";

  const server = Deno.serve(
    { hostname: "127.0.0.1", port: 0 },
    async (request) => {
      const { pathname } = new URL(request.url);
      if (pathname === "/api/task-attempts/create-and-start") {
        return new Response("<!DOCTYPE html><html></html>", {
          status: 200,
          headers: { "content-type": "text/html" },
        });
      }

      if (pathname === "/api/workspaces/create-and-start") {
        workspaceEndpointMethod = request.method;
        workspaceEndpointBody = await request.text();

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

    assertEquals(workspaceEndpointMethod, "POST");
    assertEquals(workspaceEndpointBody, JSON.stringify(requestBody));
    assertEquals(result.workspace.id, "ws-1");
    assertExists(result.execution_process);
    assertEquals(result.execution_process.id, "proc-1");
  } finally {
    await server.shutdown();
  }
});

Deno.test("ApiClient - createWorkspace falls back to /workspaces on 405 from task-attempts endpoint", async () => {
  const requestBody: CreateAndStartWorkspaceRequest = {
    prompt: "test prompt",
    executor_config: { executor: "CLAUDE_CODE", variant: "DEFAULT" },
    repos: [{ repo_id: "repo-1", target_branch: "main" }],
  };

  let workspaceEndpointMethod = "";
  let workspaceEndpointBody = "";

  const server = Deno.serve(
    { hostname: "127.0.0.1", port: 0 },
    async (request) => {
      const { pathname } = new URL(request.url);
      if (pathname === "/api/task-attempts/create-and-start") {
        return new Response("", { status: 405 });
      }

      if (pathname === "/api/workspaces/create-and-start") {
        workspaceEndpointMethod = request.method;
        workspaceEndpointBody = await request.text();

        return Response.json({
          success: true,
          data: {
            workspace: {
              id: "ws-405",
              branch: "feature/test",
              name: "Workspace 405",
            },
            execution_process: { id: "proc-405" },
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

    assertEquals(workspaceEndpointMethod, "POST");
    assertEquals(workspaceEndpointBody, JSON.stringify(requestBody));
    assertEquals(result.workspace.id, "ws-405");
    assertExists(result.execution_process);
    assertEquals(result.execution_process.id, "proc-405");
  } finally {
    await server.shutdown();
  }
});

Deno.test("ApiClient - createWorkspace falls back to /workspaces on create-and-start 400 from task-attempts endpoint", async () => {
  const requestBody: CreateAndStartWorkspaceRequest = {
    prompt: "test prompt",
    executor_config: { executor: "CLAUDE_CODE", variant: "DEFAULT" },
    repos: [{ repo_id: "repo-1", target_branch: "main" }],
  };

  let workspaceEndpointMethod = "";
  let workspaceEndpointBody = "";

  const server = Deno.serve(
    { hostname: "127.0.0.1", port: 0 },
    async (request) => {
      const { pathname } = new URL(request.url);
      if (pathname === "/api/task-attempts/create-and-start") {
        return new Response(
          "Invalid URL: Cannot parse `id` with value `create-and-start`",
          { status: 400 },
        );
      }

      if (pathname === "/api/workspaces/create-and-start") {
        workspaceEndpointMethod = request.method;
        workspaceEndpointBody = await request.text();

        return Response.json({
          success: true,
          data: {
            workspace: {
              id: "ws-400",
              branch: "feature/test",
              name: "Workspace 400",
            },
            execution_process: { id: "proc-400" },
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

    assertEquals(workspaceEndpointMethod, "POST");
    assertEquals(workspaceEndpointBody, JSON.stringify(requestBody));
    assertEquals(result.workspace.id, "ws-400");
    assertExists(result.execution_process);
    assertEquals(result.execution_process.id, "proc-400");
  } finally {
    await server.shutdown();
  }
});

Deno.test("ApiClient - createWorkspace falls back to POST /workspaces when create-and-start endpoints are unavailable", async () => {
  const requestBody: CreateAndStartWorkspaceRequest = {
    prompt: "test prompt",
    executor_config: { executor: "CLAUDE_CODE", variant: "DEFAULT" },
    repos: [{ repo_id: "repo-1", target_branch: "main" }],
  };

  let createdWorkspaceMethod = "";
  let createdWorkspaceBody = "";

  const server = Deno.serve(
    { hostname: "127.0.0.1", port: 0 },
    async (request) => {
      const { pathname } = new URL(request.url);
      if (pathname === "/api/task-attempts/create-and-start") {
        return new Response("", { status: 405 });
      }

      if (pathname === "/api/workspaces/create-and-start") {
        return new Response(
          "Invalid URL: Cannot parse `id` with value `create-and-start`",
          { status: 400 },
        );
      }

      if (pathname === "/api/workspaces") {
        createdWorkspaceMethod = request.method;
        createdWorkspaceBody = await request.text();
        return Response.json({
          success: true,
          data: {
            id: "ws-direct",
            branch: "feature/test",
            name: "Workspace direct",
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

    assertEquals(createdWorkspaceMethod, "POST");
    assertEquals(createdWorkspaceBody, JSON.stringify(requestBody));
    assertEquals(result.workspace.id, "ws-direct");
    assertEquals(result.execution_process, null);
  } finally {
    await server.shutdown();
  }
});
