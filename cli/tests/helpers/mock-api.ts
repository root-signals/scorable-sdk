import { vi } from "vitest";

export function stubApiKey(key = "test-api-key"): void {
  vi.stubEnv("SCORABLE_API_KEY", key);
}

export function mockSdkJudges(overrides: Record<string, unknown> = {}): void {
  vi.mock("@root-signals/scorable", () => ({
    Scorable: vi.fn(() => ({
      judges: {
        list: vi.fn(),
        get: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        execute: vi.fn(),
        executeByName: vi.fn(),
        duplicate: vi.fn(),
        ...overrides,
      },
    })),
  }));
}
