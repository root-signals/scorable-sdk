import { RetryConfig } from '../utils/retry.js';
import { RateLimitConfig } from '../utils/rate-limit.js';
import type { components } from '../generated/types.js';

export interface ClientConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retry?: Partial<RetryConfig>;
  rateLimit?: Partial<RateLimitConfig>;
}

export interface PaginatedResponse<T> {
  results: T[];
  next?: string | undefined;
  previous?: string | undefined;
}

export interface ListParams {
  cursor?: string;
  page_size?: number;
  search?: string;
  ordering?: string;
}

export interface ErrorDetails {
  type?: string;
  title?: string;
  detail?: string;
  instance?: string;
  [key: string]: unknown;
}

export interface ApiError {
  status: number;
  code: string;
  details: ErrorDetails;
}

export class ScorableError extends Error {
  public readonly type?: string | undefined;
  public readonly title?: string | undefined;
  public readonly detail?: string | undefined;
  public readonly instance?: string | undefined;

  constructor(
    public readonly status: number,
    public readonly code: string,
    public readonly details?: ErrorDetails,
    message?: string,
  ) {
    super(message ?? details?.detail ?? details?.title ?? `API Error ${status}: ${code}`);
    this.name = 'ScorableError';
    this.type = details?.type;
    this.title = details?.title;
    this.detail = details?.detail;
    this.instance = details?.instance;
  }

  static isAuthenticationError(error: ScorableError): boolean {
    return (
      error.status === 401 ||
      error.code === 'authentication_failed' ||
      error.code === 'not_authenticated'
    );
  }

  static isQuotaError(error: ScorableError): boolean {
    return error.status === 429 || error.code === 'throttled';
  }

  static isValidationError(error: ScorableError): boolean {
    return error.status === 400 || error.code === 'invalid' || error.code === 'parse_error';
  }

  static isNotFoundError(error: ScorableError): boolean {
    return error.status === 404 || error.code === 'not_found';
  }

  static isServerError(error: ScorableError): boolean {
    return error.status >= 500;
  }
}

export interface ExecutionPayload {
  turns?: components['schemas']['MessageTurnRequest'][];
  request?: string;
  response?: string;
  contexts?: string[];
  expected_output?: string;
  reference?: string;
  variables?: Record<string, string>;
  tags?: string[];
  user_id?: string;
  session_id?: string;
  system_prompt?: string;
}
