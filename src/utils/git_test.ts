import { assertEquals } from "@std/assert";
import { extractRepoBasename } from "./git.ts";

Deno.test("extractRepoBasename - HTTPS URL with .git", () => {
  const result = extractRepoBasename(
    "https://github.com/BloopAI/vibe-kanban.git",
  );
  assertEquals(result, "vibe-kanban");
});

Deno.test("extractRepoBasename - HTTPS URL without .git", () => {
  const result = extractRepoBasename("https://github.com/BloopAI/vibe-kanban");
  assertEquals(result, "vibe-kanban");
});

Deno.test("extractRepoBasename - SSH URL with .git", () => {
  const result = extractRepoBasename("git@github.com:BloopAI/vibe-kanban.git");
  assertEquals(result, "vibe-kanban");
});

Deno.test("extractRepoBasename - SSH URL without .git", () => {
  const result = extractRepoBasename("git@github.com:BloopAI/vibe-kanban");
  assertEquals(result, "vibe-kanban");
});

Deno.test("extractRepoBasename - local path", () => {
  const result = extractRepoBasename("/home/user/projects/vibe-kanban");
  assertEquals(result, "vibe-kanban");
});

Deno.test("extractRepoBasename - local path with .git", () => {
  const result = extractRepoBasename("/home/user/projects/vibe-kanban.git");
  assertEquals(result, "vibe-kanban");
});

Deno.test("extractRepoBasename - URL with trailing slash", () => {
  const result = extractRepoBasename("https://github.com/BloopAI/vibe-kanban/");
  assertEquals(result, "vibe-kanban");
});

Deno.test("extractRepoBasename - GitLab SSH URL", () => {
  const result = extractRepoBasename(
    "git@gitlab.com:group/subgroup/project.git",
  );
  assertEquals(result, "project");
});
