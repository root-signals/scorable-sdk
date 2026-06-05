import type { paths, components } from '../generated/types.js';
import { PaginatedResponse, ListParams, ScorableError, ApiError } from '../types/common.js';

type Client = ReturnType<typeof import('openapi-fetch').default<paths>>;

export type Project = components['schemas']['Project'];

export interface CreateProjectParams {
  name: string;
  description?: string;
  is_default?: boolean;
}

export interface UpdateProjectParams {
  name?: string;
  description?: string;
  /**
   * Setting `is_default: true` atomically clears the previous default in the same org.
   * The backend rejects clearing the default directly — promote another project instead.
   */
  is_default?: boolean;
}

export type ProjectListParams = ListParams;

export class ProjectsResource {
  constructor(private _client: Client) {}

  /**
   * List all projects in your organization.
   */
  async list(params: ProjectListParams = {}): Promise<PaginatedResponse<Project>> {
    const { data, error } = await this._client.GET('/v1/projects/', {
      params: { query: params },
    });

    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'LIST_PROJECTS_FAILED',
        error,
        'Failed to list projects',
      );
    }

    return {
      results: data.results,
      next: data.next ?? undefined,
      previous: data.previous ?? undefined,
    };
  }

  /**
   * Retrieve a single project.
   */
  async retrieve(id: string): Promise<Project> {
    const { data, error } = await this._client.GET('/v1/projects/{id}/', {
      params: { path: { id } },
    });

    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'GET_PROJECT_FAILED',
        error,
        `Failed to retrieve project ${id}`,
      );
    }

    return data;
  }

  /**
   * Create a new project.
   * Passing `is_default: true` atomically clears the previous default in the same org.
   */
  async create(params: CreateProjectParams): Promise<Project> {
    const { data, error } = await this._client.POST('/v1/projects/', {
      body: params,
    });

    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'CREATE_PROJECT_FAILED',
        error,
        'Failed to create project',
      );
    }

    return data;
  }

  /**
   * Update a project (partial). Pass `is_default: true` to promote it to the org default
   * — this atomically clears any previous default. Clearing default directly is rejected
   * by the backend; promote another project instead.
   */
  async update(id: string, params: UpdateProjectParams): Promise<Project> {
    const { data, error } = await this._client.PATCH('/v1/projects/{id}/', {
      params: { path: { id } },
      body: params,
    });

    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'UPDATE_PROJECT_FAILED',
        error,
        `Failed to update project ${id}`,
      );
    }

    return data;
  }

  /**
   * Delete a project. The backend rejects deleting a project that has attached resources
   * or is the org's only default.
   */
  async delete(id: string): Promise<void> {
    const { error } = await this._client.DELETE('/v1/projects/{id}/', {
      params: { path: { id } },
    });

    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'DELETE_PROJECT_FAILED',
        error,
        `Failed to delete project ${id}`,
      );
    }
  }
}
