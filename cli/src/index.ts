#!/usr/bin/env node
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { Command } from "commander";
import chalk from "chalk";
import { registerJudgeCommands } from "./commands/judge/index.js";
import { registerPromptTestCommands } from "./commands/prompt-test/index.js";
import { registerEvaluatorCommands } from "./commands/evaluator/index.js";
import { registerExecutionLogCommands } from "./commands/execution-log/index.js";
import { registerAuthCommands } from "./commands/auth/index.js";

const { version } = createRequire(import.meta.url)("../package.json") as {
  version: string;
};

function buildBanner(ver: string): string {
  const logo = chalk.hex("#4D9FFF");
  const name = chalk.bold.hex("#4D9FFF")("scorable");
  const tag = chalk.dim(`v${ver}`);
  const tagline = chalk.dim("Measurement & Control for LLM Automations");
  const line = chalk.dim("─".repeat(52));
  return [
    "",
    `  ${logo("┌─┐")}  ${name}  ${tag}`,
    `  ${logo("╰◈╯")}  ${tagline}`,
    `     ${line}`,
  ].join("\n");
}

function buildGettingStarted(): string {
  const header = chalk.bold("Getting started");
  const line = chalk.dim("─".repeat(52));
  const num = (n: string) => chalk.dim(n + ".");
  const cmd = (s: string) => chalk.cyan(s);
  return [
    "",
    `  ${header}`,
    `  ${line}`,
    `  ${num("1")} Authenticate ${chalk.dim("(pick one)")}:`,
    `       ${cmd("$ scorable auth demo-key")}           ${chalk.dim("# for quick testing")}`,
    `       ${cmd("$ scorable auth set-key <api-key>")}  ${chalk.dim("# permanent key")}`,
    `  ${num("2")} Explore resources:`,
    `       ${cmd("$ scorable judge list")}`,
    `       ${cmd("$ scorable evaluator list")}`,
    "",
  ].join("\n");
}

export function createCli(): Command {
  const program = new Command()
    .name("scorable")
    .description("A CLI tool to interact with the Scorable API")
    .version(version, "-V, --version", "Print version number")
    .addHelpText("before", buildBanner(version))
    .addHelpText("after", buildGettingStarted())
    .exitOverride()
    .action(() => {
      program.outputHelp();
    });

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
