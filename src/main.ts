import { Command } from "@cliffy/command";
import { CompletionsCommand } from "@cliffy/command/completions";
import { organizationCommand } from "./commands/organization.ts";
import { configCommand } from "./commands/config.ts";
import { repositoryCommand } from "./commands/repository.ts";
import { taskAttemptsCommand } from "./commands/task-attempts.ts";
import { notifyCommand } from "./commands/notify.ts";
import { waitCommand } from "./commands/wait.ts";
import { generateAIHelp } from "./utils/ai-help.ts";
import { reportCliError } from "./utils/error-handler.ts";
import { setVerbose } from "./utils/verbose.ts";

const VERSION = "0.1.0";

const cli = new Command()
  .name("vk")
  .version(VERSION)
  .description("CLI for vibe-kanban")
  .option("--ai", "Output AI-friendly CLI documentation as JSON")
  .globalOption(
    "-v, --verbose",
    "Show detailed API request/response information",
  )
  .command("organization", organizationCommand)
  .command("repository", repositoryCommand)
  .command("workspace", taskAttemptsCommand)
  .command("config", configCommand)
  .command("notify", notifyCommand)
  .command("wait", waitCommand)
  .command("completions", new CompletionsCommand());

async function runCli(args: string[]): Promise<number> {
  if (args.includes("--ai")) {
    const help = generateAIHelp(cli, VERSION);
    console.log(JSON.stringify(help, null, 2));
    return 0;
  }

  if (args.includes("-v") || args.includes("--verbose")) {
    setVerbose(true);
  }

  await cli.parse(args);
  return 0;
}

try {
  Deno.exit(await runCli(Deno.args));
} catch (error) {
  const exitCode = reportCliError(error);
  if (exitCode !== undefined) {
    Deno.exit(exitCode);
  }
  throw error;
}
