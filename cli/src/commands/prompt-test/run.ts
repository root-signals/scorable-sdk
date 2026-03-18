import { Command } from "commander";
import { readFileSync, writeFileSync } from "node:fs";
import yaml from "js-yaml";
import Table from "cli-table3";
import { requireApiKey } from "../../auth.js";
import { apiRequest } from "../../client.js";
import { printInfo, printSuccess, printWarning, printError, handleSdkError } from "../../output.js";
import { CliError } from "../../types.js";
import type { PromptTest, PromptTestConfig } from "../../types.js";

function isPromptTestComplete(exp: PromptTest): boolean {
  if (!exp.tasks.length) return false;
  return exp.tasks.every((t) => t.status === "completed" || t.status === "failed");
}

function displayProgressTable(experiments: PromptTest[]): void {
  const table = new Table({
    head: ["Prompt Test ID", "Status", "Tasks Completed"],
    style: { head: ["cyan"] },
  });

  for (const exp of experiments) {
    const done = exp.tasks.filter((t) => t.status === "completed" || t.status === "failed").length;
    const total = exp.tasks.length;
    table.push([
      exp.id,
      isPromptTestComplete(exp) ? "✅ Completed" : "⏳ Running",
      `${done}/${total}`,
    ]);
  }

  console.log(table.toString());
}

function displayAggregatedResults(experiments: PromptTest[]): void {
  if (!experiments.length) {
    printWarning("No prompt test results to display.");
    return;
  }

  const allEvaluators = new Map<string, string>();
  for (const exp of experiments) {
    for (const e of exp.evaluators) {
      if (!allEvaluators.has(e.id)) allEvaluators.set(e.id, e.name);
    }
  }
  const sortedEvalIds = [...allEvaluators.keys()].sort();

  const table = new Table({
    head: [
      "Inputs",
      "Prompt",
      "Model",
      "Cost",
      "Latency (s)",
      "Output",
      ...sortedEvalIds.map((id) => allEvaluators.get(id)!),
    ],
    style: { head: ["cyan"] },
    wordWrap: true,
  });

  for (const exp of experiments) {
    for (const task of exp.tasks) {
      const inputsStr = Object.entries(task.variables)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n");

      const row: string[] = [
        inputsStr,
        exp.prompt,
        exp.model,
        task.cost ?? "N/A",
        task.model_call_duration != null ? task.model_call_duration.toFixed(3) : "N/A",
        task.llm_output ?? "",
      ];

      const scores = new Map(task.evaluation_results.map((r) => [r.id, r.score]));
      for (const evalId of sortedEvalIds) {
        const score = scores.get(evalId);
        row.push(score != null ? String(score) : "N/A");
      }

      table.push(row);
    }
  }

  console.log(table.toString());
}

export async function runPromptTests(
  outputFile: string | undefined,
  configPath: string,
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
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
        printSuccess(`Prompt test ${expId} completed.`);
      }
    }

    displayProgressTable(Object.values(experiments));

    if (Object.keys(completed).length < Object.keys(experiments).length) {
      await sleep(1000);
    }
  }

  printSuccess("All prompt tests completed.");
  const finalTests = Object.values(completed).sort((a, b) => a.id.localeCompare(b.id));
  displayAggregatedResults(finalTests);

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
    .action(async (opts: { output?: string; config: string }) => {
      try {
        await runPromptTests(opts.output, opts.config);
      } catch (e) {
        handleSdkError(e);
      }
    });
}
