import { ClientConfig, ScorableError } from '../types/common.js';

export interface UploadedFile {
  id: string;
}

export class FilesResource {
  constructor(private _config: ClientConfig) {}

  /**
   * Upload a file (PDF, PNG, JPG, JPEG, WEBP, or SVG) and return its ID.
   *
   * Pass the returned ID to the `file_ids` field of evaluator or judge execute calls.
   * PDFs are extracted to text context; images are passed directly to the model.
   *
   * @param file - A File object (browser), Blob, or ArrayBuffer
   * @param filename - File name including extension. Required when passing Blob or ArrayBuffer.
   */
  async upload(file: File | Blob | ArrayBuffer, filename?: string): Promise<UploadedFile> {
    const baseUrl = this._config.baseUrl ?? 'https://api.scorable.ai';
    const apiKey = this._config.apiKey;

    const formData = new FormData();
    const isFile = typeof File !== 'undefined' && file instanceof File;

    if (file instanceof ArrayBuffer) {
      if (!filename) throw new TypeError('filename is required when uploading an ArrayBuffer');
      formData.append('file', new Blob([file]), filename);
    } else if (isFile) {
      formData.append('file', file, filename ?? (file as File).name);
    } else {
      if (!filename) throw new TypeError('filename is required when uploading a Blob');
      formData.append('file', file as Blob, filename);
    }

    const response = await fetch(`${baseUrl}/v1/files/`, {
      method: 'POST',
      headers: { Authorization: `Api-Key ${apiKey}` },
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new ScorableError(
        response.status,
        'FILE_UPLOAD_FAILED',
        {},
        `File upload failed: ${text}`,
      );
    }

    return (await response.json()) as UploadedFile;
  }
}
