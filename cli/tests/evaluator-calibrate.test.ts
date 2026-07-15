import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { Scorable } from "@root-signals/scorable";
import { runCli } from "./helpers/run-cli.js";

vi.mock("@root-signals/scorable");
vi.mock("@inquirer/prompts");
vi.mock("node:fs");

const mockCalibrateRun = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();

beforeEach(() => {
  vi.stubEnv("SCORABLE_API_KEY", "test-api-key");
  vi.mocked(Scorable).mockImplementation(function () {
    return {
      evaluators: {
        calibrateRun: mockCalibrateRun,
        create: mockCreate,
        update: mockUpdate,
      },
    } as unknown as Scorable;
  });
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("evaluator calibrate", () => {
  it("starts a calibration run", async () => {
    mockCalibrateRun.mockResolvedValue({ id: "run-1", status: "pending" });

    const result = await runCli([
      "evaluator",
      "calibrate",
      "ev-1",
      "--dataset-id",
      "ds-1",
      "--score-config-id",
      "sc-1",
    ]);

    expect(result.exitCode).toBe(0);
    expect(mockCalibrateRun).toHaveBeenCalledWith("ev-1", {
      datasetId: "ds-1",
      scoreConfigId: "sc-1",
    });
  });
});

describe("evaluator update --demonstration-dataset", () => {
  it("sends demonstration_dataset_id", async () => {
    mockUpdate.mockResolvedValue({ id: "ev-1" });

    await runCli(["evaluator", "update", "ev-1", "--demonstration-dataset", "ds-1"]);

    expect(mockUpdate).toHaveBeenCalledWith(
      "ev-1",
      expect.objectContaining({ demonstration_dataset_id: "ds-1" }),
    );
  });
});
