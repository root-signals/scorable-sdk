import { TestUtils } from '../helpers/test-utils';
import { mockClient } from '../helpers/mock-client';

const projectFixture = {
  id: 'proj-11111111-1111-1111-1111-111111111111',
  name: 'Production',
  description: 'Production project',
  is_default: true,
  created_at: '2026-06-01T00:00:00Z',
  owner: 'owner-22222222-2222-2222-2222-222222222222',
};

const otherProjectFixture = {
  id: 'proj-33333333-3333-3333-3333-333333333333',
  name: 'Staging',
  description: '',
  is_default: false,
  created_at: '2026-06-02T00:00:00Z',
  owner: 'owner-22222222-2222-2222-2222-222222222222',
};

describe('ProjectsResource', () => {
  let client: any;

  beforeEach(() => {
    client = TestUtils.createMockClient();
    mockClient.reset();
  });

  describe('list', () => {
    it('returns the org projects', async () => {
      mockClient.setMockResponse('GET', '/v1/projects/', {
        data: { results: [projectFixture, otherProjectFixture], next: null, previous: null },
        error: undefined,
      });

      const result = await client.projects.list();

      expect(result.results).toHaveLength(2);
      expect(result.results[0].name).toBe('Production');
      expect(result.results[0].is_default).toBe(true);
      expect(mockClient.GET).toHaveBeenCalledWith('/v1/projects/', {
        params: { query: {} },
      });
    });
  });

  describe('retrieve', () => {
    it('returns a single project', async () => {
      mockClient.setMockResponse('GET', '/v1/projects/{id}/', {
        data: projectFixture,
        error: undefined,
      });

      const result = await client.projects.retrieve(projectFixture.id);

      expect(result.id).toBe(projectFixture.id);
      expect(mockClient.GET).toHaveBeenCalledWith('/v1/projects/{id}/', {
        params: { path: { id: projectFixture.id } },
      });
    });
  });

  describe('create', () => {
    it('returns the created project', async () => {
      mockClient.setMockResponse('POST', '/v1/projects/', {
        data: projectFixture,
        error: undefined,
      });

      const result = await client.projects.create({
        name: 'Production',
        description: 'Production project',
        is_default: true,
      });

      expect(result.id).toBe(projectFixture.id);
      expect(mockClient.POST).toHaveBeenCalledWith('/v1/projects/', {
        body: { name: 'Production', description: 'Production project', is_default: true },
      });
    });
  });

  describe('update', () => {
    it('patches name and description', async () => {
      mockClient.setMockResponse('PATCH', '/v1/projects/{id}/', {
        data: { ...projectFixture, name: 'Renamed' },
        error: undefined,
      });

      const result = await client.projects.update(projectFixture.id, {
        name: 'Renamed',
      });

      expect(result.name).toBe('Renamed');
      expect(mockClient.PATCH).toHaveBeenCalledWith('/v1/projects/{id}/', {
        params: { path: { id: projectFixture.id } },
        body: { name: 'Renamed' },
      });
    });

    it('promotes a project to default with is_default: true', async () => {
      mockClient.setMockResponse('PATCH', '/v1/projects/{id}/', {
        data: { ...otherProjectFixture, is_default: true },
        error: undefined,
      });

      const result = await client.projects.update(otherProjectFixture.id, {
        is_default: true,
      });

      expect(result.is_default).toBe(true);
      expect(mockClient.PATCH).toHaveBeenCalledWith('/v1/projects/{id}/', {
        params: { path: { id: otherProjectFixture.id } },
        body: { is_default: true },
      });
    });

    it('surfaces backend rejection when clearing default', async () => {
      mockClient.PATCH.mockResolvedValueOnce({
        data: undefined,
        error: {
          status: 422,
          detail: 'Cannot clear default project; promote another project instead.',
        },
      });

      await expect(
        client.projects.update(projectFixture.id, { is_default: false }),
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('deletes a project', async () => {
      mockClient.setMockResponse('DELETE', '/v1/projects/{id}/', {
        data: undefined,
        error: undefined,
      });

      await client.projects.delete(projectFixture.id);

      expect(mockClient.DELETE).toHaveBeenCalledWith('/v1/projects/{id}/', {
        params: { path: { id: projectFixture.id } },
      });
    });
  });
});
