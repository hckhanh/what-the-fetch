import type { StandardSchemaV1 } from '@standard-schema/spec'
import { beforeEach, test, vi } from 'vitest'
import { createFetch } from '../src'

beforeEach(() =>
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1, name: 'Test' }),
    }),
  ),
)

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

test('createFetch benchmarks', { timeout: 120_000 }, async ({ bench }) => {
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

  await bench('GET request with params and query', async () => {
    await apiFetch('/users/:id', {
      params: { id: 123 },
      query: { fields: 'name,email' },
    })
  }).run()

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

  await bench('POST request with body', async () => {
    await apiFetchPost('/users', {
      body: { name: 'John', email: 'john@example.com' },
    })
  }).run()

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

  await bench('GET request with shared init', async () => {
    await apiFetchWithShared('/users/:id', {
      params: { id: 123 },
    })
  }).run()

  await bench('GET request without options', async () => {
    const apiSimple = {
      '/users': {
        response: createMockSchema({ users: [] }),
      },
    }
    const apiFetchSimple = createFetch(apiSimple, 'https://api.example.com')
    await apiFetchSimple('/users')
  }).run()
})

test('HTTP method prefix benchmarks', { timeout: 120_000 }, async ({
  bench,
}) => {
  await bench('GET request with @get prefix', async () => {
    const api = {
      '@get/users': {
        response: createMockSchema({ users: [] }),
      },
    }
    const apiFetch = createFetch(api, 'https://api.example.com')
    await apiFetch('@get/users')
  }).run()

  await bench('GET request without prefix (default)', async () => {
    const api = {
      '/users': {
        response: createMockSchema({ users: [] }),
      },
    }
    const apiFetch = createFetch(api, 'https://api.example.com')
    await apiFetch('/users')
  }).run()

  await bench('POST request with @post prefix', async () => {
    const api = {
      '@post/users': {
        body: createMockSchema({ name: 'John', email: 'john@example.com' }),
        response: createMockSchema({ id: 1, name: 'John' }),
      },
    }
    const apiFetch = createFetch(api, 'https://api.example.com')
    await apiFetch('@post/users', {
      body: { name: 'John', email: 'john@example.com' },
    })
  }).run()

  await bench(
    'POST request without prefix (smart default with body)',
    async () => {
      const api = {
        '/users': {
          body: createMockSchema({ name: 'John', email: 'john@example.com' }),
          response: createMockSchema({ id: 1, name: 'John' }),
        },
      }
      const apiFetch = createFetch(api, 'https://api.example.com')
      await apiFetch('/users', {
        body: { name: 'John', email: 'john@example.com' },
      })
    },
  ).run()

  await bench('PUT request with @put prefix and params', async () => {
    const api = {
      '@put/users/:id': {
        params: createMockSchema({ id: 123 }),
        body: createMockSchema({ name: 'Jane' }),
        response: createMockSchema({ id: 123, name: 'Jane' }),
      },
    }
    const apiFetch = createFetch(api, 'https://api.example.com')
    await apiFetch('@put/users/:id', {
      params: { id: 123 },
      body: { name: 'Jane' },
    })
  }).run()

  await bench('DELETE request with @delete prefix', async () => {
    const api = {
      '@delete/users/:id': {
        params: createMockSchema({ id: 123 }),
        response: createMockSchema({ success: true }),
      },
    }
    const apiFetch = createFetch(api, 'https://api.example.com')
    await apiFetch('@delete/users/:id', {
      params: { id: 123 },
    })
  }).run()

  await bench('PATCH request with @patch prefix', async () => {
    const api = {
      '@patch/users/:id': {
        params: createMockSchema({ id: 123 }),
        body: createMockSchema({ name: 'Updated' }),
        response: createMockSchema({ id: 123, name: 'Updated' }),
      },
    }
    const apiFetch = createFetch(api, 'https://api.example.com')
    await apiFetch('@patch/users/:id', {
      params: { id: 123 },
      body: { name: 'Updated' },
    })
  }).run()

  await bench('Mixed: prefix with path params and query', async () => {
    const api = {
      '@get/users/:id/posts': {
        params: createMockSchema({ id: 123 }),
        query: createMockSchema({ limit: 10, offset: 0 }),
        response: createMockSchema({ posts: [] }),
      },
    }
    const apiFetch = createFetch(api, 'https://api.example.com')
    await apiFetch('@get/users/:id/posts', {
      params: { id: 123 },
      query: { limit: 10, offset: 0 },
    })
  }).run()
})
