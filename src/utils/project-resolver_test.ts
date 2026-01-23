import { assertEquals } from "@std/assert";
import { ProjectResolverError } from "./project-resolver.ts";

Deno.test("ProjectResolverError - is instance of Error", () => {
  const error = new ProjectResolverError("test message");
  assertEquals(error.name, "ProjectResolverError");
  assertEquals(error.message, "test message");
  assertEquals(error instanceof Error, true);
});
