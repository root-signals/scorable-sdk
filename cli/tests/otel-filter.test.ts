import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
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

  it("test_create__sends_correct_payload_with_judge_id", async () => {
    const JUDGE_ID = "11111111-1111-1111-1111-111111111111";
    const judgeFilter = { ...sampleFilter, evaluator_id: null, judge_id: JUDGE_ID };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve(judgeFilter),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await runCli([
      "otel-filter",
      "create",
      "--name",
      "construction-judge",
      "--judge-id",
      JUDGE_ID,
    ]);

    expect(result.exitCode).toBe(0);
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.judge_id).toBe(JUDGE_ID);
    expect(body.evaluator_id).toBeUndefined();
    expect(result.stdout).toContain(JUDGE_ID);
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

  it("rejects --filter-criteria when the JSON is not a Match", async () => {
    // Valid JSON but not a Match — schema must reject the same way the YAML path does.
    const result = await runCli([
      "otel-filter",
      "create",
      "--name",
      "x",
      "--evaluator-id",
      EVALUATOR_ID,
      "--filter-criteria",
      '{"wrong":"shape"}',
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

  it("test_create__rejects_sampling_rate_with_trailing_garbage", async () => {
    const result = await runCli([
      "otel-filter",
      "create",
      "--name",
      "x",
      "--evaluator-id",
      EVALUATOR_ID,
      "--sampling-rate",
      "0.5foo",
    ]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("between 0.0 and 1.0");
  });

  it("test_create__rejects_non_integer_delay_seconds", async () => {
    const result = await runCli([
      "otel-filter",
      "create",
      "--name",
      "x",
      "--evaluator-id",
      EVALUATOR_ID,
      "--delay-seconds",
      "1.5",
    ]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("non-negative integer");
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

  it("test_create__reads_yaml_from_file_and_posts_it_as_json", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "scorable-"));
    const file = path.join(tmp, "f.yaml");
    fs.writeFileSync(
      file,
      `
name: from-file
judge_id: 0193b6a0-e75d-7a47-9c6f-2f3e3b8f7c91
filter_criteria: {}
extractor_rules:
  - emit: request_response
    input_locator: { kind: span_attr, key: i }
    output_locator: { kind: span_attr, key: o }
`,
    );
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ ...sampleFilter, name: "from-file" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await runCli(["otel-filter", "create", "-f", file]);

    expect(result.exitCode).toBe(0);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.name).toBe("from-file");
    expect(body.judge_id).toBe("0193b6a0-e75d-7a47-9c6f-2f3e3b8f7c91");
    expect(body.extractor_rules[0].emit).toBe("request_response");
  });

  it("test_create__cli_flags_override_file_values", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "scorable-"));
    const file = path.join(tmp, "f.yaml");
    fs.writeFileSync(
      file,
      `
name: from-file
judge_id: 0193b6a0-e75d-7a47-9c6f-2f3e3b8f7c91
filter_criteria: {}
`,
    );
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve(sampleFilter),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await runCli(["otel-filter", "create", "-f", file, "--name", "overridden"]);

    expect(result.exitCode).toBe(0);
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.name).toBe("overridden");
    expect(body.judge_id).toBe("0193b6a0-e75d-7a47-9c6f-2f3e3b8f7c91");
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

describe("TestOtelFilterUpdate", () => {
  it("test_update__sends_PATCH_with_merged_file_body", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "scorable-"));
    const file = path.join(tmp, "u.yaml");
    fs.writeFileSync(
      file,
      `
name: updated
judge_id: 0193b6a0-e75d-7a47-9c6f-2f3e3b8f7c91
filter_criteria: {}
extractor_rules:
  - emit: request_response
    input_locator: { kind: span_attr, key: i }
    output_locator: { kind: span_attr, key: o }
`,
    );
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ...sampleFilter, name: "updated" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await runCli(["otel-filter", "update", FILTER_ID, "-f", file]);

    expect(result.exitCode).toBe(0);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain(`/v1/otel/evaluation-filters/${FILTER_ID}`);
    expect(init.method).toBe("PATCH");
    const body = JSON.parse(init.body);
    expect(body.name).toBe("updated");
    expect(body.extractor_rules[0].emit).toBe("request_response");
  });
});

describe("TestOtelFilterValidate", () => {
  it("test_validate__exits_zero_when_schema_is_valid_and_no_warnings", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "scorable-"));
    const file = path.join(tmp, "v.yaml");
    fs.writeFileSync(
      file,
      `
name: v
judge_id: 0193b6a0-e75d-7a47-9c6f-2f3e3b8f7c91
filter_criteria: {}
extractor_rules:
  - emit: request_response
    input_locator: { kind: span_attr, key: i }
    output_locator: { kind: span_attr, key: o }
`,
    );
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ warnings: [] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await runCli(["otel-filter", "validate", "-f", file]);

    expect(result.exitCode).toBe(0);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/v1/otel/evaluation-filters/validate");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body);
    expect(body.name).toBe("v");
    expect(body.extractor_rules[0].emit).toBe("request_response");
  });

  it("test_validate__exits_zero_with_stderr_warnings_when_server_returns_warnings", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "scorable-"));
    const file = path.join(tmp, "w.yaml");
    fs.writeFileSync(
      file,
      `
name: w
judge_id: 0193b6a0-e75d-7a47-9c6f-2f3e3b8f7c91
filter_criteria: {}
extractor_rules:
  - emit: request_response
    input_locator: { kind: span_attr, key: i }
    output_locator: { kind: span_attr, key: o }
`,
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ warnings: ["unknown attr foo"] }),
      }),
    );

    const result = await runCli(["otel-filter", "validate", "-f", file]);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("unknown attr foo");
  });

  it("test_validate__exits_two_on_schema_error_from_server", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "scorable-"));
    const file = path.join(tmp, "bad.yaml");
    fs.writeFileSync(
      file,
      `
name: v
judge_id: 0193b6a0-e75d-7a47-9c6f-2f3e3b8f7c91
filter_criteria: {}
extractor_rules:
  - emit: text
    role: user
    locator: { kind: span_attr, key: x }
`,
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ errors: [{ msg: "completeness" }] }),
      }),
    );

    const result = await runCli(["otel-filter", "validate", "-f", file]);

    expect(result.exitCode).toBe(2);
  });

  it("test_validate__exits_two_when_local_zod_parse_fails", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "scorable-"));
    const file = path.join(tmp, "bad-local.yaml");
    fs.writeFileSync(
      file,
      `
name: v
judge_id: 0193b6a0-e75d-7a47-9c6f-2f3e3b8f7c91
filter_criteria: {}
extractor_rules:
  - emit: nonsense_emit_kind
`,
    );
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await runCli(["otel-filter", "validate", "-f", file]);

    expect(result.exitCode).toBe(2);
    expect(fetchMock).not.toHaveBeenCalled();
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
