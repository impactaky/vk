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
