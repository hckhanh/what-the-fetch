import type { StandardSchemaV1 } from '@standard-schema/spec'
import { describe, expect, it } from 'vitest'
import {
  parseMethodFromPath,
  validateData,
  validateRequestData,
} from '../src/utils'

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

// Helper to create a mock Standard Schema with validation error
function createFailingSchema<T>(
  issues: Array<{ message: string }>,
): StandardSchemaV1<T> {
  return {
    '~standard': {
      version: 1,
      vendor: 'mock',
      validate: async () => ({
        issues,
      }),
    },
  }
}

describe('validateData', () => {
  it('should return data as-is when no schema is provided', async () => {
    const apiSchema = {}
    const data = { id: 123, name: 'John' }

    const result = await validateData(apiSchema, 'response', data)

    expect(result).toEqual(data)
  })

  it('should validate data successfully with valid schema', async () => {
    const apiSchema = {
      response: createMockSchema({ id: 123, name: 'John' }),
    }
    const data = { id: 123, name: 'John' }

    const result = await validateData(apiSchema, 'response', data)

    expect(result).toEqual(data)
  })

  it('should throw error when validation fails', async () => {
    const apiSchema = {
      response: createFailingSchema([{ message: 'Invalid data' }]),
    }
    const data = { id: 'invalid', name: 'John' }

    await expect(validateData(apiSchema, 'response', data)).rejects.toThrow(
      'Validation failed',
    )
  })

  it('should validate params option', async () => {
    const apiSchema = {
      params: createMockSchema({ id: 123 }),
    }
    const data = { id: 123 }

    const result = await validateData(apiSchema, 'params', data)

    expect(result).toEqual(data)
  })

  it('should validate query option', async () => {
    const apiSchema = {
      query: createMockSchema({ limit: 10, offset: 0 }),
    }
    const data = { limit: 10, offset: 0 }

    const result = await validateData(apiSchema, 'query', data)

    expect(result).toEqual(data)
  })

  it('should validate body option', async () => {
    const apiSchema = {
      body: createMockSchema({ name: 'John', email: 'john@example.com' }),
    }
    const data = { name: 'John', email: 'john@example.com' }

    const result = await validateData(apiSchema, 'body', data)

    expect(result).toEqual(data)
  })

  it('should include validation issues in error message', async () => {
    const issues = [
      { message: 'Invalid type', path: ['id'] },
      { message: 'Required field', path: ['email'] },
    ]
    const apiSchema = {
      response: createFailingSchema(issues),
    }

    await expect(validateData(apiSchema, 'response', {})).rejects.toThrow(
      JSON.stringify(issues),
    )
  })
})

describe('validateRequestData', () => {
  it('should validate params, query, and body concurrently', async () => {
    const apiSchema = {
      params: createMockSchema({ id: 123 }),
      query: createMockSchema({ limit: 10 }),
      body: createMockSchema({ name: 'John' }),
    }
    const options = {
      params: { id: 123 },
      query: { limit: 10 },
      body: { name: 'John' },
    }

    const result = await validateRequestData(apiSchema, '/users/:id', options)

    expect(result).toEqual([{ id: 123 }, { limit: 10 }, { name: 'John' }])
  })

  it('should handle undefined options', async () => {
    const apiSchema = {
      response: createMockSchema({ users: [] }),
    }

    const result = await validateRequestData(apiSchema, '/users', undefined)

    expect(result).toEqual([undefined, undefined, undefined])
  })

  it('should handle partial options', async () => {
    const apiSchema = {
      params: createMockSchema({ id: 123 }),
      query: createMockSchema({ limit: 10 }),
    }
    const options = {
      params: { id: 123 },
    }

    const result = await validateRequestData(apiSchema, '/users/:id', options)

    expect(result).toEqual([{ id: 123 }, undefined, undefined])
  })

  it('should throw error when parameterized path lacks params schema', async () => {
    const apiSchema = {
      response: createMockSchema({ id: 123 }),
    }

    await expect(
      validateRequestData(apiSchema, '/users/:id', { params: { id: 123 } }),
    ).rejects.toThrow(
      'Path contains parameters but no "params" schema is defined.',
    )
  })

  it('should throw error for multiple path parameters without schema', async () => {
    const apiSchema = {
      response: createMockSchema({ post: {} }),
    }

    await expect(
      validateRequestData(apiSchema, '/users/:userId/posts/:postId', {
        params: { userId: 1, postId: 2 },
      }),
    ).rejects.toThrow(
      'Path contains parameters but no "params" schema is defined.',
    )
  })

  it('should not throw error for non-parameterized paths', async () => {
    const apiSchema = {
      response: createMockSchema({ users: [] }),
    }

    const result = await validateRequestData(apiSchema, '/users', undefined)

    expect(result).toEqual([undefined, undefined, undefined])
  })

  it('should validate parameterized path with params schema', async () => {
    const apiSchema = {
      params: createMockSchema({ id: 123 }),
      response: createMockSchema({ id: 123, name: 'John' }),
    }

    const result = await validateRequestData(apiSchema, '/users/:id', {
      params: { id: 123 },
    })

    expect(result[0]).toEqual({ id: 123 })
  })

  it('should throw validation error for invalid params', async () => {
    const apiSchema = {
      params: createFailingSchema([{ message: 'Invalid id' }]),
      response: createMockSchema({ id: 123 }),
    }

    await expect(
      validateRequestData(apiSchema, '/users/:id', { params: { id: 'abc' } }),
    ).rejects.toThrow('Validation failed')
  })

  it('should throw validation error for invalid query', async () => {
    const apiSchema = {
      query: createFailingSchema([{ message: 'Invalid limit' }]),
      response: createMockSchema({ users: [] }),
    }

    await expect(
      validateRequestData(apiSchema, '/users', { query: { limit: 'abc' } }),
    ).rejects.toThrow('Validation failed')
  })

  it('should throw validation error for invalid body', async () => {
    const apiSchema = {
      body: createFailingSchema([{ message: 'Invalid name' }]),
      response: createMockSchema({ id: 1 }),
    }

    await expect(
      validateRequestData(apiSchema, '/users', { body: { name: 123 } }),
    ).rejects.toThrow('Validation failed')
  })

  it('should detect path parameters with various formats', async () => {
    const testCases = [
      '/users/:id',
      '/users/:userId/posts/:postId',
      '/api/:version/users/:id',
      '/:resource/:id',
    ]

    for (const path of testCases) {
      const apiSchema = {
        response: createMockSchema({}),
      }

      await expect(
        validateRequestData(apiSchema, path, undefined),
      ).rejects.toThrow(
        'Path contains parameters but no "params" schema is defined.',
      )
    }
  })

  it('should not detect false positives in paths', async () => {
    const testCases = ['/users/123', '/api/v1/users', '/posts']

    for (const path of testCases) {
      const apiSchema = {
        response: createMockSchema({}),
      }

      const result = await validateRequestData(apiSchema, path, undefined)
      expect(result).toBeDefined()
    }
  })

  it('should handle method-prefixed paths correctly', async () => {
    const apiSchema = {
      params: createMockSchema({ id: 123 }),
      response: createMockSchema({ id: 123, name: 'John' }),
    }

    const result = await validateRequestData(apiSchema, '@get/users/:id', {
      params: { id: 123 },
    })

    expect(result[0]).toEqual({ id: 123 })
  })

  it('should detect params in method-prefixed paths', async () => {
    const apiSchema = {
      response: createMockSchema({ id: 123 }),
    }

    await expect(
      validateRequestData(apiSchema, '@post/users/:id', {
        params: { id: 123 },
      }),
    ).rejects.toThrow(
      'Path contains parameters but no "params" schema is defined.',
    )
  })
})

describe('parseMethodFromPath', () => {
  it('should parse GET method from @get prefix', () => {
    const [method, path] = parseMethodFromPath('@get/users')
    expect(method).toBe('GET')
    expect(path).toBe('/users')
  })

  it('should parse POST method from @post prefix', () => {
    const [method, path] = parseMethodFromPath('@post/users')
    expect(method).toBe('POST')
    expect(path).toBe('/users')
  })

  it('should parse PUT method from @put prefix', () => {
    const [method, path] = parseMethodFromPath('@put/users/:id')
    expect(method).toBe('PUT')
    expect(path).toBe('/users/:id')
  })

  it('should parse DELETE method from @delete prefix', () => {
    const [method, path] = parseMethodFromPath('@delete/users/:id')
    expect(method).toBe('DELETE')
    expect(path).toBe('/users/:id')
  })

  it('should parse PATCH method from @patch prefix', () => {
    const [method, path] = parseMethodFromPath('@patch/users/:id')
    expect(method).toBe('PATCH')
    expect(path).toBe('/users/:id')
  })

  it('should return undefined method for paths without prefix', () => {
    const [method, path] = parseMethodFromPath('/users')
    expect(method).toBeUndefined()
    expect(path).toBe('/users')
  })

  it('should handle @method prefix without path', () => {
    const [method, path] = parseMethodFromPath('@get')
    expect(method).toBe('GET')
    expect(path).toBe('/')
  })

  it('should convert method to uppercase', () => {
    const [method, path] = parseMethodFromPath('@GeT/users')
    expect(method).toBe('GET')
    expect(path).toBe('/users')
  })

  it('should handle complex paths with parameters', () => {
    const [method, path] = parseMethodFromPath('@post/users/:id/posts/:postId')
    expect(method).toBe('POST')
    expect(path).toBe('/users/:id/posts/:postId')
  })

  it('should handle paths with query-like strings', () => {
    const [method, path] = parseMethodFromPath('@get/search?q=test')
    expect(method).toBe('GET')
    expect(path).toBe('/search?q=test')
  })

  it('should handle various HTTP methods', () => {
    const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head']
    for (const m of methods) {
      const [method, path] = parseMethodFromPath(`@${m}/api`)
      expect(method).toBe(m.toUpperCase())
      expect(path).toBe('/api')
    }
  })

  it('should not parse invalid prefixes', () => {
    const [method, path] = parseMethodFromPath('get/users')
    expect(method).toBeUndefined()
    expect(path).toBe('get/users')
  })

  it('should handle root path without method', () => {
    const [method, path] = parseMethodFromPath('/')
    expect(method).toBeUndefined()
    expect(path).toBe('/')
  })
})
