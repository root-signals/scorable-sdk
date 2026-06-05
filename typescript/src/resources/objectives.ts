import type { paths, components } from '../generated/types.js';
import { PaginatedResponse, ListParams, ScorableError, ApiError } from '../types/common.js';

type Client = ReturnType<typeof import('openapi-fetch').default<paths>>;

export type ObjectiveList = components['schemas']['ObjectiveList'];
export type ObjectiveDetail = components['schemas']['Objective'];

export interface CreateObjectiveData {
  intent?: string;
  status?: 'unlisted' | 'listed' | 'public' | 'public_unlisted';
  validators?: Array<{
    evaluator_id?: string;
    evaluator_name?: string;
    threshold?: number;
  }>;
  force_create?: boolean;
  test_dataset_id?: string;
  /** Project to assign this objective to. Defaults to the org's default project. */
  projectId?: string;
}

export interface UpdateObjectiveData {
  intent?: string;
  status?: 'unlisted' | 'listed' | 'public' | 'public_unlisted';
  validators?: Array<{
    evaluator_id?: string;
    evaluator_name?: string;
    threshold?: number;
  }>;
  force_create?: boolean;
  test_dataset_id?: string;
  /** Pass `projectId` to move this objective to a different project within your organization. */
  projectId?: string;
}

export interface ObjectiveListParams extends ListParams {
  has_validators?: boolean;
  intent?: string;
  /** Filter objectives by project UUID. */
  projectId?: string;
}

export class ObjectivesResource {
  constructor(private _client: Client) {}

  /**
   * List all objectives
   */
  async list(params: ObjectiveListParams = {}): Promise<PaginatedResponse<ObjectiveList>> {
    const { projectId, ...rest } = params;
    const query = projectId !== undefined ? { ...rest, project_id: projectId } : rest;
    const { data, error } = await this._client.GET('/v1/objectives/', {
      params: { query },
    });

    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'LIST_OBJECTIVES_FAILED',
        error,
        'Failed to list objectives',
      );
    }

    return {
      results: data.results,
      next: data.next ?? undefined,
      previous: data.previous ?? undefined,
    };
  }

  /**
   * Create a new objective
   */
  async create(data: CreateObjectiveData): Promise<{ id: string }> {
    const { projectId, ...rest } = data;
    const body = projectId !== undefined ? { ...rest, project_id: projectId } : rest;
    const { data: responseData, error } = await this._client.POST('/v1/objectives/', {
      body,
    });

    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'CREATE_OBJECTIVE_FAILED',
        error,
        'Failed to create objective',
      );
    }

    return responseData;
  }

  /**
   * Get a specific objective by ID
   */
  async get(id: string): Promise<ObjectiveDetail> {
    const { data, error } = await this._client.GET('/v1/objectives/{id}/', {
      params: { path: { id } },
    });

    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'GET_OBJECTIVE_FAILED',
        error,
        `Failed to get objective ${id}`,
      );
    }

    return data;
  }

  /**
   * Update an existing objective
   */
  async update(id: string, data: UpdateObjectiveData): Promise<ObjectiveDetail> {
    const { projectId, ...rest } = data;
    const body = projectId !== undefined ? { ...rest, project_id: projectId } : rest;
    const { data: responseData, error } = await this._client.PUT('/v1/objectives/{id}/', {
      params: { path: { id } },
      body,
    });

    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'UPDATE_OBJECTIVE_FAILED',
        error,
        `Failed to update objective ${id}`,
      );
    }

    return responseData;
  }

  /**
   * Delete an objective
   */
  async delete(id: string): Promise<void> {
    const { error } = await this._client.DELETE('/v1/objectives/{id}/', {
      params: { path: { id } },
    });

    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'DELETE_OBJECTIVE_FAILED',
        error,
        `Failed to delete objective ${id}`,
      );
    }
  }

  /**
   * Get objective versions
   */
  async versions(id: string): Promise<PaginatedResponse<ObjectiveDetail>> {
    const { data, error } = await this._client.GET('/v1/objectives/versions/{id}/', {
      params: { path: { id } },
    });

    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'GET_OBJECTIVE_VERSIONS_FAILED',
        error,
        `Failed to get objective versions for ${id}`,
      );
    }

    return {
      results: data.results,
      next: data.next ?? undefined,
      previous: data.previous ?? undefined,
    };
  }

  /**
   * Partially update an objective
   */
  async patch(id: string, data: Partial<UpdateObjectiveData>): Promise<ObjectiveDetail> {
    const { projectId, ...rest } = data;
    const body = projectId !== undefined ? { ...rest, project_id: projectId } : rest;
    const { data: responseData, error } = await this._client.PATCH('/v1/objectives/{id}/', {
      params: { path: { id } },
      body,
    });

    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'PATCH_OBJECTIVE_FAILED',
        error,
        `Failed to patch objective ${id}`,
      );
    }

    return responseData;
  }
}
