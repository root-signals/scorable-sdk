import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import yaml from "js-yaml";
import { runCli } from "./helpers/run-cli.js";
import { runPromptTests } from "../src/commands/prompt-test/run.js";

vi.mock("@inquirer/prompts");

const mockSleep = vi.fn().mockResolvedValue(undefined);

function makeMockFetch(experiment: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(experiment),
  });
}

function makeTempConfig(data: unknown): { path: string; cleanup: () => void } {
  const dir = join(tmpdir(), `scorable-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  const path = join(dir, "prompt-tests.yaml");
  writeFileSync(path, yaml.dump(data));
  return { path, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

const baseConfig = {
  prompts: ["Test prompt: {{input}}"],
  inputs: [{ vars: { input: "test value" } }],
  models: ["gpt-5-mini"],
  evaluators: [{ name: "Test Evaluator" }],
};

const mockExperiment = {
  id: "exp-123",
  model: "gpt-5-mini",
  prompt: "Test prompt: {{input}}",
  tasks: [
    {
      id: "task-1",
      status: "completed",
      cost: "$0.001",
      llm_output: "Test output",
      model_call_duration: 1.5,
      variables: { input: "test value" },
      evaluation_results: [],
    },
  ],
  evaluators: [],
  avg_cost: null,
  avg_model_call_duration: null,
};

beforeEach(() => {
  vi.stubEnv("SCORABLE_API_KEY", "test-api-key");
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("TestPromptTestingOperations", () => {
  it("test_run_experiment_success", async () => {
    vi.stubGlobal("fetch", makeMockFetch(mockExperiment));
    const { path, cleanup } = makeTempConfig(baseConfig);
    try {
      const spy = vi.spyOn(console, "log").mockImplementation(() => {});
      await runPromptTests(undefined, path, mockSleep);
      spy.mockRestore();
    } finally {
      cleanup();
    }
  });

  it("test_run_experiment_with_response_schema", async () => {
    const expWithSchema = { ...mockExperiment, id: "exp-456" };
    vi.stubGlobal("fetch", makeMockFetch(expWithSchema));

    const config = {
      ...baseConfig,
      prompts: ["Extract info: {{text}}"],
      inputs: [{ vars: { text: "John Doe, john@example.com" } }],
      response_schema: {
        type: "object",
        properties: { name: { type: "string" } },
      },
    };
    const { path, cleanup } = makeTempConfig(config);
    try {
      const spy = vi.spyOn(console, "log").mockImplementation(() => {});
      await runPromptTests(undefined, path, mockSleep);
      spy.mockRestore();
    } finally {
      cleanup();
    }
  });

  it("test_run_experiment_with_dataset_id", async () => {
    const expWithDataset = { ...mockExperiment, id: "exp-789" };
    const mockFetch = makeMockFetch(expWithDataset);
    vi.stubGlobal("fetch", mockFetch);

    const config = { ...baseConfig, dataset_id: "dataset-123" };
    const { path, cleanup } = makeTempConfig(config);
    try {
      const spy = vi.spyOn(console, "log").mockImplementation(() => {});
      await runPromptTests(undefined, path, mockSleep);
      spy.mockRestore();

      // Verify dataset_id was sent in POST body
      const postCall = (mockFetch.mock.calls as [string, RequestInit][]).find(
        ([, opts]) => opts?.method === "POST",
      );
      expect(postCall).toBeDefined();
      const body = JSON.parse(postCall![1].body as string) as Record<string, unknown>;
      expect(body["dataset_id"]).toBe("dataset-123");
    } finally {
      cleanup();
    }
  });

  it("test_exp_init_command", async () => {
    const originalCwd = process.cwd();
    const tmpDir = join(tmpdir(), `scorable-init-test-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
    process.chdir(tmpDir);
    try {
      const result = await runCli(["pt", "init"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("created successfully");
    } finally {
      process.chdir(originalCwd);
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("test_exp_run_command_with_custom_config", async () => {
    vi.stubGlobal("fetch", makeMockFetch(mockExperiment));
    const { path, cleanup } = makeTempConfig(baseConfig);
    try {
      const result = await runCli(["pt", "run", "-c", path]);
      expect(result.exitCode).toBe(0);
    } finally {
      cleanup();
    }
  });

  it("test_prompt_test_alias_init_command", async () => {
    const originalCwd = process.cwd();
    const tmpDir = join(tmpdir(), `scorable-alias-init-test-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
    process.chdir(tmpDir);
    try {
      const result = await runCli(["prompt-test", "init"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("created successfully");
    } finally {
      process.chdir(originalCwd);
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("test_prompt_test_alias_run_command_with_custom_config", async () => {
    vi.stubGlobal("fetch", makeMockFetch(mockExperiment));
    const { path, cleanup } = makeTempConfig(baseConfig);
    try {
      const result = await runCli(["prompt-test", "run", "-c", path]);
      expect(result.exitCode).toBe(0);
    } finally {
      cleanup();
    }
  });
});
