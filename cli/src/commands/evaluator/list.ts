import { Command } from "commander";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printInfo, printMessage, printError, printEvaluatorTable } from "../../output.js";
import { CliError } from "../../types.js";
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
    .option("--is-preset", "Filter preset evaluators (true)")
    .option("--not-is-preset", "Exclude preset evaluators (false)")
    .option("--is-public", "Filter public evaluators (true)")
    .option("--not-is-public", "Exclude public evaluators (false)")
    .action(async (opts: Record<string, unknown>) => {
      const apiKey = await requireApiKey();

      const params: Record<string, unknown> = {};
      if (opts["pageSize"] !== undefined) params["page_size"] = opts["pageSize"];
      if (opts["cursor"] !== undefined) params["cursor"] = opts["cursor"];
      if (opts["search"] !== undefined) params["search"] = opts["search"];
      if (opts["name"] !== undefined) params["name"] = opts["name"];
      if (opts["ordering"] !== undefined) params["ordering"] = opts["ordering"];

      const isPreset = opts["isPreset"] ? true : opts["notIsPreset"] ? false : undefined;
      if (isPreset !== undefined) params["is_preset"] = isPreset;

      const isPublic = opts["isPublic"] ? true : opts["notIsPublic"] ? false : undefined;
      if (isPublic !== undefined) params["is_public"] = isPublic;

      const actual = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined));
      printInfo(`Fetching evaluators with params: ${JSON.stringify(actual)}...`);

      try {
        const client = getSdkClient(apiKey);
        const response = await client.evaluators.list(actual as unknown as EvaluatorListParams);

        if (!response.results.length) {
          printMessage("No evaluators found.");
          return;
        }

        printEvaluatorTable(
          response.results as unknown as import("../../types.js").Evaluator[],
          response.next,
        );
      } catch (e) {
        if (e instanceof CliError) throw e;
        printError(e instanceof Error ? e.message : String(e));
      }
    });
}
