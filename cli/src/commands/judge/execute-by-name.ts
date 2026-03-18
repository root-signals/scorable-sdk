import { Command } from "commander";
import ora from "ora";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printSuccess, printError, printJson, handleSdkError } from "../../output.js";
import { isTurnArray, isStringArray } from "../../utils.js";
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

  const payload: JudgeExecutionPayload = {};
  if (opts.request) payload.request = opts.request;
  if (response) payload.response = response;
  if (opts.expectedOutput) payload.expected_output = opts.expectedOutput;
  if (opts.tag?.length) payload.tags = opts.tag;
  if (opts.userId) payload.user_id = opts.userId;
  if (opts.sessionId) payload.session_id = opts.sessionId;
  if (opts.systemPrompt) payload.system_prompt = opts.systemPrompt;

  if (opts.turns) {
    try {
      const parsed: unknown = JSON.parse(opts.turns);
      if (!isTurnArray(parsed)) {
        printError("Invalid JSON for --turns.");
        return;
      }
      payload.turns = parsed;
    } catch {
      printError("Invalid JSON for --turns.");
      return;
    }
  }

  if (opts.contexts) {
    try {
      const parsed: unknown = JSON.parse(opts.contexts);
      if (!isStringArray(parsed)) {
        printError("Invalid JSON for --contexts. Skipping.");
        return;
      }
      payload.contexts = parsed;
    } catch {
      printError("Invalid JSON for --contexts. Skipping.");
      return;
    }
  }

  const spinner = ora("Running judge...").start();
  try {
    const client = getSdkClient(apiKey);
    const result = await client.judges.executeByName(judgeName, payload);
    spinner.stop();
    printSuccess("Judge execution by name successful!");
    printJson(result);
  } catch (e) {
    spinner.stop();
    throw e;
  }
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
    .option(
      "--turns <json>",
      'JSON array of conversation turns. E.g., \'[{"role":"user","content":"Hello"}]\'',
    )
    .addHelpText(
      "after",
      `
Examples:
  # Evaluate a customer service response
  $ scorable judge execute-by-name "Customer Service Judge" \\
      --request "My order hasn't arrived and it's been two weeks." \\
      --response "I completely understand your frustration. Let me immediately look into your order status and arrange expedited shipping at no extra cost."

  # With context documents
  $ scorable judge execute-by-name "E-commerce Support Judge" \\
      --request "What's your return policy for electronics?" \\
      --response "You can return electronics within 30 days, unused and in original packaging." \\
      --contexts '["Returns for electronics: 30 days, unused, original packaging, valid receipt required."]'

  # Multi-turn conversation
  $ scorable judge execute-by-name "Customer Service Judge" \\
      --turns '[{"role":"user","content":"I haven\\'t received my refund and it\\'s been 10 days."},{"role":"assistant","content":"Thank you for contacting us. I will investigate this immediately and provide an update within 24 hours."}]'

  # Pipe the LLM response from stdin
  $ echo "We offer a 30-day money-back guarantee on all purchases." | \\
      scorable judge execute-by-name "Custom Returns Policy Judge" --request "Do you offer refunds?"`,
    )
    .action(
      async (
        judgeName: string,
        opts: {
          request?: string;
          response?: string;
          turns?: string;
          contexts?: string;
          expectedOutput?: string;
          tag: string[];
          userId?: string;
          sessionId?: string;
          systemPrompt?: string;
        },
      ) => {
        try {
          await executeJudgeByName(judgeName, opts);
        } catch (e) {
          handleSdkError(e);
        }
      },
    );
}
