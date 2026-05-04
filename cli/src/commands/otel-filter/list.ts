import { Command } from "commander";
import ora from "ora";
import { requireApiKey } from "../../auth.js";
import { apiRequest } from "../../client.js";
import { printJson, handleSdkError, printMessage } from "../../output.js";

export function registerListCommand(otelFilter: Command): void {
  otelFilter
    .command("list")
    .description("List OTEL trace evaluation filters")
    .action(async () => {
      const spinner = ora("Fetching...").start();
      try {
        const apiKey = await requireApiKey();
        const result = await apiRequest("GET", "v1/otel/evaluation-filters", { apiKey });
        spinner.stop();
        if (result === null) {
          // apiRequest already reported the failure; don't masquerade it as "no filters".
          process.exit(1);
        }
        if (Array.isArray(result) && result.length === 0) {
          printMessage("No filters found.");
          return;
        }
        printJson(result);
      } catch (e) {
        spinner.stop();
        handleSdkError(e);
      }
    });
}
