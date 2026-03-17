import { Command } from "commander";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printInfo, printMessage, printError, printJudgeTable } from "../../output.js";
import { CliError } from "../../types.js";
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
    .option("--is-preset", "Filter preset judges (true)")
    .option("--not-is-preset", "Exclude preset judges (false)")
    .option("--is-public", "Filter public judges (true)")
    .option("--not-is-public", "Exclude public judges (false)")
    .option("--show-global", "Include global judges (true)")
    .option("--not-show-global", "Exclude global judges (false)")
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

      const showGlobal = opts["showGlobal"] ? true : opts["notShowGlobal"] ? false : undefined;
      if (showGlobal !== undefined) params["show_global"] = showGlobal;

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
        if (e instanceof CliError) throw e;
        printError(e instanceof Error ? e.message : String(e));
      }
    });
}
