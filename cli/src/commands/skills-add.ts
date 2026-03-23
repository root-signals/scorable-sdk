import { spawn } from "node:child_process";
import { Command } from "commander";
import { CliError } from "../types.js";
import { printSuccess, printInfo } from "../output.js";

export function registerSkillsAddCommand(program: Command): void {
  program
    .command("skills-add")
    .description("Install Scorable Skills for coding agents")
    .action(async () => {
      await new Promise<void>((resolve, reject) => {
        const child = spawn("npx", ["skills", "add", "root-signals/scorable-skills"], {
          stdio: "inherit",
        });
        child.on("close", (code) => {
          if (code !== 0) {
            reject(new CliError(code ?? 1, `skills add exited with code ${code}`));
          } else {
            resolve();
          }
        });
        child.on("error", (err) => {
          reject(new CliError(1, `Failed to run npx skills: ${err.message}`));
        });
      });
      console.log();
      printSuccess("Scorable skills installed.");
      printInfo(
        'Open your coding agent in your AI powered project and use the prompt: "Integrate scorable evaluators"',
      );
    });
}
