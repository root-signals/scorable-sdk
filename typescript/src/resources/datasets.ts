import type { paths, components } from '../generated/types.ts';
import { ScorableError, PaginatedResponse, ApiError, ListParams } from '../types/common.js';

export type DatasetItem = components['schemas']['DatasetItem'];
export type DatasetItemRequest = components['schemas']['DatasetItemRequest'];
export type PatchedDatasetItemRequest = components['schemas']['PatchedDatasetItemRequest'];

export interface ListDatasetItemsParams extends ListParams {
  /** Include archived items when true (defaults to excluding them). */
  includeArchived?: boolean;
}

// Extract types from the generated schema
type DatasetListResponse =
  paths['/v1/datasets/']['get']['responses'][200]['content']['application/json'];
type DatasetList = DatasetListResponse['results'][0];
type DatasetDetail =
  paths['/v1/datasets/{id}/']['get']['responses'][200]['content']['application/json'];
type DatasetCreate =
  paths['/v1/datasets/']['post']['responses'][201]['content']['application/json'];
type DatasetCreateRequest = NonNullable<
  paths['/v1/datasets/']['post']['requestBody']
>['content']['application/json'];
type Client = ReturnType<typeof import('openapi-fetch').default<paths>>;
// List parameters for datasets
interface ListDatasetsParams {
  cursor?: string;
  ordering?: string;
  page_size?: number;
  search?: string;
  type?: 'reference' | 'test';
  /** Filter datasets by project UUID. */
  projectId?: string;
}

// File upload types
interface DatasetMetadata {
  name?: string;
  type?: 'reference' | 'test';
  url?: string;
  tags?: string[];
  has_header?: boolean;
  /** Project to assign this dataset to. Defaults to the org's default project. */
  projectId?: string;
}

// Handle Node.js Buffer type compatibility
type FileInput = File | ArrayBuffer | Uint8Array | string;

export class DatasetsResource {
  constructor(private _client: Client) {}

  /**
   * List datasets
   */
  async list(params?: ListDatasetsParams): Promise<PaginatedResponse<DatasetList>> {
    const { projectId, ...rest } = params ?? {};
    const query = projectId !== undefined ? { ...rest, project_id: projectId } : rest;
    const { data, error } = await this._client.GET('/v1/datasets/', {
      params: { query },
    });

    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'LIST_DATASETS_FAILED',
        error,
        'Failed to list datasets',
      );
    }

    return {
      results: data.results,
      next: data.next ?? undefined,
      previous: data.previous ?? undefined,
    };
  }

  /**
   * Get dataset details
   */
  async get(id: string, download: boolean = false): Promise<DatasetDetail> {
    const { data, error } = await this._client.GET('/v1/datasets/{id}/', {
      params: {
        path: { id },
        query: { download },
      },
    });

    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'GET_DATASET_FAILED',
        error,
        `Failed to get dataset ${id}`,
      );
    }

    return data;
  }

  /**
   * Create a new dataset
   */
  async create(data: DatasetCreateRequest): Promise<DatasetCreate> {
    const { data: result, error } = await this._client.POST('/v1/datasets/', {
      body: data,
    });

    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'CREATE_DATASET_FAILED',
        error,
        'Failed to create dataset',
      );
    }

    return result;
  }

  /**
   * Upload a file as a dataset
   */
  async upload(file: FileInput, metadata: DatasetMetadata): Promise<DatasetCreate> {
    // Use FormData consistently across environments to properly handle binary data
    let FormDataConstructor: typeof FormData;

    if (typeof FormData !== 'undefined') {
      // Browser environment
      FormDataConstructor = FormData;
    } else {
      // Node.js environment - use undici or form-data polyfill
      try {
        // Try undici FormData first (Node.js 18+)
        const undici = await import('undici');
        FormDataConstructor = undici.FormData as unknown as typeof FormData;
      } catch {
        // Fallback to form-data package
        try {
          const FormDataPolyfill = await import('form-data');
          FormDataConstructor = FormDataPolyfill.default as unknown as typeof FormData;
        } catch {
          throw new Error(
            'FormData not available. Please install "undici" or "form-data" package for Node.js support.',
          );
        }
      }
    }

    const formData = new FormDataConstructor();

    // Add file with proper handling for different input types
    if (file instanceof File) {
      formData.append('file', file);
    } else if (file instanceof ArrayBuffer || file instanceof Uint8Array) {
      // Create a proper Blob for binary data
      if (typeof Blob !== 'undefined') {
        const data = new Uint8Array(file);
        const blob = new Blob([data]);
        formData.append('file', blob, metadata.name ?? 'dataset.csv');
      } else {
        // Node.js environment - use Buffer
        const buffer = Buffer.from(file instanceof ArrayBuffer ? file : file.buffer);
        formData.append('file', buffer as never, metadata.name ?? 'dataset.csv');
      }
    } else if (typeof file === 'string') {
      // Handle URL or base64 string
      formData.append('file', file);
    } else {
      // Handle other file-like objects (ReadableStream, etc.)
      formData.append('file', file, metadata.name ?? 'dataset.csv');
    }

    // Add metadata fields
    if (metadata.name) formData.append('name', metadata.name);
    if (metadata.type) formData.append('type', metadata.type);
    if (metadata.url) formData.append('url', metadata.url);
    if (metadata.has_header !== undefined)
      formData.append('has_header', metadata.has_header.toString());
    if (metadata.tags) {
      metadata.tags.forEach((tag) => formData.append('tags', tag));
    }
    if (metadata.projectId !== undefined) {
      formData.append('project_id', metadata.projectId);
    }

    const requestBody = formData;

    const { data, error } = await this._client.POST('/v1/datasets/', {
      // @ts-expect-error - FormData is not a valid request body
      body: requestBody,
    });

    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'UPLOAD_DATASET_FAILED',
        error,
        'Failed to upload dataset',
      );
    }

    return data;
  }

  /**
   * Delete a dataset
   */
  async delete(id: string): Promise<void> {
    const { error } = await this._client.DELETE('/v1/datasets/{id}/', {
      params: { path: { id } },
    });

    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'DELETE_DATASET_FAILED',
        error,
        `Failed to delete dataset ${id}`,
      );
    }
  }

  /**
   * Download dataset file
   */
  async download(id: string): Promise<DatasetDetail> {
    return this.get(id, true);
  }

  /**
   * Add a single item to a dataset
   */
  async addItem(datasetId: string, item: DatasetItemRequest): Promise<DatasetItem> {
    const { data, error } = await this._client.POST('/v1/datasets/{dataset_id}/items/', {
      params: { path: { dataset_id: datasetId } },
      body: item,
    });
    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'ADD_DATASET_ITEM_FAILED',
        error,
        `Failed to add item to dataset ${datasetId}`,
      );
    }
    return data;
  }

  /**
   * Bulk add items to a dataset (at most 5000 per call)
   */
  async addItems(datasetId: string, items: DatasetItemRequest[]): Promise<DatasetItem[]> {
    const { data, error } = await this._client.POST('/v1/datasets/{dataset_id}/items/bulk/', {
      params: { path: { dataset_id: datasetId } },
      body: items,
    });
    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'BULK_ADD_DATASET_ITEMS_FAILED',
        error,
        `Failed to bulk add items to dataset ${datasetId}`,
      );
    }
    return data;
  }

  /**
   * List the latest-version items of a dataset (with embedded published annotations)
   */
  async listItems(
    datasetId: string,
    params: ListDatasetItemsParams = {},
  ): Promise<PaginatedResponse<DatasetItem>> {
    const { includeArchived, ...rest } = params;
    const query = includeArchived !== undefined ? { ...rest, is_archived: includeArchived } : rest;
    const { data, error } = await this._client.GET('/v1/datasets/{dataset_id}/items/', {
      params: { path: { dataset_id: datasetId }, query },
    });
    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'LIST_DATASET_ITEMS_FAILED',
        error,
        `Failed to list items for dataset ${datasetId}`,
      );
    }
    return {
      results: data.results,
      next: data.next ?? undefined,
      previous: data.previous ?? undefined,
    };
  }

  /**
   * Get a single dataset item
   */
  async getItem(datasetId: string, itemId: string): Promise<DatasetItem> {
    const { data, error } = await this._client.GET('/v1/datasets/{dataset_id}/items/{item_id}/', {
      params: { path: { dataset_id: datasetId, item_id: itemId } },
    });
    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'GET_DATASET_ITEM_FAILED',
        error,
        `Failed to get item ${itemId}`,
      );
    }
    return data;
  }

  /**
   * Edit a dataset item (creates a new version; only the latest version is editable)
   */
  async updateItem(
    datasetId: string,
    itemId: string,
    item: PatchedDatasetItemRequest,
  ): Promise<DatasetItem> {
    const { data, error } = await this._client.PATCH('/v1/datasets/{dataset_id}/items/{item_id}/', {
      params: { path: { dataset_id: datasetId, item_id: itemId } },
      body: item,
    });
    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'UPDATE_DATASET_ITEM_FAILED',
        error,
        `Failed to update item ${itemId}`,
      );
    }
    return data;
  }

  /**
   * Archive (soft-delete) a dataset item
   */
  async archiveItem(datasetId: string, itemId: string): Promise<void> {
    const { error } = await this._client.DELETE('/v1/datasets/{dataset_id}/items/{item_id}/', {
      params: { path: { dataset_id: datasetId, item_id: itemId } },
    });
    if (error) {
      throw new ScorableError(
        (error as ApiError)?.status ?? 500,
        'ARCHIVE_DATASET_ITEM_FAILED',
        error,
        `Failed to archive item ${itemId}`,
      );
    }
  }
}
