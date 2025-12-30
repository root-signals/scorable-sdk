import type { paths, components } from '../generated/types.js';
import { PaginatedResponse, ListParams, ScorableError, ApiError } from '../types/common.js';

type Client = ReturnType<typeof import('openapi-fetch').default<paths>>;

export type Judge = components['schemas']['JudgeList'];
export type JudgeDetail = components['schemas']['Judge'];
export type JudgeExecutionResult = components['schemas']['JudgeExecutionResponse'];

export interface CreateJudgeData {
  name: string;
  intent: string;
  evaluator_references?: Array<{ id: string; version_id?: string }>;
  stage?: string;
  status?: components['schemas']['StatusEnum'];
}

export interface UpdateJudgeData {
  name?: string;
  intent?: string;
  evaluator_references?: Array<{ id: string; version_id?: string }>;
  stage?: string;
}

export type JudgeExecutionPayload = components['schemas']['JudgeExecutionRequest'];
export type JudgeRefinementPayload = components['schemas']['JudgeRectifierRequestRequest'];

export interface JudgeListParams extends ListParams {
  is_preset?: boolean;
  is_public?: boolean;
}

export class JudgesResource {
  constructor(private _client: Client) {}

  /**
   * List all accessible judges
   */
  async list(params: JudgeListParams = {}): Promise<PaginatedResponse<Judge>> {
    const { data, error } = await this._client.GET('/v1/judges/', {
      params: { query: params },
    });

    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'LIST_JUDGES_FAILED',
        error,
        'Failed to list judges',
      );
    }

    return {
      results: data.results,
      next: data.next ?? undefined,
      previous: data.previous ?? undefined,
    };
  }

  /**
   * Create a new judge
   */
  async create(data: CreateJudgeData): Promise<JudgeDetail> {
    const { data: responseData, error } = await this._client.POST('/v1/judges/', {
      body: {
        ...data,
        status: data.status ?? 'unlisted',
      },
    });

    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'CREATE_JUDGE_FAILED',
        error,
        'Failed to create judge',
      );
    }

    return responseData;
  }

  /**
   * Get a specific judge by ID
   */
  async get(id: string): Promise<JudgeDetail> {
    const { data, error } = await this._client.GET('/v1/judges/{id}/', {
      params: { path: { id } },
    });

    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'GET_JUDGE_FAILED',
        error,
        `Failed to get judge ${id}`,
      );
    }

    return data;
  }

  /**
   * Update an existing judge (partial update)
   */
  async update(id: string, data: UpdateJudgeData): Promise<JudgeDetail> {
    const { data: responseData, error } = await this._client.PATCH('/v1/judges/{id}/', {
      params: { path: { id } },
      body: data,
    });

    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'UPDATE_JUDGE_FAILED',
        error,
        `Failed to update judge ${id}`,
      );
    }

    return responseData;
  }

  /**
   * Delete a judge
   */
  async delete(id: string): Promise<void> {
    const { error } = await this._client.DELETE('/v1/judges/{id}/', {
      params: { path: { id } },
    });

    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'DELETE_JUDGE_FAILED',
        error,
        `Failed to delete judge ${id}`,
      );
    }
  }

  /**
   * Execute a judge
   */
  async execute(id: string, payload: JudgeExecutionPayload): Promise<JudgeExecutionResult> {
    const { data, error } = await this._client.POST('/v1/judges/{judge_id}/execute/', {
      params: { path: { judge_id: id } },
      body: payload,
    });

    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'EXECUTE_JUDGE_FAILED',
        error,
        `Failed to execute judge ${id}`,
      );
    }

    return data;
  }

  /**
   * Execute a judge by name (convenience method)
   */
  async executeByName(name: string, payload: JudgeExecutionPayload): Promise<JudgeExecutionResult> {
    const { data, error } = await this._client.POST('/v1/judges/execute/by-name/', {
      params: { query: { name } },
      body: payload,
    });

    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'EXECUTE_JUDGE_BY_NAME_FAILED',
        error,
        `Failed to execute judge by name: ${name}`,
      );
    }

    return data;
  }

  /**
   * Generate a new judge using AI
   */
  async generate({
    intent,
    stage,
    overwrite,
    extra_contexts,
    name,
  }: {
    intent: string;
    stage?: string;
    overwrite?: boolean;
    extra_contexts?: { [key: string]: string | null } | null;
    name?: string;
  }): Promise<{ judge_id: string; error_code?: string | null }> {
    const { data, error } = await this._client.POST('/v1/judges/generate/', {
      body: {
        overwrite: overwrite ?? false,
        intent,
        visibility: 'unlisted' as const,
        stage: stage ?? null,
        strict: true,
        extra_contexts: extra_contexts ?? null,
        name: name ?? null,
      },
    });

    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'GENERATE_JUDGE_FAILED',
        error,
        'Failed to generate judge',
      );
    }

    return data;
  }

  /**
   * Refine a judge using AI feedback
   */
  async refine(
    id: string,
    payload: JudgeRefinementPayload,
  ): Promise<components['schemas']['JudgeRectifierResponse'] | undefined> {
    const { data, error } = await this._client.POST('/v1/judges/{judge_id}/refine/', {
      params: { path: { judge_id: id } },
      body: payload,
    });

    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'REFINE_JUDGE_FAILED',
        error as never,
        `Failed to refine judge ${id}`,
      );
    }

    return data;
  }

  /**
   * Duplicate a judge
   */
  async duplicate(id: string): Promise<JudgeDetail> {
    const { data, error } = await this._client.POST('/v1/judges/{id}/duplicate/', {
      params: { path: { id } },
    });

    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'DUPLICATE_JUDGE_FAILED',
        error,
        `Failed to duplicate judge ${id}`,
      );
    }

    return data;
  }
}
