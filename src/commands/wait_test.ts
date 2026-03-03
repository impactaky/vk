import { assertRejects } from "@std/assert";
import { waitForBranchNotification } from "./wait.ts";

Deno.test("waitForBranchNotification resolves when target branch is seen", async () => {
  const branches = (async function* () {
    yield "feature/one";
    yield "feature/two";
    yield "feature/target";
  })();

  await waitForBranchNotification(branches, "feature/target");
});

Deno.test("waitForBranchNotification rejects when stream ends before target", async () => {
  const branches = (async function* () {
    yield "feature/one";
    yield "feature/two";
  })();

  await assertRejects(
    async () => {
      await waitForBranchNotification(branches, "feature/missing");
    },
    Error,
    'Subscription ended before receiving branch "feature/missing" notification.',
  );
});
