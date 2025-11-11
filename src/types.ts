/**
 * Type definitions for the what-the-fetch API client.
 *
 * @module
 */

import type { StandardSchemaV1 } from '@standard-schema/spec'

/**
 * Schema definition for an API endpoint.
 *
 * Maps API paths to their schema definitions, including optional schemas for
 * path parameters, query parameters, request body, and response.
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 *
 * const api: ApiSchema = {
 *   '/users/:id': {
 *     params: z.object({ id: z.number() }),
 *     query: z.object({ fields: z.string().optional() }),
 *     response: z.object({ id: z.number(), name: z.string() })
 *   }
 * };
 * ```
 */
export type ApiSchema = Record<
  string,
  {
    params?: StandardSchemaV1<Record<string, unknown>>
    query?: StandardSchemaV1<Record<string, unknown>>
    body?: StandardSchemaV1<Record<string, unknown>>
    response?: StandardSchemaV1<Record<string, unknown>>
  }
>

/**
 * Extract valid API paths from an API schema.
 *
 * @template Schemas - The API schema type
 */
export type ApiPath<Schemas extends ApiSchema> = keyof Schemas & string

/**
 * Extract the required fetch options for a specific API path.
 *
 * Automatically infers the correct types for params, query, and body based on
 * the schema definition for the given path.
 *
 * @template Schemas - The API schema type
 * @template Path - The specific API path
 */
export type FetchOptions<
  Schemas extends ApiSchema,
  Path extends ApiPath<Schemas>,
> = Schemas[Path] extends infer Schema
  ? Schema extends {
      params?: infer P
      query?: infer Q
      body?: infer B
    }
    ? (P extends StandardSchemaV1<infer Params> ? { params: Params } : {}) &
        (Q extends StandardSchemaV1<infer Query> ? { query: Query } : {}) &
        (B extends StandardSchemaV1<infer Body> ? { body: Body } : {})
    : never
  : never

/**
 * Extract the inferred data type for a specific option from an API schema path.
 *
 * @template Schemas - The API schema type
 * @template Path - The specific API path
 * @template Option - The schema option to extract (dynamic based on what's in the schema)
 *
 * @example
 * ```typescript
 * type UserParams = ApiData<typeof api, '/users/:id', 'params'>;
 * // { id: number }
 *
 * type UserResponse = ApiData<typeof api, '/users/:id', 'response'>;
 * // { id: number, name: string }
 * ```
 */
export type ApiData<
  Schemas extends ApiSchema,
  Path extends ApiPath<Schemas>,
  Option extends keyof Schemas[Path],
> = Schemas[Path] extends infer S
  ? S extends Record<Option, infer Schema>
    ? Schema extends StandardSchemaV1<infer Data>
      ? Data
      : unknown
    : undefined
  : unknown
