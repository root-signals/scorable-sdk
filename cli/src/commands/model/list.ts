import { Command } from "commander";
import ora from "ora";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printMessage, printModelTable, handleSdkError } from "../../output.js";
import type { ListParams } from "@root-signals/scorable";

export function registerListCommand(model: Command): void {
  model
    .command("list")
    .description("List models")
    .option("--page-size <number>", "Number of results to return per page", parseInt)
    .option("--cursor <cursor>", "The pagination cursor value")
    .option("--ordering <field>", "Which field to use for ordering the results")
    .action(async (opts: { pageSize?: number; cursor?: string; ordering?: string }) => {
      const apiKey = await requireApiKey();

      const params: ListParams = {};
      if (opts.pageSize !== undefined) params.page_size = opts.pageSize;
      if (opts.cursor !== undefined) params.cursor = opts.cursor;
      if (opts.ordering !== undefined) params.ordering = opts.ordering;

      const spinner = ora("Fetching...").start();
      try {
        const client = getSdkClient(apiKey);
        const response = await client.models.list(params);
        spinner.stop();

        if (!response.results.length) {
          printMessage("No models found.");
          return;
        }

        printModelTable(response.results, response.next);
      } catch (e) {
        spinner.stop();
        handleSdkError(e);
      }
    });
}
