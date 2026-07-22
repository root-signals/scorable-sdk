import type { paths, components } from '../generated/types.js';
import { PaginatedResponse, ListParams, ScorableError, ApiError } from '../types/common.js';

type Client = ReturnType<typeof import('openapi-fetch').default<paths>>;

export type ExecutionLogList = components['schemas']['ExecutionLogList'];
export type ExecutionLogDetails = components['schemas']['ExecutionLogDetails'];

export interface ExecutionLogListParams extends ListParams {
  skill_id?: string;
  evaluator_id?: string;
  judge_id?: string;
  cost_min?: number;
  cost_max?: number;
  score_min?: number;
  score_max?: number;
  created_at_after?: string;
  created_at_before?: string;
  model?: string;
  owner__email?: string;
  tags?: string;
  page_size?: number;
  cursor?: string;
  /** Filter execution logs by project UUID. */
  projectId?: string;
}

type ExecutionLogQuery = NonNullable<paths['/v1/execution-logs/']['get']['parameters']['query']>;

/**
 * Translate the SDK's public filter names onto the API's actual query param
 * names. Historically several params were forwarded verbatim under names the
 * API never accepted, which now hard-400 against the strict param gate.
 */
function toExecutionLogQuery(params: ExecutionLogListParams): ExecutionLogQuery {
  // executed_item_id backs both the skill and evaluator filters — an evaluator's
  // own logs carry its id there — so the two are mutually exclusive. Reject the
  // conflict loudly rather than silently dropping one.
  if (params.skill_id !== undefined && params.evaluator_id !== undefined) {
    throw new ScorableError(
      400,
      'INVALID_EXECUTION_LOG_FILTER',
      undefined,
      'skill_id and evaluator_id cannot be used together',
    );
  }

  const query: Record<string, unknown> = {};
  const set = (key: string, value: unknown): void => {
    if (value !== undefined) query[key] = value;
  };

  set('executed_item_id', params.skill_id ?? params.evaluator_id);
  set('judge_id', params.judge_id);
  set('min_cost', params.cost_min);
  set('max_cost', params.cost_max);
  set('min_score', params.score_min);
  set('max_score', params.score_max);
  set('date_from', params.created_at_after);
  set('date_to', params.created_at_before);
  set('model', params.model);
  set('owner_email', params.owner__email);
  set('tags', params.tags);
  set('search', params.search);
  set('ordering', params.ordering);
  set('page_size', params.page_size);
  set('cursor', params.cursor);
  set('project_id', params.projectId);

  return query as ExecutionLogQuery;
}

export class ExecutionLogsResource {
  constructor(private _client: Client) {}

  /**
   * List execution logs with filtering and pagination
   */
  async list(params: ExecutionLogListParams = {}): Promise<PaginatedResponse<ExecutionLogList>> {
    const query = toExecutionLogQuery(params);
    const { data, error } = await this._client.GET('/v1/execution-logs/', {
      params: { query },
    });

    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'LIST_EXECUTION_LOGS_FAILED',
        error,
        'Failed to list execution logs',
      );
    }

    return {
      results: data.results,
      next: data.next ?? undefined,
      previous: data.previous ?? undefined,
    };
  }

  /**
   * Get detailed information about a specific execution log
   */
  async get(logId: string): Promise<ExecutionLogDetails> {
    const { data, error } = await this._client.GET('/v1/execution-logs/{log_id}/', {
      params: { path: { log_id: logId } },
    });

    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'GET_EXECUTION_LOG_FAILED',
        error,
        `Failed to get execution log ${logId}`,
      );
    }

    return data;
  }

  /**
   * Get execution logs for a specific skill
   */
  async getBySkill(
    skillId: string,
    params: Omit<ExecutionLogListParams, 'skill_id'> = {},
  ): Promise<PaginatedResponse<ExecutionLogList>> {
    return this.list({ ...params, skill_id: skillId });
  }

  /**
   * Get execution logs for a specific evaluator
   */
  async getByEvaluator(
    evaluatorId: string,
    params: Omit<ExecutionLogListParams, 'evaluator_id'> = {},
  ): Promise<PaginatedResponse<ExecutionLogList>> {
    return this.list({ ...params, evaluator_id: evaluatorId });
  }

  /**
   * Get execution logs for a specific judge
   */
  async getByJudge(
    judgeId: string,
    params: Omit<ExecutionLogListParams, 'judge_id'> = {},
  ): Promise<PaginatedResponse<ExecutionLogList>> {
    return this.list({ ...params, judge_id: judgeId });
  }

  /**
   * Get execution logs within a cost range
   */
  async getByCostRange(
    minCost: number,
    maxCost: number,
    params: Omit<ExecutionLogListParams, 'cost_min' | 'cost_max'> = {},
  ): Promise<PaginatedResponse<ExecutionLogList>> {
    return this.list({ ...params, cost_min: minCost, cost_max: maxCost });
  }

  /**
   * Get execution logs within a score range
   */
  async getByScoreRange(
    minScore: number,
    maxScore: number,
    params: Omit<ExecutionLogListParams, 'score_min' | 'score_max'> = {},
  ): Promise<PaginatedResponse<ExecutionLogList>> {
    return this.list({ ...params, score_min: minScore, score_max: maxScore });
  }

  /**
   * Get execution logs within a date range
   */
  async getByDateRange(
    startDate: string,
    endDate: string,
    params: Omit<ExecutionLogListParams, 'created_at_after' | 'created_at_before'> = {},
  ): Promise<PaginatedResponse<ExecutionLogList>> {
    return this.list({
      ...params,
      created_at_after: startDate,
      created_at_before: endDate,
    });
  }

  /**
   * Get execution logs for a specific model
   */
  async getByModel(
    model: string,
    params: Omit<ExecutionLogListParams, 'model'> = {},
  ): Promise<PaginatedResponse<ExecutionLogList>> {
    return this.list({ ...params, model });
  }

  /**
   * Get execution logs by tags
   */
  async getByTags(
    tags: string,
    params: Omit<ExecutionLogListParams, 'tags'> = {},
  ): Promise<PaginatedResponse<ExecutionLogList>> {
    return this.list({ ...params, tags });
  }
}
