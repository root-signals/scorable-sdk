import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { Scorable } from "@root-signals/scorable";
import { runCli } from "./helpers/run-cli.js";
import { apiRequest } from "../src/client.js";
import { printError, printSuccess, printInfo, printWarning } from "../src/output.js";

vi.mock("@root-signals/scorable");
vi.mock("@inquirer/prompts");

// Mock node:fs so tests control settings file existence
const mockExistsSync = vi.fn();
const mockReadFileSync = vi.fn();

vi.mock("node:fs", async () => {
  const actual = await vi.importActual<typeof import("node:fs")>("node:fs");
  return {
    ...actual,
    existsSync: (...args: Parameters<typeof actual.existsSync>) => mockExistsSync(...args),
    readFileSync: (...args: Parameters<typeof actual.readFileSync>) => mockReadFileSync(...args),
  };
});

beforeEach(() => {
  // Default: no settings file
  mockExistsSync.mockReturnValue(false);
  mockReadFileSync.mockReturnValue("{}");
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

// --- TestApiRequest ---

describe("TestApiRequest", () => {
  it("test_request_missing_api_key", async () => {
    vi.unstubAllEnvs(); // ensure no SCORABLE_API_KEY
    const result = await runCli(["judge", "list"]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("SCORABLE_API_KEY environment variable not set");
  });

  it("test_request_timeout", async () => {
    vi.stubEnv("SCORABLE_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Timeout")));
    const result = await apiRequest("GET", "judges");
    expect(result).toBeNull();
  });

  it("test_request_http_error", async () => {
    vi.stubEnv("SCORABLE_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: "Not found" }),
      }),
    );
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const result = await apiRequest("GET", "judges/nonexistent");
    spy.mockRestore();
    expect(result).toBeNull();
  });

  it("test_request_no_content_response", async () => {
    vi.stubEnv("SCORABLE_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 204, json: () => Promise.resolve(null) }),
    );
    const result = await apiRequest("DELETE", "judges/123");
    expect(result).toBeNull();
  });

  it("test_request_invalid_json", async () => {
    vi.stubEnv("SCORABLE_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error("Invalid JSON")),
      }),
    );
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const result = await apiRequest("GET", "judges");
    spy.mockRestore();
    expect(result).toBeNull();
  });

  it("test_request_validation_error_default_behavior", async () => {
    // TypeScript apiRequest returns raw JSON without validation — always returns data
    vi.stubEnv("SCORABLE_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ invalid: "payload" }),
      }),
    );
    const result = await apiRequest("GET", "judges");
    expect(result).toEqual({ invalid: "payload" }); // no validation, data returned as-is
  });

  it("test_request_validation_error_with_raise_flag", async () => {
    // TypeScript has no raise_on_validation_error — data always returned as-is
    vi.stubEnv("SCORABLE_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ invalid: "payload" }),
      }),
    );
    const result = await apiRequest("GET", "judges");
    expect(result).toBeDefined();
  });
});

// --- TestSettingsTemporaryKey ---

describe("TestSettingsTemporaryKey", () => {
  it("test_settings_temporary_api_key_used", async () => {
    vi.unstubAllEnvs(); // no SCORABLE_API_KEY env var

    // Settings file exists with temporary_api_key
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(JSON.stringify({ temporary_api_key: "tmpkey-123" }));

    // Mock SDK to return list data
    vi.mocked(Scorable).mockImplementation(function () {
      return {
        judges: {
          list: vi.fn().mockResolvedValue({
            results: [
              {
                id: "judge-123",
                name: "Test Judge 1",
                intent: "intent",
                created_at: "",
                status: "",
              },
            ],
          }),
        },
      } as unknown as Scorable;
    });

    const result = await runCli(["judge", "list"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/Test Judge 1/);

    // Verify Scorable was constructed with the temp key
    expect(vi.mocked(Scorable)).toHaveBeenCalledWith(
      expect.objectContaining({ apiKey: "tmpkey-123" }),
    );
  });
});

// --- TestHelperFunctions ---

describe("TestHelperFunctions", () => {
  it("test_print_functions", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    printError("Test error");
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining("Error:"));

    printSuccess("Test success");
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Success:"));

    printInfo("Test info");
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Info:"));

    printWarning("Test warning");
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Warning:"));

    logSpy.mockRestore();
    errSpy.mockRestore();
  });
});
