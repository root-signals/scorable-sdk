import { readFileSync } from "node:fs";
import { Command } from "commander";
import ora from "ora";
import { requireApiKey, getBaseUrl } from "../../auth.js";
import { printSuccess, printError, printJson, handleSdkError } from "../../output.js";

export function registerImportYamlCommand(evaluator: Command): void {
  evaluator
    .command("import-yaml")
    .description("Import an evaluator from a YAML file")
    .requiredOption("--file <path>", "Path to the YAML file to import")
    .option("--overwrite", "Overwrite if an evaluator with the same name already exists")
    .action(async (opts: { file: string; overwrite?: boolean }) => {
      let yamlContent: string;
      try {
        yamlContent = readFileSync(opts.file, "utf8");
      } catch {
        printError(`Could not read file: ${opts.file}`);
        return;
      }

      const spinner = ora("Importing…").start();
      try {
        const apiKey = await requireApiKey();
        const baseUrl = getBaseUrl();
        const response = await fetch(`${baseUrl}/v1/evaluators/import-yaml/`, {
          method: "POST",
          headers: {
            Authorization: `Api-Key ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ yaml: yamlContent, overwrite: opts.overwrite ?? false }),
        });
        if (!response.ok) {
          spinner.stop();
          const text = await response.text();
          printError(`Import failed (${response.status}): ${text}`);
          return;
        }
        const result = (await response.json()) as Record<string, unknown>;
        spinner.stop();
        const name = typeof result["name"] === "string" ? result["name"] : "evaluator";
        printSuccess(`Evaluator "${name}" imported successfully!`);
        printJson(result);
      } catch (e) {
        spinner.stop();
        handleSdkError(e);
      }
    });
}
