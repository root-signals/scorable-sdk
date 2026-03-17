import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { Scorable } from "@root-signals/scorable";
import { CliError } from "./types.js";
import { printError, printInfo, printSuccess } from "./output.js";

function configDir(): string {
  return join(homedir(), ".scorable");
}

function settingsPath(): string {
  return join(configDir(), "settings.json");
}

function loadSettings(): Record<string, unknown> {
  try {
    const path = settingsPath();
    if (!existsSync(path)) return {};
    const data = JSON.parse(readFileSync(path, "utf8")) as unknown;
    return typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function saveSettings(settings: Record<string, unknown>): void {
  try {
    const dir = configDir();
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    writeFileSync(settingsPath(), JSON.stringify(settings, null, 2), { mode: 0o600 });
  } catch {
    // ignore write failures silently
  }
}

export function getApiKey(): string | undefined {
  const fromEnv = process.env["SCORABLE_API_KEY"];
  if (fromEnv) return fromEnv;
  const settings = loadSettings();
  return settings["temporary_api_key"] as string | undefined;
}

export function getBaseUrl(): string {
  return process.env["SCORABLE_API_URL"] ?? "https://api.scorable.ai";
}

export function getSdkClient(apiKey: string): Scorable {
  return new Scorable({ apiKey, baseUrl: getBaseUrl() });
}

export async function requireApiKey(): Promise<string> {
  const key = getApiKey();
  if (key) return key;

  printError("SCORABLE_API_KEY environment variable not set.");
  const shell = process.env["SHELL"] ?? "";
  if (shell.includes("fish")) {
    printInfo("Run: set -x SCORABLE_API_KEY <your_key>");
  } else {
    printInfo("Run: export SCORABLE_API_KEY='<your_key>'");
  }

  if (process.stdin.isTTY && process.stdout.isTTY) {
    const { confirm } = await import("@inquirer/prompts");
    const answer = await confirm({
      message: "No API key found. Create a temporary key now?",
      default: true,
    });

    if (!answer) {
      printInfo("Aborted. Please set SCORABLE_API_KEY and try again.");
      throw new CliError(1, "Aborted");
    }

    try {
      const resp = await fetch(`${getBaseUrl()}/create-demo-user/`, { method: "POST" });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = (await resp.json()) as Record<string, unknown>;
      const tempKey = data["api_key"] as string | undefined;

      if (!tempKey) {
        printError("Temporary key response did not include 'api_key'.");
        throw new CliError(1, "Missing api_key in demo response");
      }

      process.env["SCORABLE_API_KEY"] = tempKey;
      const settings = loadSettings();
      settings["temporary_api_key"] = tempKey;
      saveSettings(settings);
      printSuccess("Temporary API key saved to ~/.scorable/settings.json");

      if (shell.includes("fish")) {
        printInfo("To persist in your shell: set -x SCORABLE_API_KEY <paste_key_here>");
      } else {
        printInfo("To persist in your shell: export SCORABLE_API_KEY='<paste_key_here>'");
      }

      return tempKey;
    } catch (e) {
      if (e instanceof CliError) throw e;
      printError(
        `Failed to create temporary API key: ${e instanceof Error ? e.message : String(e)}`,
      );
      throw new CliError(1, "Failed to create temporary API key");
    }
  } else {
    printInfo("Set SCORABLE_API_KEY and retry. Non-interactive session cannot prompt.");
    throw new CliError(1, "Missing API key");
  }
}
