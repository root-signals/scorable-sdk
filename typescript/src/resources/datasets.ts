import type { paths } from '../generated/types.ts';
import { ScorableError, PaginatedResponse, ApiError } from '../types/common.js';

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
}

// File upload types
interface DatasetMetadata {
  name?: string;
  type?: 'reference' | 'test';
  url?: string;
  tags?: string[];
  has_header?: boolean;
}

// Handle Node.js Buffer type compatibility
type FileInput = File | ArrayBuffer | Uint8Array | string;

export class DatasetsResource {
  constructor(private _client: Client) {}

  /**
   * List datasets
   */
  async list(params?: ListDatasetsParams): Promise<PaginatedResponse<DatasetList>> {
    const { data, error } = await this._client.GET('/v1/datasets/', {
      params: { query: params ?? {} },
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
}
