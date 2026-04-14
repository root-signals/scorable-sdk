import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { Scorable } from "@root-signals/scorable";
import { runCli } from "./helpers/run-cli.js";
import { executeJudge } from "../src/commands/judge/execute.js";
import { executeJudgeByName } from "../src/commands/judge/execute-by-name.js";

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
const mockGenerate = vi.fn();

const sampleJudge = {
  id: "judge-123",
  name: "Test Judge",
  intent: "Test intent",
  created_at: "2024-01-01T12:00:00Z",
  status: "active",
  evaluator_references: [{ id: "eval-123" }],
};

beforeEach(() => {
  vi.stubEnv("SCORABLE_API_KEY", "test-api-key");
  vi.mocked(Scorable).mockImplementation(function () {
    return {
      judges: {
        list: mockList,
        get: mockGet,
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete,
        execute: mockExecute,
        executeByName: mockExecuteByName,
        duplicate: mockDuplicate,
        generate: mockGenerate,
      },
    } as unknown as Scorable;
  });
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

// --- TestJudgeList ---

describe("TestJudgeList", () => {
  it("test_list_judges_success", async () => {
    mockList.mockResolvedValue({
      results: [
        {
          id: "judge-123",
          name: "Test Judge 1",
          intent: "Test intent 1",
          created_at: "2024-01-01",
          status: "active",
        },
        {
          id: "judge-456",
          name: "Test Judge 2",
          intent: "Test intent 2",
          created_at: "2024-01-02",
          status: "inactive",
        },
      ],
    });
    const result = await runCli(["judge", "list"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Test Judge 1");
    expect(result.stdout).toContain("Test Judge 2");
  });

  it("test_list_judges_with_filters", async () => {
    mockList.mockResolvedValue({
      results: [
        { id: "judge-123", name: "Test Judge 1", intent: "intent", created_at: "", status: "" },
      ],
    });
    const result = await runCli([
      "judge",
      "list",
      "--page-size",
      "10",
      "--search",
      "test",
      "--name",
      "Test Judge",
    ]);
    expect(result.exitCode).toBe(0);
    expect(mockList).toHaveBeenCalledWith(
      expect.objectContaining({
        page_size: 10,
        search: "test",
        name: "Test Judge",
      }),
    );
  });

  it("test_list_judges_empty", async () => {
    mockList.mockResolvedValue({ results: [] });
    const result = await runCli(["judge", "list"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("No judges found");
  });

  it("test_list_judges_with_pagination", async () => {
    mockList.mockResolvedValue({
      results: [
        { id: "judge-123", name: "Test Judge 1", intent: "intent", created_at: "", status: "" },
      ],
      next: "cursor=next_page_token",
    });
    const result = await runCli(["judge", "list"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Next page available");
  });
});

// --- TestJudgeGet ---

describe("TestJudgeGet", () => {
  it("test_get_judge_success", async () => {
    mockGet.mockResolvedValue(sampleJudge);
    const result = await runCli(["judge", "get", "judge-123"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Test Judge");
  });

  it("test_get_judge_not_found", async () => {
    mockGet.mockRejectedValue(new Error("Not found"));
    const result = await runCli(["judge", "get", "nonexistent"]);
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("Not found");
  });
});

// --- TestJudgeCreate ---

describe("TestJudgeCreate", () => {
  it("test_create_judge_basic", async () => {
    mockCreate.mockResolvedValue(sampleJudge);
    const result = await runCli([
      "judge",
      "create",
      "--name",
      "New Judge",
      "--intent",
      "New intent",
    ]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Judge created successfully");
  });

  it("test_create_judge_with_stage", async () => {
    mockCreate.mockResolvedValue(sampleJudge);
    const result = await runCli([
      "judge",
      "create",
      "--name",
      "New Judge",
      "--intent",
      "New intent",
      "--stage",
      "production",
    ]);
    expect(result.exitCode).toBe(0);
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it("test_create_judge_with_evaluator_references", async () => {
    mockCreate.mockResolvedValue(sampleJudge);
    const result = await runCli([
      "judge",
      "create",
      "--name",
      "New Judge",
      "--intent",
      "New intent",
      "--evaluator-references",
      '[{"id": "eval-123"}]',
    ]);
    expect(result.exitCode).toBe(0);
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it("test_create_judge_invalid_json", async () => {
    const result = await runCli([
      "judge",
      "create",
      "--name",
      "New Judge",
      "--intent",
      "New intent",
      "--evaluator-references",
      "invalid-json",
    ]);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("Invalid JSON format");
  });

  it("test_create_judge_missing_required_args", async () => {
    const r1 = await runCli(["judge", "create", "--name", "Test"]);
    expect(r1.exitCode).not.toBe(0);

    const r2 = await runCli(["judge", "create", "--intent", "Test"]);
    expect(r2.exitCode).not.toBe(0);
  });
});

// --- TestJudgeUpdate ---

describe("TestJudgeUpdate", () => {
  it("test_update_judge_name", async () => {
    mockUpdate.mockResolvedValue(sampleJudge);
    const result = await runCli(["judge", "update", "judge-123", "--name", "Updated Judge"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Judge judge-123 updated successfully");
    expect(mockUpdate).toHaveBeenCalledWith(
      "judge-123",
      expect.objectContaining({ name: "Updated Judge" }),
    );
  });

  it("test_update_judge_stage", async () => {
    mockUpdate.mockResolvedValue(sampleJudge);
    const result = await runCli(["judge", "update", "judge-123", "--stage", "production"]);
    expect(result.exitCode).toBe(0);
    expect(mockUpdate).toHaveBeenCalledWith(
      "judge-123",
      expect.objectContaining({ stage: "production" }),
    );
  });

  it("test_update_judge_evaluator_references", async () => {
    mockUpdate.mockResolvedValue(sampleJudge);
    const result = await runCli([
      "judge",
      "update",
      "judge-123",
      "--evaluator-references",
      '[{"id": "eval-456"}]',
    ]);
    expect(result.exitCode).toBe(0);
    expect(mockUpdate).toHaveBeenCalledWith(
      "judge-123",
      expect.objectContaining({ evaluator_references: [{ id: "eval-456" }] }),
    );
  });

  it("test_update_judge_clear_evaluator_references", async () => {
    mockUpdate.mockResolvedValue(sampleJudge);
    const result = await runCli(["judge", "update", "judge-123", "--evaluator-references", "[]"]);
    expect(result.exitCode).toBe(0);
    expect(mockUpdate).toHaveBeenCalledOnce();
  });

  it("test_update_judge_invalid_json", async () => {
    const result = await runCli([
      "judge",
      "update",
      "judge-123",
      "--evaluator-references",
      "invalid-json",
    ]);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("Invalid JSON format");
  });

  it("test_update_judge_no_params", async () => {
    const result = await runCli(["judge", "update", "judge-123"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("No update parameters provided");
  });
});

// --- TestJudgeDelete ---

describe("TestJudgeDelete", () => {
  it("test_delete_judge_success", async () => {
    mockDelete.mockResolvedValue(undefined);
    const { confirm } = await import("@inquirer/prompts");
    vi.mocked(confirm).mockResolvedValue(true);
    const result = await runCli(["judge", "delete", "judge-123"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Judge judge-123 deleted successfully");
  });

  it("test_delete_judge_with_yes_flag", async () => {
    mockDelete.mockResolvedValue(undefined);
    const result = await runCli(["judge", "delete", "judge-123", "--yes"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Judge judge-123 deleted successfully");
  });

  it("test_delete_judge_abort", async () => {
    const { confirm } = await import("@inquirer/prompts");
    vi.mocked(confirm).mockResolvedValue(false);
    const result = await runCli(["judge", "delete", "judge-123"]);
    expect(result.exitCode).toBe(1);
  });
});

// --- TestJudgeExecute ---

describe("TestJudgeExecute", () => {
  it("test_execute_judge_with_request", async () => {
    mockExecute.mockResolvedValue({ result: "success", score: 0.95 });
    const result = await runCli(["judge", "execute", "judge-123", "--request", "Test request"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Judge execution successful");
  });

  it("test_execute_judge_with_response", async () => {
    mockExecute.mockResolvedValue({ result: "success", score: 0.85 });
    const result = await runCli(["judge", "execute", "judge-123", "--response", "Test response"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Judge execution successful");
  });

  it("test_execute_judge_with_all_params", async () => {
    mockExecute.mockResolvedValue({ result: "success", score: 0.9 });
    const result = await runCli([
      "judge",
      "execute",
      "judge-123",
      "--request",
      "Test request",
      "--response",
      "Test response",
      "--contexts",
      '["context1", "context2"]',
      "--expected-output",
      "Expected output",
      "--tag",
      "tag1",
      "--tag",
      "tag2",
    ]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Judge execution successful");
    expect(mockExecute).toHaveBeenCalledOnce();
  });

  it("test_execute_judge_no_request_or_response", async () => {
    const result = await runCli(["judge", "execute", "judge-123"]);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("Either --request, --response, or --turns must be provided");
  });

  it("test_execute_judge_with_turns", async () => {
    mockExecute.mockResolvedValue({ result: "success", score: 0.9 });
    const turns = JSON.stringify([
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi there!" },
    ]);
    const result = await runCli(["judge", "execute", "judge-123", "--turns", turns]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Judge execution successful");
    expect(mockExecute).toHaveBeenCalledWith(
      "judge-123",
      expect.objectContaining({ turns: expect.any(Array) }),
    );
  });

  it("test_execute_judge_invalid_turns_json", async () => {
    const result = await runCli(["judge", "execute", "judge-123", "--turns", "invalid-json"]);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("Invalid JSON for --turns");
  });

  it("test_execute_judge_invalid_contexts_json", async () => {
    const result = await runCli([
      "judge",
      "execute",
      "judge-123",
      "--request",
      "Test request",
      "--contexts",
      "invalid-json",
    ]);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("Invalid JSON for --contexts");
  });

  it("test_execute_judge_with_stdin_input", async () => {
    mockExecute.mockResolvedValue({ result: "success", score: 0.95 });
    const mockReadStdin = vi.fn().mockResolvedValue("Test response from stdin");

    // Silence output
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await executeJudge("judge-123", {}, mockReadStdin);
    spy.mockRestore();

    expect(mockReadStdin).toHaveBeenCalled();
    expect(mockExecute).toHaveBeenCalledWith(
      "judge-123",
      expect.objectContaining({ response: "Test response from stdin" }),
    );
  });

  it("test_execute_judge_stdin_priority_over_flag", async () => {
    mockExecute.mockResolvedValue({ result: "success", score: 0.95 });
    const mockReadStdin = vi.fn();

    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await executeJudge("judge-123", { response: "Response from flag" }, mockReadStdin);
    spy.mockRestore();

    expect(mockReadStdin).not.toHaveBeenCalled();
    expect(mockExecute).toHaveBeenCalledWith(
      "judge-123",
      expect.objectContaining({ response: "Response from flag" }),
    );
  });
});

// --- TestJudgeExecuteByName ---

describe("TestJudgeExecuteByName", () => {
  it("test_execute_judge_by_name_success", async () => {
    mockExecuteByName.mockResolvedValue({ result: "success", score: 0.88 });
    const result = await runCli([
      "judge",
      "execute-by-name",
      "Test Judge",
      "--request",
      "Test request",
    ]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Judge execution by name successful");
  });

  it("test_execute_judge_by_name_no_request_or_response", async () => {
    const result = await runCli(["judge", "execute-by-name", "Test Judge"]);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("Either --request, --response, or --turns must be provided");
  });

  it("test_execute_judge_by_name_with_turns", async () => {
    mockExecuteByName.mockResolvedValue({ result: "success", score: 0.9 });
    const turns = JSON.stringify([{ role: "user", content: "Hello" }]);
    const result = await runCli(["judge", "execute-by-name", "Test Judge", "--turns", turns]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Judge execution by name successful");
    expect(mockExecuteByName).toHaveBeenCalledWith(
      "Test Judge",
      expect.objectContaining({ turns: expect.any(Array) }),
    );
  });

  it("test_execute_judge_by_name_with_stdin_input", async () => {
    mockExecuteByName.mockResolvedValue({ result: "success", score: 0.88 });
    const mockReadStdin = vi.fn().mockResolvedValue("Test response from stdin for named judge");

    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await executeJudgeByName("Test Judge", {}, mockReadStdin);
    spy.mockRestore();

    expect(mockReadStdin).toHaveBeenCalled();
    expect(mockExecuteByName).toHaveBeenCalledWith(
      "Test Judge",
      expect.objectContaining({ response: "Test response from stdin for named judge" }),
    );
  });

  it("test_execute_judge_by_name_stdin_priority_over_flag", async () => {
    mockExecuteByName.mockResolvedValue({ result: "success", score: 0.88 });
    const mockReadStdin = vi.fn();

    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await executeJudgeByName(
      "Test Judge",
      { response: "Response from flag for named judge" },
      mockReadStdin,
    );
    spy.mockRestore();

    expect(mockReadStdin).not.toHaveBeenCalled();
    expect(mockExecuteByName).toHaveBeenCalledWith(
      "Test Judge",
      expect.objectContaining({ response: "Response from flag for named judge" }),
    );
  });
});

// --- TestJudgeDuplicate ---

describe("TestJudgeDuplicate", () => {
  it("test_duplicate_judge_success", async () => {
    const duplicated = { ...sampleJudge, id: "judge-456", name: "Test Judge (Copy)" };
    mockDuplicate.mockResolvedValue(duplicated);
    const result = await runCli(["judge", "duplicate", "judge-123"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Judge judge-123 duplicated successfully");
  });
});

// --- TestJudgeGenerate ---

describe("TestJudgeGenerate", () => {
  it("test_generate_judge_success", async () => {
    mockGenerate.mockResolvedValue({ judge_id: "judge-abc", error_code: null });
    const result = await runCli(["judge", "generate", "--intent", "Evaluate response quality"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Judge generated successfully");
  });

  it("test_generate_judge_missing_intent", async () => {
    const result = await runCli(["judge", "generate"]);
    expect(result.exitCode).not.toBe(0);
  });

  it("test_generate_judge_multiple_stages", async () => {
    mockGenerate.mockResolvedValue({
      judge_id: null,
      error_code: "multiple_stages",
      stages: ["intent capture", "response generation"],
    });
    const result = await runCli([
      "judge",
      "generate",
      "--intent",
      "Evaluate a customer support pipeline",
    ]);
    expect(result.exitCode).not.toBe(0);
    expect(result.stdout).toContain("Multiple evaluation stages detected");
    expect(result.stdout).toContain("intent capture");
    expect(result.stdout).toContain("response generation");
    expect(result.stdout).toContain("--stage");
  });

  it("test_generate_judge_missing_context", async () => {
    mockGenerate.mockResolvedValue({
      judge_id: "judge-abc",
      error_code: null,
      missing_context_from_system_goal: [
        { form_field_name: "Tone Of Voice", form_field_description: "Describe the brand tone" },
        { form_field_name: "Domain", form_field_description: "Describe the application domain" },
      ],
    });
    const result = await runCli(["judge", "generate", "--intent", "Evaluate chatbot responses"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("additional context would improve it");
    expect(result.stdout).toContain("Tone Of Voice");
    expect(result.stdout).toContain("Re-run with --judge-id");
  });

  it("test_generate_judge_invalid_extra_contexts_json", async () => {
    const result = await runCli([
      "judge",
      "generate",
      "--intent",
      "Evaluate responses",
      "--extra-contexts",
      "invalid-json",
    ]);
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("Invalid --extra-contexts JSON");
  });

  it("test_generate_judge_with_judge_id_and_extra_contexts", async () => {
    mockGenerate.mockResolvedValue({ judge_id: "judge-abc", error_code: null });
    const result = await runCli([
      "judge",
      "generate",
      "--intent",
      "Evaluate hotel chatbot responses",
      "--judge-id",
      "judge-abc",
      "--extra-contexts",
      '{"Domain":"hotel","Tone":"formal"}',
    ]);
    expect(result.exitCode).toBe(0);
    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        judge_id: "judge-abc",
        extra_contexts: { Domain: "hotel", Tone: "formal" },
      }),
    );
  });

  it("test_generate_judge_with_context_aware", async () => {
    mockGenerate.mockResolvedValue({ judge_id: "judge-abc", error_code: null });
    const result = await runCli([
      "judge",
      "generate",
      "--intent",
      "Evaluate RAG responses",
      "--context-aware",
    ]);
    expect(result.exitCode).toBe(0);
    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({ enable_context_aware_evaluators: true }),
    );
  });

  it("test_generate_judge_api_error", async () => {
    mockGenerate.mockRejectedValue(new Error("Generation failed"));
    const result = await runCli(["judge", "generate", "--intent", "Evaluate responses"]);
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("Generation failed");
  });

  it("test_generate_judge_other_error_code", async () => {
    mockGenerate.mockResolvedValue({ judge_id: null, error_code: "invalid_intent" });
    const result = await runCli(["judge", "generate", "--intent", "Evaluate responses"]);
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("invalid_intent");
  });
});
