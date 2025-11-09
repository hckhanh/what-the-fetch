import type { StandardSchemaV1 } from '@standard-schema/spec'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFetch } from '../src'

// Mock fetch globally
let fetchMock: ReturnType<typeof vi.fn>
const originalFetch = global.fetch

beforeEach(() => {
  fetchMock = vi.fn()
  // biome-ignore lint/suspicious/noExplicitAny: Need to mock global fetch
  global.fetch = fetchMock as any
})

afterEach(() => {
  global.fetch = originalFetch
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
})
