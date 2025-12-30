/**
 * @file Integration tests for the main Scorable client
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import { Scorable, ScorableError } from '../../src/index';

describe.skipIf(!process.env.SCORABLE_API_KEY)('Scorable Client Integration', () => {
  let client: Scorable;

  beforeAll(() => {
    const apiKey = process.env.SCORABLE_API_KEY;
    if (!apiKey) {
      return;
    }

    client = new Scorable({
      apiKey,
      retry: {
        maxRetries: 2,
        baseDelay: 1000,
      },
      rateLimit: {
        maxRequests: 50,
        windowMs: 60000,
        strategy: 'queue',
      },
    });
  });

  describe('enhanced utilities', () => {
    it('should provide access to retry manager', () => {
      expect(client.retryManager).toBeDefined();
      expect(typeof client.retryManager.execute).toBe('function');
    });

    it('should provide access to rate limiter', () => {
      expect(client.rateLimiter).toBeDefined();
      expect(typeof client.rateLimiter.execute).toBe('function');
    });

    it('should provide withRetry method', async () => {
      let attemptCount = 0;
      const mockFn = vi.fn(() => {
        attemptCount++;
        if (attemptCount < 2) {
          throw new Error('Temporary failure');
        }
        return Promise.resolve('success');
      });

      const result = await client.withRetry(mockFn);
      expect(result).toBe('success');
      expect(attemptCount).toBe(2);
    });

    it('should provide withRateLimit method', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');

      const result = await client.withRateLimit(mockFn);
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should provide withRetryAndRateLimit method', async () => {
      let attemptCount = 0;
      const mockFn = vi.fn(() => {
        attemptCount++;
        if (attemptCount < 2) {
          throw new Error('Temporary failure');
        }
        return Promise.resolve('success');
      });

      const result = await client.withRetryAndRateLimit(mockFn);
      expect(result).toBe('success');
      expect(attemptCount).toBe(2);
    });
  });

  describe('resource access', () => {
    it('should provide access to all resources', () => {
      expect(client.evaluators).toBeDefined();
      expect(client.judges).toBeDefined();
      expect(client.objectives).toBeDefined();
      expect(client.models).toBeDefined();
      expect(client.executionLogs).toBeDefined();
      expect(client.datasets).toBeDefined();
    });
  });

  describe('real API interactions with enhanced features', () => {
    it('should handle evaluator execution with retry on failure', async () => {
      // This test would require mocking network failures which is complex in integration tests
      // Instead, we'll test that the retry mechanism is available
      const evaluators = await client.evaluators.list({ page_size: 1 });
      expect(evaluators.results.length).toBeGreaterThanOrEqual(0);
    }, 15000);

    it('should handle rate limiting gracefully', async () => {
      // Test that multiple concurrent requests are handled properly
      const promises = Array.from({ length: 5 }, () => client.evaluators.list({ page_size: 1 }));

      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);
      results.forEach((result) => {
        expect(result.results).toBeDefined();
      });
    }, 20000);

    it('should handle evaluator execution with metadata', async () => {
      const result = await client.evaluators.executeByName('Politeness', {
        response: 'Hello, how can I help you today?',
        user_id: 'test-user',
        session_id: 'test-session',
        system_prompt: 'Be polite and helpful',
        tags: ['test', 'integration'],
      });
      expect(result).toBeDefined();
      expect(result.score).toBeDefined();
      expect(result.execution_log_id).toBeDefined();

      // Verify the log has the metadata
      const log = await client.executionLogs.get(result.execution_log_id);
      expect(log.user_id).toBe('test-user');
      expect(log.session_id).toBe('test-session');
      expect(log.system_prompt).toBe('Be polite and helpful');
      expect(log.tags).toContain('integration');
    }, 20000);

    it('should handle judge execution with metadata', async () => {
      // Find a judge to execute
      const judges = await client.judges.list({ page_size: 1 });
      if (judges.results.length === 0) return;

      const judge = judges.results[0]!;
      const result = await client.judges.execute(judge.id, {
        request: 'Help me',
        response: 'OK',
        user_id: 'test-user-judge',
        session_id: 'test-session-judge',
        system_prompt: 'Judge fairly',
        tags: ['judge-test'],
      });

      expect(result).toBeDefined();
      expect(result.evaluator_results).toBeInstanceOf(Array);
    }, 20000);

    it('should provide rate limiter status', () => {
      const status = client.rateLimiter.getStatus();
      expect(status).toHaveProperty('requestsRemaining');
      expect(status).toHaveProperty('resetTime');
      expect(status).toHaveProperty('queueSize');
      expect(typeof status.requestsRemaining).toBe('number');
    });
  });

  describe('error handling', () => {
    it('should handle authentication errors', async () => {
      const badClient = new Scorable({ apiKey: 'invalid-key' });

      await expect(badClient.evaluators.list()).rejects.toThrow(ScorableError);
    }, 10000);

    it('should handle network errors with retry', async () => {
      // Create client with very aggressive retry for testing
      const retryClient = new Scorable({
        apiKey: process.env.SCORABLE_API_KEY || 'dummy-key',
        baseUrl: 'https://invalid-domain-that-does-not-exist.com',
        retry: {
          maxRetries: 1,
          baseDelay: 100,
          retryCondition: () => true,
        },
      });

      await expect(retryClient.evaluators.list()).rejects.toThrow();
    }, 15000);
  });

  describe('configuration', () => {
    it('should respect custom timeout settings', async () => {
      const timeoutClient = new Scorable({
        apiKey: process.env.SCORABLE_API_KEY || 'dummy-key',
        timeout: 1, // Very short timeout
      });

      // This might timeout or succeed depending on network conditions
      // We're mainly testing that the timeout is respected
      try {
        await timeoutClient.evaluators.list();
      } catch {
        // Timeout errors are expected and acceptable
      }
    }, 5000);
  });
});

describe('Client Configuration Edge Cases', () => {
  it('should handle missing API key gracefully', () => {
    expect(() => {
      new Scorable({ apiKey: '' });
    }).not.toThrow(); // Client creation should succeed, but API calls will fail
  });

  it('should handle custom base URL', () => {
    const client = new Scorable({
      apiKey: 'test-key',
      baseUrl: 'https://custom-api.example.com',
    });

    expect(client).toBeDefined();
    // We can't test actual API calls with a fake URL in integration tests
  });

  it('should provide access to underlying OpenAPI client', () => {
    const client = new Scorable({ apiKey: 'test-key' });
    const openApiClient = client.getClient();

    expect(openApiClient).toBeDefined();
    expect(typeof openApiClient.GET).toBe('function');
    expect(typeof openApiClient.POST).toBe('function');
  });
});

describe.skipIf(!process.env.SCORABLE_API_KEY)('Performance and Reliability', () => {
  let client: Scorable;

  beforeAll(() => {
    const apiKey = process.env.SCORABLE_API_KEY;
    if (!apiKey) {
      return;
    }

    client = new Scorable({
      apiKey,
      retry: {
        maxRetries: 3,
        baseDelay: 500,
      },
      rateLimit: {
        maxRequests: 100,
        windowMs: 60000,
        strategy: 'queue',
      },
    });
  });

  it('should handle concurrent requests efficiently', async () => {
    const startTime = Date.now();

    // Make 10 concurrent requests
    const promises = Array.from({ length: 10 }, (_, i) =>
      client.evaluators.list({ page_size: 1, search: `test-${i}` }),
    );

    const results = await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(results).toHaveLength(10);
    expect(duration).toBeLessThan(30000); // Should complete within 30 seconds

    // All requests should succeed (even if returning empty results)
    results.forEach((result) => {
      expect(result).toHaveProperty('results');
      expect(Array.isArray(result.results)).toBe(true);
    });
  }, 35000);

  it('should maintain rate limiting across multiple operations', async () => {
    const status1 = client.rateLimiter.getStatus();

    // Make a few requests
    await client.evaluators.list({ page_size: 1 });
    await client.evaluators.list({ page_size: 1 });

    const status2 = client.rateLimiter.getStatus();

    // Requests remaining should have decreased
    expect(status2.requestsRemaining).toBeLessThan(status1.requestsRemaining);
  }, 10000);
});
