import fs from "node:fs";
import { Command } from "commander";
import ora from "ora";
import { requireApiKey } from "../../auth.js";
import { apiRequest } from "../../client.js";
import { printSuccess, printError, printJson, handleSdkError } from "../../output.js";
import { loadFilterYaml } from "../../lib/filter-yaml.js";

interface CreateOptions {
  name?: string;
  evaluatorId?: string;
  judgeId?: string;
  filterCriteria?: string;
  samplingRate?: string;
  delaySeconds?: string;
  inactive?: boolean;
  fromFile?: string;
}

export function registerCreateCommand(otelFilter: Command): void {
  otelFilter
    .command("create")
    .description(
      "Create a new OTEL trace evaluation filter. Wires either an evaluator OR a judge to incoming traces.",
    )
    .option("--name <name>", "Filter name")
    .option(
      "--evaluator-id <id>",
      "Evaluator UUID to run on matching traces (mutually exclusive with --judge-id)",
    )
    .option(
      "--judge-id <id>",
      "Judge UUID to run on matching traces (mutually exclusive with --evaluator-id)",
    )
    .option(
      "--filter-criteria <json>",
      'Filter conditions as JSON, e.g. \'{"conditions":[{"column":"name","type":"string","key":"name","operator":"contains","value":"agent"}]}\'',
    )
    .option("--sampling-rate <rate>", "Sampling rate between 0.0 and 1.0")
    .option("--delay-seconds <seconds>", "Delay before evaluation (allows late spans)")
    .option("--inactive", "Create the filter as inactive")
    .option(
      "-f, --from-file <path>",
      "Load filter spec from a YAML or JSON file. CLI flags override file values.",
    )
    .addHelpText(
      "after",
      `
Target — exactly one of --evaluator-id or --judge-id is required (either via flags or --from-file).
  --evaluator-id  Runs a single evaluator (one score, one justification).
  --judge-id      Runs a judge — a bundle of evaluators that produces an
                  aggregate verdict plus per-evaluator scores. Use this
                  when you've already authored a judge for the agent
                  you're tracing.

Examples:
  # Match every span and run a single evaluator
  $ scorable otel-filter create \\
      --name "default-truthfulness" \\
      --evaluator-id <evaluator-uuid>

  # Run a judge (multi-evaluator) on every trace from a service
  $ scorable otel-filter create \\
      --name "construction-quality-judge" \\
      --judge-id <judge-uuid> \\
      --filter-criteria '{"conditions":[{"column":"resource","type":"string","key":"service.name","operator":"=","value":"construction_assistant_agent"}]}' \\
      --delay-seconds 5

  # Load the full filter spec (including extractor_rules) from a YAML file
  $ scorable otel-filter create -f ./filter.yaml`,
    )
    .action(async (opts: CreateOptions) => {
      let filePayload: Record<string, unknown> = {};
      if (opts.fromFile) {
        let source: string;
        try {
          source = fs.readFileSync(opts.fromFile, "utf8");
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          printError(`Failed to read --from-file: ${msg}`);
          process.exit(1);
        }
        try {
          filePayload = loadFilterYaml(source) as unknown as Record<string, unknown>;
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          printError(msg);
          process.exit(1);
        }
      }

      let filterCriteria: Record<string, unknown> | undefined;
      if (opts.filterCriteria) {
        try {
          filterCriteria = JSON.parse(opts.filterCriteria) as Record<string, unknown>;
        } catch {
          printError("Invalid JSON for --filter-criteria.");
          process.exit(1);
        }
      }

      let samplingRate: number | undefined;
      if (opts.samplingRate !== undefined) {
        samplingRate = parseFloat(opts.samplingRate);
        if (Number.isNaN(samplingRate) || samplingRate < 0 || samplingRate > 1) {
          printError("--sampling-rate must be a number between 0.0 and 1.0.");
          process.exit(1);
        }
      }

      let delaySeconds: number | undefined;
      if (opts.delaySeconds !== undefined) {
        delaySeconds = parseInt(opts.delaySeconds, 10);
        if (Number.isNaN(delaySeconds) || delaySeconds < 0) {
          printError("--delay-seconds must be a non-negative integer.");
          process.exit(1);
        }
      }

      const flagPayload: Record<string, unknown> = {};
      if (opts.name !== undefined) flagPayload.name = opts.name;
      if (opts.evaluatorId !== undefined) flagPayload.evaluator_id = opts.evaluatorId;
      if (opts.judgeId !== undefined) flagPayload.judge_id = opts.judgeId;
      if (filterCriteria !== undefined) flagPayload.filter_criteria = filterCriteria;
      if (samplingRate !== undefined) flagPayload.sampling_rate = samplingRate;
      if (delaySeconds !== undefined) flagPayload.delay_seconds = delaySeconds;
      if (opts.inactive !== undefined) flagPayload.is_active = !opts.inactive;

      const payload: Record<string, unknown> = { ...filePayload, ...flagPayload };

      if (!opts.fromFile) {
        if (payload.sampling_rate === undefined) payload.sampling_rate = 1.0;
        if (payload.delay_seconds === undefined) payload.delay_seconds = 10;
        if (payload.is_active === undefined) payload.is_active = true;
        if (payload.filter_criteria === undefined) payload.filter_criteria = {};
      }

      if (typeof payload.name !== "string" || payload.name.length === 0) {
        printError("--name is required (provide via --name or --from-file).");
        process.exit(1);
      }
      if (!payload.evaluator_id && !payload.judge_id) {
        printError("Either --evaluator-id or --judge-id is required.");
        process.exit(1);
      }
      if (payload.evaluator_id && payload.judge_id) {
        printError("--evaluator-id and --judge-id are mutually exclusive.");
        process.exit(1);
      }

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
