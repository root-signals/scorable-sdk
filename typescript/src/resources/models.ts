import type { paths, components } from '../generated/types.js';
import { PaginatedResponse, ListParams, ScorableError, ApiError } from '../types/common.js';

type Client = ReturnType<typeof import('openapi-fetch').default<paths>>;

export type ModelList = components['schemas']['ModelList'];
export type ModelDetail = components['schemas']['Model'];
export type VerifyModelResponse = components['schemas']['ModelTestResponse'];

export interface CreateModelData {
  name: string;
  model?: string;
  url?: string;
  default_key?: string;
  max_token_count?: number;
  max_output_token_count?: number;
}

export interface UpdateModelData {
  name: string;
  model?: string;
  url?: string;
  default_key?: string;
  max_token_count?: number;
  max_output_token_count?: number;
}

export interface VerifyModelData {
  model: string;
  api_key?: string;
  url?: string;
  max_output_token_count?: number;
}

export class ModelsResource {
  constructor(private _client: Client) {}

  /**
   * List all available models
   */
  async list(params: ListParams = {}): Promise<PaginatedResponse<ModelList>> {
    const { data, error } = await this._client.GET('/v1/models/', {
      params: { query: params },
    });

    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'LIST_MODELS_FAILED',
        error,
        'Failed to list models',
      );
    }

    return {
      results: data.results,
      next: data.next ?? undefined,
      previous: data.previous ?? undefined,
    };
  }

  /**
   * Create a new custom model
   */
  async create(data: CreateModelData): Promise<ModelDetail> {
    const { data: responseData, error } = await this._client.POST('/v1/models/', {
      body: data,
    });

    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'CREATE_MODEL_FAILED',
        error,
        'Failed to create model',
      );
    }

    return responseData;
  }

  /**
   * Get a specific model by ID
   */
  async get(id: string): Promise<ModelDetail> {
    const { data, error } = await this._client.GET('/v1/models/{id}/', {
      params: { path: { id } },
    });

    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'GET_MODEL_FAILED',
        error,
        `Failed to get model ${id}`,
      );
    }

    return data;
  }

  /**
   * Update an existing model
   */
  async update(id: string, data: UpdateModelData): Promise<ModelDetail> {
    const { data: responseData, error } = await this._client.PUT('/v1/models/{id}/', {
      params: { path: { id } },
      body: data,
    });

    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'UPDATE_MODEL_FAILED',
        error,
        `Failed to update model ${id}`,
      );
    }

    return responseData;
  }

  /**
   * Delete a model
   */
  async delete(id: string): Promise<void> {
    const { error } = await this._client.DELETE('/v1/models/{id}/', {
      params: { path: { id } },
    });

    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'DELETE_MODEL_FAILED',
        error,
        `Failed to delete model ${id}`,
      );
    }
  }

  /**
   * Partially update a model
   */
  async patch(id: string, data: Partial<UpdateModelData>): Promise<ModelDetail> {
    const { data: responseData, error } = await this._client.PATCH('/v1/models/{id}/', {
      params: { path: { id } },
      body: data,
    });

    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'PATCH_MODEL_FAILED',
        error,
        `Failed to patch model ${id}`,
      );
    }

    return responseData;
  }

  /**
   * Verify an unsaved LLM model configuration by sending a test prompt.
   * Useful for validating model parameters before creating the model.
   */
  async verify(data: VerifyModelData): Promise<VerifyModelResponse> {
    const { data: responseData, error } = await this._client.POST('/v1/models/verify/', {
      body: data,
    });

    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'VERIFY_MODEL_FAILED',
        error,
        'Failed to verify model',
      );
    }

    return responseData;
  }
}
