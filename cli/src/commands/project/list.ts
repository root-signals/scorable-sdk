import { Command } from "commander";
import ora from "ora";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printMessage, printProjectTable, handleSdkError } from "../../output.js";
import type { ProjectListParams } from "@root-signals/scorable";

export function registerListCommand(project: Command): void {
  project
    .command("list")
    .description("List projects in your organization")
    .option("--page-size <number>", "Number of results to return per page", parseInt)
    .option("--cursor <cursor>", "The pagination cursor value")
    .option("--search <term>", "A search term to filter by")
    .option("--ordering <field>", "Which field to use for ordering the results")
    .action(
      async (opts: { pageSize?: number; cursor?: string; search?: string; ordering?: string }) => {
        const apiKey = await requireApiKey();

        const params: ProjectListParams = {};
        if (opts.pageSize !== undefined) params.page_size = opts.pageSize;
        if (opts.cursor !== undefined) params.cursor = opts.cursor;
        if (opts.search !== undefined) params.search = opts.search;
        if (opts.ordering !== undefined) params.ordering = opts.ordering;

        const spinner = ora("Fetching...").start();
        try {
          const client = getSdkClient(apiKey);
          const response = await client.projects.list(params);
          spinner.stop();

          if (!response.results.length) {
            printMessage("No projects found.");
            return;
          }

          printProjectTable(response.results, response.next);
        } catch (e) {
          spinner.stop();
          handleSdkError(e);
        }
      },
    );
}
