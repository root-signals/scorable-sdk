import type { paths, components } from '../generated/types.js';
import { PaginatedResponse, ListParams, ScorableError, ApiError } from '../types/common.js';

type Client = ReturnType<typeof import('openapi-fetch').default<paths>>;

export type CalibrationRun = components['schemas']['CalibrationRun'];
export type CalibrationRunItem = components['schemas']['CalibrationRunItem'];

export interface CreateCalibrationRunData {
  /** The saved evaluator to calibrate. */
  evaluatorId: string;
  /** The dataset whose published annotations to calibrate against. */
  datasetId: string;
  /** Optional score config; omitting it uses the dataset's continuous scores. */
  scoreConfigId?: string;
  /** Optional specific evaluator version. */
  evaluatorVersionId?: string;
}

export interface CalibrationRunListParams extends ListParams {
  /** Filter by evaluator external id. */
  evaluatorId?: string;
}

/**
 * A calibration run measures agreement between an evaluator and human annotations on a dataset.
 * Runs execute asynchronously: a freshly created run has `status: "pending"`; poll `get` until it
 * is `completed` or `failed` to read its `metrics`.
 */
export class CalibrationRunsResource {
  constructor(private _client: Client) {}

  async create(data: CreateCalibrationRunData): Promise<CalibrationRun> {
    const body = {
      evaluator_external_id: data.evaluatorId,
      ...(data.evaluatorVersionId !== undefined
        ? { evaluator_version_id: data.evaluatorVersionId }
        : {}),
      ...(data.scoreConfigId !== undefined ? { score_config_id: data.scoreConfigId } : {}),
      source: { type: 'dataset' as const, dataset_id: data.datasetId },
    };
    const { data: result, error } = await this._client.POST('/v1/calibration-runs/', { body });
    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'CREATE_CALIBRATION_RUN_FAILED',
        error,
        'Failed to create calibration run',
      );
    }
    return result;
  }

  async get(id: string): Promise<CalibrationRun> {
    const { data, error } = await this._client.GET('/v1/calibration-runs/{id}/', {
      params: { path: { id } },
    });
    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'GET_CALIBRATION_RUN_FAILED',
        error,
        `Failed to get calibration run ${id}`,
      );
    }
    return data;
  }

  async list(params: CalibrationRunListParams = {}): Promise<PaginatedResponse<CalibrationRun>> {
    const { evaluatorId, ...rest } = params;
    const query =
      evaluatorId !== undefined ? { ...rest, evaluator_external_id: evaluatorId } : rest;
    const { data, error } = await this._client.GET('/v1/calibration-runs/', { params: { query } });
    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'LIST_CALIBRATION_RUNS_FAILED',
        error,
        'Failed to list calibration runs',
      );
    }
    return {
      results: data.results,
      next: data.next ?? undefined,
      previous: data.previous ?? undefined,
    };
  }

  async listItems(
    id: string,
    params: ListParams = {},
  ): Promise<PaginatedResponse<CalibrationRunItem>> {
    const { data, error } = await this._client.GET('/v1/calibration-runs/{id}/items/', {
      params: { path: { id }, query: params },
    });
    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'LIST_CALIBRATION_RUN_ITEMS_FAILED',
        error,
        `Failed to list items for calibration run ${id}`,
      );
    }
    return {
      results: data.results,
      next: data.next ?? undefined,
      previous: data.previous ?? undefined,
    };
  }
}
