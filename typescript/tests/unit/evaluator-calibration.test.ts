import { TestUtils } from '../helpers/test-utils';
import { mockClient } from '../helpers/mock-client';

describe('EvaluatorsResource calibration & demonstrations', () => {
  let client: any;

  beforeEach(() => {
    client = TestUtils.createMockClient();
    mockClient.reset();
  });

  it('starts a calibration run against a dataset', async () => {
    mockClient.setMockResponse('POST', '/v1/calibration-runs/', {
      data: { id: 'run-1', status: 'pending' },
      error: undefined,
    });

    const result = await client.evaluators.calibrateRun('ev-1', {
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

  it('sends demonstration_dataset_id on create', async () => {
    mockClient.setMockResponse('POST', '/v1/evaluators/', {
      data: { id: 'ev-1', name: 'E' },
      error: undefined,
    });

    await client.evaluators.create({
      name: 'E',
      scoring_criteria: 'criteria',
      objective_id: 'obj-1',
      demonstration_dataset_id: 'ds-1',
    });

    const call = (mockClient.POST as any).mock.calls.find((c: any[]) => c[0] === '/v1/evaluators/');
    expect(call[1].body.demonstration_dataset_id).toBe('ds-1');
  });

  it('sends demonstration_dataset_id on update', async () => {
    mockClient.setMockResponse('PATCH', '/v1/evaluators/{id}/', {
      data: { id: 'ev-1' },
      error: undefined,
    });

    await client.evaluators.update('ev-1', { demonstration_dataset_id: 'ds-1' });

    const call = (mockClient.PATCH as any).mock.calls.find(
      (c: any[]) => c[0] === '/v1/evaluators/{id}/',
    );
    expect(call[1].body.demonstration_dataset_id).toBe('ds-1');
  });
});
