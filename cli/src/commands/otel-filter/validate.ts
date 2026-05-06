import fs from "node:fs";
import { Command } from "commander";
import ora from "ora";
import { requireApiKey } from "../../auth.js";
import { apiRequestStatus } from "../../client.js";
import { printError, printSuccess, handleSdkError } from "../../output.js";
import { loadFilterYaml } from "../../lib/filter-yaml.js";
import { CliError } from "../../types.js";

interface ValidateOptions {
  fromFile: string;
}

export function registerValidateCommand(otelFilter: Command): void {
  otelFilter
    .command("validate")
    .description("Validate an OTEL trace evaluation filter spec without saving")
    .requiredOption("-f, --from-file <path>", "Filter spec path (YAML or JSON)")
    .addHelpText(
      "after",
      `
Example:
  $ scorable otel-filter validate -f ./filter.yaml`,
    )
    .action(async (opts: ValidateOptions) => {
      let source: string;
      try {
        source = fs.readFileSync(opts.fromFile, "utf8");
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        printError(`Failed to read --from-file: ${msg}`);
        throw new CliError(2, msg);
      }

      let payload: Record<string, unknown>;
      try {
        payload = loadFilterYaml(source) as unknown as Record<string, unknown>;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        printError(msg);
        throw new CliError(2, msg);
      }

      const spinner = ora("Validating filter...").start();
      try {
        const apiKey = await requireApiKey();
        const result = await apiRequestStatus("POST", "v1/otel/evaluation-filters/validate", {
          payload,
          apiKey,
        });
        spinner.stop();

        if (!result.ok) {
          if (result.status === 400) {
            throw new CliError(2, "Filter schema validation failed.");
          }
          throw new CliError(1, `Validation request failed (status ${result.status}).`);
        }

        const data = (result.data ?? {}) as { warnings?: unknown };
        const warnings = Array.isArray(data.warnings) ? (data.warnings as string[]) : [];
        if (warnings.length > 0) {
          for (const w of warnings) {
            console.error(`warning: ${w}`);
          }
        }
        printSuccess("OK");
      } catch (e) {
        spinner.stop();
        if (e instanceof CliError) throw e;
        handleSdkError(e);
      }
    });
}
