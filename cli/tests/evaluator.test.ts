import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { Scorable } from "@root-signals/scorable";
import { runCli } from "./helpers/run-cli.js";
import { executeEvaluator } from "../src/commands/evaluator/execute.js";
import { executeEvaluatorByName } from "../src/commands/evaluator/execute-by-name.js";

vi.mock("@root-signals/scorable");
vi.mock("@inquirer/prompts");

const mockList = vi.fn();
const mockGet = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockExecute = vi.fn();
const mockExecuteByName = vi.fn();
const mockDuplicate = vi.fn();

const sampleEvaluator = {
  id: "eval-123",
  name: "Test Evaluator",
  status: "active",
  created_at: "2024-01-01T12:00:00Z",
  prompt: "Does the response meet the criteria?",
};

beforeEach(() => {
  vi.stubEnv("SCORABLE_API_KEY", "test-api-key");
  vi.mocked(Scorable).mockImplementation(function () {
    return {
      evaluators: {
        list: mockList,
        get: mockGet,
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete,
        execute: mockExecute,
        executeByName: mockExecuteByName,
        duplicate: mockDuplicate,
      },
    } as unknown as Scorable;
  });
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

// --- TestEvaluatorList ---

describe("TestEvaluatorList", () => {
  it("test_list_evaluators_success", async () => {
    mockList.mockResolvedValue({
      results: [
        {
          id: "eval-123",
          name: "Test Evaluator 1",
          status: "active",
          created_at: "2024-01-01",
        },
        {
          id: "eval-456",
          name: "Test Evaluator 2",
          status: "inactive",
          created_at: "2024-01-02",
        },
      ],
    });
    const result = await runCli(["evaluator", "list"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Test Evaluator 1");
    expect(result.stdout).toContain("Test Evaluator 2");
  });

  it("test_list_evaluators_empty", async () => {
    mockList.mockResolvedValue({ results: [] });
    const result = await runCli(["evaluator", "list"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("No evaluators found");
  });

  it("test_list_evaluators_with_pagination", async () => {
    mockList.mockResolvedValue({
      results: [{ id: "eval-123", name: "Test Evaluator 1", status: "active", created_at: "" }],
      next: "cursor=next_page_token",
    });
    const result = await runCli(["evaluator", "list"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Next page available");
  });

  it("test_list_evaluators_with_filters", async () => {
    mockList.mockResolvedValue({
      results: [{ id: "eval-123", name: "Test Evaluator 1", status: "active", created_at: "" }],
    });
    const result = await runCli([
      "evaluator",
      "list",
      "--page-size",
      "10",
      "--search",
      "test",
      "--name",
      "Test Evaluator",
      "--is-preset",
    ]);
    expect(result.exitCode).toBe(0);
    expect(mockList).toHaveBeenCalledWith(
      expect.objectContaining({
        page_size: 10,
        search: "test",
        name: "Test Evaluator",
        is_preset: true,
      }),
    );
  });
});

// --- TestEvaluatorGet ---

describe("TestEvaluatorGet", () => {
  it("test_get_evaluator_success", async () => {
    mockGet.mockResolvedValue(sampleEvaluator);
    const result = await runCli(["evaluator", "get", "eval-123"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Test Evaluator");
  });

  it("test_get_evaluator_not_found", async () => {
    mockGet.mockRejectedValue(new Error("Not found"));
    const result = await runCli(["evaluator", "get", "nonexistent"]);
    expect(result.exitCode).toBe(0); // SDK errors print and exit 0
  });
});

// --- TestEvaluatorCreate ---

describe("TestEvaluatorCreate", () => {
  it("test_create_evaluator_with_intent", async () => {
    mockCreate.mockResolvedValue(sampleEvaluator);
    const result = await runCli([
      "evaluator",
      "create",
      "--name",
      "New Evaluator",
      "--scoring-criteria",
      "Does the {{ response }} work?",
      "--intent",
      "Evaluate quality",
    ]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Evaluator created successfully");
  });

  it("test_create_evaluator_with_objective_id", async () => {
    mockCreate.mockResolvedValue(sampleEvaluator);
    const result = await runCli([
      "evaluator",
      "create",
      "--name",
      "New Evaluator",
      "--scoring-criteria",
      "Does the {{ response }} work?",
      "--objective-id",
      "obj-123",
    ]);
    expect(result.exitCode).toBe(0);
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it("test_create_evaluator_missing_placeholder", async () => {
    const result = await runCli([
      "evaluator",
      "create",
      "--name",
      "New Evaluator",
      "--scoring-criteria",
      "Does it work?",
      "--intent",
      "Evaluate quality",
    ]);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("{{ request }}");
    expect(result.stderr).toContain("{{ response }}");
  });

  it("test_create_evaluator_placeholder_without_spaces", async () => {
    mockCreate.mockResolvedValue(sampleEvaluator);
    const result = await runCli([
      "evaluator",
      "create",
      "--name",
      "New Evaluator",
      "--scoring-criteria",
      "Does the {{response}} work?",
      "--intent",
      "Evaluate quality",
    ]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Evaluator created successfully");
  });

  it("test_create_evaluator_missing_intent_and_objective_id", async () => {
    const result = await runCli([
      "evaluator",
      "create",
      "--name",
      "New Evaluator",
      "--scoring-criteria",
      "Does the {{ response }} work?",
    ]);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("Either --intent or --objective-id is required");
  });

  it("test_create_evaluator_missing_required_args", async () => {
    const r1 = await runCli(["evaluator", "create", "--name", "Test"]);
    expect(r1.exitCode).not.toBe(0);

    const r2 = await runCli([
      "evaluator",
      "create",
      "--scoring-criteria",
      "criteria",
      "--intent",
      "test",
    ]);
    expect(r2.exitCode).not.toBe(0);
  });

  it("test_create_evaluator_invalid_models_json", async () => {
    const result = await runCli([
      "evaluator",
      "create",
      "--name",
      "New Evaluator",
      "--scoring-criteria",
      "Does the {{ response }} work?",
      "--intent",
      "Evaluate quality",
      "--models",
      "invalid-json",
    ]);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("Invalid JSON format");
  });
});

// --- TestEvaluatorUpdate ---

describe("TestEvaluatorUpdate", () => {
  it("test_update_evaluator_name", async () => {
    mockUpdate.mockResolvedValue(sampleEvaluator);
    const result = await runCli(["evaluator", "update", "eval-123", "--name", "Updated Evaluator"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Evaluator eval-123 updated successfully");
    expect(mockUpdate).toHaveBeenCalledWith(
      "eval-123",
      expect.objectContaining({ name: "Updated Evaluator" }),
    );
  });

  it("test_update_evaluator_scoring_criteria", async () => {
    mockUpdate.mockResolvedValue(sampleEvaluator);
    const result = await runCli([
      "evaluator",
      "update",
      "eval-123",
      "--scoring-criteria",
      "New scoring criteria",
    ]);
    expect(result.exitCode).toBe(0);
    expect(mockUpdate).toHaveBeenCalledWith(
      "eval-123",
      expect.objectContaining({ prompt: "New scoring criteria" }),
    );
  });

  it("test_update_evaluator_no_params", async () => {
    const result = await runCli(["evaluator", "update", "eval-123"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("No update parameters provided");
  });

  it("test_update_evaluator_invalid_models_json", async () => {
    const result = await runCli(["evaluator", "update", "eval-123", "--models", "invalid-json"]);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("Invalid JSON format");
  });
});

// --- TestEvaluatorDelete ---

describe("TestEvaluatorDelete", () => {
  it("test_delete_evaluator_success", async () => {
    mockDelete.mockResolvedValue(undefined);
    const { confirm } = await import("@inquirer/prompts");
    vi.mocked(confirm).mockResolvedValue(true);
    const result = await runCli(["evaluator", "delete", "eval-123"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Evaluator eval-123 deleted successfully");
  });

  it("test_delete_evaluator_with_yes_flag", async () => {
    mockDelete.mockResolvedValue(undefined);
    const result = await runCli(["evaluator", "delete", "eval-123", "--yes"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Evaluator eval-123 deleted successfully");
  });

  it("test_delete_evaluator_abort", async () => {
    const { confirm } = await import("@inquirer/prompts");
    vi.mocked(confirm).mockResolvedValue(false);
    const result = await runCli(["evaluator", "delete", "eval-123"]);
    expect(result.exitCode).toBe(1);
  });
});

// --- TestEvaluatorExecute ---

describe("TestEvaluatorExecute", () => {
  it("test_execute_evaluator_with_request", async () => {
    mockExecute.mockResolvedValue({ result: "success", score: 0.95 });
    const result = await runCli(["evaluator", "execute", "eval-123", "--request", "Test request"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Evaluator execution successful");
  });

  it("test_execute_evaluator_with_response", async () => {
    mockExecute.mockResolvedValue({ result: "success", score: 0.85 });
    const result = await runCli([
      "evaluator",
      "execute",
      "eval-123",
      "--response",
      "Test response",
    ]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Evaluator execution successful");
  });

  it("test_execute_evaluator_no_request_or_response", async () => {
    const result = await runCli(["evaluator", "execute", "eval-123"]);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("Either --request, --response, or --turns must be provided");
  });

  it("test_execute_evaluator_with_turns", async () => {
    mockExecute.mockResolvedValue({ result: "success", score: 0.9 });
    const turns = JSON.stringify([
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi there!" },
    ]);
    const result = await runCli(["evaluator", "execute", "eval-123", "--turns", turns]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Evaluator execution successful");
    expect(mockExecute).toHaveBeenCalledWith(
      "eval-123",
      expect.objectContaining({ turns: expect.any(Array) }),
    );
  });

  it("test_execute_evaluator_invalid_turns_json", async () => {
    const result = await runCli(["evaluator", "execute", "eval-123", "--turns", "invalid-json"]);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("Invalid JSON for --turns");
  });

  it("test_execute_evaluator_with_variables", async () => {
    mockExecute.mockResolvedValue({ result: "success", score: 0.9 });
    const result = await runCli([
      "evaluator",
      "execute",
      "eval-123",
      "--request",
      "Test request",
      "--variables",
      '{"lang":"EN","topic":"science"}',
    ]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Evaluator execution successful");
    expect(mockExecute).toHaveBeenCalledWith(
      "eval-123",
      expect.objectContaining({ variables: { lang: "EN", topic: "science" } }),
    );
  });

  it("test_execute_evaluator_invalid_variables_json", async () => {
    const result = await runCli([
      "evaluator",
      "execute",
      "eval-123",
      "--request",
      "Test request",
      "--variables",
      "invalid-json",
    ]);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("Invalid JSON for --variables");
  });

  it("test_execute_evaluator_invalid_contexts_json", async () => {
    const result = await runCli([
      "evaluator",
      "execute",
      "eval-123",
      "--request",
      "Test request",
      "--contexts",
      "invalid-json",
    ]);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("Invalid JSON for --contexts");
  });

  it("test_execute_evaluator_with_stdin_input", async () => {
    mockExecute.mockResolvedValue({ result: "success", score: 0.95 });
    const mockReadStdin = vi.fn().mockResolvedValue("Test response from stdin");

    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await executeEvaluator("eval-123", {}, mockReadStdin);
    spy.mockRestore();

    expect(mockReadStdin).toHaveBeenCalled();
    expect(mockExecute).toHaveBeenCalledWith(
      "eval-123",
      expect.objectContaining({ response: "Test response from stdin" }),
    );
  });

  it("test_execute_evaluator_stdin_priority_over_flag", async () => {
    mockExecute.mockResolvedValue({ result: "success", score: 0.95 });
    const mockReadStdin = vi.fn();

    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await executeEvaluator("eval-123", { response: "Response from flag" }, mockReadStdin);
    spy.mockRestore();

    expect(mockReadStdin).not.toHaveBeenCalled();
    expect(mockExecute).toHaveBeenCalledWith(
      "eval-123",
      expect.objectContaining({ response: "Response from flag" }),
    );
  });
});

// --- TestEvaluatorExecuteByName ---

describe("TestEvaluatorExecuteByName", () => {
  it("test_execute_evaluator_by_name_success", async () => {
    mockExecuteByName.mockResolvedValue({ result: "success", score: 0.88 });
    const result = await runCli([
      "evaluator",
      "execute-by-name",
      "Test Evaluator",
      "--request",
      "Test request",
    ]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Evaluator execution by name successful");
  });

  it("test_execute_evaluator_by_name_no_request_or_response", async () => {
    const result = await runCli(["evaluator", "execute-by-name", "Test Evaluator"]);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("Either --request, --response, or --turns must be provided");
  });

  it("test_execute_evaluator_by_name_with_variables", async () => {
    mockExecuteByName.mockResolvedValue({ result: "success", score: 0.9 });
    const result = await runCli([
      "evaluator",
      "execute-by-name",
      "Test Evaluator",
      "--request",
      "Test request",
      "--variables",
      '{"lang":"EN"}',
    ]);
    expect(result.exitCode).toBe(0);
    expect(mockExecuteByName).toHaveBeenCalledWith(
      "Test Evaluator",
      expect.objectContaining({ variables: { lang: "EN" } }),
    );
  });

  it("test_execute_evaluator_by_name_with_turns", async () => {
    mockExecuteByName.mockResolvedValue({ result: "success", score: 0.9 });
    const turns = JSON.stringify([{ role: "user", content: "Hello" }]);
    const result = await runCli([
      "evaluator",
      "execute-by-name",
      "Test Evaluator",
      "--turns",
      turns,
    ]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Evaluator execution by name successful");
    expect(mockExecuteByName).toHaveBeenCalledWith(
      "Test Evaluator",
      expect.objectContaining({ turns: expect.any(Array) }),
    );
  });

  it("test_execute_evaluator_by_name_with_stdin_input", async () => {
    mockExecuteByName.mockResolvedValue({ result: "success", score: 0.88 });
    const mockReadStdin = vi.fn().mockResolvedValue("Test response from stdin for named evaluator");

    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await executeEvaluatorByName("Test Evaluator", {}, mockReadStdin);
    spy.mockRestore();

    expect(mockReadStdin).toHaveBeenCalled();
    expect(mockExecuteByName).toHaveBeenCalledWith(
      "Test Evaluator",
      expect.objectContaining({ response: "Test response from stdin for named evaluator" }),
    );
  });

  it("test_execute_evaluator_by_name_stdin_priority_over_flag", async () => {
    mockExecuteByName.mockResolvedValue({ result: "success", score: 0.88 });
    const mockReadStdin = vi.fn();

    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await executeEvaluatorByName(
      "Test Evaluator",
      { response: "Response from flag for named evaluator" },
      mockReadStdin,
    );
    spy.mockRestore();

    expect(mockReadStdin).not.toHaveBeenCalled();
    expect(mockExecuteByName).toHaveBeenCalledWith(
      "Test Evaluator",
      expect.objectContaining({ response: "Response from flag for named evaluator" }),
    );
  });
});

// --- TestEvaluatorDuplicate ---

describe("TestEvaluatorDuplicate", () => {
  it("test_duplicate_evaluator_success", async () => {
    const duplicated = { ...sampleEvaluator, id: "eval-456", name: "Test Evaluator (Copy)" };
    mockDuplicate.mockResolvedValue(duplicated);
    const result = await runCli(["evaluator", "duplicate", "eval-123"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Evaluator eval-123 duplicated successfully");
  });
});
