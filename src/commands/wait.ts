import { Command } from "@cliffy/command";
import { connect } from "nats.deno";
import { handleCliError } from "../utils/error-handler.ts";
import {
  notificationStream,
  resolveNatsConnectionOptions,
  waitForBranchNotification,
} from "../utils/nats-notify.ts";
const DEFAULT_TIMEOUT_SECONDS = 300;

export const waitCommand = new Command()
  .arguments("<branch:string>")
  .description("Wait for a vk.notify message matching a branch name")
  .option("--host <host:string>", "NATS host (default: localhost)")
  .option("--port <port:number>", "NATS port (default: 4222)")
  .option(
    "--subject <subject:string>",
    "NATS subject (default: vk.notify)",
  )
  .option(
    "--timeout <seconds:number>",
    `Max seconds to wait (default: ${DEFAULT_TIMEOUT_SECONDS})`,
  )
  .action(async (options, branch) => {
    let timeoutId: number | undefined;

    try {
      const { host, port, subject } = await resolveNatsConnectionOptions(
        options,
      );
      const timeoutSeconds = options.timeout ?? DEFAULT_TIMEOUT_SECONDS;
      const timeoutMs = timeoutSeconds * 1000;

      const nc = await connect({ servers: [`nats://${host}:${port}`] });

      try {
        const sub = nc.subscribe(subject);
        const waitPromise = waitForBranchNotification(
          notificationStream(sub),
          branch,
        );
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
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });
