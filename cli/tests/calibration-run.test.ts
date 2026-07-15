import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { Scorable } from "@root-signals/scorable";
import { runCli } from "./helpers/run-cli.js";

vi.mock("@root-signals/scorable");
vi.mock("@inquirer/prompts");
vi.mock("node:fs");

const mockCreate = vi.fn();
const mockGet = vi.fn();
const mockList = vi.fn();
const mockListItems = vi.fn();

beforeEach(() => {
  vi.stubEnv("SCORABLE_API_KEY", "test-api-key");
  vi.mocked(Scorable).mockImplementation(function () {
    return {
      calibrationRuns: {
        create: mockCreate,
        get: mockGet,
        list: mockList,
        listItems: mockListItems,
      },
    } as unknown as Scorable;
  });
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("calibration-run create", () => {
  it("starts a run against a dataset", async () => {
    mockCreate.mockResolvedValue({ id: "run-1", status: "pending" });

    const result = await runCli([
      "calibration-run",
      "create",
      "--evaluator-id",
      "ev-1",
      "--dataset-id",
      "ds-1",
      "--score-config-id",
      "sc-1",
    ]);

    expect(result.exitCode).toBe(0);
    expect(mockCreate).toHaveBeenCalledWith({
      evaluatorId: "ev-1",
      datasetId: "ds-1",
      scoreConfigId: "sc-1",
    });
  });
});

describe("calibration-run get / items", () => {
  it("gets a run", async () => {
    mockGet.mockResolvedValue({ id: "run-1", status: "completed" });
    await runCli(["calibration-run", "get", "run-1"]);
    expect(mockGet).toHaveBeenCalledWith("run-1");
  });

  it("lists items", async () => {
    mockListItems.mockResolvedValue({ results: [{ id: "i-1" }] });
    await runCli(["calibration-run", "items", "run-1"]);
    expect(mockListItems).toHaveBeenCalledWith("run-1");
  });
});
