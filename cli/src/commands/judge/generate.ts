import { Command } from "commander";
import ora from "ora";
import chalk from "chalk";
import { requireApiKey, getSdkClient } from "../../auth.js";
import {
  printSuccess,
  printError,
  printWarning,
  printInfo,
  printJson,
  handleSdkError,
} from "../../output.js";
import { CliError } from "../../types.js";

export function registerGenerateCommand(judge: Command): void {
  judge
    .command("generate")
    .description("Generate a judge from an intent description using AI")
    .addHelpText(
      "after",
      `
Example:
  $ scorable judge generate \\
      --intent "I am building a customer support chatbot for a hotel chain. \\
I want to evaluate that responses are helpful, accurate, and reflect our brand tone. \\
The chatbot must never make promises about pricing or availability, and should always \\
offer to connect the guest with a human agent when uncertain."`,
    )
    .requiredOption("--intent <text>", "Detailed description of what the judge should evaluate")
    .option("--visibility <value>", "Visibility of the generated judge: private, public", "private")
    .option("--name <name>", "Optional name for the generated judge")
    .option("--stage <stage>", "Stage name for the judge")
    .option("--reasoning-effort <value>", "Reasoning effort for generation: off, low, medium, high")
    .option("--judge-id <id>", "ID of an existing judge to regenerate")
    .option("--overwrite", "Overwrite existing judge with the same name", false)
    .option(
      "--extra-contexts <json>",
      'JSON object of additional context key-value pairs, e.g. \'{"Tone Of Voice":"formal","Domain":"hotel chatbot"}\'',
    )
    .option(
      "--context-aware",
      "Enable context-aware evaluators for RAG applications (hallucination detection, context drift, etc.)",
      false,
    )
    .action(
      async (opts: {
        intent: string;
        visibility: string;
        name?: string;
        stage?: string;
        reasoningEffort?: string;
        judgeId?: string;
        overwrite: boolean;
        extraContexts?: string;
        contextAware: boolean;
      }) => {
        const acceptedVisibilities = ["private", "public"] as const;
        const visibility = opts.visibility;
        if (!acceptedVisibilities.includes(visibility as (typeof acceptedVisibilities)[number])) {
          printError(
            `Invalid --visibility value: "${visibility}". Accepted values: private, public.`,
          );
          throw new CliError(1, "invalid_visibility");
        }

        const apiKey = await requireApiKey();

        let extra_contexts: Record<string, string> | undefined;
        if (opts.extraContexts) {
          try {
            extra_contexts = JSON.parse(opts.extraContexts) as Record<string, string>;
          } catch {
            printError("Invalid --extra-contexts JSON: must be a key-value object.");
            throw new CliError(1, "Invalid extra-contexts JSON");
          }
        }

        const spinner = ora("Generating judge (this may take a moment)...").start();
        try {
          const client = getSdkClient(apiKey);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result = (await client.judges.generate({
            intent: opts.intent,
            visibility: visibility as "private" | "public",
            overwrite: opts.overwrite,
            name: opts.name,
            stage: opts.stage,
            judge_id: opts.judgeId,
            extra_contexts: extra_contexts ?? null,
            enable_context_aware_evaluators: opts.contextAware || undefined,
            ...(opts.reasoningEffort && {
              generating_model_params: {
                reasoning_effort: opts.reasoningEffort as "off" | "low" | "medium" | "high",
              },
            }),
          })) as any;
          spinner.stop();

          if (result.error_code === "multiple_stages") {
            printWarning("Multiple evaluation stages detected. Each judge covers one stage.");
            printInfo("Detected stages:");
            for (const s of result.stages ?? []) {
              console.log(`    ${chalk.cyan("·")} ${s}`);
            }
            printInfo('Re-run with --stage "<stage name>" to target a specific stage.');
            throw new CliError(1, "multiple_stages");
          }

          if (result.error_code) {
            printError(`Generation failed with error code: ${result.error_code}`);
            throw new CliError(1, result.error_code ?? "generation_failed");
          }

          const missingContext = result.missing_context_from_system_goal;

          if (missingContext?.length) {
            printSuccess("Judge created — but additional context would improve it:");
            console.log();
            for (const field of missingContext) {
              console.log(`    ${chalk.bold(field.form_field_name)}`);
              console.log(`    ${chalk.dim(field.form_field_description)}`);
              console.log();
            }
            printInfo(
              `Re-run with --judge-id "${result.judge_id}" and --extra-contexts to refine.`,
            );
          } else {
            printSuccess("Judge generated successfully!");
          }

          printJson(result);
        } catch (e) {
          spinner.stop();
          handleSdkError(e);
        }
      },
    );
}
