import { Command } from "@cliffy/command";
import { CompletionsCommand } from "@cliffy/command/completions";
import { projectCommand } from "./commands/project.ts";
import { organizationCommand } from "./commands/organization.ts";
import { taskCommand } from "./commands/task.ts";
import { configCommand } from "./commands/config.ts";
import { attemptCommand } from "./commands/attempt.ts";
import { repositoryCommand } from "./commands/repository.ts";
import { sessionCommand } from "./commands/session.ts";
import { generateAIHelp } from "./utils/ai-help.ts";
import { setVerbose } from "./utils/verbose.ts";

const VERSION = "0.1.0";

const cli = new Command()
  .name("vk")
  .version(VERSION)
  .description("CLI for vibe-kanban - manage projects and tasks")
  .option("--ai", "Output AI-friendly CLI documentation as JSON")
  .globalOption(
    "-v, --verbose",
    "Show detailed API request/response information",
  )
  .command("project", projectCommand)
  .command("organization", organizationCommand)
  .command("task", taskCommand)
  .command("attempt", attemptCommand)
  .command("session", sessionCommand)
  .command("repository", repositoryCommand)
  .command("config", configCommand)
  .command("completions", new CompletionsCommand());

// Handle --ai flag before normal parsing
if (Deno.args.includes("--ai")) {
  const help = generateAIHelp(cli, VERSION);
  console.log(JSON.stringify(help, null, 2));
  Deno.exit(0);
}

// Handle --verbose flag before normal parsing
if (Deno.args.includes("-v") || Deno.args.includes("--verbose")) {
  setVerbose(true);
}

await cli.parse(Deno.args);
