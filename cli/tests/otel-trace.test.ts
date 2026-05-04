import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { runCli } from "./helpers/run-cli.js";
import {
  buildTimeFilters,
  parseDuration,
  parseOutputFormat,
  resolveTimeWindow,
  toCsv,
} from "../src/commands/otel-trace/shared.js";

const TRACE_ID = "7b6e5bd99494c4ee46fbfd39b194c499";
const SPAN_ID = "9fce49e165608b93";

const sampleTrace = {
  trace_id: TRACE_ID,
  root_span_name: "construction_assistant_agent run",
  first_span_at: "2026-04-30T11:12:12Z",
  last_span_at: "2026-04-30T11:12:15Z",
  span_count: 4,
  input_preview: "Question, with comma",
  output_preview: 'Answer with "quotes"',
};

const sampleSpan = {
  trace_id: TRACE_ID,
  span_id: SPAN_ID,
  parent_span_id: "",
  timestamp: "2026-04-30T11:12:12Z",
  span: {
    name: "construction_assistant_agent run",
    kind: 1,
    has_error: false,
    status: { code: 0 },
    attributes: [],
    resource_attributes: [{ key: "service.name", value: { stringValue: "construction" } }],
  },
};

beforeEach(() => {
  vi.stubEnv("SCORABLE_API_KEY", "test-api-key");
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("TestSharedHelpers", () => {
  describe("parseDuration", () => {
    it("parses common forms", () => {
      expect(parseDuration("30s")).toBe(30_000);
      expect(parseDuration("5m")).toBe(5 * 60_000);
      expect(parseDuration("2h")).toBe(2 * 3_600_000);
      expect(parseDuration("7d")).toBe(7 * 86_400_000);
      expect(parseDuration("100ms")).toBe(100);
      expect(parseDuration("1.5h")).toBe(1.5 * 3_600_000);
    });

    it("rejects invalid forms", () => {
      expect(() => parseDuration("bogus")).toThrow(/Invalid duration/);
      expect(() => parseDuration("5")).toThrow(/Invalid duration/);
      expect(() => parseDuration("hour")).toThrow(/Invalid duration/);
    });
  });

  describe("resolveTimeWindow", () => {
    it("returns empty when no flags given", () => {
      const w = resolveTimeWindow({});
      expect(w.start).toBeUndefined();
      expect(w.end).toBeUndefined();
    });

    it("computes start from --since", () => {
      const before = Date.now();
      const w = resolveTimeWindow({ since: "1h" });
      const after = Date.now();
      const start = new Date(w.start!).getTime();
      expect(start).toBeGreaterThanOrEqual(before - 3_600_000);
      expect(start).toBeLessThanOrEqual(after - 3_600_000 + 100);
    });

    it("rejects --since combined with --start-time/--end-time", () => {
      expect(() => resolveTimeWindow({ since: "1h", startTime: "2026-01-01T00:00:00Z" })).toThrow(
        /cannot be combined/,
      );
      expect(() => resolveTimeWindow({ since: "1h", endTime: "2026-01-01T00:00:00Z" })).toThrow(
        /cannot be combined/,
      );
    });

    it("rejects invalid ISO timestamps", () => {
      expect(() => resolveTimeWindow({ startTime: "not-a-date" })).toThrow(/Invalid --start-time/);
      expect(() => resolveTimeWindow({ endTime: "not-a-date" })).toThrow(/Invalid --end-time/);
    });

    it("rejects start >= end", () => {
      expect(() =>
        resolveTimeWindow({
          startTime: "2026-05-01T00:00:00Z",
          endTime: "2026-04-01T00:00:00Z",
        }),
      ).toThrow(/before --end-time/);
    });
  });

  describe("buildTimeFilters", () => {
    it("returns empty list when no window", () => {
      expect(buildTimeFilters({})).toEqual([]);
    });

    it("compiles to wire-format expressions", () => {
      const filters = buildTimeFilters({
        start: "2026-04-30T00:00:00Z",
        end: "2026-05-01T00:00:00Z",
      });
      expect(filters).toEqual([
        "first_span_at;datetime;first_span_at;>=;2026-04-30T00:00:00Z",
        "first_span_at;datetime;first_span_at;<;2026-05-01T00:00:00Z",
      ]);
    });
  });

  describe("parseOutputFormat", () => {
    it("accepts table, json, csv", () => {
      expect(parseOutputFormat("table")).toBe("table");
      expect(parseOutputFormat("json")).toBe("json");
      expect(parseOutputFormat("csv")).toBe("csv");
    });

    it("defaults to table", () => {
      expect(parseOutputFormat(undefined)).toBe("table");
    });

    it("rejects unknown formats", () => {
      expect(() => parseOutputFormat("yaml")).toThrow(/Invalid --output/);
    });
  });

  describe("toCsv", () => {
    it("renders simple rows", () => {
      const out = toCsv(
        ["a", "b"],
        [
          ["1", "2"],
          ["3", "4"],
        ],
      );
      expect(out).toBe("a,b\n1,2\n3,4\n");
    });

    it("RFC 4180 quotes commas, quotes, and newlines", () => {
      const out = toCsv(["x"], [["has,comma"], ['has"quote'], ["has\nnewline"]]);
      expect(out).toBe('x\n"has,comma"\n"has""quote"\n"has\nnewline"\n');
    });

    it("handles null and numeric values", () => {
      const out = toCsv(["a", "b"], [[null, 42]]);
      expect(out).toBe("a,b\n,42\n");
    });
  });
});

describe("TestOtelTraceList", () => {
  function fetchOk(payload: unknown) {
    return vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(payload),
    });
  }

  function getRequestUrl(fetchMock: ReturnType<typeof vi.fn>): URL {
    return new URL(String(fetchMock.mock.calls[0][0]));
  }

  function getFiltersParam(fetchMock: ReturnType<typeof vi.fn>): string {
    return getRequestUrl(fetchMock).searchParams.get("filters") ?? "";
  }

  it("test_list__no_filters_omits_filters_param", async () => {
    const fetchMock = fetchOk({ next: null, previous: null, results: [sampleTrace] });
    vi.stubGlobal("fetch", fetchMock);

    const result = await runCli(["otel-trace", "list"]);
    expect(result.exitCode).toBe(0);
    const url = getRequestUrl(fetchMock);
    expect(url.pathname).toContain("/v1/otel/traces/");
    expect(url.searchParams.has("filters")).toBe(false);
  });

  it("test_list__service_name_shortcut_compiles_to_resource_sentinel", async () => {
    const fetchMock = fetchOk({ next: null, previous: null, results: [] });
    vi.stubGlobal("fetch", fetchMock);

    await runCli(["otel-trace", "list", "--service-name", "my_agent"]);
    expect(getFiltersParam(fetchMock)).toBe("resource;string;service.name;=;my_agent");
  });

  it("test_list__has_error_shortcut_compiles_to_boolean_filter", async () => {
    const fetchMock = fetchOk({ next: null, previous: null, results: [] });
    vi.stubGlobal("fetch", fetchMock);

    await runCli(["otel-trace", "list", "--has-error"]);
    expect(getFiltersParam(fetchMock)).toBe("has_error;boolean;has_error;=;true");
  });

  it("test_list__multiple_shortcuts_AND_combine", async () => {
    const fetchMock = fetchOk({ next: null, previous: null, results: [] });
    vi.stubGlobal("fetch", fetchMock);

    await runCli([
      "otel-trace",
      "list",
      "--service-name",
      "my_agent",
      "--has-error",
      "--tool",
      "fetch_customer_data",
    ]);
    const filters = getFiltersParam(fetchMock).split(",");
    expect(filters).toContain("resource;string;service.name;=;my_agent");
    expect(filters).toContain("has_error;boolean;has_error;=;true");
    expect(filters).toContain("gen_ai.tool.name;string;gen_ai.tool.name;=;fetch_customer_data");
  });

  it("test_list__since_adds_first_span_at_filter", async () => {
    const fetchMock = fetchOk({ next: null, previous: null, results: [] });
    vi.stubGlobal("fetch", fetchMock);

    await runCli(["otel-trace", "list", "--since", "1h"]);
    const filters = getFiltersParam(fetchMock).split(",");
    expect(filters[0]).toMatch(/^first_span_at;datetime;first_span_at;>=;\d{4}-\d{2}-\d{2}T/);
  });

  it("test_list__shortcut_AND_raw_filter_combine", async () => {
    const fetchMock = fetchOk({ next: null, previous: null, results: [] });
    vi.stubGlobal("fetch", fetchMock);

    await runCli([
      "otel-trace",
      "list",
      "--service-name",
      "my_agent",
      "--filter",
      "gen_ai.usage.input_tokens;number;gen_ai.usage.input_tokens;>;1000",
    ]);
    const filters = getFiltersParam(fetchMock).split(",");
    expect(filters).toContain("resource;string;service.name;=;my_agent");
    expect(filters).toContain("gen_ai.usage.input_tokens;number;gen_ai.usage.input_tokens;>;1000");
  });

  it("test_list__output_csv_emits_header_and_rfc4180_quoted_rows", async () => {
    vi.stubGlobal("fetch", fetchOk({ next: null, previous: null, results: [sampleTrace] }));

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    try {
      const result = await runCli(["otel-trace", "list", "--output", "csv"]);
      expect(result.exitCode).toBe(0);
      const csv = writeSpy.mock.calls.map((c) => String(c[0])).join("");
      expect(csv).toContain("trace_id,root_span_name,span_count");
      expect(csv).toContain(TRACE_ID);
      // Comma in the input_preview value must be quoted.
      expect(csv).toContain('"Question, with comma"');
      // Quotes in the output_preview value must be doubled.
      expect(csv).toContain('"Answer with ""quotes"""');
    } finally {
      writeSpy.mockRestore();
    }
  });

  it("test_list__output_json_emits_full_payload", async () => {
    vi.stubGlobal("fetch", fetchOk({ next: null, previous: null, results: [sampleTrace] }));

    const result = await runCli(["otel-trace", "list", "--output", "json"]);
    expect(result.exitCode).toBe(0);
    const parsed = JSON.parse(result.stdout);
    expect(parsed.results[0].trace_id).toBe(TRACE_ID);
  });

  it("test_list__rejects_invalid_output_format", async () => {
    const result = await runCli(["otel-trace", "list", "--output", "yaml"]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Invalid --output");
  });

  it("test_list__rejects_since_combined_with_start_time", async () => {
    const result = await runCli([
      "otel-trace",
      "list",
      "--since",
      "1h",
      "--start-time",
      "2026-01-01T00:00:00Z",
    ]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("cannot be combined");
  });

  it("test_list__rejects_invalid_since_duration", async () => {
    const result = await runCli(["otel-trace", "list", "--since", "tomorrow"]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Invalid duration");
  });

  it("test_list__cursor_passes_through", async () => {
    const fetchMock = fetchOk({ next: null, previous: null, results: [] });
    vi.stubGlobal("fetch", fetchMock);

    await runCli(["otel-trace", "list", "--cursor", "abc123"]);
    expect(getRequestUrl(fetchMock).searchParams.get("cursor")).toBe("abc123");
  });

  it("test_list__surfaces_next_cursor_hint", async () => {
    const fetchMock = fetchOk({
      next: "http://localhost/v1/otel/traces/?cursor=NEXT123&page_size=25",
      previous: null,
      results: [sampleTrace],
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await runCli(["otel-trace", "list"]);
    expect(result.stdout).toContain('--cursor "NEXT123"');
  });
});

describe("TestOtelTraceSpans", () => {
  function fetchOk(payload: unknown) {
    return vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(payload),
    });
  }

  it("test_spans__hits_correct_endpoint", async () => {
    const fetchMock = fetchOk([sampleSpan]);
    vi.stubGlobal("fetch", fetchMock);

    const result = await runCli(["otel-trace", "spans", TRACE_ID]);
    expect(result.exitCode).toBe(0);
    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain(`/v1/otel/traces/${TRACE_ID}/spans`);
  });

  it("test_spans__output_json_returns_full_payload", async () => {
    vi.stubGlobal("fetch", fetchOk([sampleSpan]));
    const result = await runCli(["otel-trace", "spans", TRACE_ID, "--output", "json"]);
    expect(result.exitCode).toBe(0);
    const parsed = JSON.parse(result.stdout);
    expect(parsed[0].span_id).toBe(SPAN_ID);
    expect(parsed[0].span.resource_attributes).toBeDefined();
  });

  it("test_spans__output_csv_emits_flattened_columns", async () => {
    vi.stubGlobal("fetch", fetchOk([sampleSpan]));

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    try {
      const result = await runCli(["otel-trace", "spans", TRACE_ID, "--output", "csv"]);
      expect(result.exitCode).toBe(0);
      const csv = writeSpy.mock.calls.map((c) => String(c[0])).join("");
      expect(csv).toContain("span_id,parent_span_id,name,kind,has_error,status_code,timestamp");
      expect(csv).toContain(SPAN_ID);
    } finally {
      writeSpy.mockRestore();
    }
  });

  it("test_spans__empty_result_prints_message", async () => {
    vi.stubGlobal("fetch", fetchOk([]));
    const result = await runCli(["otel-trace", "spans", TRACE_ID]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("No spans found");
  });

  it("test_spans__url_encodes_trace_id", async () => {
    // Regression: a trace_id with /, ?, # used to break the request path.
    const fetchMock = fetchOk([]);
    vi.stubGlobal("fetch", fetchMock);

    const messy = "abc/def?x#y";
    await runCli(["otel-trace", "spans", messy]);

    const requested = String(fetchMock.mock.calls[0][0]);
    expect(requested).toContain(encodeURIComponent(messy));
    // Should not contain the raw `/` from the input (only path separators stay).
    expect(requested.split("/v1/otel/traces/")[1]).not.toContain("/def");
  });

  it("test_spans__rejects_non_array_response", async () => {
    // Regression: a {} response used to be silently coerced to [].
    vi.stubGlobal("fetch", fetchOk({ unexpected: "shape" }));
    const result = await runCli(["otel-trace", "spans", TRACE_ID]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Unexpected spans response");
  });
});
