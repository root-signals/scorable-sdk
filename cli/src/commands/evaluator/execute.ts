import { Command } from "commander";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printInfo, printSuccess, printError, printJson, handleSdkError } from "../../output.js";
import { isTurnArray, isStringArray, isStringRecord } from "../../utils.js";
import type { ExecutionPayload } from "@root-signals/scorable";

async function readStdinDefault(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString().trim();
}

export async function executeEvaluator(
  evaluatorId: string,
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

  printInfo(`Attempting to execute evaluator ${evaluatorId} with payload:`);
  printJson(payload);

  const client = getSdkClient(apiKey);
  const result = await client.evaluators.execute(evaluatorId, payload);
  printSuccess("Evaluator execution successful!");
  printJson(result);
}

export function registerExecuteCommand(evaluator: Command): void {
  evaluator
    .command("execute <evaluatorId>")
    .description("Execute an evaluator with interaction details")
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
  $ scorable evaluator execute <evaluatorId> \\
      --request "Where can I find the application instructions?" \\
      --response "You can find the instructions from our Careers page."

  # Evaluate network troubleshooting response
  $ scorable evaluator execute <evaluatorId> \\
      --request "My internet is not working." \\
      --response "Let's check the basics. Ensure the Ethernet cable is securely connected, then run \`ping 8.8.8.8\` in a terminal and share the results."

  # RAG faithfulness check with context documents
  $ scorable evaluator execute <evaluatorId> \\
      --request "Was the number of pensioners working above 100k in 2023?" \\
      --response "Yes, 150,000 pensioners were working in 2023." \\
      --expected-output "In 2023, 150k pensioners were still working." \\
      --contexts '["More than 150,000 pensioners were employed in 2023, the centre\\'s statistics reveal."]'

  # Multi-turn conversation evaluation
  $ scorable evaluator execute <evaluatorId> \\
      --turns '[{"role":"user","content":"Hello, I need help with my order"},{"role":"assistant","content":"I\\'d be happy to help! What\\'s your order number?"},{"role":"user","content":"It\\'s ORDER-12345"},{"role":"assistant","content":"I found your order. It\\'s currently in transit."}]'

  # With custom template variables and tracking
  $ scorable evaluator execute <evaluatorId> \\
      --request "How do I cancel my subscription?" \\
      --response "You can cancel anytime from account settings under billing." \\
      --variables '{"topic":"subscription"}' \\
      --user-id user_123 --session-id session_abc --tag production`,
    )
    .action(
      async (
        evaluatorId: string,
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
          await executeEvaluator(evaluatorId, opts);
        } catch (e) {
          handleSdkError(e);
        }
      },
    );
}
