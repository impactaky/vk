# CLI Framework

## ADDED Requirements

### Requirement: Use Cliffy for command-line parsing

The CLI SHALL use Cliffy's Command API for all argument and option parsing.

#### Scenario: Installing Cliffy dependency

GIVEN the vk CLI project
WHEN setting up the project
THEN Cliffy SHALL be imported from deno.land/x/cliffy
AND the version SHALL be pinned to a stable release

#### Scenario: Defining top-level command

GIVEN the main CLI entry point
WHEN initializing the application
THEN a root Command SHALL be created with name "vk"
AND the command SHALL include version information
AND the command SHALL include description text

### Requirement: Declarative command structure

Commands SHALL be defined declaratively with Cliffy's command builder pattern.

#### Scenario: Defining subcommands

GIVEN a command group (auth, config, project, task, attempt)
WHEN defining the command structure
THEN each subcommand SHALL be registered using `.command()` method
AND each subcommand SHALL specify its name, description, and action handler
AND required arguments SHALL be defined using `.arguments()` method
AND optional flags SHALL be defined using `.option()` method

#### Scenario: Auto-generated help

GIVEN any command or subcommand
WHEN a user runs the command with `--help` or `-h`
THEN Cliffy SHALL automatically generate help text
AND the help text SHALL include all arguments, options, and examples
AND the help text SHALL be derived from command definitions

### Requirement: Type-safe argument handling

Command handlers SHALL receive typed arguments from Cliffy.

#### Scenario: Accessing parsed arguments

GIVEN a command with defined arguments and options
WHEN the command action handler executes
THEN arguments SHALL be passed as typed parameters
AND options SHALL be available as a typed object
AND TypeScript SHALL enforce type safety for all parameters

### Requirement: Built-in validation

Cliffy SHALL handle argument validation automatically.

#### Scenario: Required argument validation

GIVEN a command with required arguments
WHEN a user invokes the command without providing required arguments
THEN Cliffy SHALL display an error message
AND Cliffy SHALL show usage information
AND the application SHALL exit with non-zero status code

#### Scenario: Option validation

GIVEN a command with typed options (boolean, string, etc.)
WHEN a user provides invalid option values
THEN Cliffy SHALL display a type error
AND Cliffy SHALL show correct usage

### Requirement: Modular command organization

Commands SHALL be organized in separate modules.

#### Scenario: Command module structure

GIVEN the project structure
WHEN organizing command code
THEN each command group (auth, config, etc.) SHALL have its own file in `src/commands/`
AND each command file SHALL export a Cliffy Command instance
AND the main entry point SHALL import and register all command instances

## MODIFIED Requirements

### Requirement: Main entry point

The main.ts file SHALL use Cliffy instead of std/flags.

#### Scenario: Application initialization

GIVEN the main.ts entry point
WHEN the application starts
THEN std/flags imports SHALL be removed
AND Cliffy Command SHALL be imported
AND command registration SHALL use Cliffy's `.command()` method
AND the application SHALL call `.parse(Deno.args)` to execute

## REMOVED Requirements

None. This change is additive and replaces the implementation approach without removing functionality.
