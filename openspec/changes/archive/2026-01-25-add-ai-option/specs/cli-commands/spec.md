## ADDED Requirements

### Requirement: AI Documentation Option
The CLI MUST provide a `--ai` option on the root command that outputs comprehensive AI-friendly documentation as JSON.

#### Scenario: Output AI documentation
- **WHEN** the user runs `vk --ai`
- **THEN** the CLI outputs a JSON object containing documentation for all commands
- **AND** the output includes the CLI name, description, and version
- **AND** the output includes all top-level commands with their subcommands recursively

#### Scenario: AI documentation structure
- **WHEN** the user runs `vk --ai`
- **THEN** each command in the output includes:
  - name (string)
  - description (string)
  - usage (string showing command syntax)
  - arguments (array of argument definitions)
  - options (array of option definitions)
  - subcommands (array of nested command objects, if applicable)

#### Scenario: Option metadata format
- **WHEN** the user runs `vk --ai`
- **THEN** each option in the output includes:
  - name (string, the option name without dashes)
  - flags (array of strings, e.g., ["--json", "-j"])
  - type (string: "boolean", "string", or "number")
  - required (boolean)
  - description (string)
  - default (value if specified, otherwise omitted)

#### Scenario: Argument metadata format
- **WHEN** the user runs `vk --ai`
- **THEN** each argument in the output includes:
  - name (string)
  - type (string)
  - required (boolean)
  - variadic (boolean, true if accepts multiple values)

#### Scenario: Exit after AI output
- **WHEN** the user runs `vk --ai`
- **THEN** the CLI outputs the JSON documentation and exits with code 0
- **AND** no other command execution occurs
