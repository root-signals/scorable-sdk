import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { Scorable } from "@root-signals/scorable";
import { runCli } from "./helpers/run-cli.js";

vi.mock("@root-signals/scorable");
vi.mock("@inquirer/prompts");
vi.mock("node:fs");

const mockAddItem = vi.fn();
const mockAddItems = vi.fn();
const mockListItems = vi.fn();
const mockArchiveItem = vi.fn();

beforeEach(() => {
  vi.stubEnv("SCORABLE_API_KEY", "test-api-key");
  vi.mocked(Scorable).mockImplementation(function () {
    return {
      datasets: {
        addItem: mockAddItem,
        addItems: mockAddItems,
        listItems: mockListItems,
        archiveItem: mockArchiveItem,
      },
    } as unknown as Scorable;
  });
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("dataset-item add", () => {
  it("adds a single item", async () => {
    mockAddItem.mockResolvedValue({ id: "di-1" });

    const result = await runCli([
      "dataset-item",
      "add",
      "ds-1",
      "--response",
      "A.",
      "--metadata",
      '{"src":"manual"}',
    ]);

    expect(result.exitCode).toBe(0);
    expect(mockAddItem).toHaveBeenCalledWith(
      "ds-1",
      expect.objectContaining({ response: "A.", metadata: { src: "manual" } }),
    );
  });
});

describe("dataset-item add-bulk", () => {
  it("bulk adds items from JSON", async () => {
    mockAddItems.mockResolvedValue([{ id: "di-1" }, { id: "di-2" }]);

    await runCli([
      "dataset-item",
      "add-bulk",
      "ds-1",
      "--items",
      '[{"response":"r0"},{"response":"r1"}]',
    ]);

    expect(mockAddItems).toHaveBeenCalledWith("ds-1", [{ response: "r0" }, { response: "r1" }]);
  });
});

describe("dataset-item list", () => {
  it("excludes archived by default", async () => {
    mockListItems.mockResolvedValue({ results: [{ id: "di-1" }] });

    await runCli(["dataset-item", "list", "ds-1"]);

    expect(mockListItems).toHaveBeenCalledWith("ds-1", { includeArchived: false });
  });
});

describe("dataset-item archive", () => {
  it("archives an item", async () => {
    mockArchiveItem.mockResolvedValue(undefined);

    await runCli(["dataset-item", "archive", "ds-1", "di-1"]);

    expect(mockArchiveItem).toHaveBeenCalledWith("ds-1", "di-1");
  });
});
