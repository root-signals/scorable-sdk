import { TestUtils } from '../helpers/test-utils';
import { mockClient } from '../helpers/mock-client';
import { TestDataFactory } from '../fixtures/test-data';

describe('DatasetsResource', () => {
  let client: any;

  beforeEach(() => {
    client = TestUtils.createMockClient();
    mockClient.reset();
  });

  describe('list', () => {
    it('should list datasets successfully', async () => {
      const mockDatasets = {
        results: [
          TestDataFactory.createDataset(),
          TestDataFactory.createDataset({ type: 'reference' }),
        ],
        next: null,
        previous: null,
      };

      mockClient.setMockResponse('GET', '/v1/datasets/', {
        data: mockDatasets,
        error: undefined,
      });

      const result = await client.datasets.list();

      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toHaveProperty('id');
      expect(result.results[0]).toHaveProperty('name');
    });

    it('should handle pagination parameters', async () => {
      await client.datasets.list({
        page_size: 10,
        type: 'test',
        search: 'test-dataset',
      });

      expect(mockClient.GET).toHaveBeenCalledWith('/v1/datasets/', {
        params: {
          query: {
            page_size: 10,
            type: 'test',
            search: 'test-dataset',
          },
        },
      });
    });
  });

  describe('get', () => {
    it('should get dataset by ID', async () => {
      const datasetId = 'dataset-123';
      const mockDataset = TestDataFactory.createDataset({ id: datasetId });

      mockClient.setMockResponse('GET', '/v1/datasets/{id}/', {
        data: mockDataset,
        error: undefined,
      });

      const result = await client.datasets.get(datasetId);

      expect(result.id).toBe(datasetId);
      expect(mockClient.GET).toHaveBeenCalledWith('/v1/datasets/{id}/', {
        params: {
          path: { id: datasetId },
          query: { download: false },
        },
      });
    });

    it('should handle download parameter', async () => {
      const datasetId = 'dataset-123';

      await client.datasets.get(datasetId, true);

      expect(mockClient.GET).toHaveBeenCalledWith('/v1/datasets/{id}/', {
        params: {
          path: { id: datasetId },
          query: { download: true },
        },
      });
    });
  });

  describe('create', () => {
    it('should create dataset successfully', async () => {
      const datasetData = {
        name: 'Test Dataset',
        type: 'test' as const,
        url: 'https://example.com/data.csv',
        has_header: true,
      };

      const createdDataset = TestDataFactory.createDataset(datasetData);
      mockClient.setMockResponse('POST', '/v1/datasets/', {
        data: createdDataset,
        error: undefined,
      });

      const result = await client.datasets.create(datasetData);

      expect(result.name).toBe(datasetData.name);
      expect(mockClient.POST).toHaveBeenCalledWith('/v1/datasets/', {
        body: datasetData,
      });
    });

    it('should handle validation errors', async () => {
      mockClient.setMockError('POST', '/v1/datasets/', {
        name: ['This field is required.'],
      });

      await expect(client.datasets.create({})).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete dataset successfully', async () => {
      const datasetId = 'dataset-123';
      mockClient.setMockResponse('DELETE', `/v1/datasets/${datasetId}/`, {
        data: undefined,
        error: undefined,
      });

      await client.datasets.delete(datasetId);

      expect(mockClient.DELETE).toHaveBeenCalledWith('/v1/datasets/{id}/', {
        params: { path: { id: datasetId } },
      });
    });
  });

  describe('download', () => {
    it('should download dataset', async () => {
      const datasetId = 'dataset-123';
      const mockDataset = TestDataFactory.createDataset({ id: datasetId });

      mockClient.setMockResponse('GET', '/v1/datasets/{id}/', {
        data: mockDataset,
        error: undefined,
      });

      const result = await client.datasets.download(datasetId);

      expect(result.id).toBe(datasetId);
      expect(mockClient.GET).toHaveBeenCalledWith('/v1/datasets/{id}/', {
        params: {
          path: { id: datasetId },
          query: { download: true },
        },
      });
    });
  });

  describe('error handling', () => {
    it('should throw ScorableError on API errors', async () => {
      mockClient.setMockError('GET', '/v1/datasets/', {
        detail: 'Internal server error',
      });

      await expect(client.datasets.list()).rejects.toThrow('Failed to list datasets');
    });
  });
});
