import { TestUtils } from '../helpers/test-utils';
import { mockClient } from '../helpers/mock-client';
import { mockResponses } from '../fixtures/mock-responses';
import { TestDataFactory } from '../fixtures/test-data';

describe('JudgesResource', () => {
  let client: any;

  beforeEach(() => {
    client = TestUtils.createMockClient();
    mockClient.reset();
  });

  describe('list', () => {
    it('should list judges successfully', async () => {
      mockClient.setMockResponse('GET', '/v1/judges/', {
        data: mockResponses.judges.list,
        error: undefined,
      });

      const result = await client.judges.list();

      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toHaveProperty('id');
      expect(result.results[0]).toHaveProperty('name');
      expect(result.results[0]).toHaveProperty('intent');
    });

    it('should handle pagination parameters', async () => {
      await client.judges.list({ page_size: 5, search: 'test' });

      expect(mockClient.GET).toHaveBeenCalledWith('/v1/judges/', {
        params: {
          query: { page_size: 5, search: 'test' },
        },
      });
    });
  });

  describe('get', () => {
    it('should get judge by ID', async () => {
      const judgeId = 'f6ba8a25-77ae-46fe-86f4-1ced13be81d2';
      mockClient.setMockResponse('GET', '/v1/judges/{id}/', {
        data: mockResponses.judges.detail,
        error: undefined,
      });

      const result = await client.judges.get(judgeId);

      expect(result.id).toBe(judgeId);
      expect(result.name).toBe('Test Judge');
      expect(result.intent).toBeDefined();
    });
  });

  describe('create', () => {
    it('should create judge successfully', async () => {
      const judgeData = {
        name: 'New Test Judge',
        intent: 'Test judge for evaluation',
        evaluators: [],
        status: 'public',
      };

      const createdJudge = TestDataFactory.createJudge(judgeData);
      mockClient.setMockResponse('POST', '/v1/judges/', {
        data: createdJudge,
        error: undefined,
      });

      const result = await client.judges.create(judgeData);

      expect(result.name).toBe(judgeData.name);
      expect(result.intent).toBe(judgeData.intent);
      expect(mockClient.POST).toHaveBeenCalledWith('/v1/judges/', {
        body: judgeData,
      });
    });

    it('should handle validation errors', async () => {
      mockClient.setMockError('POST', '/v1/judges/', {
        name: ['This field is required.'],
      });

      await expect(client.judges.create({ intent: 'Missing name' })).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update judge successfully', async () => {
      const judgeId = 'judge-123';
      const updateData = {
        name: 'Updated Judge Name',
        intent: 'Updated intent',
        evaluators: [],
      };

      mockClient.setMockResponse('PATCH', '/v1/judges/{id}/', {
        data: { id: judgeId, ...updateData },
        error: undefined,
      });

      await client.judges.update(judgeId, updateData);

      expect(mockClient.PATCH).toHaveBeenCalledWith(`/v1/judges/{id}/`, {
        params: { path: { id: judgeId } },
        body: updateData,
      });
    });
  });

  describe('patch', () => {
    it.skip('should partially update judge', async () => {
      const judgeId = 'judge-123';
      const patchData = { name: 'Partially Updated Name' };

      const patchedJudge = TestDataFactory.createJudge({
        id: judgeId,
        ...patchData,
      });
      mockClient.setMockResponse('PATCH', `/v1/judges/{judge_id}/`, {
        data: patchedJudge,
        error: undefined,
      });

      const result = await client.judges.patch(judgeId, patchData);

      expect(result.name).toBe(patchData.name);
      expect(mockClient.PATCH).toHaveBeenCalledWith(`/v1/judges/{judge_id}/`, {
        params: { path: { id: judgeId } },
        body: patchData,
      });
    });
  });

  describe('delete', () => {
    it('should delete judge successfully', async () => {
      const judgeId = 'judge-123';
      mockClient.setMockResponse('DELETE', '/v1/judges/{id}/', {
        data: undefined,
        error: undefined,
      });

      await client.judges.delete(judgeId);

      expect(mockClient.DELETE).toHaveBeenCalledWith('/v1/judges/{id}/', {
        params: { path: { id: judgeId } },
      });
    });
  });

  describe('execute', () => {
    it('should execute judge successfully', async () => {
      const judgeId = 'judge-123';
      const executionData = TestDataFactory.getTestExecutionInputs();

      mockClient.setMockResponse('POST', '/v1/judges/{judge_id}/execute/', {
        data: mockResponses.judges.execution,
        error: undefined,
      });

      const result = await client.judges.execute(judgeId, executionData);

      expect(result.evaluator_results).toBeDefined();
      expect(Array.isArray(result.evaluator_results)).toBe(true);
      expect(mockClient.POST).toHaveBeenCalledWith(`/v1/judges/{judge_id}/execute/`, {
        params: { path: { judge_id: judgeId } },
        body: executionData,
      });
    });
  });

  describe('executeByName', () => {
    it('should execute judge by name successfully', async () => {
      const judgeName = 'Test Judge Name';
      const executionData = TestDataFactory.getTestExecutionInputs();

      mockClient.setMockResponse('POST', '/v1/judges/execute/by-name/', {
        data: mockResponses.judges.execution,
        error: undefined,
      });

      const result = await client.judges.executeByName(judgeName, executionData);

      expect(result.evaluator_results).toBeDefined();
      expect(Array.isArray(result.evaluator_results)).toBe(true);
      expect(mockClient.POST).toHaveBeenCalledWith('/v1/judges/execute/by-name/', {
        params: { query: { name: judgeName } },
        body: executionData,
      });
    });

    it('should handle executeByName errors', async () => {
      const judgeName = 'Non-existent Judge';
      const executionData = TestDataFactory.getTestExecutionInputs();

      mockClient.setMockError('POST', '/v1/judges/execute/by-name/', {
        detail: 'Judge not found',
      });

      await expect(client.judges.executeByName(judgeName, executionData)).rejects.toThrow();
    });
  });

  describe('generate', () => {
    it('should generate judge with string intent', async () => {
      const intent = 'Evaluate code review comments for clarity';
      mockClient.setMockResponse('POST', '/v1/judges/generate/', {
        data: mockResponses.judges.generation,
        error: undefined,
      });

      const result = await client.judges.generate({
        intent,
        extra_contexts: { domain: 'Ecommerce selling clothing' },
        stage: 'response generation',
        overwrite: true,
        name: 'Test Judge',
      });

      expect(result.judge_id).toBeDefined();
      expect(mockClient.POST).toHaveBeenCalledWith('/v1/judges/generate/', {
        body: {
          intent,
          visibility: 'unlisted',
          stage: 'response generation',
          strict: true,
          extra_contexts: { domain: 'Ecommerce selling clothing' },
          overwrite: true,
          name: 'Test Judge',
        },
      });
    });

    it('should generate judge with detailed request', async () => {
      const generateRequest = {
        intent: 'Evaluate responses for helpfulness',
      };

      mockClient.setMockResponse('POST', '/v1/judges/generate/', {
        data: mockResponses.judges.generation,
        error: undefined,
      });

      const result = await client.judges.generate(generateRequest);

      expect(result.judge_id).toBeDefined();
      expect(mockClient.POST).toHaveBeenCalledWith('/v1/judges/generate/', {
        body: {
          intent: 'Evaluate responses for helpfulness',
          visibility: 'unlisted',
          stage: null,
          strict: true,
          extra_contexts: null,
          overwrite: false,
          name: null,
        },
      });
    });
  });

  describe('multi-turn conversations', () => {
    it('should execute judge with multi-turn messages', async () => {
      const judgeId = 'judge-123';
      const multiTurnData = TestDataFactory.getTestMultiTurnExecutionInputs();

      mockClient.setMockResponse('POST', '/v1/judges/{judge_id}/execute/', {
        data: mockResponses.judges.execution,
        error: undefined,
      });

      const result = await client.judges.execute(judgeId, multiTurnData);

      expect(result.evaluator_results).toBeDefined();
      expect(Array.isArray(result.evaluator_results)).toBe(true);
      expect(mockClient.POST).toHaveBeenCalledWith('/v1/judges/{judge_id}/execute/', {
        params: { path: { judge_id: judgeId } },
        body: multiTurnData,
      });
    });

    it('should execute judge by name with multi-turn messages', async () => {
      const judgeName = 'Customer Service Quality';
      const multiTurnData = TestDataFactory.getTestMultiTurnExecutionInputs();

      mockClient.setMockResponse('POST', '/v1/judges/execute/by-name/', {
        data: mockResponses.judges.execution,
        error: undefined,
      });

      const result = await client.judges.executeByName(judgeName, multiTurnData);

      expect(result.evaluator_results).toBeDefined();
      expect(Array.isArray(result.evaluator_results)).toBe(true);
      expect(mockClient.POST).toHaveBeenCalledWith('/v1/judges/execute/by-name/', {
        params: { query: { name: judgeName } },
        body: multiTurnData,
      });
    });

    it('should handle multi-turn messages with contexts and metadata', async () => {
      const judgeId = 'judge-123';
      const executionData = {
        turns: TestDataFactory.getTestMultiTurnMessages(),
        contexts: ['Company policy documents'],
        user_id: 'user-456',
        session_id: 'session-789',
        tags: ['production', 'v1.0'],
      };

      mockClient.setMockResponse('POST', '/v1/judges/{judge_id}/execute/', {
        data: mockResponses.judges.execution,
        error: undefined,
      });

      const result = await client.judges.execute(judgeId, executionData);

      expect(result.evaluator_results).toBeDefined();
      expect(mockClient.POST).toHaveBeenCalledWith('/v1/judges/{judge_id}/execute/', {
        params: { path: { judge_id: judgeId } },
        body: executionData,
      });
    });
  });
});
