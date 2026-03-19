import { assertEquals } from "@std/assert";
import { ApiClient } from "../src/api/client.ts";

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
