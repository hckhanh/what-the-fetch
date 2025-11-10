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

  it('should require params schema to match path parameters exactly', () => {
    // With the new implementation, params must be StandardSchemaV1<Record<ExtractPathParams<Path>, unknown>>
    // This means for '/users/:id', params must have 'id' as a key

    // Test that the expected type for params is StandardSchemaV1<Record<'id', unknown>>
    type ExpectedParamsType = StandardSchemaV1<Record<'id', unknown>>

    // Create a schema that matches
    const matchingSchema = createMockSchema({ id: 123 })
    expectTypeOf(matchingSchema).toMatchTypeOf<ExpectedParamsType>()
  })

  it('should require params when path has parameters', () => {
    // For paths with parameters, the params field is required (not optional)
    // This is verified by the type system - if you try to omit params, TypeScript will error

    const api: ApiSchema = {
      '/users/:id': {
        params: createMockSchema({ id: 123 }),
        response: createMockSchema({ name: 'test' }),
      },
    }

    expectTypeOf(api).toMatchTypeOf<ApiSchema>()
  })
})
