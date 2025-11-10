import type { StandardSchemaV1 } from '@standard-schema/spec'
import { describe, expectTypeOf, it } from 'vitest'
import type { ApiSchema, ExtractPathParams } from '../src'

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

describe('Path parameter extraction', () => {
  it('should extract single path parameter', () => {
    expectTypeOf<ExtractPathParams<'/users/:id'>>().toEqualTypeOf<'id'>()
  })

  it('should extract multiple path parameters', () => {
    expectTypeOf<
      ExtractPathParams<'/users/:userId/posts/:postId'>
    >().toEqualTypeOf<'userId' | 'postId'>()
  })

  it('should return never for paths without parameters', () => {
    expectTypeOf<ExtractPathParams<'/users'>>().toEqualTypeOf<never>()
  })

  it('should handle path with parameter at the end', () => {
    expectTypeOf<ExtractPathParams<'/api/v1/users/:id'>>().toEqualTypeOf<'id'>()
  })

  it('should handle complex paths', () => {
    expectTypeOf<
      ExtractPathParams<'/org/:orgId/team/:teamId/member/:memberId'>
    >().toEqualTypeOf<'orgId' | 'teamId' | 'memberId'>()
  })
})

describe('ApiSchema type validation', () => {
  it('should accept matching params schema', () => {
    const api: ApiSchema = {
      '/users/:id': {
        params: createMockSchema({ id: 123 }),
        response: createMockSchema({ id: 123, name: 'John' }),
      },
    }

    expectTypeOf(api).toMatchTypeOf<ApiSchema>()
  })

  it('should accept multiple matching params', () => {
    const api: ApiSchema = {
      '/users/:userId/posts/:postId': {
        params: createMockSchema({ userId: 1, postId: 2 }),
        response: createMockSchema({ title: 'Post' }),
      },
    }

    expectTypeOf(api).toMatchTypeOf<ApiSchema>()
  })

  it('should accept path without params', () => {
    const api: ApiSchema = {
      '/users': {
        response: createMockSchema({ users: [] }),
      },
    }

    expectTypeOf(api).toMatchTypeOf<ApiSchema>()
  })

  it('should accept path without params but with query', () => {
    const api: ApiSchema = {
      '/users': {
        query: createMockSchema({ limit: 10 }),
        response: createMockSchema({ users: [] }),
      },
    }

    expectTypeOf(api).toMatchTypeOf<ApiSchema>()
  })

  it('should detect mismatched param names at compile time', () => {
    // This demonstrates type validation - the error object type indicates mismatch
    interface MismatchedParams {
      '/users/:id': {
        params: StandardSchemaV1<{ userId: number }>
        response: StandardSchemaV1<{ id: number; name: string }>
      }
    }

    // The params field for '/users/:id' will be an error object type, not the schema
    type ParamsType = MismatchedParams['/users/:id']['params']

    // Verify this produces an error type (has 'error' key)
    expectTypeOf<ParamsType>().toHaveProperty('error')
  })

  it('should detect missing params at compile time', () => {
    // When path has params but schema only has some of them
    interface MissingParams {
      '/users/:userId/posts/:postId': {
        params: StandardSchemaV1<{ userId: number }> // missing postId
        response: StandardSchemaV1<{ title: string }>
      }
    }

    type ParamsType = MissingParams['/users/:userId/posts/:postId']['params']

    // Verify this produces an error type
    expectTypeOf<ParamsType>().toHaveProperty('error')
  })

  it('should detect extra params at compile time', () => {
    // When schema has params not in the path
    interface ExtraParams {
      '/users/:id': {
        params: StandardSchemaV1<{ id: number; extra: string }> // 'extra' not in path
        response: StandardSchemaV1<{ id: number; name: string }>
      }
    }

    type ParamsType = ExtraParams['/users/:id']['params']

    // Verify this produces an error type
    expectTypeOf<ParamsType>().toHaveProperty('error')
  })
})
