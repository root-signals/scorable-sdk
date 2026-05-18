import { TestUtils } from '../helpers/test-utils';
import { mockClient } from '../helpers/mock-client';

describe('ModelsResource', () => {
  let client: any;

  beforeEach(() => {
    client = TestUtils.createMockClient();
    mockClient.reset();
  });

  describe('list', () => {
    it('should list models with no params', async () => {
      mockClient.setMockResponse('GET', '/v1/models/', {
        data: {
          results: [
            {
              id: 'model-123',
              name: 'gpt-4-turbo',
              owner: { id: 'user-1', first_name: 'A', last_name: 'B' },
              provider: { id: 'p-1', name: 'OpenAI' },
              visibility: 'PRIVATE',
            },
          ],
          next: null,
          previous: null,
        },
        error: undefined,
      });

      const result = await client.models.list();

      expect(result.results).toHaveLength(1);
      expect(result.results[0].name).toBe('gpt-4-turbo');
      expect(mockClient.GET).toHaveBeenCalledWith('/v1/models/', {
        params: { query: {} },
      });
    });

    it('should forward pagination and ordering params', async () => {
      await client.models.list({ page_size: 25, cursor: 'next-token', ordering: 'name' });

      expect(mockClient.GET).toHaveBeenCalledWith('/v1/models/', {
        params: { query: { page_size: 25, cursor: 'next-token', ordering: 'name' } },
      });
    });
  });

  describe('get', () => {
    it('should fetch a model by id', async () => {
      const modelId = 'model-123';
      mockClient.setMockResponse('GET', '/v1/models/{id}/', {
        data: {
          id: modelId,
          name: 'gpt-4-turbo',
          model: 'gpt-4-turbo',
          max_token_count: 8000,
          max_output_token_count: 4000,
        },
        error: undefined,
      });

      const result = await client.models.get(modelId);

      expect(result.id).toBe(modelId);
      expect(mockClient.GET).toHaveBeenCalledWith('/v1/models/{id}/', {
        params: { path: { id: modelId } },
      });
    });
  });

  describe('create', () => {
    it('should create a model', async () => {
      const body = {
        name: 'my-custom-gpt',
        model: 'gpt-4-turbo',
        default_key: 'sk-test',
      };
      mockClient.setMockResponse('POST', '/v1/models/', {
        data: { id: 'new-1', ...body },
        error: undefined,
      });

      const result = await client.models.create(body);

      expect(result.id).toBe('new-1');
      expect(mockClient.POST).toHaveBeenCalledWith('/v1/models/', { body });
    });

    it('should throw on error', async () => {
      mockClient.setMockError('POST', '/v1/models/', {
        detail: 'Already exists',
      });

      await expect(client.models.create({ name: 'dupe' })).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should PUT to /v1/models/{id}/', async () => {
      const id = 'model-123';
      const body = { name: 'renamed' };
      mockClient.setMockResponse('PUT', '/v1/models/{id}/', {
        data: { id, ...body },
        error: undefined,
      });

      await client.models.update(id, body);

      expect(mockClient.PUT).toHaveBeenCalledWith('/v1/models/{id}/', {
        params: { path: { id } },
        body,
      });
    });
  });

  describe('patch', () => {
    it('should PATCH to /v1/models/{id}/', async () => {
      const id = 'model-123';
      const body = { name: 'partial' };
      mockClient.setMockResponse('PATCH', '/v1/models/{id}/', {
        data: { id, ...body },
        error: undefined,
      });

      await client.models.patch(id, body);

      expect(mockClient.PATCH).toHaveBeenCalledWith('/v1/models/{id}/', {
        params: { path: { id } },
        body,
      });
    });
  });

  describe('delete', () => {
    it('should DELETE /v1/models/{id}/', async () => {
      const id = 'model-123';
      mockClient.setMockResponse('DELETE', '/v1/models/{id}/', {
        data: undefined,
        error: undefined,
      });

      await client.models.delete(id);

      expect(mockClient.DELETE).toHaveBeenCalledWith('/v1/models/{id}/', {
        params: { path: { id } },
      });
    });
  });

  describe('verify', () => {
    it('should POST to /v1/models/verify/ and return the test response', async () => {
      const body = {
        model: 'gpt-4-turbo',
        api_key: 'sk-test',
        url: 'https://example.com',
        max_output_token_count: 100,
      };
      mockClient.setMockResponse('POST', '/v1/models/verify/', {
        data: { success: true, model: body.model, response: 'pong' },
        error: undefined,
      });

      const result = await client.models.verify(body);

      expect(result.success).toBe(true);
      expect(result.response).toBe('pong');
      expect(mockClient.POST).toHaveBeenCalledWith('/v1/models/verify/', { body });
    });

    it('should throw on error', async () => {
      mockClient.setMockError('POST', '/v1/models/verify/', {
        detail: 'Bad key',
      });

      await expect(client.models.verify({ model: 'gpt-4-turbo' })).rejects.toThrow();
    });
  });
});
