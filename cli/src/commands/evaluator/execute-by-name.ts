import { Command } from "commander";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printInfo, printSuccess, printError, printJson } from "../../output.js";
import { CliError } from "../../types.js";
import type { ExecutionPayload } from "@root-signals/scorable";

async function readStdinDefault(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString().trim();
}

export async function executeEvaluatorByName(
  evaluatorName: string,
  opts: {
    request?: string;
    response?: string;
    turns?: string;
    contexts?: string;
    expectedOutput?: string;
    tag?: string[];
    userId?: string;
    sessionId?: string;
    systemPrompt?: string;
    variables?: string;
  },
  readStdin = readStdinDefault,
): Promise<void> {
  const apiKey = await requireApiKey();

  let response = opts.response;
  if (!opts.request && !response && !opts.turns && !process.stdin.isTTY) {
    response = await readStdin();
  }

  if (!opts.request && !response && !opts.turns) {
    printError("Either --request, --response, or --turns must be provided.");
    return;
  }

  const payload: Record<string, unknown> = {};
  if (opts.request) payload["request"] = opts.request;
  if (response) payload["response"] = response;
  if (opts.expectedOutput) payload["expected_output"] = opts.expectedOutput;
  if (opts.tag?.length) payload["tags"] = opts.tag;
  if (opts.userId) payload["user_id"] = opts.userId;
  if (opts.sessionId) payload["session_id"] = opts.sessionId;
  if (opts.systemPrompt) payload["system_prompt"] = opts.systemPrompt;

  if (opts.turns) {
    try {
      payload["turns"] = JSON.parse(opts.turns) as unknown[];
    } catch {
      printError("Invalid JSON for --turns.");
      return;
    }
  }

  if (opts.contexts) {
    try {
      payload["contexts"] = JSON.parse(opts.contexts) as unknown[];
    } catch {
      printError("Invalid JSON for --contexts. Skipping.");
      return;
    }
  }

  if (opts.variables) {
    try {
      payload["variables"] = JSON.parse(opts.variables) as Record<string, unknown>;
    } catch {
      printError("Invalid JSON for --variables.");
      return;
    }
  }

  printInfo(`Attempting to execute evaluator '${evaluatorName}' with payload:`);
  printJson(payload);

  const client = getSdkClient(apiKey);
  const result = await client.evaluators.executeByName(
    evaluatorName,
    payload as unknown as ExecutionPayload,
  );
  printSuccess("Evaluator execution by name successful!");
  printJson(result);
}

export function registerExecuteByNameCommand(evaluator: Command): void {
  evaluator
    .command("execute-by-name <evaluatorName>")
    .description("Execute an evaluator by name with interaction details")
    .option("--request <text>", "Request text")
    .option("--response <text>", "Response text to evaluate")
    .option("--contexts <json>", "JSON list of context strings. E.g., '[\"ctx1\"]'")
    .option("--expected-output <text>", "Expected output text")
    .option(
      "--tag <tag>",
      "Add one or more tags",
      (v: string, a: string[]) => [...a, v],
      [] as string[],
    )
    .option("--user-id <id>", "User identifier for tracking purposes")
    .option("--session-id <id>", "Session identifier for tracking purposes")
    .option("--system-prompt <text>", "System prompt that was used for the LLM call")
    .option(
      "--turns <json>",
      'JSON array of conversation turns. E.g., \'[{"role":"user","content":"Hello"}]\'',
    )
    .option(
      "--variables <json>",
      'JSON object of extra template variables. E.g., \'{"lang":"EN"}\'',
    )
    .action(async (evaluatorName: string, opts: Record<string, unknown>) => {
      try {
        await executeEvaluatorByName(
          evaluatorName,
          opts as Parameters<typeof executeEvaluatorByName>[1],
        );
      } catch (e) {
        if (e instanceof CliError) throw e;
        printError(e instanceof Error ? e.message : String(e));
      }
    });
}
