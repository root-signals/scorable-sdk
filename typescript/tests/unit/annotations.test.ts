import { TestUtils } from '../helpers/test-utils';
import { mockClient } from '../helpers/mock-client';

const annotationFixture = {
  id: 'ann-1',
  dataset_item: 'di-1',
  execution_log: null,
  score_config: 'sc-1',
  value: 1.0,
  category: '👍',
  rationale: '',
  status: 'published',
  created_at: '2026-07-01T00:00:00Z',
};

describe('AnnotationsResource', () => {
  let client: any;

  beforeEach(() => {
    client = TestUtils.createMockClient();
    mockClient.reset();
  });

  it('creates an annotation on a dataset item with a category', async () => {
    mockClient.setMockResponse('POST', '/v1/annotations/', {
      data: annotationFixture,
      error: undefined,
    });

    const result = await client.annotations.create({
      datasetItemId: 'di-1',
      category: '👍',
      scoreConfigId: 'sc-1',
    });

    expect(result.id).toBe('ann-1');
    expect(mockClient.POST).toHaveBeenCalledWith('/v1/annotations/', {
      body: {
        dataset_item: 'di-1',
        score_config: 'sc-1',
        category: '👍',
        rationale: '',
        status: 'published',
      },
    });
  });

  it('defaults the score config to the identity config when omitted', async () => {
    mockClient.setMockResponse('POST', '/v1/annotations/', {
      data: { ...annotationFixture, score_config: 'identity', value: 0.8, category: null },
      error: undefined,
    });

    await client.annotations.create({ datasetItemId: 'di-1', value: 0.8 });

    expect(mockClient.POST).toHaveBeenCalledWith('/v1/annotations/', {
      body: { dataset_item: 'di-1', value: 0.8, rationale: '', status: 'published' },
    });
  });

  it('rejects when no target is provided', async () => {
    await expect(client.annotations.create({ value: 0.5 })).rejects.toThrow(
      /exactly one of datasetItemId or executionLogId/i,
    );
  });

  it('rejects when both targets are provided', async () => {
    await expect(
      client.annotations.create({ datasetItemId: 'di-1', executionLogId: 'el-1', value: 0.5 }),
    ).rejects.toThrow(/exactly one of datasetItemId or executionLogId/i);
  });

  it('lists annotations with filters', async () => {
    mockClient.setMockResponse('GET', '/v1/annotations/', {
      data: { results: [annotationFixture], next: null, previous: null },
      error: undefined,
    });

    const result = await client.annotations.list({ dataset: 'ds-1', status: 'published' });

    expect(result.results).toHaveLength(1);
    expect(mockClient.GET).toHaveBeenCalledWith('/v1/annotations/', {
      params: { query: { dataset: 'ds-1', status: 'published' } },
    });
  });

  it('updates an annotation', async () => {
    mockClient.setMockResponse('PATCH', '/v1/annotations/{id}/', {
      data: { ...annotationFixture, rationale: 'good' },
      error: undefined,
    });

    await client.annotations.update('ann-1', { rationale: 'good', status: 'draft' });

    expect(mockClient.PATCH).toHaveBeenCalledWith('/v1/annotations/{id}/', {
      params: { path: { id: 'ann-1' } },
      body: { rationale: 'good', status: 'draft' },
    });
  });

  it('deletes an annotation', async () => {
    mockClient.setMockResponse('DELETE', '/v1/annotations/{id}/', {
      data: undefined,
      error: undefined,
    });

    await client.annotations.delete('ann-1');

    expect(mockClient.DELETE).toHaveBeenCalledWith('/v1/annotations/{id}/', {
      params: { path: { id: 'ann-1' } },
    });
  });
});
