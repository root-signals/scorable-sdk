import { readFileSync } from "node:fs";
import { Command } from "commander";
import ora from "ora";
import { requireApiKey, getBaseUrl } from "../../auth.js";
import { printSuccess, printError, printJson, handleSdkError } from "../../output.js";
import { resolveProjectIdValue, PROJECT_ID_FLAG_DESC } from "../../lib/project-id.js";

export function registerImportYamlCommand(evaluator: Command): void {
  evaluator
    .command("import-yaml")
    .description("Import an evaluator from a YAML file")
    .requiredOption("--file <path>", "Path to the YAML file to import")
    .option("--overwrite", "Overwrite if an evaluator with the same name already exists")
    .option("--project-id <uuid>", PROJECT_ID_FLAG_DESC)
    .action(async (opts: { file: string; overwrite?: boolean; projectId?: string }) => {
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
        const projectId = resolveProjectIdValue(opts.projectId);
        const body: Record<string, unknown> = {
          yaml: yamlContent,
          overwrite: opts.overwrite ?? false,
        };
        if (projectId !== undefined) body["project_id"] = projectId;
        const response = await fetch(`${baseUrl}/v1/evaluators/import-yaml/`, {
          method: "POST",
          headers: {
            Authorization: `Api-Key ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
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
