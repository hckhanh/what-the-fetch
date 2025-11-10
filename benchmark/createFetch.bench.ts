import type { StandardSchemaV1 } from '@standard-schema/spec'
import { afterEach, beforeEach, bench, describe, vi } from 'vitest'
import { createFetch } from '../src/index'

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

describe('createFetch benchmarks', () => {
  beforeEach(() => {
    // Mock fetch for benchmarking
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 1, name: 'Test' }),
      } as Response),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const api = {
    '/users/:id': {
      params: createMockSchema({ id: 123 }),
      query: createMockSchema({ fields: 'name,email' }),
      response: createMockSchema({
        id: 123,
        name: 'John',
        email: 'john@example.com',
      }),
    },
  }

  const apiFetch = createFetch(api, 'https://api.example.com')

  bench('GET request with params and query', async () => {
    await apiFetch('/users/:id', {
      params: { id: 123 },
      query: { fields: 'name,email' },
    })
  })

  const apiPost = {
    '/users': {
      body: createMockSchema({ name: 'John', email: 'john@example.com' }),
      response: createMockSchema({
        id: 1,
        name: 'John',
        email: 'john@example.com',
      }),
    },
  }

  const apiFetchPost = createFetch(apiPost, 'https://api.example.com')

  bench('POST request with body', async () => {
    await apiFetchPost('/users', {
      body: { name: 'John', email: 'john@example.com' },
    })
  })

  const apiWithShared = {
    '/users/:id': {
      params: createMockSchema({ id: 123 }),
      response: createMockSchema({ id: 123, name: 'John' }),
    },
  }

  const apiFetchWithShared = createFetch(
    apiWithShared,
    'https://api.example.com',
    {
      headers: { Authorization: 'Bearer token' },
    },
  )

  bench('GET request with shared init', async () => {
    await apiFetchWithShared('/users/:id', {
      params: { id: 123 },
    })
  })

  bench('GET request without options', async () => {
    const apiSimple = {
      '/users': {
        response: createMockSchema({ users: [] }),
      },
    }
    const apiFetchSimple = createFetch(apiSimple, 'https://api.example.com')
    await apiFetchSimple('/users')
  })
})
