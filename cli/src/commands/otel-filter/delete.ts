import { Command } from "commander";
import ora from "ora";
import { requireApiKey } from "../../auth.js";
import { apiRequestStatus } from "../../client.js";
import { printSuccess, handleSdkError } from "../../output.js";

export function registerDeleteCommand(otelFilter: Command): void {
  otelFilter
    .command("delete <id>")
    .description("Delete an OTEL trace evaluation filter")
    .action(async (id: string) => {
      const spinner = ora("Deleting...").start();
      try {
        const apiKey = await requireApiKey();
        const { ok } = await apiRequestStatus(
          "DELETE",
          `v1/otel/evaluation-filters/${encodeURIComponent(id)}`,
          { apiKey },
        );
        spinner.stop();
        if (!ok) {
          // apiRequestStatus already printed the underlying error.
          process.exit(1);
        }
        printSuccess(`Filter ${id} deleted.`);
      } catch (e) {
        spinner.stop();
        handleSdkError(e);
      }
    });
}
