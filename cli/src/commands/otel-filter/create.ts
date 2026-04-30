import { Command } from "commander";
import ora from "ora";
import { requireApiKey } from "../../auth.js";
import { apiRequest } from "../../client.js";
import { printSuccess, printError, printJson, handleSdkError } from "../../output.js";

interface CreateOptions {
  name: string;
  evaluatorId?: string;
  judgeId?: string;
  filterCriteria?: string;
  samplingRate?: string;
  delaySeconds?: string;
  inactive?: boolean;
}

export function registerCreateCommand(otelFilter: Command): void {
  otelFilter
    .command("create")
    .description("Create a new OTEL trace evaluation filter")
    .requiredOption("--name <name>", "Filter name")
    .option("--evaluator-id <id>", "Evaluator UUID (mutually exclusive with --judge-id)")
    .option("--judge-id <id>", "Judge UUID (mutually exclusive with --evaluator-id)")
    .option(
      "--filter-criteria <json>",
      'Filter conditions as JSON, e.g. \'{"conditions":[{"column":"name","type":"string","key":"name","operator":"contains","value":"agent"}]}\'',
    )
    .option("--sampling-rate <rate>", "Sampling rate between 0.0 and 1.0", "1.0")
    .option("--delay-seconds <seconds>", "Delay before evaluation (allows late spans)", "10")
    .option("--inactive", "Create the filter as inactive", false)
    .addHelpText(
      "after",
      `
Examples:
  # Match every span and run an evaluator
  $ scorable otel-filter create \\
      --name "default-truthfulness" \\
      --evaluator-id <uuid>

  # Match only traces from a specific service (resource attribute)
  $ scorable otel-filter create \\
      --name "construction-truthfulness" \\
      --evaluator-id <uuid> \\
      --filter-criteria '{"conditions":[{"column":"resource","type":"string","key":"service.name","operator":"=","value":"construction_assistant_agent"}]}' \\
      --delay-seconds 5

  # Match by span attribute (gen_ai semantic conventions)
  $ scorable otel-filter create \\
      --name "agent-truthfulness" \\
      --evaluator-id <uuid> \\
      --filter-criteria '{"conditions":[{"column":"gen_ai.agent.name","type":"string","key":"gen_ai.agent.name","operator":"=","value":"my_agent"}]}'`,
    )
    .action(async (opts: CreateOptions) => {
      if (!opts.evaluatorId && !opts.judgeId) {
        printError("Either --evaluator-id or --judge-id is required.");
        process.exit(1);
      }
      if (opts.evaluatorId && opts.judgeId) {
        printError("--evaluator-id and --judge-id are mutually exclusive.");
        process.exit(1);
      }

      let filterCriteria: Record<string, unknown> = {};
      if (opts.filterCriteria) {
        try {
          filterCriteria = JSON.parse(opts.filterCriteria) as Record<string, unknown>;
        } catch {
          printError("Invalid JSON for --filter-criteria.");
          process.exit(1);
        }
      }

      const samplingRate = parseFloat(opts.samplingRate ?? "1.0");
      if (Number.isNaN(samplingRate) || samplingRate < 0 || samplingRate > 1) {
        printError("--sampling-rate must be a number between 0.0 and 1.0.");
        process.exit(1);
      }

      const delaySeconds = parseInt(opts.delaySeconds ?? "10", 10);
      if (Number.isNaN(delaySeconds) || delaySeconds < 0) {
        printError("--delay-seconds must be a non-negative integer.");
        process.exit(1);
      }

      const payload: Record<string, unknown> = {
        name: opts.name,
        filter_criteria: filterCriteria,
        sampling_rate: samplingRate,
        delay_seconds: delaySeconds,
        is_active: !opts.inactive,
      };
      if (opts.evaluatorId) payload.evaluator_id = opts.evaluatorId;
      if (opts.judgeId) payload.judge_id = opts.judgeId;

      const spinner = ora("Creating filter...").start();
      try {
        const apiKey = await requireApiKey();
        const result = await apiRequest("POST", "v1/otel/evaluation-filters", { payload, apiKey });
        spinner.stop();
        if (result === null) {
          throw new Error("Filter creation failed.");
        }
        printSuccess("Filter created.");
        printJson(result);
      } catch (e) {
        spinner.stop();
        handleSdkError(e);
      }
    });
}
