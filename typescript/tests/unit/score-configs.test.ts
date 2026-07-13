import { TestUtils } from '../helpers/test-utils';
import { mockClient } from '../helpers/mock-client';

const scoreConfigFixture = {
  id: 'sc-1',
  name: 'Thumbs',
  type: 'binary',
  categories: [
    { label: '👍', value: 1.0 },
    { label: '👎', value: 0.0 },
  ],
  min_value: null,
  max_value: null,
  is_default: false,
  created_at: '2026-07-01T00:00:00Z',
};

describe('ScoreConfigsResource', () => {
  let client: any;

  beforeEach(() => {
    client = TestUtils.createMockClient();
    mockClient.reset();
  });

  it('creates a binary score config', async () => {
    mockClient.setMockResponse('POST', '/v1/score-configs/', {
      data: scoreConfigFixture,
      error: undefined,
    });

    const result = await client.scoreConfigs.create({
      name: 'Thumbs',
      type: 'binary',
      categories: scoreConfigFixture.categories,
    });

    expect(result.id).toBe('sc-1');
    expect(mockClient.POST).toHaveBeenCalledWith('/v1/score-configs/', {
      body: { name: 'Thumbs', type: 'binary', categories: scoreConfigFixture.categories },
    });
  });

  it('lists score configs', async () => {
    mockClient.setMockResponse('GET', '/v1/score-configs/', {
      data: { results: [scoreConfigFixture], next: null, previous: null },
      error: undefined,
    });

    const result = await client.scoreConfigs.list();

    expect(result.results).toHaveLength(1);
    expect(mockClient.GET).toHaveBeenCalledWith('/v1/score-configs/', { params: { query: {} } });
  });

  it('updates a score config', async () => {
    mockClient.setMockResponse('PATCH', '/v1/score-configs/{id}/', {
      data: { ...scoreConfigFixture, name: 'Renamed' },
      error: undefined,
    });

    await client.scoreConfigs.update('sc-1', { name: 'Renamed' });

    expect(mockClient.PATCH).toHaveBeenCalledWith('/v1/score-configs/{id}/', {
      params: { path: { id: 'sc-1' } },
      body: { name: 'Renamed' },
    });
  });

  it('deletes a score config', async () => {
    mockClient.setMockResponse('DELETE', '/v1/score-configs/{id}/', {
      data: undefined,
      error: undefined,
    });

    await client.scoreConfigs.delete('sc-1');

    expect(mockClient.DELETE).toHaveBeenCalledWith('/v1/score-configs/{id}/', {
      params: { path: { id: 'sc-1' } },
    });
  });
});
