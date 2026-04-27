import { Command } from "commander";
import ora from "ora";
import * as fs from "fs";
import * as path from "path";
import { requireApiKey } from "../../auth.js";
import { printSuccess, printError, printJson, handleSdkError } from "../../output.js";
import { getSdkClient } from "../../auth.js";

export async function uploadFile(filePath: string): Promise<void> {
  const apiKey = await requireApiKey();

  if (!fs.existsSync(filePath)) {
    printError(`File not found: ${filePath}`);
    process.exit(1);
  }

  const client = getSdkClient(apiKey);
  const fileName = path.basename(filePath);
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer]);

  const spinner = ora(`Uploading ${fileName}...`).start();
  try {
    const result = await client.files.upload(blob, fileName);
    spinner.stop();
    printSuccess("File uploaded successfully!");
    printJson(result);
  } catch (e) {
    spinner.stop();
    throw e;
  }
}

export function registerUploadCommand(file: Command): void {
  file
    .command("upload <filePath>")
    .description("Upload a file (PDF, PNG, JPG, JPEG, WEBP, SVG) for use in evaluator execution")
    .addHelpText(
      "after",
      `
Examples:
  # Upload a PDF document
  $ scorable file upload ./report.pdf

  # Upload an image
  $ scorable file upload ./chart.png

  # Use the returned ID in evaluator execution
  $ scorable evaluator execute <evaluatorId> \\
      --request "Does the chart match?" \\
      --response "Yes." \\
      --file-ids '["<id from upload>"]'`,
    )
    .action(async (filePath: string) => {
      try {
        await uploadFile(filePath);
      } catch (e) {
        handleSdkError(e);
      }
    });
}
