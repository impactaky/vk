import { assertEquals } from "@std/assert";
import {
  extractRepoBasename,
  getGitRemoteUrlFromPath,
  getRepoBasenameFromPath,
} from "./git.ts";

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

// Tests for getGitRemoteUrlFromPath
Deno.test("getGitRemoteUrlFromPath - valid git repo returns URL", async () => {
  // Use current directory which should be a git repo
  const url = await getGitRemoteUrlFromPath(Deno.cwd());
  // Should return some URL (actual value depends on environment)
  // Just verify it returns a non-empty string or null
  if (url !== null) {
    assertEquals(typeof url, "string");
    assertEquals(url.length > 0, true);
  }
});

Deno.test("getGitRemoteUrlFromPath - non-git directory returns null", async () => {
  // /tmp is typically not a git repo
  const url = await getGitRemoteUrlFromPath("/tmp");
  assertEquals(url, null);
});

Deno.test("getGitRemoteUrlFromPath - non-existent path returns null", async () => {
  const url = await getGitRemoteUrlFromPath("/non/existent/path/that/does/not/exist");
  assertEquals(url, null);
});

// Tests for getRepoBasenameFromPath
Deno.test("getRepoBasenameFromPath - valid git repo returns basename", async () => {
  // Use current directory which should be a git repo
  const basename = await getRepoBasenameFromPath(Deno.cwd());
  // Should return some basename (actual value depends on environment)
  if (basename !== null) {
    assertEquals(typeof basename, "string");
    assertEquals(basename.length > 0, true);
  }
});

Deno.test("getRepoBasenameFromPath - non-git directory returns null", async () => {
  const basename = await getRepoBasenameFromPath("/tmp");
  assertEquals(basename, null);
});

Deno.test("getRepoBasenameFromPath - non-existent path returns null", async () => {
  const basename = await getRepoBasenameFromPath("/non/existent/path/that/does/not/exist");
  assertEquals(basename, null);
});
