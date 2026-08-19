import { Command } from "commander";
import { readFileSync, writeFileSync } from "node:fs";
import yaml from "js-yaml";
import { requireApiKey } from "../../auth.js";
import { apiRequest } from "../../client.js";
import {
  printInfo,
  printSuccess,
  printWarning,
  printError,
  printMessage,
  printJson,
  handleSdkError,
} from "../../output.js";
import { parseOutputFormat } from "../../lib/output-format.js";
import type { OutputFormat } from "../../lib/output-format.js";
import { renderResults, renderCsv } from "./render.js";
import { CliError } from "../../types.js";
import { resolveProjectIdValue, PROJECT_ID_FLAG_DESC } from "../../lib/project-id.js";
import type { PromptTest, PromptTestConfig } from "../../types.js";

function isPromptTestComplete(exp: PromptTest): boolean {
  if (!exp.tasks.length) return false;
  return exp.tasks.every((t) => t.status === "completed" || t.status === "failed");
}

/**
 * Progress is reported one line per state change instead of a full table per poll --
 * a table per 1s iteration buried the actual result under dozens of near-identical tables.
 */
function reportProgress(experiments: PromptTest[], announced: Set<string>): void {
  for (const exp of experiments) {
    if (!isPromptTestComplete(exp) || announced.has(exp.id)) continue;
    announced.add(exp.id);
    const failed = exp.tasks.filter((t) => t.status === "failed").length;
    const suffix = failed ? ` (${failed} failed)` : "";
    printSuccess(`Prompt test ${exp.id} completed: ${exp.tasks.length} tasks${suffix}.`);
  }
}

export interface RunOptions {
  format?: OutputFormat;
  full?: boolean;
}

export async function runPromptTests(
  outputFile: string | undefined,
  configPath: string,
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
  projectIdOverride?: string,
  options: RunOptions = {},
): Promise<void> {
  let rawConfig: unknown;
  try {
    rawConfig = yaml.load(readFileSync(configPath, "utf8"));
  } catch {
    printError(
      `'${configPath}' not found. Please run \`pt init\` first or specify a different config file with -c.`,
    );
    throw new CliError(1, `Config file not found: ${configPath}`);
  }

  let config: PromptTestConfig;
  try {
    config = rawConfig as PromptTestConfig;
    if (!config.prompts || !config.models || !config.evaluators) {
      throw new Error("Missing required fields: prompts, models, evaluators");
    }
    if (!("inputs" in config) || !Array.isArray(config.inputs)) {
      throw new Error("Missing required field: inputs");
    }
  } catch (e) {
    printError(
      `Error reading or validating '${configPath}': ${e instanceof Error ? e.message : String(e)}`,
    );
    throw new CliError(1, "Invalid config");
  }

  const apiKey = await requireApiKey();
  printInfo("Starting prompt tests");

  // Resolution: --project-id override > config file > env > settings.
  // Passing `--project-id` to `run` invokes resolveProjectIdValue, which already
  // covers the env/settings fallback. The config file lives below the flag and
  // above env, so we honour it explicitly here.
  const resolvedProjectId =
    projectIdOverride !== undefined
      ? resolveProjectIdValue(projectIdOverride)
      : (config.project_id ?? resolveProjectIdValue(undefined));

  const experiments: Record<string, PromptTest> = {};

  for (const prompt of config.prompts) {
    for (const model of config.models) {
      const evaluators = config.evaluators.map((e) => {
        const entry: Record<string, unknown> = {};
        if (e.id) entry["id"] = e.id;
        if (e.name) entry["name"] = e.name;
        if (e.version_id) entry["version_id"] = e.version_id;
        return entry;
      });

      const payload: Record<string, unknown> = {
        prompt,
        inputs: config.inputs.map((i) => i.vars),
        model,
        evaluators,
      };
      if (config.response_schema) payload["response_schema"] = config.response_schema;
      if (config.dataset_id) payload["dataset_id"] = config.dataset_id;
      if (resolvedProjectId !== undefined) payload["project_id"] = resolvedProjectId;

      const result = (await apiRequest("POST", "prompt-tests", {
        payload,
        apiKey,
      })) as PromptTest | null;
      if (result?.id) {
        experiments[result.id] = result;
        printSuccess(`Successfully created prompt test for model '${model}' with ID: ${result.id}`);
      } else {
        printWarning(`Failed to create prompt test for model '${model}' with prompt: ${prompt}`);
      }
    }
  }

  if (!Object.keys(experiments).length) {
    printError("No prompt tests were created. Aborting.");
    throw new CliError(1, "No prompt tests created");
  }

  printInfo("Waiting for prompt tests to complete...");
  const completed: Record<string, PromptTest> = {};
  const announced = new Set<string>();

  while (Object.keys(completed).length < Object.keys(experiments).length) {
    for (const expId of Object.keys(experiments)) {
      if (completed[expId]) continue;

      const expData = (await apiRequest("GET", `prompt-tests/${expId}`, {
        apiKey,
      })) as PromptTest | null;
      if (!expData) {
        printWarning(`Could not retrieve status for prompt test ${expId}`);
        continue;
      }

      experiments[expId] = expData;

      if (isPromptTestComplete(expData)) {
        completed[expId] = expData;
      }
    }

    reportProgress(Object.values(experiments), announced);

    if (Object.keys(completed).length < Object.keys(experiments).length) {
      await sleep(1000);
    }
  }

  printSuccess("All prompt tests completed.");
  const finalTests = Object.values(completed).sort((a, b) => a.id.localeCompare(b.id));
  const format = options.format ?? "table";
  const full = options.full ?? false;
  if (format === "json") {
    printJson(finalTests);
  } else if (format === "csv") {
    printMessage(renderCsv(finalTests).trimEnd());
  } else if (!finalTests.length) {
    printWarning("No prompt test results to display.");
  } else {
    printMessage(renderResults(finalTests, full));
  }

  if (outputFile) {
    try {
      writeFileSync(outputFile, JSON.stringify(finalTests, null, 2));
      printSuccess(`Results saved to ${outputFile}`);
    } catch (e) {
      printError(
        `Failed to write results to ${outputFile}: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }
}

export function registerRunCommand(pt: Command): void {
  pt.command("run")
    .description("Runs prompt tests from the prompt-tests.yaml file")
    .option("-o, --output <path>", "Output file path to save prompt test results as JSON")
    .option("-c, --config <path>", "Path to prompt testing configuration file", "prompt-tests.yaml")
    .option("--format <format>", "Output format: table, json, csv", "table")
    .option("--full", "Print untruncated prompts, outputs, and justifications")
    .option("--project-id <uuid>", PROJECT_ID_FLAG_DESC + " Overrides project_id from config file.")
    .action(
      async (opts: {
        output?: string;
        config: string;
        projectId?: string;
        format?: string;
        full?: boolean;
      }) => {
        try {
          await runPromptTests(opts.output, opts.config, undefined, opts.projectId, {
            format: parseOutputFormat(opts.format),
            full: Boolean(opts.full),
          });
        } catch (e) {
          handleSdkError(e);
        }
      },
    );
}
