import { assertRejects } from "@std/assert";
import { waitForBranchNotification } from "../utils/nats-notify.ts";

Deno.test("waitForBranchNotification resolves when target branch is seen", async () => {
  const notifications = (async function* () {
    yield { type: "branch" as const, branch: "feature/one" };
    yield { type: "branch" as const, branch: "feature/two" };
    yield { type: "branch" as const, branch: "feature/target" };
  })();

  await waitForBranchNotification(notifications, "feature/target");
});

Deno.test("waitForBranchNotification rejects when stream ends before target", async () => {
  const notifications = (async function* () {
    yield { type: "branch" as const, branch: "feature/one" };
    yield { type: "branch" as const, branch: "feature/two" };
  })();

  await assertRejects(
    async () => {
      await waitForBranchNotification(notifications, "feature/missing");
    },
    Error,
    'Subscription ended before receiving branch "feature/missing" notification.',
  );
});
