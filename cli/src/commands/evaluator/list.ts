import { Command } from "commander";
import ora from "ora";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printMessage, printEvaluatorTable, handleSdkError } from "../../output.js";
import type { EvaluatorListParams } from "@root-signals/scorable";

export function registerListCommand(evaluator: Command): void {
  evaluator
    .command("list")
    .description("List evaluators with optional filters")
    .option("--page-size <number>", "Number of results to return per page", parseInt)
    .option("--cursor <cursor>", "The pagination cursor value")
    .option("--search <term>", "A search term to filter by")
    .option("--name <name>", "Filter by exact evaluator name")
    .option("--ordering <field>", "Which field to use for ordering the results")
    .action(
      async (opts: {
        pageSize?: number;
        cursor?: string;
        search?: string;
        name?: string;
        ordering?: string;
      }) => {
        const apiKey = await requireApiKey();

        const params: EvaluatorListParams & { name?: string } = {};
        if (opts.pageSize !== undefined) params.page_size = opts.pageSize;
        if (opts.cursor !== undefined) params.cursor = opts.cursor;
        if (opts.search !== undefined) params.search = opts.search;
        if (opts.name !== undefined) params.name = opts.name;
        if (opts.ordering !== undefined) params.ordering = opts.ordering;

        const spinner = ora("Fetching...").start();
        try {
          const client = getSdkClient(apiKey);
          const response = await client.evaluators.list(params);
          spinner.stop();

          if (!response.results.length) {
            printMessage("No evaluators found.");
            return;
          }

          printEvaluatorTable(response.results, response.next);
        } catch (e) {
          spinner.stop();
          handleSdkError(e);
        }
      },
    );
}
