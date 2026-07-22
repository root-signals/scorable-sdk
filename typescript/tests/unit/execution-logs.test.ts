import { TestUtils } from '../helpers/test-utils';
import { mockClient } from '../helpers/mock-client';

describe('ExecutionLogsResource', () => {
  let client: any;

  beforeEach(() => {
    client = TestUtils.createMockClient();
    mockClient.reset();
  });

  describe('list with projectId', () => {
    it('translates projectId to project_id on the wire', async () => {
      mockClient.setMockResponse('GET', '/v1/execution-logs/', {
        data: { results: [], next: null, previous: null },
        error: undefined,
      });

      await client.executionLogs.list({ projectId: 'proj-abc' });

      expect(mockClient.GET).toHaveBeenCalledWith('/v1/execution-logs/', {
        params: { query: { project_id: 'proj-abc' } },
      });
    });

    it('combines projectId with tags filter', async () => {
      mockClient.setMockResponse('GET', '/v1/execution-logs/', {
        data: { results: [], next: null, previous: null },
        error: undefined,
      });

      await client.executionLogs.list({ projectId: 'proj-abc', tags: 'prod,v1' });

      expect(mockClient.GET).toHaveBeenCalledWith('/v1/execution-logs/', {
        params: { query: { project_id: 'proj-abc', tags: 'prod,v1' } },
      });
    });

    it('omits project_id when not provided', async () => {
      mockClient.setMockResponse('GET', '/v1/execution-logs/', {
        data: { results: [], next: null, previous: null },
        error: undefined,
      });

      await client.executionLogs.list({ page_size: 10 });

      expect(mockClient.GET).toHaveBeenCalledWith('/v1/execution-logs/', {
        params: { query: { page_size: 10 } },
      });
    });
  });

  describe('list translates filter names onto the API param names', () => {
    beforeEach(() => {
      mockClient.setMockResponse('GET', '/v1/execution-logs/', {
        data: { results: [], next: null, previous: null },
        error: undefined,
      });
    });

    const expectQuery = (query: Record<string, unknown>) =>
      expect(mockClient.GET).toHaveBeenCalledWith('/v1/execution-logs/', {
        params: { query },
      });

    it('maps score_min/score_max to min_score/max_score', async () => {
      await client.executionLogs.list({ score_min: 0.2, score_max: 0.9 });
      expectQuery({ min_score: 0.2, max_score: 0.9 });
    });

    it('maps cost_min/cost_max to min_cost/max_cost', async () => {
      await client.executionLogs.list({ cost_min: 0.01, cost_max: 5 });
      expectQuery({ min_cost: 0.01, max_cost: 5 });
    });

    it('maps created_at_after/created_at_before to date_from/date_to', async () => {
      await client.executionLogs.list({
        created_at_after: '2026-01-01T00:00:00Z',
        created_at_before: '2026-02-01T00:00:00Z',
      });
      expectQuery({ date_from: '2026-01-01T00:00:00Z', date_to: '2026-02-01T00:00:00Z' });
    });

    it('maps skill_id to executed_item_id', async () => {
      await client.executionLogs.list({ skill_id: 'skill-1' });
      expectQuery({ executed_item_id: 'skill-1' });
    });

    it('maps evaluator_id to executed_item_id', async () => {
      await client.executionLogs.list({ evaluator_id: 'eval-1' });
      expectQuery({ executed_item_id: 'eval-1' });
    });

    it('maps owner__email to owner_email', async () => {
      await client.executionLogs.list({ owner__email: 'user@scorable.ai' });
      expectQuery({ owner_email: 'user@scorable.ai' });
    });

    it('rejects conflicting skill_id and evaluator_id instead of silently dropping one', async () => {
      await expect(
        client.executionLogs.list({ skill_id: 'skill-1', evaluator_id: 'eval-1' }),
      ).rejects.toThrow('skill_id and evaluator_id cannot be used together');
      expect(mockClient.GET).not.toHaveBeenCalled();
    });

    it('passes judge_id, model, tags and search through unchanged', async () => {
      await client.executionLogs.list({
        judge_id: 'judge-1',
        model: 'claude-opus-4-8',
        tags: 'prod',
        search: 'foo',
      });
      expectQuery({
        judge_id: 'judge-1',
        model: 'claude-opus-4-8',
        tags: 'prod',
        search: 'foo',
      });
    });
  });
});
