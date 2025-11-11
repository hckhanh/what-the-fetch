import type { StandardSchemaV1 } from '@standard-schema/spec'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFetch } from '../src'

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})

// Helper to create a mock Standard Schema
function createMockSchema<T>(_value: T): StandardSchemaV1<T> {
  return {
    '~standard': {
      version: 1,
      vendor: 'mock',
      validate: async (data: unknown) => ({
        value: data as T,
      }),
    },
  }
}

describe('createFetch', () => {
  it('should make a basic GET request', async () => {
    const api = {
      '/users': {
        response: createMockSchema({ users: [] }),
      },
    }

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ users: [] }),
    } as Response)

    const apiFetch = createFetch(api, 'https://api.example.com')
    const result = await apiFetch('/users')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/users',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    )
    expect(result).toEqual({ users: [] })
  })

  it('should substitute path parameters', async () => {
    const api = {
      '/users/:id': {
        params: createMockSchema({ id: 123 }),
        response: createMockSchema({ id: 123, name: 'John' }),
      },
    }

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 123, name: 'John' }),
    } as Response)

    const apiFetch = createFetch(api, 'https://api.example.com')
    const result = await apiFetch('/users/:id', {
      params: { id: 123 },
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/users/123',
      expect.any(Object),
    )
    expect(result).toEqual({ id: 123, name: 'John' })
  })

  it('should add query parameters', async () => {
    const api = {
      '/users': {
        query: createMockSchema({ limit: 10, offset: 0 }),
        response: createMockSchema({ users: [] }),
      },
    }

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ users: [] }),
    } as Response)

    const apiFetch = createFetch(api, 'https://api.example.com')
    await apiFetch('/users', {
      query: { limit: 10, offset: 0 },
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/users?limit=10&offset=0',
      expect.any(Object),
    )
  })

  it('should combine path and query parameters', async () => {
    const api = {
      '/users/:id/posts': {
        params: createMockSchema({ id: 123 }),
        query: createMockSchema({ limit: 5 }),
        response: createMockSchema({ posts: [] }),
      },
    }

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ posts: [] }),
    } as Response)

    const apiFetch = createFetch(api, 'https://api.example.com')
    await apiFetch('/users/:id/posts', {
      params: { id: 123 },
      query: { limit: 5 },
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/users/123/posts?limit=5',
      expect.any(Object),
    )
  })

  it('should make a POST request with body', async () => {
    const api = {
      '/users': {
        body: createMockSchema({ name: 'John', email: 'john@example.com' }),
        response: createMockSchema({
          id: 1,
          name: 'John',
          email: 'john@example.com',
        }),
      },
    }

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1, name: 'John', email: 'john@example.com' }),
    } as Response)

    const apiFetch = createFetch(api, 'https://api.example.com')
    const result = await apiFetch('/users', {
      body: { name: 'John', email: 'john@example.com' },
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/users',
      expect.objectContaining({
        body: JSON.stringify({ name: 'John', email: 'john@example.com' }),
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    )
    expect(result).toEqual({ id: 1, name: 'John', email: 'john@example.com' })
  })

  it('should merge custom headers with default headers', async () => {
    const api = {
      '/users': {
        response: createMockSchema({ users: [] }),
      },
    }

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ users: [] }),
    } as Response)

    const apiFetch = createFetch(api, 'https://api.example.com')
    await apiFetch('/users', undefined, {
      headers: {
        Authorization: 'Bearer token',
        'X-Custom': 'value',
      },
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/users',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer token',
          'X-Custom': 'value',
        }),
      }),
    )
  })

  it('should throw error on non-ok response', async () => {
    const api = {
      '/users': {
        response: createMockSchema({ users: [] }),
      },
    }

    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response)

    const apiFetch = createFetch(api, 'https://api.example.com')

    await expect(apiFetch('/users')).rejects.toThrow('HTTP error! status: 404')
  })

  it('should validate response with schema', async () => {
    const validationError = { issues: [{ message: 'Invalid data' }] }
    const api = {
      '/users': {
        response: {
          '~standard': {
            version: 1,
            vendor: 'mock',
            validate: async () => validationError,
          },
        } as StandardSchemaV1<Record<string, unknown>>,
      },
    }

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ invalid: 'data' }),
    } as Response)

    const apiFetch = createFetch(api, 'https://api.example.com')

    await expect(apiFetch('/users')).rejects.toThrow('Validation failed')
  })

  it('should return unvalidated data if no response schema', async () => {
    const api = {
      '/users': {},
    }

    const responseData = { users: [{ id: 1, name: 'John' }] }
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => responseData,
    } as Response)

    const apiFetch = createFetch(api, 'https://api.example.com')
    const result = await apiFetch('/users', {})

    expect(result).toEqual(responseData)
  })

  it('should handle empty params and query', async () => {
    const api = {
      '/users': {
        response: createMockSchema({ users: [] }),
      },
    }

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ users: [] }),
    } as Response)

    const apiFetch = createFetch(api, 'https://api.example.com')
    await apiFetch('/users')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/users',
      expect.any(Object),
    )
  })

  it('should support shared init configuration', async () => {
    const api = {
      '/users': {
        response: createMockSchema({ users: [] }),
      },
    }

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ users: [] }),
    } as Response)

    const apiFetch = createFetch(api, 'https://api.example.com', {
      headers: {
        Authorization: 'Bearer shared-token',
        'X-Shared-Header': 'shared-value',
      },
    })

    await apiFetch('/users')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/users',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer shared-token',
          'X-Shared-Header': 'shared-value',
        }),
      }),
    )
  })

  it('should merge shared init with per-request init', async () => {
    const api = {
      '/users': {
        response: createMockSchema({ users: [] }),
      },
    }

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ users: [] }),
    } as Response)

    const apiFetch = createFetch(api, 'https://api.example.com', {
      headers: {
        Authorization: 'Bearer shared-token',
        'X-Shared-Header': 'shared-value',
      },
    })

    await apiFetch('/users', undefined, {
      headers: {
        'X-Custom-Header': 'custom-value',
      },
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/users',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer shared-token',
          'X-Shared-Header': 'shared-value',
          'X-Custom-Header': 'custom-value',
        }),
      }),
    )
  })

  it('should allow options parameter to be omitted', async () => {
    const api = {
      '/users': {
        response: createMockSchema({ users: [] }),
      },
    }

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ users: [] }),
    } as Response)

    const apiFetch = createFetch(api, 'https://api.example.com')
    const result = await apiFetch('/users')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/users',
      expect.any(Object),
    )
    expect(result).toEqual({ users: [] })
  })

  it('should throw error when parameterized path lacks params schema', async () => {
    const api = {
      '/users/:id': {
        response: createMockSchema({ id: 123, name: 'John' }),
      },
    }

    const apiFetch = createFetch(api, 'https://api.example.com')

    await expect(
      // biome-ignore lint/suspicious/noExplicitAny: Testing error case with invalid options
      apiFetch('/users/:id', { params: { id: 123 } } as any),
    ).rejects.toThrow(
      'Path contains parameters but no "params" schema is defined.',
    )
  })

  it('should validate params with schema validation', async () => {
    const validationError = { issues: [{ message: 'Invalid params' }] }
    const api = {
      '/users/:id': {
        params: {
          '~standard': {
            version: 1,
            vendor: 'mock',
            validate: async () => validationError,
          },
        } as StandardSchemaV1<Record<string, unknown>>,
        response: createMockSchema({ id: 123, name: 'John' }),
      },
    }

    const apiFetch = createFetch(api, 'https://api.example.com')

    await expect(
      apiFetch('/users/:id', { params: { id: 'invalid' } }),
    ).rejects.toThrow('Validation failed')
  })

  it('should validate query parameters with schema validation', async () => {
    const validationError = { issues: [{ message: 'Invalid query' }] }
    const api = {
      '/users': {
        query: {
          '~standard': {
            version: 1,
            vendor: 'mock',
            validate: async () => validationError,
          },
        } as StandardSchemaV1<Record<string, unknown>>,
        response: createMockSchema({ users: [] }),
      },
    }

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ users: [] }),
    } as Response)

    const apiFetch = createFetch(api, 'https://api.example.com')

    await expect(
      apiFetch('/users', { query: { invalid: true } }),
    ).rejects.toThrow('Validation failed')
  })

  it('should validate body with schema validation', async () => {
    const validationError = { issues: [{ message: 'Invalid body' }] }
    const api = {
      '/users': {
        body: {
          '~standard': {
            version: 1,
            vendor: 'mock',
            validate: async () => validationError,
          },
        } as StandardSchemaV1<Record<string, unknown>>,
        response: createMockSchema({ id: 1 }),
      },
    }

    const apiFetch = createFetch(api, 'https://api.example.com')

    await expect(
      apiFetch('/users', { body: { invalid: true } }),
    ).rejects.toThrow('Validation failed')
  })

  it('should not send body when body is undefined', async () => {
    const api = {
      '/users': {
        query: createMockSchema({ search: 'test' }),
        response: createMockSchema({ users: [] }),
      },
    }

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ users: [] }),
    } as Response)

    const apiFetch = createFetch(api, 'https://api.example.com')
    await apiFetch('/users', { query: { search: 'test' } })

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.not.objectContaining({
        body: expect.anything(),
      }),
    )
  })

  it('should not send body when body is null', async () => {
    const api = {
      '/users': {
        response: createMockSchema({ users: [] }),
      },
    }

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ users: [] }),
    } as Response)

    const apiFetch = createFetch(api, 'https://api.example.com')
    await apiFetch('/users')

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.not.objectContaining({
        body: expect.anything(),
      }),
    )
  })

  it('should validate all request data concurrently', async () => {
    const callOrder: string[] = []

    const api = {
      '/users/:id/posts': {
        params: {
          '~standard': {
            version: 1,
            vendor: 'mock',
            validate: async (data: unknown) => {
              callOrder.push('params')
              return { value: data }
            },
          },
        } as StandardSchemaV1<Record<string, unknown>>,
        query: {
          '~standard': {
            version: 1,
            vendor: 'mock',
            validate: async (data: unknown) => {
              callOrder.push('query')
              return { value: data }
            },
          },
        } as StandardSchemaV1<Record<string, unknown>>,
        body: {
          '~standard': {
            version: 1,
            vendor: 'mock',
            validate: async (data: unknown) => {
              callOrder.push('body')
              return { value: data }
            },
          },
        } as StandardSchemaV1<Record<string, unknown>>,
        response: createMockSchema({ success: true }),
      },
    }

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response)

    const apiFetch = createFetch(api, 'https://api.example.com')
    await apiFetch('/users/:id/posts', {
      params: { id: 123 },
      query: { limit: 10 },
      body: { title: 'Test' },
    })

    // All three should be called (order may vary due to concurrent execution)
    expect(callOrder).toContain('params')
    expect(callOrder).toContain('query')
    expect(callOrder).toContain('body')
    expect(callOrder).toHaveLength(3)
  })
})
