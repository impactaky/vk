import { assertEquals } from "@std/assert";
import { isPathWithinRepo, ProjectResolverError } from "./project-resolver.ts";

Deno.test("ProjectResolverError - is instance of Error", () => {
  const error = new ProjectResolverError("test message");
  assertEquals(error.name, "ProjectResolverError");
  assertEquals(error.message, "test message");
  assertEquals(error instanceof Error, true);
});

Deno.test("isPathWithinRepo - exact match", () => {
  assertEquals(isPathWithinRepo("/home/user/project", "/home/user/project"), true);
});

Deno.test("isPathWithinRepo - subdirectory match", () => {
  assertEquals(isPathWithinRepo("/home/user/project/src", "/home/user/project"), true);
});

Deno.test("isPathWithinRepo - deeply nested subdirectory", () => {
  assertEquals(isPathWithinRepo("/home/user/project/src/utils/test", "/home/user/project"), true);
});

Deno.test("isPathWithinRepo - no match (different path)", () => {
  assertEquals(isPathWithinRepo("/home/user/other", "/home/user/project"), false);
});

Deno.test("isPathWithinRepo - no match (similar prefix but different)", () => {
  assertEquals(isPathWithinRepo("/home/user/project-extended", "/home/user/project"), false);
});

Deno.test("isPathWithinRepo - trailing slash on current path", () => {
  assertEquals(isPathWithinRepo("/home/user/project/", "/home/user/project"), true);
});

Deno.test("isPathWithinRepo - trailing slash on repo path", () => {
  assertEquals(isPathWithinRepo("/home/user/project", "/home/user/project/"), true);
});

Deno.test("isPathWithinRepo - multiple trailing slashes", () => {
  assertEquals(isPathWithinRepo("/home/user/project///", "/home/user/project//"), true);
});

Deno.test("isPathWithinRepo - null repo path returns false", () => {
  assertEquals(isPathWithinRepo("/home/user/project", null), false);
});

Deno.test("isPathWithinRepo - undefined repo path returns false", () => {
  assertEquals(isPathWithinRepo("/home/user/project", undefined), false);
});
