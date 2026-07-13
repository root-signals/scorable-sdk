import { TestUtils } from '../helpers/test-utils';
import { mockClient } from '../helpers/mock-client';

const itemFixture = {
  id: 'di-1',
  external_id: 'ext-1',
  version_id: 'v-1',
  is_latest_version: true,
  response: 'A.',
  request: '',
  expected_output: '',
  contexts: [],
  variables: {},
  metadata: {},
  change_note: '',
  is_archived: false,
  annotations: [],
  created_at: '2026-07-01T00:00:00Z',
};

describe('DatasetsResource item methods', () => {
  let client: any;

  beforeEach(() => {
    client = TestUtils.createMockClient();
    mockClient.reset();
  });

  it('adds a single item', async () => {
    mockClient.setMockResponse('POST', '/v1/datasets/{dataset_id}/items/', {
      data: itemFixture,
      error: undefined,
    });

    const result = await client.datasets.addItem('ds-1', {
      response: 'A.',
      metadata: { src: 'manual' },
    });

    expect(result.id).toBe('di-1');
    expect(mockClient.POST).toHaveBeenCalledWith('/v1/datasets/{dataset_id}/items/', {
      params: { path: { dataset_id: 'ds-1' } },
      body: { response: 'A.', metadata: { src: 'manual' } },
    });
  });

  it('bulk adds items', async () => {
    mockClient.setMockResponse('POST', '/v1/datasets/{dataset_id}/items/bulk/', {
      data: [itemFixture, { ...itemFixture, id: 'di-2' }],
      error: undefined,
    });

    const result = await client.datasets.addItems('ds-1', [{ response: 'r0' }, { response: 'r1' }]);

    expect(result).toHaveLength(2);
    expect(mockClient.POST).toHaveBeenCalledWith('/v1/datasets/{dataset_id}/items/bulk/', {
      params: { path: { dataset_id: 'ds-1' } },
      body: [{ response: 'r0' }, { response: 'r1' }],
    });
  });

  it('lists items excluding archived by default', async () => {
    mockClient.setMockResponse('GET', '/v1/datasets/{dataset_id}/items/', {
      data: { results: [itemFixture], next: null, previous: null },
      error: undefined,
    });

    await client.datasets.listItems('ds-1');

    expect(mockClient.GET).toHaveBeenCalledWith('/v1/datasets/{dataset_id}/items/', {
      params: { path: { dataset_id: 'ds-1' }, query: {} },
    });
  });

  it('includes archived items when requested', async () => {
    mockClient.setMockResponse('GET', '/v1/datasets/{dataset_id}/items/', {
      data: { results: [], next: null, previous: null },
      error: undefined,
    });

    await client.datasets.listItems('ds-1', { includeArchived: true });

    expect(mockClient.GET).toHaveBeenCalledWith('/v1/datasets/{dataset_id}/items/', {
      params: { path: { dataset_id: 'ds-1' }, query: { is_archived: true } },
    });
  });

  it('updates an item', async () => {
    mockClient.setMockResponse('PATCH', '/v1/datasets/{dataset_id}/items/{item_id}/', {
      data: { ...itemFixture, response: 'edited' },
      error: undefined,
    });

    await client.datasets.updateItem('ds-1', 'di-1', { response: 'edited', change_note: 'fix' });

    expect(mockClient.PATCH).toHaveBeenCalledWith('/v1/datasets/{dataset_id}/items/{item_id}/', {
      params: { path: { dataset_id: 'ds-1', item_id: 'di-1' } },
      body: { response: 'edited', change_note: 'fix' },
    });
  });

  it('archives an item', async () => {
    mockClient.setMockResponse('DELETE', '/v1/datasets/{dataset_id}/items/{item_id}/', {
      data: undefined,
      error: undefined,
    });

    await client.datasets.archiveItem('ds-1', 'di-1');

    expect(mockClient.DELETE).toHaveBeenCalledWith('/v1/datasets/{dataset_id}/items/{item_id}/', {
      params: { path: { dataset_id: 'ds-1', item_id: 'di-1' } },
    });
  });
});
