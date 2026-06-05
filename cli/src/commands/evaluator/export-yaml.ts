import { writeFileSync } from "node:fs";
import { Command } from "commander";
import yaml from "js-yaml";
import ora from "ora";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printSuccess, handleSdkError } from "../../output.js";

// YAML exports are portable artifacts; embedding an org-local UUID would make them
// footgun-y to re-import in another org. Strip it before emitting.
function stripProjectId(yamlContent: string): string {
  const parsed = yaml.load(yamlContent);
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    delete (parsed as Record<string, unknown>).project_id;
    return yaml.dump(parsed);
  }
  return yamlContent;
}

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
        const yaml = stripProjectId(await client.evaluators.exportYaml(id));
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
