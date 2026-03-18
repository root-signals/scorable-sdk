import { Command } from "commander";
import ora from "ora";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printSuccess, printError, printJson, handleSdkError } from "../../output.js";
import { isTurnArray, isStringArray, isStringRecord } from "../../utils.js";
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

  const payload: ExecutionPayload = {};
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

  if (opts.variables) {
    try {
      const parsed: unknown = JSON.parse(opts.variables);
      if (!isStringRecord(parsed)) {
        printError("Invalid JSON for --variables.");
        return;
      }
      payload.variables = parsed;
    } catch {
      printError("Invalid JSON for --variables.");
      return;
    }
  }

  const spinner = ora("Running evaluator...").start();
  try {
    const client = getSdkClient(apiKey);
    const result = await client.evaluators.executeByName(evaluatorName, payload);
    spinner.stop();
    printSuccess("Evaluator execution by name successful!");
    printJson(result);
  } catch (e) {
    spinner.stop();
    throw e;
  }
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
    .addHelpText(
      "after",
      `
Examples:
  # Check helpfulness of a support response
  $ scorable evaluator execute-by-name "Helpfulness" \\
      --request "Where can I find the application instructions?" \\
      --response "You can find the instructions from our Careers page."

  # Network troubleshooting accuracy check
  $ scorable evaluator execute-by-name "Network Troubleshooting" \\
      --request "My internet is not working." \\
      --response "Let's check the basics. Ensure the Ethernet cable is securely connected, then run \`ping 8.8.8.8\` and share the results."

  # Faithfulness against retrieved context
  $ scorable evaluator execute-by-name "Faithfulness" \\
      --request "What is your return policy for electronics?" \\
      --response "You can return electronics within 30 days, unused and in original packaging." \\
      --contexts '["Returns for electronics: 30 days, unused, original packaging, valid receipt required."]'

  # Multi-turn conversation
  $ scorable evaluator execute-by-name "Helpfulness" \\
      --turns '[{"role":"user","content":"Hello, I need help with my order"},{"role":"assistant","content":"I\\'d be happy to help! What\\'s your order number?"},{"role":"user","content":"It\\'s ORDER-12345"}]'

  # Pipe a response from your app via stdin
  $ ./my-app respond "Do you offer refunds?" | \\
      scorable evaluator execute-by-name "Helpfulness" --request "Do you offer refunds?"`,
    )
    .action(
      async (
        evaluatorName: string,
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
          variables?: string;
        },
      ) => {
        try {
          await executeEvaluatorByName(evaluatorName, opts);
        } catch (e) {
          handleSdkError(e);
        }
      },
    );
}
