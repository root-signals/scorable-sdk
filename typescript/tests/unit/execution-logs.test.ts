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
});
