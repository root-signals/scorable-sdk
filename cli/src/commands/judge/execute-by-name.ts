import { Command } from "commander";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printInfo, printSuccess, printError, printJson } from "../../output.js";
import { CliError } from "../../types.js";
import type { JudgeExecutionPayload } from "@root-signals/scorable";

async function readStdinDefault(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString().trim();
}

export async function executeJudgeByName(
  judgeName: string,
  opts: {
    request?: string;
    response?: string;
    contexts?: string;
    expectedOutput?: string;
    tag?: string[];
    userId?: string;
    sessionId?: string;
    systemPrompt?: string;
  },
  readStdin = readStdinDefault,
): Promise<void> {
  const apiKey = await requireApiKey();

  let response = opts.response;
  if (!opts.request && !response && !process.stdin.isTTY) {
    response = await readStdin();
  }

  if (!opts.request && !response) {
    printError("Either --request or --response must be provided.");
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

  if (opts.contexts) {
    try {
      payload["contexts"] = JSON.parse(opts.contexts) as unknown[];
    } catch {
      printError("Invalid JSON for --contexts. Skipping.");
      return;
    }
  }

  printInfo(`Attempting to execute judge '${judgeName}' with payload:`);
  printJson(payload);

  const client = getSdkClient(apiKey);
  const result = await client.judges.executeByName(
    judgeName,
    payload as unknown as JudgeExecutionPayload,
  );
  printSuccess("Judge execution by name successful!");
  printJson(result);
}

export function registerExecuteByNameCommand(judge: Command): void {
  judge
    .command("execute-by-name <judgeName>")
    .description("Execute a judge by name with interaction details")
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
    .action(async (judgeName: string, opts: Record<string, unknown>) => {
      try {
        await executeJudgeByName(judgeName, opts as Parameters<typeof executeJudgeByName>[1]);
      } catch (e) {
        if (e instanceof CliError) throw e;
        printError(e instanceof Error ? e.message : String(e));
      }
    });
}
