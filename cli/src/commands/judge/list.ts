import { Command } from "commander";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printInfo, printMessage, printJudgeTable, handleSdkError } from "../../output.js";
import type { JudgeListParams } from "@root-signals/scorable";

export function registerListCommand(judge: Command): void {
  judge
    .command("list")
    .description("List judges with optional filters")
    .option("--page-size <number>", "Number of results to return per page", parseInt)
    .option("--cursor <cursor>", "The pagination cursor value")
    .option("--search <term>", "A search term to filter by")
    .option("--name <name>", "Filter by exact judge name")
    .option("--ordering <field>", "Which field to use for ordering the results")
    .action(async (opts: Record<string, unknown>) => {
      const apiKey = await requireApiKey();

      const params: Record<string, unknown> = { is_public: false };
      if (opts["pageSize"] !== undefined) params["page_size"] = opts["pageSize"];
      if (opts["cursor"] !== undefined) params["cursor"] = opts["cursor"];
      if (opts["search"] !== undefined) params["search"] = opts["search"];
      if (opts["name"] !== undefined) params["name"] = opts["name"];
      if (opts["ordering"] !== undefined) params["ordering"] = opts["ordering"];

      const actual = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined));
      printInfo(`Fetching judges with params: ${JSON.stringify(actual)}...`);

      try {
        const client = getSdkClient(apiKey);
        const response = await client.judges.list(actual as unknown as JudgeListParams);

        if (!response.results.length) {
          printMessage("No judges found.");
          return;
        }

        printJudgeTable(
          response.results as unknown as import("../../types.js").Judge[],
          response.next,
        );
      } catch (e) {
        handleSdkError(e);
      }
    });
}
