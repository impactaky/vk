import { assertEquals } from "@std/assert";
import { extractGitUrlBasename } from "../src/utils/git.ts";

// Test the basename matching logic used in project resolver
Deno.test("project basename matching - exact match", () => {
  const projectUrl = "https://github.com/impactaky/vk.git";
  const localBasename = "vk";

  const projectBasename = extractGitUrlBasename(projectUrl);
  assertEquals(projectBasename, localBasename);
});

Deno.test("project basename matching - different hosts same name", () => {
  const projectUrl = "https://gitlab.com/other/vk.git";
  const localBasename = "vk";

  const projectBasename = extractGitUrlBasename(projectUrl);
  assertEquals(projectBasename, localBasename);
});

Deno.test("project basename matching - no match", () => {
  const projectUrl = "https://github.com/user/different-repo.git";
  const localBasename = "vk";

  const projectBasename = extractGitUrlBasename(projectUrl);
  assertEquals(projectBasename !== localBasename, true);
});
