import { writeFileSync } from "node:fs";
import { Command } from "commander";
import ora from "ora";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printSuccess, handleSdkError } from "../../output.js";

export function registerExportYamlCommand(evaluator: Command): void {
  evaluator
    .command("export-yaml")
    .description("Export an evaluator as a YAML file")
    .argument("<id>", "Evaluator ID")
    .option("--output <file>", "Write YAML to this file instead of stdout")
    .action(async (id: string, opts: { output?: string }) => {
      const spinner = ora("Exporting…").start();
      try {
        const apiKey = await requireApiKey();
        const client = getSdkClient(apiKey);
        const yaml = await client.evaluators.exportYaml(id);
        spinner.stop();
        if (opts.output) {
          writeFileSync(opts.output, yaml, "utf8");
          printSuccess(`Evaluator exported to ${opts.output}`);
        } else {
          process.stdout.write(yaml);
        }
      } catch (e) {
        spinner.stop();
        handleSdkError(e);
      }
    });
}
