import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { runCli } from "./helpers/run-cli.js";

const EVALUATOR_ID = "053df10f-b0c7-400b-892e-46ce3aa1e430";
const FILTER_ID = "ae7e834e-8893-49a9-86c1-fd49299d5d9d";

const sampleFilter = {
  id: FILTER_ID,
  name: "construction-truthfulness",
  evaluator_id: EVALUATOR_ID,
  judge_id: null,
  filter_criteria: { conditions: [] },
  sampling_rate: 1.0,
  delay_seconds: 10,
  applies_to_new_only: true,
  is_active: true,
  created_at: "2026-04-30T10:42:21Z",
  updated_at: "2026-04-30T10:42:21Z",
};

beforeEach(() => {
  vi.stubEnv("SCORABLE_API_KEY", "test-api-key");
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("TestOtelFilterCreate", () => {
  it("test_create__sends_correct_payload_with_evaluator_id", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve(sampleFilter),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await runCli([
      "otel-filter",
      "create",
      "--name",
      "construction-truthfulness",
      "--evaluator-id",
      EVALUATOR_ID,
      "--filter-criteria",
      '{"conditions":[]}',
      "--delay-seconds",
      "5",
    ]);

    expect(result.exitCode).toBe(0);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/v1/otel/evaluation-filters/");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body);
    expect(body.name).toBe("construction-truthfulness");
    expect(body.evaluator_id).toBe(EVALUATOR_ID);
    expect(body.judge_id).toBeUndefined();
    expect(body.filter_criteria).toEqual({ conditions: [] });
    expect(body.delay_seconds).toBe(5);
    expect(body.sampling_rate).toBe(1.0);
    expect(body.is_active).toBe(true);
    expect(result.stdout).toContain(FILTER_ID);
  });

  it("test_create__rejects_when_neither_evaluator_nor_judge", async () => {
    const result = await runCli(["otel-filter", "create", "--name", "x"]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Either --evaluator-id or --judge-id");
  });

  it("test_create__rejects_when_both_evaluator_and_judge", async () => {
    const result = await runCli([
      "otel-filter",
      "create",
      "--name",
      "x",
      "--evaluator-id",
      EVALUATOR_ID,
      "--judge-id",
      "00000000-0000-0000-0000-000000000000",
    ]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("mutually exclusive");
  });

  it("test_create__rejects_invalid_filter_criteria_json", async () => {
    const result = await runCli([
      "otel-filter",
      "create",
      "--name",
      "x",
      "--evaluator-id",
      EVALUATOR_ID,
      "--filter-criteria",
      "{not json",
    ]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Invalid JSON");
  });

  it("test_create__rejects_sampling_rate_outside_range", async () => {
    const result = await runCli([
      "otel-filter",
      "create",
      "--name",
      "x",
      "--evaluator-id",
      EVALUATOR_ID,
      "--sampling-rate",
      "1.5",
    ]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("between 0.0 and 1.0");
  });

  it("test_create__rejects_negative_delay_seconds", async () => {
    const result = await runCli([
      "otel-filter",
      "create",
      "--name",
      "x",
      "--evaluator-id",
      EVALUATOR_ID,
      "--delay-seconds",
      "-1",
    ]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("non-negative");
  });
});

describe("TestOtelFilterList", () => {
  it("test_list__prints_message_when_empty", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      }),
    );
    const result = await runCli(["otel-filter", "list"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("No filters found");
  });

  it("test_list__prints_json_when_results_present", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([sampleFilter]),
      }),
    );
    const result = await runCli(["otel-filter", "list"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain(FILTER_ID);
    expect(result.stdout).toContain("construction-truthfulness");
  });

  it("test_list__exits_nonzero_on_failure_and_does_not_print_empty_state", async () => {
    // Regression: a failed request (apiRequest returns null) used to be
    // collapsed into the "No filters found." empty-state message.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ detail: "boom" }),
      }),
    );
    const result = await runCli(["otel-filter", "list"]);
    expect(result.exitCode).toBe(1);
    expect(result.stdout).not.toContain("No filters found");
  });
});

describe("TestOtelFilterDelete", () => {
  it("test_delete__exits_nonzero_on_failure_and_does_not_print_success", async () => {
    // Regression: previously printed "Filter X deleted." even when the request
    // failed, because apiRequest swallows errors and returns null.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: "not found" }),
      }),
    );
    const result = await runCli(["otel-filter", "delete", FILTER_ID]);
    expect(result.exitCode).toBe(1);
    expect(result.stdout).not.toContain("deleted");
  });

  it("test_delete__sends_DELETE_to_correct_url", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      json: () => Promise.resolve(null),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await runCli(["otel-filter", "delete", FILTER_ID]);

    expect(result.exitCode).toBe(0);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain(`/v1/otel/evaluation-filters/${FILTER_ID}`);
    expect(init.method).toBe("DELETE");
    expect(result.stdout).toContain("deleted");
  });
});
