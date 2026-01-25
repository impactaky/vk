// deno-lint-ignore-file no-explicit-any
import type { Command } from "@cliffy/command";

// Use any for Command generic parameters due to Cliffy's complex type system
type AnyCommand = Command<any, any, any, any, any, any, any, any>;

export interface ArgumentInfo {
  name: string;
  type: string;
  required: boolean;
  variadic: boolean;
}

export interface OptionInfo {
  name: string;
  flags: string[];
  type: string;
  required: boolean;
  description: string;
  default?: unknown;
}

export interface CommandInfo {
  name: string;
  description: string;
  usage: string;
  arguments: ArgumentInfo[];
  options: OptionInfo[];
  subcommands?: CommandInfo[];
}

export interface AIHelpOutput {
  name: string;
  description: string;
  version: string;
  commands: CommandInfo[];
}

function extractArguments(command: AnyCommand): ArgumentInfo[] {
  const args = command.getArguments();
  return args.map((arg) => ({
    name: arg.name,
    type: arg.type || "string",
    required: !arg.optional,
    variadic: arg.variadic || false,
  }));
}

function extractOptions(command: AnyCommand): OptionInfo[] {
  const options = command.getOptions();
  return options
    .filter((opt) => !opt.hidden)
    .map((opt) => {
      const result: OptionInfo = {
        name: opt.name,
        flags: opt.flags,
        type: opt.args.length > 0 ? (opt.args[0].type || "string") : "boolean",
        required: opt.required || false,
        description: opt.description || "",
      };
      if (opt.default !== undefined) {
        result.default = opt.default;
      }
      return result;
    });
}

function buildUsage(command: AnyCommand, path: string[]): string {
  const parts = ["vk", ...path];
  const args = command.getArguments();
  const hasOptions = command.getOptions().length > 0;
  const hasSubcommands = command.getCommands().length > 0;

  if (hasSubcommands) {
    parts.push("<command>");
  }

  for (const arg of args) {
    const name = arg.variadic ? `${arg.name}...` : arg.name;
    parts.push(arg.optional ? `[${name}]` : `<${name}>`);
  }

  if (hasOptions) {
    parts.push("[options]");
  }

  return parts.join(" ");
}

function extractCommand(command: AnyCommand, path: string[] = []): CommandInfo {
  const name = path.length > 0 ? path[path.length - 1] : command.getName();
  const subcommands = command.getCommands();

  const result: CommandInfo = {
    name,
    description: command.getDescription() || "",
    usage: buildUsage(command, path),
    arguments: extractArguments(command),
    options: extractOptions(command),
  };

  if (subcommands.length > 0) {
    result.subcommands = subcommands
      .filter((sub) => !sub.getName().startsWith("_"))
      .map((sub) => extractCommand(sub, [...path, sub.getName()]));
  }

  return result;
}

export function generateAIHelp(
  rootCommand: AnyCommand,
  version: string,
): AIHelpOutput {
  const commands = rootCommand.getCommands()
    .filter((cmd) => !cmd.getName().startsWith("_"))
    .map((cmd) => extractCommand(cmd, [cmd.getName()]));

  return {
    name: rootCommand.getName(),
    description: rootCommand.getDescription() || "",
    version,
    commands,
  };
}
