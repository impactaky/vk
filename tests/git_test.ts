import { assertEquals } from "@std/assert";
import { extractGitUrlBasename } from "../src/utils/git.ts";

Deno.test("extractGitUrlBasename - HTTPS URL with .git suffix", () => {
  const result = extractGitUrlBasename("https://github.com/user/repo-name.git");
  assertEquals(result, "repo-name");
});

Deno.test("extractGitUrlBasename - HTTPS URL without .git suffix", () => {
  const result = extractGitUrlBasename("https://github.com/user/repo-name");
  assertEquals(result, "repo-name");
});

Deno.test("extractGitUrlBasename - SSH URL with .git suffix", () => {
  const result = extractGitUrlBasename("git@github.com:user/repo-name.git");
  assertEquals(result, "repo-name");
});

Deno.test("extractGitUrlBasename - SSH URL without .git suffix", () => {
  const result = extractGitUrlBasename("git@github.com:user/repo-name");
  assertEquals(result, "repo-name");
});

Deno.test("extractGitUrlBasename - GitLab URL", () => {
  const result = extractGitUrlBasename(
    "https://gitlab.com/org/group/project.git",
  );
  assertEquals(result, "project");
});

Deno.test("extractGitUrlBasename - Simple repo name", () => {
  const result = extractGitUrlBasename("https://github.com/impactaky/vk.git");
  assertEquals(result, "vk");
});
