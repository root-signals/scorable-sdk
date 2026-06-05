import { Scorable } from '../../src/index';
import { mockClient } from './mock-client';
import { EvaluatorsResource } from '../../src/resources/evaluators.js';
import { JudgesResource } from '../../src/resources/judges.js';
import { ObjectivesResource } from '../../src/resources/objectives.js';
import { ModelsResource } from '../../src/resources/models.js';
import { ExecutionLogsResource } from '../../src/resources/execution-logs.js';
import { DatasetsResource } from '../../src/resources/datasets.js';
import { ProjectsResource } from '../../src/resources/projects.js';

// Test utilities for creating clients and mock data
export class TestUtils {
  // Create a mock Scorable client
  static createMockClient(): Scorable {
    const client = new Scorable({
      apiKey: 'test-api-key-123',
    });

    // Replace the internal client with our mock
    (client as any).client = mockClient;

    // Re-initialize resources with the mock client
    (client as any).evaluators = new EvaluatorsResource(mockClient);
    (client as any).judges = new JudgesResource(mockClient);
    (client as any).objectives = new ObjectivesResource(mockClient);
    (client as any).models = new ModelsResource(mockClient);
    (client as any).executionLogs = new ExecutionLogsResource(mockClient);
    (client as any).datasets = new DatasetsResource(mockClient);
    (client as any).projects = new ProjectsResource(mockClient as any);

    return client;
  }

  // Create a real client for integration tests
  static createRealClient(apiKey?: string): Scorable {
    return new Scorable({
      apiKey: apiKey || 'test-api-key',
    });
  }

  // Generate test IDs
  static generateTestId(prefix: string = 'test'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  // Wait for a promise with timeout
  static async waitFor<T>(fn: () => Promise<T>, timeout: number = 5000): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timeout after ${timeout}ms`));
      }, timeout);

      fn()
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timer));
    });
  }

  // Assert that a value is a valid UUID
  static assertValidUUID(value: string): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(value).toMatch(uuidRegex);
  }

  // Assert that a response has pagination structure
  static assertPaginatedResponse(response: any): void {
    expect(response).toHaveProperty('results');
    expect(response).toHaveProperty('count');
    expect(Array.isArray(response.results)).toBe(true);
    expect(typeof response.count).toBe('number');
  }

  // Sleep utility for timing tests
  static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
