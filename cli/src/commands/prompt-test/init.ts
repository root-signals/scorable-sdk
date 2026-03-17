import { Command } from "commander";
import { writeFileSync, existsSync } from "node:fs";
import { printWarning, printSuccess, printInfo, printError } from "../../output.js";

const TEMPLATE = `# Prompt Testing Configuration
# This file defines a test suite of prompt and model combinations, with optional evaluators.

# List of prompt templates to test (use {{variable}} for input substitution)
prompts:
  - "Extract user information from the following text: {{text}}"
  - "Identify and extract the name, username, and email from: {{text}}"

# Input data for the prompt tests (each input will be tested with each prompt and model)
inputs:
  - vars:
      text: "John Doe, @johndoe, john@example.com"
  - vars:
      text: "Contact: Jane Smith (email: jane.smith@company.org, handle: @janesmith)"

# Alternative to inputs: Use a dataset by ID
# Uncomment the line below and comment out the inputs section to use a dataset instead
# dataset_id: "<uuid>"

# Models to test (each will be run with all prompt/input combinations)
models:
  - "gemini-3-flash"
  - "gpt-5-mini"

# Evaluators to assess the quality of responses
evaluators:
  - name: "Precision"
  - name: "Confidentiality"

# Optional: Response schema for structured output (JSON Schema format)
# Uncomment and modify the section below to enforce structured responses from the LLM
# response_schema:
#   type: "object"
#   required: ["name", "username", "email"]
#   properties:
#     name:
#       type: "string"
#       description: "The name of the user"
#     email:
#       type: "string"
#       format: "email"
#       description: "The email of the user"
#     username:
#       type: "string"
#       pattern: "^@[a-zA-Z0-9_]+$"
#       description: "The username of the user. Must start with @"
#   additionalProperties: false
`;

export function registerInitCommand(pt: Command): void {
  pt.command("init")
    .description("Initializes a new prompt-tests.yaml file in the current directory")
    .action(async () => {
      const configPath = "prompt-tests.yaml";

      if (existsSync(configPath)) {
        printWarning(`'${configPath}' already exists in the current directory.`);
        const { confirm } = await import("@inquirer/prompts");
        const ok = await confirm({
          message: "Do you want to overwrite it?",
          default: false,
        });
        if (!ok) {
          printInfo("Aborted.");
          return;
        }
      }

      try {
        writeFileSync(configPath, TEMPLATE);
        printSuccess(`'${configPath}' created successfully.`);
        printInfo("Update the file with your prompt test details and run `pt run`.");
      } catch (e) {
        printError(
          `Failed to write to '${configPath}': ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    });
}
