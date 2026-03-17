import { Command } from "commander";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printInfo, printMessage, printError, printExecutionLogTable } from "../../output.js";
import { CliError } from "../../types.js";
import type { ExecutionLogListParams } from "@root-signals/scorable";

export function registerListCommand(executionLog: Command): void {
  executionLog
    .command("list")
    .description("List execution logs with optional filters")
    .option("--page-size <number>", "Number of results to return per page", parseInt)
    .option("--cursor <cursor>", "The pagination cursor value")
    .option("--search <term>", "Search term to filter by evaluator id or name")
    .option("--evaluator-id <id>", "Filter by evaluator ID")
    .option("--judge-id <id>", "Filter by judge ID")
    .option("--model <model>", "Filter by model name")
    .option("--tags <tags>", "Filter by tags (comma-separated)")
    .option("--score-min <number>", "Minimum score filter", parseFloat)
    .option("--score-max <number>", "Maximum score filter", parseFloat)
    .option("--created-at-after <date>", "Filter logs created after this date (ISO 8601)")
    .option("--created-at-before <date>", "Filter logs created before this date (ISO 8601)")
    .option("--owner-email <email>", "Filter by owner email")
    .action(async (opts: Record<string, unknown>) => {
      const apiKey = await requireApiKey();

      const params: ExecutionLogListParams = {};
      if (opts["pageSize"] !== undefined) params.page_size = opts["pageSize"] as number;
      if (opts["cursor"] !== undefined) params.cursor = opts["cursor"] as string;
      if (opts["search"] !== undefined) params.search = opts["search"] as string;
      if (opts["evaluatorId"] !== undefined) params.evaluator_id = opts["evaluatorId"] as string;
      if (opts["judgeId"] !== undefined) params.judge_id = opts["judgeId"] as string;
      if (opts["model"] !== undefined) params.model = opts["model"] as string;
      if (opts["tags"] !== undefined) params.tags = opts["tags"] as string;
      if (opts["scoreMin"] !== undefined) params.score_min = opts["scoreMin"] as number;
      if (opts["scoreMax"] !== undefined) params.score_max = opts["scoreMax"] as number;
      if (opts["createdAtAfter"] !== undefined)
        params.created_at_after = opts["createdAtAfter"] as string;
      if (opts["createdAtBefore"] !== undefined)
        params.created_at_before = opts["createdAtBefore"] as string;
      if (opts["ownerEmail"] !== undefined) params.owner__email = opts["ownerEmail"] as string;

      printInfo(`Fetching execution logs...`);

      try {
        const client = getSdkClient(apiKey);
        const response = await client.executionLogs.list(params);

        if (!response.results.length) {
          printMessage("No execution logs found.");
          return;
        }

        printExecutionLogTable(
          response.results as unknown as import("../../types.js").ExecutionLog[],
          response.next,
        );
      } catch (e) {
        if (e instanceof CliError) throw e;
        printError(e instanceof Error ? e.message : String(e));
      }
    });
}
