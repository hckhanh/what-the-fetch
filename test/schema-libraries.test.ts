import { type } from 'arktype'
import * as v from 'valibot'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { createFetch } from '../src'

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})

describe('Schema Libraries Integration', () => {
  describe('Zod', () => {
    it('should validate response with zod schema', async () => {
      const api = {
        '/users': {
          response: z.object({
            users: z.array(
              z.object({
                id: z.number(),
                name: z.string(),
              }),
            ),
          }),
        },
      }

      const responseData = {
        users: [
          { id: 1, name: 'John' },
          { id: 2, name: 'Jane' },
        ],
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => responseData,
      } as Response)

      const apiFetch = createFetch(api, 'https://api.example.com')
      const result = await apiFetch('/users')

      expect(result).toEqual(responseData)
    })

    it('should transform response data with zod', async () => {
      const api = {
        '/users': {
          response: z
            .object({
              id: z.number(),
              first_name: z.string(),
              last_name: z.string(),
              created_at: z.string(),
            })
            .transform((data) => ({
              id: data.id,
              fullName: `${data.first_name} ${data.last_name}`,
              createdAt: new Date(data.created_at),
            })),
        },
      }

      const responseData = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        created_at: '2024-01-01T00:00:00Z',
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => responseData,
      } as Response)

      const apiFetch = createFetch(api, 'https://api.example.com')
      const result = await apiFetch('/users')

      expect(result).toEqual({
        id: 1,
        fullName: 'John Doe',
        createdAt: new Date('2024-01-01T00:00:00Z'),
      })
    })

    it('should transform with zod coerce', async () => {
      const api = {
        '/config': {
          response: z.object({
            port: z.coerce.number(),
            enabled: z.coerce.boolean(),
          }),
        },
      }

      const responseData = {
        port: '8080',
        enabled: 'true',
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => responseData,
      } as Response)

      const apiFetch = createFetch(api, 'https://api.example.com')
      const result = await apiFetch('/config')

      expect(result).toEqual({
        port: 8080,
        enabled: true,
      })
    })

    it('should throw validation error for invalid zod schema', async () => {
      const api = {
        '/users': {
          response: z.object({
            id: z.number(),
            name: z.string(),
          }),
        },
      }

      const responseData = {
        id: 'not-a-number',
        name: 'John',
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => responseData,
      } as Response)

      const apiFetch = createFetch(api, 'https://api.example.com')

      await expect(apiFetch('/users')).rejects.toThrow('Validation failed')
    })

    it('should handle zod default values', async () => {
      const api = {
        '/users': {
          response: z.object({
            id: z.number(),
            name: z.string(),
            role: z.string().default('user'),
          }),
        },
      }

      const responseData = {
        id: 1,
        name: 'John',
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => responseData,
      } as Response)

      const apiFetch = createFetch(api, 'https://api.example.com')
      const result = await apiFetch('/users')

      expect(result).toEqual({
        id: 1,
        name: 'John',
        role: 'user',
      })
    })

    it('should validate request params with zod', async () => {
      const api = {
        '/users/:id': {
          params: z.object({
            id: z.number(),
          }),
          response: z.object({
            id: z.number(),
            name: z.string(),
          }),
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
  })

  describe('Valibot', () => {
    it('should validate response with valibot schema', async () => {
      const api = {
        '/users': {
          response: v.object({
            users: v.array(
              v.object({
                id: v.number(),
                name: v.string(),
              }),
            ),
          }),
        },
      }

      const responseData = {
        users: [
          { id: 1, name: 'John' },
          { id: 2, name: 'Jane' },
        ],
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => responseData,
      } as Response)

      const apiFetch = createFetch(api, 'https://api.example.com')
      const result = await apiFetch('/users')

      expect(result).toEqual(responseData)
    })

    it('should transform response data with valibot', async () => {
      const api = {
        '/users': {
          response: v.pipe(
            v.object({
              id: v.number(),
              first_name: v.string(),
              last_name: v.string(),
              created_at: v.string(),
            }),
            v.transform((data) => ({
              id: data.id,
              fullName: `${data.first_name} ${data.last_name}`,
              createdAt: new Date(data.created_at),
            })),
          ),
        },
      }

      const responseData = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        created_at: '2024-01-01T00:00:00Z',
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => responseData,
      } as Response)

      const apiFetch = createFetch(api, 'https://api.example.com')
      const result = await apiFetch('/users')

      expect(result).toEqual({
        id: 1,
        fullName: 'John Doe',
        createdAt: new Date('2024-01-01T00:00:00Z'),
      })
    })

    it('should handle valibot default values', async () => {
      const api = {
        '/users': {
          response: v.object({
            id: v.number(),
            name: v.string(),
            role: v.optional(v.string(), 'user'),
          }),
        },
      }

      const responseData = {
        id: 1,
        name: 'John',
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => responseData,
      } as Response)

      const apiFetch = createFetch(api, 'https://api.example.com')
      const result = await apiFetch('/users')

      expect(result).toEqual({
        id: 1,
        name: 'John',
        role: 'user',
      })
    })

    it('should throw validation error for invalid valibot schema', async () => {
      const api = {
        '/users': {
          response: v.object({
            id: v.number(),
            name: v.string(),
          }),
        },
      }

      const responseData = {
        id: 'not-a-number',
        name: 'John',
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => responseData,
      } as Response)

      const apiFetch = createFetch(api, 'https://api.example.com')

      await expect(apiFetch('/users')).rejects.toThrow('Validation failed')
    })

    it('should handle valibot coercion with pipe', async () => {
      const api = {
        '/config': {
          response: v.object({
            port: v.pipe(v.string(), v.transform(Number)),
            enabled: v.pipe(
              v.string(),
              v.transform((v) => v === 'true'),
            ),
          }),
        },
      }

      const responseData = {
        port: '8080',
        enabled: 'true',
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => responseData,
      } as Response)

      const apiFetch = createFetch(api, 'https://api.example.com')
      const result = await apiFetch('/config')

      expect(result).toEqual({
        port: 8080,
        enabled: true,
      })
    })

    it('should validate request query with valibot', async () => {
      const api = {
        '/users': {
          query: v.object({
            limit: v.number(),
            offset: v.number(),
          }),
          response: v.object({
            users: v.array(v.any()),
          }),
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
  })

  describe('ArkType', () => {
    it('should validate response with arktype schema', async () => {
      const api = {
        '/users': {
          response: type({
            users: type({
              id: 'number',
              name: 'string',
            }).array(),
          }),
        },
      }

      const responseData = {
        users: [
          { id: 1, name: 'John' },
          { id: 2, name: 'Jane' },
        ],
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => responseData,
      } as Response)

      const apiFetch = createFetch(api, 'https://api.example.com')
      const result = await apiFetch('/users')

      expect(result).toEqual(responseData)
    })

    it('should transform response data with arktype morph', async () => {
      const api = {
        '/users': {
          response: type({
            id: 'number',
            first_name: 'string',
            last_name: 'string',
            created_at: 'string',
          }).pipe((data) => ({
            id: data.id,
            fullName: `${data.first_name} ${data.last_name}`,
            createdAt: new Date(data.created_at),
          })),
        },
      }

      const responseData = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        created_at: '2024-01-01T00:00:00Z',
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => responseData,
      } as Response)

      const apiFetch = createFetch(api, 'https://api.example.com')
      const result = await apiFetch('/users')

      expect(result).toEqual({
        id: 1,
        fullName: 'John Doe',
        createdAt: new Date('2024-01-01T00:00:00Z'),
      })
    })

    it('should handle arktype default values', async () => {
      const api = {
        '/users': {
          response: type({
            id: 'number',
            name: 'string',
            role: 'string = "user"',
          }),
        },
      }

      const responseData = {
        id: 1,
        name: 'John',
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => responseData,
      } as Response)

      const apiFetch = createFetch(api, 'https://api.example.com')
      const result = await apiFetch('/users')

      expect(result).toEqual({
        id: 1,
        name: 'John',
        role: 'user',
      })
    })

    it('should throw validation error for invalid arktype schema', async () => {
      const api = {
        '/users': {
          response: type({
            id: 'number',
            name: 'string',
          }),
        },
      }

      const responseData = {
        id: 'not-a-number',
        name: 'John',
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => responseData,
      } as Response)

      const apiFetch = createFetch(api, 'https://api.example.com')

      await expect(apiFetch('/users')).rejects.toThrow('Validation failed')
    })

    it('should handle arktype number parsing', async () => {
      const api = {
        '/config': {
          response: type({
            port: 'string.numeric.parse',
          }),
        },
      }

      const responseData = {
        port: '8080',
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => responseData,
      } as Response)

      const apiFetch = createFetch(api, 'https://api.example.com')
      const result = await apiFetch('/config')

      expect(result).toEqual({
        port: 8080,
      })
    })

    it('should validate request body with arktype', async () => {
      const api = {
        '/users': {
          body: type({
            name: 'string',
            email: 'string.email',
          }),
          response: type({
            id: 'number',
            name: 'string',
            email: 'string',
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
        }),
      )
      expect(result).toEqual({ id: 1, name: 'John', email: 'john@example.com' })
    })
  })

  describe('Mixed Schema Libraries', () => {
    it('should work with different schemas for different endpoints', async () => {
      const api = {
        '/users': {
          response: z.object({
            id: z.number(),
            name: z.string(),
          }),
        },
        '/posts': {
          response: v.object({
            id: v.number(),
            title: v.string(),
          }),
        },
        '/comments': {
          response: type({
            id: 'number',
            text: 'string',
          }),
        },
      }

      // Test zod endpoint
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, name: 'John' }),
      } as Response)

      const apiFetch = createFetch(api, 'https://api.example.com')
      const user = await apiFetch('/users')
      expect(user).toEqual({ id: 1, name: 'John' })

      // Test valibot endpoint
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, title: 'Hello' }),
      } as Response)

      const post = await apiFetch('/posts')
      expect(post).toEqual({ id: 1, title: 'Hello' })

      // Test arktype endpoint
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, text: 'Nice post!' }),
      } as Response)

      const comment = await apiFetch('/comments')
      expect(comment).toEqual({ id: 1, text: 'Nice post!' })
    })
  })
})
