import { Command } from "@cliffy/command";
import { CompletionsCommand } from "@cliffy/command/completions";
import { projectCommand } from "./commands/project.ts";
import { taskCommand } from "./commands/task.ts";
import { configCommand } from "./commands/config.ts";
import { attemptCommand } from "./commands/attempt.ts";

const VERSION = "0.1.0";

await new Command()
  .name("vk")
  .version(VERSION)
  .description("CLI for vibe-kanban - manage projects and tasks")
  .command("project", projectCommand)
  .command("task", taskCommand)
  .command("attempt", attemptCommand)
  .command("config", configCommand)
  .command("completions", new CompletionsCommand())
  .parse(Deno.args);
