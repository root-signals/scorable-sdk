import { Command } from "commander";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printInfo, printSuccess, printError, printJson, handleSdkError } from "../../output.js";
import { isTurnArray, isStringArray } from "../../utils.js";
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

  printInfo(`Attempting to execute judge ${judgeId} with payload:`);
  printJson(payload);

  const client = getSdkClient(apiKey);
  const result = await client.judges.execute(judgeId, payload);
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
    .addHelpText(
      "after",
      `
Examples:
  # Evaluate a customer service response about return policy
  $ scorable judge execute <judgeId> \\
      --request "What's your return policy?" \\
      --response "We have a 30-day return policy. If you're not satisfied, you can return within 30 days for a full refund."

  # RAG evaluation with context documents
  $ scorable judge execute <judgeId> \\
      --request "What's your return policy for electronics?" \\
      --response "You can return electronics within 30 days, unused and in original packaging." \\
      --contexts '["Returns for electronics are accepted within 30 days. Item must be unused, in original packaging, with valid receipt."]'

  # Multi-turn conversation evaluation
  $ scorable judge execute <judgeId> \\
      --turns '[{"role":"user","content":"Hello, I need help with my order"},{"role":"assistant","content":"I\\'d be happy to help! What\\'s your order number?"},{"role":"user","content":"It\\'s ORDER-12345"},{"role":"assistant","content":"I found your order. It\\'s currently in transit."}]'

  # With tracking metadata and tags
  $ scorable judge execute <judgeId> \\
      --request "How do I reset my password?" \\
      --response "Click the Forgot Password link on the login page and follow the instructions." \\
      --user-id user_123 --session-id session_abc \\
      --tag production --tag v1.23

  # Pipe the LLM response from stdin
  $ echo "You can cancel your subscription from account settings under billing." | \\
      scorable judge execute <judgeId> --request "How do I cancel my subscription?"`,
    )
    .action(
      async (
        judgeId: string,
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
          await executeJudge(judgeId, opts);
        } catch (e) {
          handleSdkError(e);
        }
      },
    );
}
