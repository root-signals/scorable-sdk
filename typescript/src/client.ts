import createClient from 'openapi-fetch';
import type { paths } from './generated/types.js';
import { ClientConfig } from './types/common.js';
import { createAuthHeaders } from './utils/auth.js';
import { RetryManager } from './utils/retry.js';
import { RateLimiter } from './utils/rate-limit.js';
import { EvaluatorsResource } from './resources/evaluators.js';
import { JudgesResource } from './resources/judges.js';
import { ObjectivesResource } from './resources/objectives.js';
import { ModelsResource } from './resources/models.js';
import { ExecutionLogsResource } from './resources/execution-logs.js';
import { DatasetsResource } from './resources/datasets.js';
import { FilesResource } from './resources/files.js';

export class Scorable {
  private client: ReturnType<typeof createClient<paths>>;
  private config: ClientConfig;
  public readonly retryManager: RetryManager;
  public readonly rateLimiter: RateLimiter;

  public readonly evaluators: EvaluatorsResource;
  public readonly judges: JudgesResource;
  public readonly objectives: ObjectivesResource;
  public readonly models: ModelsResource;
  public readonly executionLogs: ExecutionLogsResource;
  public readonly datasets: DatasetsResource;
  public readonly files: FilesResource;

  constructor(config: ClientConfig) {
    this.config = {
      baseUrl: 'https://api.scorable.ai',
      timeout: 30000,
      ...config,
    };

    this.client = createClient<paths>({
      baseUrl: this.config.baseUrl ?? 'https://api.scorable.ai',
      headers: createAuthHeaders(this.config),
    });

    // Initialize enhanced utilities
    this.retryManager = new RetryManager(this.config.retry);
    this.rateLimiter = new RateLimiter(this.config.rateLimit);

    // Initialize resources
    this.evaluators = new EvaluatorsResource(this.client, this.config);
    this.judges = new JudgesResource(this.client);
    this.objectives = new ObjectivesResource(this.client);
    this.models = new ModelsResource(this.client);
    this.executionLogs = new ExecutionLogsResource(this.client);
    this.datasets = new DatasetsResource(this.client);
    this.files = new FilesResource(this.config);
  }

  /**
   * Get the underlying OpenAPI client for advanced usage
   */
  getClient(): ReturnType<typeof createClient<paths>> {
    return this.client;
  }

  /**
   * Execute a function with retry logic
   */
  async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    return this.retryManager.execute(fn);
  }

  /**
   * Execute a function with rate limiting
   */
  async withRateLimit<T>(fn: () => Promise<T>): Promise<T> {
    return this.rateLimiter.execute(fn);
  }

  /**
   * Execute a function with both retry logic and rate limiting
   */
  async withRetryAndRateLimit<T>(fn: () => Promise<T>): Promise<T> {
    return this.retryManager.execute(() => this.rateLimiter.execute(fn));
  }
}
