import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { Scorable } from "@root-signals/scorable";
import { CliError } from "./types.js";
import { printError, printInfo } from "./output.js";

function configDir(): string {
  return join(homedir(), ".scorable");
}

function settingsPath(): string {
  return join(configDir(), "settings.json");
}

export function loadSettings(): Record<string, unknown> {
  try {
    const path = settingsPath();
    if (!existsSync(path)) return {};
    const data = JSON.parse(readFileSync(path, "utf8")) as unknown;
    return typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function saveSettings(settings: Record<string, unknown>): boolean {
  try {
    const dir = configDir();
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    writeFileSync(settingsPath(), JSON.stringify(settings, null, 2), { mode: 0o600 });
    return true;
  } catch {
    return false;
  }
}

export function getApiKey(): string | undefined {
  const fromEnv = process.env["SCORABLE_API_KEY"];
  if (fromEnv) return fromEnv;
  const settings = loadSettings();
  if (settings["api_key"]) return settings["api_key"] as string;
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

  printError("No API key found.");
  printInfo("Get a free demo key:   scorable auth demo-key");
  printInfo("Set a permanent key:   scorable auth set-key <your-api-key>");
  throw new CliError(1, "Missing API key");
}

export async function createDemoKey(): Promise<string> {
  try {
    const resp = await fetch(`${getBaseUrl()}/create-demo-user/`, { method: "POST" });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = (await resp.json()) as Record<string, unknown>;
    const tempKey = data["api_key"] as string | undefined;
    if (!tempKey) throw new Error("Response did not include 'api_key'");
    return tempKey;
  } catch (e) {
    if (e instanceof CliError) throw e;
    printError(`Failed to create demo key: ${e instanceof Error ? e.message : String(e)}`);
    throw new CliError(1, "Failed to create demo key");
  }
}
