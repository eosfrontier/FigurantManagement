import { describe, expect, it, vi } from 'vitest'
import { ApiError } from './errors.js'
import { createJsonClient } from './http.js'

function response({ status = 200, body = null } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: vi.fn().mockResolvedValue(body === null ? '' : JSON.stringify(body)),
  }
}

describe('createJsonClient', () => {
  it('builds a read-only request without undefined headers', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response({ body: [] }))
    const client = createJsonClient({
      baseUrl: '/dev-api/orthanc/',
      service: 'orthanc',
      fetchImpl,
    })

    await client.get('/joomla/users/', {
      operation: 'getUsers',
      headers: { group_id: '12', current_event: undefined },
    })

    expect(fetchImpl).toHaveBeenCalledWith(
      '/dev-api/orthanc/joomla/users/',
      expect.objectContaining({
        method: 'GET',
        redirect: 'manual',
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
          group_id: '12',
        },
      }),
    )
  })

  it('returns an explicit fallback for a 404 response', async () => {
    const client = createJsonClient({
      baseUrl: '/api',
      service: 'test',
      fetchImpl: vi.fn().mockResolvedValue(response({ status: 404 })),
    })

    await expect(
      client.get('items', { operation: 'getItems', notFoundValue: [] }),
    ).resolves.toEqual([])
  })

  it('sends mutation requests through the same error-handling boundary', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response({ body: 1 }))
    const client = createJsonClient({
      baseUrl: '/api',
      service: 'test',
      fetchImpl,
    })

    await expect(
      client.put('items', {
        operation: 'updateItem',
        headers: { id: '42', payload: '{"value":"new"}' },
      }),
    ).resolves.toBe(1)
    expect(fetchImpl).toHaveBeenCalledWith(
      '/api/items',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          id: '42',
          payload: '{"value":"new"}',
        }),
      }),
    )
  })

  it('wraps server failures as retryable API errors', async () => {
    const client = createJsonClient({
      baseUrl: '/api',
      service: 'test',
      fetchImpl: vi.fn().mockResolvedValue(
        response({ status: 503, body: { error: 'unavailable' } }),
      ),
    })

    await expect(client.get('items', { operation: 'getItems' })).rejects.toMatchObject({
      name: 'ApiError',
      status: 503,
      retryable: true,
    })
  })

  it('wraps network failures without leaking the original message', async () => {
    const client = createJsonClient({
      baseUrl: '/api',
      service: 'test',
      fetchImpl: vi.fn().mockRejectedValue(new Error('secret upstream detail')),
    })

    await expect(client.get('items', { operation: 'getItems' })).rejects.toBeInstanceOf(
      ApiError,
    )
  })
})
