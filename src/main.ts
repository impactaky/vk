import { Command } from "@cliffy/command";
import { CompletionsCommand } from "@cliffy/command/completions";

if (import.meta.main) {
  const command = new Command()
    .name("vk")
    .version("0.1.0")
    .description("CLI for vibe-kanban")
    .command("completions", new CompletionsCommand());

  await command.parse(Deno.args);
}
