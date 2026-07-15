import type { paths, components } from '../generated/types.js';
import { PaginatedResponse, ListParams, ScorableError, ApiError } from '../types/common.js';

type Client = ReturnType<typeof import('openapi-fetch').default<paths>>;

export type ScoreConfig = components['schemas']['ScoreConfig'];
export type ScoreConfigRequest = components['schemas']['ScoreConfigRequest'];
export type PatchedScoreConfigRequest = components['schemas']['PatchedScoreConfigRequest'];

/**
 * Score configs describe the label scale used when annotating and calibrating: `binary`,
 * `continuous` or `categorical`. Your organization's own configs are returned alongside the
 * read-only public globals (the identity "Score" config and "Thumbs").
 */
export class ScoreConfigsResource {
  constructor(private _client: Client) {}

  async list(params: ListParams = {}): Promise<PaginatedResponse<ScoreConfig>> {
    const { data, error } = await this._client.GET('/v1/score-configs/', {
      params: { query: params },
    });
    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'LIST_SCORE_CONFIGS_FAILED',
        error,
        'Failed to list score configs',
      );
    }
    return {
      results: data.results,
      next: data.next ?? undefined,
      previous: data.previous ?? undefined,
    };
  }

  async create(data: ScoreConfigRequest): Promise<ScoreConfig> {
    const { data: result, error } = await this._client.POST('/v1/score-configs/', { body: data });
    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'CREATE_SCORE_CONFIG_FAILED',
        error,
        'Failed to create score config',
      );
    }
    return result;
  }

  async get(id: string): Promise<ScoreConfig> {
    const { data, error } = await this._client.GET('/v1/score-configs/{id}/', {
      params: { path: { id } },
    });
    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'GET_SCORE_CONFIG_FAILED',
        error,
        `Failed to get score config ${id}`,
      );
    }
    return data;
  }

  async update(id: string, data: PatchedScoreConfigRequest): Promise<ScoreConfig> {
    const { data: result, error } = await this._client.PATCH('/v1/score-configs/{id}/', {
      params: { path: { id } },
      body: data,
    });
    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'UPDATE_SCORE_CONFIG_FAILED',
        error,
        `Failed to update score config ${id}`,
      );
    }
    return result;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this._client.DELETE('/v1/score-configs/{id}/', {
      params: { path: { id } },
    });
    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'DELETE_SCORE_CONFIG_FAILED',
        error,
        `Failed to delete score config ${id}`,
      );
    }
  }
}
