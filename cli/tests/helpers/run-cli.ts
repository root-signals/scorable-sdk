import { vi } from "vitest";
import { createCli } from "../../src/index.js";
import { CliError } from "../../src/types.js";

export interface CliResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export async function runCli(args: string[]): Promise<CliResult> {
  let stdout = "";
  let stderr = "";
  let exitCode = 0;

  const logSpy = vi.spyOn(console, "log").mockImplementation((...a: unknown[]) => {
    stdout += a.join(" ") + "\n";
  });
  const errSpy = vi.spyOn(console, "error").mockImplementation((...a: unknown[]) => {
    stderr += a.join(" ") + "\n";
  });

  // Prevent commands from reading stdin (avoid hangs in test environment)
  const origIsTTY = process.stdin.isTTY;
  (process.stdin as NodeJS.ReadStream & { isTTY: boolean }).isTTY = true;

  try {
    const cli = createCli();
    await cli.parseAsync(["node", "scorable-cli", ...args]);
  } catch (e: unknown) {
    if (e instanceof CliError) {
      exitCode = e.exitCode;
    } else {
      const err = e as Record<string, unknown>;
      if (err["code"] === "commander.exitOverride") {
        exitCode = (err["exitCode"] as number | undefined) ?? 1;
      } else if (e instanceof Error && /process\.exit.*called with "(\d+)"/.test(e.message)) {
        // vitest intercepts process.exit and throws; extract the exit code
        const match = e.message.match(/"(\d+)"/);
        exitCode = match ? parseInt(match[1]) : 1;
      } else {
        exitCode = 1;
        // Surface unexpected errors so tests fail with a useful message
        throw e;
      }
    }
  } finally {
    (process.stdin as NodeJS.ReadStream & { isTTY: boolean }).isTTY = origIsTTY;
    logSpy.mockRestore();
    errSpy.mockRestore();
  }

  return { exitCode, stdout, stderr };
}
