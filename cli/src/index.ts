#!/usr/bin/env node
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { Command } from "commander";
import { registerJudgeCommands } from "./commands/judge/index.js";
import { registerPromptTestCommands } from "./commands/prompt-test/index.js";
import { registerEvaluatorCommands } from "./commands/evaluator/index.js";
import { registerExecutionLogCommands } from "./commands/execution-log/index.js";
import { registerAuthCommands } from "./commands/auth/index.js";

const { version } = createRequire(import.meta.url)("../package.json") as { version: string };

export function createCli(): Command {
  const program = new Command()
    .name("scorable")
    .description("A CLI tool to interact with the Scorable API")
    .version(version, "-V, --version", "Print version number")
    .addHelpText(
      "after",
      `
Getting started:
  Set your API key first (required before any command):
  $ scorable auth set-key <your-api-key>

  Then use any command, e.g.:
  $ scorable judge list`,
    )
    .exitOverride();

  registerJudgeCommands(program);
  registerPromptTestCommands(program);
  registerEvaluatorCommands(program);
  registerExecutionLogCommands(program);
  registerAuthCommands(program);

  return program;
}

if (realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1])) {
  createCli()
    .parseAsync(process.argv)
    .catch((e: unknown) => {
      // CliError already printed its message; just exit with the right code
      if (e && typeof e === "object" && "exitCode" in e) {
        process.exit((e as { exitCode: number }).exitCode);
      }
      // CommanderError from exitOverride — Commander already printed usage
      if (
        e &&
        typeof e === "object" &&
        "code" in e &&
        String((e as { code: unknown }).code).startsWith("commander.")
      ) {
        process.exit((e as { exitCode?: number }).exitCode ?? 1);
      }
      process.stderr.write(String(e) + "\n");
      process.exit(1);
    });
}
