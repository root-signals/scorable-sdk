import fs from "node:fs";
import { Command } from "commander";
import ora from "ora";
import { requireApiKey } from "../../auth.js";
import { apiRequest } from "../../client.js";
import { printSuccess, printError, printJson, handleSdkError } from "../../output.js";
import { loadFilterYaml } from "../../lib/filter-yaml.js";

interface UpdateOptions {
  fromFile: string;
}

export function registerUpdateCommand(otelFilter: Command): void {
  otelFilter
    .command("update <id>")
    .description("Update an OTEL trace evaluation filter from a YAML/JSON manifest")
    .requiredOption("-f, --from-file <path>", "Filter spec path (YAML or JSON)")
    .addHelpText(
      "after",
      `
Pairs with the YAML-manifest workflow used by \`create -f\`. Edit the file,
re-apply with this command.

Example:
  $ scorable otel-filter update <filter-id> -f ./filter.yaml`,
    )
    .action(async (id: string, opts: UpdateOptions) => {
      let source: string;
      try {
        source = fs.readFileSync(opts.fromFile, "utf8");
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        printError(`Failed to read --from-file: ${msg}`);
        process.exit(1);
      }

      let payload: Record<string, unknown>;
      try {
        payload = loadFilterYaml(source) as unknown as Record<string, unknown>;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        printError(msg);
        process.exit(1);
      }

      const spinner = ora("Updating filter...").start();
      try {
        const apiKey = await requireApiKey();
        const result = await apiRequest(
          "PATCH",
          `v1/otel/evaluation-filters/${encodeURIComponent(id)}`,
          { payload, apiKey },
        );
        spinner.stop();
        if (result === null) {
          process.exit(1);
        }
        printSuccess(`Filter ${id} updated.`);
        printJson(result);
      } catch (e) {
        spinner.stop();
        handleSdkError(e);
      }
    });
}
