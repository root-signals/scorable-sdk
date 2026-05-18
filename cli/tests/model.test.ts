import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { Scorable } from "@root-signals/scorable";
import { runCli } from "./helpers/run-cli.js";

vi.mock("@root-signals/scorable");
vi.mock("@inquirer/prompts");

const mockList = vi.fn();
const mockGet = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockPatch = vi.fn();
const mockDelete = vi.fn();
const mockVerify = vi.fn();

const sampleModel = {
  id: "model-123",
  name: "my-custom-gpt",
  model: "gpt-4-turbo",
  max_token_count: 8000,
  max_output_token_count: 4000,
};

const sampleModelList = {
  id: "model-123",
  name: "my-custom-gpt",
  owner: { id: "user-1", first_name: "A", last_name: "B" },
  provider: { id: "p-1", name: "OpenAI" },
  visibility: "PRIVATE",
};

beforeEach(() => {
  vi.stubEnv("SCORABLE_API_KEY", "test-api-key");
  vi.mocked(Scorable).mockImplementation(function () {
    return {
      models: {
        list: mockList,
        get: mockGet,
        create: mockCreate,
        update: mockUpdate,
        patch: mockPatch,
        delete: mockDelete,
        verify: mockVerify,
      },
    } as unknown as Scorable;
  });
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

// --- TestModelList ---

describe("TestModelList", () => {
  it("test_list_models_success", async () => {
    mockList.mockResolvedValue({
      results: [sampleModelList, { ...sampleModelList, id: "model-456", name: "another" }],
    });
    const result = await runCli(["model", "list"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("my-custom-gpt");
    expect(result.stdout).toContain("another");
    expect(result.stdout).toContain("OpenAI");
  });

  it("test_list_models_empty", async () => {
    mockList.mockResolvedValue({ results: [] });
    const result = await runCli(["model", "list"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("No models found");
  });

  it("test_list_models_with_pagination_flags", async () => {
    mockList.mockResolvedValue({ results: [sampleModelList] });
    const result = await runCli([
      "model",
      "list",
      "--page-size",
      "10",
      "--cursor",
      "abc",
      "--ordering",
      "name",
    ]);
    expect(result.exitCode).toBe(0);
    expect(mockList).toHaveBeenCalledWith(
      expect.objectContaining({ page_size: 10, cursor: "abc", ordering: "name" }),
    );
  });

  it("test_list_models_with_next_page", async () => {
    mockList.mockResolvedValue({
      results: [sampleModelList],
      next: "cursor=next_token",
    });
    const result = await runCli(["model", "list"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Next page available");
  });

  it("test_list_models_api_error", async () => {
    mockList.mockRejectedValue(new Error("boom"));
    const result = await runCli(["model", "list"]);
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("boom");
  });
});

// --- TestModelGet ---

describe("TestModelGet", () => {
  it("test_get_model_success", async () => {
    mockGet.mockResolvedValue(sampleModel);
    const result = await runCli(["model", "get", "model-123"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("my-custom-gpt");
  });

  it("test_get_model_not_found", async () => {
    mockGet.mockRejectedValue(new Error("Not found"));
    const result = await runCli(["model", "get", "nonexistent"]);
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("Not found");
  });
});

// --- TestModelCreate ---

describe("TestModelCreate", () => {
  it("test_create_model_basic", async () => {
    mockCreate.mockResolvedValue(sampleModel);
    const result = await runCli(["model", "create", "--name", "my-custom-gpt"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Model created successfully");
    expect(mockCreate).toHaveBeenCalledWith({ name: "my-custom-gpt" });
  });

  it("test_create_model_full_payload", async () => {
    mockCreate.mockResolvedValue(sampleModel);
    const result = await runCli([
      "model",
      "create",
      "--name",
      "my-custom-gpt",
      "--model",
      "gpt-4-turbo",
      "--url",
      "https://example.com",
      "--key",
      "sk-test",
      "--max-token-count",
      "8000",
      "--max-output-token-count",
      "4000",
    ]);
    expect(result.exitCode).toBe(0);
    expect(mockCreate).toHaveBeenCalledWith({
      name: "my-custom-gpt",
      model: "gpt-4-turbo",
      url: "https://example.com",
      default_key: "sk-test",
      max_token_count: 8000,
      max_output_token_count: 4000,
    });
  });

  it("test_create_model_missing_name", async () => {
    const result = await runCli(["model", "create", "--model", "gpt-4-turbo"]);
    expect(result.exitCode).not.toBe(0);
  });

  it("test_create_model_api_error", async () => {
    mockCreate.mockRejectedValue(new Error("Already exists"));
    const result = await runCli(["model", "create", "--name", "dupe"]);
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("Already exists");
  });
});

// --- TestModelUpdate ---

describe("TestModelUpdate", () => {
  it("test_update_model_name", async () => {
    mockPatch.mockResolvedValue(sampleModel);
    const result = await runCli(["model", "update", "model-123", "--name", "renamed"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Model model-123 updated successfully");
    expect(mockPatch).toHaveBeenCalledWith("model-123", { name: "renamed" });
  });

  it("test_update_model_partial_fields", async () => {
    mockPatch.mockResolvedValue(sampleModel);
    const result = await runCli([
      "model",
      "update",
      "model-123",
      "--key",
      "sk-new",
      "--max-output-token-count",
      "1024",
    ]);
    expect(result.exitCode).toBe(0);
    expect(mockPatch).toHaveBeenCalledWith("model-123", {
      default_key: "sk-new",
      max_output_token_count: 1024,
    });
  });

  it("test_update_model_no_params", async () => {
    const result = await runCli(["model", "update", "model-123"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("No update parameters provided");
    expect(mockPatch).not.toHaveBeenCalled();
  });
});

// --- TestModelDelete ---

describe("TestModelDelete", () => {
  it("test_delete_model_with_yes_flag", async () => {
    mockDelete.mockResolvedValue(undefined);
    const result = await runCli(["model", "delete", "model-123", "--yes"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Model model-123 deleted successfully");
    expect(mockDelete).toHaveBeenCalledWith("model-123");
  });

  it("test_delete_model_confirmed", async () => {
    mockDelete.mockResolvedValue(undefined);
    const { confirm } = await import("@inquirer/prompts");
    vi.mocked(confirm).mockResolvedValue(true);
    const result = await runCli(["model", "delete", "model-123"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Model model-123 deleted successfully");
  });

  it("test_delete_model_aborted", async () => {
    const { confirm } = await import("@inquirer/prompts");
    vi.mocked(confirm).mockResolvedValue(false);
    const result = await runCli(["model", "delete", "model-123"]);
    expect(result.exitCode).toBe(1);
    expect(mockDelete).not.toHaveBeenCalled();
  });
});
