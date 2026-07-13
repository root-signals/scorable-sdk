import type { paths, components } from '../generated/types.js';
import { PaginatedResponse, ListParams, ScorableError, ApiError } from '../types/common.js';

type Client = ReturnType<typeof import('openapi-fetch').default<paths>>;

export type Annotation = components['schemas']['Annotation'];
type AnnotationStatus = components['schemas']['AnnotationStatusEnum'];

export interface CreateAnnotationData {
  /** The dataset item to annotate (mutually exclusive with executionLogId). */
  datasetItemId?: string;
  /** The execution log to annotate (mutually exclusive with datasetItemId). */
  executionLogId?: string;
  /** The score for continuous configs. */
  value?: number;
  /** The label for binary/categorical configs. */
  category?: string;
  rationale?: string;
  /** `draft` or `published` (default `published`). */
  status?: AnnotationStatus;
  /** The score config; defaults to the global identity "Score" config. */
  scoreConfigId?: string;
}

export interface UpdateAnnotationData {
  value?: number;
  category?: string;
  rationale?: string;
  status?: AnnotationStatus;
}

export interface AnnotationListParams extends ListParams {
  /** Filter by the dataset the annotated items belong to. */
  dataset?: string;
  score_config?: string;
  status?: AnnotationStatus;
  dataset_item?: string;
  execution_log?: string;
}

export class AnnotationsResource {
  constructor(private _client: Client) {}

  async list(params: AnnotationListParams = {}): Promise<PaginatedResponse<Annotation>> {
    const { data, error } = await this._client.GET('/v1/annotations/', {
      params: { query: params },
    });
    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'LIST_ANNOTATIONS_FAILED',
        error,
        'Failed to list annotations',
      );
    }
    return {
      results: data.results,
      next: data.next ?? undefined,
      previous: data.previous ?? undefined,
    };
  }

  async create(data: CreateAnnotationData): Promise<Annotation> {
    if ((data.datasetItemId == null) === (data.executionLogId == null)) {
      throw new ScorableError(
        400,
        'INVALID_ANNOTATION_TARGET',
        undefined,
        'Exactly one of datasetItemId or executionLogId must be provided',
      );
    }
    const body = {
      ...(data.datasetItemId !== undefined ? { dataset_item: data.datasetItemId } : {}),
      ...(data.executionLogId !== undefined ? { execution_log: data.executionLogId } : {}),
      ...(data.scoreConfigId !== undefined ? { score_config: data.scoreConfigId } : {}),
      ...(data.value !== undefined ? { value: data.value } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      rationale: data.rationale ?? '',
      status: data.status ?? ('published' as const),
    };
    const { data: result, error } = await this._client.POST('/v1/annotations/', { body });
    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'CREATE_ANNOTATION_FAILED',
        error,
        'Failed to create annotation',
      );
    }
    return result;
  }

  async get(id: string): Promise<Annotation> {
    const { data, error } = await this._client.GET('/v1/annotations/{id}/', {
      params: { path: { id } },
    });
    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'GET_ANNOTATION_FAILED',
        error,
        `Failed to get annotation ${id}`,
      );
    }
    return data;
  }

  async update(id: string, data: UpdateAnnotationData): Promise<Annotation> {
    const { data: result, error } = await this._client.PATCH('/v1/annotations/{id}/', {
      params: { path: { id } },
      body: data,
    });
    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'UPDATE_ANNOTATION_FAILED',
        error,
        `Failed to update annotation ${id}`,
      );
    }
    return result;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this._client.DELETE('/v1/annotations/{id}/', {
      params: { path: { id } },
    });
    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'DELETE_ANNOTATION_FAILED',
        error,
        `Failed to delete annotation ${id}`,
      );
    }
  }
}
