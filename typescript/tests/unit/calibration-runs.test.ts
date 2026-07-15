import { TestUtils } from '../helpers/test-utils';
import { mockClient } from '../helpers/mock-client';

const runFixture = {
  id: 'run-1',
  evaluator_external_id: 'ev-1',
  evaluator_version_id: null,
  score_config: null,
  source_type: 'dataset',
  dataset: 'ds-1',
  status: 'pending',
  metrics: null,
  n_examples: 0,
  n_skipped: 0,
  error: null,
  created_at: '2026-07-01T00:00:00Z',
};

describe('CalibrationRunsResource', () => {
  let client: any;

  beforeEach(() => {
    client = TestUtils.createMockClient();
    mockClient.reset();
  });

  it('creates a run with a dataset source', async () => {
    mockClient.setMockResponse('POST', '/v1/calibration-runs/', {
      data: runFixture,
      error: undefined,
    });

    const result = await client.calibrationRuns.create({
      evaluatorId: 'ev-1',
      datasetId: 'ds-1',
      scoreConfigId: 'sc-1',
    });

    expect(result.id).toBe('run-1');
    expect(mockClient.POST).toHaveBeenCalledWith('/v1/calibration-runs/', {
      body: {
        evaluator_external_id: 'ev-1',
        score_config_id: 'sc-1',
        source: { type: 'dataset', dataset_id: 'ds-1' },
      },
    });
  });

  it('gets a run', async () => {
    mockClient.setMockResponse('GET', '/v1/calibration-runs/{id}/', {
      data: { ...runFixture, status: 'completed' },
      error: undefined,
    });

    const result = await client.calibrationRuns.get('run-1');

    expect(result.status).toBe('completed');
    expect(mockClient.GET).toHaveBeenCalledWith('/v1/calibration-runs/{id}/', {
      params: { path: { id: 'run-1' } },
    });
  });

  it('lists runs filtered by evaluator', async () => {
    mockClient.setMockResponse('GET', '/v1/calibration-runs/', {
      data: { results: [runFixture], next: null, previous: null },
      error: undefined,
    });

    await client.calibrationRuns.list({ evaluatorId: 'ev-1' });

    expect(mockClient.GET).toHaveBeenCalledWith('/v1/calibration-runs/', {
      params: { query: { evaluator_external_id: 'ev-1' } },
    });
  });

  it('lists per-item results', async () => {
    mockClient.setMockResponse('GET', '/v1/calibration-runs/{id}/items/', {
      data: { results: [{ id: 'i-1' }], next: null, previous: null },
      error: undefined,
    });

    const result = await client.calibrationRuns.listItems('run-1');

    expect(result.results).toHaveLength(1);
    expect(mockClient.GET).toHaveBeenCalledWith('/v1/calibration-runs/{id}/items/', {
      params: { path: { id: 'run-1' }, query: {} },
    });
  });
});
