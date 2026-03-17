import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { Scorable } from "@root-signals/scorable";
import { runCli } from "./helpers/run-cli.js";

vi.mock("@root-signals/scorable");

const mockList = vi.fn();
const mockGet = vi.fn();

const sampleLog = {
  id: "log-123",
  executed_item_name: "Test Evaluator",
  execution_type: "evaluator",
  score: 0.85,
  cost: 0.002,
  created_at: "2024-01-01T12:00:00Z",
  session_id: "session-abc",
  user_id: "user-xyz",
  tags: ["test"],
};

beforeEach(() => {
  vi.stubEnv("SCORABLE_API_KEY", "test-api-key");
  vi.mocked(Scorable).mockImplementation(function () {
    return {
      executionLogs: {
        list: mockList,
        get: mockGet,
      },
    } as unknown as Scorable;
  });
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

// --- TestExecutionLogList ---

describe("TestExecutionLogList", () => {
  it("test_list_logs_success", async () => {
    mockList.mockResolvedValue({
      results: [
        sampleLog,
        {
          ...sampleLog,
          id: "log-456",
          executed_item_name: "Another Evaluator",
          score: 0.5,
        },
      ],
    });
    const result = await runCli(["execution-log", "list"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Test Evaluator");
    expect(result.stdout).toContain("Another Evaluator");
  });

  it("test_list_logs_empty", async () => {
    mockList.mockResolvedValue({ results: [] });
    const result = await runCli(["execution-log", "list"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("No execution logs found");
  });

  it("test_list_logs_with_pagination", async () => {
    mockList.mockResolvedValue({
      results: [sampleLog],
      next: "cursor=next_page_token",
    });
    const result = await runCli(["execution-log", "list"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Next page available");
  });

  it("test_list_logs_with_filters", async () => {
    mockList.mockResolvedValue({ results: [sampleLog] });
    const result = await runCli([
      "execution-log",
      "list",
      "--page-size",
      "10",
      "--evaluator-id",
      "eval-123",
      "--score-min",
      "0.5",
      "--score-max",
      "1.0",
      "--tags",
      "prod,test",
    ]);
    expect(result.exitCode).toBe(0);
    expect(mockList).toHaveBeenCalledWith(
      expect.objectContaining({
        page_size: 10,
        evaluator_id: "eval-123",
        score_min: 0.5,
        score_max: 1.0,
        tags: "prod,test",
      }),
    );
  });

  it("test_list_logs_with_judge_filter", async () => {
    mockList.mockResolvedValue({ results: [sampleLog] });
    const result = await runCli(["execution-log", "list", "--judge-id", "judge-123"]);
    expect(result.exitCode).toBe(0);
    expect(mockList).toHaveBeenCalledWith(expect.objectContaining({ judge_id: "judge-123" }));
  });

  it("test_list_logs_with_date_range", async () => {
    mockList.mockResolvedValue({ results: [sampleLog] });
    const result = await runCli([
      "execution-log",
      "list",
      "--created-at-after",
      "2024-01-01",
      "--created-at-before",
      "2024-12-31",
    ]);
    expect(result.exitCode).toBe(0);
    expect(mockList).toHaveBeenCalledWith(
      expect.objectContaining({
        created_at_after: "2024-01-01",
        created_at_before: "2024-12-31",
      }),
    );
  });
});

// --- TestExecutionLogGet ---

describe("TestExecutionLogGet", () => {
  it("test_get_log_success", async () => {
    mockGet.mockResolvedValue({ ...sampleLog, rendered_prompt: "prompt text" });
    const result = await runCli(["execution-log", "get", "log-123"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("log-123");
  });

  it("test_get_log_not_found", async () => {
    mockGet.mockRejectedValue(new Error("Not found"));
    const result = await runCli(["execution-log", "get", "nonexistent"]);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("Not found");
  });
});
