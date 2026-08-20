// Output-format helpers shared across commands: --format parsing and CSV emission.

export type OutputFormat = "table" | "json" | "csv";

export function parseOutputFormat(value: string | undefined, flag = "--output"): OutputFormat {
  const v = (value ?? "table").toLowerCase();
  if (v === "table" || v === "json" || v === "csv") return v;
  throw new Error(`Invalid ${flag} format "${value}". Use: table, json, csv`);
}

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
