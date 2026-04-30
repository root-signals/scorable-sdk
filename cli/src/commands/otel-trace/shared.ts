// Shared helpers for OTEL trace commands: time-window flags, output format, CSV.

export type OutputFormat = "table" | "json" | "csv";

export function parseOutputFormat(value: string | undefined): OutputFormat {
  const v = (value ?? "table").toLowerCase();
  if (v === "table" || v === "json" || v === "csv") return v;
  throw new Error(`Invalid --output format "${value}". Use: table, json, csv`);
}

const DURATION_PATTERN = /^(\d+(?:\.\d+)?)(ms|s|m|h|d)$/i;

const UNIT_TO_MS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

// Parses durations like "30s", "5m", "1h", "7d", "1.5h". Returns milliseconds.
export function parseDuration(input: string): number {
  const match = DURATION_PATTERN.exec(input.trim());
  if (!match) {
    throw new Error(
      `Invalid duration "${input}". Use forms like 30s, 5m, 2h, 7d (suffixes: ms, s, m, h, d).`,
    );
  }
  const [, num, unit] = match;
  return Number(num) * UNIT_TO_MS[unit.toLowerCase()];
}

// Returns ISO strings (UTC, no millis) for the resolved [start, end] window or
// (undefined, undefined) if no time flags were given. Throws on contradiction.
export function resolveTimeWindow(opts: { since?: string; startTime?: string; endTime?: string }): {
  start?: string;
  end?: string;
} {
  if (opts.since && (opts.startTime || opts.endTime)) {
    throw new Error("--since cannot be combined with --start-time / --end-time.");
  }

  const end = opts.endTime ? new Date(opts.endTime) : undefined;
  let start: Date | undefined;

  if (opts.since) {
    const ms = parseDuration(opts.since);
    start = new Date(Date.now() - ms);
  } else if (opts.startTime) {
    start = new Date(opts.startTime);
  }

  if (start && Number.isNaN(start.getTime())) {
    throw new Error(`Invalid --start-time: "${opts.startTime}".`);
  }
  if (end && Number.isNaN(end.getTime())) {
    throw new Error(`Invalid --end-time: "${opts.endTime}".`);
  }
  if (start && end && start.getTime() >= end.getTime()) {
    throw new Error("--start-time must be before --end-time.");
  }

  return {
    start: start?.toISOString(),
    end: end?.toISOString(),
  };
}

// Build wire-format filter expressions for trace-record-level datetime columns.
export function buildTimeFilters(window: { start?: string; end?: string }): string[] {
  const filters: string[] = [];
  if (window.start) {
    filters.push(`first_span_at;datetime;first_span_at;>=;${window.start}`);
  }
  if (window.end) {
    filters.push(`first_span_at;datetime;first_span_at;<;${window.end}`);
  }
  return filters;
}

// RFC 4180 CSV escaping: wrap in quotes if value contains comma/quote/newline,
// double any internal quotes.
function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = typeof value === "string" ? value : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(csvEscape).join(",")];
  for (const row of rows) lines.push(row.map(csvEscape).join(","));
  return lines.join("\n") + "\n";
}
