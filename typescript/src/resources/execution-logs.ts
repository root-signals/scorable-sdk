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

export class ExecutionLogsResource {
  constructor(private _client: Client) {}

  /**
   * List execution logs with filtering and pagination
   */
  async list(params: ExecutionLogListParams = {}): Promise<PaginatedResponse<ExecutionLogList>> {
    const { projectId, ...rest } = params;
    const query = projectId !== undefined ? { ...rest, project_id: projectId } : rest;
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
