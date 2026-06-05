import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { Scorable } from "@root-signals/scorable";
import { runCli } from "./helpers/run-cli.js";

vi.mock("@root-signals/scorable", async () => {
  const actual =
    await vi.importActual<typeof import("@root-signals/scorable")>("@root-signals/scorable");
  return { ...actual, Scorable: vi.fn() };
});
vi.mock("@inquirer/prompts");

const mockList = vi.fn();
const mockRetrieve = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

const sampleProject = {
  id: "proj-123",
  name: "Production",
  description: "Prod env",
  is_default: true,
  created_at: "2025-01-01T00:00:00Z",
  owner: "user-1",
};

beforeEach(() => {
  vi.stubEnv("SCORABLE_API_KEY", "test-api-key");
  vi.mocked(Scorable).mockImplementation(function () {
    return {
      projects: {
        list: mockList,
        retrieve: mockRetrieve,
        create: mockCreate,
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

describe("project list", () => {
  it("lists projects and renders (default) marker", async () => {
    mockList.mockResolvedValue({
      results: [
        sampleProject,
        {
          id: "proj-456",
          name: "Staging",
          description: "Stage",
          is_default: false,
          created_at: "2025-01-02T00:00:00Z",
          owner: "user-1",
        },
      ],
    });
    const result = await runCli(["project", "list"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/Production \(default\)/);
    expect(result.stdout).toContain("Staging");
    // Staging line must not carry the marker.
    expect(result.stdout).not.toMatch(/Staging \(default\)/);
  });

  it("handles empty list", async () => {
    mockList.mockResolvedValue({ results: [] });
    const result = await runCli(["project", "list"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("No projects found");
  });
});

describe("project get", () => {
  it("fetches a single project", async () => {
    mockRetrieve.mockResolvedValue(sampleProject);
    const result = await runCli(["project", "get", "proj-123"]);
    expect(result.exitCode).toBe(0);
    expect(mockRetrieve).toHaveBeenCalledWith("proj-123");
    expect(result.stdout).toContain("proj-123");
  });
});

describe("project create", () => {
  it("creates with just a name", async () => {
    mockCreate.mockResolvedValue(sampleProject);
    const result = await runCli(["project", "create", "--name", "Production"]);
    expect(result.exitCode).toBe(0);
    expect(mockCreate).toHaveBeenCalledWith({ name: "Production" });
    expect(result.stdout).toContain("Project created successfully");
  });

  it("passes description and is_default", async () => {
    mockCreate.mockResolvedValue(sampleProject);
    const result = await runCli([
      "project",
      "create",
      "--name",
      "Production",
      "--description",
      "Prod env",
      "--is-default",
    ]);
    expect(result.exitCode).toBe(0);
    expect(mockCreate).toHaveBeenCalledWith({
      name: "Production",
      description: "Prod env",
      is_default: true,
    });
  });
});

describe("project update", () => {
  it("rejects when no params provided", async () => {
    const result = await runCli(["project", "update", "proj-123"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("No update parameters provided");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("forwards name and description", async () => {
    mockUpdate.mockResolvedValue(sampleProject);
    const result = await runCli([
      "project",
      "update",
      "proj-123",
      "--name",
      "Production v2",
      "--description",
      "updated",
    ]);
    expect(result.exitCode).toBe(0);
    expect(mockUpdate).toHaveBeenCalledWith("proj-123", {
      name: "Production v2",
      description: "updated",
    });
  });

  it("--is-default sets only is_default: true", async () => {
    mockUpdate.mockResolvedValue(sampleProject);
    const result = await runCli(["project", "update", "proj-123", "--is-default"]);
    expect(result.exitCode).toBe(0);
    expect(mockUpdate).toHaveBeenCalledWith("proj-123", { is_default: true });
  });
});

describe("project set-default", () => {
  it("PATCHes is_default: true", async () => {
    mockUpdate.mockResolvedValue(sampleProject);
    const result = await runCli(["project", "set-default", "proj-123"]);
    expect(result.exitCode).toBe(0);
    expect(mockUpdate).toHaveBeenCalledWith("proj-123", { is_default: true });
  });
});

describe("project delete", () => {
  it("deletes with --yes", async () => {
    mockDelete.mockResolvedValue(undefined);
    const result = await runCli(["project", "delete", "proj-123", "--yes"]);
    expect(result.exitCode).toBe(0);
    expect(mockDelete).toHaveBeenCalledWith("proj-123");
    expect(result.stdout).toContain("deleted successfully");
  });

  it("prompts for confirmation interactively", async () => {
    mockDelete.mockResolvedValue(undefined);
    const { confirm } = await import("@inquirer/prompts");
    vi.mocked(confirm).mockResolvedValue(true);
    const result = await runCli(["project", "delete", "proj-123"]);
    expect(result.exitCode).toBe(0);
    expect(mockDelete).toHaveBeenCalledWith("proj-123");
  });

  it("aborts when user declines", async () => {
    const { confirm } = await import("@inquirer/prompts");
    vi.mocked(confirm).mockResolvedValue(false);
    const result = await runCli(["project", "delete", "proj-123"]);
    expect(result.exitCode).toBe(1);
    expect(mockDelete).not.toHaveBeenCalled();
  });
});
