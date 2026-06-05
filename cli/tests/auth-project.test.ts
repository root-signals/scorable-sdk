import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { runCli } from "./helpers/run-cli.js";

vi.mock("@root-signals/scorable");
vi.mock("@inquirer/prompts");

// In-memory model of the settings file so set/unset/show round-trip in tests.
let virtualSettings: Record<string, unknown> = {};
let fileExists = false;

const mockExistsSync = vi.fn();
const mockReadFileSync = vi.fn();
const mockWriteFileSync = vi.fn();
const mockMkdirSync = vi.fn();

vi.mock("node:fs", async () => {
  const actual = await vi.importActual<typeof import("node:fs")>("node:fs");
  return {
    ...actual,
    existsSync: (...args: Parameters<typeof actual.existsSync>) => mockExistsSync(...args),
    readFileSync: (...args: Parameters<typeof actual.readFileSync>) => mockReadFileSync(...args),
    writeFileSync: (...args: Parameters<typeof actual.writeFileSync>) => mockWriteFileSync(...args),
    mkdirSync: (...args: Parameters<typeof actual.mkdirSync>) => mockMkdirSync(...args),
  };
});

beforeEach(() => {
  virtualSettings = {};
  fileExists = false;
  mockExistsSync.mockImplementation(() => fileExists);
  mockReadFileSync.mockImplementation(() => JSON.stringify(virtualSettings));
  mockWriteFileSync.mockImplementation((_path: unknown, data: unknown) => {
    virtualSettings = JSON.parse(String(data));
    fileExists = true;
  });
  mockMkdirSync.mockReturnValue(undefined);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("auth set-project", () => {
  it("writes project_id to settings.json", async () => {
    const result = await runCli(["auth", "set-project", "proj-uuid-123"]);
    expect(result.exitCode).toBe(0);
    expect(virtualSettings["project_id"]).toBe("proj-uuid-123");
    expect(result.stdout).toContain("project_id saved");
  });

  it("trims whitespace before persisting", async () => {
    const result = await runCli(["auth", "set-project", "  spaced  "]);
    expect(result.exitCode).toBe(0);
    expect(virtualSettings["project_id"]).toBe("spaced");
  });

  it("preserves api_key when writing project_id", async () => {
    virtualSettings = { api_key: "key-abc" };
    fileExists = true;
    const result = await runCli(["auth", "set-project", "proj-1"]);
    expect(result.exitCode).toBe(0);
    expect(virtualSettings).toEqual({ api_key: "key-abc", project_id: "proj-1" });
  });
});

describe("auth unset-project", () => {
  it("removes project_id from settings.json", async () => {
    virtualSettings = { api_key: "key-abc", project_id: "proj-1" };
    fileExists = true;
    const result = await runCli(["auth", "unset-project"]);
    expect(result.exitCode).toBe(0);
    expect(virtualSettings).toEqual({ api_key: "key-abc" });
    expect(result.stdout).toContain("removed");
  });

  it("is a no-op when project_id is not set", async () => {
    virtualSettings = { api_key: "key-abc" };
    fileExists = true;
    const result = await runCli(["auth", "unset-project"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("No project_id was set");
  });
});

describe("auth show-project", () => {
  it("reports 'none' when nothing is set", async () => {
    vi.unstubAllEnvs();
    const result = await runCli(["auth", "show-project"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("source: none");
  });

  it("reports env source when SCORABLE_PROJECT_ID is set", async () => {
    vi.stubEnv("SCORABLE_PROJECT_ID", "env-uuid");
    const result = await runCli(["auth", "show-project"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("env-uuid");
    expect(result.stdout).toContain("source: env");
  });

  it("reports settings source when persisted", async () => {
    vi.unstubAllEnvs();
    virtualSettings = { project_id: "persisted-uuid" };
    fileExists = true;
    const result = await runCli(["auth", "show-project"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("persisted-uuid");
    expect(result.stdout).toContain("source: settings");
  });
});

describe("auth logout", () => {
  it("clears api_key, temporary_api_key and project_id", async () => {
    virtualSettings = {
      api_key: "key-abc",
      temporary_api_key: "tmp-xyz",
      project_id: "proj-1",
      other: "kept",
    };
    fileExists = true;
    const result = await runCli(["auth", "logout"]);
    expect(result.exitCode).toBe(0);
    expect(virtualSettings).toEqual({ other: "kept" });
    expect(result.stdout).toContain("Logged out");
  });

  it("is a no-op when nothing is set", async () => {
    virtualSettings = {};
    fileExists = false;
    const result = await runCli(["auth", "logout"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Already logged out");
  });
});
