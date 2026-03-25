import { Command } from "@cliffy/command";
import { connect } from "nats.deno";
import { getCurrentBranch } from "../utils/git.ts";
import { handleCliError } from "../utils/error-handler.ts";
import {
  encodeNotification,
  resolveNatsConnectionOptions,
} from "../utils/nats-notify.ts";

export const notifyCommand = new Command()
  .description("Publish the current git branch to NATS")
  .option("--host <host:string>", "NATS host (default: localhost)")
  .option("--port <port:number>", "NATS port (default: 4222)")
  .option(
    "--subject <subject:string>",
    "NATS subject (default: vk.notify)",
  )
  .action(async (options) => {
    try {
      const branch = await getCurrentBranch();
      if (!branch) {
        console.error("No current git branch detected.");
        Deno.exit(1);
      }

      const { host, port, subject } = await resolveNatsConnectionOptions(
        options,
      );

      const nc = await connect({ servers: [`nats://${host}:${port}`] });

      try {
        nc.publish(subject, encodeNotification({ type: "branch", branch }));
        await nc.flush();
      } finally {
        await nc.close();
      }

      console.log(
        `Published branch "${branch}" to subject "${subject}" at nats://${host}:${port}`,
      );
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });
