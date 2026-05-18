import { Command } from "commander";
import ora from "ora";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printSuccess, printJson, handleSdkError } from "../../output.js";
import type { CreateModelData } from "@root-signals/scorable";

async function readKeyFromStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString().trim();
}

export function registerCreateCommand(model: Command): void {
  model
    .command("create")
    .description("Create a new custom model")
    .requiredOption("--name <name>", "Model name (unique within your organization)")
    .option("--model <model>", "Underlying model identifier (e.g. 'gpt-5.5')")
    .option("--url <url>", "API base URL (for self-hosted or non-SaaS endpoints)")
    .option(
      "--key <value>",
      "Provider API key. Pass '-' to read the key from stdin (avoids shell history leak)",
    )
    .option("--max-token-count <number>", "Maximum total tokens", parseInt)
    .option("--max-output-token-count <number>", "Maximum output tokens", parseInt)
    .action(
      async (opts: {
        name: string;
        model?: string;
        url?: string;
        key?: string;
        maxTokenCount?: number;
        maxOutputTokenCount?: number;
      }) => {
        const apiKey = await requireApiKey();

        const payload: CreateModelData = { name: opts.name };
        if (opts.model !== undefined) payload.model = opts.model;
        if (opts.url !== undefined) payload.url = opts.url;
        if (opts.maxTokenCount !== undefined) payload.max_token_count = opts.maxTokenCount;
        if (opts.maxOutputTokenCount !== undefined) {
          payload.max_output_token_count = opts.maxOutputTokenCount;
        }
        if (opts.key !== undefined) {
          payload.default_key = opts.key === "-" ? await readKeyFromStdin() : opts.key;
        }

        const spinner = ora("Creating...").start();
        try {
          const client = getSdkClient(apiKey);
          const result = await client.models.create(payload);
          spinner.stop();
          printSuccess("Model created successfully!");
          printJson(result);
        } catch (e) {
          spinner.stop();
          handleSdkError(e);
        }
      },
    );
}
