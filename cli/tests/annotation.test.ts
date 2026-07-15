import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { Scorable } from "@root-signals/scorable";
import { runCli } from "./helpers/run-cli.js";

vi.mock("@root-signals/scorable");
vi.mock("@inquirer/prompts");
vi.mock("node:fs");

const mockCreate = vi.fn();
const mockList = vi.fn();
const mockGet = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

beforeEach(() => {
  vi.stubEnv("SCORABLE_API_KEY", "test-api-key");
  vi.mocked(Scorable).mockImplementation(function () {
    return {
      annotations: {
        create: mockCreate,
        list: mockList,
        get: mockGet,
        update: mockUpdate,
        delete: mockDelete,
      },
    } as unknown as Scorable;
  });
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("annotation create", () => {
  it("creates an annotation on a dataset item", async () => {
    mockCreate.mockResolvedValue({ id: "ann-1", value: 1.0 });

    const result = await runCli([
      "annotation",
      "create",
      "--dataset-item-id",
      "di-1",
      "--category",
      "👍",
    ]);

    expect(result.exitCode).toBe(0);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ datasetItemId: "di-1", category: "👍" }),
    );
  });

  it("rejects when no target is provided", async () => {
    const result = await runCli(["annotation", "create", "--value", "0.5"]);

    expect(mockCreate).not.toHaveBeenCalled();
    expect(result.stderr).toMatch(/exactly one of --dataset-item-id or --execution-log-id/i);
  });
});

describe("annotation list", () => {
  it("forwards filters", async () => {
    mockList.mockResolvedValue({ results: [{ id: "ann-1" }] });

    await runCli(["annotation", "list", "--dataset", "ds-1", "--status", "published"]);

    expect(mockList).toHaveBeenCalledWith(
      expect.objectContaining({ dataset: "ds-1", status: "published" }),
    );
  });
});

describe("annotation delete", () => {
  it("deletes an annotation", async () => {
    mockDelete.mockResolvedValue(undefined);

    await runCli(["annotation", "delete", "ann-1"]);

    expect(mockDelete).toHaveBeenCalledWith("ann-1");
  });
});
