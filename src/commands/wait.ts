import { Command } from "@cliffy/command";
import { connect } from "nats.deno";
import { loadConfig } from "../api/config.ts";

const DEFAULT_NATS_HOST = "localhost";
const DEFAULT_NATS_PORT = 4222;
const DEFAULT_NATS_SUBJECT = "vk.notify";
const DEFAULT_TIMEOUT_SECONDS = 300;

export async function waitForBranchNotification(
  branches: AsyncIterable<string>,
  targetBranch: string,
): Promise<void> {
  for await (const branch of branches) {
    if (branch === targetBranch) {
      return;
    }
  }

  throw new Error(
    `Subscription ended before receiving branch "${targetBranch}" notification.`,
  );
}

export const waitCommand = new Command()
  .arguments("<branch:string>")
  .description("Wait for a vk.notify message matching a branch name")
  .option("--host <host:string>", `NATS host (default: ${DEFAULT_NATS_HOST})`)
  .option("--port <port:number>", `NATS port (default: ${DEFAULT_NATS_PORT})`)
  .option(
    "--subject <subject:string>",
    `NATS subject (default: ${DEFAULT_NATS_SUBJECT})`,
  )
  .option(
    "--timeout <seconds:number>",
    `Max seconds to wait (default: ${DEFAULT_TIMEOUT_SECONDS})`,
  )
  .action(async (options, branch) => {
    let timeoutId: number | undefined;

    const config = await loadConfig();
    const host = options.host || config.natsHost || DEFAULT_NATS_HOST;
    const port = options.port || config.natsPort || DEFAULT_NATS_PORT;
    const subject = options.subject || config.natsSubject ||
      DEFAULT_NATS_SUBJECT;
    const timeoutSeconds = options.timeout ?? DEFAULT_TIMEOUT_SECONDS;
    const timeoutMs = timeoutSeconds * 1000;

    const nc = await connect({ servers: [`nats://${host}:${port}`] });

    try {
      const sub = nc.subscribe(subject);
      const decoder = new TextDecoder();

      const branches = (async function* (): AsyncGenerator<string> {
        for await (const message of sub) {
          yield decoder.decode(message.data).trim();
        }
      })();

      const waitPromise = waitForBranchNotification(branches, branch);
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          sub.unsubscribe();
          reject(
            new Error(
              `Timed out waiting ${timeoutSeconds}s for branch "${branch}" on subject "${subject}".`,
            ),
          );
        }, timeoutMs);
      });

      await Promise.race([waitPromise, timeoutPromise]);
      sub.unsubscribe();
    } finally {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
      await nc.close();
    }

    console.log(
      `Received branch "${branch}" notification on subject "${subject}" at nats://${host}:${port}`,
    );
  });
