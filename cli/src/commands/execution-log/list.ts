import { Command } from "commander";
import ora from "ora";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printMessage, printExecutionLogTable, handleSdkError } from "../../output.js";
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
    .action(
      async (opts: {
        pageSize?: number;
        cursor?: string;
        search?: string;
        evaluatorId?: string;
        judgeId?: string;
        model?: string;
        tags?: string;
        scoreMin?: number;
        scoreMax?: number;
        createdAtAfter?: string;
        createdAtBefore?: string;
        ownerEmail?: string;
      }) => {
        const apiKey = await requireApiKey();

        const params: ExecutionLogListParams = {};
        if (opts.pageSize !== undefined) params.page_size = opts.pageSize;
        if (opts.cursor !== undefined) params.cursor = opts.cursor;
        if (opts.search !== undefined) params.search = opts.search;
        if (opts.evaluatorId !== undefined) params.evaluator_id = opts.evaluatorId;
        if (opts.judgeId !== undefined) params.judge_id = opts.judgeId;
        if (opts.model !== undefined) params.model = opts.model;
        if (opts.tags !== undefined) params.tags = opts.tags;
        if (opts.scoreMin !== undefined) params.score_min = opts.scoreMin;
        if (opts.scoreMax !== undefined) params.score_max = opts.scoreMax;
        if (opts.createdAtAfter !== undefined) params.created_at_after = opts.createdAtAfter;
        if (opts.createdAtBefore !== undefined) params.created_at_before = opts.createdAtBefore;
        if (opts.ownerEmail !== undefined) params.owner__email = opts.ownerEmail;

        const spinner = ora("Fetching...").start();
        try {
          const client = getSdkClient(apiKey);
          const response = await client.executionLogs.list(params);
          spinner.stop();

          if (!response.results.length) {
            printMessage("No execution logs found.");
            return;
          }

          printExecutionLogTable(response.results, response.next);
        } catch (e) {
          spinner.stop();
          handleSdkError(e);
        }
      },
    );
}
