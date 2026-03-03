import { Command } from "@cliffy/command";
import { connect } from "nats.deno";
import { loadConfig } from "../api/config.ts";
import { getCurrentBranch } from "../utils/git.ts";
import { handleCliError } from "../utils/error-handler.ts";

const DEFAULT_NATS_HOST = "localhost";
const DEFAULT_NATS_PORT = 4222;
const DEFAULT_NATS_SUBJECT = "vibekanban.notify";

export const notifyCommand = new Command()
  .description("Publish the current git branch to NATS")
  .option("--host <host:string>", `NATS host (default: ${DEFAULT_NATS_HOST})`)
  .option("--port <port:number>", `NATS port (default: ${DEFAULT_NATS_PORT})`)
  .option(
    "--subject <subject:string>",
    `NATS subject (default: ${DEFAULT_NATS_SUBJECT})`,
  )
  .action(async (options) => {
    try {
      const branch = await getCurrentBranch();
      if (!branch) {
        console.error("No current git branch detected.");
        Deno.exit(1);
      }

      const config = await loadConfig();
      const host = options.host || config.natsHost || DEFAULT_NATS_HOST;
      const port = options.port || config.natsPort || DEFAULT_NATS_PORT;
      const subject = options.subject || config.natsSubject ||
        DEFAULT_NATS_SUBJECT;

      const nc = await connect({ servers: [`nats://${host}:${port}`] });

      try {
        nc.publish(subject, new TextEncoder().encode(branch));
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
