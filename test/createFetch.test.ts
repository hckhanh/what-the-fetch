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

  describe('HTTP method prefix', () => {
    it('should extract GET method from @get prefix', async () => {
      const api = {
        '@get/users': {
          response: createMockSchema({ users: [] }),
        },
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: [] }),
      } as Response)

      const apiFetch = createFetch(api, 'https://api.example.com')
      await apiFetch('@get/users')

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'GET',
        }),
      )
    })

    it('should extract POST method from @post prefix', async () => {
      const api = {
        '@post/users': {
          body: createMockSchema({ name: 'John' }),
          response: createMockSchema({ id: 1, name: 'John' }),
        },
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, name: 'John' }),
      } as Response)

      const apiFetch = createFetch(api, 'https://api.example.com')
      await apiFetch('@post/users', { body: { name: 'John' } })

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'John' }),
        }),
      )
    })

    it('should extract PUT method from @put prefix', async () => {
      const api = {
        '@put/users/:id': {
          params: createMockSchema({ id: 123 }),
          body: createMockSchema({ name: 'Jane' }),
          response: createMockSchema({ id: 123, name: 'Jane' }),
        },
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 123, name: 'Jane' }),
      } as Response)

      const apiFetch = createFetch(api, 'https://api.example.com')
      await apiFetch('@put/users/:id', {
        params: { id: 123 },
        body: { name: 'Jane' },
      })

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.example.com/users/123',
        expect.objectContaining({
          method: 'PUT',
        }),
      )
    })

    it('should extract DELETE method from @delete prefix', async () => {
      const api = {
        '@delete/users/:id': {
          params: createMockSchema({ id: 123 }),
          response: createMockSchema({ success: true }),
        },
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)

      const apiFetch = createFetch(api, 'https://api.example.com')
      await apiFetch('@delete/users/:id', { params: { id: 123 } })

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.example.com/users/123',
        expect.objectContaining({
          method: 'DELETE',
        }),
      )
    })

    it('should extract PATCH method from @patch prefix', async () => {
      const api = {
        '@patch/users/:id': {
          params: createMockSchema({ id: 123 }),
          body: createMockSchema({ name: 'Updated' }),
          response: createMockSchema({ id: 123, name: 'Updated' }),
        },
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 123, name: 'Updated' }),
      } as Response)

      const apiFetch = createFetch(api, 'https://api.example.com')
      await apiFetch('@patch/users/:id', {
        params: { id: 123 },
        body: { name: 'Updated' },
      })

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.example.com/users/123',
        expect.objectContaining({
          method: 'PATCH',
        }),
      )
    })

    it('should handle path without method prefix (defaults to GET)', async () => {
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
        expect.objectContaining({
          method: 'GET',
        }),
      )
    })

    it('should handle @get prefix equivalent to no prefix', async () => {
      const api1 = {
        '@get/users': {
          response: createMockSchema({ users: [] }),
        },
      }

      const api2 = {
        '/users': {
          response: createMockSchema({ users: [] }),
        },
      }

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ users: [] }),
      } as Response)

      const apiFetch1 = createFetch(api1, 'https://api.example.com')
      await apiFetch1('@get/users')

      const apiFetch2 = createFetch(api2, 'https://api.example.com')
      await apiFetch2('/users')

      // Both should call the same URL with GET method
      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        'https://api.example.com/users',
        expect.objectContaining({ method: 'GET' }),
      )
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        'https://api.example.com/users',
        expect.objectContaining({ method: 'GET' }),
      )
    })

    it('should work with method prefix and path parameters', async () => {
      const api = {
        '@post/users/:id/posts': {
          params: createMockSchema({ id: 123 }),
          body: createMockSchema({ title: 'New Post' }),
          response: createMockSchema({ postId: 456, title: 'New Post' }),
        },
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ postId: 456, title: 'New Post' }),
      } as Response)

      const apiFetch = createFetch(api, 'https://api.example.com')
      await apiFetch('@post/users/:id/posts', {
        params: { id: 123 },
        body: { title: 'New Post' },
      })

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.example.com/users/123/posts',
        expect.objectContaining({
          method: 'POST',
        }),
      )
    })

    it('should work with method prefix, path parameters, and query parameters', async () => {
      const api = {
        '@get/users/:id/posts': {
          params: createMockSchema({ id: 123 }),
          query: createMockSchema({ limit: 10 }),
          response: createMockSchema({ posts: [] }),
        },
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ posts: [] }),
      } as Response)

      const apiFetch = createFetch(api, 'https://api.example.com')
      await apiFetch('@get/users/:id/posts', {
        params: { id: 123 },
        query: { limit: 10 },
      })

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.example.com/users/123/posts?limit=10',
        expect.objectContaining({
          method: 'GET',
        }),
      )
    })

    it('should handle @method prefix with root path', async () => {
      const api = {
        '@get': {
          response: createMockSchema({ status: 'ok' }),
        },
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok' }),
      } as Response)

      const apiFetch = createFetch(api, 'https://api.example.com')
      await apiFetch('@get')

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.example.com/',
        expect.objectContaining({
          method: 'GET',
        }),
      )
    })

    it('should convert method to uppercase', async () => {
      const api = {
        '@GeT/users': {
          response: createMockSchema({ users: [] }),
        },
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: [] }),
      } as Response)

      const apiFetch = createFetch(api, 'https://api.example.com')
      await apiFetch('@GeT/users')

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'GET',
        }),
      )
    })

    it('should default to POST when body is present without method prefix', async () => {
      const api = {
        '/users': {
          body: createMockSchema({ name: 'John', email: 'john@example.com' }),
          response: createMockSchema({ id: 1, name: 'John' }),
        },
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, name: 'John' }),
      } as Response)

      const apiFetch = createFetch(api, 'https://api.example.com')
      await apiFetch('/users', {
        body: { name: 'John', email: 'john@example.com' },
      })

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'John', email: 'john@example.com' }),
        }),
      )
    })

    it('should default to GET when no body and no method prefix', async () => {
      const api = {
        '/users': {
          query: createMockSchema({ limit: 10 }),
          response: createMockSchema({ users: [] }),
        },
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: [] }),
      } as Response)

      const apiFetch = createFetch(api, 'https://api.example.com')
      await apiFetch('/users', { query: { limit: 10 } })

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.example.com/users?limit=10',
        expect.objectContaining({
          method: 'GET',
        }),
      )
    })
  })
})
