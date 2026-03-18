import { Command } from "commander";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printInfo, printSuccess, printError, printJson, handleSdkError } from "../../output.js";
import type { JudgeExecutionPayload } from "@root-signals/scorable";

async function readStdinDefault(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString().trim();
}

export async function executeJudge(
  judgeId: string,
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

  printInfo(`Attempting to execute judge ${judgeId} with payload:`);
  printJson(payload);

  const client = getSdkClient(apiKey);
  const result = await client.judges.execute(judgeId, payload as unknown as JudgeExecutionPayload);
  printSuccess("Judge execution successful!");
  printJson(result);
}

export function registerExecuteCommand(judge: Command): void {
  judge
    .command("execute <judgeId>")
    .description("Execute a judge with interaction details")
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
    .action(async (judgeId: string, opts: Record<string, unknown>) => {
      try {
        await executeJudge(judgeId, opts as Parameters<typeof executeJudge>[1]);
      } catch (e) {
        handleSdkError(e);
      }
    });
}
