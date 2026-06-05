import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { resolveProjectId, resolveProjectIdValue } from "../src/lib/project-id.js";

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
  mockExistsSync.mockReturnValue(false);
  mockReadFileSync.mockReturnValue("{}");
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("resolveProjectId", () => {
  it("flag wins over env var", () => {
    vi.stubEnv("SCORABLE_PROJECT_ID", "env-uuid");
    const r = resolveProjectId("flag-uuid");
    expect(r.value).toBe("flag-uuid");
    expect(r.source).toBe("flag");
  });

  it("flag wins over settings", () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(JSON.stringify({ project_id: "settings-uuid" }));
    const r = resolveProjectId("flag-uuid");
    expect(r.value).toBe("flag-uuid");
    expect(r.source).toBe("flag");
  });

  it("empty-string flag opts out of inherited defaults", () => {
    vi.stubEnv("SCORABLE_PROJECT_ID", "env-uuid");
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(JSON.stringify({ project_id: "settings-uuid" }));
    const r = resolveProjectId("");
    expect(r.value).toBeUndefined();
    expect(r.source).toBe("flag");
  });

  it("env var wins over settings", () => {
    vi.stubEnv("SCORABLE_PROJECT_ID", "env-uuid");
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(JSON.stringify({ project_id: "settings-uuid" }));
    const r = resolveProjectId(undefined);
    expect(r.value).toBe("env-uuid");
    expect(r.source).toBe("env");
  });

  it("settings used when no flag or env", () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(JSON.stringify({ project_id: "settings-uuid" }));
    const r = resolveProjectId(undefined);
    expect(r.value).toBe("settings-uuid");
    expect(r.source).toBe("settings");
  });

  it("returns none when nothing configured", () => {
    const r = resolveProjectId(undefined);
    expect(r.value).toBeUndefined();
    expect(r.source).toBe("none");
  });

  it("empty env var is treated as unset", () => {
    vi.stubEnv("SCORABLE_PROJECT_ID", "");
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(JSON.stringify({ project_id: "settings-uuid" }));
    const r = resolveProjectId(undefined);
    expect(r.value).toBe("settings-uuid");
    expect(r.source).toBe("settings");
  });

  it("empty settings field is treated as unset", () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(JSON.stringify({ project_id: "" }));
    const r = resolveProjectId(undefined);
    expect(r.value).toBeUndefined();
    expect(r.source).toBe("none");
  });

  it("non-string settings field is treated as unset", () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(JSON.stringify({ project_id: 42 }));
    const r = resolveProjectId(undefined);
    expect(r.value).toBeUndefined();
    expect(r.source).toBe("none");
  });
});

describe("resolveProjectIdValue", () => {
  it("returns just the value", () => {
    expect(resolveProjectIdValue("abc")).toBe("abc");
    expect(resolveProjectIdValue("")).toBeUndefined();
    expect(resolveProjectIdValue(undefined)).toBeUndefined();
  });
});
